# 🎯 PLAN DE MIGRATION COMPLET - FasoTravel

**Date:** 30 janvier 2026  
**Objectif:** Migrer l'implémentation actuelle vers l'architecture système complète v2.0  
**Durée estimée:** 16-20 semaines (~4-5 mois)  
**Budget:** Moyen à Élevé

---

## 📋 TABLE DES MATIÈRES

1. [État Actuel vs Cible](#état-actuel-vs-cible)
2. [Stratégie de Migration](#stratégie-de-migration)
3. [Phases Détaillées](#phases-détaillées)
4. [Roadmap Visuelle](#roadmap-visuelle)
5. [Risques & Mitigation](#risques--mitigation)
6. [Checklist de Validation](#checklist-de-validation)

---

## ÉTAT ACTUEL VS CIBLE

### Architecture Actuelle (Ce qui existe)

```
/ (racine du projet - app admin non structurée)
│
├─ components/                  ← Pages admin (22 pages)
│  ├─ Dashboard.tsx            ← Routing avec useState
│  ├─ Login.tsx
│  └─ dashboard/
│     ├─ DashboardHome.tsx
│     ├─ OperatorManagement.tsx
│     └─ ... (20 autres pages)
│
├─ services/                    ← Services API locaux
│  ├─ api.ts                   ← Client HTTP (pas dans Shared/)
│  ├─ endpoints.ts             ← URLs centralisées
│  └─ index.ts
│
├─ types/                       ← Types locaux (pas dans Shared/)
│  └─ index.ts                 ← ~30 types
│
├─ context/                     ← Contexte unique
│  └─ AppContext.tsx           ← Auth + Data + Theme en un
│
└─ hooks/
   ├─ useApi.ts
   ├─ useFilters.ts
   └─ useStats.ts

❌ PAS DE Mobile/
❌ PAS DE Societe/
❌ PAS DE Shared/
❌ PAS DE Backend/
```

### Architecture Cible (Spec v2.0)

```
c:\FasoTravel\
│
├─ Mobile/                      ← App Passagers (À CRÉER)
│  ├─ src/
│  │  ├─ pages/ (10+ pages)
│  │  ├─ services/
│  │  └─ shared/ ───────────┐
│                            │
├─ Societe/                   │  ← App Admin (MIGRER l'existant)
│  ├─ src/                    │
│  │  ├─ pages/               │
│  │  │  ├─ responsable/ (13)│
│  │  │  ├─ manager/ (8)     │
│  │  │  └─ caissier/ (9)    │
│  │  ├─ services/            │
│  │  └─ shared/ ─────────────┤
│                             │
├─ Shared/  ◄─────────────────┘  ← Code partagé (À CRÉER)
│  ├─ services/
│  │  └─ apiClient.ts        ← HTTP client centralisé
│  └─ types/
│     └─ standardized.ts     ← 18 entités
│
└─ Backend/                    ← API (À CRÉER)
   ├─ src/
   │  ├─ routes/ (40+ endpoints)
   │  ├─ models/ (13+ tables)
   │  └─ controllers/
   └─ database/
      └─ PostgreSQL
```

### Gap Analysis (Écarts)

| Composante | Actuel | Cible | Effort |
|------------|--------|-------|--------|
| **Mobile App** | ❌ Absent | ✅ 10+ pages | 🔴 Élevé (3 semaines) |
| **Admin structure** | ⚠️ Racine | ✅ Societe/ | 🟡 Moyen (1 semaine) |
| **Shared layer** | ❌ Absent | ✅ apiClient + types | 🟢 Faible (2 jours) |
| **Backend API** | ❌ Mode mock | ✅ 40+ endpoints | 🔴 Élevé (6 semaines) |
| **Database** | ❌ Absent | ✅ PostgreSQL 13 tables | 🟡 Moyen (1 semaine) |
| **Rôles** | SUPER_ADMIN/OPERATOR | responsable/manager/caissier | 🟡 Moyen (3 jours) |
| **Pages par rôle** | ❌ Non structuré | ✅ 30 pages structurées | 🟡 Moyen (1 semaine) |
| **Services API** | endpoints.ts | 13 services séparés | 🟢 Faible (2 jours) |
| **WebSocket** | ❌ Absent | ✅ Real-time tracking | 🟡 Moyen (3 jours) |
| **Tests** | ❌ Absent | ✅ Unit + Integration + E2E | 🟡 Moyen (2 semaines) |

**Score de conformité actuel:** 19%  
**Score cible:** 100%

---

## STRATÉGIE DE MIGRATION

### Approche Recommandée : **Incrémentale avec Parallélisation**

**Pourquoi ?**
- ✅ Réduit le risque (livraisons progressives)
- ✅ Permet de tester en continu
- ✅ Pas de "big bang" qui peut tout casser
- ✅ Équipe peut travailler sur plusieurs composantes en parallèle

### Principes Directeurs

1. **Ne jamais casser l'existant** : L'app admin actuelle doit continuer à fonctionner
2. **Créer Shared/ en premier** : Base pour tout le reste
3. **Backend en parallèle de Mobile** : Deux équipes peuvent travailler simultanément
4. **Tests continus** : Chaque phase doit passer les tests avant la suivante
5. **Rollback possible** : Chaque étape doit être réversible

### Dépendances Critiques

```
Shared Layer (Phase 1)
    ↓
    ├─→ Mobile App (Phase 3)
    └─→ Admin Refactor (Phase 2)
            ↓
        Backend API (Phase 4)
            ↓
        Integration (Phase 5)
            ↓
        Tests & Deploy (Phase 6)
```

---

## PHASES DÉTAILLÉES

### 🟢 PHASE 0 : Préparation (Semaine 1)

**Objectifs :**
- Audit complet de l'existant
- Configuration des environnements
- Constitution de l'équipe

**Tasks :**

```bash
# 1. Audit de code
- [ ] Inventaire de tous les fichiers actuels
- [ ] Liste des dépendances (package.json)
- [ ] Identification des points de rupture potentiels
- [ ] Documentation de l'architecture actuelle

# 2. Configuration
- [ ] Git repository structure
      c:\FasoTravel\
      ├─ .git/
      ├─ Mobile/
      ├─ Societe/
      ├─ Shared/
      └─ Backend/

- [ ] Environnements
      - Development (local)
      - Staging (pré-production)
      - Production

- [ ] CI/CD pipeline (GitHub Actions)
      - Linting
      - Tests
      - Build
      - Deploy

# 3. Équipe & Rôles
- [ ] Lead Architect (1 personne)
- [ ] Frontend Mobile Developer (1 personne)
- [ ] Frontend Admin Developer (1 personne)
- [ ] Backend Developer (2 personnes)
- [ ] QA/Tester (1 personne)
- [ ] DevOps (1 personne)
```

**Durée :** 5 jours  
**Risque :** Faible  
**Deliverable :** Plan de migration détaillé + Environnements configurés

---

### 🔴 PHASE 1 : Créer Shared Layer (Semaines 2-3)

**Objectif :** Créer la couche partagée entre Mobile et Admin

**Tasks :**

#### 1.1 Créer la structure Shared/

```bash
# Structure à créer
c:\FasoTravel\Shared\
├─ services/
│  ├─ apiClient.ts         ← CLIENT HTTP CENTRAL
│  ├─ constants.ts         ← API_BASE_URL, STORAGE_KEYS
│  └─ index.ts
│
├─ types/
│  ├─ standardized.ts      ← 18 ENTITÉS
│  ├─ enums.ts             ← UserRole, TripStatus, etc
│  ├─ constants.ts         ← Constantes partagées
│  └─ index.ts
│
├─ utils/
│  ├─ formatters.ts        ← formatDate, formatCurrency
│  ├─ validators.ts        ← Validation email, phone
│  └─ index.ts
│
├─ package.json            ← Dependencies partagées
└─ tsconfig.json           ← TypeScript config
```

#### 1.2 Implémenter apiClient.ts (CRITIQUE)

```typescript
// Shared/services/apiClient.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  private requestTimeout = 30000;
  private maxRetries = 3;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.requestTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // ✅ REQUEST INTERCEPTOR - Token injection
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('transportbf_auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ✅ RESPONSE INTERCEPTOR - Error handling + Token refresh
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired - try refresh
          try {
            const refreshToken = localStorage.getItem('transportbf_refresh_token');
            if (refreshToken) {
              const response = await axios.post(
                `${this.baseURL}/auth/refresh-token`,
                { refreshToken }
              );
              localStorage.setItem('transportbf_auth_token', response.data.token);
              return this.client(error.config!);
            }
          } catch (refreshError) {
            localStorage.clear();
            window.location.href = '/login';
          }
        }
        throw this.handleError(error);
      }
    );
  }

  // ✅ HTTP METHODS
  async get<T>(url: string, config?: any): Promise<T> {
    return this.retry(() => this.client.get<T>(url, config));
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.retry(() => this.client.post<T>(url, data, config));
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.retry(() => this.client.put<T>(url, data, config));
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.retry(() => this.client.patch<T>(url, data, config));
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return this.retry(() => this.client.delete<T>(url, config));
  }

  // ✅ RETRY LOGIC avec exponential backoff
  private async retry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const shouldRetry = 
        attempt < this.maxRetries &&
        this.isRetryableError(error);

      if (shouldRetry) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, attempt + 1);
      }
      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error?.response?.status) return true;
    return error.response.status >= 500 || 
           error.response.status === 408 ||
           error.response.status === 429;
  }

  // ✅ ERROR HANDLING centralisé
  private handleError(error: AxiosError): ApiError {
    const status = error.response?.status;
    const data = error.response?.data as any;

    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let details = null;

    if (error.code === 'ECONNABORTED') {
      code = 'TIMEOUT';
      message = 'Request timeout - check your connection';
    } else if (status === 400) {
      code = 'VALIDATION_ERROR';
      message = data?.message || 'Invalid input data';
      details = data?.errors;
    } else if (status === 401) {
      code = 'UNAUTHORIZED';
      message = 'Authentication failed';
    } else if (status === 403) {
      code = 'FORBIDDEN';
      message = 'You do not have permission';
    } else if (status === 404) {
      code = 'NOT_FOUND';
      message = data?.message || 'Resource not found';
    } else if (status === 422) {
      code = 'UNPROCESSABLE_ENTITY';
      message = data?.message || 'Validation failed';
      details = data?.errors;
    } else if (status && status >= 500) {
      code = 'SERVER_ERROR';
      message = 'Server error - try again later';
    }

    return new ApiError(code, message, status, details);
  }
}

export const apiClient = new ApiClient();
```

#### 1.3 Définir les Types (18 entités)

```typescript
// Shared/types/standardized.ts

// ============= USER TYPES =============
export interface PassengerUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface OperatorUser {
  id: string;
  email: string;
  name: string;
  role: 'responsable' | 'manager' | 'caissier';
  societyId: string;
  societyName: string;
  gareId?: string;
  gareName?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

// ============= TRANSPORT ENTITIES =============
export interface Route {
  id: string;
  name: string;
  societyId: string;
  startStationId: string;
  endStationId: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  status: 'active' | 'inactive';
  isExpress: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  capacity: number;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleTemplate {
  id: string;
  routeId: string;
  dayOfWeek: number;
  departureTime: string;
  arrivalTime: string;
  driverName?: string;
  vehicleRegistration?: string;
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  scheduleId: string;
  routeId: string;
  gareId: string;
  departureTime: string;
  arrivalTime: string;
  driverId?: string;
  vehicleRegistration?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  currentPassengers: number;
  capacity: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelledReason?: string;
}

// ... 12 autres entités (Ticket, PricingSegment, Cashier, CashTransaction, 
//     Incident, Story, Review, etc.) - Voir spec complète
```

#### 1.4 Tests de Shared/

```bash
- [ ] Test apiClient.get()
- [ ] Test apiClient.post()
- [ ] Test retry logic
- [ ] Test error handling
- [ ] Test token injection
- [ ] Test token refresh
- [ ] Validation des types TypeScript (0 errors)
```

**Durée :** 10 jours  
**Risque :** Faible  
**Deliverable :** Shared/ fonctionnel, testé, prêt à être utilisé

---

### 🟡 PHASE 2 : Migrer Admin vers Societe/ (Semaines 4-5)

**Objectif :** Restructurer l'app admin actuelle en `Societe/`

**Tasks :**

#### 2.1 Créer la structure Societe/

```bash
# 1. Créer le dossier Societe/
mkdir c:\FasoTravel\Societe
cd Societe
npm init -y

# 2. Copier l'app actuelle
cp -r ../current-admin/src ./src
cp -r ../current-admin/public ./public
cp ../current-admin/package.json ./package.json
cp ../current-admin/vite.config.ts ./vite.config.ts

# 3. Créer le symlink vers Shared/
cd src
ln -s ../../Shared shared

# 4. Restructurer
mkdir src/pages
mkdir src/pages/responsable
mkdir src/pages/manager
mkdir src/pages/caissier
```

#### 2.2 Migrer vers shared/apiClient

```bash
# Remplacer partout :
# AVANT
import { apiClient } from '../services/api';

# APRÈS
import { apiClient } from '../shared/services/apiClient';

# Script de migration automatique
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from '\''../services/api'\''|from '\''../shared/services/apiClient'\''|g'
```

#### 2.3 Migrer vers shared/types

```bash
# Remplacer partout :
# AVANT
import { Trip, Ticket, Station } from '../types';

# APRÈS
import { Trip, Ticket, Station } from '../shared/types/standardized';

# Script de migration
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|from '\''../types'\''|from '\''../shared/types/standardized'\''|g'
```

#### 2.4 Supprimer les fichiers dupliqués

```bash
# Une fois la migration terminée, supprimer :
rm -rf src/services/api.ts     # ❌ Remplacé par shared/apiClient
rm -rf src/types/index.ts      # ❌ Remplacé par shared/types
```

#### 2.5 Restructurer les pages par rôle

```bash
# Déplacer les pages responsable
mv src/components/dashboard/OperatorManagement.tsx src/pages/responsable/
mv src/components/dashboard/StationManagement.tsx src/pages/responsable/
mv src/components/dashboard/AdvertisingManagement.tsx src/pages/responsable/
# ... etc (13 pages)

# Déplacer les pages manager
mv src/components/dashboard/TripManagement.tsx src/pages/manager/
# ... etc (8 pages)

# Déplacer les pages caissier
mv src/components/dashboard/TicketManagement.tsx src/pages/caissier/
# ... etc (9 pages)
```

#### 2.6 Adapter les rôles

```typescript
// AVANT (types/index.ts)
export type UserRole = 'SUPER_ADMIN' | 'OPERATOR_ADMIN';

// APRÈS (shared/types/standardized.ts)
export type UserRole = 'responsable' | 'manager' | 'caissier';

// Migration dans le code
// Remplacer tous les 'SUPER_ADMIN' par 'responsable'
// Remplacer tous les 'OPERATOR_ADMIN' par 'manager'
```

**Durée :** 10 jours  
**Risque :** Moyen  
**Deliverable :** Societe/ fonctionnel, utilise Shared/, structure par rôle

---

### 🔴 PHASE 3 : Créer Mobile App (Semaines 6-9)

**Objectif :** Créer l'application passagers depuis zéro

**Tasks :**

#### 3.1 Setup du projet

```bash
# 1. Créer le projet Mobile
cd c:\FasoTravel
mkdir Mobile
cd Mobile
npm create vite@latest . -- --template react-ts

# 2. Installer les dépendances
npm install axios react-router-dom
npm install -D @types/react-router-dom

# 3. Créer le symlink vers Shared/
cd src
ln -s ../../Shared shared
```

#### 3.2 Créer la structure

```bash
mkdir src/pages
mkdir src/components
mkdir src/contexts
mkdir src/hooks
mkdir src/services
mkdir src/utils
mkdir src/styles
```

#### 3.3 Implémenter les 10 pages principales

**Page 1 : HomePage**

```typescript
// src/pages/HomePage/index.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/services/apiClient';
import { Trip, Ticket } from '../../shared/types/standardized';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [recentBookings, setRecentBookings] = useState<Ticket[]>([]);
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });

  useEffect(() => {
    loadRecentBookings();
  }, []);

  const loadRecentBookings = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      const bookings = await apiClient.get<Ticket[]>(
        `/passengers/${userId}/bookings`,
        { params: { limit: 5 } }
      );
      setRecentBookings(bookings);
    } catch (error) {
      console.error('Failed to load bookings', error);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams({
      from: searchForm.from,
      to: searchForm.to,
      date: searchForm.date,
      passengers: searchForm.passengers.toString()
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="home-page">
      <header>
        <h1>FasoTravel</h1>
        <p>Book your bus tickets easily</p>
      </header>

      <div className="search-form">
        <input 
          type="text" 
          placeholder="From (City)" 
          value={searchForm.from}
          onChange={(e) => setSearchForm({...searchForm, from: e.target.value})}
        />
        <input 
          type="text" 
          placeholder="To (City)" 
          value={searchForm.to}
          onChange={(e) => setSearchForm({...searchForm, to: e.target.value})}
        />
        <input 
          type="date" 
          value={searchForm.date}
          onChange={(e) => setSearchForm({...searchForm, date: e.target.value})}
        />
        <select 
          value={searchForm.passengers}
          onChange={(e) => setSearchForm({...searchForm, passengers: parseInt(e.target.value)})}
        >
          <option value={1}>1 Passenger</option>
          <option value={2}>2 Passengers</option>
          <option value={3}>3 Passengers</option>
          <option value={4}>4+ Passengers</option>
        </select>
        <button onClick={handleSearch}>Search Trips</button>
      </div>

      <div className="recent-bookings">
        <h2>My Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p>No bookings yet</p>
        ) : (
          recentBookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <p>Trip ID: {booking.tripId}</p>
              <p>Seat: {booking.seatNumber}</p>
              <p>Status: {booking.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;
```

**Page 2 : SearchResultsPage**

```typescript
// src/pages/SearchResultsPage/index.tsx

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../shared/services/apiClient';
import { Trip } from '../../shared/types/standardized';
import TripCard from '../../components/TripCard';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchTrips();
  }, [searchParams]);

  const searchTrips = async () => {
    try {
      setLoading(true);
      const filters = {
        from: searchParams.get('from'),
        to: searchParams.get('to'),
        date: searchParams.get('date'),
        passengers: searchParams.get('passengers')
      };

      const results = await apiClient.get<Trip[]>('/trips/search', {
        params: filters
      });
      
      setTrips(results);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-results">
      <h1>Available Trips</h1>

      {loading ? (
        <p>Loading...</p>
      ) : trips.length === 0 ? (
        <p>No trips found</p>
      ) : (
        <div className="trips-list">
          {trips.map(trip => (
            <TripCard 
              key={trip.id} 
              trip={trip} 
              onSelect={() => navigate(`/booking/${trip.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;
```

**Pages 3-10 :** BookingPage, PaymentPage, ConfirmationPage, MyBookingsPage, TripTrackingPage, ProfilePage, LoginPage, RegisterPage

(Implémenter de manière similaire - voir spec complète pour détails)

#### 3.4 Créer les composants réutilisables

```typescript
// src/components/TripCard.tsx
// src/components/SeatSelector.tsx
// src/components/PaymentForm.tsx
// src/components/LocationMap.tsx
// src/components/TicketQRCode.tsx
```

#### 3.5 Services Mobile

```typescript
// src/services/authService.ts
import { apiClient } from '../shared/services/apiClient';
import { PassengerUser } from '../shared/types/standardized';

export async function loginPassenger(
  email: string, 
  password: string
): Promise<PassengerUser> {
  const response = await apiClient.post('/auth/passenger-login', {
    email,
    password
  });
  localStorage.setItem('transportbf_auth_token', response.token);
  localStorage.setItem('user_id', response.user.id);
  return response.user;
}

export async function registerPassenger(data: {
  email: string;
  name: string;
  phone: string;
  password: string;
}): Promise<PassengerUser> {
  const response = await apiClient.post('/auth/passenger-register', data);
  localStorage.setItem('transportbf_auth_token', response.token);
  localStorage.setItem('user_id', response.user.id);
  return response.user;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
  localStorage.clear();
}
```

```typescript
// src/services/tripService.ts
import { apiClient } from '../shared/services/apiClient';
import { Trip } from '../shared/types/standardized';

export async function searchTrips(filters: {
  from: string;
  to: string;
  date: string;
  passengers: number;
}): Promise<Trip[]> {
  return apiClient.get('/trips/search', { params: filters });
}

export async function getTripDetails(tripId: string): Promise<Trip> {
  return apiClient.get(`/trips/${tripId}`);
}
```

```typescript
// src/services/bookingService.ts
import { apiClient } from '../shared/services/apiClient';
import { Ticket } from '../shared/types/standardized';

export async function createBooking(data: {
  tripId: string;
  seats: string[];
  passengerInfo: {
    name: string;
    phone: string;
    email: string;
  };
}): Promise<Ticket> {
  return apiClient.post('/bookings', data);
}

export async function getMyBookings(): Promise<Ticket[]> {
  const userId = localStorage.getItem('user_id');
  return apiClient.get(`/passengers/${userId}/bookings`);
}
```

**Durée :** 20 jours (4 semaines)  
**Risque :** Élevé  
**Deliverable :** Mobile/ fonctionnel en mode mock, prêt pour intégration API

---

### 🔴 PHASE 4 : Backend API (Semaines 10-16)

**Objectif :** Implémenter les 40+ endpoints + Database

**Tasks :**

#### 4.1 Setup Backend (Choix: Node.js + Express + PostgreSQL)

```bash
# 1. Créer le projet Backend
cd c:\FasoTravel
mkdir Backend
cd Backend
npm init -y

# 2. Installer les dépendances
npm install express cors dotenv bcrypt jsonwebtoken
npm install pg pg-hstore sequelize
npm install -D typescript @types/node @types/express ts-node nodemon

# 3. Structure
mkdir src
mkdir src/models
mkdir src/routes
mkdir src/controllers
mkdir src/middleware
mkdir src/services
mkdir src/utils
mkdir src/config
```

#### 4.2 Database Setup (PostgreSQL)

```sql
-- Script de création des 13 tables principales

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  profile_image_url VARCHAR(500),
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE operator_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('responsable', 'manager', 'caissier')),
  society_id UUID NOT NULL,
  society_name VARCHAR(255),
  gare_id UUID,
  gare_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  society_id UUID NOT NULL,
  start_station_id UUID NOT NULL,
  end_station_id UUID NOT NULL,
  distance_km DECIMAL(10,2),
  estimated_duration_minutes INT,
  status VARCHAR(20) DEFAULT 'active',
  is_express BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  capacity INT DEFAULT 100,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  driver_name VARCHAR(255),
  vehicle_registration VARCHAR(20),
  capacity INT DEFAULT 50,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  gare_id UUID NOT NULL REFERENCES stations(id),
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  driver_id UUID,
  vehicle_registration VARCHAR(20),
  status VARCHAR(30) DEFAULT 'scheduled',
  current_passengers INT DEFAULT 0,
  capacity INT DEFAULT 50,
  current_latitude DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  last_location_update TIMESTAMP,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  passenger_id UUID NOT NULL REFERENCES users(id),
  seat_number VARCHAR(10) NOT NULL,
  fare DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2),
  tax DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'booked',
  payment_method VARCHAR(20),
  payment_status VARCHAR(20),
  transaction_id VARCHAR(255),
  cashier_id UUID,
  cashier_station_id UUID,
  purchase_date TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  refund_amount DECIMAL(10,2),
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (trip_id, seat_number)
);

-- ... Continuer avec les 6 autres tables
-- (pricing_segments, cash_transactions, incidents, stories, reviews, audit_logs)
```

#### 4.3 Implémenter les endpoints critiques (40+)

**Auth endpoints :**

```typescript
// src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, OperatorUser } from '../models';

const router = express.Router();

// POST /api/auth/passenger-login
router.post('/passenger-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required' }
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Generate tokens
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Update last login
    await user.update({ last_login_at: new Date() });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

// POST /api/auth/operator-login
router.post('/operator-login', async (req, res) => {
  // Similar logic but for OperatorUser
});

// POST /api/auth/passenger-register
router.post('/passenger-register', async (req, res) => {
  try {
    const { email, name, phone, password } = req.body;

    // Validate input
    if (!email || !name || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'All fields required' }
      });
    }

    // Check if user exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'Email already registered' }
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      name,
      phone,
      password_hash
    });

    // Generate token
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' }
    });
  }
});

export default router;
```

**Trip endpoints :**

```typescript
// src/routes/trips.ts
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { Trip } from '../models';

const router = express.Router();

// GET /api/trips/search
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, passengers } = req.query;

    // Build query
    const whereClause: any = {
      status: 'scheduled',
      departure_time: {
        $gte: new Date(date as string)
      }
    };

    // Filter by stations (simplified)
    // In real implementation, join with routes and stations tables

    const trips = await Trip.findAll({
      where: whereClause,
      limit: 50,
      order: [['departure_time', 'ASC']]
    });

    res.json({
      success: true,
      data: trips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to search trips' }
    });
  }
});

// GET /api/trips/:id
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Trip not found' }
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to get trip' }
    });
  }
});

// POST /api/trips (Protected - Manager/Responsable only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Check role
    if (!['responsable', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }

    const trip = await Trip.create(req.body);

    res.status(201).json({
      success: true,
      data: trip
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create trip' }
    });
  }
});

export default router;
```

**Ticket/Booking endpoints :**

```typescript
// src/routes/bookings.ts
import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { Ticket, Trip, PricingSegment } from '../models';
import { calculatePrice } from '../utils/pricing';

const router = express.Router();

// POST /api/bookings
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tripId, seats, passengerInfo } = req.body;

    // 1. Validate trip exists
    const trip = await Trip.findByPk(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Trip not found' }
      });
    }

    // 2. Check seats availability
    const bookedSeats = await Ticket.findAll({
      where: { trip_id: tripId, status: ['booked', 'confirmed'] },
      attributes: ['seat_number']
    });

    const bookedSeatNumbers = bookedSeats.map(t => t.seat_number);
    const requestedSeats = seats as string[];
    const unavailable = requestedSeats.filter(s => bookedSeatNumbers.includes(s));

    if (unavailable.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'SEATS_UNAVAILABLE', message: 'Some seats are already booked' }
      });
    }

    // 3. Calculate price
    const pricing = await PricingSegment.findOne({
      where: {
        route_id: trip.route_id,
        passenger_type: 'adult' // Simplified
      }
    });

    if (!pricing) {
      return res.status(500).json({
        success: false,
        error: { code: 'PRICING_ERROR', message: 'Pricing not configured' }
      });
    }

    const fare = pricing.final_price;
    const tax = fare * 0.05; // 5% tax
    const totalAmount = fare + tax;

    // 4. Create tickets
    const tickets = [];
    for (const seat of requestedSeats) {
      const ticket = await Ticket.create({
        trip_id: tripId,
        passenger_id: req.user.id,
        seat_number: seat,
        fare,
        tax,
        total_amount: totalAmount,
        status: 'booked',
        purchase_date: new Date()
      });
      tickets.push(ticket);
    }

    // 5. Update trip passenger count
    await trip.update({
      current_passengers: trip.current_passengers + requestedSeats.length
    });

    res.status(201).json({
      success: true,
      data: tickets[0] // Return first ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create booking' }
    });
  }
});

export default router;
```

**Continuer avec 35+ autres endpoints...**

(Routes, Stations, Schedules, Pricing, Cashiers, Cash Transactions, Incidents, Stories, Reviews, Analytics, etc.)

**Durée :** 30 jours (6 semaines)  
**Risque :** Très élevé  
**Deliverable :** Backend API complet, testé, documenté

---

### 🟡 PHASE 5 : Intégration & Tests (Semaines 17-18)

**Objectif :** Connecter Mobile + Societe → Backend

**Tasks :**

#### 5.1 Basculer Mobile en mode production

```typescript
// Mobile/.env.production
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENABLE_MOCK_DATA=false

// Tester toutes les pages Mobile avec le vrai Backend
- [ ] HomePage → Load real trips
- [ ] SearchResultsPage → Real search
- [ ] BookingPage → Real booking creation
- [ ] PaymentPage → Integration Stripe
- [ ] ConfirmationPage → Real confirmation
- [ ] TripTrackingPage → WebSocket real-time
```

#### 5.2 Basculer Societe en mode production

```typescript
// Societe/.env.production
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENABLE_MOCK_DATA=false

// Tester toutes les pages Admin avec le vrai Backend
- [ ] Responsable pages (13) → Full CRUD operations
- [ ] Manager pages (8) → Filtered data by gareId
- [ ] Caissier pages (9) → Ticket sales, cash management
```

#### 5.3 Tests d'intégration End-to-End

```bash
# Scénario 1: Passenger books ticket → Operator sees it
1. Passenger logs in to Mobile
2. Searches for trip Dakar → Bamako
3. Selects trip, books 2 seats
4. Pays with Stripe
5. Receives confirmation

# Verify in Admin:
6. Manager logs in to Societe
7. Navigates to Sales page
8. Sees new booking appear in real-time

# Scénario 2: Operator creates trip → Passenger can book it
1. Responsable logs in to Admin
2. Creates new route Ouagadougou → Abidjan
3. Creates schedule template
4. Creates trip for tomorrow

# Verify in Mobile:
5. Passenger searches Ouagadougou → Abidjan
6. Sees new trip
7. Can book seats
```

#### 5.4 Tests de Performance

```bash
- [ ] Load test: 1000 concurrent users
- [ ] API response time: < 500ms (average)
- [ ] Database query optimization
- [ ] Frontend bundle size: < 500KB
- [ ] Mobile app load time: < 3 seconds
- [ ] Admin dashboard load time: < 2 seconds
```

#### 5.5 Tests de Sécurité

```bash
- [ ] SQL injection prevented
- [ ] XSS protection working
- [ ] CSRF tokens implemented
- [ ] Rate limiting functional
- [ ] JWT token expiration working
- [ ] Token refresh working
- [ ] Password requirements enforced
- [ ] Sensitive data not in logs
```

**Durée :** 10 jours  
**Risque :** Moyen  
**Deliverable :** Système complet fonctionnel, testé, prêt pour déploiement

---

### 🚀 PHASE 6 : Déploiement Production (Semaines 19-20)

**Objectif :** Déployer le système en production

**Tasks :**

#### 6.1 Préparation Production

```bash
# 1. Configuration des environnements
- [ ] Production database (PostgreSQL sur AWS RDS)
- [ ] Redis pour cache (AWS ElastiCache)
- [ ] S3 pour fichiers (photos, PDFs)
- [ ] CloudFront pour CDN
- [ ] Route 53 pour DNS

# 2. Domaines
- [ ] app.fasotravel.com → Mobile
- [ ] admin.fasotravel.com → Societe
- [ ] api.fasotravel.com → Backend

# 3. Certificats SSL
- [ ] Obtenir certificats Let's Encrypt
- [ ] Configurer HTTPS
```

#### 6.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy-mobile.yml
name: Deploy Mobile

on:
  push:
    branches: [main]
    paths:
      - 'Mobile/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./Mobile
        run: npm ci
      
      - name: Run tests
        working-directory: ./Mobile
        run: npm run test
      
      - name: Build
        working-directory: ./Mobile
        run: npm run build
        env:
          REACT_APP_API_URL: ${{ secrets.API_URL }}
      
      - name: Deploy to S3
        run: |
          aws s3 sync ./Mobile/dist s3://fasotravel-mobile-app
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_MOBILE_ID }} \
            --paths "/*"

# Répéter pour Societe et Backend
```

#### 6.3 Monitoring Setup

```bash
# 1. Sentry (Error tracking)
- [ ] Configure Sentry for Mobile
- [ ] Configure Sentry for Societe
- [ ] Configure Sentry for Backend

# 2. Logging (CloudWatch)
- [ ] Backend API logs
- [ ] Database slow query logs
- [ ] Application errors

# 3. Uptime Monitoring (UptimeRobot)
- [ ] Monitor Mobile app
- [ ] Monitor Admin app
- [ ] Monitor Backend API
- [ ] Alert on downtime

# 4. Performance Monitoring (New Relic)
- [ ] API response times
- [ ] Database queries
- [ ] Frontend page load times
```

#### 6.4 Documentation Finale

```bash
- [ ] API Reference (Swagger/OpenAPI)
- [ ] Deployment Guide
- [ ] Troubleshooting Guide
- [ ] User Manual (Passenger)
- [ ] User Manual (Operator)
- [ ] Developer Guide
```

**Durée :** 10 jours  
**Risque :** Moyen  
**Deliverable :** Système en production, monitoring actif, documentation complète

---

## ROADMAP VISUELLE

```
┌─────────────────────────────────────────────────────────────────┐
│                        TIMELINE (20 SEMAINES)                   │
└─────────────────────────────────────────────────────────────────┘

Semaine 1     : 🟢 PHASE 0 - Préparation
                └─ Audit + Config + Équipe

Semaines 2-3  : 🔴 PHASE 1 - Shared Layer
                ├─ apiClient.ts (HTTP central)
                ├─ Types (18 entités)
                └─ Tests

Semaines 4-5  : 🟡 PHASE 2 - Migrer Admin → Societe/
                ├─ Restructurer en Societe/
                ├─ Migrer vers Shared/
                ├─ Pages par rôle
                └─ Tests

Semaines 6-9  : 🔴 PHASE 3 - Créer Mobile App
                ├─ Setup projet
                ├─ 10 pages principales
                ├─ Composants réutilisables
                ├─ Services (auth, trips, bookings)
                └─ Tests

Semaines 10-16: 🔴 PHASE 4 - Backend API
                ├─ Database PostgreSQL (13 tables)
                ├─ 40+ endpoints
                ├─ Auth (JWT + refresh tokens)
                ├─ Role-based access control
                ├─ Payment integration (Stripe)
                ├─ SMS/Email integration
                └─ Tests

Semaines 17-18: 🟡 PHASE 5 - Intégration & Tests
                ├─ Mobile → Backend
                ├─ Societe → Backend
                ├─ Tests E2E
                ├─ Tests performance
                └─ Tests sécurité

Semaines 19-20: 🚀 PHASE 6 - Déploiement Production
                ├─ AWS setup
                ├─ CI/CD pipeline
                ├─ Monitoring
                └─ Documentation
```

---

## RISQUES & MITIGATION

### Risque 1 : Backend API prend + de temps que prévu

**Probabilité :** Élevée  
**Impact :** Critique  
**Mitigation :**
- Commencer le Backend dès la Semaine 6 (en parallèle de Mobile)
- Prioriser les endpoints critiques (auth, trips, bookings)
- Utiliser un générateur de code (NestJS CLI, Django REST Framework)
- Recruter un 2ème backend developer

### Risque 2 : Incompatibilités entre Mobile et Admin

**Probabilité :** Moyenne  
**Impact :** Moyen  
**Mitigation :**
- Utiliser Shared/ dès le début (Phase 1)
- Tests d'intégration réguliers
- Code reviews croisées entre équipes
- Documentation des types et API

### Risque 3 : Régression lors de la migration Admin → Societe/

**Probabilité :** Moyenne  
**Impact :** Moyen  
**Mitigation :**
- Tests unitaires avant migration
- Migration page par page
- Garder une copie de l'ancien code
- Rollback plan en place

### Risque 4 : Performance insuffisante en production

**Probabilité :** Moyenne  
**Impact :** Élevé  
**Mitigation :**
- Load testing dès la Phase 5
- Optimisation database (indexes, query optimization)
- Caching avec Redis
- CDN pour assets statiques
- Lazy loading côté frontend

### Risque 5 : Failles de sécurité

**Probabilité :** Moyenne  
**Impact :** Critique  
**Mitigation :**
- Security audit externe
- Penetration testing
- OWASP Top 10 compliance
- Regular dependency updates
- Code reviews with security focus

---

## CHECKLIST DE VALIDATION

### ✅ Phase 1 - Shared Layer

- [ ] apiClient.ts créé et testé
- [ ] Les 18 types définis dans standardized.ts
- [ ] 0 erreurs TypeScript
- [ ] Tests unitaires passent (100%)
- [ ] Documentation complète

### ✅ Phase 2 - Admin Migration

- [ ] Societe/ créé avec structure correcte
- [ ] Symlink vers Shared/ fonctionne
- [ ] Tous les imports utilisent Shared/
- [ ] Pages organisées par rôle (responsable/manager/caissier)
- [ ] Rôles migrés vers spec v2.0
- [ ] App fonctionne en mode mock
- [ ] 0 erreurs TypeScript
- [ ] Tests passent

### ✅ Phase 3 - Mobile App

- [ ] Mobile/ créé avec structure correcte
- [ ] Symlink vers Shared/ fonctionne
- [ ] 10 pages principales implémentées
- [ ] Composants réutilisables créés
- [ ] Services utilisent apiClient de Shared/
- [ ] App fonctionne en mode mock
- [ ] 0 erreurs TypeScript
- [ ] Tests passent
- [ ] Responsive design vérifié

### ✅ Phase 4 - Backend API

- [ ] Database PostgreSQL créée (13 tables)
- [ ] 40+ endpoints implémentés
- [ ] Auth JWT fonctionnel
- [ ] Token refresh fonctionnel
- [ ] Role-based access control implémenté
- [ ] Validation input sur tous les endpoints
- [ ] Error handling centralisé
- [ ] Tests unitaires (couverture > 80%)
- [ ] Tests d'intégration passent
- [ ] Documentation API (Swagger) complète

### ✅ Phase 5 - Intégration

- [ ] Mobile connecté au Backend (mode production)
- [ ] Societe connecté au Backend (mode production)
- [ ] Passenger peut créer booking → Operator voit en temps réel
- [ ] Operator crée trip → Passenger peut le réserver
- [ ] WebSocket real-time fonctionne
- [ ] Tests E2E passent (100%)
- [ ] Performance acceptable (< 500ms API, < 3s load)
- [ ] Sécurité vérifiée (pen testing)

### ✅ Phase 6 - Production

- [ ] AWS infrastructure déployée
- [ ] CI/CD pipeline fonctionnel
- [ ] Monitoring actif (Sentry, CloudWatch, Uptime)
- [ ] SSL/HTTPS configuré
- [ ] Domaines pointent correctement
- [ ] Backups automatiques configurés
- [ ] Documentation complète
- [ ] Formation des utilisateurs effectuée

---

## 🎯 CONCLUSION

### Résumé du Plan

**Durée totale :** 20 semaines (~5 mois)  
**Équipe recommandée :** 7 personnes  
**Budget estimé :** Moyen à Élevé

### Livrables Finaux

1. ✅ **Mobile App** : 10+ pages, app passagers complète
2. ✅ **Admin App (Societe)** : 30 pages (3 rôles), app opérateurs complète
3. ✅ **Shared Layer** : Code partagé, ZÉRO duplication
4. ✅ **Backend API** : 40+ endpoints, 13 tables database
5. ✅ **Tests** : Unit, Integration, E2E (couverture > 80%)
6. ✅ **Deployment** : Production-ready sur AWS
7. ✅ **Documentation** : API Reference, Guides, Manuals

### Prochaines Étapes Immédiates

1. **Valider ce plan** avec l'équipe et les stakeholders
2. **Recruter l'équipe** si nécessaire
3. **Commencer Phase 0** : Audit + Configuration
4. **Kickoff Phase 1** : Créer Shared/ (priorité absolue)

### Success Metrics

- ✅ **Temps de développement** : ≤ 20 semaines
- ✅ **Code duplication** : 0%
- ✅ **Test coverage** : > 80%
- ✅ **API response time** : < 500ms
- ✅ **App load time** : < 3 seconds
- ✅ **Uptime** : > 99.5%
- ✅ **User satisfaction** : > 4.5/5

---

**Auteur:** Plan de Migration FasoTravel  
**Date:** 30 janvier 2026  
**Version:** 1.0  
**Statut:** PRÊT POUR EXÉCUTION ✅

---

**IMPORTANT :** Ce plan doit être validé par toutes les parties prenantes avant de commencer l'implémentation. Des ajustements peuvent être nécessaires en fonction des ressources disponibles et des priorités business.
