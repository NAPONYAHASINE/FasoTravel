# 🔍 AUDIT COMPLET : DONNÉES "À LA DURE" vs LOGIQUE MÉTIER

**Date**: 06/01/2025  
**Objectif**: Identifier toutes les données hardcodées et les remplacer par des logiques métier correctes basées sur les relations entre tables.

---

## ❌ PROBLÈMES IDENTIFIÉS

### 1️⃣ **REVIEWS (Avis Clients)**

#### ❌ Problème actuel :
```typescript
// Dans DataContext.tsx - ligne ~737
date: new Date(trip.arrivalTime).toISOString(), // ❌ Utilise arrivalTime
```

#### ✅ Solution correcte :
```typescript
// L'avis doit être associé à la DATE + HEURE de départ du voyage
date: new Date(trip.departureTime).toISOString(), // ✅ Utilise departureTime

// Données complètes d'un avis
{
  id: 'review_1',
  tripId: 'trip_123', // ✅ Relation avec le voyage
  departure: trip.departure, // ✅ Déduit du voyage
  arrival: trip.arrival, // ✅ Déduit du voyage
  
  // Date/heure = celle du DÉPART du voyage
  date: trip.departureTime, // ✅ PAS arrivalTime !
  
  passengerName: 'Client #A3B7', // ✅ Anonymisé
  rating: 4,
  comment: 'Bon voyage',
  status: 'published'
}
```

#### 📍 Affichage dans l'interface :
```typescript
// Dans ReviewsPage.tsx
const enrichedReviews = reviews.map(review => {
  const trip = trips.find(t => t.id === review.tripId);
  return {
    ...review,
    departureTime: trip?.departureTime, // ✅ Pour affichage
    busNumber: trip?.busNumber,
    route: `${review.departure} - ${review.arrival}`
  };
});

// Affichage
Voyage du {new Date(review.departureTime).toLocaleString('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
```

---

### 2️⃣ **INCIDENTS**

#### ❌ Problème actuel :
```typescript
// DataContext.tsx - Données mockées initialisées avec des IDs hardcodés
{
  id: 'incident_1',
  tripId: trips[0]?.id || 'trip_1', // ❌ Fallback hardcodé
  reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  // ...
}
```

#### ✅ Solution correcte :
```typescript
// Les incidents doivent être générés dynamiquement
const generateIncidents = () => {
  const generatedIncidents: Incident[] = [];
  
  // Prendre des trips réels (departed, en route)
  const activeTrips = trips.filter(t => 
    t.status === 'departed' || t.status === 'boarding'
  );
  
  activeTrips.forEach(trip => {
    if (Math.random() > 0.7) { // 30% de chance d'incident
      const incidentTypes: Array<Incident['type']> = ['delay', 'breakdown', 'accident', 'other'];
      const type = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      
      generatedIncidents.push({
        id: generateId('incident'),
        tripId: trip.id, // ✅ Lié à un vrai trip
        type,
        title: getIncidentTitle(type),
        description: getIncidentDescription(type),
        severity: getIncidentSeverity(type),
        status: 'open',
        validationStatus: 'pending',
        reportedBy: `Passager #${generateId('').substring(0, 4).toUpperCase()}`,
        reportedAt: new Date(
          new Date(trip.departureTime).getTime() + 
          Math.random() * 60 * 60 * 1000 // Entre le départ et +1h
        ).toISOString(),
        gareId: trip.gareId,
        gareName: trip.gareName
      });
    }
  });
  
  return generatedIncidents;
};
```

---

### 3️⃣ **TICKETS - Relation avec TRIPS**

#### ❌ Problème actuel :
```typescript
// DataContext.tsx - ligne ~670
{
  id: ticketId,
  tripId: trip.id,
  passengerName: passengerNames[Math.floor(Math.random() * passengerNames.length)],
  passengerPhone: `+226 ${Math.floor(Math.random() * 90000000 + 10000000)}`,
  seatNumber: `${Math.floor(Math.random() * trip.totalSeats) + 1}`,
  price: trip.price,
  // ❌ PROBLÈME: Date de voyage hardcodée
  travelDate: purchaseDate.toISOString(),
  // ...
}
```

#### ✅ Solution correcte :
```typescript
// La date de voyage = departureTime du trip, PAS la date d'achat !
{
  id: ticketId,
  tripId: trip.id, // ✅ Relation
  passengerName: passengerNames[Math.floor(Math.random() * passengerNames.length)],
  passengerPhone: `+226 ${Math.floor(Math.random() * 90000000 + 10000000)}`,
  seatNumber: `${Math.floor(Math.random() * trip.totalSeats) + 1}`,
  price: trip.price,
  
  // ✅ Date de voyage = date de départ du trip
  travelDate: trip.departureTime, // PAS purchaseDate !
  
  // Date d'achat = quand le billet a été acheté (avant le voyage)
  purchaseDate: new Date(
    new Date(trip.departureTime).getTime() - 
    Math.random() * 24 * 60 * 60 * 1000 // Entre -24h et le départ
  ).toISOString(),
  
  departure: trip.departure,
  arrival: trip.arrival,
  status: getTicketStatus(trip),
  salesChannel: Math.random() > 0.3 ? 'counter' : 'mobile_app',
  // ...
}
```

---

### 4️⃣ **TRANSACTIONS - Cohérence avec TICKETS**

#### ❌ Problème actuel :
```typescript
// DataContext.tsx - ligne ~714
{
  id: generateId('trans'),
  type: 'sale',
  amount: trip.price, // ❌ Utilise trip.price directement
  method: paymentMethod,
  description: `Vente billet ${trip.departure} → ${trip.arrival}`,
  ticketId: ticketId,
  timestamp: purchaseDate.toISOString(), // ❌ Date d'achat = date du trip
  // ...
}
```

#### ✅ Solution correcte :
```typescript
// Transaction doit être cohérente avec le ticket
const ticket = generatedTickets.find(t => t.id === ticketId);

{
  id: generateId('trans'),
  type: 'sale',
  amount: ticket.price, // ✅ Prix du ticket (peut inclure tarification variable)
  method: paymentMethod,
  description: `Vente billet ${ticket.departure} → ${ticket.arrival}`,
  ticketId: ticket.id,
  
  // ✅ Date de transaction = date d'achat du ticket
  timestamp: ticket.purchaseDate, // PAS trip.departureTime !
  
  cashierId: cashier.id,
  cashierName: cashier.name,
  status: 'completed'
}
```

---

### 5️⃣ **TRIPS - Génération depuis SCHEDULES**

#### ❌ Problème actuel :
```typescript
// DataContext.tsx - ligne ~530
const generateTripsFromTemplates = (daysAhead: number = 7) => {
  const generatedTrips: Trip[] = [];
  const now = new Date();
  
  schedules.forEach(schedule => {
    // ✅ CORRECT: Génère des trips depuis les schedules
    for (let day = 0; day < daysAhead; day++) {
      const tripDate = new Date(now);
      tripDate.setDate(now.getDate() + day);
      
      schedule.departureTimes.forEach(time => {
        const [hours, minutes] = time.split(':');
        const departureTime = new Date(tripDate);
        departureTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // ✅ Calcul durée du voyage
        const arrivalTime = new Date(departureTime);
        arrivalTime.setMinutes(arrivalTime.getMinutes() + schedule.duration);
        
        // ✅ Détermination du statut basé sur l'heure actuelle
        const status = getTripStatus(departureTime, arrivalTime, now);
        
        generatedTrips.push({
          id: generateId('trip'),
          routeId: schedule.routeId,
          departure: schedule.departure,
          arrival: schedule.arrival,
          departureTime: departureTime.toISOString(), // ✅ Calculé
          arrivalTime: arrivalTime.toISOString(), // ✅ Calculé
          busNumber: `BF-${Math.floor(Math.random() * 9000 + 1000)}`,
          totalSeats: schedule.vehicleCapacity,
          availableSeats: Math.floor(Math.random() * schedule.vehicleCapacity),
          price: schedule.basePrice,
          status,
          gareId: schedule.departureGareId,
          gareName: schedule.departureGareName
        });
      });
    }
  });
  
  setTrips([...trips, ...generatedTrips]);
};
```

#### ✅ C'est déjà correct ! Mais attention :
- ❌ Ne pas hardcoder `trips[0]` dans d'autres fichiers
- ✅ Toujours utiliser `trips.find()` ou `trips.filter()`

---

### 6️⃣ **STATS DASHBOARD - Calculs dynamiques**

#### ❌ Problème actuel :
```typescript
// Dans DashboardHome.tsx - Stats potentiellement hardcodées
const stats = {
  totalRevenue: 2450000, // ❌ Hardcodé
  totalTrips: 145, // ❌ Hardcodé
  occupancyRate: 78, // ❌ Hardcodé
  activeVehicles: 12 // ❌ Hardcodé
};
```

#### ✅ Solution correcte :
```typescript
// Calculer depuis les vraies données
const stats = useMemo(() => {
  // Revenue = somme des transactions de vente
  const totalRevenue = cashTransactions
    .filter(t => t.type === 'sale' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Trips = nombre de voyages (filtrés par période si besoin)
  const totalTrips = trips.length;
  
  // Taux d'occupation moyen
  const occupancyRate = trips.length > 0
    ? trips.reduce((sum, t) => {
        const occupied = t.totalSeats - t.availableSeats;
        return sum + (occupied / t.totalSeats * 100);
      }, 0) / trips.length
    : 0;
  
  // Véhicules actifs = nombre de bus uniques en service aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeVehicles = new Set(
    trips.filter(t => {
      const tripDate = new Date(t.departureTime);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime() && 
             (t.status === 'boarding' || t.status === 'departed');
    }).map(t => t.busNumber)
  ).size;
  
  return {
    totalRevenue: Math.round(totalRevenue),
    totalTrips,
    occupancyRate: Math.round(occupancyRate),
    activeVehicles
  };
}, [trips, cashTransactions]);
```

---

### 7️⃣ **PRICING - Tarification variable**

#### ❌ Problème actuel :
```typescript
// Le prix du ticket est toujours = trip.price
price: trip.price // ❌ Pas de tarification dynamique
```

#### ✅ Solution correcte :
```typescript
// Fonction de calcul du prix avec tarification variable
const calculateTicketPrice = (trip: Trip, purchaseDate: Date): number => {
  const departureDate = new Date(trip.departureTime);
  const daysUntilDeparture = Math.ceil(
    (departureDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let basePrice = trip.price;
  
  // Tarification dynamique basée sur la disponibilité
  const occupancyRate = (trip.totalSeats - trip.availableSeats) / trip.totalSeats;
  
  if (occupancyRate > 0.8) {
    // Plus de 80% occupé = +20%
    basePrice *= 1.2;
  } else if (occupancyRate > 0.6) {
    // 60-80% occupé = +10%
    basePrice *= 1.1;
  }
  
  // Early bird discount
  if (daysUntilDeparture >= 7) {
    basePrice *= 0.9; // -10%
  }
  
  // Last minute premium
  if (daysUntilDeparture === 0) {
    basePrice *= 1.15; // +15%
  }
  
  return Math.round(basePrice);
};

// Utilisation
const ticketPrice = calculateTicketPrice(trip, purchaseDate);
```

---

### 8️⃣ **SEAT SELECTION - Gestion des sièges**

#### ❌ Problème actuel :
```typescript
// Génération aléatoire du numéro de siège
seatNumber: `${Math.floor(Math.random() * trip.totalSeats) + 1}` // ❌ Peut créer des doublons
```

#### ✅ Solution correcte :
```typescript
// Fonction pour obtenir les sièges disponibles
const getAvailableSeats = (tripId: string): string[] => {
  const trip = trips.find(t => t.id === tripId);
  if (!trip) return [];
  
  // Sièges déjà réservés
  const bookedSeats = tickets
    .filter(t => t.tripId === tripId && t.status !== 'cancelled')
    .map(t => t.seatNumber);
  
  // Tous les sièges du véhicule
  const totalSeats = Array.from(
    { length: trip.totalSeats }, 
    (_, i) => `${i + 1}`
  );
  
  // Sièges disponibles = total - réservés
  return totalSeats.filter(seat => !bookedSeats.includes(seat));
};

// Utilisation lors de la vente
const availableSeats = getAvailableSeats(trip.id);
if (availableSeats.length === 0) {
  throw new Error('Aucun siège disponible');
}

// Sélection intelligente du siège
const selectedSeat = availableSeats[0]; // Premier disponible

// OU permettre au client de choisir
const selectedSeat = customerChoice || availableSeats[0];
```

---

### 9️⃣ **SUPPORT TICKETS - Messages**

#### ❌ Problème actuel :
```typescript
// DataContext.tsx - Messages avec userId hardcodé
messages: [
  {
    id: generateId('msg'),
    userId: 'user_1', // ❌ Hardcodé
    userName: 'Admin FasoTravel',
    message: 'Nous avons bien reçu votre demande...',
    timestamp: new Date().toISOString(),
    isFromAdmin: true
  }
]
```

#### ✅ Solution correcte :
```typescript
// Fonction pour ajouter un message
const addSupportMessage = (ticketId: string, message: string) => {
  const ticket = supportTickets.find(t => t.id === ticketId);
  if (!ticket) return;
  
  const newMessage = {
    id: generateId('msg'),
    userId: user!.id, // ✅ Utilisateur actuel
    userName: user!.name, // ✅ Nom réel
    message,
    timestamp: new Date().toISOString(),
    isFromAdmin: user!.role === 'admin' // ✅ Détecté automatiquement
  };
  
  const updatedTicket = {
    ...ticket,
    messages: [...ticket.messages, newMessage],
    updatedAt: new Date().toISOString()
  };
  
  setSupportTickets(
    supportTickets.map(t => t.id === ticketId ? updatedTicket : t)
  );
};
```

---

### 🔟 **ANALYTICS - Données temporelles**

#### ❌ Problème actuel :
```typescript
// Graphiques avec données hardcodées
const chartData = [
  { month: 'Jan', revenue: 245000 }, // ❌ Hardcodé
  { month: 'Feb', revenue: 312000 },
  // ...
];
```

#### ✅ Solution correcte :
```typescript
// Calcul dynamique depuis les transactions
const generateRevenueChart = (transactions: CashTransaction[]) => {
  const now = new Date();
  const months = [];
  
  // Derniers 6 mois
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
    
    // Calculer le revenu du mois
    const monthRevenue = transactions
      .filter(t => {
        const tDate = new Date(t.timestamp);
        return tDate.getMonth() === date.getMonth() &&
               tDate.getFullYear() === date.getFullYear() &&
               t.type === 'sale' &&
               t.status === 'completed';
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    months.push({
      month: monthName,
      revenue: monthRevenue
    });
  }
  
  return months;
};

const chartData = useMemo(
  () => generateRevenueChart(cashTransactions),
  [cashTransactions]
);
```

---

## 📋 CHECKLIST DES CORRECTIONS À FAIRE

### Priorité CRITIQUE (P0) :
- [ ] **Reviews** : Utiliser `trip.departureTime` au lieu de `trip.arrivalTime`
- [ ] **Tickets** : `travelDate = trip.departureTime`, `purchaseDate` séparé
- [ ] **Incidents** : Générer dynamiquement depuis les trips actifs
- [ ] **Transactions** : Cohérence avec `ticket.purchaseDate` et `ticket.price`

### Priorité HAUTE (P1) :
- [ ] **Stats Dashboard** : Calculer depuis les vraies données
- [ ] **Seat Selection** : Éviter les doublons de sièges
- [ ] **Pricing** : Implémenter la tarification variable
- [ ] **Support Messages** : Utiliser le user actuel

### Priorité MOYENNE (P2) :
- [ ] **Analytics** : Générer les graphiques depuis les transactions réelles
- [ ] **Reviews** : Enrichissement systématique avec trip data
- [ ] **Incidents** : Enrichissement systématique avec trip data

### Optimisations (P3) :
- [ ] Ajouter des indexes pour les lookups fréquents
- [ ] Mémoïser les calculs lourds
- [ ] Paginer les grandes listes

---

## 🎯 ARCHITECTURE CIBLE : RELATIONS ENTRE TABLES

```
┌─────────────┐
│  SCHEDULES  │ (Templates d'horaires)
└──────┬──────┘
       │ generates
       ▼
┌─────────────┐
│    TRIPS    │ (Voyages planifiés)
│ - id        │
│ - routeId   │
│ - departure │
│ - arrival   │
│ - departureTime ← ✅ SOURCE DE VÉRITÉ
│ - arrivalTime   │
│ - price     │
│ - status    │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│   TICKETS   │  │  INCIDENTS  │
│ - id        │  │ - id        │
│ - tripId    ─┼─→│ - tripId    │
│ - price     │  │ - type      │
│ - travelDate│  │ - reportedAt│
│   = trip.   │  │   (> trip.  │
│   departure │  │   departure)│
│   Time      │  │ - validated │
│ - purchaseD │  │   By        │
│   ate       │  └─────────────┘
│   (< travel │
│   Date)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ TRANSACTION │
│ - id        │
│ - ticketId  │
│ - amount    │
│   = ticket. │
│   price     │
│ - timestamp │
│   = ticket. │
│   purchase  │
│   Date      │
└─────────────┘

       ┌──────┴──────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│   REVIEWS   │  │  INCIDENTS  │
│ - id        │  │ - id        │
│ - tripId    │  │ - tripId    │
│ - date      │  │ - reportedAt│
│   = trip.   │  └─────────────┘
│   departure │
│   Time      │
└─────────────┘
```

---

## 🚀 PLAN D'ACTION

### Phase 1 : Corrections critiques (P0)
1. Corriger Reviews : `date = trip.departureTime`
2. Corriger Tickets : séparer `travelDate` et `purchaseDate`
3. Générer Incidents dynamiquement
4. Synchroniser Transactions avec Tickets

### Phase 2 : Enrichissement (P1)
1. Implémenter calculs de stats dynamiques
2. Ajouter tarification variable
3. Gestion intelligente des sièges
4. Corriger Support Messages

### Phase 3 : Optimisation (P2-P3)
1. Analytics dynamiques
2. Mémoïsation des calculs
3. Performance et pagination

---

## ⚠️ RÈGLES D'OR À RESPECTER

1. **JAMAIS de dates hardcodées** : Toujours calculer depuis `trip.departureTime`
2. **TOUJOURS vérifier les relations** : `tripId` → lookup du trip
3. **Enrichir systématiquement** : Ajouter les données du trip aux entités liées
4. **Calculer les stats** : Ne jamais hardcoder des chiffres
5. **Valider la cohérence** : `purchaseDate < travelDate < reviewDate`

---

**Status**: 🔴 EN ATTENTE DE CORRECTIONS  
**Priorité**: CRITIQUE  
**Impact**: Architecture complète de l'application
