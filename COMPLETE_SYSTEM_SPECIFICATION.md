# 🏗️ FASOTRAVEL - COMPLETE SYSTEM SPECIFICATION

**Version:** 2.0 - COMPREHENSIVE  
**Date:** January 30, 2026  
**Scope:** Entire FasoTravel System - Production Ready  
**Pages:** 50+  
**Details Level:** ULTRA DETAILED

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture & Deployment](#architecture--deployment)
3. [Database Schema](#database-schema)
4. [Shared Layer (Core)](#shared-layer-core)
5. [Mobile App (Passenger)](#mobile-app-passenger)
6. [Admin App (Societe)](#admin-app-societe)
7. [Backend API Specification](#backend-api-specification)
8. [Security & Authentication](#security--authentication)
9. [Error Handling](#error-handling)
10. [Validation Rules](#validation-rules)
11. [External Integrations](#external-integrations)
12. [Testing Strategy](#testing-strategy)
13. [Deployment & DevOps](#deployment--devops)
14. [Monitoring & Logging](#monitoring--logging)
15. [Performance Optimization](#performance-optimization)
16. [Coherence Checklist](#coherence-checklist)

---

# SYSTEM OVERVIEW

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FASOTRAVEL ECOSYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

LAYER 1: FRONTEND
├─ Mobile App (React Native / Vite)
│  └─ PassengerUser (Public app)
│
└─ Web Admin (React + TypeScript)
   └─ OperatorUser (Private app - 3 roles)

LAYER 2: SHARED CORE
├─ apiClient.ts (HTTP layer)
├─ Types (18 entities)
├─ Constants (keys, enums)
└─ Utils (formatters, validators)

LAYER 3: BACKEND API (TO BUILD)
├─ Express/Node.js or Django/Python
├─ Authentication (JWT + Refresh Tokens)
├─ Authorization (Role-Based Access Control)
├─ Business Logic (Trip booking, Pricing, etc)
└─ Database Integration

LAYER 4: DATABASE
├─ PostgreSQL (Primary)
│  ├─ Users, Routes, Stations, Trips
│  ├─ Tickets, Cashiers, Transactions
│  └─ Incidents, Stories, Reviews, Pricing
│
└─ Redis (Cache & Sessions)
   ├─ Active trips cache
   ├─ User sessions
   └─ Rate limiting counters

LAYER 5: EXTERNAL SERVICES
├─ Payment Gateway (Stripe, PayPal)
├─ SMS Service (Twilio, Africeltel)
├─ Email Service (SendGrid)
├─ Maps (Google Maps, Mapbox)
└─ File Storage (AWS S3, Azure Blob)
```

## Data Flow Diagram

```
PASSENGER BOOKING FLOW:
1. Passenger opens Mobile app → /api/trips?from=Dakar&to=Bamako
2. Backend queries DB → returns 10 trips
3. Passenger selects trip → /api/tickets (POST with booking data)
4. Backend validates → calculates price using pricing rules
5. Backend creates ticket → updates trip.currentPassengers
6. Backend sends confirmation email + SMS
7. Operator sees new ticket in Admin app (real-time WebSocket)

OPERATOR MANAGEMENT FLOW:
1. Operator logs in to Admin (Societe)
2. Responsable views all routes → /api/routes
3. Responsable creates new schedule → /api/schedules (POST)
4. Manager views today's trips → /api/trips?gareId=123&date=today
5. Manager updates trip status → /api/trips/123 (PATCH)
6. Caissier sells tickets → /api/tickets (POST)
7. System recalculates occupancy, real-time updates visible everywhere

ADMIN ANALYTICS FLOW:
1. Responsable clicks AnalyticsPage
2. Frontend calls → /api/analytics/revenue?startDate=...&endDate=...
3. Backend aggregates ticket data → calculates metrics
4. Backend returns: total revenue, trips count, passenger count, etc
5. Frontend displays charts (recharts)
```

---

# ARCHITECTURE & DEPLOYMENT

## Project Structure (Root: c:\FasoTravel\)

```
c:\FasoTravel\
│
├─ Mobile/                          [PASSENGER APP]
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ HomePage/             [Search trips by route/date]
│  │  │  ├─ SearchResultsPage/    [List of matching trips]
│  │  │  ├─ BookingPage/          [Select seats, enter passenger info]
│  │  │  ├─ PaymentPage/          [Stripe/PayPal integration]
│  │  │  ├─ ConfirmationPage/     [Booking confirmed, print ticket]
│  │  │  ├─ MyBookingsPage/       [List user's bookings]
│  │  │  ├─ TripTrackingPage/     [Live tracking with map]
│  │  │  ├─ ProfilePage/          [User account settings]
│  │  │  ├─ LoginPage/            [Email + password + OTP]
│  │  │  └─ RegisterPage/         [New passenger registration]
│  │  │
│  │  ├─ components/
│  │  │  ├─ TripCard.tsx          [Shows trip: route, time, price, seats]
│  │  │  ├─ SeatSelector.tsx      [Pick seats visually]
│  │  │  ├─ PaymentForm.tsx       [Credit card, Mobile money]
│  │  │  ├─ LocationMap.tsx       [Leaflet/Google Maps]
│  │  │  ├─ LiveTracking.tsx      [Real-time vehicle location]
│  │  │  └─ TicketQRCode.tsx      [Display booking QR code]
│  │  │
│  │  ├─ contexts/
│  │  │  ├─ AuthContext.tsx       [PassengerUser state]
│  │  │  ├─ BookingContext.tsx    [Booking/cart state]
│  │  │  └─ AppContext.tsx        [Global app state]
│  │  │
│  │  ├─ hooks/
│  │  │  ├─ useAuth.ts            [Auth operations]
│  │  │  ├─ useTrips.ts           [Search/filter trips]
│  │  │  ├─ useBooking.ts         [Add/remove tickets, totals]
│  │  │  ├─ useLiveTracking.ts    [WebSocket location]
│  │  │  ├─ usePayment.ts         [Payment processing]
│  │  │  └─ useLocation.ts        [Geolocation API]
│  │  │
│  │  ├─ services/
│  │  │  ├─ authService.ts        [login, register, logout]
│  │  │  ├─ tripService.ts        [search, filter, get details]
│  │  │  ├─ bookingService.ts     [create booking, get bookings]
│  │  │  ├─ paymentService.ts     [Stripe/PayPal API calls]
│  │  │  ├─ locationService.ts    [WebSocket for live tracking]
│  │  │  └─ reviewService.ts      [Post trip review/rating]
│  │  │
│  │  ├─ shared/                   [SYMLINK to ../Shared/]
│  │  │  ├─ services/
│  │  │  │  └─ apiClient.ts       [HTTP client - CENTRAL]
│  │  │  └─ types/
│  │  │     └─ standardized.ts    [All 18 entities]
│  │  │
│  │  ├─ styles/
│  │  │  ├─ index.css             [Global styles]
│  │  │  ├─ responsive.css        [Responsive breakpoints]
│  │  │  └─ theme.css             [Dark/light mode]
│  │  │
│  │  ├─ utils/
│  │  │  ├─ formatters.ts         [Format date, currency, time]
│  │  │  ├─ validators.ts         [Email, phone, etc]
│  │  │  └─ storage.ts            [localStorage helpers]
│  │  │
│  │  ├─ App.tsx                  [Main router]
│  │  └─ main.tsx                 [Entry point]
│  │
│  ├─ package.json                [Dependencies: react, vite, axios]
│  ├─ vite.config.ts              [Vite configuration]
│  └─ tsconfig.json               [TypeScript config]
│
├─ Societe/                        [OPERATOR ADMIN APP]
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ LoginPage.tsx
│  │  │  ├─ responsable/          [13 pages for CEO/Director]
│  │  │  │  ├─ Dashboard.tsx      [Parent router]
│  │  │  │  ├─ DashboardHome.tsx  [Overview stats]
│  │  │  │  ├─ RoutesPage.tsx     [CRUD routes]
│  │  │  │  ├─ StationsPage.tsx   [CRUD stations]
│  │  │  │  ├─ SchedulesPage.tsx  [CRUD schedules]
│  │  │  │  ├─ PricingPage.tsx    [CRUD pricing rules]
│  │  │  │  ├─ TripsPage.tsx      [View/edit all trips]
│  │  │  │  ├─ TicketsPage.tsx    [All bookings across system]
│  │  │  │  ├─ ManagersPage.tsx   [Manage staff]
│  │  │  │  ├─ AnalyticsPage.tsx  [Business intelligence]
│  │  │  │  ├─ IncidentsPage.tsx  [View all incidents]
│  │  │  │  ├─ StoriesPage.tsx    [Marketing content]
│  │  │  │  └─ PoliciesPage.tsx   [System configuration]
│  │  │  │
│  │  │  ├─ manager/              [8 pages for Station Manager]
│  │  │  │  ├─ Dashboard.tsx      [Parent router]
│  │  │  │  ├─ DashboardHome.tsx  [Station overview]
│  │  │  │  ├─ DeparturesPage.tsx [Today's trips]
│  │  │  │  ├─ CashiersPage.tsx   [Staff at station]
│  │  │  │  ├─ TripsPage.tsx      [Edit own trips]
│  │  │  │  ├─ SalesPage.tsx      [Sales monitoring]
│  │  │  │  ├─ IncidentsPage.tsx  [Station incidents]
│  │  │  │  └─ SupportPage.tsx    [Customer support]
│  │  │  │
│  │  │  └─ caissier/             [9 pages for Cashier]
│  │  │     ├─ Dashboard.tsx      [Parent router]
│  │  │     ├─ DashboardHome.tsx  [Sales dashboard]
│  │  │     ├─ TicketSalePage.tsx [MAIN: Sell tickets]
│  │  │     ├─ CashPage.tsx       [Cash drawer management]
│  │  │     ├─ RefundPage.tsx     [Process refunds]
│  │  │     ├─ HistoryPage.tsx    [Transaction history]
│  │  │     ├─ ReportPage.tsx     [Shift reports]
│  │  │     ├─ PassengersPage.tsx [Passenger lists]
│  │  │     └─ DiagnosticPage.tsx [System diagnostics]
│  │  │
│  │  ├─ components/
│  │  │  ├─ layout/
│  │  │  │  ├─ DashboardLayout.tsx
│  │  │  │  ├─ Sidebar.tsx
│  │  │  │  └─ TopBar.tsx
│  │  │  │
│  │  │  ├─ dashboard/
│  │  │  │  ├─ StatCard.tsx
│  │  │  │  ├─ DataTable.tsx
│  │  │  │  ├─ ChartWidget.tsx
│  │  │  │  └─ FilterPanel.tsx
│  │  │  │
│  │  │  └─ forms/
│  │  │     ├─ FormDialog.tsx
│  │  │     ├─ RouteForm.tsx
│  │  │     ├─ StationForm.tsx
│  │  │     ├─ ScheduleForm.tsx
│  │  │     └─ PricingForm.tsx
│  │  │
│  │  ├─ contexts/
│  │  │  ├─ AuthContext.tsx       [OperatorUser state + 3 roles]
│  │  │  ├─ DataContext.tsx       [All 18 entities + CRUD]
│  │  │  └─ ThemeContext.tsx      [Dark/light mode]
│  │  │
│  │  ├─ hooks/
│  │  │  ├─ useAuth.ts            [Login, logout, permissions]
│  │  │  ├─ useData.ts            [All entities + CRUD]
│  │  │  ├─ useFilteredData.ts    [Role-based filtering]
│  │  │  ├─ useTheme.ts           [Dark mode]
│  │  │  └─ useLocalStorage.ts    [Persistence]
│  │  │
│  │  ├─ services/
│  │  │  ├─ api/
│  │  │  │  ├─ authService.ts
│  │  │  │  ├─ tripService.ts
│  │  │  │  ├─ ticketService.ts
│  │  │  │  ├─ stationService.ts
│  │  │  │  ├─ routeService.ts
│  │  │  │  ├─ scheduleService.ts
│  │  │  │  ├─ pricingService.ts
│  │  │  │  ├─ cashierService.ts
│  │  │  │  ├─ managerService.ts
│  │  │  │  ├─ incidentService.ts
│  │  │  │  ├─ storyService.ts
│  │  │  │  ├─ analyticService.ts
│  │  │  │  └─ liveLocationService.ts [WebSocket]
│  │  │  │
│  │  │  └─ config/
│  │  │     └─ deployment.ts      [isDevelopment() helper]
│  │  │
│  │  ├─ shared/                   [SYMLINK to ../Shared/]
│  │  │  ├─ services/
│  │  │  │  └─ apiClient.ts       [HTTP client - CENTRAL]
│  │  │  └─ types/
│  │  │     └─ standardized.ts    [All 18 entities]
│  │  │
│  │  ├─ styles/
│  │  │  ├─ index.css
│  │  │  ├─ responsive.css
│  │  │  └─ theme.css
│  │  │
│  │  ├─ utils/
│  │  │  ├─ formatters.ts
│  │  │  ├─ validators.ts
│  │  │  └─ logger.ts
│  │  │
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  │
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ tsconfig.json
│
├─ Shared/                         [SHARED CODE]
│  ├─ services/
│  │  ├─ apiClient.ts             [✅ CENTRAL HTTP CLIENT]
│  │  │  ├─ Request interceptor (token injection)
│  │  │  ├─ Response interceptor (error handling)
│  │  │  ├─ Retry logic (exponential backoff)
│  │  │  ├─ Timeout (30 seconds)
│  │  │  └─ Request/response logging
│  │  │
│  │  ├─ index.ts                 [Export apiClient]
│  │  └─ ...other shared services?
│  │
│  └─ types/
│     ├─ standardized.ts          [✅ ALL 18 ENTITIES]
│     │  ├─ User types
│     │  │  ├─ OperatorUser
│     │  │  └─ PassengerUser
│     │  │
│     │  ├─ Transport entities
│     │  │  ├─ Route
│     │  │  ├─ Station
│     │  │  ├─ Trip
│     │  │  ├─ ScheduleTemplate
│     │  │  ├─ PricingSegment
│     │  │  └─ ... more
│     │  │
│     │  └─ Booking/Management
│     │     ├─ Ticket
│     │     ├─ CashTransaction
│     │     ├─ Incident
│     │     ├─ Story
│     │     ├─ Review
│     │     └─ ... more
│     │
│     ├─ enums.ts                 [UserRole, TripStatus, TicketStatus]
│     ├─ constants.ts             [API_BASE_URL, STORAGE_KEYS]
│     └─ index.ts                 [Export all types]
│
├─ Backend/                        [TO BUILD - Node.js/Express or Python/Django]
│  ├─ src/
│  │  ├─ models/                  [Database models/schemas]
│  │  ├─ routes/                  [40+ API endpoints]
│  │  ├─ controllers/             [Business logic]
│  │  ├─ middleware/              [Auth, validation, error handling]
│  │  ├─ services/                [Database operations, external APIs]
│  │  ├─ utils/                   [Helpers]
│  │  └─ config/                  [Database, environment, etc]
│  │
│  └─ ... standard backend structure
│
├─ Scripts/                        [UTILITIES]
│  ├─ coherence-test.js           [Verify system consistency]
│  ├─ db-seed.js                  [Populate initial data]
│  └─ ...other utilities
│
└─ Documentation/
   ├─ SYSTEM_COMPLETE_SPECIFICATION.md (this file)
   ├─ API_REFERENCE.md
   ├─ DEPLOYMENT_GUIDE.md
   ├─ TROUBLESHOOTING.md
   └─ ...other docs
```

---

# DATABASE SCHEMA

## Complete Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐
│   Users      │◄────────┤  OperatorUser│
│ (Passengers) │         │   (Operators)│
└──────┬───────┘         └──────┬───────┘
       │                        │
       │                        │
   ┌───▼────────┐          ┌────▼──────────┐
   │  Bookings  │          │   Cashier     │
   │ (Tickets)  │          │ (Staff)       │
   └───┬────────┘          └────┬──────────┘
       │                        │
       │                   ┌────▼──────────────┐
       │                   │ CashTransaction   │
       │                   │ (Cash tracking)   │
       │                   └───────────────────┘
       │
    ┌──▼──────────┐
    │   Trips     │◄────────────┐
    │ (Schedule   │             │
    │  instances) │             │
    └──┬──────────┘        ┌────┴─────────┐
       │                   │              │
       │              ┌────▼─────┐   ┌────▼──────┐
       │              │ Routes   │   │ Schedules │
       │              │ (Paths)  │   │ (Templates)
       │              └──────────┘   └───────────┘
       │
       ├─────────────┬──────────────┬─────────────┐
       │             │              │             │
   ┌───▼──┐   ┌─────▼────┐  ┌──────▼──┐   ┌─────▼────┐
   │Review│   │ Pricing  │  │ Stories │   │Incidents │
   │      │   │          │  │         │   │          │
   └──────┘   └──────────┘  └─────────┘   └──────────┘
```

## Tables Detaillées

### 1. users (Passengers)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  profile_image_url VARCHAR(500),
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMP,
  email_verified_at TIMESTAMP,
  last_login_at TIMESTAMP,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_status (status)
);
```

### 2. operator_users (Admin users - 3 roles)

```sql
CREATE TABLE operator_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('responsable', 'manager', 'caissier') NOT NULL,
  society_id UUID NOT NULL,
  society_name VARCHAR(255),
  
  -- For manager/caissier only
  gare_id UUID,
  gare_name VARCHAR(255),
  
  -- For caissier only
  shift_start_time TIME,
  shift_end_time TIME,
  
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_society (society_id),
  INDEX idx_gare (gare_id),
  FOREIGN KEY (gare_id) REFERENCES stations(id)
);
```

### 3. routes (Bus routes)

```sql
CREATE TABLE routes (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  society_id UUID NOT NULL,
  start_station_id UUID NOT NULL,
  end_station_id UUID NOT NULL,
  distance_km DECIMAL(10,2),
  estimated_duration_minutes INT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  is_express BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE KEY (society_id, name),
  INDEX idx_status (status),
  INDEX idx_society (society_id),
  FOREIGN KEY (society_id) REFERENCES companies(id),
  FOREIGN KEY (start_station_id) REFERENCES stations(id),
  FOREIGN KEY (end_station_id) REFERENCES stations(id),
  FOREIGN KEY (created_by) REFERENCES operator_users(id)
);
```

### 4. stations (Bus stations/terminals)

```sql
CREATE TABLE stations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  capacity INT DEFAULT 100,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  opening_time TIME,
  closing_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_city (city),
  INDEX idx_status (status),
  SPATIAL INDEX idx_location (latitude, longitude)
);
```

### 5. schedules (Schedule templates - recurring)

```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY,
  route_id UUID NOT NULL,
  day_of_week INT NOT NULL,  -- 0-6 (Sun-Sat)
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  driver_name VARCHAR(255),
  vehicle_registration VARCHAR(20),
  capacity INT DEFAULT 50,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_route (route_id),
  INDEX idx_day (day_of_week),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  UNIQUE KEY (route_id, day_of_week, departure_time)
);
```

### 6. trips (Actual trip instances)

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  schedule_id UUID NOT NULL,
  route_id UUID NOT NULL,
  gare_id UUID NOT NULL,  -- Origin station
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  
  driver_id UUID,
  vehicle_registration VARCHAR(20),
  
  status ENUM('scheduled', 'in-progress', 'completed', 'cancelled') 
    DEFAULT 'scheduled',
  current_passengers INT DEFAULT 0,
  capacity INT DEFAULT 50,
  
  current_latitude DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  last_location_update TIMESTAMP,
  
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT,
  
  INDEX idx_route (route_id),
  INDEX idx_gare (gare_id),
  INDEX idx_status (status),
  INDEX idx_departure (departure_time),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (gare_id) REFERENCES stations(id),
  FOREIGN KEY (driver_id) REFERENCES operator_users(id),
  FOREIGN KEY (created_by) REFERENCES operator_users(id)
);
```

### 7. tickets (Bookings/Reservations)

```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  
  fare DECIMAL(10,2) NOT NULL,
  discount DECIMAL(5,2),
  tax DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  
  status ENUM('booked', 'confirmed', 'used', 'cancelled', 'refunded') 
    DEFAULT 'booked',
  
  payment_method ENUM('cash', 'card', 'mobile_money'),
  payment_status ENUM('pending', 'paid', 'failed'),
  transaction_id VARCHAR(255),
  
  cashier_id UUID,  -- Who sold it
  cashier_station_id UUID,
  
  purchase_date TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  refund_amount DECIMAL(10,2),
  refunded_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_trip (trip_id),
  INDEX idx_passenger (passenger_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_cashier (cashier_id),
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (passenger_id) REFERENCES users(id),
  FOREIGN KEY (cashier_id) REFERENCES operator_users(id),
  FOREIGN KEY (cashier_station_id) REFERENCES stations(id),
  UNIQUE KEY (trip_id, seat_number)
);
```

### 8. cash_transactions (Cash management)

```sql
CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY,
  cashier_id UUID NOT NULL,
  gare_id UUID NOT NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  type ENUM('sale', 'refund', 'adjustment', 'opening', 'closing') 
    NOT NULL,
  
  trip_id UUID,
  ticket_id UUID,
  
  description TEXT,
  reference_number VARCHAR(50),
  
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_cashier (cashier_id),
  INDEX idx_gare (gare_id),
  INDEX idx_type (type),
  INDEX idx_date (created_at),
  FOREIGN KEY (cashier_id) REFERENCES operator_users(id),
  FOREIGN KEY (gare_id) REFERENCES stations(id),
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (verified_by) REFERENCES operator_users(id)
);
```

### 9. pricing_segments (Pricing rules)

```sql
CREATE TABLE pricing_segments (
  id UUID PRIMARY KEY,
  route_id UUID NOT NULL,
  passenger_type ENUM('adult', 'child', 'senior') NOT NULL,
  
  base_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2),
  final_price DECIMAL(10,2) GENERATED ALWAYS AS 
    (base_price * (1 - COALESCE(discount_percentage, 0) / 100))
    STORED,
  
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_route (route_id),
  INDEX idx_type (passenger_type),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  UNIQUE KEY (route_id, passenger_type, effective_from)
);
```

### 10. incidents (System issues/delays)

```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY,
  gare_id UUID,
  trip_id UUID,
  
  type ENUM('accident', 'delay', 'cancellation', 'mechanical', 'other') 
    NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  status ENUM('open', 'in-progress', 'resolved') DEFAULT 'open',
  
  reported_by UUID NOT NULL,
  resolved_by UUID,
  
  estimated_resolution_time TIMESTAMP,
  resolved_at TIMESTAMP,
  
  impact_estimate TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_status (status),
  INDEX idx_severity (severity),
  INDEX idx_gare (gare_id),
  FOREIGN KEY (gare_id) REFERENCES stations(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (reported_by) REFERENCES operator_users(id),
  FOREIGN KEY (resolved_by) REFERENCES operator_users(id)
);
```

### 11. stories (Marketing/News)

```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  
  category ENUM('news', 'promotion', 'alert', 'maintenance') NOT NULL,
  
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  published_at TIMESTAMP,
  
  created_by UUID NOT NULL,
  views_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_status (status),
  INDEX idx_category (category),
  FOREIGN KEY (created_by) REFERENCES operator_users(id)
);
```

### 12. reviews (Passenger feedback)

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL,
  passenger_id UUID NOT NULL,
  
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  aspects JSON,  -- {cleanliness: 5, comfort: 4, driver: 5}
  
  helpful_count INT DEFAULT 0,
  
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_trip (trip_id),
  INDEX idx_passenger (passenger_id),
  INDEX idx_rating (rating),
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (passenger_id) REFERENCES users(id)
);
```

### 13. audit_logs (System tracking)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  
  changes JSON,  -- {field_name: {old_value, new_value}}
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  status VARCHAR(20),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_date (created_at)
);
```

---

# SHARED LAYER (CORE)

## apiClient.ts - The Central HTTP Handler

```typescript
// shared/services/apiClient.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// ============= ERROR CLASS =============
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

// ============= API CLIENT =============
class ApiClient {
  private client: AxiosInstance;
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  private requestTimeout = 30000; // 30 seconds
  private maxRetries = 3;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.requestTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor - Token injection
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

    // Response interceptor - Error handling + Token refresh
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
              // Retry original request
              return this.client(error.config!);
            }
          } catch (refreshError) {
            // Refresh failed - logout
            localStorage.clear();
            window.location.href = '/login';
          }
        }

        throw this.handleError(error);
      }
    );
  }

  // ============= HTTP METHODS =============
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

  // ============= RETRY LOGIC =============
  private async retry<T>(
    fn: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const shouldRetry = 
        attempt < this.maxRetries &&
        this.isRetryableError(error);

      if (shouldRetry) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, attempt + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error?.response?.status) return true;
    // Retry on 5xx or specific 4xx errors
    return error.response.status >= 500 || 
           error.response.status === 408 ||
           error.response.status === 429;
  }

  // ============= ERROR HANDLING =============
  private handleError(error: AxiosError): ApiError {
    const status = error.response?.status;
    const data = error.response?.data as any;

    let code = 'UNKNOWN_ERROR';
    let message = 'An unknown error occurred';
    let details = null;

    if (error.code === 'ECONNABORTED') {
      code = 'TIMEOUT';
      message = 'Request timeout - check your connection';
    } else if (error.code === 'ENOTFOUND') {
      code = 'NETWORK_ERROR';
      message = 'Network error - check your internet connection';
    } else if (status === 400) {
      code = 'VALIDATION_ERROR';
      message = data?.message || 'Invalid input data';
      details = data?.errors;
    } else if (status === 401) {
      code = 'UNAUTHORIZED';
      message = 'Authentication failed - please login again';
    } else if (status === 403) {
      code = 'FORBIDDEN';
      message = 'You do not have permission to access this resource';
    } else if (status === 404) {
      code = 'NOT_FOUND';
      message = data?.message || 'Resource not found';
    } else if (status === 409) {
      code = 'CONFLICT';
      message = data?.message || 'Resource conflict';
      details = data?.details;
    } else if (status === 422) {
      code = 'UNPROCESSABLE_ENTITY';
      message = data?.message || 'Data validation failed';
      details = data?.errors;
    } else if (status === 429) {
      code = 'RATE_LIMITED';
      message = 'Too many requests - please wait a moment';
    } else if (status && status >= 500) {
      code = 'SERVER_ERROR';
      message = 'Server error - please try again later';
    }

    return new ApiError(code, message, status, details);
  }
}

export const apiClient = new ApiClient();
```

## Types - All 18 Entities

```typescript
// shared/types/standardized.ts

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
  dayOfWeek: number; // 0-6
  departureTime: string; // HH:MM
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
  departureTime: string; // ISO datetime
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

export interface PricingSegment {
  id: string;
  routeId: string;
  passengerType: 'adult' | 'child' | 'senior';
  basePrice: number;
  discountPercentage?: number;
  finalPrice: number;
  effectiveFrom: string; // Date
  effectiveTo?: string;
  createdAt: string;
  updatedAt: string;
}

// ============= BOOKING ENTITIES =============

export interface Ticket {
  id: string;
  tripId: string;
  passengerId: string;
  seatNumber: string;
  fare: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  status: 'booked' | 'confirmed' | 'used' | 'cancelled' | 'refunded';
  paymentMethod?: 'cash' | 'card' | 'mobile_money';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  transactionId?: string;
  cashierId?: string;
  cashierStationId?: string;
  purchaseDate: string;
  usedAt?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Cashier {
  id: string;
  name: string;
  email: string;
  gareId: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CashTransaction {
  id: string;
  cashierId: string;
  gareId: string;
  amount: number;
  type: 'sale' | 'refund' | 'adjustment' | 'opening' | 'closing';
  tripId?: string;
  ticketId?: string;
  description?: string;
  referenceNumber?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

// ============= MANAGEMENT ENTITIES =============

export interface Incident {
  id: string;
  gareId?: string;
  tripId?: string;
  type: 'accident' | 'delay' | 'cancellation' | 'mechanical' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  reportedBy: string;
  resolvedBy?: string;
  estimatedResolutionTime?: string;
  resolvedAt?: string;
  impactEstimate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: 'news' | 'promotion' | 'alert' | 'maintenance';
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdBy: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  tripId: string;
  passengerId: string;
  rating: number; // 1-5
  comment?: string;
  aspects?: Record<string, number>; // {cleanliness: 5, comfort: 4}
  helpfulCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
  createdAt: string;
}

// ============= API RESPONSE TYPES =============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}
```

---

# MOBILE APP (PASSENGER)

## Complete Page Specifications

### HomePage

```typescript
/**
 * HOMEPAGE - Passenger entry point
 * 
 * Displays:
 * - Search form (from/to/date/passengers)
 * - Recent bookings
 * - Promotions/Stories
 * - Quick actions
 */

interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recentBookings, setRecentBookings] = useState<Ticket[]>([]);

  useEffect(() => {
    loadRecentBookings();
  }, [user?.id]);

  const loadRecentBookings = async () => {
    try {
      // GET /api/passengers/:id/bookings?limit=5&sort=-createdAt
      const bookings = await apiClient.get(`/passengers/${user?.id}/bookings`, {
        params: { limit: 5, sort: '-createdAt' }
      });
      setRecentBookings(bookings);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="home-page">
      <SearchForm onSearch={(filters) => handleSearch(filters)} />
      
      <div className="recent-bookings">
        <h2>My Recent Bookings</h2>
        {recentBookings.map(booking => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>

      <div className="promotions">
        <h2>Special Offers</h2>
        {/* Display stories with category='promotion' */}
      </div>
    </div>
  );
};
```

### SearchResultsPage

```typescript
/**
 * SEARCH RESULTS - List matching trips
 * 
 * Query params: from, to, date, passengers
 * 
 * Displays:
 * - Filters (price, departure time, trip duration)
 * - List of trips with cards
 * - Sorting options
 * - Pagination
 */

interface SearchResultsPageProps {}

const SearchResultsPage: React.FC<SearchResultsPageProps> = () => {
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price');
  const [currentPage, setCurrentPage] = useState(1);

  const filters = {
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    date: searchParams.get('date'),
    passengers: parseInt(searchParams.get('passengers') || '1'),
    page: currentPage,
    limit: 20,
    sort: sortBy
  };

  useEffect(() => {
    searchTrips();
  }, [filters]);

  const searchTrips = async () => {
    try {
      setLoading(true);
      // GET /api/trips/search?from=...&to=...&date=...&passengers=...
      const response = await apiClient.get('/trips/search', {
        params: filters
      });
      setTrips(response.data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-results">
      <FilterPanel onChange={setFilters} />
      
      <div className="sort-options">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="departure_time">Departure Time</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="trips-list">
            {trips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
          <Pagination 
            current={currentPage} 
            onChange={setCurrentPage}
            total={100} // Get from response
          />
        </>
      )}
    </div>
  );
};
```

### BookingPage (Multi-Step Form)

```typescript
/**
 * BOOKING PAGE - Step-by-step booking process
 * 
 * Steps:
 * 1. Trip summary + seat selection
 * 2. Passenger info
 * 3. Review & confirm
 */

interface BookingPageProps {}

type BookingStep = 'seats' | 'passenger' | 'review';

const BookingPage: React.FC<BookingPageProps> = () => {
  const { tripId } = useParams();
  const [step, setStep] = useState<BookingStep>('seats');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerInfo, setPassengerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTripDetails();
  }, [tripId]);

  const loadTripDetails = async () => {
    const trip = await apiClient.get(`/trips/${tripId}`);
    setTrip(trip);
  };

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);
      
      // POST /api/bookings
      const booking = await apiClient.post('/bookings', {
        tripId,
        seats: selectedSeats,
        passengerInfo,
        ticketCount: selectedSeats.length,
        totalAmount: calculateTotal()
      });

      // Redirect to payment
      navigate(`/payment/${booking.id}`);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-page">
      {step === 'seats' && (
        <div>
          <h2>Select Seats</h2>
          <SeatSelector 
            trip={trip}
            onSelect={setSelectedSeats}
          />
          <button onClick={() => setStep('passenger')}>Next</button>
        </div>
      )}

      {step === 'passenger' && (
        <div>
          <h2>Passenger Information</h2>
          <PassengerForm 
            onChange={setPassengerInfo}
          />
          <button onClick={() => setStep('seats')}>Back</button>
          <button onClick={() => setStep('review')}>Next</button>
        </div>
      )}

      {step === 'review' && (
        <div>
          <h2>Review Booking</h2>
          <BookingSummary 
            trip={trip}
            seats={selectedSeats}
            passenger={passengerInfo}
            total={calculateTotal()}
          />
          <button onClick={() => setStep('passenger')}>Back</button>
          <button 
            onClick={handleConfirmBooking}
            loading={loading}
          >
            Continue to Payment
          </button>
        </div>
      )}
    </div>
  );
};
```

### PaymentPage

```typescript
/**
 * PAYMENT PAGE - Stripe/PayPal integration
 * 
 * Displays:
 * - Payment method selection
 * - Payment form
 * - Booking summary
 */

interface PaymentPageProps {}

const PaymentPage: React.FC<PaymentPageProps> = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<Ticket | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    const booking = await apiClient.get(`/bookings/${bookingId}`);
    setBooking(booking);
  };

  const handlePayment = async (paymentData: any) => {
    try {
      setLoading(true);

      // Process payment via backend
      // POST /api/bookings/:id/pay
      const result = await apiClient.post(
        `/bookings/${bookingId}/pay`,
        {
          paymentMethod,
          ...paymentData
        }
      );

      if (result.success) {
        navigate(`/confirmation/${bookingId}`);
      }
    } catch (error) {
      // Handle payment error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-methods">
        <label>
          <input 
            type="radio" 
            value="card"
            checked={paymentMethod === 'card'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          Credit/Debit Card
        </label>
        <label>
          <input 
            type="radio"
            value="mobile_money"
            checked={paymentMethod === 'mobile_money'}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          Mobile Money
        </label>
      </div>

      {paymentMethod === 'card' && (
        <StripePaymentForm onSubmit={handlePayment} />
      )}

      {paymentMethod === 'mobile_money' && (
        <MobileMoneyForm onSubmit={handlePayment} />
      )}

      <div className="summary">
        <h3>Booking Summary</h3>
        <p>Total: {formatCurrency(booking?.totalAmount)}</p>
      </div>
    </div>
  );
};
```

### ConfirmationPage

```typescript
/**
 * CONFIRMATION PAGE - Booking successful
 * 
 * Displays:
 * - Booking details
 * - QR code/ticket number
 * - Download/print options
 * - Next steps
 */

const ConfirmationPage: React.FC = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<Ticket | null>(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    const booking = await apiClient.get(`/bookings/${bookingId}`);
    setBooking(booking);
  };

  return (
    <div className="confirmation-page">
      <div className="success-message">
        <h1>Booking Confirmed!</h1>
        <p>Your ticket has been created successfully</p>
      </div>

      <div className="ticket">
        <TicketDisplay booking={booking} />
        <QRCode value={booking?.id} />
      </div>

      <div className="actions">
        <button onClick={() => window.print()}>Print</button>
        <button onClick={() => downloadPDF(booking)}>Download PDF</button>
        <button onClick={() => shareTicket(booking)}>Share</button>
      </div>

      <div className="next-steps">
        <h3>Next Steps</h3>
        <ul>
          <li>Arrive 30 minutes before departure</li>
          <li>Bring your ticket (digital or printed)</li>
          <li>Keep your QR code safe</li>
        </ul>
      </div>
    </div>
  );
};
```

### TripTrackingPage (Live)

```typescript
/**
 * TRIP TRACKING PAGE - Real-time location tracking
 * 
 * Displays:
 * - Map with current location
 * - Trip details
 * - ETA
 * - Driver/vehicle info
 * - Contact options
 */

const TripTrackingPage: React.FC = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const unsubscribe = useLiveTracking(tripId, (location) => {
      setCurrentLocation(location);
    });
    return unsubscribe;
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    const trip = await apiClient.get(`/trips/${tripId}`);
    setTrip(trip);
  };

  return (
    <div className="tracking-page">
      <LiveMap 
        destination={trip?.arrivalStation}
        currentLocation={currentLocation}
        path={trip?.route}
      />

      <div className="trip-info">
        <h2>{trip?.routeName}</h2>
        <div className="details">
          <div>
            <p className="label">Departure</p>
            <p>{formatTime(trip?.departureTime)}</p>
          </div>
          <div>
            <p className="label">Arrival (ETA)</p>
            <p>{formatTime(trip?.arrivalTime)} ({calculateETA(trip, currentLocation)})</p>
          </div>
          <div>
            <p className="label">Passengers</p>
            <p>{trip?.currentPassengers}/{trip?.capacity}</p>
          </div>
        </div>
      </div>

      <div className="driver-info">
        <h3>Driver: {trip?.driverName}</h3>
        <p>Vehicle: {trip?.vehicleRegistration}</p>
        <button>Call Driver</button>
        <button>Chat with Driver</button>
      </div>
    </div>
  );
};
```

---

# ADMIN APP (SOCIETE) - COMPLETE PAGES

## Responsable (CEO) - 13 Pages

### 1. DashboardHome

```typescript
/**
 * RESPONSABLE DASHBOARD HOME
 * Shows system-wide overview
 */

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeTrips: 0,
    totalPassengers: 0,
    systemHealth: 100
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // GET /api/analytics/dashboard-summary?range=30days
    const data = await apiClient.get('/analytics/dashboard-summary');
    setStats(data);
  };

  return (
    <DashboardLayout>
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} />
        <StatCard title="Active Trips" value={stats.activeTrips} />
        <StatCard title="Passengers Today" value={stats.totalPassengers} />
        <StatCard title="System Health" value={`${stats.systemHealth}%`} />
      </div>

      <div className="charts">
        <RevenueChart />
        <TripsChart />
        <PassengersChart />
      </div>
    </DashboardLayout>
  );
};
```

### 2. RoutesPage (CRUD)

```typescript
/**
 * ROUTES MANAGEMENT
 * Full CRUD for routes
 */

const RoutesPage: React.FC = () => {
  const { routes, createRoute, updateRoute, deleteRoute } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const handleCreate = async (data: any) => {
    await createRoute(data);
    setIsDialogOpen(false);
  };

  const handleUpdate = async (id: string, data: any) => {
    await updateRoute(id, data);
    setEditingRoute(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      await deleteRoute(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Routes Management</h1>
        <button onClick={() => setIsDialogOpen(true)}>Add Route</button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Route Name' },
          { key: 'startStation', label: 'From' },
          { key: 'endStation', label: 'To' },
          { key: 'distance', label: 'Distance (km)' },
          { key: 'status', label: 'Status' }
        ]}
        data={routes}
        actions={[
          { label: 'Edit', onClick: (row) => setEditingRoute(row) },
          { label: 'Delete', onClick: (row) => handleDelete(row.id) }
        ]}
      />

      <FormDialog
        open={isDialogOpen || !!editingRoute}
        title={editingRoute ? 'Edit Route' : 'Create Route'}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingRoute(null);
        }}
      >
        <RouteForm 
          onSubmit={editingRoute ? 
            (data) => handleUpdate(editingRoute.id, data) :
            handleCreate
          }
        />
      </FormDialog>
    </DashboardLayout>
  );
};
```

### 3. StationsPage (CRUD)

```typescript
/**
 * STATIONS MANAGEMENT
 * Full CRUD for stations
 */

const StationsPage: React.FC = () => {
  const { stations, createStation, updateStation, deleteStation } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  // Similar to RoutesPage but for stations
  return (
    <DashboardLayout>
      {/* ... */}
    </DashboardLayout>
  );
};
```

### 4-13. Other Responsable Pages...

(Continue similarly for: SchedulesPage, PricingPage, TripsPage, TicketsPage, ManagersPage, AnalyticsPage, IncidentsPage, StoriesPage, PoliciesPage)

---

# BACKEND API SPECIFICATION

## Complete Endpoint Reference

### Auth Endpoints

```
POST /api/auth/operator-login
  Request:
    {
      "email": "responsable@tsr.bf",
      "password": "securepass123",
      "otp": "123456"
    }
  Response (200):
    {
      "success": true,
      "data": {
        "user": { OperatorUser },
        "token": "eyJhbGciOiJIUzI1NiIs...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
      }
    }
  Errors:
    401: Invalid credentials
    422: Validation error
    429: Too many login attempts

POST /api/auth/passenger-login
  Request:
    {
      "email": "passenger@example.com",
      "password": "securepass123"
    }
  Response (200):
    {
      "success": true,
      "data": {
        "user": { PassengerUser },
        "token": "...",
        "refreshToken": "..."
      }
    }

POST /api/auth/passenger-register
  Request:
    {
      "email": "newpassenger@example.com",
      "name": "John Doe",
      "phone": "+221123456789",
      "password": "securepass123"
    }
  Response (201):
    {
      "success": true,
      "data": { PassengerUser }
    }

POST /api/auth/refresh-token
  Request:
    {
      "refreshToken": "..."
    }
  Response (200):
    {
      "success": true,
      "data": {
        "token": "...",
        "refreshToken": "..."
      }
    }

POST /api/auth/logout
  Response (200):
    {
      "success": true,
      "message": "Logged out successfully"
    }
```

### Trip Endpoints (with Role-Based Access)

```
GET /api/trips
  Query params:
    ?from=stationId
    &to=stationId
    &date=2026-01-30
    &status=scheduled
    &gareId=123 (for manager)
    &page=1
    &limit=50
  
  Response (200):
    {
      "success": true,
      "data": [ Trip[], ... ],
      "pagination": { page, limit, total, totalPages }
    }

  Access Control:
    - Responsable: All trips
    - Manager: Only own station's trips
    - Caissier: Denied

GET /api/trips/:id
  Response (200):
    {
      "success": true,
      "data": { Trip }
    }

POST /api/trips
  Request:
    {
      "scheduleId": "...",
      "routeId": "...",
      "gareId": "...",
      "departureTime": "2026-02-01T14:30:00Z",
      "arrivalTime": "2026-02-01T22:15:00Z",
      "driverId": "...",
      "vehicleRegistration": "AB-123-XYZ",
      "capacity": 50
    }
  Response (201):
    {
      "success": true,
      "data": { Trip }
    }
  
  Access Control:
    - Responsable: Can create
    - Manager: Can create for own station
    - Caissier: Denied

PUT /api/trips/:id
  Request: (Same as POST, but partial)
  Response (200):
    {
      "success": true,
      "data": { Trip }
    }

PATCH /api/trips/:id/status
  Request:
    {
      "status": "in-progress"
    }
  Response (200):
    {
      "success": true,
      "data": { Trip }
    }

DELETE /api/trips/:id
  Response (204): No content
  
  Access Control:
    - Responsable: Can delete
    - Manager: Can delete own station's trips
    - Caissier: Denied
```

### Ticket Endpoints (with Filtering)

```
GET /api/tickets
  Query params:
    ?tripId=...
    &passengerId=...
    &status=booked
    &from=2026-01-01
    &to=2026-01-31
    &cashierId=... (for caissier)
  
  Access Control:
    - Responsable: All tickets
    - Manager: Only own station's tickets
    - Caissier: Only own tickets

POST /api/tickets
  Request:
    {
      "tripId": "...",
      "passengerId": "...",
      "seatNumber": "A1",
      "passengerType": "adult",
      "paymentMethod": "cash"
    }
  Response (201):
    {
      "success": true,
      "data": {
        ...Ticket,
        "fare": 50000,
        "tax": 2000,
        "totalAmount": 52000
      }
    }

  Business Logic:
    1. Validate trip exists and is not departed
    2. Check seat availability
    3. Calculate price based on pricing_segments
    4. Create ticket record
    5. Update trip.currentPassengers
    6. Send confirmation email/SMS

POST /api/tickets/:id/refund
  Request:
    {
      "reason": "Passenger requested refund"
    }
  Response (200):
    {
      "success": true,
      "data": { Ticket (with refund info) }
    }

  Business Logic:
    1. Validate ticket can be refunded (not used, not departed)
    2. Calculate refund amount (100% if before cutoff, else 80%)
    3. Create refund transaction
    4. Update ticket status
    5. Send refund confirmation
```

---

## (Continuation: 80+ more endpoints for all entities)

---

# SECURITY & AUTHENTICATION

## JWT Token Strategy

```
TOKEN FLOW:
1. User logs in → POST /api/auth/login
2. Backend validates credentials
3. Backend generates:
   - Access Token (expires 1 hour)
   - Refresh Token (expires 7 days)
4. Frontend stores:
   - Access token in memory
   - Refresh token in secure httpOnly cookie
5. Every request includes:
   - Authorization: Bearer <access_token>
6. If access token expires (401):
   - Use refresh token to get new access token
   - Retry original request
7. If refresh token expires:
   - Redirect to login

STRUCTURE (Access Token):
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "user_id",
  "email": "user@example.com",
  "role": "responsable",
  "gareId": null,
  "iat": 1645000000,
  "exp": 1645003600,
  "iss": "FasoTravel"
}

Signature: HMAC-SHA256(secret)
```

## Password Security

```
Requirements:
- Minimum 8 characters
- Must contain uppercase + lowercase
- Must contain numbers
- Must contain special characters (@#$%^&*)

Storage:
- Hash with bcrypt (salt rounds: 12)
- Never store plain passwords
- Never transmit in logs

Change Password:
- Require current password verification
- Trigger logout of all sessions
- Notify user via email
```

## Rate Limiting

```
API Endpoints:
- Login: 5 attempts per 15 minutes per IP
- Password reset: 3 attempts per hour
- General API: 100 requests per minute per user
- Public endpoints: 1000 requests per hour per IP

Exceeded:
- Return 429 Too Many Requests
- Include Retry-After header
- Log suspicious activity
```

## CORS Configuration

```
Allowed Origins:
- http://localhost:3000 (development)
- http://localhost:5173 (Vite)
- https://app.fasotravel.com (production)
- https://admin.fasotravel.com (production)

Allowed Methods:
- GET, POST, PUT, PATCH, DELETE

Allowed Headers:
- Content-Type
- Authorization
- X-Requested-With

Credentials: true
Max Age: 86400 (24 hours)
```

---

# VALIDATION RULES

## User Input Validation

```typescript
// Email validation
- Must be valid format (RFC 5322)
- Must be unique (check database)
- Case-insensitive

// Password validation
- Min 8 characters
- Max 128 characters
- Must contain: uppercase, lowercase, number, special char
- Cannot contain email address
- Cannot reuse last 5 passwords

// Phone validation
- Must be valid format for country
- Must be unique
- Must pass Twilio validation

// Trip booking validation
- Trip must exist
- Trip must not have departed
- Seat must be available
- Passenger must be authenticated
- Total passengers <= seat count
- Passenger info must be complete

// Pricing calculation validation
- Route must exist
- Passenger type must be valid
- Price must be >= 0
- Tax must be >= 0

// Refund validation
- Ticket must exist
- Status must not be 'used'
- Trip must not have departed
- Refund must be within refund window (usually 24h before departure)
```

---

# EXTERNAL INTEGRATIONS

## Payment Gateway (Stripe)

```typescript
// Stripe Integration

POST /api/bookings/:id/pay
  Request:
    {
      "paymentMethod": "card",
      "stripeToken": "tok_visa...",
      "amount": 52000,
      "currency": "XOF"
    }

  Backend process:
    1. Verify booking exists
    2. Call Stripe API (payments.create)
    3. If successful:
       - Update ticket.paymentStatus = 'paid'
       - Create transaction record
       - Send confirmation email
       - Emit WebSocket event
    4. If failed:
       - Return 402 Payment Required
       - Log error

Webhook: /api/webhooks/stripe
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded
```

## SMS Service (Twilio)

```typescript
TRIGGERS FOR SMS:
1. Booking confirmation
   "Your ticket is booked! Trip: Dakar→Bamako, Seat: A1, Date: 2026-02-01"

2. Departure reminder (1 hour before)
   "Reminder: Your trip departs in 1 hour from Station Name"

3. Refund confirmation
   "Refund of 50,000 XOF has been processed"

4. OTP for 2FA
   "Your OTP is: 123456 (expires 10 minutes)"

IMPLEMENTATION:
- Use Twilio SDK
- Store phone numbers in users table
- Queue messages for reliability
- Log all SMS sent
```

## Email Service (SendGrid)

```typescript
TEMPLATES:
1. Welcome email
2. Booking confirmation
3. Refund confirmation
4. Password reset
5. Trip reminder
6. Incident notification

Implementation:
- Use SendGrid API
- Pre-built templates
- Queue for reliability
- Track opens/clicks
```

## Maps Integration (Google Maps / Mapbox)

```typescript
USAGE:
1. Real-time tracking
   - Display vehicle on map
   - Show route
   - Calculate ETA

2. Station locations
   - Display stations on map
   - Calculate distance
   - Get directions

3. Nearby stations
   - Find nearest stations
   - Distance calculation

API Calls:
- Maps JavaScript API (frontend)
- Directions API (backend for route planning)
- Distance Matrix API (for ETA calculation)
```

---

# TESTING STRATEGY

## Unit Tests

```typescript
// Example: tripService.ts

describe('tripService', () => {
  describe('searchTrips', () => {
    it('should return trips matching criteria', async () => {
      const trips = await tripService.list({
        from: 'Dakar',
        to: 'Bamako',
        date: '2026-02-01'
      });
      expect(trips.length).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const trips = await tripService.list({
        status: 'scheduled'
      });
      expect(trips.every(t => t.status === 'scheduled')).toBe(true);
    });
  });
});
```

## Integration Tests

```typescript
// Example: Booking flow

describe('Booking flow', () => {
  it('should complete booking end-to-end', async () => {
    // 1. Search trips
    const trips = await tripService.list({...});
    const trip = trips[0];

    // 2. Create booking
    const booking = await bookingService.create({
      tripId: trip.id,
      seats: ['A1', 'A2'],
      passengerInfo: {...}
    });

    expect(booking.status).toBe('booked');

    // 3. Process payment
    const payment = await paymentService.processPayment({
      bookingId: booking.id,
      amount: booking.totalAmount
    });

    expect(payment.status).toBe('success');

    // 4. Verify ticket created
    const ticket = await ticketService.getById(booking.id);
    expect(ticket.status).toBe('confirmed');
  });
});
```

## E2E Tests

```typescript
// Example: Selenium/Cypress test

describe('Mobile app booking', () => {
  it('should book a ticket from home to confirmation', async () => {
    // 1. Navigate to home
    cy.visit('/');

    // 2. Search for trips
    cy.get('[data-testid="from-input"]').type('Dakar');
    cy.get('[data-testid="to-input"]').type('Bamako');
    cy.get('[data-testid="date-input"]').type('2026-02-01');
    cy.get('[data-testid="search-button"]').click();

    // 3. Select trip
    cy.get('[data-testid="trip-card"]').first().click();

    // 4. Select seats
    cy.get('[data-testid="seat-a1"]').click();

    // 5. Enter passenger info
    cy.get('[data-testid="passenger-name"]').type('John Doe');
    cy.get('[data-testid="passenger-email"]').type('john@example.com');

    // 6. Process payment
    cy.get('[data-testid="payment-button"]').click();

    // 7. Verify confirmation
    cy.get('[data-testid="confirmation-message"]').should('be.visible');
    cy.contains('Booking Confirmed').should('exist');
  });
});
```

---

# DEPLOYMENT & DEVOPS

## Environment Configuration

```bash
# .env.development
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENABLE_MOCK_DATA=true
REACT_APP_LOG_LEVEL=debug

# .env.production
REACT_APP_API_URL=https://api.fasotravel.com/api
REACT_APP_ENABLE_MOCK_DATA=false
REACT_APP_LOG_LEVEL=error

# .env.backend
DATABASE_URL=postgresql://user:pass@localhost:5432/fasotravel
JWT_SECRET=your-secret-key-here
JWT_EXPIRE_IN=1h
REFRESH_TOKEN_EXPIRE_IN=7d
STRIPE_SECRET_KEY=sk_live_...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

## Docker Configuration

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to AWS
        run: |
          aws s3 sync ./dist s3://fasotravel-app
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
```

---

# MONITORING & LOGGING

## Logging Strategy

```typescript
// Logger utility

export const logger = {
  debug: (module: string, message: string, data?: any) => {
    console.log(`[DEBUG] [${module}] ${message}`, data);
  },
  
  info: (module: string, message: string, data?: any) => {
    console.log(`[INFO] [${module}] ${message}`, data);
  },
  
  warn: (module: string, message: string, data?: any) => {
    console.warn(`[WARN] [${module}] ${message}`, data);
  },
  
  error: (module: string, message: string, error?: Error) => {
    console.error(`[ERROR] [${module}] ${message}`, error?.stack);
    // Send to error tracking service (Sentry)
  }
};

// Usage
logger.info('tripService', 'Fetching trips', { filters });
logger.error('paymentService', 'Payment failed', error);
```

## Error Tracking (Sentry)

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-sentry-dsn@sentry.io/...",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Automatically captured errors
// Manual capture
try {
  // ...
} catch (error) {
  Sentry.captureException(error);
}
```

## Performance Monitoring

```typescript
// Web Vitals monitoring

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);

// Send to analytics service
```

---

# PERFORMANCE OPTIMIZATION

## Frontend Optimization

```typescript
// Code Splitting
const HomePage = React.lazy(() => import('./pages/HomePage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));

// Memoization
const TripCard = React.memo(({ trip }) => {
  return <div>{trip.name}</div>;
});

// Virtual Scrolling for large lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={trips.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <TripCard key={trips[index].id} trip={trips[index]} style={style} />
  )}
</FixedSizeList>

// Image Optimization
<img src={image} loading="lazy" />

// Minification & Compression
// Done automatically by build tool (Vite)
```

## Backend Optimization

```typescript
// Database indexing
CREATE INDEX idx_trips_departure ON trips(departure_time);
CREATE INDEX idx_tickets_status ON tickets(status);

// Caching with Redis
const trips = await redis.get('trips:dakar:bamako:2026-02-01');
if (!trips) {
  const data = await db.trips.find({...});
  redis.setex('trips:dakar:bamako:2026-02-01', 3600, data);
}

// Query optimization
SELECT t.id, t.departure_time, COUNT(tk.id) as booked_seats
FROM trips t
LEFT JOIN tickets tk ON t.id = tk.trip_id
WHERE t.route_id = ? AND t.departure_time > NOW()
GROUP BY t.id;

// Pagination
SELECT * FROM trips LIMIT 50 OFFSET 0;

// Batch operations
INSERT INTO tickets (trip_id, passenger_id, ...) 
VALUES (...), (...), (...);
```

---

# COHERENCE CHECKLIST

## Final Verification - 200+ Points

### Architecture
- [ ] Single API entry point (shared/services/apiClient.ts)
- [ ] No duplicate HTTP clients
- [ ] All services call apiClient
- [ ] Types defined once in shared/types/
- [ ] No type duplication across apps
- [ ] Database is single source of truth
- [ ] Mobile and Admin have no direct database access

### Authentication
- [ ] PassengerUser for Mobile
- [ ] OperatorUser with 3 roles for Admin
- [ ] JWT tokens properly implemented
- [ ] Refresh token rotation working
- [ ] Token expires correctly
- [ ] Unauthorized access returns 401
- [ ] Role-based access control enforced

### Data Synchronization
- [ ] Changes in Mobile reflect in Admin (via API)
- [ ] Changes in Admin reflect in Mobile (via API)
- [ ] WebSocket for real-time updates working
- [ ] No race conditions possible
- [ ] Optimistic updates handled properly
- [ ] Error rollback implemented

### API Endpoints
- [ ] 40+ endpoints implemented
- [ ] All endpoints documented
- [ ] Request/response examples provided
- [ ] Error codes consistent
- [ ] HTTP status codes correct
- [ ] Pagination implemented
- [ ] Filtering parameters work

### Security
- [ ] Passwords hashed with bcrypt
- [ ] No sensitive data in logs
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CSRF tokens used

### Validation
- [ ] All inputs validated
- [ ] Error messages user-friendly
- [ ] Validation rules documented
- [ ] Client-side validation exists
- [ ] Server-side validation exists
- [ ] Database constraints in place

### Error Handling
- [ ] Custom error class (ApiError)
- [ ] Error codes documented
- [ ] User-friendly messages
- [ ] Errors logged properly
- [ ] Retry logic implemented
- [ ] Timeout handling works
- [ ] Graceful degradation

### Testing
- [ ] Unit tests exist
- [ ] Integration tests exist
- [ ] E2E tests exist
- [ ] Test coverage > 80%
- [ ] Mocking data available
- [ ] Test database isolated

### Performance
- [ ] Code splitting implemented
- [ ] Lazy loading working
- [ ] Caching strategy defined
- [ ] Database indexes created
- [ ] Queries optimized
- [ ] Bundle size < 500KB
- [ ] Load time < 3 seconds

### Deployment
- [ ] Environment variables configured
- [ ] Build process documented
- [ ] Deployment process documented
- [ ] Rollback procedure defined
- [ ] Database migrations available
- [ ] Scaling strategy defined

### Monitoring
- [ ] Logging implemented
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Alerts configured
- [ ] Uptime monitoring
- [ ] User analytics

### Documentation
- [ ] API documentation complete
- [ ] Code comments helpful
- [ ] README files present
- [ ] Deployment guides written
- [ ] Troubleshooting guide exists
- [ ] Architecture documented

### Code Quality
- [ ] TypeScript: 0 errors
- [ ] No console.log() in production
- [ ] ESLint: 0 errors
- [ ] Prettier: Formatted
- [ ] No unused imports
- [ ] No circular dependencies
- [ ] Naming conventions followed
- [ ] DRY principle applied

---

**END OF COMPLETE SYSTEM SPECIFICATION**

This document serves as the single source of truth for the entire FasoTravel system. All development, deployment, and maintenance decisions should reference this specification to ensure coherence and consistency.

