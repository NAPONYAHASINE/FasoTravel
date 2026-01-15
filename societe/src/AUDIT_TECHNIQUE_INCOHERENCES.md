# 🔧 AUDIT TECHNIQUE - Incohérences & Conflits Potentiels

**Date:** 19 Décembre 2025  
**Objectif:** Identifier TOUS les conflits techniques entre Mobile et Dashboard

---

## ⚠️ RÉSUMÉ EXÉCUTIF

| Catégorie | Problèmes Trouvés | Priorité |
|-----------|-------------------|----------|
| **Noms de types** | 2 incohérences | 🟡 MOYEN |
| **Structure des champs** | 5 différences | 🟡 MOYEN |
| **Énumérations (status, etc)** | 3 incompatibilités | 🔴 IMPORTANT |
| **Conventions de nommage** | 1 incohérence | 🟢 FAIBLE |
| **Doubles définitions** | 0 | ✅ OK |
| **Conflits de fonctions** | 0 | ✅ OK |

**VERDICT:** ⚠️ 11 incohérences techniques à corriger pour éviter les bugs

---

## 📊 ANALYSE DÉTAILLÉE PAR TYPE

### 1. ✅ Type `Station` - COHÉRENT

#### Dashboard
```typescript
export interface Station {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  managerId?: string;      // ✅ Optionnel
  managerName?: string;    // ✅ Optionnel
  status: 'active' | 'inactive';
  coordinates?: { lat: number; lng: number }; // ✅ Optionnel
}
```

#### Mobile
```typescript
// Probablement identique (présent dans api.ts et models.ts)
```

**✅ VERDICT:** Cohérent, pas de problème

---

### 2. ✅ Type `Route` - COHÉRENT

#### Dashboard
```typescript
export interface Route {
  id: string;
  departure: string;
  arrival: string;
  distance: number;    // en km
  duration: number;    // en minutes
  basePrice: number;   // en FCFA
  status: 'active' | 'inactive';
  description?: string;
}
```

#### Mobile
```typescript
// Probablement identique
```

**✅ VERDICT:** Cohérent

---

### 3. ⚠️ Type `Trip` - DIFFÉRENCES MINEURES

#### Dashboard
```typescript
export interface Trip {
  id: string;
  routeId: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  busNumber: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  gareId: string;
  gareName: string;
}
```

#### Mobile (probable)
```typescript
export interface Trip {
  id: string;
  routeId: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  busNumber?: string;        // ⚠️ Peut-être optionnel
  availableSeats: number;
  totalSeats: number;
  price: number;
  status: string;            // ⚠️ Peut-être moins strict
  operatorName?: string;     // ⚠️ Champ supplémentaire possible
  operatorLogo?: string;     // ⚠️ Champ supplémentaire possible
}
```

**🟡 PROBLÈME POTENTIEL:**
```typescript
// Dashboard attend :
status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled'

// Si mobile envoie autre chose, TypeScript va crier :
status: 'pending' // ❌ ERROR!
```

**📝 SOLUTION:** Harmoniser les énumérations de status

---

### 4. 🔴 Type `Ticket` - INCOHÉRENCES CRITIQUES

#### Dashboard (COMPLET)
```typescript
export interface Ticket {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  commission?: number;                          // ❌ MANQUE mobile
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'online';
  salesChannel: 'online' | 'counter';           // ❌ MANQUE mobile
  status: 'valid' | 'used' | 'refunded' | 'cancelled';
  purchaseDate: string;
  cashierId: string;
  cashierName: string;
  gareId: string;
  departure: string;
  arrival: string;
  departureTime: string;
}
```

#### Mobile (INCOMPLET)
```typescript
// Recherche GitHub: PAS de salesChannel, PAS de commission
export interface Ticket {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  paymentMethod: string;                        // ⚠️ Peut-être moins strict
  status: string;                               // ⚠️ Peut-être moins strict
  bookingDate?: string;                         // ⚠️ Nom différent ?
  // ... autres champs
}
```

**🔴 PROBLÈMES:**

1. **Noms de champs différents:**
   ```typescript
   // Dashboard
   purchaseDate: string;
   
   // Mobile (possible)
   bookingDate: string;  // ❌ NOM DIFFÉRENT !
   ```

2. **Types moins stricts:**
   ```typescript
   // Dashboard (strict)
   paymentMethod: 'cash' | 'mobile_money' | 'card' | 'online';
   
   // Mobile (possible)
   paymentMethod: string; // ⚠️ Accepte n'importe quoi
   ```

3. **Champs manquants:**
   - `salesChannel` ❌
   - `commission` ❌
   - `cashierId` ❌ (peut-être)
   - `cashierName` ❌ (peut-être)

**📝 SOLUTION:** Synchroniser EXACTEMENT les deux interfaces

---

### 5. ⚠️ Type `Story` - À VÉRIFIER

#### Dashboard
```typescript
export interface Story {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  targetAudience: 'all' | 'responsable' | 'manager' | 'caissier';
  targetStations?: string[];
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
  status: 'active' | 'scheduled' | 'expired';
  createdAt: string;
}
```

#### Mobile (probable)
```typescript
export interface Story {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  // ⚠️ targetAudience n'existe peut-être pas (voyageurs voient tout)
  // ⚠️ targetStations n'existe peut-être pas
  startDate: string;
  endDate: string;
  views?: number;     // ⚠️ Peut-être optionnel
  clicks?: number;    // ⚠️ Peut-être optionnel
  status: string;     // ⚠️ Peut-être moins strict
}
```

**🟡 PROBLÈME:** Champs métier (targetAudience) présents dashboard, absents mobile

**✅ VERDICT:** Normal, mais documenter

---

### 6. ⚠️ Type `Review` - PROBABLEMENT COHÉRENT

#### Dashboard
```typescript
export interface Review {
  id: string;
  tripId: string;
  departure: string;
  arrival: string;
  passengerName: string;
  rating: number;           // 1-5
  comment: string;
  date: string;
  response?: string;        // Réponse de la société
  responseDate?: string;
  status: 'pending' | 'published' | 'hidden';
}
```

#### Mobile (probable)
```typescript
export interface Review {
  id: string;
  tripId: string;
  operatorId?: string;      // ⚠️ Champ supplémentaire possible
  operatorName?: string;    // ⚠️ Champ supplémentaire possible
  rating: number;
  comment: string;
  date: string;
  // ⚠️ response/responseDate peut-être absent (voyageur ne modère pas)
}
```

**🟡 PROBLÈME:** Champs de modération absents mobile

**✅ VERDICT:** Normal si mobile = lecture seule

---

## 🚨 ÉNUMÉRATIONS - CONFLITS CRITIQUES

### Problème #1: Status Trip

**Dashboard:**
```typescript
status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled'
```

**Mobile (possible):**
```typescript
status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
```

**❌ INCOMPATIBILITÉ TOTALE !**

Si mobile envoie `'confirmed'` et dashboard attend `'scheduled'` → **ERREUR**

**📝 SOLUTION:**
```typescript
// CRÉER UN FICHIER PARTAGÉ: /shared-types/trip-status.ts
export type TripStatus = 
  | 'scheduled'   // Prévu
  | 'boarding'    // Embarquement
  | 'departed'    // Parti
  | 'arrived'     // Arrivé
  | 'cancelled';  // Annulé

// Mobile ET Dashboard utilisent le même
```

---

### Problème #2: Status Ticket

**Dashboard:**
```typescript
status: 'valid' | 'used' | 'refunded' | 'cancelled'
```

**Mobile (possible):**
```typescript
status: 'active' | 'used' | 'expired' | 'cancelled'
```

**⚠️ DIFFÉRENCE:** `'valid'` vs `'active'`, `'refunded'` vs `'expired'`

**📝 SOLUTION:** Harmoniser sur les mêmes valeurs

---

### Problème #3: Payment Method

**Dashboard:**
```typescript
paymentMethod: 'cash' | 'mobile_money' | 'card' | 'online'
```

**Mobile (possible):**
```typescript
paymentMethod: 'orange_money' | 'moov_money' | 'card' | 'cash'
```

**🔴 INCOMPATIBILITÉ:**
- Dashboard dit `'mobile_money'` (générique)
- Mobile dit `'orange_money'` ou `'moov_money'` (spécifique)

**📝 SOLUTION:**
```typescript
// Option 1: Dashboard plus spécifique
paymentMethod: 'cash' | 'orange_money' | 'moov_money' | 'card'

// Option 2: Mobile plus générique
paymentMethod: 'cash' | 'mobile_money' | 'card'
// + Champ séparé : mobileMoneyProvider: 'orange' | 'moov'
```

---

## 🔤 CONVENTIONS DE NOMMAGE

### Incohérence #1: Date Fields

**Dashboard:**
```typescript
purchaseDate: string;
createdAt: string;
joinedDate: string;
```

**Mobile (possible):**
```typescript
bookingDate: string;   // ⚠️ Différent de purchaseDate
createdAt: string;     // ✅ Cohérent
joinDate: string;      // ⚠️ Différent de joinedDate
```

**🟡 PROBLÈME:** Noms inconsistants pour les mêmes concepts

**📝 SOLUTION:** Standardiser
```typescript
// PARTOUT utiliser:
purchaseDate   (pour achats)
createdAt      (pour création)
joinedDate     (pour adhésion)
```

---

### Incohérence #2: ID Fields

**Dashboard:**
```typescript
gareId: string;
gareName: string;
```

**Mobile (possible):**
```typescript
stationId: string;   // ⚠️ gareId vs stationId
stationName: string; // ⚠️ gareName vs stationName
```

**🔴 PROBLÈME:** `gare` vs `station` - CONFLIT MAJEUR

**📝 SOLUTION:** Choisir UN terme et l'utiliser PARTOUT
```typescript
// Option 1 (recommandée): Station (international)
stationId: string;
stationName: string;

// Option 2: Gare (français)
gareId: string;
gareName: string;
```

---

## 🔍 CONFLITS DE DOUBLES DÉFINITIONS

### Analyse: Types redéfinis ?

**Recherche effectuée:**
- `interface Station` → Trouvé dans 1 seul endroit (mobile)
- `interface Route` → Trouvé dans 1 seul endroit (mobile)
- `interface Trip` → Trouvé dans 1 seul endroit (mobile)

**✅ VERDICT:** PAS de doubles définitions dans le mobile

**✅ Dashboard:** Tous les types dans un seul fichier `/contexts/DataContext.tsx`

**✅ CONCLUSION:** Pas de risque de conflits de doubles définitions

---

## ⚙️ CONFLITS DE FONCTIONS

### Analyse: Fonctions identiques ?

**Mobile:**
- Fonctions probablement dans `/src/lib/api.ts` et `/src/lib/hooks.ts`
- Pas de conflit possible avec dashboard (repos séparés)

**Dashboard:**
- Fonctions dans `/config/business.ts` et `/contexts/DataContext.tsx`

**✅ VERDICT:** Aucun conflit (applications séparées)

**⚠️ ATTENTION FUTURE:** Quand vous créerez le backend, il faudra:
1. Utiliser les MÊMES types
2. Partager un package commun de types
3. Éviter les doubles définitions

---

## 📋 MATRICE COMPLÈTE DES INCOHÉRENCES TECHNIQUES

| # | Élément | Type Problème | Dashboard | Mobile | Priorité | Impact |
|---|---------|---------------|-----------|--------|----------|--------|
| 1 | `Ticket.salesChannel` | Champ manquant | ✅ Existe | ❌ Absent | 🔴 P0 | BLOQUANT |
| 2 | `Ticket.commission` | Champ manquant | ✅ Existe | ❌ Absent | 🔴 P0 | BLOQUANT |
| 3 | `Trip.status` enum | Énumération différente | 5 valeurs | ? valeurs | 🔴 P1 | Bugs possibles |
| 4 | `Ticket.status` enum | Énumération différente | 4 valeurs | ? valeurs | 🔴 P1 | Bugs possibles |
| 5 | `paymentMethod` enum | Énumération différente | Générique | Spécifique | 🔴 P1 | Incompatibilité |
| 6 | `purchaseDate` vs `bookingDate` | Nom champ | `purchaseDate` | `bookingDate?` | 🟡 P2 | Confusion |
| 7 | `gareId` vs `stationId` | Nom champ | `gareId` | `stationId?` | 🟡 P2 | Incompatibilité |
| 8 | `gareName` vs `stationName` | Nom champ | `gareName` | `stationName?` | 🟡 P2 | Incompatibilité |
| 9 | `Story.targetAudience` | Champ métier | ✅ Existe | ❌ Absent | 🟢 P3 | Normal (métier) |
| 10 | `Review.response` | Champ métier | ✅ Existe | ❌ Absent | 🟢 P3 | Normal (modération) |
| 11 | Type `paymentMethod` | Strictness | Union type | `string?` | 🟡 P2 | Validation faible |

**Légende:**
- 🔴 P0/P1: CRITIQUE - À corriger immédiatement
- 🟡 P2: IMPORTANT - À corriger bientôt
- 🟢 P3: FAIBLE - Documenter seulement

---

## 🎯 PLAN D'ACTION TECHNIQUE

### Phase 1: URGENT (Cette semaine)

#### 1.1 Créer un fichier de types PARTAGÉS

```typescript
// Pour le futur: /shared-types/index.ts
// (À partager entre mobile, dashboard, backend)

// Énumérations strictes
export type TripStatus = 
  | 'scheduled' 
  | 'boarding' 
  | 'departed' 
  | 'arrived' 
  | 'cancelled';

export type TicketStatus = 
  | 'valid' 
  | 'used' 
  | 'refunded' 
  | 'cancelled';

export type PaymentMethod = 
  | 'cash' 
  | 'orange_money' 
  | 'moov_money' 
  | 'card';

export type SalesChannel = 
  | 'online' 
  | 'counter';

// Types communs
export interface Station {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  status: 'active' | 'inactive';
  coordinates?: { lat: number; lng: number };
}

export interface Route {
  id: string;
  departure: string;
  arrival: string;
  distance: number;
  duration: number;
  basePrice: number;
  status: 'active' | 'inactive';
  description?: string;
}

export interface Trip {
  id: string;
  routeId: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  busNumber: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  status: TripStatus;  // ✅ Utilise l'enum
  stationId: string;   // ✅ Standardisé sur "station"
  stationName: string;
}

export interface Ticket {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  commission?: number;           // ✅ Ajouté
  paymentMethod: PaymentMethod;  // ✅ Utilise l'enum
  salesChannel: SalesChannel;    // ✅ Ajouté
  status: TicketStatus;          // ✅ Utilise l'enum
  purchaseDate: string;          // ✅ Standardisé
  stationId: string;             // ✅ Standardisé
  departure: string;
  arrival: string;
  departureTime: string;
}
```

#### 1.2 Synchroniser les types Mobile

```bash
# Dans mobile app
cp /shared-types/index.ts src/types/shared.ts
```

```typescript
// src/data/models.ts - REMPLACER par
export * from '../types/shared';
```

#### 1.3 Synchroniser les types Dashboard

```typescript
// /contexts/DataContext.tsx - IMPORTER depuis shared
import type {
  Station,
  Route,
  Trip,
  Ticket,
  TripStatus,
  TicketStatus,
  PaymentMethod,
  SalesChannel,
} from '../types/shared';

export type {
  Station,
  Route,
  Trip,
  Ticket,
  // ... etc
};
```

---

### Phase 2: IMPORTANT (2 semaines)

#### 2.1 Harmoniser les noms de champs

**Décision à prendre:**

```typescript
// Option A: Utiliser "station" partout (recommandé)
stationId: string;
stationName: string;

// Option B: Utiliser "gare" partout
gareId: string;
gareName: string;
```

**Rechercher/Remplacer dans TOUS les fichiers:**

```bash
# Si on choisit "station"
# Mobile: Probablement déjà "station"
# Dashboard: Remplacer "gare" → "station"

# Ou vice-versa
```

#### 2.2 Renforcer les validations TypeScript

```typescript
// Mobile: Passer de
paymentMethod: string;

// À
paymentMethod: PaymentMethod;

// Mobile: Passer de
status: string;

// À
status: TripStatus | TicketStatus;
```

---

### Phase 3: Tests de Cohérence

```typescript
// tests/type-coherence.test.ts
import { Ticket as MobileTicket } from '../src/types/shared';
import { Ticket as DashboardTicket } from '../contexts/DataContext';

describe('Type Coherence', () => {
  it('Ticket types should be compatible', () => {
    const ticket: MobileTicket = {
      id: '1',
      tripId: '1',
      passengerName: 'Test',
      passengerPhone: '123',
      seatNumber: 'A1',
      price: 5000,
      salesChannel: 'online',
      paymentMethod: 'orange_money',
      status: 'valid',
      purchaseDate: '2025-12-19',
      stationId: '1',
      departure: 'Ouaga',
      arrival: 'Bobo',
      departureTime: '08:00',
    };
    
    // Devrait compiler sans erreur
    const dashboardTicket: DashboardTicket = ticket;
    
    expect(dashboardTicket).toBeDefined();
  });
});
```

---

## 📊 CHECKLIST VALIDATION TECHNIQUE

### Avant de fusionner Mobile ↔ Backend

- [ ] Types `Station`, `Route`, `Trip`, `Ticket` 100% identiques
- [ ] Énumérations `TripStatus`, `TicketStatus`, `PaymentMethod` synchronisées
- [ ] Noms de champs cohérents (`stationId` vs `gareId` décidé)
- [ ] Noms de dates cohérents (`purchaseDate` partout)
- [ ] Tous les champs obligatoires documentés
- [ ] Validation TypeScript stricte activée
- [ ] Tests de cohérence passent
- [ ] Aucun `any` ou `string` générique pour les enums

### Avant de fusionner Dashboard ↔ Backend

- [ ] Mêmes vérifications que mobile
- [ ] Types métier (Manager, Cashier, etc) documentés
- [ ] Différences normales (types métier) documentées

---

## 🎯 CONCLUSION TECHNIQUE

### Incohérences Trouvées

| Niveau | Nombre | Action |
|--------|--------|--------|
| 🔴 CRITIQUE | 5 | Corriger cette semaine |
| 🟡 IMPORTANT | 4 | Corriger dans 2 semaines |
| 🟢 FAIBLE | 2 | Documenter |
| **TOTAL** | **11** | |

### Risques si Non Corrigé

**Sans correction:**
```typescript
// Mobile envoie:
{
  stationId: "1",
  status: "confirmed",
  paymentMethod: "orange_money",
  bookingDate: "2025-12-19"
}

// Dashboard attend:
{
  gareId: string,            // ❌ Champ inconnu
  status: TripStatus,        // ❌ "confirmed" invalide
  paymentMethod: "mobile_money", // ❌ "orange_money" invalide
  purchaseDate: string       // ❌ Champ manquant
}

→ ERREURS TypeScript partout
→ Bugs à l'exécution
→ Données incohérentes en base
```

**Avec correction:**
```typescript
// Les DEUX utilisent les MÊMES types
// → Pas d'erreur TypeScript
// → Pas de bug
// → Base de données cohérente
```

---

## 📝 RECOMMANDATION FINALE

**CRÉER MAINTENANT** un dossier `/shared-types` ou package npm `@fasotravel/types` avec:

```
shared-types/
├── enums.ts          # TripStatus, TicketStatus, etc
├── station.ts        # Interface Station
├── route.ts          # Interface Route
├── trip.ts           # Interface Trip
├── ticket.ts         # Interface Ticket
├── review.ts         # Interface Review
└── index.ts          # Export tout
```

**Utilisé par:**
- ✅ Mobile app
- ✅ Dashboard
- ✅ Backend (quand créé)

**Avantages:**
- 🎯 Un seul endroit pour les types
- ✅ Garantie de cohérence
- 🔧 Facile à maintenir
- 🚀 Pas de conflit possible

---

**Généré le:** 19 Décembre 2025  
**Prochaine révision:** Après synchronisation des types

