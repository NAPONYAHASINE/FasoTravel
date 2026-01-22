# 🔧 PLAN DE CORRECTION DÉTAILLÉ - FasoTravel Societe

**Objet:** Corriger 10+ erreurs TypeScript pour passer le build et atteindre 100% Backend-Ready  
**Durée estimée:** 1.5 heures  
**Difficulté:** Moyenne (corrections simples de types et interfaces)

---

## 📋 TABLE DES CORRECTIONS À APPLIQUER

### 1️⃣ CORRECTION #1: Résoudre PricingRule vs PriceSegment (20 min)

**Problème:** Type mismatch entre DataContext et pricingService

**Analyse:**
```typescript
// types.ts:223 - Ce que le service retourne
export interface PriceSegment {
  id: string;
  route: string;
  currentPrice: number;
  previousPrice: number;
  lastUpdate: string;
}

// DataContext:65 - Ce que le contexte attend
export interface PricingRule {
  id: string;
  routeId: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate?: string;
  daysOfWeek?: number[];
  timeSlots?: { start: string; end: string }[];
  priority: number;
  status: 'active' | 'inactive';
}
```

**3 Options Possibles:**

**Option A: Unifier sur PriceSegment (Plus simple)**
- Garder PriceSegment simple
- Adapter DataContext pour utiliser PriceSegment
- ❌ Perdre les fonctionnalités de PricingRule

**Option B: Unifier sur PricingRule (Recommandé)**
- Enrichir PriceSegment → PricingRule
- Services et mock retournent PricingRule complète
- ✅ Conserver toutes les fonctionnalités

**Option C: Créer deux entités séparées**
- Garder les deux types différents
- Adapter la couche mapper entre types
- 🟡 Plus complexe, mais possible

**CORRECTION RECOMMANDÉE: Option B**

**À faire:**

1. **Fichier:** `services/types.ts` (ligne 223)
```typescript
// ❌ AVANT:
export interface PriceSegment {
  id: string;
  route: string;
  currentPrice: number;
  previousPrice: number;
  lastUpdate: string;
}

// ✅ APRÈS (renommer en PricingRule):
export interface PricingSegment {
  id: string;
  route: string;
  currentPrice: number;
  previousPrice: number;
  lastUpdate: string;
  // Note: Garder ce nom pour l'API backend
}
```

2. **Fichier:** `services/api/pricing.service.ts` (ligne 13)
```typescript
// ❌ AVANT:
async listSegments(): Promise<PriceSegment[]> {

// ✅ APRÈS:
async listSegments(): Promise<PricingSegment[]> {
```

3. **Fichier:** `contexts/DataContext.tsx` (ligne 487)
```typescript
// ❌ AVANT:
const [pricingRules, setPricingRules] = useApiState<PricingRule[]>(
  'priceSegments',
  () => pricingService.listSegments(),  // Type mismatch!
  []
);

// ✅ APRÈS (2 options):

// Option 1: Utiliser PricingSegment à la place
const [pricingRules, setPricingRules] = useApiState<PricingSegment[]>(
  'priceSegments',
  () => pricingService.listSegments(),
  []
);

// Option 2: Renommer pour clarifier
const [pricingSegments, setPricingSegments] = useApiState<PricingSegment[]>(
  'priceSegments',
  () => pricingService.listSegments(),
  []
);
```

**Recommandation finale:** 
→ Renommer `PricingRule` en `PricingSegment` dans DataContext pour cohérence
→ OU ajouter plus de champs à PriceSegment pour le rendre complet
→ Utiliser Option 1 (plus simple)

---

### 2️⃣ CORRECTION #2: Normaliser paymentMethod Enum (15 min)

**Problème:** Mismatch underscore vs tiret dans enum values

**Locations:**
```typescript
// contexts/DataContext.tsx - Interface Ticket
paymentMethod: 'cash' | 'mobile_money' | 'card'

// services/types.ts - DTO CreateTicketDto
paymentMethod: 'cash' | 'mobile-money' | 'card'  // ❌ TIRET!
```

**CORRECTION: Normaliser sur UNDERSCORE partout**

1. **Fichier:** `services/types.ts` (ligne 59 - CreateTicketDto)
```typescript
// ❌ AVANT:
export interface CreateTicketDto {
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumber: string;
  price: number;
  salesChannel: 'guichet' | 'app-mobile';
  paymentMethod: 'cash' | 'mobile-money' | 'card';  // ❌ TIRET
  sellerId: string;
  sellerName: string;
  // ...
}

// ✅ APRÈS:
export interface CreateTicketDto {
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumber: string;
  price: number;
  salesChannel: 'online' | 'counter';  // ✅ Aussi normaliser ici
  paymentMethod: 'cash' | 'mobile_money' | 'card';  // ✅ UNDERSCORE
  sellerId: string;
  sellerName: string;
  // ...
}
```

2. **Vérifier aussi UpdateTicketDto et autres DTOs** pour cohérence

---

### 3️⃣ CORRECTION #3: Installer @types/react (2 min)

**Problème:** Missing type declarations for React

**Solution:**
```bash
npm install --save-dev @types/react@latest @types/react-dom@latest
```

**Vérifier package.json après:**
```json
{
  "devDependencies": {
    "@types/react": "^18.x.x",
    "@types/react-dom": "^18.x.x",
    // ...
  }
}
```

---

### 4️⃣ CORRECTION #4: Ajouter serviceClass à Trip (20 min)

**Problème:** Mock data utilise `serviceClass` qui n'existe pas dans l'interface

**Analyse:**
```typescript
// Mock utilise ces propriétés:
{ serviceClass: 'standard', driverId: 'driver_4', driverName: 'Souleymane' }

// Mais Trip interface n'a pas ces propriétés
```

**CORRECTION: Ajouter à l'interface**

**Fichier:** `contexts/DataContext.tsx` (ligne 88-107 - Interface Trip)

```typescript
// ❌ AVANT:
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
}

// ✅ APRÈS:
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
  
  // ✅ NOUVEAUX CHAMPS:
  serviceClass: 'standard' | 'vip' | 'express';
  driverId?: string;
  driverName?: string;
  
  // Existants:
  vehicleId?: string;
  currentLocation?: { lat: number; lng: number; timestamp: string };
  estimatedArrival?: string;
}
```

**Vérifier aussi dans services/types.ts:**

```typescript
// services/types.ts - CreateTripDto aussi besoin serviceClass
export interface CreateTripDto {
  routeId: string;
  gareId: string;
  gareName: string;
  departureDate: string;
  departureTime: string;
  serviceClass: 'standard' | 'vip' | 'express';  // ✅ Ajouter ici aussi
  totalSeats: number;
  basePrice: number;
}
```

---

### 5️⃣ CORRECTION #5: Ajouter Types aux Callbacks (15 min)

**Problème:** Implicit 'any' type parameters dans callbacks

**Locations avec erreurs:**

**Location 1:** `generateMockTrips()` et `generateMockTickets()` - Array.from

```typescript
// ❌ AVANT (ligne 592):
...Array.from({ length: 33 }, (_, i) => ({  // 'i' is implicitly 'any'
  id: `ticket_today_1_${i + 1}`,
  // ...
})),

// ✅ APRÈS:
...Array.from({ length: 33 }, (_, i: number) => ({
  id: `ticket_today_1_${i + 1}`,
  // ...
})),
```

**Location 2:** Filter avec callbacks

```typescript
// ❌ AVANT:
scheduleTemplates.filter(t => t.status === 'active').forEach((template, index) => {

// ✅ APRÈS (généralement pas besoin, mais si erreur):
scheduleTemplates.filter((t: ScheduleTemplate) => t.status === 'active').forEach((template: ScheduleTemplate, index: number) => {
```

**Location 3:** Map sur tableaux

```typescript
// ❌ AVANT (ligne 665):
passengerName: ['Amadou Traoré', ...][i] || `Passager ${i + 1}`,

// ✅ APRÈS (définir i avec type):
const passengerNames: string[] = ['Amadou Traoré', ...];
passengerName: passengerNames[i] || `Passager ${i + 1}`,
```

---

### 6️⃣ CORRECTION #6: Corriger la Logique paymentMethod (10 min)

**Problème:** Logique métier incorrecte - 'online' peut avoir 'cash'

**Fichier:** `contexts/DataContext.tsx` - `generateMockTickets()` (ligne 692+)

```typescript
// ❌ AVANT (LOGIQUE INCORRECTE):
...Array.from({ length: 33 }, (_, i) => ({
  // ...
  paymentMethod: Math.random() > 0.7 ? 'mobile_money' : 'cash',
  salesChannel: Math.random() > 0.8 ? 'online' : 'counter',
  // ❌ Peut générer: { paymentMethod: 'cash', salesChannel: 'online' }
  // Mais app mobile ne peut pas payer en cash!
})),

// ✅ APRÈS (LOGIQUE CORRECTE):
...Array.from({ length: 33 }, (_, i: number) => {
  const salesChannel: 'online' | 'counter' = Math.random() > 0.3 ? 'counter' : 'online';
  
  // Déterminer le moyen de paiement selon le canal
  let paymentMethod: 'cash' | 'mobile_money' | 'card';
  if (salesChannel === 'online') {
    // App mobile: seulement paiement électronique
    paymentMethod = Math.random() > 0.5 ? 'mobile_money' : 'card';
  } else {
    // Guichet: tous les moyens possibles
    const methods: ('cash' | 'mobile_money' | 'card')[] = ['cash', 'mobile_money', 'card'];
    paymentMethod = methods[Math.floor(Math.random() * methods.length)];
  }
  
  return {
    // ...
    paymentMethod,
    salesChannel,
    // ...
  };
}),
```

**Appliquer la même correction aux autres trips (lignes 710, 738, etc.)**

---

### 7️⃣ CORRECTION #7: Migrer Entités Vers useApiState (30 min - OPTIONNEL POUR BUILD)

**Statut:** Ces entités ne sont pas migrées mais ne causent pas d'erreurs build
**Priorité:** MOYENNE (faire après build success)

**À migrer:**
- reviews (useState → useApiState)
- incidents (useState → useApiState)
- supportTickets (useState → useApiState)
- seatLayouts (useState → useApiState)
- vehicles (useState → useApiState)
- policies (useState → useApiState)
- cashTransactions (useState → useApiState)

**Exemple de migration:**

```typescript
// ❌ AVANT (Ligne 1138):
const [reviews, setReviews] = useState<Review[]>([]);

// ✅ APRÈS:
const [reviews, setReviews] = useApiState<Review[]>(
  'reviews',
  () => reviewService.list(),  // À créer: ReviewService
  [],
  { skipEmptyArrays: true }
);
```

**Note:** Nécessite créer `reviewService`, `incidentService`, etc.

---

## ✅ CHECKLIST DE CORRECTIONS POUR BUILD SUCCESS

### Priority 1 - BLOQUANTS (30 min)

- [ ] 1. Résoudre PricingRule vs PriceSegment (renommer en PricingSegment)
- [ ] 2. Normaliser paymentMethod enum (tiret → underscore)
- [ ] 3. `npm install --save-dev @types/react@latest`
- [ ] 4. Ajouter serviceClass, driverId, driverName à Trip interface
- [ ] 5. Typer callback parameters (Array.from, map, filter)
- [ ] 6. Corriger logique salesChannel/paymentMethod

### Priority 2 - VALIDATION (10 min)

- [ ] 7. `npm run build` doit passer sans erreurs
- [ ] 8. Vérifier pas d'autres TypeScript errors
- [ ] 9. Tester en mode local (localStorage)
- [ ] 10. Vérifier migration storyService OK

### Priority 3 - BACKEND-READY COMPLET (30 min - après Priority 1)

- [ ] 11. Migrer reviews vers useApiState
- [ ] 12. Migrer incidents vers useApiState
- [ ] 13. Migrer supportTickets vers useApiState
- [ ] 14. Migrer seatLayouts vers useApiState
- [ ] 15. Migrer vehicles vers useApiState
- [ ] 16. Migrer policies vers useApiState
- [ ] 17. Migrer cashTransactions vers useApiState
- [ ] 18. `npm run build` doit passer à nouveau

---

## 📝 NOTES IMPORTANTES

### À NE PAS FAIRE:

❌ Ne pas mélanger types différents (PriceSegment + PricingRule)
❌ Ne pas utiliser deux formats d'enum (tiret et underscore)
❌ Ne pas laisser les callbacks avec implicit 'any'
❌ Ne pas utiliser undefined properties dans mock data

### À FAIRE PRIORITAIREMENT:

✅ Respecter les types TypeScript
✅ Normaliser les conventions de naming
✅ Vérifier la logique métier (salesChannel → paymentMethod)
✅ Compiler sans erreurs avant commit

### POUR LA PRODUCTION:

✅ Créer les services manquants (reviewService, etc.) si utilisé
✅ Migrer TOUS les états vers useApiState (non juste useState)
✅ Tester en mode API (pas juste localStorage)
✅ Valider type-safety end-to-end

---

## 🎯 RÉSULTAT ATTENDU

**Après appliquer toutes les corrections:**

```bash
npm run build

✅ TypeScript compilation successful
✅ 0 errors, 0 warnings
✅ Build output: dist/
✅ Ready for deployment
```

**État du projet:**
- ✅ 100% Backend-Ready (code structure)
- ✅ 100% TypeScript compliant
- ✅ 10/10 services migré vers useApiState (ou 7/10 min)
- ✅ Prêt pour intégration backend NestJS

---

## 📞 ESTIMATIONS DE TEMPS

| Phase | Tâche | Durée | Difficulté |
|-------|-------|-------|-----------|
| 1 | Résoudre PricingRule/PriceSegment | 20 min | 🟡 Moyenne |
| 2 | Normaliser enum paymentMethod | 15 min | 🟢 Facile |
| 3 | Installer @types/react | 5 min | 🟢 Facile |
| 4 | Ajouter Trip properties | 20 min | 🟡 Moyenne |
| 5 | Typer callbacks | 15 min | 🟡 Moyenne |
| 6 | Corriger logique métier | 10 min | 🟡 Moyenne |
| 7 | Compiler & valider | 5 min | 🟢 Facile |
| **TOTAL** | **Pour BUILD SUCCESS** | **~1.5h** | **🟡 Moyenne** |
| 8 | Migrer 7 entités (optionnel) | 30 min | 🟡 Moyenne |
| **GRAND TOTAL** | **100% Backend-Ready** | **~2h** | **🟡 Moyenne** |

---

**Prêt à appliquer ces corrections ?**

✅ Oui, je suis autorisé à corriger tout
❌ Non, je veux vérifier d'abord
🤔 Oui, mais corriger uniquement Priority 1
