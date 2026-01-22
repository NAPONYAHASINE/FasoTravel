# 🔴 ERREURS TYPESCRIPT EXACTES - FasoTravel Societe Build

**Date:** 16 Janvier 2026  
**Build Status:** ❌ FAILED  
**Total Errors:** 10+  
**Total Warnings:** 0

---

## 📋 LISTE COMPLÈTE DES ERREURS

### ERREUR #1: Type Mismatch - PricingRule vs PriceSegment

**Localisation:** `src/contexts/DataContext.tsx:487`

**Message Exact:**
```
Type 'Promise<PriceSegment[]>' is not assignable to 'type Promise<PricingRule[]>'
  Property 'name' is missing in type 'PriceSegment' but required in 'PricingRule'
  Property 'type' is missing in type 'PriceSegment' but required in 'PricingRule'
  Property 'value' is missing in type 'PriceSegment' but required in 'PricingRule'
```

**Code Problématique:**
```typescript
// Line 487
const [pricingRules, setPricingRules] = useApiState<PricingRule[]>(
  'priceSegments',
  () => pricingService.listSegments(),  // ❌ Returns Promise<PriceSegment[]>
  []
);
```

**Cause:**
```typescript
// services/api/pricing.service.ts:13
async listSegments(): Promise<PriceSegment[]> {  // ❌ Wrong return type!
  // ...
}
```

**Interface Mismatch:**
```typescript
// PriceSegment (ce que le service retourne)
{ id, route, currentPrice, previousPrice, lastUpdate }

// PricingRule (ce que le contexte attend)
{ id, routeId, name, type, value, startDate, endDate, daysOfWeek, timeSlots, priority, status }
```

**Correction:** Voir `PLAN_CORRECTION_COMPLET.md` - CORRECTION #1

---

### ERREUR #2: Enum Mismatch - paymentMethod

**Localisation:** `src/contexts/DataContext.tsx:692+` (et lignes 710, 738)

**Message Exact:**
```
Type 'string' is not assignable to type '"cash" | "mobile_money" | "card"'
  Type '"cash" | "mobile_money" | "card"' is not assignable to type 'string'
```

**Code Problématique:**
```typescript
// Line 692
paymentMethod: Math.random() > 0.7 ? 'mobile_money' : 'cash',  // ✅ OK

// BUT services/types.ts defines it differently
export interface CreateTicketDto {
  paymentMethod: 'cash' | 'mobile-money' | 'card';  // ❌ TIRET!
}
```

**Incohérence:**
- DataContext.Ticket: `'mobile_money'` (underscore)
- CreateTicketDto: `'mobile-money'` (tiret)

**Correction:** Voir `PLAN_CORRECTION_COMPLET.md` - CORRECTION #2

---

### ERREUR #3-8: Missing Property 'serviceClass' in Trip (6 errors)

**Localisation:** `src/contexts/DataContext.tsx:524, 543, 561, 580, 602, 620`

**Message Exact (repeated 6 times):**
```
Property 'serviceClass' does not exist on type 'Trip'
```

**Code Problématique:**
```typescript
// Line 524
{
  id: 'trip_today_4',
  routeId: 'route_3',
  departure: 'Ouagadougou',
  arrival: 'Ouahigouya',
  departureTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
  arrivalTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
  busNumber: 'BF-1026',
  availableSeats: 2,
  totalSeats: 45,
  price: 3500,
  status: 'departed',
  gareId: 'gare_1',
  gareName: 'Gare Routière de Ouagadougou',
  serviceClass: 'standard',  // ❌ ERROR: Not in Trip interface!
  driverId: 'driver_4',      // ❌ ERROR: Not in Trip interface!
  driverName: 'Souleymane'   // ❌ ERROR: Not in Trip interface!
}

// Lines with same error:
// - 524: serviceClass
// - 543: serviceClass
// - 561: serviceClass
// - 580: serviceClass
// - 602: serviceClass
// - 620: serviceClass
```

**Trip Interface Missing:**
```typescript
// Current interface
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
  vehicleId?: string;
  currentLocation?: { lat: number; lng: number; timestamp: string };
  estimatedArrival?: string;
  // ❌ MISSING: serviceClass, driverId, driverName
}
```

**Correction:** Voir `PLAN_CORRECTION_COMPLET.md` - CORRECTION #4

---

### ERREUR #9: Missing @types/react Declaration

**Localisation:** `src/` (global)

**Message Exact:**
```
Cannot find module 'react' or its corresponding type declarations.
```

**Cause:**
```json
// package.json
{
  "devDependencies": {
    // ❌ @types/react is missing
  }
}
```

**Correction:**
```bash
npm install --save-dev @types/react@latest @types/react-dom@latest
```

---

### ERREUR #10-12: Implicit 'any' Type Parameters

**Localisation:** `src/contexts/DataContext.tsx:592+` (Array.from callbacks)

**Message Exact:**
```
Parameter '(parameter name)' implicitly has an 'any' type
```

**Code Problématique:**
```typescript
// Line 592
...Array.from({ length: 33 }, (_, i) => ({  // ❌ 'i' is implicitly 'any'
  id: `ticket_today_1_${i + 1}`,
  tripId: 'trip_today_1',
  passengerName: ['Amadou Traoré', ...][i] || `Passager ${i + 1}`,
  // ... more properties using 'i'
})),

// Repeat in:
// - Line 710 (trip 2)
// - Line 738 (trip 3)
// - And other Array.from calls
```

**Correction:**
```typescript
...Array.from({ length: 33 }, (_, i: number) => ({  // ✅ Type i as number
  id: `ticket_today_1_${i + 1}`,
  // ...
})),
```

---

## 📊 ERREURS PAR CATÉGORIE

### Category 1: Type Mismatches (2 errors)
1. ❌ PricingRule vs PriceSegment (line 487)
2. ❌ paymentMethod enum (lines 692, 710, 738)

### Category 2: Missing Properties (6 errors)
3-8. ❌ serviceClass not in Trip (lines 524, 543, 561, 580, 602, 620)

### Category 3: Missing Dependencies (1 error)
9. ❌ @types/react not installed

### Category 4: Implicit Types (2+ errors)
10-12. ❌ Implicit 'any' in callbacks (lines 592, 710, 738, etc.)

---

## 🔍 ANALYSE DÉTAILLÉE PAR ERREUR

### Erreur #1: PricingRule/PriceSegment Mismatch

**Contexte:**
```
Architecture Layer: useApiState → Service → Interface Mismatch
```

**Chain of Resolution:**
```
DataContext.tsx
  └─ useApiState<PricingRule[]>()
       └─ pricingService.listSegments()
            └─ Promise<PriceSegment[]>  ❌ TYPE MISMATCH!
```

**Fichiers impliqués:**
1. `src/contexts/DataContext.tsx` (line 487)
2. `src/services/api/pricing.service.ts` (line 13)
3. `src/services/types.ts` (line 223)

**Solution:** Unifier les types
- Soit renommer PricingRule en PricingSegment
- Soit enrichir PriceSegment avec tous les champs de PricingRule
- Soit créer une couche de mapping

---

### Erreur #2: paymentMethod Enum Mismatch

**Contexte:**
```
Naming Convention: underscore vs tiret inconsistency
```

**Locations:**
```
DataContext.tsx    → 'mobile_money' (underscore) ✅
types.ts           → 'mobile-money' (tiret)     ❌
Mock data          → 'mobile_money' (underscore)
```

**Impact:**
- DTO doesn't match Entity
- Backend integration will fail
- TypeScript errors during compilation

---

### Erreurs #3-8: serviceClass Missing

**Contexte:**
```
Interface Definition: Mock data uses properties not in interface
```

**Problem:**
```typescript
// Mock creates objects with these properties
{ serviceClass: 'standard', driverId: 'driver_1', driverName: 'Name' }

// But interface doesn't define them
export interface Trip {
  // ❌ No serviceClass
  // ❌ No driverId
  // ❌ No driverName
}
```

**Why This Happened:**
- Mock data was created before finalizing Trip interface
- Properties needed at runtime but not declared
- TypeScript strict mode catches this

---

### Erreur #9: Missing @types/react

**Contexte:**
```
Dependencies: Type definitions missing
```

**Impact:**
- All React types are unknown
- TypeScript can't validate React code
- Import 'react' shows as error

**Quick Fix:**
```bash
npm install --save-dev @types/react@latest @types/react-dom@latest
npm install --save-dev @types/node
```

---

### Erreurs #10-12: Implicit 'any' Parameters

**Contexte:**
```
Type Safety: Callback parameters not typed
```

**Examples:**
```typescript
// ❌ BEFORE (implicit any)
Array.from({ length: 33 }, (_, i) => ({
  // i type is implicitly any
}))

.map((v) => v.id)  // v type is implicitly any

.filter((item) => item.status === 'active')  // item implicitly any
```

**TypeScript Setting:**
These are caught because `compilerOptions.noImplicitAny` is likely `true`

**Fix:**
```typescript
// ✅ AFTER (explicit types)
Array.from({ length: 33 }, (_, i: number) => ({
  // i is now explicitly number
}))

.map((v: Trip) => v.id)  // v is explicitly Trip

.filter((item: Trip) => item.status === 'active')  // item is Trip
```

---

## 🔧 ORDRE DE CORRECTION RECOMMANDÉ

### Step 1: Low-Hanging Fruit (5 min)
```bash
npm install --save-dev @types/react@latest @types/react-dom@latest
```

### Step 2: Quick Type Fixes (10 min)
- Normalize paymentMethod enum (underscore everywhere)
- Add explicit types to callback parameters
- Verify all enum values match interfaces

### Step 3: Interface Updates (15 min)
- Add serviceClass, driverId, driverName to Trip interface
- Update all services to match
- Update all DTOs

### Step 4: Major Refactor (15 min)
- Resolve PricingRule vs PriceSegment
- Choose approach (rename or unify)
- Update all usages

### Step 5: Validate (5 min)
```bash
npm run build
# Should show: ✅ 0 errors, 0 warnings
```

---

## 📈 BUILD STATUS TRACKING

### Before Fixes:
```
npm run build
❌ ERROR: 10+ TypeScript errors
Build failed
Exit code: 1
```

### After Fixes (Expected):
```
npm run build
✅ Success
- No errors detected
- No warnings
- Bundle size: XXX bytes
Exit code: 0
```

---

## 💾 FILES TO MODIFY

| File | Line | Issue | Change Type |
|------|------|-------|------------|
| `DataContext.tsx` | 65-107 | Add serviceClass to Trip | ADD property |
| `DataContext.tsx` | 487 | Type mismatch | CHANGE generic type |
| `DataContext.tsx` | 524-620 | serviceClass, driverId, driverName | No change needed (once interface updated) |
| `DataContext.tsx` | 592+ | Implicit any | ADD type annotations |
| `pricing.service.ts` | 13 | Return type | UPDATE return type |
| `types.ts` | 59 | Enum value | CHANGE mobile-money → mobile_money |
| `types.ts` | 223 | Interface definition | REVIEW/UPDATE |
| `package.json` | devDependencies | Missing @types/react | ADD dependency |

---

## ✅ VALIDATION CHECKLIST

- [ ] All enum values use consistent naming (underscore)
- [ ] All interfaces match their mock data
- [ ] All callback parameters have explicit types
- [ ] All service return types match usage
- [ ] @types/react is installed
- [ ] npm run build produces no errors
- [ ] npm run build produces no warnings
- [ ] Code compiles successfully
- [ ] Ready for production deployment

---

**Status Summary:**
- Total Errors: 10+
- Total Fixes Required: 6-8 changes
- Estimated Time: 1.5 hours
- Difficulty: Medium (mostly mechanical fixes)
- Impact: HIGH (build will fail without these)

Ready for correction? → See `PLAN_CORRECTION_COMPLET.md`
