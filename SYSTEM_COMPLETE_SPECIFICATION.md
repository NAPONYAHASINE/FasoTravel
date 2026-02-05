# 🏗️ FASOTRAVEL - COMPLETE SYSTEM SPECIFICATION

**Version:** 1.0  
**Date:** January 30, 2026  
**Scope:** Entire FasoTravel System (Mobile + Admin + Shared)  
**Status:** Complete Technical Definition

---

## TABLE OF CONTENTS

1. [Vue Globale du Système](#vue-globale-du-système)
2. [Architecture Distribuée](#architecture-distribuée)
3. [Shared Services & Types](#shared-services--types)
4. [Application Mobile](#application-mobile)
5. [Application Admin (Societe)](#application-admin-societe)
6. [Synchronisation entre Apps](#synchronisation-entre-apps)
7. [API Backend Requise](#api-backend-requise)
8. [Patterns & Conventions](#patterns--conventions)
9. [Checklist Cohérence Globale](#checklist-cohérence-globale)

---

## VUE GLOBALE DU SYSTÈME

### Architecture Générale

```
┌──────────────────────────────────────────────────────────────────┐
│                     FASOTRAVEL SYSTEM                            │
└──────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐         ┌────▼─────┐
    │  Mobile │          │ Admin   │         │  Shared   │
    │   App   │          │(Societe)│         │  Services │
    │         │          │         │         │  & Types  │
    │ Passenger│          │ Operator│         │           │
    │ Facing   │          │ Facing  │         │ Core      │
    └────┬────┘          └────┬────┘         │ Logic     │
         │                    │               │           │
         │                    │               │  ├─ API   │
         │                    │               │  ├─ Auth  │
         │                    │               │  ├─ Types │
         │                    │               │  └─ Utils │
         │                    │               └────┬─────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  BACKEND API       │
                    │  (To be built)     │
                    │                    │
                    │ 40+ Endpoints      │
                    │ PostgreSQL/MongoDB │
                    │ WebSocket/REST     │
                    └────────────────────┘
```

### Flux de Données Global

```
PASSENGER                          OPERATOR
(Mobile App)                       (Admin/Societe)
     │                                   │
     │                                   │
     └──────────────────┬────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Shared Layer      │
              │  ├─ apiClient      │
              │  ├─ Types          │
              │  ├─ Constants      │
              │  └─ Utils          │
              └─────────┬──────────┘
                        │
              ┌─────────▼──────────┐
              │  Backend API       │
              │  (To Implement)    │
              └────────────────────┘
                        │
              ┌─────────▼──────────┐
              │  Database          │
              │  PostgreSQL/MongoDB│
              │  (Single Source)   │
              └────────────────────┘
```

### Dossier Racine: c:\FasoTravel\

```
c:\FasoTravel\
│
├─ Mobile/                          ← App Passagers (React Native/Vite)
│  ├─ src/
│  │  ├─ pages/                    ← Pages passenger (search, book, tracking)
│  │  ├─ components/               ← UI Components
│  │  ├─ hooks/                    ← useAuth, useTrips, useBookings
│  │  ├─ contexts/                 ← AuthContext, BookingContext
│  │  └─ services/                 ← Local services (NOT API)
│  └─ ... config files
│
├─ Societe/                         ← App Admin (React + TypeScript)
│  ├─ src/
│  │  ├─ pages/                    ← Pages admin (responsable/manager/caissier)
│  │  ├─ components/               ← Dashboard UI
│  │  ├─ hooks/                    ← useAuth, useData, useFilteredData
│  │  ├─ contexts/                 ← AuthContext, DataContext
│  │  └─ services/                 ← Local services (NOT API)
│  └─ ... config files
│
├─ Shared/                          ← CODE PARTAGÉ ENTRE MOBILE & SOCIETE
│  ├─ services/
│  │  └─ apiClient.ts              ← ✅ HTTP client (tous les appels passent par là)
│  └─ types/
│     └─ standardized.ts           ← ✅ Types partagés (18 entités)
│
├─ Scripts/                         ← Utilitaires
│  └─ coherence-test.js            ← Vérifier la cohérence
│
├─ SYSTEM_COMPLETE_SPECIFICATION.md ← THIS FILE (Root)
└─ Autres documentations
```

---

## ARCHITECTURE DISTRIBUÉE

### Principe 1: Single Source of Truth

**TOUT** doit venir du backend API. Pas de duplication de données.

```
Backend Database (Single Source)
         ↓
    API Endpoints (40+)
    ├─ GET /api/trips
    ├─ GET /api/tickets
    ├─ GET /api/stations
    └─ ... etc
         ↓
   ┌─────┴─────┐
   │           │
Mobile      Societe
Cache       Cache
(Local)     (Local)
```

### Principe 2: Shared Layer

**Toute communication avec le backend** doit passer par `shared/services/apiClient.ts`

```
Mobile App              Societe App
    │                       │
    └───────────┬───────────┘
                │
        shared/services/apiClient.ts
                │
          Backend API
```

**NO EXCEPTIONS.** Jamais d'appels API directs dans Mobile ou Societe.

### Principe 3: Types Partagés

**Toutes les entités** définies dans `shared/types/standardized.ts`

```
shared/types/standardized.ts
├─ OperatorUser
├─ Route
├─ Station
├─ Trip
├─ Ticket
├─ Cashier
├─ ... 18 entités total
    ├─ Utilisées par Mobile
    ├─ Utilisées par Societe
    └─ Synchronisées via Backend
```

**NO DUPLICATION.** Une entité = une définition.

---

## SHARED SERVICES & TYPES

### Localisation des Fichiers Partagés

```
c:\FasoTravel\shared/
├─ services/
│  ├─ apiClient.ts              ← HTTP client principal
│  ├─ index.ts                  ← Exports tous les services
│  └─ ...autres services?
│
└─ types/
   ├─ standardized.ts           ← Toutes les 18 entités
   ├─ enums.ts                  ← Enums partagés
   └─ index.ts                  ← Exports

   ├─ Mobile/
   │  └─ shared/                ← Symlink ou copie vers ../Shared
   │
   └─ Societe/
      └─ shared/                ← Symlink ou copie vers ../Shared
```

### apiClient.ts - Le Point Central

```typescript
// shared/services/apiClient.ts

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // ✅ AUTO-INJECTION DE TOKEN
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('transportbf_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // ✅ ERROR HANDLING CENTRALISÉ
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expiré, logout
          localStorage.clear();
          window.location.href = '/login';
        }
        throw new ApiError(error);
      }
    );
  }

  // ✅ TOUTES les méthodes HTTP passent par ici
  async get<T>(url: string, config?: any): Promise<T> {
    return this.client.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
```

### Types Partagés - 18 Entités

```typescript
// shared/types/standardized.ts

// USER TYPES
export interface OperatorUser {
  id: string;
  email: string;
  name: string;
  role: 'responsable' | 'manager' | 'caissier';
  societyId: string;
  societyName: string;
  gareId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassengerUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

// TRANSPORT ENTITIES
export interface Route {
  id: string;
  name: string;
  startStation: string;
  endStation: string;
  distance: number;
  estimatedDuration: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  location: { lat: number; lng: number };
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  routeId: string;
  scheduleId: string;
  gareId: string;
  departureTime: string;
  arrivalTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  currentPassengers: number;
  capacity: number;
  driver?: string;
  vehicle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  tripId: string;
  passengerId: string;
  seatNumber: string;
  fare: number;
  status: 'booked' | 'confirmed' | 'used' | 'cancelled' | 'refunded';
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

// ... 12 autres entités
// Cashier, CashTransaction, ScheduleTemplate, PricingSegment,
// Incident, Story, Review, Manager, Support, etc.
```

---

## APPLICATION MOBILE

### Vue d'Ensemble

**Qui l'utilise:** Passagers/Voyageurs  
**Objectif:** Rechercher, réserver, acheter billets, tracker trajets  
**Plateforme:** React Native (ou Vite Web)  
**Authentification:** PassengerUser (email + password)

### Structure des Dossiers

```
Mobile/
├─ src/
│  ├─ pages/
│  │  ├─ HomePage.tsx              ← Accueil, recherche rapide
│  │  ├─ SearchTripsPage.tsx       ← Liste des trajets
│  │  ├─ BookingPage.tsx           ← Réservation
│  │  ├─ CheckoutPage.tsx          ← Paiement
│  │  ├─ MyBookingsPage.tsx        ← Mes réservations
│  │  ├─ TripTrackingPage.tsx      ← Suivi en direct
│  │  ├─ ProfilePage.tsx           ← Mon profil
│  │  ├─ LoginPage.tsx             ← Authentification
│  │  └─ ResetPasswordPage.tsx
│  │
│  ├─ components/
│  │  ├─ TripCard.tsx              ← Card trip avec prix
│  │  ├─ SeatSelector.tsx          ← Sélection sièges
│  │  ├─ PaymentForm.tsx           ← Formulaire paiement
│  │  ├─ BookingConfirmation.tsx   ← Confirmation
│  │  ├─ LiveMap.tsx               ← Carte en direct
│  │  └─ SearchFilter.tsx
│  │
│  ├─ contexts/
│  │  ├─ AuthContext.tsx           ← User passenger login
│  │  ├─ BookingContext.tsx        ← Panier réservation
│  │  └─ AppContext.tsx
│  │
│  ├─ hooks/
│  │  ├─ useAuth.ts                ← { user, login, logout, isAuth }
│  │  ├─ useTrips.ts               ← { trips, search, filter }
│  │  ├─ useBooking.ts             ← { booking, addTicket, confirm }
│  │  ├─ useLiveLocation.ts        ← WebSocket location tracking
│  │  └─ usePayment.ts
│  │
│  ├─ services/
│  │  ├─ authService.ts            ← Appelle shared/apiClient
│  │  ├─ tripService.ts            ← Appelle shared/apiClient
│  │  ├─ bookingService.ts         ← Appelle shared/apiClient
│  │  ├─ paymentService.ts         ← Stripe/PayPal
│  │  └─ liveLocationService.ts    ← WebSocket
│  │
│  ├─ shared/                       ← Copie ou symlink vers ../Shared
│  │  ├─ services/
│  │  │  └─ apiClient.ts
│  │  └─ types/
│  │     └─ standardized.ts
│  │
│  └─ App.tsx
│     └─ Router setup (Login -> Home -> Search -> Booking -> Tracking)
│
└─ ... config files
```

### Pages Mobile (Détaillées)

**HomePage**
```
┌──────────────────────────┐
│  Logo + Greeting         │
├──────────────────────────┤
│  Search Bar              │
│  From [City] ────────┐   │
│  To   [City] ──────┐ │   │
│  Date [Pick Date] │ │   │
│  Passengers [1▼]  │ │   │
│  └─ [Search Button]     │
├──────────────────────────┤
│  Quick Tips / Promotions │
│  "Book now, save 20%"    │
├──────────────────────────┤
│  Recent Bookings         │
│  ├─ Trip 1               │
│  └─ Trip 2               │
└──────────────────────────┘
```

**SearchTripsPage**
```
┌──────────────────────────┐
│  Filters [Edit]          │
├──────────────────────────┤
│  Sort: Price △ Time △    │
├──────────────────────────┤
│  TripCard:               │
│  ├─ Route name           │
│  ├─ Departure time       │
│  ├─ Duration             │
│  ├─ Available seats      │
│  ├─ Price               │
│  └─ [Select Button]      │
│                          │
│  TripCard...             │
│  TripCard...             │
└──────────────────────────┘
```

**BookingPage**
```
┌──────────────────────────┐
│  Trip Details            │
│  Confirm: Route, Time    │
├──────────────────────────┤
│  Select Seats            │
│  🪑🪑🪑ⓧⓧⓧ              │
│  (Booked/Available/Yours) │
├──────────────────────────┤
│  Passenger Info          │
│  Name: _________         │
│  Phone: _________        │
│  Email: _________        │
├──────────────────────────┤
│  Price Breakdown         │
│  Fare: 50,000 F          │
│  Tax: 2,000 F            │
│  Total: 52,000 F         │
├──────────────────────────┤
│  [Confirm Booking]       │
└──────────────────────────┘
```

**TripTrackingPage**
```
┌──────────────────────────┐
│  Trip Status             │
│  Dakar → Bamako          │
│  Departure: 14:30        │
│  Arrival: 22:15 (ETA)    │
├──────────────────────────┤
│  Map (Current Location)  │
│  🚐 ───────── Destination│
│  ⏱️ ETA: 45 minutes       │
├──────────────────────────┤
│  Trip Details            │
│  Driver: John Doe        │
│  Vehicle: AB-123-XYZ     │
│  Passengers: 42/50       │
├──────────────────────────┤
│  Call Driver [Button]    │
│  Chat [Button]           │
└──────────────────────────┘
```

### Services Mobile

```typescript
// Mobile/src/services/authService.ts
import { apiClient } from '../../shared/services/apiClient';
import { PassengerUser } from '../../shared/types/standardized';

export async function loginPassenger(email: string, password: string): Promise<PassengerUser> {
  const response = await apiClient.post('/auth/passenger-login', {
    email,
    password
  });
  localStorage.setItem('transportbf_auth_token', response.token);
  return response.user;
}

export async function logout(): Promise<void> {
  localStorage.removeItem('transportbf_auth_token');
}

// Mobile/src/services/tripService.ts
import { apiClient } from '../../shared/services/apiClient';
import { Trip } from '../../shared/types/standardized';

export async function searchTrips(filters: {
  from: string;
  to: string;
  date: string;
  passengers: number;
}): Promise<Trip[]> {
  return apiClient.get('/trips', { params: filters });
}

export async function getTripDetails(tripId: string): Promise<Trip> {
  return apiClient.get(`/trips/${tripId}`);
}
```

---

## APPLICATION ADMIN (SOCIETE)

### Vue d'Ensemble

**Qui l'utilise:** Opérateurs (Responsable/Manager/Caissier)  
**Objectif:** Gérer trajets, stations, tarification, ventes, incidents  
**Plateforme:** React + TypeScript  
**Authentification:** OperatorUser avec 3 rôles

### Structure des Dossiers

```
Societe/
├─ src/
│  ├─ pages/
│  │  ├─ LoginPage.tsx
│  │  ├─ responsable/
│  │  │  ├─ Dashboard.tsx (Router parent)
│  │  │  ├─ DashboardHome.tsx
│  │  │  ├─ RoutesPage.tsx           ← Create/Edit/Delete routes
│  │  │  ├─ StationsPage.tsx         ← Manage stations
│  │  │  ├─ SchedulesPage.tsx        ← Schedule templates
│  │  │  ├─ PricingPage.tsx          ← Pricing rules
│  │  │  ├─ ManagersPage.tsx         ← Staff management
│  │  │  ├─ AnalyticsPage.tsx        ← Advanced reports
│  │  │  └─ ... 6 more pages
│  │  │
│  │  ├─ manager/
│  │  │  ├─ Dashboard.tsx (Router parent)
│  │  │  ├─ DashboardHome.tsx        ← Station overview
│  │  │  ├─ DeparturesPage.tsx       ← Today's trips
│  │  │  ├─ CashiersPage.tsx         ← Staff at station
│  │  │  ├─ SalesSupervisionPage.tsx ← Sales monitoring
│  │  │  └─ ... 3 more pages
│  │  │
│  │  └─ caissier/
│  │     ├─ Dashboard.tsx (Router parent)
│  │     ├─ DashboardHome.tsx        ← Sales dashboard
│  │     ├─ TicketSalePage.tsx       ← MAIN (sell tickets)
│  │     ├─ CashManagementPage.tsx   ← Cash drawer
│  │     ├─ RefundPage.tsx           ← Process refunds
│  │     └─ ... 4 more pages
│  │
│  ├─ components/
│  │  ├─ dashboard/
│  │  │  ├─ StatCard.tsx
│  │  │  ├─ DataTable.tsx
│  │  │  └─ ChartWidget.tsx
│  │  │
│  │  ├─ forms/
│  │  │  ├─ FormDialog.tsx
│  │  │  ├─ RouteForm.tsx
│  │  │  └─ StationForm.tsx
│  │  │
│  │  └─ layout/
│  │     ├─ DashboardLayout.tsx
│  │     ├─ Sidebar.tsx
│  │     └─ TopBar.tsx
│  │
│  ├─ contexts/
│  │  ├─ AuthContext.tsx        ← OperatorUser + token
│  │  ├─ DataContext.tsx        ← All 18 entities + CRUD
│  │  └─ ThemeContext.tsx       ← Dark/light mode
│  │
│  ├─ hooks/
│  │  ├─ useAuth.ts             ← { user, login, logout }
│  │  ├─ useData.ts             ← All 18 entities + CRUD
│  │  ├─ useFilteredData.ts     ← Role-based filtering
│  │  └─ useTheme.ts
│  │
│  ├─ services/
│  │  ├─ api/
│  │  │  ├─ authService.ts      ← Appelle shared/apiClient
│  │  │  ├─ tripService.ts
│  │  │  ├─ ticketService.ts
│  │  │  ├─ stationService.ts
│  │  │  ├─ routeService.ts
│  │  │  ├─ scheduleService.ts
│  │  │  ├─ pricingService.ts
│  │  │  ├─ cashierService.ts
│  │  │  ├─ managerService.ts
│  │  │  ├─ storyService.ts
│  │  │  └─ liveLocationService.ts (WebSocket)
│  │  │
│  │  └─ config/
│  │     └─ deployment.ts       ← isDevelopment() helper
│  │
│  ├─ shared/                   ← Copie ou symlink vers ../Shared
│  │  ├─ services/
│  │  │  └─ apiClient.ts
│  │  └─ types/
│  │     └─ standardized.ts
│  │
│  └─ App.tsx
│     └─ Router setup (Login -> Role Dashboards)
│
└─ ... config files
```

### Services Admin

```typescript
// Societe/src/services/api/authService.ts
import { apiClient } from '../../shared/services/apiClient';
import { OperatorUser } from '../../shared/types/standardized';

export async function loginOperator(
  email: string,
  password: string,
  otp: string
): Promise<{ user: OperatorUser; token: string }> {
  const response = await apiClient.post('/auth/operator-login', {
    email,
    password,
    otp
  });
  localStorage.setItem('transportbf_auth_token', response.token);
  return response;
}

// Societe/src/services/api/tripService.ts
import { apiClient } from '../../shared/services/apiClient';
import { Trip } from '../../shared/types/standardized';

export async function listTrips(filters?: any): Promise<Trip[]> {
  return apiClient.get('/trips', { params: filters });
}

export async function createTrip(data: any): Promise<Trip> {
  return apiClient.post('/trips', data);
}

export async function updateTrip(id: string, data: any): Promise<Trip> {
  return apiClient.put(`/trips/${id}`, data);
}

export async function deleteTrip(id: string): Promise<void> {
  return apiClient.delete(`/trips/${id}`);
}
```

---

## SYNCHRONISATION ENTRE APPS

### Quand Mobile et Societe Utilisent les Mêmes Données

```
SCENARIO: Passenger books a ticket → Operator sees it immediately

1. Passenger:
   - Opens Mobile app
   - Searches trips → List fetches from /api/trips
   - Selects trip and books
   - POST /api/tickets → Backend saves

2. Operator:
   - Opens Admin app
   - Views TicketsPage → GET /api/tickets
   - NEW TICKET APPEARS immediately ✅

COMMENT? Parce que TOUT passe par le même Backend API
         Pas de cache, pas de duplication
```

### Real-Time Updates (WebSocket)

```
SCENARIO: Live tracking on Mobile while Manager watches in Admin

Mobile:
  liveLocationService.onCarLocationUpdate((location) => {
    setState({ currentLocation: location });
  });

Admin:
  liveLocationService.onCarLocationUpdate((location) => {
    mapComponent.updateMarker(location);
  });

Both use SAME WebSocket connection from:
  Societe/src/services/api/liveLocationService.ts
  Mobile/src/services/liveLocationService.ts
```

### Data Consistency Across Apps

```
RULE 1: Types are SHARED
├─ Trip type defined ONCE in shared/types/standardized.ts
├─ Used by Mobile App
└─ Used by Admin App

RULE 2: API calls are SHARED
├─ apiClient defined ONCE in shared/services/apiClient.ts
├─ All HTTP calls go through it
├─ Token injection automatic
└─ Error handling unified

RULE 3: Backend is SOURCE OF TRUTH
├─ Mobile cache ≠ Admin cache (may differ)
├─ Backend database is THE TRUTH
├─ Both apps pull from same API
└─ Any conflicts resolved at backend level
```

---

## API BACKEND REQUISE

### 40+ Endpoints à Implémenter

**Auth Endpoints**
```
POST   /api/auth/operator-login          (email, password, otp)
POST   /api/auth/passenger-login         (email, password)
POST   /api/auth/passenger-register      (email, name, phone, password)
POST   /api/auth/refresh-token           (refreshToken)
POST   /api/auth/logout                  (POST)
```

**Route Endpoints**
```
GET    /api/routes                       (list all)
GET    /api/routes/:id                   (get single)
POST   /api/routes                       (create - responsable only)
PUT    /api/routes/:id                   (update - responsable only)
DELETE /api/routes/:id                   (delete - responsable only)
```

**Station Endpoints**
```
GET    /api/stations                     (list all)
GET    /api/stations/:id                 (get single)
POST   /api/stations                     (create)
PUT    /api/stations/:id                 (update)
DELETE /api/stations/:id                 (delete)
```

**Trip Endpoints**
```
GET    /api/trips                        (search with filters)
GET    /api/trips/:id                    (get single)
POST   /api/trips                        (create)
PUT    /api/trips/:id                    (update)
PATCH  /api/trips/:id/status             (update status only)
DELETE /api/trips/:id                    (delete)
```

**Ticket Endpoints**
```
GET    /api/tickets                      (list - filtered by role)
GET    /api/tickets/:id                  (get single)
POST   /api/tickets                      (create/sell - caissier)
POST   /api/tickets/:id/refund           (refund - caissier)
PATCH  /api/tickets/:id/status           (update status)
DELETE /api/tickets/:id                  (delete)
```

**Cashier Endpoints**
```
GET    /api/cashiers                     (list - filtered by role)
POST   /api/cashiers                     (create)
PUT    /api/cashiers/:id                 (update)
DELETE /api/cashiers/:id                 (delete)
```

**CashTransaction Endpoints**
```
GET    /api/cash-transactions            (list)
POST   /api/cash-transactions            (create)
GET    /api/cash-transactions/shift      (shift summary)
POST   /api/cash-transactions/close-shift (close shift)
```

**Pricing Endpoints**
```
GET    /api/pricing                      (list segments)
POST   /api/pricing                      (create)
PUT    /api/pricing/:id                  (update)
DELETE /api/pricing/:id                  (delete)
GET    /api/pricing/:routeId/calculate   (calculate price)
```

**Schedule Endpoints**
```
GET    /api/schedules                    (list)
POST   /api/schedules                    (create)
PUT    /api/schedules/:id                (update)
DELETE /api/schedules/:id                (delete)
```

**Other Endpoints**
```
GET    /api/stories                      (list)
POST   /api/stories                      (create)
PUT    /api/stories/:id                  (update)
DELETE /api/stories/:id                  (delete)
POST   /api/stories/:id/publish          (publish)

GET    /api/incidents                    (list)
POST   /api/incidents                    (create)
PUT    /api/incidents/:id                (update)
PATCH  /api/incidents/:id/resolve        (mark resolved)

GET    /api/reviews                      (list)
POST   /api/reviews                      (create)
GET    /api/reviews/:tripId/analytics    (ratings analysis)
```

### Query Parameters (Filtering)

```
GET /api/trips?from=Dakar&to=Bamako&date=2026-01-30&status=scheduled

GET /api/tickets?tripId=123&status=booked&passengerId=456

GET /api/incidents?gareId=789&severity=high&status=open

GET /api/transactions?cashierId=456&startDate=2026-01-01&endDate=2026-01-31
```

### Response Format (Standard)

```json
{
  "success": true,
  "data": { /* entity or array */ },
  "message": "Operation successful",
  "timestamp": "2026-01-30T10:30:00Z"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already exists",
    "field": "email"
  },
  "timestamp": "2026-01-30T10:30:00Z"
}
```

---

## PATTERNS & CONVENTIONS

### Pattern: Service Partagé (Appliqué à Tous)

```typescript
// shared/services/apiClient.ts
// C'est le SEUL endroit où on fait des appels HTTP

class ApiClient {
  async get<T>(url: string, config?: any): Promise<T> {
    // Token injection
    // Timeout handling
    // Error handling
    // Logging
  }
}

export const apiClient = new ApiClient();
```

### Pattern: Utilisation dans Services Spécialisés

```typescript
// Mobile/src/services/tripService.ts
// OU
// Societe/src/services/api/tripService.ts

import { apiClient } from '../shared/services/apiClient';

export async function searchTrips(filters: any) {
  // Appelle TOUJOURS apiClient
  return apiClient.get('/api/trips', { params: filters });
}
```

### Pattern: Component → Hook → Service → apiClient

```
Component (Mobile/Societe)
    ↓
useTrips() hook
    ↓
tripService.list()
    ↓
apiClient.get()
    ↓
Backend API
```

### Pattern: Types Partagés

```typescript
// shared/types/standardized.ts
export interface Trip { /* ... */ }

// Mobile/src/pages/SearchTripsPage.tsx
import { Trip } from '../shared/types/standardized';
const trips: Trip[] = await tripService.searchTrips();

// Societe/src/pages/responsable/RoutesPage.tsx
import { Trip } from '../shared/types/standardized';
const trips: Trip[] = await tripService.listTrips();

// SAME TYPE, SAME INTERFACE
```

---

## CHECKLIST COHÉRENCE GLOBALE

### ✅ Architecture

- [ ] Tous les appels HTTP passent par `shared/services/apiClient.ts`
- [ ] Pas d'appels fetch() directs nulle part
- [ ] Pas de duplication de services (une seule source)
- [ ] Mobile et Societe partagent `shared/` folder
- [ ] Toutes les 18 entités définies dans `shared/types/standardized.ts` UNIQUEMENT

### ✅ Authentication

- [ ] PassengerUser pour Mobile (sans rôles)
- [ ] OperatorUser pour Societe (avec 3 rôles: responsable/manager/caissier)
- [ ] Token stocké dans localStorage (clé: 'transportbf_auth_token')
- [ ] Token injecté automatiquement par apiClient
- [ ] Token expiré → 401 → redirect /login

### ✅ Data Flow

- [ ] Backend API = Single Source of Truth
- [ ] Mobile cache local peut être différent de Societe cache
- [ ] Conflits résolus au niveau backend
- [ ] WebSocket pour real-time updates (liveLocationService)
- [ ] Pas de synchronisation manuelle entre apps

### ✅ Mobile App

- [ ] Structure: pages/, components/, services/, contexts/, hooks/
- [ ] Services appellent apiClient (JAMAIS d'appels directs)
- [ ] PassengerUser authentification
- [ ] Pages: Home, Search, Booking, Checkout, Tracking, Profile
- [ ] Utilise shared/types et shared/services

### ✅ Admin App (Societe)

- [ ] Structure: pages/, components/, services/, contexts/, hooks/
- [ ] Pages: Login → Responsable/Manager/Caissier Dashboard
- [ ] Services appellent apiClient (JAMAIS d'appels directs)
- [ ] 13 pages pour Responsable, 8 pour Manager, 9 pour Caissier
- [ ] useFilteredData applique le filtrage par rôle
- [ ] Utilise shared/types et shared/services

### ✅ Shared Layer

- [ ] shared/services/apiClient.ts (LE seul point HTTP)
- [ ] shared/types/standardized.ts (18 entités partagées)
- [ ] Pas de duplication de types
- [ ] Pas de duplication de services
- [ ] Symlink ou copie vers Mobile/ et Societe/

### ✅ Backend API

- [ ] 40+ endpoints implémentés
- [ ] Authentification: /auth/operator-login, /auth/passenger-login
- [ ] CRUD pour toutes les 18 entités
- [ ] Filtrage par rôle (Responsable/Manager/Caissier)
- [ ] WebSocket pour tracking en direct
- [ ] Standard response format (success, data, message, timestamp)

### ✅ Synchronisation

- [ ] Mobile crée Ticket → Admin voit immédiatement
- [ ] Admin crée Trip → Mobile voit immédiatement
- [ ] Fondé sur le même Backend API
- [ ] Pas de cache conflit possible
- [ ] Live updates via WebSocket

### ✅ Nommage

- [ ] Fichiers: PascalCase (Component.tsx), camelCase (service.ts)
- [ ] Variables: camelCase (myVariable)
- [ ] Constants: UPPER_SNAKE_CASE
- [ ] Types/Interfaces: PascalCase
- [ ] Enums: PascalCase avec valeurs camelCase

### ✅ Pas de Duplication

- [ ] Aucun type défini en deux endroits
- [ ] Aucun service HTTP défini en deux endroits
- [ ] Aucun constant défini en deux endroits
- [ ] Types partagés via shared/types/
- [ ] Services partagés via shared/services/
- [ ] Si c'est partagé → shared/

### ✅ Build & Quality

- [ ] TypeScript: 0 errors (Mobile et Societe)
- [ ] No console.log() calls
- [ ] All imports use correct paths
- [ ] No circular dependencies
- [ ] Build succeeds for both apps
- [ ] No unused imports

---

## RÉSUMÉ FINAL

**Vous avez maintenant une spécification COMPLÈTE du système:**

1. **Vue Globale** - Comment Mobile, Societe et Shared se connectent
2. **Architecture Distribuée** - Single API, Multiple Apps
3. **Shared Layer** - apiClient et Types partagés
4. **Mobile App** - 10+ pages pour passagers
5. **Admin App** - 30 pages pour opérateurs
6. **Synchronisation** - Comment les données restent cohérentes
7. **API Backend** - 40+ endpoints à implémenter
8. **Patterns** - Conventions à suivre partout
9. **Checklist** - Vérifier NO INCONSISTENCIES

**Cette spécification garantit:**
- ✅ Pas de duplication de code
- ✅ Pas d'incohérences entre apps
- ✅ Single source of truth (Backend API)
- ✅ Maintenabilité long-terme
- ✅ Scalabilité facile

