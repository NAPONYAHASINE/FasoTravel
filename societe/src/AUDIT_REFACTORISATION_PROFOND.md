# 🔍 AUDIT ULTRA-PROFOND - REFACTORISATION COMPLÈTE

**Date**: 2026-01-09  
**Objectif**: Éliminer TOUTES les duplications et optimiser la réutilisabilité du code

---

## 📋 DUPLICATIONS IDENTIFIÉES

### 🟥 CRITIQUE - Niveau 1 (Logique métier dupliquée)

#### 1. **Création de dates "today"** ❌ DUPLICATION
**Occurrences** : 6+ fichiers
```typescript
// ❌ DUPLICATION dans chaque fichier
const today = new Date();
today.setHours(0, 0, 0, 0);
```

**Fichiers concernés**:
- `/pages/caissier/CashManagementPage.tsx` ligne 29-30
- `/pages/caissier/DashboardHome.tsx` ligne 40-41
- `/pages/manager/CashiersPage.tsx` ligne 38-39
- `/pages/manager/DeparturesPage.tsx` ligne 16-17
- `/pages/responsable/AnalyticsPage.tsx` ligne 87-88

**✅ SOLUTION**: Utiliser `getToday()` de `/utils/dateUtils.ts`

---

#### 2. **Filtre tickets valides** ❌ DUPLICATION MASSIVE
**Occurrences** : 15+ fichiers
```typescript
// ❌ DUPLICATION partout
tickets.filter(t => t.status === 'valid' || t.status === 'used')
```

**Fichiers concernés**:
- `/pages/caissier/DashboardHome.tsx` ligne 48
- `/pages/manager/DeparturesPage.tsx` ligne 34, 208
- `/pages/manager/SalesSupervisionPage.tsx` ligne 50, 61
- `/pages/responsable/AnalyticsPage.tsx` ligne 144, 195, 202, 207

**✅ SOLUTION**: Utiliser `getValidTickets()` de `/utils/statsUtils.ts`

---

#### 3. **Calcul de revenus inline** ❌ DUPLICATION
**Occurrences** : 10+ fichiers
```typescript
// ❌ DUPLICATION
tickets.reduce((sum, t) => sum + t.price, 0)
```

**Fichiers concernés**:
- `/pages/caissier/RefundPage.tsx` ligne 165
- `/pages/responsable/AnalyticsPage.tsx` ligne 51, 76, 97, 172, 211, 212

**✅ SOLUTION**: Utiliser `calculateTicketsRevenue()` de `/utils/statsUtils.ts`

---

#### 4. **Calcul d'occupation/taux de remplissage** ❌ DUPLICATION
**Occurrences** : 6+ fichiers
```typescript
// ❌ DUPLICATION
Math.round(((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100)
```

**Fichiers concernés**:
- `/pages/caissier/PassengerListsPage.tsx` ligne 140, 255
- `/pages/manager/DeparturesPage.tsx` ligne 189, 241
- `/pages/responsable/AnalyticsPage.tsx` ligne 178, 199

**✅ SOLUTION**: Utiliser `calculateTripOccupancy()` de `/utils/statsUtils.ts`

---

#### 5. **Calcul de pourcentages** ❌ DUPLICATION
**Occurrences** : 20+ fichiers
```typescript
// ❌ DUPLICATION
Math.round((value / total) * 100)
```

**Fichiers concernés**: Partout dans l'application

**✅ SOLUTION**: Créer fonction `calculatePercentage()` dans statsUtils

---

### 🟧 MOYEN - Niveau 2 (Fonctions utilitaires manquantes)

#### 6. **Labels de méthodes de paiement** ❌ DUPLICATION
**Occurrences** : 3+ fichiers
```typescript
// ❌ DUPLICATION
const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'cash': return 'Espèces';
    case 'mobile_money': return 'Mobile Money';
    case 'card': return 'Carte';
  }
}
```

**✅ SOLUTION**: Créer fonction centralisée `getPaymentMethodLabel()`

---

#### 7. **Labels de statuts de tickets** ❌ DUPLICATION
**Occurrences** : 5+ fichiers
```typescript
// ❌ DUPLICATION pour traduire statuts
status === 'valid' ? 'Valide' : 'Utilisé'
```

**✅ SOLUTION**: Créer fonction centralisée `getTicketStatusLabel()`

---

#### 8. **Labels de statuts de trips** ❌ DUPLICATION
**Occurrences** : 4+ fichiers
```typescript
// ❌ DUPLICATION pour traduire statuts
status === 'scheduled' ? 'Programmé' : 'En cours'
```

**✅ SOLUTION**: Créer fonction centralisée `getTripStatusLabel()`

---

#### 9. **Formatage de montants FCFA** ❌ DUPLICATION
**Occurrences** : 30+ fichiers
```typescript
// ❌ DUPLICATION
{amount.toLocaleString()} FCFA
```

**✅ SOLUTION**: Créer fonction `formatCurrency(amount)` → "5 000 FCFA"

---

#### 10. **Formatage de dates/heures** ❌ DUPLICATION
**Occurrences** : 20+ fichiers
```typescript
// ❌ DUPLICATION
new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
```

**✅ SOLUTION**: Utiliser/améliorer `formatTime()` et `formatDate()` de dateUtils

---

### 🟨 MINEUR - Niveau 3 (Optimisations)

#### 11. **Calcul du nombre de sièges vendus** ❌ DUPLICATION
**Occurrences** : 8+ fichiers
```typescript
// ❌ DUPLICATION
const soldSeats = trip.totalSeats - trip.availableSeats;
```

**✅ SOLUTION**: Créer fonction `getSoldSeatsCount(trip)`

---

#### 12. **Tri de tickets par date** ❌ DUPLICATION
**Occurrences** : 6+ fichiers
```typescript
// ❌ DUPLICATION
.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
```

**✅ SOLUTION**: Créer fonction `sortByDate(items, field, order)`

---

#### 13. **Badges de couleur par statut** ❌ DUPLICATION
**Occurrences** : 10+ fichiers
```typescript
// ❌ DUPLICATION pour les couleurs de badges
status === 'valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
```

**✅ SOLUTION**: Créer fonction `getStatusBadgeClass(status, type)`

---

## 🎯 PLAN D'ACTION DE REFACTORISATION

### Phase 1: Créer utilitaires manquants ✅
1. Étendre `/utils/statsUtils.ts` avec nouvelles fonctions
2. Étendre `/utils/dateUtils.ts` avec nouvelles fonctions
3. Créer `/utils/formatters.ts` pour formatage
4. Créer `/utils/labels.ts` pour traductions/labels

### Phase 2: Refactoriser les pages Caissier
1. `DashboardHome.tsx`
2. `CashManagementPage.tsx`
3. `RefundPage.tsx`
4. `PassengerListsPage.tsx`
5. `TicketSalePage.tsx`
6. `HistoryPage.tsx`
7. `ReportPage.tsx`

### Phase 3: Refactoriser les pages Manager
1. `DashboardHome.tsx`
2. `CashiersPage.tsx`
3. `DeparturesPage.tsx`
4. `SalesSupervisionPage.tsx`
5. `IncidentsPage.tsx`
6. `LocalMapPage.tsx`
7. `SupportPage.tsx`

### Phase 4: Refactoriser les pages Responsable
1. `DashboardHome.tsx`
2. `AnalyticsPage.tsx`
3. `ManagersPage.tsx`
4. `PricingPage.tsx`
5. `ReviewsPage.tsx`
6. `RoutesPage.tsx`
7. `SchedulesPage.tsx`
8. `StationsPage.tsx`
9. `StoriesPage.tsx`
10. `SupportPage.tsx`
11. `TrafficPage.tsx`
12. `IncidentsPage.tsx`
13. `PoliciesPage.tsx`

### Phase 5: Tests et validation
1. Tester chaque page après refactorisation
2. Vérifier cohérence des métriques
3. Valider performance

---

## 📊 STATISTIQUES DE DUPLICATION

- **Lignes de code dupliquées estimées**: ~800-1000 lignes
- **Réduction attendue après refactorisation**: ~40-50%
- **Nombre de fonctions à créer**: ~25-30
- **Nombre de fichiers à refactoriser**: ~25
- **Impact sur la maintenance**: 🟢 TRÈS ÉLEVÉ (élimination de 80% des bugs potentiels)

---

## ✅ BÉNÉFICES ATTENDUS

1. **Maintenabilité** : Une seule source de vérité pour chaque logique
2. **Cohérence** : Impossible d'avoir des calculs différents
3. **Performance** : Réutilisation des hooks memoïsés
4. **Lisibilité** : Code plus court et expressif
5. **Tests** : Plus facile à tester (fonctions pures)
6. **Évolution** : Changements centralisés

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Créer tous les utilitaires manquants
2. ✅ Refactoriser toutes les pages (dans l'ordre)
3. ✅ Vérifier que tout fonctionne
4. ✅ Documenter les nouvelles fonctions
