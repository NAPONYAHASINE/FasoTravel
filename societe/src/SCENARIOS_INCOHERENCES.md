# 🎬 SCÉNARIOS D'UTILISATION - DÉMONSTRATION DES INCOHÉRENCES

**Date :** 2026-01-02  
**Contexte :** Exemples concrets montrant les problèmes de logique métier

---

## 📚 TABLE DES SCÉNARIOS

1. [Scénario A : Double vente du même siège](#scénario-a--double-vente-du-même-siège)
2. [Scénario B : Configuration véhicule incohérente](#scénario-b--configuration-véhicule-incohérente)
3. [Scénario C : Règles de tarification ignorées](#scénario-c--règles-de-tarification-ignorées)
4. [Scénario D : Analytics incorrects](#scénario-d--analytics-incorrects)

---

## Scénario A : Double vente du même siège

### 🎭 Acteurs
- **Fatou** : Caissière à Ouagadougou (poste 1)
- **Ibrahim** : Caissier à Ouagadougou (poste 2)
- **Client 1** : M. Traoré
- **Client 2** : Mme Ouédraogo

### 📝 Déroulement

**10h00** - M. Traoré arrive au guichet de Fatou
```
Fatou : "Bonjour, je voudrais un billet pour Bobo à 14h"
Système : Affiche trajet BF-1024 avec 45 places disponibles
Fatou : Ouvre la grille de sièges
```

**État système :**
```javascript
Trip BF-1024 {
  totalSeats: 45,
  availableSeats: 45,
  status: 'scheduled'
}

Tickets vendus : []
```

**10h01** - Fatou sélectionne les places
```
UI affiche : Grille 4×12
- Toutes les places disponibles (grises)
- Fatou sélectionne : E3
```

**10h02** - Mme Ouédraogo arrive au guichet d'Ibrahim (SIMULTANÉMENT)
```
Ibrahim : "Bonjour, je voudrais un billet pour Bobo à 14h"
Système : Affiche trajet BF-1024 avec 45 places disponibles
Ibrahim : Ouvre la grille de sièges
```

**État système (IDENTIQUE pour les deux caisses) :**
```javascript
// ❌ PROBLÈME : Les deux caissiers voient la MÊME chose
occupiedSeats = [] // Calculé depuis availableSeats = 45
```

**10h03** - Les deux vendent le même siège !
```
Fatou : Confirme la vente de E3 pour M. Traoré
- addTicket({ seatNumber: 'E3', tripId: 'trip_xxx', ... })
- updateTrip({ availableSeats: 44 })

Ibrahim : Confirme la vente de E3 pour Mme Ouédraogo (!!!)
- addTicket({ seatNumber: 'E3', tripId: 'trip_xxx', ... })
- updateTrip({ availableSeats: 43 })
```

**État final :**
```javascript
Trip BF-1024 {
  availableSeats: 43  // ✅ Mis à jour
}

Tickets [
  { id: 'T1', seatNumber: 'E3', passengerName: 'M. Traoré' },
  { id: 'T2', seatNumber: 'E3', passengerName: 'Mme Ouédraogo' } // ❌ DOUBLON !
]
```

### 💥 Conséquence
Le jour du voyage, **2 passagers ont le billet pour le même siège E3** !

### ✅ Solution nécessaire
```typescript
// Validation en temps réel
const occupiedSeats = tickets
  .filter(t => t.tripId === currentTrip.id && t.status === 'valid')
  .map(t => t.seatNumber);

// Avant confirmer la vente
if (occupiedSeats.includes('E3')) {
  toast.error('Ce siège vient d\'être vendu !');
  return;
}
```

---

## Scénario B : Configuration véhicule incohérente

### 🎭 Acteurs
- **Marie** : Responsable société
- **Pierre** : Manager de gare
- **Aminata** : Caissière

### 📝 Déroulement

**Lundi 8h00** - Marie crée un nouveau template
```
Marie : "Je vais créer un horaire VIP pour Bobo"
Interface : /responsable/schedules

Formulaire :
- Route : Ouagadougou → Bobo
- Heure : 09:00
- Service : VIP
- Nombre de places : 35
```

**État système :**
```javascript
ScheduleTemplate {
  totalSeats: 35,
  serviceClass: 'vip',
  // ❌ MANQUE : layoutId, vehicleType
}
```

**Lundi 14h00** - Pierre consulte les horaires
```
Pierre : "Un nouveau VIP à 09h, parfait !"
// ⚠️ Pierre ne sait pas QUEL bus utiliser
// Pas de liaison avec un véhicule physique
```

**Mardi 9h00** - Un client arrive
```
Client : "Un billet VIP pour Bobo, s'il vous plaît"
Aminata : Sélectionne le trajet 09h00 VIP (35 places)
```

**Interface caissier :**
```
Grille de sièges affichée : 4×9 (4 places par rangée)

A1  A2  A3  A4
B1  B2  B3  B4
C1  C2  C3  C4
...
H1  H2  H3  H4
I1  I2  I3     <- Dernière rangée incomplète
```

### 💭 Réflexion du client
```
Client : "Pourquoi 4 places par rangée dans un VIP ?"
        "Normalement c'est 2+1 dans les bus VIP..."
        "Il y a même pas d'allée au milieu ?!"
```

### ❌ Problème
La grille 4×9 ne correspond PAS à la vraie structure d'un bus VIP (généralement 2+1 sur 12 rangées).

**Vraie structure VIP (2+1)** :
```
Avant du bus
┌─────────────┐
│ A1  A2 │ A3 │
│ B1  B2 │ B3 │
│ C1  C2 │ C3 │
│    ...      │
│ L1  L2 │ L3 │ (12 rangées × 3 = 36 places, réduit à 35)
└─────────────┘
    Arrière
```

**Ce que le système affiche (4 par rangée)** :
```
A1  A2  A3  A4   <- Incohérent !
B1  B2  B3  B4
```

### ✅ Solution nécessaire
```typescript
const seatLayouts: SeatLayout[] = [
  {
    id: 'vip_35',
    name: 'VIP 2+1 (35 places)',
    structure: { rows: 12, leftSeats: 2, rightSeats: 1 }
  }
];

// Lier le template au layout
scheduleTemplate.layoutId = 'vip_35';
```

---

## Scénario C : Règles de tarification ignorées

### 🎭 Acteurs
- **Marie** : Responsable société
- **Clients** : Plusieurs passagers

### 📝 Déroulement

**Vendredi 15h00** - Marie crée une promotion
```
Marie : "Je vais faire une promo week-end à -20%"
Interface : /responsable/pricing

Formulaire :
- Route : Ouagadougou → Bobo
- Type : Pourcentage
- Valeur : 20%
- Période : 10/01/2026 - 12/01/2026
- Jours : Samedi, Dimanche
- Statut : Active
```

**État système :**
```javascript
pricingRules: [
  {
    id: 'promo_weekend',
    routeId: 'route_1',
    type: 'percentage',
    value: 20,
    startDate: '2026-01-10',
    endDate: '2026-01-12',
    daysOfWeek: [0, 6], // Dimanche, Samedi
    status: 'active'
  }
]
```

**Samedi 10/01 - 9h00** - Un client achète un billet
```
Client : "Un billet pour Bobo demain dimanche, s'il vous plaît"
Caissière : Sélectionne trajet dimanche 11/01 à 14h
```

**Prix affiché :**
```javascript
// ❌ PROBLÈME : Le prix ne change PAS !
Trip {
  departure: 'Ouagadougou',
  arrival: 'Bobo-Dioulasso',
  departureTime: '2026-01-11T14:00:00Z',
  price: 5000  // ⚠️ Prix de base, règle ignorée !
}

// ✅ DEVRAIT être : 4000 FCFA (5000 - 20%)
```

**Client :** "Mais je croyais qu'il y avait une promo week-end ?"  
**Caissière :** "Euh... laissez-moi vérifier..." (Gêne)

### 💥 Conséquences
1. Perte de confiance client
2. Règles créées mais inutiles
3. Impossibilité de faire des promotions

### ✅ Solution nécessaire
```typescript
// Dans generateTripsFromTemplates()
const finalPrice = calculatePriceWithRules(
  route.basePrice,      // 5000
  route.id,             // 'route_1'
  departureDate,        // '2026-01-11T14:00:00Z'
  pricingRules          // [promo_weekend]
);
// Résultat : 4000 FCFA ✅
```

---

## Scénario D : Analytics incorrects

### 🎭 Acteurs
- **Marie** : Responsable société
- **Direction** : Assemblée générale

### 📝 Déroulement

**Fin du mois** - Marie prépare le rapport
```
Marie : "Je vais présenter nos performances"
Interface : /responsable/analytics
```

**Données affichées :**
```javascript
// Calcul actuel
const totalOccupiedSeats = trips.reduce((sum, t) => 
  sum + (t.totalSeats - t.availableSeats), 0
);
// Résultat : 1250 places vendues
```

**Mais en réalité...**
```javascript
// Tickets réellement vendus
const validTickets = tickets.filter(t => t.status === 'valid');
// Résultat : 1210 tickets

// ❌ ÉCART : 40 places fantômes !
```

### 🤔 D'où vient l'écart ?

**Cas 1 : Remboursements**
```javascript
// Un ticket remboursé met à jour trip.availableSeats (+1)
// Mais le calcul d'analytics compte quand même la place comme occupée
refundTicket('T123'); // Met status = 'refunded', availableSeats++

// Analytics compte : totalSeats - availableSeats
// Donc ne voit PAS le remboursement correctement
```

**Cas 2 : Annulations**
```javascript
// Un voyage annulé garde son availableSeats
cancelTrip('trip_456'); // Met status = 'cancelled'

// Mais les sièges "occupés" sont toujours comptés !
```

### 💥 Conséquences
```
Marie : "Nous avons un taux d'occupation de 78%"
Direction : "Excellent ! Mais pourquoi le chiffre d'affaires ne suit pas ?"
Comptable : "Les tickets vendus sont seulement 1210, pas 1250..."
Marie : (Embarras) "Ah... il y a une erreur dans le système..."
```

### ✅ Solution nécessaire
```typescript
const getAnalytics = () => {
  // ✅ Compter depuis les tickets RÉELS
  const validTickets = tickets.filter(t => 
    t.status === 'valid' || t.status === 'used'
  );
  
  const totalRevenue = validTickets.reduce((sum, t) => sum + t.price, 0);
  const totalTickets = validTickets.length;
  
  const eligibleTrips = trips.filter(t => 
    t.status !== 'cancelled'
  );
  const totalSeats = eligibleTrips.reduce((sum, t) => sum + t.totalSeats, 0);
  const averageOccupancy = (totalTickets / totalSeats) * 100;
  
  return { totalRevenue, totalTickets, averageOccupancy };
};
```

---

## 📊 TABLEAU RÉCAPITULATIF DES IMPACTS

| Scénario | Gravité | Fréquence probable | Impact business |
|----------|---------|-------------------|-----------------|
| **A. Double vente siège** | 🔴 Critique | Moyenne (multi-caissiers) | Conflit client, remboursement forcé |
| **B. Véhicule incohérent** | 🟠 Majeur | Haute (tous les trajets) | Confusion, perte de crédibilité |
| **C. Tarification ignorée** | 🔴 Critique | Haute (promos fréquentes) | Perte revenue, clients mécontents |
| **D. Analytics incorrects** | 🟡 Moyen | Faible (vérifications mensuelles) | Décisions basées sur fausses données |

---

## 🎯 PRIORITÉS D'ACTION

### Immédiat (avant démo client) :
1. ✅ **Scénario C** : Appliquer les règles de tarification (2h)
2. ✅ **Scénario A** : Corriger places occupées (1h)

### Court terme (avant production) :
3. ✅ **Scénario B** : Implémenter layouts véhicules (3h)
4. ✅ **Scénario D** : Corriger analytics (1h)

---

## 💡 LEÇONS APPRISES

### Ce qui fonctionne ✅
- Architecture générale solide
- Synchronisation tickets ↔ trips existe
- Interface utilisateur intuitive

### Ce qui manque ❌
- Validation en temps réel
- Configuration de structures de sièges
- Application des règles métier
- Calculs basés sur données réelles

### Principe clé
> **"Toujours lire depuis la source de vérité"**  
> Les tickets sont la vérité, pas `availableSeats`

---

**Document généré le 2026-01-02**  
**Statut :** ✅ Scénarios validés et reproductibles
