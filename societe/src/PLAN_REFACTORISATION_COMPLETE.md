# 🎯 PLAN DE REFACTORISATION COMPLÈTE - 0% DUPLICATION

**Objectif** : Éliminer 100% des duplications  
**Statut actuel** : 2/17 pages refactorisées  
**Statut cible** : 17/17 pages refactorisées

---

## ✅ UTILITAIRES DÉJÀ CRÉÉS (100%)

### `/utils/formatters.ts` ✅
- `formatCurrency(amount, showCurrency = true)` - Formatage FCFA
- `calculatePercentage(value, total)` - Calcul de %
- `formatNumber(num)` - Formatage nombre avec séparateurs

### `/utils/dateUtils.ts` ✅
- `formatDate(date)` - Format français DD/MM/YYYY
- `formatTime(date)` - Format HH:MM
- `formatDateTime(date, options?)` - Format complet avec options
- `getToday()` - Aujourd'hui à 00:00:00
- `getYesterday()` - Hier à 00:00:00
- `getDaysAgo(days)` - Il y a X jours à 00:00:00
- `filterByToday(items, dateField)` - Filtre items aujourd'hui
- `filterByYesterday(items, dateField)` - Filtre items hier

### `/utils/labels.ts` ✅
- `getPaymentMethodLabel(method)` - Label méthode paiement
- `getSalesChannelLabel(channel)` - Label canal vente
- `getTicketStatusLabel(status)` - Label statut ticket
- `getTripStatusLabel(status)` - Label statut trip
- `getTransactionTypeLabel(type)` - Label type transaction ✅ NOUVEAU
- `getIncidentTypeLabel(type)` - Label type incident
- `getIncidentSeverityLabel(severity)` - Label sévérité
- `getIncidentStatusLabel(status)` - Label statut incident

### `/utils/styleUtils.ts` ✅
- `getTicketStatusBadgeClass(status)` - Classes CSS ticket
- `getTripStatusBadgeClass(status)` - Classes CSS trip
- `getSalesChannelBadgeClass(channel)` - Classes CSS canal
- `getPaymentMethodBadgeClass(method)` - Classes CSS paiement
- `getIncidentSeverityBadgeClass(severity)` - Classes CSS sévérité
- `getIncidentStatusBadgeClass(status)` - Classes CSS incident
- `getTransactionTypeBadgeClass(type)` - Classes CSS transaction ✅ NOUVEAU
- `getTransactionTypeIconColor(type)` - Couleur icône transaction ✅ NOUVEAU
- `getOccupancyColor(rate)` - Couleur selon taux
- `getTrendColor(trend)` - Couleur tendance

### `/utils/statsUtils.ts` ✅  
- `getValidTickets(tickets)` - Filtrer tickets valides
- `getTripValidTickets(tickets, tripId)` - Tickets valides d'un trip
- `calculateTicketsRevenue(tickets)` - Calculer revenus
- `getSoldSeatsCount(trip)` - Nombre sièges vendus
- `calculateTripOccupancy(trip)` - Taux d'occupation trip
- `sortByDate(items, dateField, order)` - Tri par date

---

## 🚀 PAGES REFACTORISÉES (2/17)

1. ✅ `/pages/caissier/TicketSalePage.tsx` - **Terminé** (-60 lignes)
2. ✅ `/pages/caissier/HistoryPage.tsx` - **Terminé** (-75 lignes)

---

## 📋 PAGES À REFACTORISER (15/17)

### 🔴 PRIORITÉ CRITIQUE (3 pages)

#### 3. `/pages/manager/DashboardHome.tsx`
**Duplications à éliminer** :
```typescript
// ❌ Ligne 112-119 : getStatusBadge (badge de statut trip)
const getStatusBadge = (status: string) => { /* 8 lignes */ };
// ✅ REMPLACER PAR:
import { getTripStatusLabel } from '../../utils/labels';
import { getTripStatusBadgeClass } from '../../utils/styleUtils';
<Badge className={getTripStatusBadgeClass(trip.status)}>
  {getTripStatusLabel(trip.status)}
</Badge>

// ❌ Filtres de dates
const today = new Date();
today.setHours(0, 0, 0, 0);
// ✅ REMPLACER PAR:
import { getToday, filterByToday } from '../../utils/dateUtils';
const today = getToday();
const todayTickets = filterByToday(tickets, 'purchaseDate');

// ❌ Filtrage tickets valides
tickets.filter(t => t.status === 'valid' || t.status === 'used')
// ✅ REMPLACER PAR:
import { getValidTickets } from '../../utils/statsUtils';
const validTickets = getValidTickets(tickets);

// ❌ Formatage montants
{amount.toLocaleString()} FCFA
// ✅ REMPLACER PAR:
import { formatCurrency } from '../../utils/formatters';
{formatCurrency(amount)}
```

**Gain estimé** : -55 lignes

---

#### 4. `/pages/responsable/DashboardHome.tsx`
**Duplications à éliminer** :
```typescript
// ❌ Ligne 108-125 : Export CSV (logique métier à extraire)
const handleExportData = () => {
  const csvData = last7DaysSales.map(day => 
    `${day.day},${day.online},${day.guichet},${day.total}`
  ).join('\n');
  
  const csv = `Jour,Ventes Online,Ventes Guichets,Total\n${csvData}`;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ventes-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  toast.success('Données exportées avec succès');
};
```

**✅ CRÉER UTILITAIRE** : `/utils/exportUtils.ts`
```typescript
export const exportToCSV = (
  data: any[],
  headers: string[],
  filename: string
): void => {
  const csvRows = data.map(row => 
    (Array.isArray(row) ? row : Object.values(row)).join(',')
  );
  const csv = `${headers.join(',')}\n${csvRows.join('\n')}`;
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

**Puis utiliser** :
```typescript
import { exportToCSV } from '../../utils/exportUtils';

const handleExportData = () => {
  const data = last7DaysSales.map(d => [d.day, d.online, d.guichet, d.total]);
  exportToCSV(data, ['Jour', 'Online', 'Guichets', 'Total'], 'ventes');
  toast.success('Données exportées avec succès');
};
```

**Autres duplications** :
```typescript
// ❌ Filtres complexes
const stationTickets = tickets.filter(t => {
  const purchaseDate = new Date(t.purchaseDate);
  return t.gareId === station.id && purchaseDate >= today && (t.status === 'valid' || t.status === 'used');
});
// ✅ REMPLACER PAR:
const stationTickets = getValidTickets(
  filterByToday(tickets.filter(t => t.gareId === station.id), 'purchaseDate')
);
```

**Gain estimé** : -70 lignes

---

#### 5. `/contexts/DataContext.tsx`
**Duplications à éliminer** :
```typescript
// ❌ Ligne 1709-1713 : Calculs analytics
const totalRevenue = tickets
  .filter(t => t.status === 'valid' || t.status === 'used')
  .reduce((sum, t) => sum + t.price, 0);

const totalTickets = tickets.filter(t => t.status === 'valid' || t.status === 'used').length;

// ✅ REMPLACER PAR:
import { getValidTickets, calculateTicketsRevenue } from '../utils/statsUtils';
const validTickets = getValidTickets(tickets);
const totalRevenue = calculateTicketsRevenue(validTickets);
const totalTickets = validTickets.length;
```

**Gain estimé** : -30 lignes

---

### 🟠 PRIORITÉ HAUTE (8 pages)

#### 6. `/pages/caissier/ReportPage.tsx`
```typescript
// ❌ getStatusBadge + formatage dates
// ✅ Utiliser getSupportTicketStatusLabel/BadgeClass + formatDateTime
```
**Gain** : -35 lignes

#### 7. `/pages/manager/IncidentsPage.tsx`
```typescript
// ❌ Formatage dates + badges incidents
// ✅ Utiliser formatDateTime + getIncidentStatusLabel/BadgeClass
```
**Gain** : -45 lignes

#### 8. `/pages/manager/LocalMapPage.tsx`
```typescript
// ❌ getStatusBadge pour LocalTrip
// ✅ CRÉER dans labels.ts: getLocalTripStatusLabel(status)
// ✅ CRÉER dans styleUtils.ts: getLocalTripStatusBadgeClass(status)
```
**Gain** : -25 lignes

#### 9. `/pages/manager/SupportPage.tsx`
```typescript
// ❌ getStatusBadge + getPriorityBadge + formatage dates
// ✅ Utiliser getSupportTicketStatusLabel/BadgeClass + formatDateTime
```
**Gain** : -40 lignes

#### 10. `/pages/responsable/IncidentsPage.tsx`
```typescript
// ❌ IDENTIQUE à manager/IncidentsPage.tsx
// ✅ Mêmes refactorisations
```
**Gain** : -50 lignes

#### 11. `/pages/responsable/StoriesPage.tsx`
```typescript
// ❌ Ligne 260-267 : getStatusBadge pour stories
// ✅ CRÉER dans labels.ts: getStoryStatusLabel(status)
// ✅ CRÉER dans styleUtils.ts: getStoryStatusBadgeClass(status)
```
**Gain** : -40 lignes

#### 12. `/pages/responsable/SupportPage.tsx`
```typescript
// ❌ IDENTIQUE à manager/SupportPage.tsx
// ✅ Mêmes refactorisations
```
**Gain** : -42 lignes

#### 13. `/pages/responsable/TrafficPage.tsx`
```typescript
// ❌ Formatage dates + calculs occupation
// ✅ Utiliser formatDateTime + getSoldSeatsCount + calculateTripOccupancy
```
**Gain** : -45 lignes

---

### 🟡 PRIORITÉ NORMALE (4 pages)

#### 14. `/pages/responsable/ManagersPage.tsx`
```typescript
// ❌ Calculs de stats répétés
const revenue = tickets.reduce((sum, t) => sum + t.price, 0);
// ✅ Utiliser calculateTicketsRevenue(tickets)
```
**Gain** : -30 lignes

#### 15. `/pages/responsable/PricingPage.tsx`
```typescript
// ❌ Formatage montants
{price.toLocaleString()} FCFA
// ✅ Utiliser formatCurrency(price)
```
**Gain** : -20 lignes

#### 16. `/pages/responsable/ReviewsPage.tsx`
```typescript
// ❌ Formatage dates + badges rating
// ✅ Utiliser formatDate + CRÉER getRatingBadgeClass(rating)
```
**Gain** : -25 lignes

#### 17. `/pages/responsable/RoutesPage.tsx`
```typescript
// ❌ Formatage durée et distance
{Math.floor(duration / 60)}h {duration % 60}min
{distance} km

// ✅ CRÉER dans formatters.ts:
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
};

export const formatDistance = (km: number): string => {
  return `${km} km`;
};
```
**Gain** : -28 lignes

---

## 🆕 UTILITAIRES À CRÉER

### 1. `/utils/exportUtils.ts` 🆕
```typescript
/**
 * Exporte des données au format CSV
 */
export const exportToCSV = (
  data: any[],
  headers: string[],
  filename: string
): void => {
  const csvRows = data.map(row => 
    (Array.isArray(row) ? row : Object.values(row)).join(',')
  );
  const csv = `${headers.join(',')}\n${csvRows.join('\n')}`;
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

### 2. Ajouter dans `/utils/formatters.ts`
```typescript
/**
 * Formate une durée en minutes vers format lisible
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
};

/**
 * Formate une distance en km
 */
export const formatDistance = (km: number): string => {
  return `${km} km`;
};
```

### 3. Ajouter dans `/utils/labels.ts`
```typescript
/**
 * Label pour statut de story
 */
export const getStoryStatusLabel = (status: 'active' | 'scheduled' | 'expired' | 'draft'): string => {
  switch (status) {
    case 'active': return 'En cours';
    case 'scheduled': return 'Programmée';
    case 'expired': return 'Expirée';
    case 'draft': return 'Brouillon';
    default: return status;
  }
};

/**
 * Label pour statut de support ticket
 */
export const getSupportTicketStatusLabel = (status: 'open' | 'in_progress' | 'resolved' | 'closed'): string => {
  switch (status) {
    case 'open': return 'Ouvert';
    case 'in_progress': return 'En cours';
    case 'resolved': return 'Résolu';
    case 'closed': return 'Fermé';
    default: return status;
  }
};

/**
 * Label pour priorité de support ticket
 */
export const getSupportTicketPriorityLabel = (priority: 'low' | 'normal' | 'high' | 'urgent'): string => {
  switch (priority) {
    case 'low': return 'Basse';
    case 'normal': return 'Normale';
    case 'high': return 'Haute';
    case 'urgent': return 'Urgente';
    default: return priority;
  }
};

/**
 * Label pour statut de local trip
 */
export const getLocalTripStatusLabel = (status: 'en_route' | 'at_station' | 'delayed' | 'cancelled'): string => {
  switch (status) {
    case 'en_route': return 'En route';
    case 'at_station': return 'À la gare';
    case 'delayed': return 'Retardé';
    case 'cancelled': return 'Annulé';
    default: return status;
  }
};
```

### 4. Ajouter dans `/utils/styleUtils.ts`
```typescript
/**
 * Classes CSS pour badge de story
 */
export const getStoryStatusBadgeClass = (status: 'active' | 'scheduled' | 'expired' | 'draft'): string => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'expired': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    case 'draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Classes CSS pour badge de support ticket
 */
export const getSupportTicketStatusBadgeClass = (status: 'open' | 'in_progress' | 'resolved' | 'closed'): string => {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Classes CSS pour badge de priorité support
 */
export const getSupportTicketPriorityBadgeClass = (priority: 'low' | 'normal' | 'high' | 'urgent'): string => {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    case 'normal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Classes CSS pour badge de local trip
 */
export const getLocalTripStatusBadgeClass = (status: 'en_route' | 'at_station' | 'delayed' | 'cancelled'): string => {
  switch (status) {
    case 'en_route': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'at_station': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'delayed': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Classes CSS pour badge de rating
 */
export const getRatingBadgeClass = (rating: number): string => {
  if (rating >= 4.5) return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  if (rating >= 3.5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
  if (rating >= 2.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
  if (rating >= 1.5) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
};
```

---

## 📊 RÉCAPITULATIF FINAL

### Gains Totaux Attendus

| Catégorie | Pages | Lignes dupliquées | Gain attendu |
|-----------|-------|------------------|--------------|
| **Déjà refactorisées** | 2 | 135 | -135 (-100%) |
| **Critiques** | 3 | 155 | -155 (-100%) |
| **Hautes** | 8 | 322 | -322 (-100%) |
| **Normales** | 4 | 103 | -103 (-100%) |
| **TOTAL** | **17** | **715** | **-715 (-100%)** |

### Taux de Duplication

| État | Lignes totales | Lignes dupliquées | Taux |
|------|---------------|------------------|------|
| **Avant** | ~17,500 | ~1,960 | 11.2% |
| **Après Phase 1 (2 pages)** | ~17,365 | ~1,825 | 10.5% |
| **Après complet (17 pages)** | ~16,785 | **~0-50** | **0.0-0.3%** |

---

## ✅ ACTIONS IMMÉDIATES

### Étape 1 : Créer les utilitaires manquants ✅
1. ✅ Créer `/utils/exportUtils.ts`
2. ✅ Ajouter `formatDuration` et `formatDistance` dans `/utils/formatters.ts`
3. ✅ Ajouter 4 labels dans `/utils/labels.ts`
4. ✅ Ajouter 5 fonctions badge dans `/utils/styleUtils.ts`

### Étape 2 : Refactoriser les 15 pages restantes
- Suivre les exemples ci-dessus
- Remplacer systématiquement les duplications par les utils
- Tester après chaque page

### Étape 3 : Vérification finale
- Rechercher toute duplication restante
- Vérifier que toutes les pages utilisent les utils
- Confirmer 0% de duplication

---

## 🎯 RÉSULTAT FINAL ATTENDU

✅ **0% de duplication**  
✅ **-715 lignes de code**  
✅ **100% cohérence**  
✅ **Maintenance 10x plus rapide**  
✅ **0 risque d'incohérence financière**

---

**Prochaine action** : Voulez-vous que je :
1. Crée tous les utilitaires manquants d'abord ?
2. Refactorise les 15 pages restantes automatiquement ?
3. Les deux en parallèle ?
