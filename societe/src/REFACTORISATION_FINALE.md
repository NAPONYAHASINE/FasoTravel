# 🎯 REFACTORISATION FINALE - Élimination complète des duplications

## ✅ PAGES DÉJÀ TERMINÉES (3/17)
1. ✅ `/pages/caissier/TicketSalePage.tsx`
2. ✅ `/pages/caissier/HistoryPage.tsx`  
3. ✅ `/pages/manager/DashboardHome.tsx`

---

## 🔄 PAGES RESTANTES À REFACTORISER (14/17)

### Pages avec `getStatusBadge` à remplacer (10 pages)

#### `/pages/caissier/PassengerListsPage.tsx`
```typescript
// ❌ SUPPRIMER ligne 80-88
const getStatusBadge = (status: Trip['status']) => { ... };

// ✅ AJOUTER dans imports
import { getTripStatusLabel } from '../../utils/labels';
import { getTripStatusBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER ligne 149 et 199
{getStatusBadge(trip.status)}
// PAR:
<Badge className={getTripStatusBadgeClass(trip.status)}>
  {getTripStatusLabel(trip.status)}
</Badge>
```

#### `/pages/caissier/ReportPage.tsx`
```typescript
// ❌ SUPPRIMER ligne 64-72
const getStatusBadge = (status: string) => { ... };

// ❌ SUPPRIMER ligne 74-82
const getPriorityBadge = (priority: string) => { ... };

// ✅ AJOUTER dans imports
import { getSupportTicketStatusLabel, getSupportTicketPriorityLabel } from '../../utils/labels';
import { getSupportTicketStatusBadgeClass, getSupportTicketPriorityBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER ligne 222-223
{getStatusBadge(ticket.status)}
{getPriorityBadge(ticket.priority)}
// PAR:
<Badge className={getSupportTicketStatusBadgeClass(ticket.status)}>
  {getSupportTicketStatusLabel(ticket.status)}
</Badge>
<Badge className={getSupportTicketPriorityBadgeClass(ticket.priority)}>
  {getSupportTicketPriorityLabel(ticket.priority)}
</Badge>
```

#### `/pages/manager/DeparturesPage.tsx`
```typescript
// ❌ SUPPRIMER ligne 97-104
const getStatusBadge = (status: string) => { ... };

// ✅ AJOUTER dans imports  
import { getTripStatusLabel } from '../../utils/labels';
import { getTripStatusBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER lignes 224, 308
{getStatusBadge(trip.status)}
// PAR:
<Badge className={getTripStatusBadgeClass(trip.status)}>
  {getTripStatusLabel(trip.status)}
</Badge>
```

#### `/pages/manager/LocalMapPage.tsx`
```typescript
// ❌ SUPPRIMER ligne 92-100
const getStatusBadge = (status: LocalTrip['status']) => { ... };

// ✅ AJOUTER dans imports
import { getLocalTripStatusLabel } from '../../utils/labels';
import { getLocalTripStatusBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER ligne 222
{getStatusBadge(trip.status)}
// PAR:
<Badge className={getLocalTripStatusBadgeClass(trip.status)}>
  {getLocalTripStatusLabel(trip.status)}
</Badge>
```

#### `/pages/manager/SupportPage.tsx`
```typescript
// ❌ SUPPRIMER ligne 69-77
const getStatusBadge = (status: string) => { ... };

// ❌ SUPPRIMER ligne 79-87
const getPriorityBadge = (priority: string) => { ... };

// ✅ AJOUTER dans imports
import { getSupportTicketStatusLabel, getSupportTicketPriorityLabel } from '../../utils/labels';
import { getSupportTicketStatusBadgeClass, getSupportTicketPriorityBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER ligne 205-206
{getStatusBadge(ticket.status)}
{getPriorityBadge(ticket.priority)}
// PAR:
<Badge className={getSupportTicketStatusBadgeClass(ticket.status)}>
  {getSupportTicketStatusLabel(ticket.status)}
</Badge>
<Badge className={getSupportTicketPriorityBadgeClass(ticket.priority)}>
  {getSupportTicketPriorityLabel(ticket.priority)}
</Badge>
```

#### `/pages/responsable/StoriesPage.tsx`
```typescript
// ❌ SUPPRIMER ligne 260-268
const getStatusBadge = (status: typeof stories[0]['status']) => { ... };

// ✅ AJOUTER dans imports
import { getStoryStatusLabel } from '../../utils/labels';
import { getStoryStatusBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER ligne 375
{getStatusBadge(story.status)}
// PAR:
<Badge className={getStoryStatusBadgeClass(story.status)}>
  {getStoryStatusLabel(story.status)}
</Badge>
```

#### `/pages/responsable/SupportPage.tsx`
```typescript
// ❌ SUPPRIMER ligne 69-77
const getStatusBadge = (status: string) => { ... };

// ❌ SUPPRIMER ligne 79-87
const getPriorityBadge = (priority: string) => { ... };

// ✅ AJOUTER dans imports
import { getSupportTicketStatusLabel, getSupportTicketPriorityLabel } from '../../utils/labels';
import { getSupportTicketStatusBadgeClass, getSupportTicketPriorityBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER ligne 247-248
{getStatusBadge(ticket.status)}
{getPriorityBadge(ticket.priority)}
// PAR:
<Badge className={getSupportTicketStatusBadgeClass(ticket.status)}>
  {getSupportTicketStatusLabel(ticket.status)}
</Badge>
<Badge className={getSupportTicketPriorityBadgeClass(ticket.priority)}>
  {getSupportTicketPriorityLabel(ticket.priority)}
</Badge>
```

### Pages avec formatage dates/montants (4 pages)

#### `/pages/responsable/DashboardHome.tsx`
```typescript
// ✅ AJOUTER dans imports
import { formatCurrency } from '../../utils/formatters';
import { formatDateTime, filterByToday, getToday } from '../../utils/dateUtils';
import { getValidTickets, calculateTicketsRevenue } from '../../utils/statsUtils';

// ✅ REMPLACER partout
{amount.toLocaleString()} FCFA
// PAR:
{formatCurrency(amount)}

// ✅ REMPLACER filtres de dates
const today = new Date(); today.setHours(0,0,0,0);
// PAR:
const today = getToday();

// ✅ REMPLACER filtres tickets valides  
tickets.filter(t => t.status === 'valid' || t.status === 'used')
// PAR:
getValidTickets(tickets)
```

#### `/pages/manager/IncidentsPage.tsx`
```typescript
// ✅ AJOUTER dans imports
import { formatDateTime } from '../../utils/dateUtils';
import { getIncidentTypeLabel, getIncidentSeverityLabel, getIncidentStatusLabel } from '../../utils/labels';
import { getIncidentSeverityBadgeClass, getIncidentStatusBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER partout
new Date(incident.reportedAt).toLocaleString('fr-FR')
// PAR:
formatDateTime(incident.reportedAt)
```

#### `/pages/responsable/IncidentsPage.tsx`
```typescript
// Identique à manager/IncidentsPage.tsx
import { formatDateTime } from '../../utils/dateUtils';
import { getIncidentTypeLabel, getIncidentSeverityLabel, getIncidentStatusLabel } from '../../utils/labels';
import { getIncidentSeverityBadgeClass, getIncidentStatusBadgeClass } from '../../utils/styleUtils';
```

#### `/pages/responsable/TrafficPage.tsx`
```typescript
// ✅ AJOUTER dans imports
import { formatDateTime, formatTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';
import { calculateTripOccupancy, getSoldSeatsCount } from '../../utils/statsUtils';

// ✅ REMPLACER
new Date(trip.departureTime).toLocaleString('fr-FR')
// PAR:
formatDateTime(trip.departureTime)

// ✅ REMPLACER calculs d'occupation
const occupancyRate = ((trip.totalSeats - trip.availableSeats) / trip.totalSeats) * 100;
// PAR:
const occupancyRate = calculateTripOccupancy(trip);
```

### Pages avec stats et calculs (4 pages)

#### `/pages/responsable/ManagersPage.tsx`
```typescript
// ✅ AJOUTER dans imports
import { calculateTicketsRevenue, getValidTickets } from '../../utils/statsUtils';
import { formatCurrency } from '../../utils/formatters';

// ✅ REMPLACER
const revenue = tickets.reduce((sum, t) => sum + t.price, 0);
// PAR:
const revenue = calculateTicketsRevenue(tickets);

// ✅ REMPLACER
{revenue.toLocaleString()} FCFA
// PAR:
{formatCurrency(revenue)}
```

#### `/pages/responsable/PricingPage.tsx`
```typescript
// ✅ AJOUTER dans imports
import { formatCurrency } from '../../utils/formatters';

// ✅ REMPLACER partout
{price.toLocaleString()} FCFA
// PAR:
{formatCurrency(price)}
```

#### `/pages/responsable/ReviewsPage.tsx`
```typescript
// ✅ AJOUTER dans imports
import { formatDate } from '../../utils/dateUtils';
import { getRatingBadgeClass } from '../../utils/styleUtils';

// ✅ REMPLACER
new Date(review.createdAt).toLocaleDateString('fr-FR')
// PAR:
formatDate(review.createdAt)
```

#### `/pages/responsable/RoutesPage.tsx`
```typescript
// ✅ AJOUTER dans imports
import { formatDuration, formatDistance } from '../../utils/formatters';

// ✅ REMPLACER
{Math.floor(duration / 60)}h {duration % 60}min
// PAR:
{formatDuration(duration)}

// ✅ REMPLACER
{distance} km
// PAR:
{formatDistance(distance)}
```

---

## 📊 RÉSUMÉ FINAL ATTENDU

| Page | Duplication initiale | Gain | Statut |
|------|---------------------|------|--------|
| TicketSalePage | 60 lignes | -60 | ✅ Terminé |
| HistoryPage | 75 lignes | -75 | ✅ Terminé |
| DashboardHome (manager) | 55 lignes | -55 | ✅ Terminé |
| PassengerListsPage | 25 lignes | -25 | 🔄 À faire |
| ReportPage | 35 lignes | -35 | 🔄 À faire |
| DeparturesPage | 30 lignes | -30 | 🔄 À faire |
| LocalMapPage | 25 lignes | -25 | 🔄 À faire |
| SupportPage (manager) | 40 lignes | -40 | 🔄 À faire |
| StoriesPage | 40 lignes | -40 | 🔄 À faire |
| SupportPage (responsable) | 42 lignes | -42 | 🔄 À faire |
| DashboardHome (responsable) | 70 lignes | -70 | 🔄 À faire |
| IncidentsPage (manager) | 45 lignes | -45 | 🔄 À faire |
| IncidentsPage (responsable) | 50 lignes | -50 | 🔄 À faire |
| TrafficPage | 45 lignes | -45 | 🔄 À faire |
| ManagersPage | 30 lignes | -30 | 🔄 À faire |
| PricingPage | 20 lignes | -20 | 🔄 À faire |
| ReviewsPage | 25 lignes | -25 | 🔄 À faire |
| RoutesPage | 28 lignes | -28 | 🔄 À faire |

**Total : -840 lignes dupliquées**  
**Taux de duplication : 0%** ✅
