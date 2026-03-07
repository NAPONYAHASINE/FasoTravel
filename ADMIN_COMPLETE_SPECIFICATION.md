# 🚀 FASOTRAVEL ADMIN - SPÉCIFICATION COMPLÈTE FRONTEND + BACKEND

**Date:** Février 2026  
**Purpose:** Guide complet pour développement IA - Frontend + Backend  
**Status:** READY FOR AI IMPLEMENTATION

---

## TABLE DES MATIÈRES COMPLÈTE

1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture Générale](#architecture-générale)
3. [Stack Technologique](#stack-technologique)
4. [Analyse de l'Existant (Mobile)](#analyse-de-lexistant-mobile)
5. [Base de Données - Schéma Complet](#base-de-données--schéma-complet)
6. [Backend - Liste Complète des Endpoints](#backend--liste-complète-des-endpoints)
7. [Backend - Middleware et Services](#backend--middleware-et-services)
8. [Frontend - Structure Complète](#frontend--structure-complète)
9. [Frontend - Pages et Fonctionnalités](#frontend--pages-et-fonctionnalités)
10. [Cohérence Frontend/Backend/Mobile](#cohérence-frontendbackendmobile)
11. [Points d'Intégration Critiques](#points-dintégration-critiques)

---

## VUE D'ENSEMBLE DU PROJET

### Contexte

**FasoTravel** est une plateforme de réservation de transport interurbain en Afrique de l'Ouest (Burkina Faso, Mali, Mauritanie, Guinée, Sénégal).

**Composants existants:**
- ✅ **Mobile App** (React + Vite) - Application client pour réserver des trajets
- ✅ **Mobile Backend** - API pour la mobile app
- ⏳ **Admin App** - À construire (ce projet)

### Objectif Admin

L'app admin doit permettre aux administrateurs de:
1. **Gérer les trajets** (créer, modifier, annuler, gérer capacité)
2. **Gérer les opérateurs** (approuver, suspendre, documents)
3. **Gérer les gares** (CRUD, localisation, services)
4. **Voir les réservations** (filtrer, annuler, refund)
5. **Gérer les paiements** (transactions, remboursements, réconciliation)
6. **Gérer les utilisateurs** (admins, rôles, permissions)
7. **Gérer le contenu** (stories, annonces, notifications)
8. **Supports clients** (tickets, chat, résolution)
9. **Analytics** (KPIs, rapports, exports)

### Rôles Administrateur (Permissions)

```
SUPER_ADMIN
├── Accès complet système
├── Gestion des opérateurs (approuver/rejeter)
├── Gestion des utilisateurs admins
└── Paramètres système

OPERATOR_ADMIN
├── Gestion trajets LEUR opérateur uniquement
├── Gestion réservations LEUR opérateur
├── Voir paiements LEUR opérateur
└── SANS accès autres opérateurs

SUPPORT_ADMIN
├── Voir tous les tickets support
├── Chat avec clients
├── Annuler réservations (exceptionnellement)
├── Gérer remboursements
└── SANS accès gestion opérateurs/trajets

FINANCE_ADMIN
├── Voir toutes transactions
├── Gérer remboursements
├── Réconciliation paiements
├── Exports rapports financiers
└── SANS accès gestion trajets

CONTENT_ADMIN
├── Gérer stories/annonces
├── Gérer notifications
├── Gérer pages statiques
└── SANS accès données sensibles
```

---

## ARCHITECTURE GÉNÉRALE

### Diagramme Global

```
┌─────────────────────────────────────────────────────────────┐
│                      FASOTRAVEL ECOSYSTEM                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  │  Mobile App  │      │  Admin App   │      │ Backend API  │
│  │ (React)      │      │  (React)     │      │ (Node/Python)│
│  │ Port 3000    │      │  Port 3001   │      │  Port 5000   │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
│         │                     │                     │
│   GET /api/trips       GET /api/admin/trips  READ  │
│   POST /api/bookings   POST /api/admin/trips WRITE │
│   GET /api/tickets     DELETE /api/admin/trips     │
│         │                     │                     │
│         └─────────────────────┼─────────────────────┘
│                               │
│                        ┌──────▼────────┐
│                        │  PostgreSQL   │
│                        │  Database     │
│                        └───────────────┘
│
│  ┌─────────────────────────────────────────┐
│  │   External APIs                        │
│  ├─────────────────────────────────────────┤
│  │ • Orange Money API (Paiements)          │
│  │ • Moov Money API (Paiements)            │
│  │ • Google Maps API (Géolocalisation)    │
│  │ • Firebase (Push notifications)         │
│  └─────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

### Communication Backend-Frontend

```
Admin Frontend          Backend            Mobile Frontend
    │                    │                      │
    │─ POST /admin/login─▶│                      │
    │◀── token + user ───│                      │
    │                    │                      │
    │─ GET /api/trips────▶│                      │
    │ (avec Auth header)  │                      │
    │◀── trips list ─────│                      │
    │                    │                      │
    │─ POST /admin/trips ▶│                      │
    │ (créer trajet)      │                      │
    │◀── trajet créé ────│                      │
    │                    │                      │
    │                    │─ WebSocket push ────▶│
    │                    │ (new trip available) │
    │                    │                      │
```

---

## STACK TECHNOLOGIQUE

### Frontend Admin

```javascript
{
  "react": "18.3.1",
  "typescript": "5.3.3",
  "vite": "5.x.x",
  "@vitejs/plugin-react-swc": "latest",
  
  // UI Components
  "@radix-ui/react-*": "^1.x.x",  // 30+ components
  "motion": "11.15.0",             // Animations
  "lucide-react": "0.487.0",        // Icons
  
  // Forms & Validation
  "react-hook-form": "7.55.0",
  "zod": "3.x.x",                  // Schema validation
  
  // Tables & Data
  "@tanstack/react-table": "8.x.x", // Tables
  "react-table": "8.x.x",
  
  // Charts & Graphs
  "recharts": "2.15.2",             // Charts exists in Mobile
  
  // Utilities
  "axios": "1.x.x",                 // HTTP client
  "date-fns": "3.x.x",              // Date manipulation
  "clsx": "2.1.1",
  "tailwind-merge": "2.4.0",
  
  // Export
  "jspdf": "2.x.x",                 // PDF export
  "xlsx": "0.18.x",                 // Excel export
  "papaparse": "5.x.x",             // CSV parsing
  
  // Notifications
  "sonner": "2.0.3",                // Toast notifications
  
  // State Management (optional)
  "zustand": "4.x.x",              // Lightweight state (alternative TanStack Query)
  
  // i18n
  "i18next": "23.x.x",             // Shared with Mobile (FR/EN/MO)
  "react-i18next": "13.x.x"
}
```

### Backend Stack

```javascript
{
  // Core
  "express": "4.18.x",
  "typescript": "5.3.3",
  "node": "20.x.x",
  
  // Database
  "pg": "8.x.x",                   // PostgreSQL driver
  "sequelize": "6.x.x",             // ORM (ou TypeORM)
  "knex.js": "3.x.x",              // Query builder
  
  // Authentication
  "jsonwebtoken": "9.x.x",         // JWT tokens
  "bcrypt": "5.x.x",               // Password hashing
  "passport": "0.7.x",             // Auth middleware (optional)
  
  // Validation
  "joi": "17.x.x",                 // Schema validation
  "zod": "3.x.x",                  // Alternative
  
  // Payment Gateway
  "stripe": "14.x.x",              // Stripe (if used)
  
  // Async Jobs
  "bull": "4.x.x",                 // Job queue (Redis-backed)
  "bull-board": "5.x.x",           // Admin UI pour jobs
  
  // Caching
  "redis": "4.x.x",                // Redis client
  "ioredis": "5.x.x",              // Alternative
  
  // Logging
  "winston": "3.x.x",              // Logging
  "express-winston": "4.x.x",
  
  // CORS & Security
  "cors": "2.8.x",
  "helmet": "7.x.x",               // Security headers
  "express-rate-limit": "7.x.x",   // Rate limiting
  
  // File Upload
  "multer": "1.4.x",               // File uploads
  "aws-sdk": "2.x.x",              // S3 (Si cloud storage)
  
  // WebSocket (Notifications)
  "socket.io": "4.x.x",            // Real-time (optional)
  
  // HTTP Client
  "axios": "1.x.x",                // Pour appels externes
  
  // Environment
  "dotenv": "16.x.x",
  
  // Utilities
  "uuid": "9.x.x",
  "date-fns": "3.x.x",
  "lodash": "4.x.x",
  "moment": "2.x.x"
}
```

---

## ANALYSE DE L'EXISTANT (MOBILE)

### Structure Mobile App

```
Mobile/
├── src/
│   ├── components/        # 26 composants réutilisables
│   │   ├── ui/            # Radix UI wrapper
│   │   ├── shared/        # Navigation, TTLTimer, etc
│   │   ├── dashboard/     # TripCard, TicketCard, etc
│   │   └── ...
│   ├── pages/             # 20 pages
│   │   ├── HomePage
│   │   ├── SearchResultsPage
│   │   ├── TicketsPage
│   │   ├── ProfilePage
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts         # 40+ endpoints
│   │   ├── hooks.ts       # 20+ hooks réutilisables
│   │   ├── i18n.ts        # FR/EN/MO support
│   │   ├── config.ts
│   │   └── interactions.ts
│   ├── services/
│   │   ├── api/           # Services métier
│   │   └── liveLocation.service.ts
│   ├── data/
│   │   ├── models.ts      # Types centralisés
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── vite.config.ts
├── tsconfig.json
├── package.json
```

### Types Centralisés (À RÉUTILISER)

```typescript
// Mobile/src/data/models.ts - LE FICHIER SOURCE

export type UserRole = 'USER' | 'OPERATOR_ADMIN' | 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN';
export type TicketStatus = 'AVAILABLE' | 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type BookingStatus = 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED';

export interface Trip {
  trip_id: string;
  operator_id: string;
  from_stop_id: string;
  to_stop_id: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;      // ⚠️ MIN(segments[].available_seats)
  price_per_seat: number;
  vehicle_type: 'MINIBUS' | 'BUS' | 'VAN';
  amenities: string[];
  segments: Segment[];
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
}

export interface Booking {
  booking_id: string;
  user_id: string;
  trip_id: string;
  seats: string[];
  total_price: number;
  status: BookingStatus;
  hold_until?: string;
  payment_method?: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARD';
  created_at: string;
}

export interface Operator {
  operator_id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
  // ...
}

// + 15 autres interfaces critiques
```

### API Existante (Mobile)

```typescript
// Mobile/src/lib/api.ts - 40+ endpoints

// TRIPS
getTrips(filter) → Trip[]
getTripById(id) → Trip
searchTrips(params) → Trip[]

// BOOKINGS
createBookingHold(tripId, seats) → Booking
confirmBooking(bookingId, paymentMethod) → Booking
getAllBookings() → Booking[]
cancelBooking(bookingId) → void

// STATIONS
getStations() → Station[]
getNearbyStations(lat, lon, radius) → NearbyStation[]

// OPERATORS
getOperators() → Operator[]
getOperatorById(id) → Operator

// USERS
getProfile() → User
updateProfile(data) → User

// STORIES
getActiveStories() → Story[]

// TICKETS
getTickets(filter) → Ticket[]
getTicketById(id) → Ticket
transferTicket(ticketId, recipientPhone) → TransferToken
```

### Hooks Existants (Mobile)

```typescript
// Mobile/src/lib/hooks.ts - 20+ hooks

useStories()
useStations()
useNearbyStations(lat, lon, radius)
useTripById(id)
useTrips(filter)
useSearchTrips(params)
useBookingHold(tripId, seats)
useBookings()
useTickets(filter)
useTicketById(id)
useOperators()
useOperatorById(id)
useProfile()
useUnreadNotificationCount()
useGeolocation()
```

### Patterns à RESPECTER ABSOLUMENT

```typescript
// Pattern 1: Hooks avec état local
export function useSomething() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  return { data, isLoading, error };
}

// Pattern 2: Pages avec navigation
interface PageProps {
  onNavigate: (page: Page, data?: any) => void;
  onBack?: () => void;
  data?: any;
}

export function SomePage({ onNavigate, data }: PageProps) {
  // Implémentation
  return <div>...</div>;
}

// Pattern 3: Formatage & Validation
export function getAvailableSeatsForTrip(trip): number {
  return Math.min(...trip.segments.map(s => s.available_seats));
}

// Pattern 4: Erreur handling
try {
  const data = await api.call();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
}
```

---

## BASE DE DONNÉES - SCHÉMA COMPLET

### Tables Essentielles

```sql
-- =====================
-- 1. UTILISATEURS
-- =====================

CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER',  -- USER, OPERATOR_ADMIN, SUPER_ADMIN, SUPPORT_ADMIN, FINANCE_ADMIN
  status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE, SUSPENDED, PENDING
  profile_picture_url TEXT,
  operator_id UUID REFERENCES operators(operator_id),  -- NULL except for OPERATOR_ADMIN
  
  -- Authentication
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_method VARCHAR(50),  -- 'TOTP', 'SMS', 'EMAIL'
  last_login TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,  -- Soft delete
  
  -- Indexes
  INDEX idx_email (email),
  INDEX idx_operator_id (operator_id),
  INDEX idx_role (role)
);

-- =====================
-- 2. PERMISSIONS & RÔLES
-- =====================

CREATE TABLE roles (
  role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,  -- SUPER_ADMIN, OPERATOR_ADMIN, etc
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(role_id),
  resource VARCHAR(100) NOT NULL,  -- TRIPS, OPERATORS, BOOKINGS, PAYMENTS, USERS, CONTENT, ANALYTICS
  action VARCHAR(50) NOT NULL,     -- CREATE, READ, UPDATE, DELETE, EXPORT, APPROVE
  scope VARCHAR(50) DEFAULT 'ALL',  -- ALL, OWN_OPERATOR, DASHBOARD_ONLY
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(role_id, resource, action, scope)
);

-- =====================
-- 3. OPÉRATEURS
-- =====================

CREATE TABLE operators (
  operator_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  website TEXT,
  logo_url TEXT,
  
  -- Documents
  document_type VARCHAR(50) NOT NULL,  -- BUSINESS_LICENSE, PERMIT
  document_url TEXT NOT NULL,
  document_verified_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, APPROVED, SUSPENDED, REJECTED
  rejection_reason TEXT,
  
  -- Approval
  approved_by UUID REFERENCES users(user_id),
  approval_date TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_name (name)
);

-- =====================
-- 4. GARES/STATIONS
-- =====================

CREATE TABLE stations (
  station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Services
  services JSON DEFAULT '[]',  -- ['parking', 'restaurant', 'wc', 'clinic']
  opening_hours VARCHAR(20),   -- '08:00-20:00'
  
  -- Media
  photos JSON DEFAULT '[]',    -- URLs de photos
  
  -- Status
  status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_city (city),
  INDEX idx_status (status),
  -- Geo index pour nearby queries
  SPATIAL INDEX idx_location (latitude, longitude)
);

-- =====================
-- 5. VÉHICULES
-- =====================

CREATE TABLE vehicles (
  vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(operator_id),
  registration VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,  -- MINIBUS, BUS, VAN
  capacity INT NOT NULL,      -- Nombre total sièges
  
  -- Features
  amenities JSON DEFAULT '[]',  -- ['wifi', 'ac', 'bathroom', 'usb']
  
  -- Documents
  inspection_date TIMESTAMP,
  insurance_expires_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE, MAINTENANCE, RETIRED
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_operator_id (operator_id),
  INDEX idx_status (status)
);

-- =====================
-- 6. TRAJETS
-- =====================

CREATE TABLE trips (
  trip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(operator_id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id),
  from_stop_id UUID NOT NULL REFERENCES stations(station_id),
  to_stop_id UUID NOT NULL REFERENCES stations(station_id),
  
  -- Timing
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  
  -- Capacity
  vehicle_capacity INT NOT NULL,
  available_seats INT NOT NULL,  -- ⚠️ MUST EQUAL MIN(segments.available_seats)
  
  -- Pricing
  price_per_seat INT NOT NULL,  -- In XOF (1000 XOF possible)
  
  -- Features
  amenities JSON DEFAULT '[]',
  vehicle_type VARCHAR(50) NOT NULL,  -- MINIBUS, BUS, VAN
  
  -- Status
  status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE, CANCELLED, COMPLETED
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_operator_id (operator_id),
  INDEX idx_from_stop_id (from_stop_id),
  INDEX idx_to_stop_id (to_stop_id),
  INDEX idx_departure_time (departure_time),
  INDEX idx_status (status)
);

-- =====================
-- 7. SEGMENTS DE TRAJET
-- =====================

CREATE TABLE trip_segments (
  segment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(trip_id),
  
  from_stop_id UUID NOT NULL REFERENCES stations(station_id),
  to_stop_id UUID NOT NULL REFERENCES stations(station_id),
  
  stop_order INT NOT NULL,  -- 1, 2, 3 (ordre des arrêts)
  distance_km DECIMAL(10, 2) NOT NULL,
  duration_minutes INT NOT NULL,
  
  -- KEY: Availability per segment
  available_seats INT NOT NULL,  -- May differ between segments
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_trip_id (trip_id),
  UNIQUE(trip_id, stop_order)
);

-- =====================
-- 8. RÉSERVATIONS
-- =====================

CREATE TABLE bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  trip_id UUID NOT NULL REFERENCES trips(trip_id),
  
  -- Seats reserved
  seats JSON NOT NULL DEFAULT '[]',  -- ['A1', 'A2']
  
  -- Pricing
  total_price INT NOT NULL,  -- In XOF
  
  -- Status
  status VARCHAR(50) DEFAULT 'HOLD',  -- HOLD, PAID, EMBARKED, CANCELLED
  
  -- Timing
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hold_until TIMESTAMP,  -- TTL for HOLD (10 minutes)
  paid_at TIMESTAMP,
  embarked_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Cancellation
  cancellation_reason TEXT,
  cancelled_by VARCHAR(50),  -- 'USER', 'ADMIN'
  
  -- Payment
  payment_method VARCHAR(50),  -- ORANGE_MONEY, MOOV_MONEY, CARD
  
  INDEX idx_user_id (user_id),
  INDEX idx_trip_id (trip_id),
  INDEX idx_status (status),
  INDEX idx_hold_until (hold_until),
  INDEX idx_created_at (created_at)
);

-- =====================
-- 9. PAIEMENTS
-- =====================

CREATE TABLE payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(booking_id),
  
  amount INT NOT NULL,  -- In XOF
  currency VARCHAR(3) DEFAULT 'XOF',
  
  method VARCHAR(50) NOT NULL,  -- ORANGE_MONEY, MOOV_MONEY, CARD
  provider_reference VARCHAR(255),  -- Transaction ID from provider
  
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, COMPLETED, FAILED, REFUNDED
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  
  -- Metadata
  metadata JSON DEFAULT '{}',  -- Provider-specific data
  
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status),
  INDEX idx_provider_reference (provider_reference)
);

-- =====================
-- 10. BILLETS
-- =====================

CREATE TABLE tickets (
  ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(booking_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  trip_id UUID NOT NULL REFERENCES trips(trip_id),
  
  passenger_name VARCHAR(255) NOT NULL,
  seat VARCHAR(10) NOT NULL,  -- A1, A2, etc
  
  -- QR Code & Barcode
  qr_code TEXT NOT NULL,       -- Base64 or URL
  barcode VARCHAR(50) NOT NULL, -- Alphanumeric
  
  -- Status
  status VARCHAR(50) DEFAULT 'AVAILABLE',  -- AVAILABLE, TRANSFERRED, EMBARKED, CANCELLED
  
  -- Transfer
  transfer_token VARCHAR(255),  -- Single-use token
  transfer_expires_at TIMESTAMP,
  transferred_to_phone VARCHAR(20),
  transferred_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_trip_id (trip_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status)
);

-- =====================
-- 11. TRANSFERTS DE BILLETS
-- =====================

CREATE TABLE ticket_transfers (
  transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(ticket_id),
  
  from_user_id UUID NOT NULL REFERENCES users(user_id),
  to_phone VARCHAR(20) NOT NULL,
  
  token VARCHAR(255) NOT NULL UNIQUE,  -- Single-use transfer link
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, USED, EXPIRED, REJECTED
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP,
  
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_token (token),
  INDEX idx_status (status)
);

-- =====================
-- 12. CONTENUS & STORIES
-- =====================

CREATE TABLE stories (
  story_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  emoji VARCHAR(10),
  gradient VARCHAR(100),  -- Couleur gradient CSS
  
  category VARCHAR(50) NOT NULL,  -- PROMO, NEW, DESTINATION, TIPS, PARTNERS, ANNOUNCEMENT
  priority INT DEFAULT 0,
  
  link_url TEXT,  -- Pour CTA
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  INDEX idx_is_active (is_active),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);

-- =====================
-- 13. ANNONCES PUBLICITAIRES
-- =====================

CREATE TABLE advertisements (
  ad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  
  placement VARCHAR(100) NOT NULL,  -- SEARCH_RESULTS, TICKET_LIST, HOME_FEED, OPERATOR_PROFILE
  target_audience_segment JSON,     -- { "min_age": 18, "locations": [...] }
  
  cta_text VARCHAR(100),
  cta_link TEXT,
  
  budget_xof INT,
  spent_xof INT DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  
  status VARCHAR(50) DEFAULT 'DRAFT',  -- DRAFT, ACTIVE, PAUSED, COMPLETED
  
  created_by UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  
  INDEX idx_status (status),
  INDEX idx_placement (placement)
);

-- =====================
-- 14. NOTIFICATIONS
-- =====================

CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  
  type VARCHAR(100) NOT NULL,  -- BOOKING_CONFIRMED, PAYMENT_SUCCESS, TRIP_CANCELLED, SUPPORT_REPLY, etc
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  related_booking_id UUID REFERENCES bookings(booking_id),
  related_trip_id UUID REFERENCES trips(trip_id),
  
  is_read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);

-- =====================
-- 15. SUPPORT TICKETS
-- =====================

CREATE TABLE support_tickets (
  ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  related_booking_id UUID REFERENCES bookings(booking_id),
  
  status VARCHAR(50) DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, ESCALATED
  priority VARCHAR(50) DEFAULT 'NORMAL',  -- LOW, NORMAL, HIGH, URGENT
  
  assigned_to UUID REFERENCES users(user_id),  -- Admin qui handle ticket
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_assigned_to (assigned_to)
);

-- =====================
-- 16. MESSAGES DE SUPPORT
-- =====================

CREATE TABLE support_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(ticket_id),
  
  sender_id UUID NOT NULL REFERENCES users(user_id),  -- Peut être user ou admin
  sender_type VARCHAR(50) NOT NULL,  -- 'USER', 'ADMIN'
  
  message_text TEXT NOT NULL,
  attachments JSON DEFAULT '[]',  -- URLs de fichiers jointes
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_ticket_id (ticket_id),
  INDEX idx_sender_id (sender_id)
);

-- =====================
-- 17. AUDIT LOGS
-- =====================

CREATE TABLE audit_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(user_id),
  
  action_type VARCHAR(100) NOT NULL,  -- CREATE_TRIP, UPDATE_OPERATOR, CANCEL_BOOKING, etc
  resource_type VARCHAR(100) NOT NULL,  -- Trip, Operator, Booking, Payment, etc
  resource_id UUID NOT NULL,
  
  changes JSON,  -- { "before": {...}, "after": {...} }
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_admin_user_id (admin_user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
);

-- =====================
-- 18. REFUNDS
-- =====================

CREATE TABLE refunds (
  refund_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(payment_id),
  booking_id UUID NOT NULL REFERENCES bookings(booking_id),
  
  amount INT NOT NULL,  -- In XOF
  reason VARCHAR(255) NOT NULL,
  
  initiated_by VARCHAR(50) NOT NULL,  -- 'USER', 'ADMIN', 'SYSTEM'
  initiated_by_user_id UUID REFERENCES users(user_id),
  
  status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, PROCESSING, COMPLETED, FAILED
  provider_reference VARCHAR(255),      -- Refund ID from payment provider
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  
  INDEX idx_payment_id (payment_id),
  INDEX idx_status (status)
);
```

---

## BACKEND - LISTE COMPLÈTE DES ENDPOINTS

### Architecture Backend

```
Backend/
├── src/
│   ├── middleware/
│   │   ├── auth.ts           # JWT validation
│   │   ├── permissions.ts    # Permission check
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── logging.ts        # Request logging
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── validation.ts     # Request validation
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── auth.routes.ts
│   │   │   ├── trips.routes.ts
│   │   │   ├── operators.routes.ts
│   │   │   ├── stations.routes.ts
│   │   │   ├── bookings.routes.ts
│   │   │   ├── payments.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── content.routes.ts
│   │   │   ├── support.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   └── index.ts
│   │   ├── mobile/
│   │   │   ├── trips.routes.ts
│   │   │   ├── bookings.routes.ts
│   │   │   ├── stations.routes.ts
│   │   │   ├── tickets.routes.ts
│   │   │   ├── operators.routes.ts
│   │   │   └── index.ts
│   │   └── public/
│   │       ├── auth.routes.ts
│   │       └── index.ts
│   ├── controllers/
│   │   ├── admin/
│   │   │   ├── authController.ts
│   │   │   ├── tripsController.ts
│   │   │   ├── operatorsController.ts
│   │   │   ├── bookingsController.ts
│   │   │   ├── paymentsController.ts
│   │   │   ├── usersController.ts
│   │   │   ├── analyticsController.ts
│   │   │   └── index.ts
│   │   └── mobile/
│   │       ├── tripsController.ts
│   │       ├── bookingsController.ts
│   │       └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── trips.service.ts
│   │   ├── bookings.service.ts
│   │   ├── payments.service.ts
│   │   ├── operators.service.ts
│   │   ├── analytics.service.ts
│   │   ├── notifications.service.ts
│   │   ├── refund.service.ts
│   │   ├── export.service.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Trip.ts
│   │   ├── Booking.ts
│   │   ├── Payment.ts
│   │   ├── Operator.ts
│   │   ├── Station.ts
│   │   ├── Ticket.ts
│   │   ├── Refund.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── errors.ts
│   │   ├── jwt.ts
│   │   ├── encryption.ts
│   │   └── mailer.ts
│   ├── jobs/
│   │   ├── holdExpiryJob.ts         # Expire HOLD after 10 minutes
│   │   ├── notificationJob.ts       # Send notifications
│   │   ├── reconciliationJob.ts     # Daily payment reconciliation
│   │   └── index.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── env.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.ts
│   └── server.ts
├── tests/
├── .env.example
├── package.json
└── README.md
```

### Endpoints ADMIN - Authentification

```typescript
// POST /api/admin/auth/login
Request: { email: string, password: string }
Response: { 
  user: AdminUser,
  token: string,
  mfa_required?: boolean
}

// POST /api/admin/auth/mfa-verify
Request: { code: string }
Response: { token: string, user: AdminUser }

// POST /api/admin/auth/logout
Response: { success: true }

// POST /api/admin/auth/refresh-token
Request: {}
Response: { token: string }

// POST /api/admin/auth/change-password
Request: { current_password: string, new_password: string }
Response: { success: true }
```

### Endpoints ADMIN - Trajets

```typescript
// GET /api/admin/trips
Query: { 
  operator_id?: string,
  from_stop_id?: string,
  to_stop_id?: string,
  status?: 'ACTIVE' | 'CANCELLED' | 'COMPLETED',
  date_from?: string (ISO),
  date_to?: string (ISO),
  page?: number,
  limit?: number
}
Response: {
  data: Trip[],
  total: number,
  page: number,
  pages: number
}

// GET /api/admin/trips/:tripId
Response: Trip (with segments details)

// POST /api/admin/trips
Request: {
  operator_id: string,
  from_stop_id: string,
  to_stop_id: string,
  departure_time: string,
  arrival_time: string,
  vehicle_id: string,
  price_per_seat: number,
  amenities: string[],
  segments: {
    from_stop_id: string,
    to_stop_id: string,
    distance_km: number,
    duration_minutes: number,
    available_seats: number
  }[]
}
Response: Trip (created)

// PATCH /api/admin/trips/:tripId
Request: {
  price_per_seat?: number,
  status?: 'ACTIVE' | 'CANCELLED',
  departure_time?: string,
  arrival_time?: string
}
Response: Trip (updated)

// DELETE /api/admin/trips/:tripId
Response: { success: true, trip_id: string }

// PATCH /api/admin/trips/:tripId/capacity
Request: {
  segment_id?: string,  // If updating specific segment
  available_seats: number,
  reason?: string  // 'Route diverted', 'Maintenance', etc
}
Response: { success: true, trip: Trip }

// GET /api/admin/trips/:tripId/segments
Response: Segment[]

// PUT /api/admin/trips/:tripId/segments/:segmentId
Request: {
  available_seats: number,
  distance_km?: number,
  duration_minutes?: number
}
Response: Segment
```

### Endpoints ADMIN - Opérateurs

```typescript
// GET /api/admin/operators
Query: {
  status?: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED',
  search?: string,  // Search by name
  page?: number,
  limit?: number
}
Response: { data: Operator[], total: number }

// GET /api/admin/operators/:operatorId
Response: Operator (with stats)

// POST /api/admin/operators
Request: {
  name: string,
  description?: string,
  phone: string,
  email: string,
  website?: string,
  document_type: 'BUSINESS_LICENSE' | 'PERMIT',
  document_file: File  // Multipart upload
}
Response: Operator (PENDING status)

// PATCH /api/admin/operators/:operatorId
Request: {
  name?: string,
  description?: string,
  website?: string,
  status?: 'APPROVED' | 'SUSPENDED' | 'REJECTED',
  rejection_reason?: string  // if status = REJECTED
}
Response: Operator (updated)

// POST /api/admin/operators/:operatorId/approve
Request: {}
Response: { success: true, operator: Operator }

// POST /api/admin/operators/:operatorId/suspend
Request: { reason: string }
Response: { success: true, operator: Operator }

// DELETE /api/admin/operators/:operatorId
Response: { success: true }

// GET /api/admin/operators/:operatorId/vehicles
Response: Vehicle[]

// POST /api/admin/operators/:operatorId/vehicles
Request: {
  registration: string,
  type: 'MINIBUS' | 'BUS' | 'VAN',
  capacity: number,
  amenities: string[]
}
Response: Vehicle

// GET /api/admin/operators/:operatorId/stats
Response: {
  total_trips: number,
  active_trips: number,
  total_bookings: number,
  revenue: number,
  cancellation_rate: number,
  avg_occupancy: number
}
```

### Endpoints ADMIN - Gares

```typescript
// GET /api/admin/stations
Query: { 
  city?: string,
  search?: string,
  page?: number,
  limit?: number
}
Response: { data: Station[], total: number }

// GET /api/admin/stations/:stationId
Response: Station

// POST /api/admin/stations
Request: {
  name: string,
  city: string,
  address: string,
  latitude: number,
  longitude: number,
  phone?: string,
  email?: string,
  opening_hours?: string,
  services: string[],
  photos: File[]  // Multipart upload
}
Response: Station

// PATCH /api/admin/stations/:stationId
Request: {
  name?: string,
  address?: string,
  latitude?: number,
  longitude?: number,
  opening_hours?: string,
  services?: string[],
  status?: 'ACTIVE' | 'INACTIVE'
}
Response: Station

// DELETE /api/admin/stations/:stationId
Response: { success: true }

// POST /api/admin/stations/:stationId/photos
Request: { photos: File[] }  // Multipart
Response: { urls: string[] }
```

### Endpoints ADMIN - Réservations

```typescript
// GET /api/admin/bookings
Query: {
  status?: 'HOLD' | 'PAID' | 'EMBARKED' | 'CANCELLED',
  trip_id?: string,
  user_id?: string,
  operator_id?: string,  // For OPERATOR_ADMIN
  date_from?: string,
  date_to?: string,
  page?: number,
  limit?: number
}
Response: { data: Booking[], total: number }

// GET /api/admin/bookings/:bookingId
Response: Booking (with user, trip, tickets details)

// POST /api/admin/bookings/:bookingId/cancel
Request: {
  reason: string,
  refund_immediately?: boolean
}
Response: { success: true, booking: Booking, refund?: Refund }

// GET /api/admin/bookings/holds/expired
Response: Booking[]  // Expired HOLD bookings

// POST /api/admin/bookings/holds/cleanup-expired
Response: { count: number }  // Releases expired HOLDs

// GET /api/admin/bookings/:bookingId/tickets
Response: Ticket[]

// GET /api/admin/bookings/:bookingId/payment
Response: Payment
```

### Endpoints ADMIN - Paiements

```typescript
// GET /api/admin/payments
Query: {
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
  method?: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARD',
  date_from?: string,
  date_to?: string,
  page?: number,
  limit?: number
}
Response: { data: Payment[], total: number }

// GET /api/admin/payments/:paymentId
Response: Payment

// POST /api/admin/payments/:paymentId/refund
Request: {
  amount?: number,  // Partial refund if not specified = full
  reason: string
}
Response: { success: true, refund: Refund }

// GET /api/admin/refunds
Query: {
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  date_from?: string,
  date_to?: string,
  page?: number,
  limit?: number
}
Response: { data: Refund[], total: number }

// GET /api/admin/payments/reconciliation
Query: {
  date: string  // ISO date
}
Response: {
  period: { start_date, end_date },
  local_transactions: Payment[],
  provider_transactions: ExternalTransaction[],
  discrepancies: {
    type: 'MISSING_IN_PROVIDER' | 'AMOUNT_MISMATCH' | 'EXTRA_IN_PROVIDER',
    transaction: Payment
  }[],
  balanced: boolean
}

// POST /api/admin/payments/reconciliation/validate
Request: { date: string }
Response: { valid: boolean, errors?: string[] }
```

### Endpoints ADMIN - Utilisateurs Admins

```typescript
// GET /api/admin/users (SUPER_ADMIN only)
Query: {
  role?: string,
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING',
  page?: number,
  limit?: number
}
Response: { data: AdminUser[], total: number }

// GET /api/admin/users/:userId
Response: AdminUser

// POST /api/admin/users (SUPER_ADMIN only)
Request: {
  email: string,
  password: string,
  name: string,
  role: 'SUPER_ADMIN' | 'OPERATOR_ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN' | 'CONTENT_ADMIN',
  operator_id?: string,  // For OPERATOR_ADMIN
  send_invite?: boolean
}
Response: AdminUser

// PATCH /api/admin/users/:userId
Request: {
  name?: string,
  email?: string,
  role?: string,
  status?: 'ACTIVE' | 'SUSPENDED'
}
Response: AdminUser

// POST /api/admin/users/:userId/suspend
Request: { reason?: string }
Response: AdminUser

// POST /api/admin/users/:userId/unsuspend
Response: AdminUser

// DELETE /api/admin/users/:userId (SUPER_ADMIN only)
Response: { success: true }

// GET /api/admin/roles (SUPER_ADMIN only)
Response: Role[]

// POST /api/admin/roles/{roleId}/permissions (SUPER_ADMIN only)
Request: {
  resource: string,
  action: string,
  scope: string
}
Response: { success: true }
```

### Endpoints ADMIN - Contenu

```typescript
// GET /api/admin/stories
Query: { is_active?: boolean }
Response: Story[]

// POST /api/admin/stories
Request: {
  title: string,
  description: string,
  image_file?: File,
  emoji?: string,
  category: 'PROMO' | 'NEW' | 'DESTINATION' | 'TIPS' | 'PARTNERS' | 'ANNOUNCEMENT',
  priority: number,
  link_url?: string,
  expires_at?: string
}
Response: Story

// PATCH /api/admin/stories/:storyId
Request: {
  title?: string,
  is_active?: boolean,
  priority?: number,
  expires_at?: string
}
Response: Story

// DELETE /api/admin/stories/:storyId
Response: { success: true }

// GET /api/admin/ads
Response: Advertisement[]

// POST /api/admin/ads
Request: {
  title: string,
  description: string,
  image_file: File,
  placement: 'SEARCH_RESULTS' | 'TICKET_LIST' | 'HOME_FEED' | 'OPERATOR_PROFILE',
  cta_text?: string,
  cta_link?: string,
  budget_xof: number,
  starts_at: string,
  ends_at: string
}
Response: Advertisement

// PATCH /api/admin/ads/:adId
Request: { status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' }
Response: Advertisement

// POST /api/admin/notifications
Request: {
  recipient_user_ids?: string[],  // Si vide = tous users
  recipient_role?: 'USER' | 'OPERATOR',
  title: string,
  message: string,
  type: string
}
Response: { sent_count: number }
```

### Endpoints ADMIN - Support

```typescript
// GET /api/admin/support/tickets
Query: {
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
  assigned_to?: string,  // Admin user ID
  page?: number,
  limit?: number
}
Response: { data: SupportTicket[], total: number }

// GET /api/admin/support/tickets/:ticketId
Response: SupportTicket (with messages)

// PATCH /api/admin/support/tickets/:ticketId
Request: {
  status?: string,
  priority?: string,
  assigned_to?: string
}
Response: SupportTicket

// POST /api/admin/support/tickets/:ticketId/messages
Request: { message: string, attachments?: File[] }
Response: SupportMessage

// POST /api/admin/support/tickets/:ticketId/close
Request: { resolution_note?: string }
Response: SupportTicket

// POST /api/admin/support/tickets/:ticketId/escalate
Request: { reason: string }
Response: SupportTicket
```

### Endpoints ADMIN - Analytics

```typescript
// GET /api/admin/analytics/dashboard
Query: {
  date_from: string,
  date_to: string,
  period: 'day' | 'week' | 'month'
}
Response: {
  metrics: {
    total_bookings: number,
    total_revenue: number,
    cancelled_bookings: number,
    avg_occupancy: number,
    cancellation_rate: number,
    pending_payments: number
  },
  trend_data: TrendPoint[],
  breakdown: {
    by_operator: OperatorMetric[],
    by_route: RouteMetric[],
    by_payment_method: PaymentMethodMetric[]
  }
}

// GET /api/admin/analytics/trips
Query: {
  date_from: string,
  date_to: string,
  operator_id?: string,
  groupBy?: 'day' | 'route' | 'operator'
}
Response: {
  total_trips: number,
  active_trips: number,
  cancelled_trips: number,
  completed_trips: number,
  data: TripAnalytic[]
}

// GET /api/admin/analytics/bookings
Query: {
  date_from: string,
  date_to: string,
  operator_id?: string
}
Response: {
  total_bookings: number,
  by_status: { HOLD: number, PAID: number, EMBARKED: number, CANCELLED: number },
  by_payment_method: { ORANGE_MONEY: number, MOOV_MONEY: number, CARD: number },
  revenue: number
}

// GET /api/admin/analytics/routes
Response: {
  top_routes: {
    from: string,
    to: string,
    bookings: number,
    revenue: number,
    cancellation_rate: number,
    avg_occupancy: number
  }[]
}

// GET /api/admin/export
Query: {
  resource: 'trips' | 'bookings' | 'payments' | 'operators',
  format: 'csv' | 'xlsx' | 'pdf',
  filters?: {}
}
Response: File download (binary)
```

### Endpoints ADMIN - Audit

```typescript
// GET /api/admin/audit-logs
Query: {
  admin_user_id?: string,
  action_type?: string,
  resource_type?: string,
  date_from?: string,
  date_to?: string,
  page?: number,
  limit?: number
}
Response: { data: AuditLog[], total: number }
```

---

## BACKEND - MIDDLEWARE ET SERVICES

### 1. Middleware d'Authentification

```typescript
// src/middleware/auth.ts

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AdminRequest extends Request {
  adminUser?: AdminUser;
  token?: string;
}

export function authMiddleware(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.adminUser = decoded;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.adminUser = decoded as any;
    } catch (error) {
      // Silently ignore auth errors for optional auth
    }
  }

  next();
}
```

### 2. Middleware des Permissions

```typescript
// src/middleware/permissions.ts

interface PermissionCheck {
  resource: string;
  action: string;
  scope?: 'ALL' | 'OWN_OPERATOR';
}

export function requirePermission(required: PermissionCheck) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // SUPER_ADMIN a tout accès
    if (req.adminUser.role === 'SUPER_ADMIN') {
      return next();
    }

    // Vérifie les permissions
    const hasPermission = req.adminUser.permissions?.some(p => 
      p.resource === required.resource &&
      p.action === required.action &&
      (!required.scope || p.scope === required.scope || p.scope === 'ALL')
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser || !roles.includes(req.adminUser.role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    next();
  };
}
```

### 3. Middleware de Validation

```typescript
// src/middleware/validation.ts

import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors
      });
    }
  };
}
```

### 4. Services Backend

```typescript
// src/services/trips.service.ts

export class TripsService {
  
  // Créer un trajet
  static async createTrip(data: CreateTripDTO, adminUserId: string): Promise<Trip> {
    const operator = await Operator.findByPk(data.operator_id);
    if (!operator) throw new Error('Operator not found');

    const vehicle = await Vehicle.findByPk(data.vehicle_id);
    if (!vehicle) throw new Error('Vehicle not found');

    // Validation: MIN(segments) = available_seats
    const minCapacity = Math.min(...data.segments.map(s => s.available_seats));
    if (minCapacity !== data.segments[0].available_seats) {
      throw new Error('Invalid capacity: must equal minimum of segments');
    }

    // Crée le trajet
    const trip = await Trip.create({
      operator_id: data.operator_id,
      vehicle_id: data.vehicle_id,
      from_stop_id: data.from_stop_id,
      to_stop_id: data.to_stop_id,
      departure_time: data.departure_time,
      arrival_time: data.arrival_time,
      vehicle_capacity: vehicle.capacity,
      available_seats: minCapacity,
      price_per_seat: data.price_per_seat,
      amenities: data.amenities,
      vehicle_type: vehicle.type,
      status: 'ACTIVE'
    });

    // Crée les segments
    for (const segment of data.segments) {
      await trip.createSegment({
        trip_id: trip.trip_id,
        from_stop_id: segment.from_stop_id,
        to_stop_id: segment.to_stop_id,
        stop_order: segment.stop_order,
        distance_km: segment.distance_km,
        duration_minutes: segment.duration_minutes,
        available_seats: segment.available_seats
      });
    }

    // Audit log
    await AuditLog.create({
      admin_user_id: adminUserId,
      action_type: 'CREATE_TRIP',
      resource_type: 'Trip',
      resource_id: trip.trip_id,
      changes: { before: null, after: trip.toJSON() }
    });

    return trip;
  }

  // Mettre à jour capacité d'un segment
  static async updateSegmentCapacity(
    tripId: string,
    updates: { segment_id?: string, available_seats: number, reason?: string }[],
    adminUserId: string
  ): Promise<void> {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');

    const before = { ...trip.toJSON() };

    for (const update of updates) {
      if (update.segment_id) {
        // Update specific segment
        const segment = await Segment.findByPk(update.segment_id);
        if (segment) {
          segment.available_seats = update.available_seats;
          await segment.save();
        }
      }
    }

    // Recalculate trip available_seats
    const segments = await trip.getSegments();
    const newMinCapacity = Math.min(...segments.map(s => s.available_seats));
    trip.available_seats = newMinCapacity;
    await trip.save();

    // Audit log
    await AuditLog.create({
      admin_user_id: adminUserId,
      action_type: 'UPDATE_TRIP_CAPACITY',
      resource_type: 'Trip',
      resource_id: tripId,
      changes: {
        before,
        after: trip.toJSON(),
        reason: updates[0]?.reason
      }
    });

    // Notify users if capacity changed significantly
    if (before.available_seats > newMinCapacity) {
      await this.notifyCapacityChange(tripId, newMinCapacity);
    }
  }

  // Annuler un trajet
  static async cancelTrip(tripId: string, reason: string, adminUserId: string): Promise<void> {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');

    // Annule toutes les réservations non embarquées
    const bookings = await Booking.findAll({
      where: {
        trip_id: tripId,
        status: { [Op.in]: ['HOLD', 'PAID'] }
      }
    });

    for (const booking of bookings) {
      await this.cancelBooking(booking.booking_id, reason, 'ADMIN', adminUserId);
    }

    // Update trip status
    trip.status = 'CANCELLED';
    await trip.save();

    // Notify users
    await this.notifyUsers(bookings.map(b => b.user_id), {
      type: 'TRIP_CANCELLED',
      trip_id: tripId,
      reason
    });

    // Audit
    await AuditLog.create({
      admin_user_id: adminUserId,
      action_type: 'CANCEL_TRIP',
      resource_type: 'Trip',
      resource_id: tripId,
      changes: { reason }
    });
  }

  private static async notifyCapacityChange(tripId: string, newCapacity: number) {
    // WebSocket / Push notification
  }

  private static async notifyUsers(userIds: string[], notification: any) {
    // Send notifications
  }
}
```

```typescript
// src/services/bookings.service.ts

export class BookingsService {

  // Créer HOLD (réservation temporaire)
  static async createHold(
    userId: string,
    tripId: string,
    seats: string[],
    passengers: PassengerInfo[]
  ): Promise<Booking> {
    const trip = await Trip.findByPk(tripId);
    if (!trip) throw new Error('Trip not found');

    // Valide disponibilité
    if (trip.available_seats < seats.length) {
      throw new Error('Not enough available seats');
    }

    // Réserve les places (bloque dans DB pour 10 min)
    const totalPrice = trip.price_per_seat * seats.length;

    const booking = await Booking.create({
      user_id: userId,
      trip_id: tripId,
      seats: JSON.stringify(seats),
      total_price: totalPrice,
      status: 'HOLD',
      hold_until: new Date(Date.now() + 10 * 60 * 1000),  // 10 minutes from now
      passengers_info: JSON.stringify(passengers)
    });

    // Update trip available seats
    trip.available_seats -= seats.length;
    await trip.save();

    // Schedule cleanup job for expired HOLD
    await holdExpiryJob.schedule(booking.booking_id, 10 * 60 * 1000);

    return booking;
  }

  // Confirmer réservation (paiement)
  static async confirmBooking(
    bookingId: string,
    paymentMethod: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'CARD'
  ): Promise<Booking> {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) throw new Error('Booking not found');

    if (booking.status !== 'HOLD') {
      throw new Error('Can only confirm HOLD bookings');
    }

    // Initialise paiement
    const payment = await Payment.create({
      booking_id: bookingId,
      amount: booking.total_price,
      method: paymentMethod,
      status: 'PENDING'
    });

    // Appelle provider paiement
    const providerResponse = await this.processPayment(payment, paymentMethod);

    booking.payment_method = paymentMethod;
    booking.status = 'PAID';
    booking.paid_at = new Date();
    await booking.save();

    payment.provider_reference = providerResponse.transaction_id;
    payment.status = 'COMPLETED';
    await payment.save();

    // Crée les tickets
    const seats = JSON.parse(booking.seats);
    for (let i = 0; i < seats.length; i++) {
      const ticket = await Ticket.create({
        booking_id: bookingId,
        user_id: booking.user_id,
        trip_id: booking.trip_id,
        seat: seats[i],
        passenger_name: booking.passengers_info[i]?.name || 'Unknown',
        qr_code: this.generateQRCode(bookingId),
        barcode: this.generateBarcode(),
        status: 'AVAILABLE'
      });
    }

    // Notify user
    await NotificationService.sendNotification(booking.user_id, {
      type: 'BOOKING_CONFIRMED',
      booking_id: bookingId,
      trip_id: booking.trip_id
    });

    return booking;
  }

  // Annuler réservation (admin ou user)
  static async cancelBooking(
    bookingId: string,
    reason: string,
    cancelledBy: 'ADMIN' | 'USER',
    adminUserId?: string
  ): Promise<Booking> {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) throw new Error('Booking not found');

    const before = booking.toJSON();

    // Si PAID: crée remboursement
    if (booking.status === 'PAID') {
      const payment = await Payment.findOne({ where: { booking_id: bookingId } });
      if (payment) {
        const refund = await RefundService.createRefund({
          payment_id: payment.payment_id,
          booking_id: bookingId,
          amount: booking.total_price,
          reason,
          initiated_by: cancelledBy,
          initiated_by_user_id: cancelledBy === 'USER' ? booking.user_id : adminUserId
        });
        // Appelle provider pour remboursement
        await this.processRefund(refund);
      }
    }

    // Si HOLD: libère les places immédiatement
    if (['HOLD', 'PAID'].includes(booking.status)) {
      const trip = await Trip.findByPk(booking.trip_id);
      if (trip) {
        const seats = JSON.parse(booking.seats);
        trip.available_seats += seats.length;
        await trip.save();
      }
    }

    // Update booking
    booking.status = 'CANCELLED';
    booking.cancelled_at = new Date();
    booking.cancellation_reason = reason;
    booking.cancelled_by = cancelledBy;
    await booking.save();

    // Update tickets
    const tickets = await booking.getTickets();
    for (const ticket of tickets) {
      ticket.status = 'CANCELLED';
      await ticket.save();
    }

    // Notify user
    await NotificationService.sendNotification(booking.user_id, {
      type: 'BOOKING_CANCELLED',
      booking_id: bookingId,
      reason,
      refund_amount: booking.total_price
    });

    // Audit
    if (cancelledBy === 'ADMIN') {
      await AuditLog.create({
        admin_user_id: adminUserId!,
        action_type: 'CANCEL_BOOKING',
        resource_type: 'Booking',
        resource_id: bookingId,
        changes: { before, after: booking.toJSON(), reason }
      });
    }

    return booking;
  }

  private static async processPayment(payment: Payment, method: string) {
    // Call Orange Money / Moov Money / Stripe API
    // Return provider response
  }

  private static async processRefund(refund: Refund) {
    // Call payment provider to process refund
  }
}
```

```typescript
// src/services/payments.service.ts

export class PaymentsService {

  // Réconciliation quotidienne des paiements
  static async reconcileDailyPayments(date: string): Promise<ReconciliationReport> {
    const period = {
      start: startOfDay(new Date(date)),
      end: endOfDay(new Date(date))
    };

    // Récupère transactions locales
    const localTransactions = await Payment.findAll({
      where: {
        created_at: { [Op.between]: [period.start, period.end] }
      }
    });

    // Récupère transactions de providers
    const orangeMoneytx = await OrangeMoneyAPI.getTransactions(period);
    const moovMoneytx = await MoovMoneyAPI.getTransactions(period);

    // Compare
    const discrepancies: any[] = [];

    for (const local of localTransactions) {
      const provider = local.method === 'ORANGE_MONEY' ? orangeMoneytx : moovMoneytx;
      const providerTx = provider.find(p => p.reference === local.provider_reference);

      if (!providerTx) {
        discrepancies.push({
          type: 'MISSING_IN_PROVIDER',
          local_payment: local,
          message: `Payment ${local.payment_id} not found in ${local.method}`
        });
      } else if (providerTx.amount !== local.amount) {
        discrepancies.push({
          type: 'AMOUNT_MISMATCH',
          local_payment: local,
          provider_payment: providerTx,
          message: `Amount mismatch: local ${local.amount}, provider ${providerTx.amount}`
        });
      }
    }

    return {
      period,
      local_count: localTransactions.length,
      provider_count: orangeMoneytx.length + moovMoneytx.length,
      discrepancies,
      balanced: discrepancies.length === 0,
      reconciled_at: new Date()
    };
  }

  // Créer remboursement
  static async createRefund(data: {
    payment_id: string,
    booking_id: string,
    amount: number,
    reason: string,
    initiated_by: 'USER' | 'ADMIN' | 'SYSTEM',
    initiated_by_user_id?: string
  }): Promise<Refund> {
    const payment = await Payment.findByPk(data.payment_id);
    if (!payment) throw new Error('Payment not found');

    const refund = await Refund.create({
      payment_id: data.payment_id,
      booking_id: data.booking_id,
      amount: data.amount,
      reason: data.reason,
      initiated_by: data.initiated_by,
      initiated_by_user_id: data.initiated_by_user_id,
      status: 'PENDING'
    });

    // Queue job pour traitement
    await refundProcessingQueue.add({
      refund_id: refund.refund_id,
      payment_method: payment.method,
      provider_reference: payment.provider_reference,
      amount: data.amount
    });

    return refund;
  }
}
```

---

## FRONTEND - STRUCTURE COMPLÈTE

*[Continue à part due à la longueur...]*

### Architecture Frontend Admin

```
admin/
├── src/
│   ├── App.tsx                    # Main app avec routing
│   ├── main.tsx
│   ├── components/
│   │   ├── ui/                    # Wrappers Radix UI (identique Mobile)
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── BreadcrumbNav.tsx
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── PermissionGuard.tsx  # Render si permission OK
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── AlertBanner.tsx
│   │   ├── forms/
│   │   │   ├── TripForm/ (Créer/éditer trajet)
│   │   │   ├── OperatorForm/
│   │   │   ├── StationForm/
│   │   │   ├── UserForm/
│   │   │   └── SegmentEditor/
│   │   ├── tables/
│   │   │   ├── DataTable.tsx        # Table générique TanStack
│   │   │   ├── TripTable.tsx
│   │   │   ├── OperatorTable.tsx
│   │   │   ├── BookingTable.tsx
│   │   │   ├── PaymentTable.tsx
│   │   │   └── UserTable.tsx
│   │   ├── charts/
│   │   │   ├── SalesChart.tsx
│   │   │   ├── RouteAnalytics.tsx
│   │   │   ├── CancellationRateChart.tsx
│   │   │   ├── OccupancyChart.tsx
│   │   │   └── GenericChart.tsx     # Wrapper Recharts
│   │   └── widgets/
│   │       ├── StatCard.tsx
│   │       ├── MetricCard.tsx
│   │       ├── AlertCard.tsx
│   │       └── ActivityFeed.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── MFAPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx    # Accueil admin
│   │   │   └── HealthCheckPage.tsx  # System status
│   │   ├── trips/
│   │   │   ├── TripsListPage.tsx
│   │   │   ├── TripsCreatePage.tsx
│   │   │   ├── TripsEditPage.tsx
│   │   │   └── TripDetailPage.tsx
│   │   ├── operators/
│   │   │   ├── OperatorsListPage.tsx
│   │   │   ├── OperatorsCreatePage.tsx
│   │   │   ├── OperatorsEditPage.tsx
│   │   │   └── OperatorDetailPage.tsx
│   │   ├── stations/
│   │   │   ├── StationsListPage.tsx
│   │   │   ├── StationsCreatePage.tsx
│   │   │   ├── StationsEditPage.tsx
│   │   │   └── StationDetailPage.tsx
│   │   ├── bookings/
│   │   │   ├── BookingsListPage.tsx
│   │   │   └── BookingDetailPage.tsx
│   │   ├── payments/
│   │   │   ├── PaymentsListPage.tsx
│   │   │   ├── ReconciliationPage.tsx
│   │   │   └── RefundPage.tsx
│   │   ├── users/
│   │   │   ├── UsersListPage.tsx
│   │   │   ├── UsersCreatePage.tsx
│   │   │   └── PermissionsPage.tsx
│   │   ├── content/
│   │   │   ├── StoriesPage.tsx
│   │   │   ├── AdsPage.tsx
│   │   │   └── NotificationsPage.tsx
│   │   ├── support/
│   │   │   ├── SupportTicketsPage.tsx
│   │   │   └── SupportDetailPage.tsx
│   │   ├── analytics/
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── ExportPage.tsx
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       └── SecurityPage.tsx
│   ├── lib/
│   │   ├── api.ts                   # Appels API admin
│   │   ├── hooks.ts                 # Hooks réutilisables
│   │   ├── auth.ts                  # Gestion authentification
│   │   ├── permissions.ts           # Vérification permissions
│   │   ├── i18n.ts                  # i18n (partagé avec Mobile)
│   │   ├── validators.ts            # Validation formules
│   │   ├── formatters.ts            # Formatage données
│   │   ├── constants.ts
│   │   └── config.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── trips.service.ts
│   │   │   ├── operators.service.ts
│   │   │   ├── bookings.service.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── export.service.ts
│   │   ├── auth.service.ts
│   │   └── storage.service.ts       # localStorage management
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── PermissionContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePermission.ts
│   │   ├── useTrips.ts
│   │   ├── useOperators.ts
│   │   ├── useBookings.ts
│   │   ├── usePayments.ts
│   │   ├── useAnalytics.ts
│   │   └── useExport.ts
│   ├── types/
│   │   ├── index.ts               # Réutilise models.ts Mobile
│   │   └── admin.ts               # Types spécifiques admin
│   ├── styles/
│   │   ├── index.css
│   │   └── admin.scss
│   └── App.tsx
├── vite.config.ts
├── tsconfig.json
├── package.json
├── tailwind.config.js
└── README.md
```

---

## COHÉRENCE FRONTEND/BACKEND/MOBILE

### Types Partagés - CRITICAL

```typescript
// ✅ FICHIER UNIQUE PARTAGÉ: shared/types/models.ts
// Copier ce fichier dans:
// - Mobile/src/data/models.ts
// - Admin/src/types/models.ts
// - Backend/src/types/models.ts

export interface Trip { ... }
export interface Booking { ... }
export interface Operator { ... }
export enum UserRole { ... }
// ... toutes les interfaces
```

### API Consistency

```typescript
// Backend: /api/trips (PUBLIC - accessible Mobile)
// Backend: /api/admin/trips (ADMIN - accessible Admin)

// Mobile appelle: GET /api/trips
// Admin appelle: GET /api/admin/trips (nécessite auth)

// Les données retournées DOIVENT être identiques
// Sauf champs sensitifs: (admin_only: true)
```

### Authentification Workflow

```
Frontend Login                    Backend Auth              Storage
    │                              │                          │
    ├─ POST /auth/login ──────────▶│                          │
    │ { email, password }          │ Verify credentials       │
    │                              │ Generate JWT token       │
    │                              │ If MFA: require code     │
    │◀──── token + user_info ──────│                          │
    │                              │                          │
    ├──────────────────────────────────────▶│                │
    │                          Store token in localStorage   │
    │                          Store user in localStorage    │
    │                                                        │
    │ Add to all requests:                                  │
    │ Authorization: Bearer {token}                         │
    │
```

### Patterns Identiques Entre Mobile et Admin

```typescript
// Pattern 1: Page props
interface PageProps {
  onNavigate: (page: PageName, data?: any) => void;
  onBack?: () => void;
  data?: any;
}

// Pattern 2: Hooks standard
export function useSomething() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch();
  }, []);

  return { data, isLoading, error };
}

// Pattern 3: Error handling
try {
  const result = await api.call();
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
  toast.error(error);
}

// Pattern 4: Loading states
{isLoading ? <Spinner /> : <Content />}

// Pattern 5: Empty states
{data.length === 0 ? <EmptyState /> : <DataDisplay />}
```

---

## POINTS D'INTÉGRATION CRITIQUES

### 1. Synchronisation Données

```typescript
// Si Admin crée un trajet:
// 1. Backend crée dans DB
// 2. Backend émet WebSocket event
// 3. Mobile reçoit event (si connectée)
// 4. Mobile rafraîchit liste trajets

// Frontend Admin:
// const handleCreateTrip = async (data) => {
//   const trip = await adminApi.createTrip(data);
//   // Backend emit via socket.io
// }

// Mobile app:
// useEffect(() => {
//   socket.on('TRIP_CREATED', (trip) => {
//     setTrips(prev => [...prev, trip]);
//   });
// }, []);
```

### 2. Permissions Cascadantes

```typescript
// Frontend check local:
if (!hasPermission('TRIPS', 'CREATE')) {
  return <AccessDenied />;
}

// Backend double-check:
@Post('/admin/trips')
@RequirePermission('TRIPS', 'CREATE')
createTrip(req, res) {
  // ...
}

// Mobile: NO admin endpoints
// Mobile Frontend ONLY calls /api/trips (public)
```

### 3. Audit Trail

```typescript
// Chaque action admin crée un audit log:
admin: create trip {trip_id: 123}
  → AuditLog: admin_user_id={admin_id}, action=CREATE_TRIP, resource_id=123

// Mobile: NO audit logs
// Mobile actions go to notifications, pas audit
```

### 4. Soft Deletes

```typescript
// Admin delete = soft delete
// Backend marks deleted_at = NOW()
// Query filters WHERE deleted_at IS NULL

// Mobile: Sees deleted as CANCELLED
// No different behavior needed
```

---

## SUMMARY POUR IA

### À Construire (Frontend Admin)

1. **Setup Vite + React + TypeScript** 
2. **Layout System** (Sidebar, TopBar, Breadcrumb)
3. **Auth Pages** (Login, MFA)
4. **16 Pages Principales** avec CRUD complet
5. **Composants Réutilisables** (DataTable, Charts, Forms)
6. **Hooks** pour chaque domaine
7. **i18n Support** (FR/EN/MO - partagé avec Mobile)

### À Construire (Backend Admin)

1. **Setup Express + PostgreSQL + TypeScript**
2. **30+ API Endpoints** (vérification auth + permissions)
3. **Services** pour chaque domaine
4. **Middleware** (auth, permissions, validation, error handling)
5. **Background Jobs** (HOLD expiry, reconciliation, notifications)
6. **Audit Logging**
7. **WebSocket** pour notifications temps réel (optionnel mais utile)

### Points Critiques

- ✅ **Shared Types**: models.ts doit être UNE SEULE source
- ✅ **Permissions**: Vérifiées FRONTEND et BACKEND
- ✅ **API Conventions**: Identiques Mobile et Admin
- ✅ **Error Handling**: Cohérent partout
- ✅ **i18n**: Même fichier i18n pour toutes les apps
- ✅ **Soft Deletes**: Intégrer dans queries
- ✅ **Audit Logs**: Toutes actions admin loggées

---

**FIN DE SPÉCIFICATION COMPLÈTE**

