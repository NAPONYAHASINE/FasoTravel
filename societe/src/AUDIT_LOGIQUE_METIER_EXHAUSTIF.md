# 🔍 AUDIT LOGIQUE MÉTIER EXHAUSTIF

**Date :** 2026-01-02  
**Scope :** TOUTES les logiques métier de l'application  
**Objectif :** Identifier TOUS les bugs et incohérences

---

## 📋 TABLE DES MATIÈRES

1. [Vente de billets](#1-vente-de-billets)
2. [Calcul de disponibilité](#2-calcul-de-disponibilité)
3. [Génération de trips](#3-génération-de-trips)
4. [Remboursements](#4-remboursements)
5. [Gestion de caisse](#5-gestion-de-caisse)
6. [Analytics](#6-analytics)
7. [Validation de tickets](#7-validation-de-tickets)
8. [Reviews](#8-reviews)
9. [Stories](#9-stories)
10. [Synchronisation des états](#10-synchronisation-des-états)

---

## 🔴 1. VENTE DE BILLETS

### ❌ PROBLÈME CRITIQUE : Multi-passagers non géré

**Fichier :** `/pages/caissier/TicketSalePage.tsx`

#### Comportement actuel (INCORRECT)
```typescript
// Sélection de 3 sièges : A1, A2, A3
selectedSeats = ['A1', 'A2', 'A3']

// UN SEUL formulaire
<Input value={customerName} />     // "Mamadou Traoré"
<Input value={customerPhone} />    // "+226 70 12 34 56"

// Création de 3 tickets AVEC LE MÊME NOM
for (const seat of selectedSeats) {
  addTicket({
    passengerName: customerName,    // ❌ MÊME NOM
    passengerPhone: customerPhone,  // ❌ MÊME TÉLÉPHONE
    seatNumber: seat
  });
}

// RÉSULTAT : 3 billets pour "Mamadou Traoré"
```

#### Comportement attendu (CORRECT)
```typescript
// Sélection de 3 sièges : A1, A2, A3
selectedSeats = ['A1', 'A2', 'A3']

// TROIS formulaires (un par siège)
passengers = [
  { seat: 'A1', name: 'Mamadou Traoré', phone: '+226 70 12 34 56' },
  { seat: 'A2', name: 'Fatou Sawadogo', phone: '+226 71 23 45 67' },
  { seat: 'A3', name: 'Ibrahim Ouédraogo', phone: '+226 72 34 56 78' }
]

// Création de 3 billets AVEC DES NOMS DIFFÉRENTS
passengers.forEach(passenger => {
  addTicket({
    passengerName: passenger.name,
    passengerPhone: passenger.phone,
    seatNumber: passenger.seat
  });
});
```

#### Scénario problématique
```
👤 Client : "Je veux acheter 4 billets pour ma famille"
🎫 Caissier : Sélectionne A1, A2, A3, A4
📝 Caissier : Entre "Kaboré Jean" une seule fois
✅ Validation

❌ RÉSULTAT : 4 billets au nom de "Kaboré Jean"
❌ PROBLÈME : Impossible de savoir qui occupe A2, A3, A4
❌ IMPACT : Contrôle impossible, litiges, confusion
```

#### Solution requise
1. **Interface multi-passagers**
   - Après sélection sièges → Formulaire dynamique
   - Autant de champs que de sièges sélectionnés
   - Validation : tous les champs remplis

2. **Validation**
   - Vérifier que chaque siège a un passager
   - Vérifier format téléphone
   - Permettre numéro identique (famille) mais nom différent

3. **UI/UX**
   - Liste visuelle : A1 → Mamadou, A2 → Fatou
   - Copier coordonnées (cas famille)
   - Récapitulatif clair avant paiement

---

## 🔴 2. CALCUL DE DISPONIBILITÉ

### ❌ PROBLÈME : Mise à jour incohérente des places disponibles

**Fichier :** `/contexts/DataContext.tsx`

#### Comportement actuel (INCORRECT)
```typescript
// Vente de 3 billets
addTicket(ticket1); // tripId: 'trip_1', seat: 'A1'
addTicket(ticket2); // tripId: 'trip_1', seat: 'A2'
addTicket(ticket3); // tripId: 'trip_1', seat: 'A3'

// ❌ availableSeats PAS mis à jour automatiquement
// Reste 45 alors qu'il devrait être 42

// Incohérence :
trip.totalSeats = 45
trip.availableSeats = 45  // ❌ FAUX
ticketsSold = 3           // ✅ VRAI
```

#### Comportement attendu (CORRECT)
```typescript
// Après chaque vente
addTicket({ tripId: 'trip_1', seat: 'A1' });

// ✅ Recalculer automatiquement
const soldSeats = tickets.filter(t => 
  t.tripId === 'trip_1' && 
  (t.status === 'valid' || t.status === 'used')
).length;

updateTrip('trip_1', {
  availableSeats: trip.totalSeats - soldSeats
});
```

#### Impact
- ❌ Affichage "45 places" alors qu'il en reste 42
- ❌ Risque de survente (vendre plus que la capacité)
- ❌ Statistiques fausses (occupation réelle)

---

## 🔴 3. GÉNÉRATION DE TRIPS

### ❌ PROBLÈME : Prix non recalculé avec les règles

**Fichier :** `/contexts/DataContext.tsx` - fonction `generateTripsFromTemplates`

#### Comportement actuel (INCORRECT)
```typescript
const generateTripsFromTemplates = (daysAhead = 7) => {
  scheduleTemplates.forEach(template => {
    const route = routes.find(r => r.id === template.routeId);
    
    // ❌ Prix = basePrice fixe
    const newTrip = {
      price: route.basePrice,  // Toujours 5000 FCFA
      // ...
    };
  });
};
```

#### Comportement attendu (CORRECT)
```typescript
import { calculatePriceWithRules } from '../utils/pricingCalculator';

const generateTripsFromTemplates = (daysAhead = 7) => {
  scheduleTemplates.forEach(template => {
    const route = routes.find(r => r.id === template.routeId);
    
    // Date de départ précise
    const departureDate = new Date(date);
    departureDate.setHours(hours, minutes, 0, 0);
    
    // ✅ Calculer prix avec règles
    const finalPrice = calculatePriceWithRules(
      route.basePrice,
      route.id,
      departureDate.toISOString(),
      pricingRules
    );
    
    const newTrip = {
      price: finalPrice,  // 4000 FCFA si promo -20%
      // ...
    };
  });
};
```

#### Scénario problématique
```
📋 Manager crée règle : "-20% tous les dimanches"
⏰ Système génère trips pour dimanche prochain
❌ Prix généré : 5000 FCFA (sans réduction)
✅ Prix attendu : 4000 FCFA (avec réduction)

🎫 Client voit 5000 FCFA sur l'app → Achète pas
💰 Perte de revenu potentiel
```

---

## 🔴 4. REMBOURSEMENTS

### ❌ PROBLÈME MULTIPLE : Gestion caisse incorrecte

**Fichier :** `/contexts/DataContext.tsx` - fonction `refundTicket`

#### Comportement actuel (INCORRECT)
```typescript
const refundTicket = (id: string) => {
  setTickets(tickets.map(t => 
    t.id === id 
      ? { ...t, status: 'refunded' }  // ❌ C'est tout
      : t
  ));
};
```

#### Problèmes identifiés

**1. Pas de transaction de caisse**
```typescript
// ❌ Billet remboursé mais pas d'argent sorti
ticket.status = 'refunded'
ticket.price = 5000 FCFA

// Mais aucune ligne dans cashTransactions
// Le caissier doit rendre 5000 FCFA → Où est l'enregistrement ?
```

**2. Pas de mise à jour de disponibilité**
```typescript
// ❌ Siège A5 libéré mais pas disponible
ticket.status = 'refunded'  // A5 n'est plus vendu
trip.availableSeats = 40    // Devrait passer à 41 !
```

**3. Pas de restriction temporelle**
```typescript
// ❌ Peut rembourser 5 minutes avant départ
const now = new Date();
const departure = new Date(ticket.departureTime);
const timeDiff = departure - now;

// Aucune validation → Problèmes opérationnels
```

#### Comportement attendu (CORRECT)
```typescript
const refundTicket = (id: string, userId: string, userName: string) => {
  const ticket = tickets.find(t => t.id === id);
  
  // 1. Validation temporelle
  const now = new Date();
  const departure = new Date(ticket.departureTime);
  const hoursBeforeDeparture = (departure - now) / (1000 * 60 * 60);
  
  if (hoursBeforeDeparture < 2) {
    throw new Error('Remboursement impossible à moins de 2h du départ');
  }
  
  // 2. Calculer montant (avec pénalité éventuelle)
  const refundAmount = ticket.price * 0.9; // 10% de frais
  
  // 3. Créer transaction de remboursement
  addCashTransaction({
    type: 'refund',
    amount: -refundAmount,  // Sortie d'argent
    method: ticket.paymentMethod,
    description: `Remboursement billet ${ticket.seatNumber} - ${ticket.departure} → ${ticket.arrival}`,
    ticketId: ticket.id,
    cashierId: userId,
    cashierName: userName,
    timestamp: new Date().toISOString(),
    status: 'completed'
  });
  
  // 4. Changer statut ticket
  setTickets(tickets.map(t => 
    t.id === id ? { ...t, status: 'refunded' } : t
  ));
  
  // 5. Libérer le siège
  const trip = trips.find(tr => tr.id === ticket.tripId);
  updateTrip(trip.id, {
    availableSeats: trip.availableSeats + 1
  });
};
```

---

## 🔴 5. GESTION DE CAISSE

### ❌ PROBLÈME : Solde de caisse non calculé

**Fichier :** `/pages/caissier/CashManagementPage.tsx`

#### Comportement actuel (INCORRECT)
```typescript
// ❌ Solde calculé UNIQUEMENT sur transactions affichées
const currentBalance = filteredTransactions.reduce((sum, t) => {
  if (t.type === 'sale' || t.type === 'deposit') {
    return sum + t.amount;
  } else {
    return sum - t.amount;
  }
}, 0);

// PROBLÈME : Si on filtre par date, le solde change !
```

#### Scénario problématique
```
📅 01/01 : Vente 50 000 FCFA
📅 02/01 : Vente 30 000 FCFA
📅 03/01 : Retrait 20 000 FCFA

Solde réel = +60 000 FCFA

🔍 Filtre : "Aujourd'hui" (03/01)
❌ Affiche : -20 000 FCFA (que le retrait)
✅ Devrait afficher : 60 000 FCFA (solde global)
                      avec détail : -20 000 aujourd'hui
```

#### Comportement attendu (CORRECT)
```typescript
// Solde TOTAL (toutes transactions)
const totalBalance = cashTransactions
  .filter(t => t.cashierId === user.id)
  .reduce((sum, t) => {
    if (t.type === 'sale' || t.type === 'deposit') {
      return sum + t.amount;
    } else {
      return sum - t.amount;
    }
  }, 0);

// Transactions période filtrée (pour affichage)
const periodTransactions = filteredTransactions;

// Mouvement période
const periodBalance = periodTransactions.reduce(...);
```

---

## 🔴 6. ANALYTICS

### ❌ PROBLÈME MULTIPLE : Calculs incorrects

**Fichier :** `/contexts/DataContext.tsx` - fonction `getAnalytics`

#### Problème 1 : Taux d'occupation faux
```typescript
// ❌ Calcul actuel
const totalSeats = trips.reduce((sum, t) => sum + t.totalSeats, 0);
const occupiedSeats = trips.reduce((sum, t) => 
  sum + (t.totalSeats - t.availableSeats), 0
);
const averageOccupancy = (occupiedSeats / totalSeats) * 100;

// PROBLÈME : Compte les trips FUTURS et ANNULÉS
```

#### Problème 2 : Revenus faux
```typescript
// ❌ Calcul actuel
const totalRevenue = tickets
  .filter(t => t.status === 'valid' || t.status === 'used')
  .reduce((sum, t) => sum + t.price, 0);

// PROBLÈME : Ne distingue pas online vs counter
// Le business model CRITIQUE = différencier canaux !
```

#### Problème 3 : Top routes incomplet
```typescript
// ❌ Calcul actuel
const topRoutes = // Groupement par route
  
// PROBLÈME : Ne montre pas :
// - Taux d'occupation par route
// - Revenu moyen par passager
// - Tendance (hausse/baisse)
```

#### Comportement attendu (CORRECT)
```typescript
const getAnalytics = (startDate?: string, endDate?: string) => {
  // Filtrer trips TERMINÉS uniquement
  const completedTrips = trips.filter(t => 
    t.status === 'arrived' &&
    (!startDate || new Date(t.departureTime) >= new Date(startDate)) &&
    (!endDate || new Date(t.departureTime) <= new Date(endDate))
  );
  
  // Tickets valides dans période
  const validTickets = tickets.filter(t => 
    (t.status === 'valid' || t.status === 'used') &&
    (!startDate || new Date(t.purchaseDate) >= new Date(startDate)) &&
    (!endDate || new Date(t.purchaseDate) <= new Date(endDate))
  );
  
  // Revenus PAR CANAL (CRITIQUE)
  const revenueByChannel = {
    online: validTickets
      .filter(t => t.salesChannel === 'online')
      .reduce((sum, t) => sum + t.price, 0),
    counter: validTickets
      .filter(t => t.salesChannel === 'counter')
      .reduce((sum, t) => sum + t.price, 0)
  };
  
  // Taux d'occupation (trips terminés uniquement)
  const totalSeats = completedTrips.reduce((sum, t) => sum + t.totalSeats, 0);
  const soldSeats = validTickets.filter(t => 
    completedTrips.some(trip => trip.id === t.tripId)
  ).length;
  const averageOccupancy = totalSeats > 0 ? (soldSeats / totalSeats) * 100 : 0;
  
  return {
    totalRevenue: revenueByChannel.online + revenueByChannel.counter,
    revenueByChannel,
    totalTickets: validTickets.length,
    averageOccupancy,
    completedTrips: completedTrips.length
  };
};
```

---

## 🔴 7. VALIDATION DE TICKETS

### ❌ PROBLÈME : Transitions d'états incohérentes

**Fichier :** `/pages/caissier/TicketControlPage.tsx`

#### Comportement actuel (INCORRECT)
```typescript
// ❌ Peut valider n'importe quel ticket
const handleValidateTicket = (id: string) => {
  updateTicket(id, { status: 'used' });
  toast.success('Billet validé');
};

// Aucune vérification :
// - Ticket déjà utilisé ?
// - Ticket remboursé ?
// - Bonne date ?
// - Bon trajet ?
```

#### Scénarios problématiques

**1. Double validation**
```
🎫 Billet A1 - Status: 'used'
🔍 Scan à nouveau
❌ Passe à 'used' (aucun message)
✅ Devrait : "Billet déjà validé à 14h32"
```

**2. Mauvaise date**
```
🎫 Billet pour demain
🔍 Scan aujourd'hui
❌ Validé quand même
✅ Devrait : "Ce billet est pour le 03/01 à 14h00"
```

**3. Billet remboursé**
```
🎫 Billet remboursé ce matin
🔍 Scan ce soir
❌ Validé quand même
✅ Devrait : "Billet remboursé - Invalide"
```

#### Comportement attendu (CORRECT)
```typescript
const handleValidateTicket = (scannedCode: string) => {
  const ticket = tickets.find(t => t.id === scannedCode);
  
  if (!ticket) {
    toast.error('Billet non trouvé');
    return;
  }
  
  // 1. Vérifier statut
  if (ticket.status === 'used') {
    toast.error(`Billet déjà validé`);
    return;
  }
  
  if (ticket.status === 'refunded') {
    toast.error('❌ Billet remboursé - INVALIDE');
    return;
  }
  
  if (ticket.status === 'cancelled') {
    toast.error('❌ Billet annulé - INVALIDE');
    return;
  }
  
  // 2. Vérifier date/heure
  const now = new Date();
  const departure = new Date(ticket.departureTime);
  const hoursDiff = (departure - now) / (1000 * 60 * 60);
  
  if (hoursDiff > 2) {
    toast.error(`Ce billet est pour ${departure.toLocaleString()}`);
    return;
  }
  
  if (hoursDiff < -1) {
    toast.error('Billet expiré (départ il y a plus d\'1h)');
    return;
  }
  
  // 3. Vérifier trip
  const trip = trips.find(t => t.id === ticket.tripId);
  if (trip.status === 'cancelled') {
    toast.error('Trajet annulé');
    return;
  }
  
  // 4. Valider
  updateTicket(ticket.id, { status: 'used' });
  toast.success(`✅ Billet ${ticket.seatNumber} validé pour ${ticket.passengerName}`);
};
```

---

## 🔴 8. REVIEWS

### ❌ PROBLÈME : Pas de vérification d'achat

**Fichier :** DataContext (reviews mockés)

#### Comportement actuel (INCORRECT)
```typescript
// ❌ N'importe qui peut laisser un avis
// Pas de lien avec tickets achetés
const reviews = [
  {
    passengerName: 'Mamadou Traoré',
    rating: 5,
    // ...
  }
];

// PROBLÈME : Pas de preuve d'achat
```

#### Comportement attendu (CORRECT)
```typescript
interface Review {
  id: string;
  ticketId: string;        // ✅ Lien avec billet
  tripId: string;
  userId?: string;         // Si connecté
  passengerName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;       // ✅ Acheté = verified: true
}

// Validation avant création review
const canLeaveReview = (userId: string, tripId: string) => {
  // Vérifier que l'utilisateur a acheté un billet pour ce trajet
  const userTickets = tickets.filter(t => 
    t.tripId === tripId &&
    t.status === 'used' &&
    // Si app mobile : userId
    // Si guichet : passengerPhone
  );
  
  return userTickets.length > 0;
};
```

---

## 🔴 9. STORIES

### ❌ PROBLÈME : Ciblage stations non appliqué

**Fichier :** Pages dashboard (stories affichées)

#### Comportement actuel (INCORRECT)
```typescript
// ❌ Toutes les stories affichées partout
const visibleStories = stories.filter(s => 
  s.status === 'active' &&
  new Date(s.endDate) > new Date()
);

// PROBLÈME : targetStations ignoré
```

#### Comportement attendu (CORRECT)
```typescript
const visibleStories = stories.filter(s => {
  // 1. Vérifier statut et date
  if (s.status !== 'active') return false;
  if (new Date(s.endDate) < new Date()) return false;
  
  // 2. Vérifier audience
  if (s.targetAudience !== 'all' && s.targetAudience !== user.role) {
    return false;
  }
  
  // 3. Vérifier stations ciblées
  if (s.targetStations && s.targetStations.length > 0) {
    // Manager/Caissier : vérifier leur gare
    if (user.role === 'manager' || user.role === 'caissier') {
      if (!s.targetStations.includes(user.gareId)) {
        return false;
      }
    }
    // Responsable : voir toutes mais avec badge "Multi-gares"
  }
  
  return true;
});
```

---

## 🔴 10. SYNCHRONISATION DES ÉTATS

### ❌ PROBLÈME : États incohérents entre entités

#### Problème 1 : Trip status vs Tickets
```typescript
// ❌ Trip marqué "departed" mais pas de vérification tickets
trip.status = 'departed';

// Tickets encore 'valid' au lieu de 'used'
// Impact : Stats fausses, contrôle impossible
```

#### Problème 2 : Ticket refunded vs Trip availability
```typescript
// ❌ Déjà identifié section 4
ticket.status = 'refunded';
// Mais trip.availableSeats pas mis à jour
```

#### Problème 3 : Route inactive vs Trips actifs
```typescript
// ❌ Route désactivée
route.status = 'inactive';

// Mais trips pour cette route toujours visibles
// Impact : Vente possible sur route fermée
```

#### Solution : Event-driven updates
```typescript
// Quand trip change de statut
const updateTripStatus = (id: string, newStatus: string) => {
  const trip = trips.find(t => t.id === id);
  
  // Si départ
  if (newStatus === 'departed') {
    // Marquer tous les tickets non-utilisés comme périmés
    const tripTickets = tickets.filter(t => 
      t.tripId === id && t.status === 'valid'
    );
    tripTickets.forEach(ticket => {
      updateTicket(ticket.id, { status: 'expired' });
    });
  }
  
  // Si annulation
  if (newStatus === 'cancelled') {
    // Rembourser automatiquement tous les billets
    const tripTickets = tickets.filter(t => 
      t.tripId === id && t.status === 'valid'
    );
    tripTickets.forEach(ticket => {
      refundTicket(ticket.id, 'system', 'Système');
    });
  }
  
  updateTrip(id, { status: newStatus });
};
```

---

## 📊 RÉCAPITULATIF DES BUGS

| # | Problème | Criticité | Impact | Fichiers |
|---|----------|-----------|--------|----------|
| 1 | Multi-passagers non géré | 🔴 CRITIQUE | Billets incorrects | TicketSalePage.tsx |
| 2 | Disponibilité pas mise à jour | 🔴 CRITIQUE | Survente possible | DataContext.tsx |
| 3 | Prix non recalculé (rules) | 🔴 CRITIQUE | Tarifs faux | DataContext.tsx |
| 4 | Remboursement incomplet | 🔴 CRITIQUE | Caisse fausse | DataContext.tsx |
| 5 | Solde caisse filtré | 🟠 MAJEUR | Comptabilité fausse | CashManagementPage.tsx |
| 6 | Analytics incorrects | 🟠 MAJEUR | Décisions fausses | DataContext.tsx |
| 7 | Validation tickets permissive | 🟠 MAJEUR | Fraude possible | TicketControlPage.tsx |
| 8 | Reviews non vérifiées | 🟡 MOYEN | Faux avis | DataContext.tsx |
| 9 | Stories mal ciblées | 🟡 MOYEN | Spam inutile | Tous dashboards |
| 10 | Synchro états manquante | 🟠 MAJEUR | Incohérences | DataContext.tsx |

---

## 🎯 PRIORITÉS DE CORRECTION

### P0 - CRITIQUE (Bloquer production)
1. ✅ Multi-passagers (vente billets)
2. ✅ Calcul disponibilité automatique
3. ✅ Prix avec règles (génération trips)
4. ✅ Remboursement complet (caisse + dispo)

### P1 - MAJEUR (Corriger avant release)
5. ✅ Solde caisse global
6. ✅ Analytics par canal
7. ✅ Validation tickets stricte
8. ✅ Synchronisation états

### P2 - MOYEN (Amélioration continue)
9. Reviews vérifiées
10. Stories ciblées

---

## 📝 NOTES

- Tous les problèmes peuvent causer des **litiges clients**
- Impact **financier direct** (caisse, survente, fraude)
- Impact **opérationnel** (confusion, erreurs)
- **Réputation** de l'app en jeu

**Action immédiate requise !**
