# 🔍 ANALYSE PROFONDE: COORDINATION MOBILE ↔ SOCIETE

## 1. SERVICES COMMUNS

### ✅ Services Partagés
- auth.service.ts
- ticket.service.ts  
- trip.service.ts
- station.service.ts
- story.service.ts

---

## 2. COMPARAISON DÉTAILLÉE PAR SERVICE

### 🔐 AUTH SERVICE

#### Mobile (AuthService)
```typescript
Méthodes:
- login(credentials: AuthCredentials): Promise<AuthResponse>
- register(data: AuthRegisterData): Promise<AuthResponse>
- logout(): Promise<void>
- getCurrentUser(): Promise<User | null>
- refreshToken(): Promise<string>

Mode Dev:
- isDevelopment() → Mock login/register
- Cache localStorage avec clé 'current_user'
- Mock token généré: 'mock_token_${Date.now()}'

Type User:
- id, email, phone, firstName, lastName
- profileImage, role, status
- createdAt, updatedAt
```

#### Societe (AuthService)
```typescript
Méthodes:
- login(data: LoginDto): Promise<AuthResponse>
- register(data: RegisterDto): Promise<AuthResponse>
- logout(): Promise<void>
- (Pas de getCurrentUser visible)

Mode Local:
- isLocalMode() → Cherche dans localStorage 'managers' + 'cashiers'
- Vérifie status: 'active'
- Mock token généré: 'mock_token_${user.id}'

Type User:
- id, email, name (PAS firstName/lastName)
- role: 'manager' | 'cashier' (pas 'passenger')
- gareId, gareName
```

#### 🔴 INCOMPATIBILITÉS DÉTECTÉES
1. **Fonction mode dev**: Mobile use `isDevelopment()`, Societe use `isLocalMode()`
   - Peuvent être différentes!
   - Besoin de vérifier: `src/services/config.ts`

2. **Structure User**: COMPLÈTEMENT DIFFÉRENTE
   - Mobile: { id, email, phone, firstName, lastName, role: 'PASSENGER'|'OPERATOR'|'ADMIN' }
   - Societe: { id, email, name, role: 'manager'|'cashier' }
   - ❌ INCOMPATIBLE pour API partagée!

3. **Stockage authentification**:
   - Mobile: 'current_user' + 'auth_token'
   - Societe: 'auth_user' + 'auth_token'
   - ❌ Clés différentes!

4. **Mock data**:
   - Mobile: Cherche dans 'current_user' cache
   - Societe: Cherche dans 'managers' + 'cashiers' listes
   - ❌ Structures complètement différentes!

---

### 🎫 TICKET SERVICE

#### Mobile
- Méthodes: getMyTickets(), getTicketById(), cancelTicket(), transferTicket(), downloadTicket()
- Cache: 'user_tickets', 'ticket_${id}'
- Types: Ticket (avec ticket_id, booking_id, status, qr_code, etc.)

#### Societe
- À vérifier dans le code

---

### 🚌 TRIP SERVICE

#### Mobile
- Méthodes: searchTrips(), getTripById(), getAvailableSeats()
- Cache: 'mock_trips'
- Types: Trip (avec trip_id, segments, available_seats)

#### Societe
- À vérifier dans le code

---

## 3. ARCHITECTURE PATTERNS

### Mobile
```
Pattern: Dual-source (Ancienne + Nouvelle)
├── lib/api.ts + data/models.ts (OLD - pages les utilisent)
├── src/services/ (NEW - créé pendant refactorisation)
│   ├── api/
│   ├── storage/
│   ├── config.ts
│   └── types.ts
└── src/lib/hooks.ts (wrappers pour pages)
```

### Societe
```
Pattern: Services + Context API (Moderne)
├── src/services/
│   ├── api/
│   ├── storage/
│   └── config.ts
├── src/contexts/
│   └── DataContext.tsx (état global)
└── Pages utilisent Context + services
```

---

## 4. PROBLÈMES CRITIQUES IDENTIFIÉS

### 🔴 CRITIQUE #1: Différence de Fonction Mode Dev
**Impact**: Les deux apps ne savent pas si elles sont en dev/local

**Mobile**:
```typescript
export const isDevelopment = (): boolean => {
  return !import.meta.env.PROD;
};
```

**Societe**:
```typescript
export const isLocalMode = (): boolean => {
  return DEPLOYMENT_MODE === 'LOCAL';
};
```

**Action requise**: Aligner sur une seule fonction dans config.ts commun

---

### 🔴 CRITIQUE #2: Types User Incompatibles
**Impact**: Si une API backend retourne un User, l'autre app ne peut pas le parser

**Mobile User**:
```typescript
{
  id: string
  email: string
  phone: string
  firstName: string
  lastName: string
  role: 'PASSENGER' | 'OPERATOR' | 'ADMIN'
}
```

**Societe User**:
```typescript
{
  id: string
  email: string
  name: string
  role: 'manager' | 'cashier'
  gareId?: string
}
```

**Action requise**: 
- Créer type `User` générique au backend
- Mobile/Societe mappent vers leurs types locaux
- OU unifier sur UN seul type User

---

### 🟡 CRITIQUE #3: Clés localStorage Différentes
**Impact**: Si Mobile essaie de lire session de Societe, ça échoue

**Mapping**:
| Donnée | Mobile | Societe |
|---|---|---|
| Token | `auth_token` | `auth_token` | ✅
| User | `current_user` | `auth_user` | ❌
| Tickets | `user_tickets` | ??? |
| Trips | `mock_trips` | ??? |

**Action requise**: Standardiser les clés localStorage

---

### 🟡 CRITIQUE #4: Données Mock Incompatibles
**Impact**: Pas de données de test partagées

**Mobile mock**:
```typescript
// Cherche: 'mock_trips', 'user_tickets'
// Structure: Trip, Ticket Burkina Faso
```

**Societe mock**:
```typescript
// Cherche: 'managers', 'cashiers'
// Structure: Manager, Cashier Gestion
```

**Action requise**: Créer dataset partagé pour tests

---

## 5. RECOMMANDATIONS

### Priority 1 (URGENT)
- [ ] Aligner `isDevelopment()` vs `isLocalMode()` → une seule fonction
- [ ] Créer `types/common.ts` pour types partagés (User, AuthResponse, etc.)
- [ ] Standardiser clés localStorage

### Priority 2 (Important)
- [ ] Créer mock data dataset partagé
- [ ] Documenter mapping User entre Mobile et Societe
- [ ] Ajouter transformation de données à l'entrée/sortie

### Priority 3 (Amélioration)
- [ ] Créer shared package pour code commun
- [ ] Ajouter tests d'intégration Mobile ↔ Societe
- [ ] Documenter contract API entre les deux

---

## 6. SCHÉMA D'INTÉGRATION IDÉAL

```
Backend API (NestJS)
  ↓
  ├─→ Mobile (Passagers)
  │   ├── Types locaux (Ticket, Trip, User-Passenger)
  │   ├── Services (auth, ticket, trip, ...)
  │   └── Pages (Recherche, Réservation, Mes billets)
  │
  ├─→ Societe (Opérateurs)
  │   ├── Types locaux (Manager, Cashier, Route, Schedule)
  │   ├── Services (auth, manager, cashier, route, ...)
  │   └── Pages (Dashboard, Gestion, Transactions)
  │
  └─→ Shared
      ├── Common Types (User base, AuthResponse)
      ├── Config (isDevelopment, API_BASE_URL)
      ├── Constants (localStorage keys, endpoints)
      └── Utils (storage, logger)
```

---

## 7. STATUS ACTUEL

| Aspect | Mobile | Societe | Aligned |
|---|---|---|---|
| Services | ✅ 13 | ✅ 12 | ⚠️ Partiellement |
| Ports | ✅ 3000 | ✅ 3001 | ✅ Oui |
| Types | ✅ 435 lignes | ✅ 342 lignes | 🔴 Non |
| Auth Service | ✅ Existe | ✅ Existe | 🔴 Incompatible |
| Config Mode | isDevelopment | isLocalMode | 🔴 Différent |
| Storage Keys | Multiples | Multiples | 🔴 Différentes |

---

## CONCLUSION

**Cohérence**: 🟡 60% (Moyenne)
- Architecture globale: ✅ Bonne
- Services: ✅ Bien organisés  
- Coordination: 🔴 Faible (types incompatibles, clés différentes)
- Intégration: 🔴 Faible (pas de données partagées)

**Recommandation**: Créer layer commun (`@faso-travel/shared`) avant d'aller en production
