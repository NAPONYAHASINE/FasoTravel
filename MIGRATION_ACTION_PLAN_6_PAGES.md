# 🔧 ACTION PLAN: Fix Mobile Pages (6 pages to migrate)

## Pages to Migrate (6 Total)

| Page | Old Import | Issue | Priority |
|------|-----------|-------|----------|
| OperatorDetailPage.tsx | `../lib/api` | markStoryAsViewed | 🟡 Medium |
| OperatorsPage.tsx | `../lib/api` | markStoryAsViewed | 🟡 Medium |
| SearchResultsPage.tsx | `../data/models` | Trip type | 🔴 High |
| SeatSelectionPage.tsx | `../data/models` | TRIPS mock | 🔴 High |
| TicketDetailPage.tsx | `../lib/api` + `../data/models` | Ticket + api | 🔴 High |
| TicketsPage.tsx | `../data/models` + `../lib/api` | Ticket + api | 🔴 High |

---

## Migration Path

### Step 1: Update Imports
Replace old imports with new services imports

**BEFORE:**
```typescript
import { Trip } from '../data/models';
import * as api from '../lib/api';
```

**AFTER:**
```typescript
import { tripService, storyService } from '@/services';
import type { Trip } from '@/services/types';
```

### Step 2: Replace Mock Data
Use service mock data instead of local mocks

**BEFORE:**
```typescript
import { TRIPS } from '../data/models';
const trips = TRIPS;
```

**AFTER:**
```typescript
const trips = await tripService.searchTrips(params);
```

### Step 3: Replace API Calls
Use services instead of direct API calls

**BEFORE:**
```typescript
const result = await markStoryAsViewed(storyId);
```

**AFTER:**
```typescript
const result = await storyService.markStoryViewed(storyId);
```

---

## Detailed Migration for Each Page

### 1. OperatorDetailPage.tsx
**Current Import:**
```typescript
import { markStoryAsViewed } from '../lib/api';
```

**Fix:**
```typescript
import { storyService } from '@/services';

// Replace
const result = await markStoryAsViewed(storyId);
// With
const result = await storyService.markStoryViewed(storyId);
```

**Complexity**: 🟡 Low (1 function)

---

### 2. OperatorsPage.tsx
**Current Import:**
```typescript
import { markStoryAsViewed } from '../lib/api';
```

**Fix:**
```typescript
import { storyService } from '@/services';

// Replace all markStoryAsViewed calls
// With storyService.markStoryViewed
```

**Complexity**: 🟡 Low (1 function)

---

### 3. SearchResultsPage.tsx
**Current Import:**
```typescript
import { Trip } from '../data/models';
```

**Fix:**
```typescript
import type { Trip } from '@/services/types';

// Replace
import { Trip } from '../data/models';
// With
import type { Trip } from '@/services/types';
```

**Complexity**: 🟢 Very Low (type only)

---

### 4. SeatSelectionPage.tsx
**Current Import:**
```typescript
import { TRIPS } from '../data/models';
```

**Fix:**
```typescript
import { tripService } from '@/services';

// Replace mock data fetch
const trips = await tripService.searchTrips({
  from: params.from,
  to: params.to,
  date: params.date,
});
```

**Complexity**: 🟡 Low (mock data → service)

---

### 5. TicketDetailPage.tsx
**Current Imports:**
```typescript
import * as api from '../lib/api';
import { Ticket, MOCK_TICKETS } from '../data/models';
```

**Fix:**
```typescript
import { ticketService } from '@/services';
import type { Ticket } from '@/services/types';

// Replace API calls
// api.cancelTicket(id) → ticketService.cancelTicket(id)
// api.transferTicket(params) → ticketService.transferTicket(params)
// etc.
```

**Complexity**: 🟠 Medium (multiple API calls)

---

### 6. TicketsPage.tsx
**Current Imports:**
```typescript
import { Ticket } from '../data/models';
import * as api from '../lib/api';
```

**Fix:**
```typescript
import { ticketService } from '@/services';
import type { Ticket } from '@/services/types';

// Replace
const tickets = await api.getMyTickets();
// With
const tickets = await ticketService.getMyTickets();
```

**Complexity**: 🟠 Medium (multiple API calls)

---

## Quick Reference: Service Migrations

### Story Service
```typescript
// OLD
import { markStoryAsViewed } from '../lib/api';
await markStoryAsViewed(storyId);

// NEW
import { storyService } from '@/services';
await storyService.markStoryViewed(storyId);
```

### Ticket Service
```typescript
// OLD
import * as api from '../lib/api';
const tickets = await api.getMyTickets();
const ticket = await api.getTicketById(id);

// NEW
import { ticketService } from '@/services';
const tickets = await ticketService.getMyTickets();
const ticket = await ticketService.getTicketById(id);
```

### Trip Service
```typescript
// OLD
import { TRIPS } from '../data/models';
const trips = TRIPS;

// NEW
import { tripService } from '@/services';
const trips = await tripService.searchTrips(params);
```

### Type Imports
```typescript
// OLD
import { Trip, Ticket } from '../data/models';

// NEW
import type { Trip, Ticket } from '@/services/types';
```

---

## Validation Steps

After each page migration:

1. ✅ Replace imports
2. ✅ Replace API calls with service methods
3. ✅ Replace types with unified types
4. ✅ Remove mock data imports
5. ✅ Build: `npm run build` in Mobile folder
6. ✅ Should see: 0 errors
7. ✅ Test page functionality

---

## Success Criteria

```
✅ All 6 pages migrated
✅ No imports from ../lib/api remaining
✅ No imports from ../data/models remaining
✅ All imports from @/services
✅ npm run build: 0 errors
✅ Types from @/services/types
✅ No duplicate types in use
```

---

## Estimated Effort

| Page | Effort | Time |
|------|--------|------|
| OperatorDetailPage | 🟢 Low | 5 min |
| OperatorsPage | 🟢 Low | 5 min |
| SearchResultsPage | 🟢 Very Low | 2 min |
| SeatSelectionPage | 🟡 Low | 10 min |
| TicketDetailPage | 🟠 Medium | 15 min |
| TicketsPage | 🟠 Medium | 15 min |
| **TOTAL** | | **52 min** |

---

## Notes

- After migration complete, `/lib/api.ts` and `/data/models.ts` can be safely removed
- This completes the refactoring cycle
- Mobile and Societe will then have PERFECT cohesion
- All types unified in single source
- All services using new pattern

---

**Status**: 🔴 URGENT - Blocks full cohesion  
**Next**: Execute migrations one by one
