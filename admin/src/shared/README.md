# 📦 FasoTravel - Shared Layer

**Version:** 1.0.0  
**Date:** 30 janvier 2026

---

## 🎯 Objectif

Cette couche partagée contient **TOUT le code commun** entre les applications Mobile et Societe.

**Principe fondamental :** ZÉRO DUPLICATION

---

## 📁 Structure

```
shared/
├─ services/
│  ├─ apiClient.ts        ← CLIENT HTTP CENTRAL (token, retry, errors)
│  ├─ constants.ts        ← Constantes partagées
│  └─ index.ts
│
├─ types/
│  ├─ standardized.ts     ← 18 ENTITÉS (Trip, Ticket, Station, etc.)
│  ├─ enums.ts            ← Enums (UserRole, TripStatus, etc.)
│  └─ index.ts
│
├─ utils/
│  ├─ formatters.ts       ← Formatage (date, currency, phone)
│  ├─ validators.ts       ← Validation (email, password, phone)
│  └─ index.ts
│
└─ index.ts               ← Export principal
```

---

## 🚀 Utilisation

### Dans Mobile/ ou Societe/

**Option 1 : Import depuis le dossier shared**

```typescript
// Créer un symlink (recommandé)
// cd Mobile/src && ln -s ../../shared shared
// cd Societe/src && ln -s ../../shared shared

import { apiClient, Trip, formatCurrency } from '../shared';
import { isValidEmail, formatDate } from '../shared';
```

**Option 2 : Import depuis le path relatif**

```typescript
import { apiClient } from '../../shared/services/apiClient';
import { Trip, Ticket } from '../../shared/types/standardized';
```

---

## 🔧 apiClient

### Fonctionnalités

✅ **Auto-injection du token** : Ajoute automatiquement `Authorization: Bearer <token>`  
✅ **Token refresh** : Renouvelle automatiquement le token expiré  
✅ **Retry logic** : Retry automatique avec exponential backoff (3 tentatives)  
✅ **Error handling** : Transforme les erreurs HTTP en `ApiError` structurées  
✅ **Logging** : Log des requêtes en mode développement

### Exemples

```typescript
// GET request
const trips = await apiClient.get<Trip[]>('/trips');

// POST request
const ticket = await apiClient.post<Ticket>('/bookings', {
  tripId: '123',
  seats: ['A1', 'A2']
});

// Error handling
try {
  await apiClient.post('/bookings', data);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.code); // 'VALIDATION_ERROR'
    console.log(error.message); // 'Email déjà utilisé'
    console.log(error.status); // 400
    console.log(error.details); // { email: '...' }
  }
}
```

---

## 📝 Types

### 18 Entités Principales

| Entité | Description |
|--------|-------------|
| **PassengerUser** | Utilisateur Mobile (passager) |
| **OperatorUser** | Utilisateur Admin (responsable/manager/caissier) |
| **Route** | Trajet entre 2 stations |
| **Station** | Gare routière |
| **ScheduleTemplate** | Modèle d'horaire récurrent |
| **Trip** | Instance de trajet |
| **PricingSegment** | Règle de tarification |
| **Ticket** | Réservation/Billet |
| **Cashier** | Caissier |
| **CashTransaction** | Transaction caisse |
| **Incident** | Incident système |
| **Story** | Contenu marketing |
| **Review** | Avis passager |
| **Manager** | Chef de gare |
| **AuditLog** | Journal d'audit |
| **Support** | Ticket de support |
| **DashboardStats** | Statistiques dashboard |
| **RevenueByPeriod** | Revenus par période |

### Exemples

```typescript
import { Trip, Ticket, Station } from '../shared/types';

const trip: Trip = {
  id: '123',
  routeId: '456',
  departureTime: '2026-02-01T14:30:00Z',
  status: 'scheduled',
  currentPassengers: 0,
  capacity: 50,
  // ...
};

const ticket: Ticket = {
  id: 'abc',
  tripId: '123',
  passengerId: 'xyz',
  seatNumber: 'A1',
  fare: 50000,
  totalAmount: 52000,
  status: 'booked',
  // ...
};
```

---

## 🛠️ Utils

### Formatters

```typescript
import { 
  formatDate, 
  formatCurrency, 
  formatPhone,
  formatDuration
} from '../shared/utils';

formatDate('2026-01-30T14:30:00Z'); // "30/01/2026"
formatCurrency(50000); // "50 000 F CFA"
formatPhone('+221781234567'); // "+221 78 123 45 67"
formatDuration(135); // "2h 15min"
```

### Validators

```typescript
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  getPasswordStrength
} from '../shared/utils';

isValidEmail('user@example.com'); // true
isValidPassword('Pass123!'); // true
isValidPhone('+221781234567'); // true
getPasswordStrength('MyP@ssw0rd'); // 85
```

---

## 🔐 Token Management

```typescript
// Login (set tokens)
const response = await apiClient.post('/auth/login', { email, password });
apiClient.setAuthTokens(response.token, response.refreshToken);

// Logout (clear tokens)
apiClient.logout();

// Check authentication
if (apiClient.isAuthenticated()) {
  console.log('User is authenticated');
}
```

---

## ⚙️ Configuration

### Variables d'environnement

```bash
# .env (dans Mobile/ ou Societe/)
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### Constantes

```typescript
import { API_CONFIG, STORAGE_KEYS, COLORS } from '../shared/services/constants';

console.log(API_CONFIG.BASE_URL); // 'http://localhost:3000/api'
console.log(STORAGE_KEYS.AUTH_TOKEN); // 'transportbf_auth_token'
console.log(COLORS.RED); // '#dc2626' (Rouge Burkina)
```

---

## ✅ Tests

### Vérification TypeScript

```bash
cd shared
npm run type-check
```

### Tester l'import

```typescript
// Dans Mobile/src/test.ts ou Societe/src/test.ts
import { apiClient, Trip, formatCurrency } from '../shared';

console.log('✅ Shared layer importé avec succès');
```

---

## 📚 Documentation API

### apiClient Methods

| Méthode | Description |
|---------|-------------|
| `get<T>(url, config?)` | GET request |
| `post<T>(url, data?, config?)` | POST request |
| `put<T>(url, data?, config?)` | PUT request |
| `patch<T>(url, data?, config?)` | PATCH request |
| `delete<T>(url, config?)` | DELETE request |
| `setAuthTokens(token, refreshToken?)` | Set auth tokens |
| `logout()` | Clear auth tokens |
| `isAuthenticated()` | Check if authenticated |

### Error Codes

| Code | Description |
|------|-------------|
| `TIMEOUT` | Request timeout |
| `NETWORK_ERROR` | Network error |
| `VALIDATION_ERROR` | Validation failed (400) |
| `UNAUTHORIZED` | Not authenticated (401) |
| `FORBIDDEN` | No permission (403) |
| `NOT_FOUND` | Resource not found (404) |
| `CONFLICT` | Data conflict (409) |
| `UNPROCESSABLE_ENTITY` | Validation error (422) |
| `RATE_LIMITED` | Too many requests (429) |
| `SERVER_ERROR` | Server error (500+) |

---

## 🚨 Règles Importantes

### ❌ Ne JAMAIS faire

```typescript
// ❌ Ne PAS dupliquer les types
// Dans Mobile/src/types/trip.ts
export interface Trip { ... } // ❌ INTERDIT

// ❌ Ne PAS créer un autre client HTTP
// Dans Societe/src/api.ts
const client = axios.create({ ... }); // ❌ INTERDIT

// ❌ Ne PAS appeler fetch() directement
fetch('/api/trips'); // ❌ INTERDIT
```

### ✅ Toujours faire

```typescript
// ✅ Importer depuis shared
import { Trip } from '../shared/types';
import { apiClient } from '../shared/services';

// ✅ Utiliser apiClient pour TOUS les appels
const trips = await apiClient.get<Trip[]>('/trips');

// ✅ Réutiliser les formatters
import { formatCurrency } from '../shared/utils';
const price = formatCurrency(50000);
```

---

## 🔄 Mise à Jour

Quand vous ajoutez une nouvelle entité ou fonction :

1. **Ajouter dans shared/** (types, services, ou utils)
2. **Exporter dans index.ts** correspondant
3. **Tester dans les deux apps** (Mobile + Societe)
4. **Documenter** dans ce README

---

## 📞 Support

Pour toute question sur la couche partagée :
- Consulter la spec complète : `/SYSTEM_COMPLETE_SPECIFICATION.md`
- Consulter le plan de migration : `/PLAN_MIGRATION_COMPLET.md`

---

**Auteur:** FasoTravel Team  
**Date:** 30 janvier 2026  
**Version:** 1.0.0
