# Mobile Services Refactoring - Migration Guide

## 🎯 Objectives

✅ **Unified Architecture**: Mobile now matches Societe's Backend-Ready pattern
✅ **Zero Duplication**: Single `services/types.ts` source of truth (replaces models.ts + api.ts duplicates)
✅ **Coherent Structure**: Both projects share identical patterns

## 📁 New Structure

```
src/
├── services/
│   ├── index.ts                    ← CENTRAL EXPORT (use this!)
│   ├── config.ts                   ← Configuration + endpoints
│   ├── types.ts                    ← UNIFIED TYPES (source of truth)
│   ├── storage/
│   │   └── localStorage.service.ts ← Persistence layer
│   └── api/
│       ├── index.ts                ← API services export
│       ├── apiClient.ts            ← HTTP client
│       ├── auth.service.ts         ← Authentication
│       ├── trip.service.ts         ← Trip search
│       ├── ticket.service.ts       ← Ticket management
│       ├── booking.service.ts      ← Booking management
│       ├── payment.service.ts      ← Payment processing
│       ├── operator.service.ts     ← Operator data
│       ├── station.service.ts      ← Station data
│       ├── story.service.ts        ← Stories/advertising
│       ├── vehicle.service.ts      ← Vehicle tracking
│       ├── review.service.ts       ← User reviews
│       └── support.service.ts      ← Support & incidents
├── hooks/
│   └── useApiState.ts              ← Central state hook
└── (pages, components, etc.)
```

## 🔄 Migration Steps

### Step 1: Update Imports in Pages

**BEFORE** (Old pattern):
```typescript
import { getTripById, searchTrips } from '@/lib/api';
import { Trip, Ticket } from '@/data/models';
```

**AFTER** (New pattern):
```typescript
import { tripService } from '@/services/api';
import type { Trip } from '@/services/types';
// Or simpler:
import { tripService, Trip } from '@/services';
```

### Step 2: Replace Direct API Calls with Services

**BEFORE**:
```typescript
const trips = await getTripById(tripId);
```

**AFTER**:
```typescript
const trips = await tripService.getTripById(tripId);
```

### Step 3: Use Central Hook for State

**BEFORE**:
```typescript
const [trips, setTrips] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  searchTrips(params).then(setTrips).finally(() => setLoading(false));
}, [params]);
```

**AFTER**:
```typescript
const { data: trips, loading } = useApiState(
  () => tripService.searchTrips(params),
  params
);
```

## 🔑 Key Services

### Authentication
```typescript
import { authService } from '@/services';

await authService.login({ email, password });
await authService.logout();
const user = await authService.getCurrentUser();
```

### Trip Search
```typescript
import { tripService } from '@/services';

const trips = await tripService.searchTrips({
  from: stationId1,
  to: stationId2,
  date: '2024-12-20',
  passengers: 1,
});

const seats = await tripService.getTripSeats(tripId);
```

### Booking
```typescript
import { bookingService, paymentService } from '@/services';

// Create hold booking (10 min TTL)
const booking = await bookingService.createHoldBooking({
  tripId,
  seatNumbers: ['A1', 'A2'],
  selectedServices: ['meal'],
});

// Confirm with payment
const ticket = await bookingService.confirmBooking({
  bookingId: booking.id,
  paymentMethod: 'ORANGE_MONEY',
});
```

### Tickets
```typescript
import { ticketService } from '@/services';

const tickets = await ticketService.getMyTickets();
const ticket = await ticketService.getTicketById(ticketId);
await ticketService.cancelTicket(ticketId);
const download = await ticketService.downloadTicket(ticketId);
```

### Operators
```typescript
import { operatorService } from '@/services';

const operators = await operatorService.getOperators();
const services = await operatorService.getOperatorServices(operatorId);
const stories = await operatorService.getOperatorStories(operatorId);
```

### Support
```typescript
import { supportService } from '@/services';

await supportService.sendSupportMessage({
  subject: 'Booking issue',
  message: 'I have a problem...',
  category: 'BOOKING',
});

const incident = await supportService.reportIncident({
  type: 'VEHICLE_ISSUE',
  severity: 'HIGH',
  description: 'Vehicle problem',
});
```

## 🧪 Dual-Mode Development

All services support **dual-mode**:

- **Development** (`isDevelopment() = true`): Uses localStorage + mock data
- **Production** (`isDevelopment() = false`): Calls real backend API

### Enable/Disable Mock Data
```typescript
// In src/services/config.ts
const FEATURE_FLAGS = {
  forceMockData: false,    // Set to true to always use mock
  debugMode: false,        // Enable console logging
  logRequests: false,      // Log all API requests
};
```

## 📝 Types - Single Source of Truth

All types are now in `services/types.ts`:

```typescript
import type {
  // User/Auth
  User, UserProfile,
  
  // Locations
  Station, Route,
  
  // Business entities
  Trip, Segment, Booking, Ticket,
  Operator, OperatorService, OperatorStory,
  Payment, Review, Incident,
  
  // Request/Response
  TripSearchParams, CreateHoldBookingParams,
  ConfirmBookingParams, TransferTicketParams,
  
  // Enums
  TicketStatus, TripStatus, BookingStatus,
  PaymentStatus, PaymentMethod, UserRole,
} from '@/services';
```

### No Duplication!
- ❌ Don't use types from `models.ts` anymore
- ❌ Don't define types in components
- ✅ Always import from `services/types.ts`

## 🧩 Components using New Services

### Example: TripSearchPage

```typescript
import React from 'react';
import { useApiState } from '@/hooks';
import { tripService, Trip } from '@/services';

export function TripSearchPage() {
  const [params, setParams] = React.useState({
    from: '', to: '', date: '', passengers: 1
  });

  const { data: trips, loading } = useApiState(
    () => tripService.searchTrips(params),
    params
  );

  return (
    <div>
      {loading ? <div>Loading...</div> : (
        <ul>
          {trips?.map((trip: Trip) => (
            <li key={trip.id}>{trip.from} → {trip.to}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## ⚠️ Things to Avoid

### ❌ Don't mix old and new patterns
```typescript
// BAD
import { getTripById } from '@/lib/api';      // Old
import { tripService } from '@/services';     // New
// Don't use both!
```

### ❌ Don't import types from multiple places
```typescript
// BAD
import { Trip } from '@/data/models';
import type { Trip } from '@/services/types';
// Use only ONE source!
```

### ❌ Don't bypass the services
```typescript
// BAD - calls API directly
fetch('/api/trips').then(r => r.json())

// GOOD - uses service
tripService.searchTrips(params)
```

## 📊 Migration Checklist

For each page/component:

- [ ] Replace `import from @/lib/api` with `import from @/services`
- [ ] Replace `import from @/data/models` with `import from @/services/types`
- [ ] Replace direct API calls with service methods
- [ ] Replace useState + useEffect with `useApiState`
- [ ] Test functionality (build should pass, no runtime errors)

## 🔗 Build Validation

After migration, run:

```bash
npm run build
# Expected: ✓ built with 0 errors
```

## 📚 Additional Resources

- **API_ENDPOINTS**: [services/config.ts](./config.ts) - All backend endpoints
- **Type Definitions**: [services/types.ts](./types.ts) - All interfaces/enums
- **Hooks**: [hooks/useApiState.ts](../hooks/useApiState.ts) - State management
- **Config**: [services/config.ts](./config.ts) - Feature flags, environment

## 🆘 Troubleshooting

### Import errors
```typescript
// If "Cannot find module"
// Make sure to export from services/index.ts
export { myService } from './api/my.service';
```

### Types not found
```typescript
// All types should be in services/types.ts
// If missing, add:
export interface MyType { ... }
```

### Build errors
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
npm run build
```

## ✅ Success Criteria

- ✅ All pages updated to use new services
- ✅ npm run build: 0 errors
- ✅ No imports from lib/api.ts or data/models.ts (except cleanup)
- ✅ Single source of truth for types (services/types.ts)
- ✅ Consistent patterns across all pages
- ✅ Mobile matches Societe architecture
