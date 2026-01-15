# 🔧 GUIDE COMPLET - BACKEND & BASE DE DONNÉES

**Document Date:** 30 Novembre 2025  
**Frontend Status:** ✅ 100% COMPLET ET PRÊT  
**Backend Status:** ⏳ À IMPLÉMENTER  

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture globale](#architecture-globale)
3. [Base de données](#base-de-données)
4. [Endpoints API requis](#endpoints-api-requis)
5. [Flows applicatifs](#flows-applicatifs)
6. [Considérations importantes](#considérations-importantes)

---

## 🎯 Vue d'ensemble

### État du Frontend
- ✅ **100% Complété** - Toutes les pages et composants implémentés
- ✅ **Architecture API prête** - `/lib/api.ts` avec tous les appels préparés
- ✅ **Hooks de gestion d'état** - `/lib/hooks.ts` avec patterns standardisés
- ✅ **Mock data en place** - Permet testing sans backend
- ✅ **TypeScript strict** - Tous les types définis dans `/data/models.ts`

### État du Backend (À FAIRE)
- ⏳ Base de données PostgreSQL (migrations créées ✅, données à charger)
- ⏳ API REST (routes à implémenter)
- ⏳ Authentification (JWT token management)
- ⏳ Webhooks (paiements, notifications)
- ⏳ WebSocket (tracking temps réel, notifications)

### État de la Base de Données
- ✅ **13 migrations créées** (structures définies)
- ⏳ **Données initiales** (à charger)
- ⏳ **Triggers et fonctions** (à créer)
- ⏳ **Views et performances** (à optimiser)

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + TypeScript)             │
│  ✅ 20 pages complètes | 50+ composants | 1200+ ligne API   │
└────────────────────────┬────────────────────────────────────┘
                         │
                    fetch() requests
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
   ┌─────────────┐              ┌──────────────────┐
   │  Mock Data  │              │  Backend API     │
   │  (dev mode) │              │  (prod mode)     │
   └─────────────┘              └────────┬─────────┘
                                         │
                                    HTTP/JSON
                                         │
                        ┌────────────────┴────────────────┐
                        │                                 │
                        ▼                                 ▼
                   ┌──────────────┐         ┌────────────────────┐
                   │ PostgreSQL   │         │   External APIs    │
                   │ Database     │         │ (Orange, Moov, etc)│
                   └──────────────┘         └────────────────────┘
```

---

## 🗄️ Base de Données

### Migrations Existantes (13 au total)

```bash
# Déploiement en ordre:
001_create_operator_stories.sql        # Stories des opérateurs
002_create_advertisements.sql          # Système de publicités
003_create_operator_services.sql       # Services des opérateurs
003_create_core_schema.sql             # Core (trajets, billets, etc)
004_create_support_tables.sql          # Support & incidents
005_seed_core_data.sql                 # Données initiales
006_advanced_triggers_indexes.sql      # Triggers et index
007_seed_user_data.sql                 # Utilisateurs test
008_additional_tables.sql              # Reviews, helpfulness, schedules
009_multi_segment_booking_support.sql  # Support multi-segments
010_trip_progression_seat_management.sql # Gestion des sièges
011_create_operator_policies.sql       # Politiques des opérateurs
012_create_admin_stories.sql           # Stories admin
013_add_promotions_system.sql          # Promotions et bagages
```

### Schéma Principal - Tables Critiques

#### 1. **users** - Utilisateurs
```sql
user_id (UUID)
email (VARCHAR, unique)
phone_number (VARCHAR, unique)
full_name (VARCHAR)
password_hash (VARCHAR)
role (UserRole: USER, OPERATOR_ADMIN, SUPER_ADMIN)
preferred_language (VARCHAR: fr, en, mo)
profile_image_url (VARCHAR)
push_enabled (BOOLEAN)
geo_consent (BOOLEAN)
email_verified (BOOLEAN)
created_at, updated_at, last_login_at
```

**Index requis:**
- `idx_users_email` (unique)
- `idx_users_phone` (unique)
- `idx_users_role` (pour filtrer admins)

---

#### 2. **operators** - Compagnies de transport
```sql
operator_id (VARCHAR, unique)
name (VARCHAR)
operator_logo (VARCHAR)
logo_url (VARCHAR)
description (TEXT)
phone_number (VARCHAR)
email (VARCHAR)
website_url (VARCHAR)
founded_year (INTEGER)
fleet_size (INTEGER)
total_trips (INTEGER)
rating (DECIMAL 3,2)  -- Calculé from reviews
total_reviews (INTEGER)
baggage_price (DECIMAL)  -- Prix standard bagages
primary_station_id (VARCHAR FK)
opening_hours (VARCHAR)
created_at, updated_at
```

**Index requis:**
- `idx_operators_rating` (pour tri)
- `idx_operators_name` (pour recherche)

**Calcul de rating:** Moyenne des `reviews.rating` WHERE `reviews.status = 'APPROVED'`

---

#### 3. **trips** - Trajets
```sql
trip_id (VARCHAR, unique)
operator_id (VARCHAR FK)
from_stop_id (VARCHAR FK)
to_stop_id (VARCHAR FK)
departure_time (TIMESTAMP)
arrival_time (TIMESTAMP)
status (EMBARKED, ARRIVED, DELAYED, CANCELLED)
vehicle_id (VARCHAR)
total_seats (INTEGER)
available_seats (INTEGER)
base_price (DECIMAL)
promotion_id (VARCHAR FK, nullable)  -- Pour promotions
promoted_price (DECIMAL, nullable)   -- Prix après promo
discount_percentage (DECIMAL, nullable)
amenities (JSON: wifi, ac, toilet, etc)
created_at, updated_at
```

**Validation critique:**
```
available_seats = MIN(segment.available_seats for each segment)
```

**Index requis:**
- `idx_trips_operator_date` (pour recherche)
- `idx_trips_departure` (pour tri)
- `idx_trips_status` (pour filtrage)

---

#### 4. **bookings** - Réservations
```sql
booking_id (UUID)
user_id (UUID FK)
trip_id (VARCHAR FK)
status (HOLD, CONFIRMED, PAID, EMBARKED, COMPLETED, CANCELLED)
seat_numbers (JSON: ['1A', '1B'])
passenger_info (JSON: {name, phone, email})
hold_expires_at (TIMESTAMP)  -- TTL 10 minutes pour HOLD
payment_id (UUID FK, nullable)
payment_method (VARCHAR)
created_at, updated_at
```

**Flow critique:**
1. POST /bookings → status=HOLD, hold_expires_at=now+10min
2. TTL trigger: Si hold_expires_at < now → auto-cancel
3. POST /bookings/{id}/confirm → status=CONFIRMED (avant paiement)
4. POST /payments → status=PAID (après paiement réussi)
5. Webhook paiement → status=EMBARKED (jour du voyage)

---

#### 5. **tickets** - Billets
```sql
ticket_id (VARCHAR, unique: QR_CODE + ALPHA_CODE)
booking_id (UUID FK)
user_id (UUID FK)
trip_id (VARCHAR FK)
operator_id (VARCHAR FK)
seat_number (VARCHAR)
status (ACTIVE, EMBARKED, COMPLETED, TRANSFERRED, CANCELLED)
qr_code (VARCHAR)
barcode (VARCHAR)
transfer_token (VARCHAR, unique, nullable)  -- Pour transfert
transfer_expires_at (TIMESTAMP, nullable)
embarked_at (TIMESTAMP, nullable)
created_at
```

**Validation:**
- Un ticket = un siège
- Un siège ne peut pas être vendu deux fois
- Transfert valide 24h seulement

---

#### 6. **payments** - Paiements
```sql
payment_id (UUID)
booking_id (UUID FK)
user_id (UUID FK)
amount (DECIMAL)
currency (VARCHAR: XOF, etc)
method (ORANGE_MONEY, MOOV_MONEY, CARTE_BANCAIRE)
provider_transaction_id (VARCHAR, unique)
status (INITIATED, PENDING, COMPLETED, FAILED, REFUNDED)
created_at, updated_at
```

**Webhook d'Orange/Moov:**
```json
{
  "transaction_id": "TXN_12345",
  "booking_id": "BOOKING_UUID",
  "status": "SUCCESS|FAILED",
  "amount": 25000,
  "timestamp": "2025-11-30T10:30:00Z"
}
```

---

#### 7. **reviews** - Avis et notes
```sql
review_id (UUID)
trip_id (VARCHAR FK, nullable)
operator_id (VARCHAR FK)
user_id (UUID FK)
rating (INTEGER 1-5)
title (VARCHAR, nullable)
comment (TEXT)
aspects (JSON: {cleanliness, comfort, timing, driver_behaviour, value_for_money})
is_verified_traveler (BOOLEAN)  -- Vérifier user a pris ce trajet
helpful_count (INTEGER)
unhelpful_count (INTEGER)
status (PENDING, APPROVED, REJECTED)
created_at, updated_at
```

**Trigger requis:**
- Quand review.status = 'APPROVED' → UPDATE operators SET rating = AVG(rating)

---

#### 8. **notifications** - Notifications
```sql
notification_id (UUID)
user_id (UUID FK)
type (BOOKING_CONFIRMED, TRIP_REMINDER, PRICE_DROP, OPERATOR_UPDATE, PROMO, TRIP_COMPLETED, TRIP_COMPLETED_RATING)
title (VARCHAR)
message (TEXT)
deep_link (VARCHAR, nullable)  -- Pour redirection app
image_url (VARCHAR, nullable)
is_read (BOOLEAN)
created_at
expires_at (TIMESTAMP, nullable)  -- TTL pour certains types
metadata (JSON: {trip_id, operator_id, ticket_id, from_stop, to_stop})
```

**Trigger requis:**
- Quand booking.status = 'PAID' → INSERT notification type='BOOKING_CONFIRMED'
- Quand trip.arrival_time < now → INSERT notification type='TRIP_COMPLETED'
- Quand TRIP_COMPLETED notification créée → INSERT notification type='TRIP_COMPLETED_RATING' (10s après)

---

#### 9. **advertisements** - Publicités
```sql
ad_id (UUID)
placement (SEARCH_RESULTS, TICKET_LIST, OPERATOR_PROFILE, HOME_FEED)
title (VARCHAR)
image_url (VARCHAR)
destination_url (VARCHAR)
priority (INTEGER 1-10)
daily_budget (DECIMAL)
spent_today (DECIMAL)
impressions_today (INTEGER)
clicks_today (INTEGER)
status (ACTIVE, PAUSED, EXPIRED)
created_at, updated_at
```

---

#### 10. **stories** - Stories (Instagram-style)
```sql
story_id (UUID)
operator_id (VARCHAR FK)
title (VARCHAR)
description (TEXT)
emoji (VARCHAR)
gradient (VARCHAR)
category (PROMO, NEW, TIPS, PARTNERS, etc)
is_active (BOOLEAN)
priority (INTEGER 1-10)
created_by (VARCHAR FK)  -- User qui a créé
created_at
expires_at (TIMESTAMP)
```

---

#### 11. **stations** - Gares/Points de départ
```sql
stop_id (VARCHAR, unique)
name (VARCHAR)
city (VARCHAR)
latitude (DECIMAL)
longitude (DECIMAL)
address (VARCHAR)
phone (VARCHAR)
operating_hours (VARCHAR)
facilities (JSON: wifi, cafe, toilet, etc)
created_at
```

---

#### 12. **promotions** - Système de promotions
```sql
promotion_id (UUID)
operator_id (VARCHAR FK)
trip_id (VARCHAR FK, nullable)  -- NULL = pour tous les trajets
discount_type (PERCENTAGE, FIXED_AMOUNT)
discount_value (DECIMAL)
start_date (DATE)
end_date (DATE)
max_uses (INTEGER, nullable)
uses_count (INTEGER)
status (ACTIVE, EXPIRED, CANCELLED)
created_at
```

---

### Relations de Clés Étrangères

```
users
  ├── bookings (user_id)
  ├── tickets (user_id)
  ├── payments (user_id)
  ├── reviews (user_id)
  └── notifications (user_id)

operators
  ├── trips (operator_id)
  ├── reviews (operator_id) [avg rating]
  ├── stories (operator_id)
  ├── advertisements (operator_id, nullable)
  └── promotions (operator_id)

trips
  ├── bookings (trip_id)
  ├── tickets (trip_id)
  ├── reviews (trip_id, nullable)
  ├── promotions (trip_id)
  └── notifications [metadata.trip_id]

bookings
  ├── payments (booking_id)
  ├── tickets (booking_id)
  └── notifications [metadata.booking_id]
```

---

## 🔌 Endpoints API Requis

### Authentification

#### 1. POST `/api/auth/register`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "secured_password",
  "full_name": "Jean Dupont",
  "phone_number": "+226 70000000",
  "preferred_language": "fr"
}
```

**Response (200):**
```json
{
  "user_id": "uuid-1234",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 86400
}
```

**Validations:**
- Email doit être unique
- Phone doit être unique
- Password ≥ 8 caractères
- Email format validation

**Errors:**
- 400: Email ou phone existe déjà
- 422: Validation failed

---

#### 2. POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "secured_password"
}
```

**Response (200):**
```json
{
  "user_id": "uuid-1234",
  "name": "Jean Dupont",
  "email": "user@example.com",
  "phone": "+226 70000000",
  "role": "USER",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 86400
}
```

**Errors:**
- 401: Email ou password incorrect
- 403: Compte désactivé

---

#### 3. POST `/api/auth/refresh-token`
**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 86400
}
```

**Errors:**
- 401: Token invalide ou expiré

---

### Trajets (Trips)

#### 4. GET `/api/trips?from=&to=&date=&passengers=`
**Query Parameters:**
```
from: stop_id (ex: OUAGA_CENTRE)
to: stop_id (ex: BOBO_CENTRE)
date: YYYY-MM-DD
passengers: number (1-10)
```

**Response (200):**
```json
{
  "trips": [
    {
      "trip_id": "TRIP_001",
      "operator_id": "OP_001",
      "operator_name": "FasoAir",
      "from_stop_name": "Ouagadougou",
      "to_stop_name": "Bobo",
      "departure_time": "2025-12-01T08:00:00Z",
      "arrival_time": "2025-12-01T11:30:00Z",
      "available_seats": 12,
      "base_price": 25000,
      "promoted_price": 20000,
      "discount_percentage": 20
    }
  ],
  "count": 5
}
```

**Validations:**
- from et to doivent exister dans stations
- date >= today
- passengers >= 1

**Performance:**
- Index sur (from_stop_id, to_stop_id, departure_time)
- Cacher 1h minimum

---

#### 5. GET `/api/trips/{tripId}`
**Response (200):**
```json
{
  "trip_id": "TRIP_001",
  "operator_id": "OP_001",
  "operator_name": "FasoAir",
  "from_stop": {
    "stop_id": "OUAGA_CENTRE",
    "name": "Ouagadougou Centre",
    "address": "Rue 123, Ouaga"
  },
  "to_stop": {
    "stop_id": "BOBO_CENTRE",
    "name": "Bobo Centre",
    "address": "Rue 456, Bobo"
  },
  "departure_time": "2025-12-01T08:00:00Z",
  "arrival_time": "2025-12-01T11:30:00Z",
  "status": "EMBARKED",
  "vehicle": {
    "vehicle_id": "VEH_001",
    "registration": "BF-2025-001",
    "type": "MINIBUS"
  },
  "amenities": ["wifi", "ac", "toilet"],
  "segments": [
    {
      "segment_id": "SEG_001",
      "from_stop_name": "Ouagadougou",
      "to_stop_name": "Koudougou",
      "available_seats": 12
    }
  ],
  "total_seats": 14,
  "available_seats": 12,
  "base_price": 25000,
  "promoted_price": 20000
}
```

---

#### 6. GET `/api/trips/{tripId}/seats`
**Response (200):**
```json
{
  "trip_id": "TRIP_001",
  "vehicle_layout": {
    "rows": 7,
    "columns": 2,
    "seats": [
      {
        "seat_number": "1A",
        "status": "available",
        "price": 25000
      },
      {
        "seat_number": "1B",
        "status": "hold",
        "hold_expires_at": "2025-11-30T10:15:00Z"
      }
    ]
  }
}
```

**Statut possible:** `available`, `hold`, `paid`, `offline_reserved`

---

### Réservations (Bookings)

#### 7. POST `/api/bookings`
**Request:**
```json
{
  "trip_id": "TRIP_001",
  "seat_numbers": ["1A", "1B"],
  "passenger_name": "Jean Dupont",
  "passenger_phone": "+226 70000000",
  "passenger_email": "jean@example.com"
}
```

**Response (201):**
```json
{
  "booking_id": "BK_UUID",
  "trip_id": "TRIP_001",
  "status": "HOLD",
  "seat_numbers": ["1A", "1B"],
  "hold_expires_at": "2025-11-30T10:15:00Z",
  "total_price": 50000,
  "currency": "XOF"
}
```

**Logique:**
1. Vérifier sièges disponibles
2. Créer booking avec status=HOLD
3. Marquer sièges avec status=hold
4. Créer job pour auto-annuler à hold_expires_at

**Errors:**
- 409: Siège non disponible
- 400: Données invalides

---

#### 8. POST `/api/bookings/{bookingId}/confirm`
**Request:**
```json
{
  "payment_method": "ORANGE_MONEY"
}
```

**Response (200):**
```json
{
  "booking_id": "BK_UUID",
  "status": "CONFIRMED",
  "payment_url": "https://api.orange.com/pay?token=XYZ"
}
```

**Logique:**
1. Vérifier booking est HOLD
2. Vérifier hold pas expiré
3. Mettre status=CONFIRMED
4. Créer payment entry avec status=INITIATED
5. Retourner URL de paiement (selon payment_method)

---

### Paiements (Payments)

#### 9. POST `/api/payments`
**Request:**
```json
{
  "booking_id": "BK_UUID",
  "amount": 50000,
  "currency": "XOF",
  "method": "ORANGE_MONEY",
  "phone_number": "+226 70000000"
}
```

**Response (200):**
```json
{
  "payment_id": "PAY_UUID",
  "provider_redirect_url": "https://api.orange.com/authorize",
  "expires_in": 900
}
```

---

#### 10. POST `/api/payments/webhook` (Orange/Moov)
**Request (from provider):**
```json
{
  "transaction_id": "TXN_12345",
  "booking_id": "BK_UUID",
  "status": "SUCCESS",
  "amount": 50000,
  "timestamp": "2025-11-30T10:00:00Z"
}
```

**Logique:**
1. Vérifier signature webhook
2. Si SUCCESS:
   - UPDATE payments SET status='COMPLETED'
   - UPDATE bookings SET status='PAID'
   - CREATE tickets pour chaque siège
   - INSERT notification type='BOOKING_CONFIRMED'
3. Si FAILED:
   - UPDATE payments SET status='FAILED'
   - UPDATE bookings SET status='CANCELLED'
   - Libérer sièges

**Response (200):**
```json
{
  "acknowledged": true
}
```

---

#### 11. POST `/api/payments/{paymentId}/refund`
**Request:**
```json
{
  "reason": "USER_REQUESTED"
}
```

**Response (200):**
```json
{
  "refund_id": "REF_UUID",
  "status": "INITIATED",
  "amount": 50000
}
```

---

### Billets (Tickets)

#### 12. GET `/api/tickets`
**Headers:** Authorization: Bearer {token}

**Query Parameters:**
```
status: ACTIVE|EMBARKED|COMPLETED|TRANSFERRED|CANCELLED
trip_id: optional filter
```

**Response (200):**
```json
{
  "tickets": [
    {
      "ticket_id": "TK_QR123456_A1B2C3",
      "booking_id": "BK_UUID",
      "trip_id": "TRIP_001",
      "operator_name": "FasoAir",
      "from_stop_name": "Ouagadougou",
      "to_stop_name": "Bobo",
      "seat_number": "1A",
      "departure_time": "2025-12-01T08:00:00Z",
      "qr_code": "https://chart.googleapis.com/chart?chs=300x300&chld=M|0&cht=qr&chl=...",
      "barcode": "TK123456A1B2C3",
      "status": "ACTIVE",
      "created_at": "2025-11-30T10:00:00Z"
    }
  ]
}
```

---

#### 13. GET `/api/tickets/{ticketId}`
**Response (200):** (même structure que 12)

---

#### 14. POST `/api/tickets/{ticketId}/transfer`
**Request:**
```json
{
  "recipient_phone": "+226 70111111"
}
```

**Response (200):**
```json
{
  "transfer_token": "XFER_ABC123XYZ",
  "expires_at": "2025-12-01T08:00:00Z",
  "recipient_phone": "+226 70111111"
}
```

**Logique:**
1. Vérifier ticket est ACTIVE
2. Générer transfer_token unique
3. Créer notification pour destinataire (SMS + notification app)
4. Mettre status=TRANSFERRED
5. Token valide 24h

---

#### 15. DELETE `/api/tickets/{ticketId}`
**Query Parameter:**
```
reason: USER_REQUESTED|TRIP_CANCELLED|OTHER
```

**Response (200):**
```json
{
  "ticket_id": "TK_QR123456",
  "status": "CANCELLED",
  "refund_amount": 25000,
  "refund_status": "INITIATED"
}
```

**Validations:**
- Annulation possible ≤ 1h avant départ
- Générer refund
- Notifier utilisateur

---

### Opérateurs (Operators)

#### 16. GET `/api/operators`
**Query Parameters:**
```
search: name filter
sort_by: rating|name|founded_year (default: rating)
limit: 20
offset: 0
```

**Response (200):**
```json
{
  "operators": [
    {
      "operator_id": "OP_001",
      "name": "FasoAir",
      "logo_url": "https://...",
      "rating": 4.5,
      "total_reviews": 128,
      "description": "Meilleure compagnie",
      "phone_number": "+226 70000000",
      "website_url": "https://fasoair.bf",
      "amenities": ["wifi", "ac", "toilet"],
      "baggage_price": 5000
    }
  ],
  "count": 45,
  "total": 45
}
```

**Important:** Trier par `rating DESC` par défaut

---

#### 17. GET `/api/operators/{operatorId}`
**Response (200):**
```json
{
  "operator_id": "OP_001",
  "name": "FasoAir",
  "logo_url": "https://...",
  "rating": 4.5,
  "total_reviews": 128,
  "description": "Meilleure compagnie du Burkina",
  "phone_number": "+226 70000000",
  "email": "contact@fasoair.bf",
  "website_url": "https://fasoair.bf",
  "founded_year": 2015,
  "fleet_size": 25,
  "total_trips": 1250,
  "amenities": ["wifi", "ac", "toilet", "usb"],
  "policies": [
    {
      "policy_id": "POL_001",
      "type": "CANCELLATION",
      "title": "Annulation gratuite",
      "description": "Annulation gratuite jusqu'à 2h avant le départ"
    }
  ],
  "reviews": [
    {
      "review_id": "REV_001",
      "rating": 5,
      "comment": "Excellent service!",
      "author": "Anonymous",
      "created_at": "2025-11-28T10:00:00Z"
    }
  ]
}
```

---

#### 18. GET `/api/operators/{operatorId}/stories`
**Response (200):**
```json
{
  "stories": [
    {
      "story_id": "STORY_001",
      "title": "Promotion spéciale!",
      "description": "20% de réduction ce weekend",
      "emoji": "🎉",
      "gradient": "from-red-500 to-amber-500",
      "category": "PROMO",
      "is_active": true,
      "priority": 1,
      "created_at": "2025-11-28T10:00:00Z",
      "expires_at": "2025-12-05T00:00:00Z"
    }
  ]
}
```

---

#### 19. POST `/api/operators/{operatorId}/stories/{storyId}/view`
**Request:** (empty body)

**Response (204):** No content

**Logique:**
- Incrémenter view count
- Tracker user engagement

---

### Stations (Stops)

#### 20. GET `/api/stations`
**Response (200):**
```json
{
  "stations": [
    {
      "stop_id": "OUAGA_CENTRE",
      "name": "Ouagadougou Centre",
      "city": "Ouagadougou",
      "latitude": 12.3714,
      "longitude": -1.5197,
      "address": "Rue de la Liberté, Ouaga",
      "phone": "+226 70000000",
      "facilities": ["wifi", "cafe", "toilet"],
      "operating_hours": "05:00-22:00"
    }
  ]
}
```

---

#### 21. GET `/api/stations/nearby?lat=&lon=&radius=`
**Query Parameters:**
```
lat: latitude
lon: longitude
radius: km (default: 10)
```

**Response (200):**
```json
{
  "stations": [
    {
      "stop_id": "OUAGA_CENTRE",
      "name": "Ouagadougou Centre",
      "distance_km": 2.5,
      "latitude": 12.3714,
      "longitude": -1.5197
    }
  ]
}
```

**Performance:** Utiliser PostGIS si possible

---

### Notifications

#### 22. GET `/api/notifications`
**Headers:** Authorization: Bearer {token}

**Query Parameters:**
```
unread_only: boolean (default: false)
type: BOOKING_CONFIRMED|TRIP_REMINDER|etc
limit: 20
offset: 0
```

**Response (200):**
```json
{
  "notifications": [
    {
      "notification_id": "NOTIF_001",
      "type": "BOOKING_CONFIRMED",
      "title": "Réservation confirmée",
      "message": "Votre trajet FasoAir est confirmé pour demain",
      "image_url": "https://...",
      "is_read": false,
      "deep_link": "faso-travel://tickets/TK_123",
      "metadata": {
        "trip_id": "TRIP_001",
        "operator_id": "OP_001",
        "ticket_id": "TK_123"
      },
      "created_at": "2025-11-30T10:00:00Z"
    }
  ],
  "unread_count": 3
}
```

---

#### 23. PATCH `/api/notifications/{notificationId}/read`
**Request:** (empty body)

**Response (200):**
```json
{
  "notification_id": "NOTIF_001",
  "is_read": true
}
```

---

#### 24. DELETE `/api/notifications/{notificationId}`
**Response (204):** No content

---

### Avis et Reviews

#### 25. POST `/api/reviews`
**Headers:** Authorization: Bearer {token}

**Request:**
```json
{
  "trip_id": "TRIP_001",
  "operator_id": "OP_001",
  "rating": 4,
  "title": "Bon voyage",
  "comment": "Service excellent, chauffeur courtois. Juste climatisation un peu froide.",
  "aspects": {
    "cleanliness": 5,
    "comfort": 4,
    "timing": 5,
    "driver_behaviour": 5,
    "value_for_money": 4
  }
}
```

**Response (201):**
```json
{
  "review_id": "REV_UUID",
  "status": "PENDING",
  "created_at": "2025-11-30T10:00:00Z",
  "note": "Votre avis sera approuvé par un modérateur avant publication"
}
```

**Validations:**
- user_id doit avoir complété ce trip
- rating 1-5
- comment ≥ 10 caractères
- Un seul avis par trip/user

---

#### 26. GET `/api/reviews?operator_id=&status=`
**Query Parameters:**
```
operator_id: required
status: APPROVED|PENDING|REJECTED (default: APPROVED)
limit: 20
offset: 0
```

**Response (200):**
```json
{
  "reviews": [
    {
      "review_id": "REV_001",
      "rating": 5,
      "comment": "Excellent!",
      "author": "Anonymous",
      "aspects": {...},
      "helpful_count": 12,
      "unhelpful_count": 2,
      "created_at": "2025-11-28T10:00:00Z"
    }
  ],
  "count": 128
}
```

---

### Publicités (Advertisements)

#### 27. GET `/api/advertisements?placement=&limit=`
**Query Parameters:**
```
placement: SEARCH_RESULTS|TICKET_LIST|OPERATOR_PROFILE|HOME_FEED
limit: 1-5 (default: 3)
```

**Response (200):**
```json
{
  "advertisements": [
    {
      "ad_id": "AD_001",
      "title": "Promo spéciale",
      "image_url": "https://...",
      "destination_url": "https://example.com",
      "priority": 1
    }
  ]
}
```

---

#### 28. POST `/api/advertisements/{adId}/impression`
**Request:** (empty body)

**Response (204):** No content

**Logique:**
- Incrémenter impressions_today
- Tracker pour analytics

---

#### 29. POST `/api/advertisements/{adId}/click`
**Request:** (empty body)

**Response (204):** No content

**Logique:**
- Incrémenter clicks_today
- Rediriger vers destination_url

---

### Incidents & Nearby

#### 30. POST `/api/incidents`
**Headers:** Authorization: Bearer {token}

**Request:**
```json
{
  "trip_id": "TRIP_001",
  "description": "Climatisation en panne",
  "latitude": 12.3714,
  "longitude": -1.5197,
  "timestamp": "2025-11-30T10:00:00Z"
}
```

**Response (201):**
```json
{
  "incident_id": "INC_UUID",
  "status": "REPORTED",
  "created_at": "2025-11-30T10:00:00Z"
}
```

**Logique:**
1. Vérifier user est embarqué sur ce trip
2. Créer incident
3. Notifier driver + support
4. Créer ticket support

---

#### 31. POST `/api/share-location`
**Headers:** Authorization: Bearer {token}

**Request:**
```json
{
  "trip_id": "TRIP_001",
  "latitude": 12.3714,
  "longitude": -1.5197,
  "timestamp": "2025-11-30T10:00:00Z"
}
```

**Response (200):**
```json
{
  "share_token": "SHARE_ABC123",
  "expires_at": "2025-11-30T11:00:00Z",
  "share_url": "https://fasotravel.bf/track/SHARE_ABC123"
}
```

---

### Support

#### 32. POST `/api/support/messages`
**Headers:** Authorization: Bearer {token}

**Request:**
```json
{
  "email": "user@example.com",
  "message": "J'ai un problème avec mon billet",
  "ticket_id": "TK_123", // optional
  "attachment_urls": ["https://..."] // optional
}
```

**Response (201):**
```json
{
  "support_ticket_id": "SUP_UUID",
  "status": "OPEN",
  "created_at": "2025-11-30T10:00:00Z"
}
```

---

### Admin (Optionnel pour MVP)

#### 33. POST `/api/admin/reviews/{reviewId}/approve`
**Headers:** Authorization: Bearer {admin-token}

**Request:** (empty body)

**Response (200):**
```json
{
  "review_id": "REV_001",
  "status": "APPROVED"
}
```

**Trigger:** Quand status=APPROVED, recalculer operator.rating

---

#### 34. POST `/api/admin/stories`
**Headers:** Authorization: Bearer {admin-token}

**Request:**
```json
{
  "operator_id": "OP_001",
  "title": "Nouvelle route",
  "description": "FasoAir lance une nouvelle route",
  "emoji": "✨",
  "category": "ANNOUNCEMENT",
  "expires_at": "2025-12-05T00:00:00Z"
}
```

**Response (201):**
```json
{
  "story_id": "STORY_UUID",
  "created_at": "2025-11-30T10:00:00Z"
}
```

---

## 🔄 Flows Applicatifs Détaillés

### Flow 1: Réservation Complète

```
┌─ Frontend ─────────────────────────────────────────┐
│                                                     │
│ 1. User recherche trajet                          │
│    GET /api/trips?from=&to=&date=                 │
│    ✓ Reçoit liste trajets avec prix               │
│                                                     │
│ 2. User clique sur un trajet                      │
│    GET /api/trips/{tripId}                        │
│    GET /api/trips/{tripId}/seats                  │
│    ✓ Affiche détails + plan de sièges             │
│                                                     │
│ 3. User sélectionne sièges                        │
│    POST /api/bookings                             │
│    {                                               │
│      trip_id: "TRIP_001",                         │
│      seat_numbers: ["1A", "1B"],                  │
│      passenger_name: "Jean",                      │
│      passenger_phone: "+226 70000000"             │
│    }                                               │
│    ✓ booking status = HOLD (10 min TTL)           │
│                                                     │
│ 4. User confirme et paye                          │
│    POST /api/bookings/{bookingId}/confirm         │
│    ✓ booking status = CONFIRMED                   │
│    ✓ Affiche formulaire paiement                  │
│                                                     │
│    POST /api/payments                             │
│    ✓ Rediriger vers Orange Money                  │
│                                                     │
└────────────────────┬─────────────────────────────┘
                     │
                     │ SMS/Email utilisateur
                     │
┌─ Backend ─────────────────────────────────────────┐
│                                                     │
│ 5. Orange Money callback → POST /payments/webhook │
│    ✓ payment status = COMPLETED                   │
│    ✓ booking status = PAID                        │
│    ✓ CREATE tickets                               │
│                                                     │
│ 6. Notification créée                             │
│    INSERT notification                            │
│    type = 'BOOKING_CONFIRMED'                     │
│    ✓ Envoyer SMS + notification app               │
│                                                     │
│ 7. Jour du trajet                                 │
│    Booking.departure_time < now                   │
│    ✓ booking status = EMBARKED                    │
│    ✓ tickets status = EMBARKED                    │
│                                                     │
└────────────────────────────────────────────────────┘

┌─ Frontend (Day of trip) ────────────────────────┐
│                                                 │
│ 8. User voit "Embarked" status                 │
│    GET /api/tickets/{ticketId}                 │
│    ✓ Affiche QR code pour scanner              │
│                                                 │
└────────────────────────────────────────────────┘

┌─ Backend (After arrival) ───────────────────────┐
│                                                 │
│ 9. Trip arrive                                 │
│    trip.arrival_time < now                     │
│    ✓ trips status = ARRIVED                    │
│    ✓ INSERT notification                       │
│      type = 'TRIP_COMPLETED'                   │
│    ✓ INSERT notification                       │
│      type = 'TRIP_COMPLETED_RATING' (10s après)│
│                                                 │
└────────────────────────────────────────────────┘

┌─ Frontend (Rating) ────────────────────────────┐
│                                                 │
│ 10. User clique notification TRIP_COMPLETED   │
│     Navigate to RatingReviewPage                │
│     ✓ Affiche form pour noter                 │
│                                                 │
│ 11. User soumet avis                           │
│     POST /api/reviews                          │
│     ✓ review status = PENDING (modération)     │
│                                                 │
└────────────────────────────────────────────────┘

┌─ Backend (Admin) ──────────────────────────────┐
│                                                 │
│ 12. Admin approuve avis                        │
│     PATCH /api/admin/reviews/{id}/approve      │
│     ✓ review status = APPROVED                 │
│     ✓ UPDATE operators SET rating = ...        │
│                                                 │
└────────────────────────────────────────────────┘
```

---

### Flow 2: Système de Notification

```
Event triggers:
├─ booking.status = PAID
│  └─ INSERT notification type='BOOKING_CONFIRMED'
│     └─ title: "Réservation confirmée"
│     └─ Envoyer SMS
│
├─ trip.arrival_time < now
│  ├─ trips.status = ARRIVED
│  └─ INSERT notification type='TRIP_COMPLETED'
│     ├─ title: "Voyage terminé"
│     ├─ Lien vers rating page
│     ├─ Envoyer SMS
│     └─ 10 secondes après:
│        └─ INSERT notification type='TRIP_COMPLETED_RATING'
│           └─ title: "Évaluez votre voyage"
│
├─ promotion.status = ACTIVE
│  └─ INSERT notification type='PROMO'
│     └─ Ciblé users de routes similaires
│
└─ operator.status change
   └─ INSERT notification type='OPERATOR_UPDATE'
      └─ Utilisateurs qui ont voyagé avec
```

---

### Flow 3: Système de Ratings & Reviews

```
Frontend:
1. User voit notification TRIP_COMPLETED_RATING
2. Clique → Navigate to RatingReviewPage
3. Select rating (1-5 étoiles)
4. Select aspect ratings (cleanliness, comfort, etc)
5. Écrit commentaire (min 10 chars)
6. POST /api/reviews
   {
     trip_id, operator_id, rating, comment, aspects
   }

Backend:
7. Validate:
   - user.id == trip.booked_by
   - comment.length >= 10
   - rating in [1, 2, 3, 4, 5]

8. Create review
   status = 'PENDING'  (pas visible immédiatement)

9. Admin dashboard:
   - Liste des reviews PENDING
   - Admin clicks "Approve" ou "Reject"

10. If APPROVED:
    - UPDATE reviews SET status='APPROVED'
    - TRIGGER: Recalculer operator.rating
      rating = AVG(rating) WHERE status='APPROVED'
    - Notification au user: "Votre avis a été approuvé"

11. Frontend affiche avis:
    GET /api/reviews?operator_id=OP_001&status=APPROVED
    - Affiche sur OperatorDetailPage
    - Note moyenne en haut
    - Todos les avis approuvés
```

---

## 📊 Triggers & Automations SQL

### Trigger 1: Auto-calculer operator rating

```sql
CREATE OR REPLACE TRIGGER update_operator_rating
AFTER UPDATE OR INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION recalculate_operator_rating();

CREATE OR REPLACE FUNCTION recalculate_operator_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE operators
  SET rating = (
    SELECT AVG(rating)
    FROM reviews
    WHERE operator_id = NEW.operator_id
    AND status = 'APPROVED'
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews
    WHERE operator_id = NEW.operator_id
    AND status = 'APPROVED'
  )
  WHERE operator_id = NEW.operator_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Trigger 2: Auto-expirer les HOLD bookings

```sql
-- Job scheduler (Cron or Bull queue)
-- Exécuter toutes les minutes:

UPDATE bookings
SET status = 'CANCELLED'
WHERE status = 'HOLD'
AND hold_expires_at < NOW();

-- Libérer les sièges correspondants:
UPDATE trips
SET available_seats = available_seats + (
  SELECT COUNT(*)
  FROM bookings b
  WHERE b.trip_id = trips.trip_id
  AND b.status = 'CANCELLED'
  AND b.updated_at > NOW() - INTERVAL '1 minute'
)
WHERE status IN ('ACTIVE', 'EMBARKED');
```

---

### Trigger 3: Créer tickets après paiement réussi

```sql
CREATE OR REPLACE FUNCTION create_tickets_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    -- Insérer un ticket pour chaque siège
    INSERT INTO tickets (
      booking_id, user_id, trip_id, operator_id,
      seat_number, qr_code, barcode, status
    )
    SELECT
      b.booking_id,
      b.user_id,
      b.trip_id,
      t.operator_id,
      seat_num,
      generate_qr_code(...),
      generate_barcode(...),
      'ACTIVE'
    FROM bookings b
    CROSS JOIN jsonb_array_elements_text(b.seat_numbers) AS seat_num
    JOIN trips t ON b.trip_id = t.trip_id
    WHERE b.booking_id = (
      SELECT booking_id FROM payments WHERE payment_id = NEW.payment_id
    );
    
    -- Créer notification
    INSERT INTO notifications (
      user_id, type, title, message, metadata
    ) VALUES (
      NEW.user_id,
      'BOOKING_CONFIRMED',
      'Réservation confirmée',
      'Vos billets sont prêts',
      jsonb_build_object(
        'trip_id', (SELECT trip_id FROM bookings WHERE booking_id = ...)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Trigger 4: Créer notification quand trajet arrive

```sql
-- Job scheduler (exécuter toutes les 5 min):

INSERT INTO notifications (user_id, type, title, message, metadata)
SELECT
  t.user_id,
  'TRIP_COMPLETED',
  'Voyage terminé',
  'Votre voyage de ' || s1.name || ' à ' || s2.name || ' est complété',
  jsonb_build_object(
    'trip_id', tr.trip_id,
    'operator_id', tr.operator_id,
    'ticket_id', t.ticket_id
  )
FROM tickets t
JOIN trips tr ON t.trip_id = tr.trip_id
JOIN stations s1 ON tr.from_stop_id = s1.stop_id
JOIN stations s2 ON tr.to_stop_id = s2.stop_id
WHERE t.status = 'EMBARKED'
AND tr.status = 'ARRIVED'
AND NOT EXISTS (
  SELECT 1 FROM notifications
  WHERE user_id = t.user_id
  AND type = 'TRIP_COMPLETED'
  AND metadata->>'trip_id' = tr.trip_id
);

-- 10 secondes après, créer notification pour rating:
INSERT INTO notifications (user_id, type, title, message, metadata)
SELECT
  user_id,
  'TRIP_COMPLETED_RATING',
  'Évaluez votre voyage',
  'Aidez-nous à améliorer nos services',
  metadata
FROM notifications
WHERE type = 'TRIP_COMPLETED'
AND created_at > NOW() - INTERVAL '10 seconds';
```

---

## 🔐 Authentification & Sécurité

### JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Management

```typescript
// Frontend (lib/api.ts)
const getToken = () => {
  return localStorage.getItem('auth_token');
};

const setToken = (token) => {
  localStorage.setItem('auth_token', token);
};

// Header ALL protected requests:
headers: {
  'Authorization': `Bearer ${getToken()}`
}
```

---

## 💾 Données Initiales à Charger

### 1. Stations (50+ gares)
```sql
-- Fichier: seeds/stations.sql
INSERT INTO stations (stop_id, name, city, latitude, longitude, ...)
VALUES
  ('OUAGA_CENTRE', 'Ouagadougou Centre', 'Ouagadougou', 12.3714, -1.5197, ...),
  ('BOBO_CENTRE', 'Bobo Dioulasso Centre', 'Bobo', 12.6543, -4.2842, ...),
  ('KOUDOUGOU_STATION', 'Koudougou Gare', 'Koudougou', 12.2468, -2.6389, ...),
  ...
```

### 2. Operateurs (10-20)
```sql
INSERT INTO operators (operator_id, name, description, rating, ...)
VALUES
  ('OP_001', 'FasoAir', 'Premium transport', 4.5, ...),
  ('OP_002', 'TransBus', 'Budget option', 3.8, ...),
  ...
```

### 3. Routes Populaires (20-30)
```sql
INSERT INTO trips (trip_id, operator_id, from_stop_id, to_stop_id, ...)
VALUES
  ('TRIP_001', 'OP_001', 'OUAGA_CENTRE', 'BOBO_CENTRE', ...),
  ...
```

---

## ✅ Considérations Importantes

### Performance

1. **Caching:**
   - GET /trips: Cache 1h
   - GET /operators: Cache 24h
   - GET /stations: Cache 7j (ou invalidate on change)

2. **Database Indexes:**
   - (from_stop_id, to_stop_id, departure_time DESC)
   - (operator_id, rating DESC)
   - (user_id, created_at DESC)
   - (trip_id)

3. **Pagination:**
   - Tous les GET list doivent avoir limit + offset
   - Default limit: 20

### Error Handling

```typescript
// Standard error responses:
400 Bad Request: { error: "Invalid input", details: {...} }
401 Unauthorized: { error: "Token missing or invalid" }
403 Forbidden: { error: "No permission" }
404 Not Found: { error: "Resource not found" }
409 Conflict: { error: "Booking already exists" }
422 Unprocessable: { error: "Validation failed", fields: {...} }
500 Server Error: { error: "Internal server error" }
```

### Webhooks Sécurité

```typescript
// Vérifier signature (HMAC):
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature) {
  const computed = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computed)
  );
}
```

### Rate Limiting

```typescript
// Implémenter rate limiting par user:
- 100 requests/minute pour API public
- 10 requests/minute pour POST (réservations)
- 1000 requests/hour pour recherche
```

### CORS Configuration

```typescript
// Backend:
app.use(cors({
  origin: [
    'https://fasotravel.bf',
    'https://www.fasotravel.bf',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 📱 Push Notifications & SMS

### Types à implémenter:

1. **SMS:**
   - Booking confirmé
   - Reminder 1h avant départ
   - Trip completed
   - Support response

2. **Push Notifications:**
   - Toutes les notifications
   - Avec deep linking vers les pages correspondantes

3. **Email:**
   - Welcome email
   - Booking confirmation
   - Receipt/Invoice

---

## 🚀 Ordre d'implémentation Recommandé

```
PHASE 1 - Foundation (1-2 weeks)
├─ Auth (register/login)
├─ Trips search
├─ Stations CRUD
├─ Operators list

PHASE 2 - Core Booking (2-3 weeks)
├─ Bookings HOLD/CONFIRM
├─ Payments + webhooks
├─ Tickets CRUD
├─ Notifications basic

PHASE 3 - Features (1-2 weeks)
├─ Reviews & ratings
├─ Stories
├─ Incidents reporting
├─ Share location

PHASE 4 - Admin & Polish (1 week)
├─ Admin dashboard
├─ Review moderation
├─ Analytics
├─ Optimizations
```

---

## 📞 Support & Documentation

### Frontend Documentation
- `/src/README.md` - Vue d'ensemble
- `/src/ARCHITECTURE_CODE_COMPLETE.md` - Architecture détaillée
- `/src/lib/api.ts` - Tous les types API
- `/src/data/models.ts` - Modèles de données

### Backend Examples
- `/backend-examples/*.js` - Exemples Express.js
- `/migrations/*.sql` - Schémas SQL

### Contact
- Slack/Email pour questions
- Weekly sync calls

---

**Document Version:** 1.0  
**Last Updated:** 30 Nov 2025  
**Frontend Status:** ✅ Complete  
**Backend Status:** ⏳ Ready to implement
