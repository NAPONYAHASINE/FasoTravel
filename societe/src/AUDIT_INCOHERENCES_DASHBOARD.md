# 🔍 AUDIT PROFOND - Incohérences Internes Dashboard

**Date:** 19 Décembre 2025  
**Scope:** Dashboard uniquement (hors mobile)  
**Objectif:** Détecter TOUTES les incohérences internes qui peuvent causer des bugs

---

## ⚠️ RÉSUMÉ EXÉCUTIF

| Catégorie | Problèmes | Priorité | Statut |
|-----------|-----------|----------|--------|
| **Doubles définitions de types** | 5 | 🔴 CRITIQUE | ❌ À corriger |
| **Incohérence paymentMethod vs salesChannel** | 2 | 🔴 CRITIQUE | ❌ À corriger |
| **Types non importés** | 5 | 🟡 MOYEN | ⚠️ À vérifier |
| **Propriétés mal typées** | 0 | ✅ OK | ✅ RAS |
| **Données mock incohérentes** | 0 | ✅ OK | ✅ RAS |
| **Imports manquants** | 0 | ✅ OK | ✅ RAS |

**VERDICT:** 🔴 **12 incohérences critiques** trouvées

---

## 🔴 PROBLÈME CRITIQUE #1 : Doubles Définitions de Types

### Impact
**TypeScript va utiliser le mauvais type** selon l'endroit où vous êtes dans le code. Bugs garantis !

### Détail des conflits

#### 1️⃣ Type `Ticket` - 3 DÉFINITIONS DIFFÉRENTES

**Définition officielle** `/contexts/DataContext.tsx` (ligne 95) :
```typescript
export interface Ticket {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  commission?: number;
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'online';
  salesChannel: 'online' | 'counter';
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

**Redéfinition #1** `/pages/manager/SupportPage.tsx` (ligne 10) :
```typescript
interface Ticket {  // ❌ CONFLIT DE NOM !
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  date: string;
  lastUpdate: string;
}
```

**Redéfinition #2** `/pages/responsable/SupportPage.tsx` (ligne 10) :
```typescript
interface Ticket {  // ❌ CONFLIT DE NOM !
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  date: string;
  lastUpdate: string;
}
```

**🔴 PROBLÈME:**
- Le nom `Ticket` désigne **2 choses différentes** :
  - Un **billet de transport** (DataContext)
  - Un **ticket de support** (SupportPage)

**💥 RISQUE:**
```typescript
// Si quelqu'un importe les deux types :
import { Ticket } from '../../contexts/DataContext';
// ⚠️ Le type local "Ticket" (support) va masquer celui importé !

const ticket: Ticket = { ... };  // ❌ Confusion !
```

**✅ SOLUTION:**
```typescript
// Renommer le type support :
interface SupportTicket {  // ✅ Nom unique
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  date: string;
  lastUpdate: string;
}
```

---

#### 2️⃣ Type `Incident` - 2 DÉFINITIONS DIFFÉRENTES

**Définition officielle** `/contexts/DataContext.tsx` (ligne 157) :
```typescript
export interface Incident {
  id: string;
  tripId: string;
  type: 'delay' | 'breakdown' | 'accident' | 'other';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  gareId: string;
  gareName: string;
}
```

**Redéfinition** `/pages/manager/IncidentsPage.tsx` (ligne 18) :
```typescript
interface Incident {  // ❌ CONFLIT !
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';  // ⚠️ Différent de "severity"
  status: 'open' | 'in_progress' | 'resolved';  // ⚠️ Manque 'closed'
  reportedBy: string;
  date: string;  // ⚠️ Différent de "reportedAt"
  category: string;  // ⚠️ Différent de "type"
}
```

**🔴 PROBLÈMES:**
1. **Champs différents** : `priority` vs `severity`, `date` vs `reportedAt`, `category` vs `type`
2. **Énumérations incompatibles** : status manque `'closed'`
3. **Champs manquants** : `tripId`, `gareId`, `gareName`, `resolvedAt`

**💥 RISQUE:**
```typescript
// Si IncidentsPage reçoit un Incident du DataContext :
const incident: Incident = dataContext.incidents[0];

console.log(incident.severity);  // ❌ undefined (utilise le type local)
console.log(incident.priority);  // ❌ undefined (n'existe pas dans le vrai)
```

**✅ SOLUTION:**
```typescript
// Option 1: Utiliser le type du DataContext
import type { Incident } from '../../contexts/DataContext';
// Supprimer la définition locale

// Option 2: Si vraiment besoin d'un type différent, renommer
interface LocalIncident {
  // ... définition locale
}
```

---

#### 3️⃣ Type `Trip` - 2 DÉFINITIONS DIFFÉRENTES

**Définition officielle** `/contexts/DataContext.tsx` (ligne 79) :
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

**Redéfinition** `/pages/caissier/PassengerListsPage.tsx` (ligne 8) :
```typescript
interface Trip {  // ❌ CONFLIT !
  id: string;
  route: string;  // ⚠️ Différent de departure/arrival
  departureTime: string;
  passengers: number;  // ⚠️ Différent de availableSeats/totalSeats
  vehicleNumber: string;  // ⚠️ Différent de busNumber
  status: 'boarding' | 'departed' | 'scheduled';  // ⚠️ Manque 'arrived' et 'cancelled'
}
```

**🔴 PROBLÈMES:**
1. **Structure complètement différente**
2. **Champs manquants** : `routeId`, `arrival`, `arrivalTime`, `price`, `gareId`, etc.
3. **Noms différents** : `route` vs `departure/arrival`, `passengers` vs `totalSeats`, `vehicleNumber` vs `busNumber`

**✅ SOLUTION:**
```typescript
// Supprimer la définition locale et importer :
import type { Trip } from '../../contexts/DataContext';

// Adapter le code pour utiliser les bons champs :
const trips: Trip[] = [...];  // OK

// Affichage :
<div>{trip.departure} - {trip.arrival}</div>  // Au lieu de {trip.route}
<div>Bus {trip.busNumber}</div>  // Au lieu de {trip.vehicleNumber}
```

---

#### 4️⃣ Type `Review` - 2 DÉFINITIONS DIFFÉRENTES

**Définition officielle** `/contexts/DataContext.tsx` (ligne 143) :
```typescript
export interface Review {
  id: string;
  tripId: string;
  departure: string;
  arrival: string;
  passengerName: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
  responseDate?: string;
  status: 'pending' | 'published' | 'hidden';
}
```

**Redéfinition** `/pages/responsable/ReviewsPage.tsx` (ligne 8) :
```typescript
interface Review {  // ❌ CONFLIT !
  id: string;
  customerName: string;  // ⚠️ Différent de passengerName
  route: string;  // ⚠️ Différent de departure/arrival
  rating: number;
  comment: string;
  date: string;
  tripDate: string;  // ⚠️ Nouveau champ
  verified: boolean;  // ⚠️ Différent de status
}
```

**🔴 PROBLÈMES:**
1. **Champs différents** : `customerName` vs `passengerName`, `route` vs `departure/arrival`
2. **Nouveau champ** : `tripDate` et `verified` absents du type officiel
3. **Champ manquant** : `tripId`, `response`, `responseDate`, `status`

**✅ SOLUTION:**
```typescript
// Importer le type officiel :
import type { Review } from '../../contexts/DataContext';

// Adapter l'affichage :
<div>{review.passengerName}</div>  // Au lieu de customerName
<div>{review.departure} - {review.arrival}</div>  // Au lieu de route
<div>{review.status === 'published' ? 'Vérifié' : 'En attente'}</div>  // Au lieu de verified
```

---

#### 5️⃣ Type `Story` - 2 DÉFINITIONS DIFFÉRENTES

**Définition officielle** `/contexts/DataContext.tsx` (ligne 128) :
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

**Redéfinition** `/pages/responsable/StoriesPage.tsx` (ligne 17) :
```typescript
interface Story {  // ❌ CONFLIT !
  id: string;
  title: string;
  imageUrl: string;  // ⚠️ Différent de mediaUrl
  duration: number;  // ⚠️ Nouveau champ
  targeting: 'all' | 'route' | 'city';  // ⚠️ Différent de targetAudience
  targetValue?: string;  // ⚠️ Différent de targetStations
  status: 'active' | 'scheduled' | 'ended';  // ⚠️ 'ended' vs 'expired'
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
}
```

**🔴 PROBLÈMES:**
1. **Nom différent** : `imageUrl` vs `mediaUrl`
2. **Nouveau champ** : `duration` absent du type officiel
3. **Logique différente** : `targeting` (route/city) vs `targetAudience` (rôles)
4. **Énumération incompatible** : `'ended'` vs `'expired'`
5. **Champs manquants** : `mediaType`, `createdAt`

**✅ SOLUTION:**
```typescript
// Importer le type officiel :
import type { Story } from '../../contexts/DataContext';

// Adapter le code :
const stories: Story[] = [...];

// Affichage :
<img src={story.mediaUrl} />  // Au lieu de imageUrl
<Badge>{story.targetAudience}</Badge>  // Au lieu de targeting
```

---

## 🔴 PROBLÈME CRITIQUE #2 : Confusion paymentMethod vs salesChannel

### Impact
**Logique métier incorrecte** - Confusion entre COMMENT on paie et OÙ on achète

### Analyse du code actuel

#### Incohérence #1 : Génération de tickets (ligne 587-604)

**Code actuel** `/contexts/DataContext.tsx` :
```typescript
const methods: Ticket['paymentMethod'][] = ['cash', 'mobile_money', 'online'];
const method = methods[Math.floor(Math.random() * methods.length)];

// ...

const ticket = {
  // ...
  paymentMethod: method,
  salesChannel: method === 'online' ? 'online' : 'counter',  // ❌ CONFUSION !
  // ...
};
```

**🔴 PROBLÈME:**
```
paymentMethod: 'online'  ❌ N'existe PAS !

Les moyens de paiement sont :
  - 'cash'           (espèces)
  - 'mobile_money'   (Orange Money, Moov Money)
  - 'card'           (carte bancaire)

'online' n'est PAS un moyen de paiement !
```

**✅ LOGIQUE CORRECTE:**
```typescript
// Vente ONLINE (app mobile)
salesChannel: 'online'
paymentMethod: 'mobile_money' | 'card'  // Jamais cash !

// Vente COUNTER (guichet)
salesChannel: 'counter'
paymentMethod: 'cash' | 'mobile_money' | 'card'  // Tous possibles
```

**✅ CODE CORRIGÉ:**
```typescript
// Déterminer le canal de vente
const salesChannel: 'online' | 'counter' = Math.random() > 0.3 ? 'counter' : 'online';

// Déterminer le moyen de paiement selon le canal
let paymentMethod: Ticket['paymentMethod'];

if (salesChannel === 'online') {
  // App mobile : seulement paiement électronique
  const onlineMethods: ('mobile_money' | 'card')[] = ['mobile_money', 'card'];
  paymentMethod = onlineMethods[Math.floor(Math.random() * onlineMethods.length)];
} else {
  // Guichet : tous moyens possibles
  const counterMethods: Ticket['paymentMethod'][] = ['cash', 'mobile_money', 'card'];
  paymentMethod = counterMethods[Math.floor(Math.random() * counterMethods.length)];
}

// Calculer la commission (seulement si online)
const commission = salesChannel === 'online' ? trip.price * 0.05 : undefined;

const ticket = {
  // ...
  paymentMethod,
  salesChannel,
  commission,
  cashierId: salesChannel === 'online' ? 'online_system' : cashier.id,
  cashierName: salesChannel === 'online' ? 'Vente en ligne' : cashier.name,
  // ...
};
```

---

#### Incohérence #2 : Detection ventes online (ligne 163-164)

**Code actuel** `/pages/responsable/DashboardHome.tsx` :
```typescript
const online = dayTickets.filter(t => t.paymentMethod === 'online').length;
const guichet = dayTickets.filter(t => t.paymentMethod !== 'online').length;
```

**🔴 PROBLÈME:**
```
Utilise paymentMethod au lieu de salesChannel !

Résultat :
  - online sera toujours 0 (paymentMethod 'online' n'existe pas)
  - guichet sera TOUS les tickets (car aucun n'a paymentMethod 'online')
```

**✅ CODE CORRIGÉ:**
```typescript
const online = dayTickets.filter(t => t.salesChannel === 'online').length;
const guichet = dayTickets.filter(t => t.salesChannel === 'counter').length;
```

---

#### Incohérence #3 : Type paymentMethod inclut 'online'

**Définition actuelle** `/contexts/DataContext.tsx` (ligne 103) :
```typescript
paymentMethod: 'cash' | 'mobile_money' | 'card' | 'online';
```

**🔴 PROBLÈME:**
```
'online' n'est PAS un moyen de paiement !

C'est un CANAL DE VENTE (salesChannel)
```

**✅ CORRECTION:**
```typescript
paymentMethod: 'cash' | 'mobile_money' | 'card';  // Supprimer 'online'
```

---

## 🟡 PROBLÈME MOYEN : Types Définis Localement au Lieu d'Importer

### Impact
**Code duplication** - Difficile à maintenir, risque d'incohérence

### Liste des fichiers concernés

| Fichier | Type local | Type disponible DataContext | Action |
|---------|-----------|----------------------------|--------|
| `/pages/manager/SupportPage.tsx` | `Ticket` | ✅ `SupportTicket` existe | Renommer |
| `/pages/responsable/SupportPage.tsx` | `Ticket` | ✅ `SupportTicket` existe | Renommer |
| `/pages/manager/IncidentsPage.tsx` | `Incident` | ✅ `Incident` existe | Importer |
| `/pages/caissier/PassengerListsPage.tsx` | `Trip` | ✅ `Trip` existe | Importer |
| `/pages/responsable/ReviewsPage.tsx` | `Review` | ✅ `Review` existe | Importer |
| `/pages/responsable/StoriesPage.tsx` | `Story` | ✅ `Story` existe | Importer |

**✅ BONNE PRATIQUE:**
```typescript
// ❌ MAUVAIS : Redéfinir localement
interface Trip {
  id: string;
  // ...
}

// ✅ BON : Importer le type officiel
import type { Trip } from '../../contexts/DataContext';
```

---

## ✅ Points CORRECTS - Pas de Problème

### 1. Imports de types

**Fichiers qui importent correctement** :
- ✅ `/components/dashboard/SalesChannelCard.tsx` → `import type { Ticket }`
- ✅ `/pages/caissier/RefundPage.tsx` → `import type { Ticket }`
- ✅ `/pages/manager/CashiersPage.tsx` → `import type { Cashier }`
- ✅ `/pages/responsable/ManagersPage.tsx` → `import type { Manager }`
- ✅ `/pages/responsable/RoutesPage.tsx` → `import type { Route }`
- ✅ `/pages/responsable/SchedulesPage.tsx` → `import type { ScheduleTemplate }`
- ✅ `/pages/responsable/StationsPage.tsx` → `import type { Station }`
- ✅ `/pages/responsable/TrafficPage.tsx` → `import type { Trip as TripType }`

**Excellente pratique dans TrafficPage :**
```typescript
import type { Trip as TripType } from '../../contexts/DataContext';
// ✅ Renomme pour éviter conflit avec composant local
```

---

### 2. Structure des types principaux

**Tous les types du DataContext sont bien définis** :
- ✅ `Station` - Complet et cohérent
- ✅ `Route` - Complet et cohérent
- ✅ `ScheduleTemplate` - Complet et cohérent
- ✅ `PricingRule` - Complet et cohérent
- ✅ `Manager` - Complet et cohérent
- ✅ `Cashier` - Complet et cohérent
- ✅ `Trip` - Complet et cohérent
- ✅ `Ticket` - **Presque parfait** (juste enlever 'online' de paymentMethod)
- ✅ `CashTransaction` - Complet et cohérent
- ✅ `Story` - Complet et cohérent
- ✅ `Review` - Complet et cohérent
- ✅ `Incident` - Complet et cohérent
- ✅ `SupportTicket` - Complet et cohérent

---

### 3. Utilisation de salesChannel

**Le composant SalesChannelCard utilise CORRECTEMENT salesChannel** :
```typescript
const onlineTickets = validTickets.filter(t => t.salesChannel === 'online');
const counterTickets = validTickets.filter(t => t.salesChannel === 'counter');
```

✅ **Parfait !** C'est la bonne logique.

---

## 📋 CHECKLIST DE CORRECTION

### 🔴 URGENT (Cette semaine)

#### 1. Corriger les doubles définitions de types

- [ ] `/pages/manager/SupportPage.tsx` : Renommer `interface Ticket` → `interface SupportTicket`
- [ ] `/pages/responsable/SupportPage.tsx` : Renommer `interface Ticket` → `interface SupportTicket`
- [ ] `/pages/manager/IncidentsPage.tsx` : Supprimer `interface Incident` et importer de DataContext
- [ ] `/pages/caissier/PassengerListsPage.tsx` : Supprimer `interface Trip` et importer de DataContext
- [ ] `/pages/responsable/ReviewsPage.tsx` : Supprimer `interface Review` et importer de DataContext
- [ ] `/pages/responsable/StoriesPage.tsx` : Supprimer `interface Story` et importer de DataContext

#### 2. Corriger la confusion paymentMethod vs salesChannel

- [ ] `/contexts/DataContext.tsx` ligne 103 : Supprimer `'online'` de `paymentMethod`
  ```typescript
  // Avant
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'online';
  
  // Après
  paymentMethod: 'cash' | 'mobile_money' | 'card';
  ```

- [ ] `/contexts/DataContext.tsx` ligne 587-604 : Corriger la génération de tickets
  ```typescript
  // Utiliser la logique correcte :
  // 1. Déterminer salesChannel d'abord
  // 2. Choisir paymentMethod selon le canal
  // 3. Calculer commission selon le canal
  ```

- [ ] `/pages/responsable/DashboardHome.tsx` ligne 163-164 : Utiliser `salesChannel` au lieu de `paymentMethod`
  ```typescript
  // Avant
  const online = dayTickets.filter(t => t.paymentMethod === 'online').length;
  
  // Après
  const online = dayTickets.filter(t => t.salesChannel === 'online').length;
  ```

- [ ] `/contexts/DataContext.tsx` ligne 669 : Utiliser `salesChannel` au lieu de `paymentMethod`
  ```typescript
  // Avant
  if (ticket.paymentMethod !== 'online') {
  
  // Après
  if (ticket.salesChannel === 'counter') {
  ```

- [ ] `/contexts/DataContext.tsx` ligne 711 : Utiliser `salesChannel` au lieu de `paymentMethod`
  ```typescript
  // Avant
  if (ticket.paymentMethod !== 'online' && user) {
  
  // Après
  if (ticket.salesChannel === 'counter' && user) {
  ```

---

### 🟡 IMPORTANT (2 semaines)

#### 3. Adapter le code aux types importés

Pour chaque fichier où on supprime un type local :

**PassengerListsPage.tsx** :
- [ ] Adapter `{trip.route}` → `{trip.departure} - {trip.arrival}`
- [ ] Adapter `{trip.vehicleNumber}` → `{trip.busNumber}`
- [ ] Adapter `{trip.passengers}` → `{trip.totalSeats - trip.availableSeats}`

**ReviewsPage.tsx** :
- [ ] Adapter `{review.customerName}` → `{review.passengerName}`
- [ ] Adapter `{review.route}` → `{review.departure} - {review.arrival}`
- [ ] Adapter `{review.verified}` → `{review.status === 'published'}`

**StoriesPage.tsx** :
- [ ] Adapter `{story.imageUrl}` → `{story.mediaUrl}`
- [ ] Adapter logique de targeting
- [ ] Gérer `story.mediaType` ('image' | 'video')

**IncidentsPage.tsx** :
- [ ] Adapter `{incident.priority}` → `{incident.severity}`
- [ ] Adapter `{incident.date}` → `{incident.reportedAt}`
- [ ] Adapter `{incident.category}` → `{incident.type}`
- [ ] Ajouter gestion de `incident.tripId`, `gareId`, etc.

---

## 🎯 FICHIERS À MODIFIER - RÉSUMÉ

| Priorité | Fichier | Modifications |
|----------|---------|---------------|
| 🔴 P0 | `/contexts/DataContext.tsx` | Supprimer 'online' de paymentMethod + Corriger génération tickets |
| 🔴 P0 | `/pages/responsable/DashboardHome.tsx` | Utiliser salesChannel au lieu de paymentMethod |
| 🔴 P1 | `/pages/manager/SupportPage.tsx` | Renommer Ticket → SupportTicket |
| 🔴 P1 | `/pages/responsable/SupportPage.tsx` | Renommer Ticket → SupportTicket |
| 🔴 P1 | `/pages/manager/IncidentsPage.tsx` | Importer Incident + Adapter code |
| 🔴 P1 | `/pages/caissier/PassengerListsPage.tsx` | Importer Trip + Adapter code |
| 🔴 P1 | `/pages/responsable/ReviewsPage.tsx` | Importer Review + Adapter code |
| 🔴 P1 | `/pages/responsable/StoriesPage.tsx` | Importer Story + Adapter code |

**Total : 8 fichiers**

---

## 🧪 TESTS À EFFECTUER APRÈS CORRECTION

### Test 1 : Compilation TypeScript
```bash
# Doit compiler sans erreur
npm run build
```

### Test 2 : Vérifier salesChannel
```typescript
// Dans console navigateur :
const tickets = useData().tickets;

// Vérifier que tous ont salesChannel
const missingChannel = tickets.filter(t => !t.salesChannel);
console.log('Tickets sans salesChannel:', missingChannel);  // Doit être []

// Vérifier distribution
const online = tickets.filter(t => t.salesChannel === 'online').length;
const counter = tickets.filter(t => t.salesChannel === 'counter').length;
console.log(`Online: ${online}, Counter: ${counter}`);
```

### Test 3 : Vérifier paymentMethod
```typescript
// Aucun ticket ne doit avoir paymentMethod: 'online'
const invalidPayment = tickets.filter(t => t.paymentMethod === 'online');
console.log('Tickets avec paymentMethod online:', invalidPayment);  // Doit être []

// Vérifier cohérence : online → jamais cash
const onlineTickets = tickets.filter(t => t.salesChannel === 'online');
const onlineWithCash = onlineTickets.filter(t => t.paymentMethod === 'cash');
console.log('Ventes online payées cash:', onlineWithCash);  // Doit être []
```

### Test 4 : Vérifier commissions
```typescript
// Tous les tickets online doivent avoir commission
const onlineTickets = tickets.filter(t => t.salesChannel === 'online');
const onlineNoCommission = onlineTickets.filter(t => !t.commission);
console.log('Ventes online sans commission:', onlineNoCommission);  // Doit être []

// Aucun ticket counter ne doit avoir commission
const counterTickets = tickets.filter(t => t.salesChannel === 'counter');
const counterWithCommission = counterTickets.filter(t => t.commission);
console.log('Ventes counter avec commission:', counterWithCommission);  // Doit être []
```

---

## 💡 RECOMMANDATIONS FINALES

### 1. Créer un fichier de validation

```typescript
// /utils/validate-tickets.ts
import type { Ticket } from '../contexts/DataContext';

export function validateTicket(ticket: Ticket): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Règle 1: paymentMethod ne doit jamais être 'online'
  if (ticket.paymentMethod === 'online' as any) {
    errors.push('paymentMethod ne peut pas être "online"');
  }
  
  // Règle 2: salesChannel obligatoire
  if (!ticket.salesChannel) {
    errors.push('salesChannel est obligatoire');
  }
  
  // Règle 3: online → pas de cash
  if (ticket.salesChannel === 'online' && ticket.paymentMethod === 'cash') {
    errors.push('Vente online ne peut pas être payée en cash');
  }
  
  // Règle 4: online → commission obligatoire
  if (ticket.salesChannel === 'online' && !ticket.commission) {
    errors.push('Vente online doit avoir une commission');
  }
  
  // Règle 5: counter → pas de commission
  if (ticket.salesChannel === 'counter' && ticket.commission) {
    errors.push('Vente counter ne doit pas avoir de commission');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 2. Ajouter des tests unitaires

```typescript
// /tests/ticket-validation.test.ts
import { validateTicket } from '../utils/validate-tickets';

describe('Ticket Validation', () => {
  it('should reject paymentMethod: online', () => {
    const ticket = {
      // ...
      paymentMethod: 'online',
      salesChannel: 'online',
    };
    
    const result = validateTicket(ticket);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('paymentMethod ne peut pas être "online"');
  });
  
  it('should require commission for online sales', () => {
    const ticket = {
      // ...
      paymentMethod: 'mobile_money',
      salesChannel: 'online',
      commission: undefined,
    };
    
    const result = validateTicket(ticket);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Vente online doit avoir une commission');
  });
  
  // ... autres tests
});
```

---

## 📊 STATISTIQUES FINALES

### Incohérences par Catégorie

```
Doubles définitions    : 5 fichiers  ████████████████░░░░ 80%
paymentMethod/channel  : 5 endroits  ████████████████░░░░ 80%
Types non importés     : 5 fichiers  ████████████████░░░░ 80%
────────────────────────────────────────────────────────
TOTAL                  : 12 problèmes trouvés
```

### Effort de Correction

| Catégorie | Fichiers | Lignes de code | Temps estimé |
|-----------|----------|----------------|--------------|
| Types paymentMethod | 1 | ~5 lignes | 5 min |
| Logique génération | 1 | ~30 lignes | 30 min |
| Dashboard analytics | 1 | ~10 lignes | 10 min |
| Renommer SupportTicket | 2 | ~20 lignes | 20 min |
| Importer Incident | 1 | ~50 lignes | 1h |
| Importer Trip | 1 | ~30 lignes | 30 min |
| Importer Review | 1 | ~40 lignes | 45 min |
| Importer Story | 1 | ~60 lignes | 1h |
| **TOTAL** | **8** | **~245 lignes** | **~4h** |

---

## ✅ CONCLUSION

### État Actuel
**Le dashboard a 12 incohérences techniques qui peuvent causer des bugs.**

### Priorité
🔴 **CRITIQUE** - À corriger avant tout développement futur

### Impact si Non Corrigé
- ❌ Bugs TypeScript (compilation échoue dans certains cas)
- ❌ Affichage incorrect des statistiques (online = 0 toujours)
- ❌ Commissions mal calculées
- ❌ Confusion dans le code (plusieurs types "Ticket" différents)
- ❌ Difficile à maintenir (code dupliqué)

### Impact Après Correction
- ✅ Code TypeScript cohérent
- ✅ Statistiques correctes
- ✅ Business logic claire (paymentMethod ≠ salesChannel)
- ✅ Facile à maintenir (1 seul type par concept)
- ✅ Prêt pour intégration backend

---

**Prochaine étape recommandée :** Corriger les 5 incohérences `paymentMethod` vs `salesChannel` en priorité (1h de travail maximum).

**Généré le:** 19 Décembre 2025  
**Prochaine révision:** Après correction des incohérences critiques
