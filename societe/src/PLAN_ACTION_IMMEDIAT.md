# 🔧 PLAN D'ACTION - Corrections Immédiates

## 🎯 Objectif
Éliminer les duplications critiques et garantir la cohérence des calculs financiers entre les 3 rôles.

---

## ✅ ÉTAPE 1 : Corriger AnalyticsPage.tsx (CRITIQUE)

### Problème actuel
12 duplications de code identifiées dans `/pages/responsable/AnalyticsPage.tsx` :

**Ligne 149** : `tickets.filter(t => t.status === 'valid' || t.status === 'used')`
**Ligne 175** : `tickets.filter(t => t.gareId === station.id && (t.status === 'valid' || t.status === 'used'))`
**Ligne 177** : `stationTickets.reduce((sum, t) => sum + t.price, 0)`
**Ligne 200** : `tickets.filter(t => t.status === 'valid' || t.status === 'used').length`
**Ligne 207-214** : Filtrage online/counter dupliqué
**Ligne 216-217** : `.reduce((sum, t) => sum + t.price, 0)` × 2
**Ligne 218** : `.reduce((sum, t) => sum + (t.commission || 0), 0)`

### Corrections à appliquer

```tsx
// AVANT (ligne 149)
const validTickets = tickets.filter(t => t.status === 'valid' || t.status === 'used');

// APRÈS
import { getValidTickets } from '../../utils/statsUtils';
const validTickets = getValidTickets(tickets);
```

```tsx
// AVANT (ligne 175-177)
const stationTickets = tickets.filter(t => 
  t.gareId === station.id && 
  (t.status === 'valid' || t.status === 'used')
);
const ventes = stationTickets.reduce((sum, t) => sum + t.price, 0);

// APRÈS
import { getValidTickets, calculateTicketsRevenue } from '../../utils/statsUtils';
const stationTickets = getValidTickets(tickets.filter(t => t.gareId === station.id));
const ventes = calculateTicketsRevenue(stationTickets);
```

```tsx
// AVANT (ligne 207-218)
const onlineTickets = tickets.filter(t => 
  t.salesChannel === 'online' && 
  (t.status === 'valid' || t.status === 'used')
);
const counterTickets = tickets.filter(t => 
  t.salesChannel === 'counter' && 
  (t.status === 'valid' || t.status === 'used')
);
const onlineRevenue = onlineTickets.reduce((sum, t) => sum + t.price, 0);
const counterRevenue = counterTickets.reduce((sum, t) => sum + t.price, 0);
const onlineCommission = onlineTickets.reduce((sum, t) => sum + (t.commission || 0), 0);

// APRÈS
import { calculateRevenueByChannel } from '../../utils/statsUtils';
const channelStats = calculateRevenueByChannel(tickets);
// channelStats contient : { onlineRevenue, counterRevenue, totalRevenue, totalCommission, onlinePercentage, counterPercentage }
```

**Fichier** : `/pages/responsable/AnalyticsPage.tsx`
**Lignes à modifier** : 149, 173-177, 200, 207-218
**Temps estimé** : 20 minutes

---

## ✅ ÉTAPE 2 : Corriger RefundPage.tsx

### Problème actuel
**Ligne 157** : Calcul manuel du montant total

```tsx
// AVANT
{formatCurrency(refundableTickets.reduce((sum, t) => sum + t.price, 0))}

// APRÈS
import { calculateTicketsRevenue } from '../../utils/statsUtils';
{formatCurrency(calculateTicketsRevenue(refundableTickets))}
```

**Fichier** : `/pages/caissier/RefundPage.tsx`
**Ligne** : 157
**Temps estimé** : 2 minutes

---

## ✅ ÉTAPE 3 : Améliorer DashboardHome (Responsable)

### Problème actuel
**Ligne 72-75** : Filtre manuel des tickets par station

```tsx
// AVANT (ligne 72-75)
const stationTickets = tickets.filter(t => {
  const purchaseDate = new Date(t.purchaseDate);
  return t.gareId === station.id && purchaseDate >= today && (t.status === 'valid' || t.status === 'used');
});

// APRÈS
import { getValidTickets, filterByToday } from '../../utils/statsUtils';
const todayTickets = filterByToday(tickets, 'purchaseDate');
const stationTickets = getValidTickets(todayTickets.filter(t => t.gareId === station.id));
```

**Fichier** : `/pages/responsable/DashboardHome.tsx`
**Lignes** : 72-75
**Temps estimé** : 5 minutes

---

## ✅ ÉTAPE 4 : Ajouter SalesChannelCard dans Manager Dashboard

### Problème actuel
Manager ne voit PAS la distinction online/counter, alors que c'est CRITIQUE pour le business model

### Solution
```tsx
// /pages/manager/DashboardHome.tsx
import SalesChannelCard from '../../components/dashboard/SalesChannelCard';

// Dans le JSX, après les stats principales
<SalesChannelCard tickets={tickets} />
```

**Fichier** : `/pages/manager/DashboardHome.tsx`
**Position** : Après la grid des stats (ligne ~135)
**Temps estimé** : 3 minutes

---

## ✅ ÉTAPE 5 : Ajouter distinction Canal dans Caissier Dashboard

### Problème actuel
Caissier ne voit pas SES ventes online vs counter

### Solution
```tsx
// /pages/caissier/DashboardHome.tsx
import { useMemo } from 'react';
import { countTicketsBySalesChannel } from '../../utils/statsUtils';

// Après les stats existantes
const mySalesChannel = useMemo(() => {
  return countTicketsBySalesChannel(
    tickets.filter(t => t.cashierId === user?.id)
  );
}, [tickets, user]);

// Ajouter une Card pour afficher online vs counter
<Card className="p-6">
  <h3 className="text-lg font-semibold mb-4">Mes Ventes par Canal</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-sm text-gray-600">App Mobile</p>
      <p className="text-2xl font-bold text-[#f59e0b]">{mySalesChannel.online}</p>
    </div>
    <div>
      <p className="text-sm text-gray-600">Guichet</p>
      <p className="text-2xl font-bold text-[#16a34a]">{mySalesChannel.counter}</p>
    </div>
  </div>
</Card>
```

**Fichier** : `/pages/caissier/DashboardHome.tsx`
**Position** : Dans la grid sous les ventes récentes
**Temps estimé** : 10 minutes

---

## ✅ ÉTAPE 6 : Créer Fonction Centralisée pour Occupancy

### Problème actuel
Calcul de l'occupancy dupliqué dans :
- AnalyticsPage ligne 202-204
- Probablement dans d'autres pages

### Solution
Ajouter dans `/utils/statsUtils.ts` :

```tsx
/**
 * Calcule le taux d'occupation total des trips
 * @param trips - Liste des trips
 * @returns Taux d'occupation en %
 */
export const calculateOverallOccupancy = (trips: Trip[]): number => {
  const totalSeats = trips.reduce((sum, t) => sum + t.totalSeats, 0);
  const occupiedSeats = trips.reduce((sum, t) => sum + (t.totalSeats - t.availableSeats), 0);
  return totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
};

/**
 * Calcule le taux d'occupation d'un trip spécifique
 * @param trip - Trip à analyser
 * @returns Taux d'occupation en %
 */
export const calculateTripOccupancy = (trip: Trip): number => {
  const occupied = trip.totalSeats - trip.availableSeats;
  return trip.totalSeats > 0 ? Math.round((occupied / trip.totalSeats) * 100) : 0;
};
```

**Utilisation dans AnalyticsPage** :
```tsx
// AVANT (ligne 202-204)
const totalSeats = trips.reduce((sum, t) => sum + t.totalSeats, 0);
const occupiedSeats = trips.reduce((sum, t) => sum + (t.totalSeats - t.availableSeats), 0);
const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

// APRÈS
import { calculateOverallOccupancy } from '../../utils/statsUtils';
const occupancyRate = calculateOverallOccupancy(trips);
```

**Fichier** : `/utils/statsUtils.ts`
**Temps estimé** : 5 minutes

---

## 📋 CHECKLIST COMPLÈTE

### Phase 1 : Corrections Immédiates (45 minutes)

- [ ] **1.1** Corriger AnalyticsPage ligne 149 (getValidTickets)
- [ ] **1.2** Corriger AnalyticsPage ligne 173-177 (station tickets + revenue)
- [ ] **1.3** Corriger AnalyticsPage ligne 200 (getValidTickets)
- [ ] **1.4** Corriger AnalyticsPage ligne 207-218 (calculateRevenueByChannel)
- [ ] **1.5** Corriger AnalyticsPage ligne 202-204 (calculateOverallOccupancy)
- [ ] **2.1** Corriger RefundPage ligne 157
- [ ] **3.1** Corriger DashboardHome (Responsable) ligne 72-75
- [ ] **4.1** Ajouter SalesChannelCard dans Manager Dashboard
- [ ] **5.1** Ajouter distinction canal dans Caissier Dashboard
- [ ] **6.1** Créer calculateOverallOccupancy dans statsUtils.ts

### Phase 2 : Tests de Validation (15 minutes)

- [ ] **T1** Vérifier cohérence des revenus entre Responsable, Manager, Caissier
- [ ] **T2** Vérifier affichage online/counter dans les 3 dashboards
- [ ] **T3** Tester RefundPage avec montants réels
- [ ] **T4** Vérifier que les stats de gares sont cohérentes
- [ ] **T5** Valider le calcul d'occupancy global

### Phase 3 : Documentation (10 minutes)

- [ ] **D1** Mettre à jour AUDIT_COMPLET.md avec "✅ Corrigé"
- [ ] **D2** Créer STATS_FUNCTIONS_USAGE.md avec exemples
- [ ] **D3** Ajouter JSDoc manquant dans statsUtils.ts

---

## 📊 IMPACT ATTENDU

### Avant les corrections
- 🔴 12 duplications dans AnalyticsPage
- 🔴 Calculs manuels partout
- 🔴 Manager et Caissier ne voient pas online/counter
- 🔴 Risque d'incohérences financières

### Après les corrections
- ✅ 0 duplication dans AnalyticsPage
- ✅ Fonctions centralisées utilisées partout
- ✅ Business model visible dans les 3 dashboards
- ✅ Cohérence financière garantie

---

## 🚀 EXÉCUTION

### Ordre d'exécution recommandé
1. **ÉTAPE 6 d'abord** : Créer calculateOverallOccupancy (prérequis pour AnalyticsPage)
2. **ÉTAPE 1** : Corriger AnalyticsPage (le plus critique)
3. **ÉTAPE 2** : Corriger RefundPage (rapide)
4. **ÉTAPE 3** : Corriger DashboardHome Responsable
5. **ÉTAPE 4** : Ajouter SalesChannelCard Manager
6. **ÉTAPE 5** : Ajouter canal Caissier
7. **Phase 2** : Tests
8. **Phase 3** : Documentation

### Prochaines phases (après validation)
- **Phase 4** : Créer useAnalyticsStats hook (refactorisation profonde)
- **Phase 5** : Analyser pages restantes (Pricing, Routes, etc.)
- **Phase 6** : Tests unitaires pour statsUtils.ts
- **Phase 7** : Documentation BUSINESS_RULES.md

---

## 📝 NOTES

### Fonctions disponibles dans statsUtils.ts (à utiliser)
```tsx
✅ getValidTickets(tickets)
✅ calculateTicketsRevenue(tickets)
✅ calculateRevenueByChannel(tickets)
✅ countTicketsBySalesChannel(tickets)
✅ calculateSalesChannelPercentage(tickets)
✅ getSoldSeatsCount(trip)
✅ getTripValidTickets(tickets, tripId)
✅ filterByToday(items, dateField)
✅ filterByYesterday(items, dateField)
```

### Imports à ajouter
```tsx
import {
  getValidTickets,
  calculateTicketsRevenue,
  calculateRevenueByChannel,
  countTicketsBySalesChannel,
  calculateOverallOccupancy
} from '../../utils/statsUtils';
```

---

**Temps total estimé : 70 minutes (1h10)**
**Priorité : IMMÉDIATE**
**Risque : FINANCIER**
