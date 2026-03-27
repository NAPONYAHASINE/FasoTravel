# 🏗️ FasoTravel — Blueprint Complet du Backend

**Date:** Juin 2025  
**Version:** 1.0  
**Statut:** Document de construction — à suivre étape par étape

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture](#2-architecture)
3. [Stack Technique](#3-stack-technique)
4. [Structure du Projet NestJS](#4-structure-du-projet-nestjs)
5. [Base de Données — Schéma Complet](#5-base-de-données--schéma-complet)
6. [API Endpoints — Référence Complète](#6-api-endpoints--référence-complète)
7. [Authentification & Sécurité](#7-authentification--sécurité)
8. [Paiements — PaydunYa](#8-paiements--paydunya)
9. [Notifications — Email, FCM, WhatsApp](#9-notifications--email-fcm-whatsapp)
10. [Stockage Fichiers — AWS S3](#10-stockage-fichiers--aws-s3)
11. [Types Canoniques & Conventions](#11-types-canoniques--conventions)
12. [Audit du Frontend — Problèmes à Résoudre](#12-audit-du-frontend--problèmes-à-résoudre)
13. [Plan d'Implémentation](#13-plan-dimplémentation)
14. [Déploiement & Infrastructure](#14-déploiement--infrastructure)
15. [Variables d'Environnement](#15-variables-denvironnement)

---

## 1. Vue d'Ensemble

FasoTravel est une plateforme de réservation de transport routier au Burkina Faso, composée de :

| App | Port Dev | Rôle | Utilisateurs |
|-----|----------|------|----------|
| **Mobile** | :3000 | App passager (Capacitor) | Voyageurs |
| **Admin** | :3002 | Dashboard administration | Admins FasoTravel |
| **Societe** | :3001 | App société de transport | Opérateurs, caissiers, managers |
| **Backend** | :3000/api | API NestJS (À CONSTRUIRE) | Toutes les apps |

### Flux Principal
```
Passager cherche trajet → Sélectionne → Réserve siège (HOLD 10 min)
→ Paye (PaydunYa: OrangeMoney/MoovMoney/Wave/Carte)
→ Reçoit billet (QR code + code alphanumérique)
→ Présente au caissier en gare → Embarquement → Trajet → Arrivée
```

### Fonctionnalités Clés
- Recherche de trajets multi-segments (escales intermédiaires)
- Réservation temps réel avec hold de sièges (10 min TTL)
- Paiement mobile money (PaydunYa gateway)
- QR code + code alphanumérique par billet
- Système de parrainage avec coupons
- Stories Instagram-style par opérateur
- Publicités interstitielles ciblées
- Suivi GPS temps réel des véhicules
- Support et incidents
- Notifications multi-canal (push, SMS/WhatsApp, email)

---

## 2. Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Mobile    │  │   Admin     │  │   Societe   │
│  (Capacitor)│  │  (Web SPA)  │  │  (Web SPA)  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │ HTTPS / JWT
                        ▼
              ┌──────────────────┐
              │   NestJS API     │
              │   (Backend)      │
              ├──────────────────┤
              │ Guards (Auth)    │
              │ Interceptors     │
              │ Pipes (Validation│
              └────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │PostgreSQL│ │  Redis   │ │ AWS S3   │
   │ (Data)   │ │ (Cache/  │ │(Fichiers)│
   │          │ │  Sessions│ │          │
   └──────────┘ │  GPS)    │ └──────────┘
                └──────────┘
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │PaydunYa  │ │ Infobip  │ │Firebase  │
   │(Paiement)│ │(WhatsApp)│ │ (FCM)    │
   └──────────┘ └──────────┘ └──────────┘
```

---

## 3. Stack Technique

| Composant | Technologie | Raison |
|-----------|------------|--------|
| **Framework** | NestJS (TypeScript) | Cohérent avec frontend TS, modules, injection de dépendances |
| **ORM** | TypeORM ou Prisma | TypeORM recommandé (NestJS natif, decorators) |
| **Base de données** | PostgreSQL 14+ | JSONB, arrays, GIN indexes, fonctions, triggers |
| **Cache/Sessions** | Redis | Sessions JWT, cache trips, GPS temps réel |
| **Validation** | class-validator + class-transformer | Decorators, pipes NestJS |
| **Auth** | Passport.js + JWT | Multi-guard (Passenger, Admin, Operator) |
| **Paiement** | PaydunYa SDK | Orange Money, Moov Money, Wave, Carte |
| **WhatsApp/SMS** | Infobip API | OTP + notifications transactionnelles |
| **Push** | Firebase Admin SDK | FCM pour Mobile (Capacitor) |
| **Email** | SendGrid ou Mailgun | Emails transactionnels et campagnes |
| **Stockage** | AWS S3 + CloudFront | Images, médias, fichiers uploadés |
| **Hébergement** | AWS Lightsail | VPS économique, prévisible |
| **Monitoring** | Winston + Morgan | Logs structurés, audit trail |
| **Docs API** | Swagger (@nestjs/swagger) | Documentation auto-générée |

---

## 4. Structure du Projet NestJS

```
backend/
├── src/
│   ├── main.ts                          # Bootstrap + Swagger
│   ├── app.module.ts                    # Module racine
│   │
│   ├── common/                          # Partagé
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts       # @Roles('ADMIN', 'PASSENGER')
│   │   │   ├── current-user.decorator.ts # @CurrentUser()
│   │   │   └── public.decorator.ts      # @Public() skip auth
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── throttle.guard.ts
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts # Wrap { success, data, timestamp }
│   │   │   ├── logging.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts        # page, limit, sort, order
│   │   └── types/
│   │       └── standardized.ts          # ← COPIE de shared/types/standardized.ts
│   │
│   ├── config/                          # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   ├── aws.config.ts
│   │   ├── paydunya.config.ts
│   │   ├── infobip.config.ts
│   │   └── firebase.config.ts
│   │
│   ├── database/                        # TypeORM
│   │   ├── entities/                    # Entités (1 par table)
│   │   │   ├── user.entity.ts
│   │   │   ├── operator.entity.ts
│   │   │   ├── station.entity.ts
│   │   │   ├── vehicle.entity.ts
│   │   │   ├── trip.entity.ts
│   │   │   ├── segment.entity.ts
│   │   │   ├── seat.entity.ts
│   │   │   ├── booking.entity.ts
│   │   │   ├── ticket.entity.ts
│   │   │   ├── payment.entity.ts
│   │   │   ├── advertisement.entity.ts
│   │   │   ├── promotion.entity.ts
│   │   │   ├── review.entity.ts
│   │   │   ├── story.entity.ts
│   │   │   ├── story-circle.entity.ts
│   │   │   ├── notification.entity.ts
│   │   │   ├── support-ticket.entity.ts
│   │   │   ├── incident.entity.ts
│   │   │   ├── referral.entity.ts
│   │   │   ├── referral-coupon.entity.ts
│   │   │   ├── platform-policy.entity.ts
│   │   │   ├── audit-log.entity.ts
│   │   │   └── ...
│   │   ├── migrations/                  # Migrations TypeORM
│   │   └── seeds/                       # Données de base
│   │       ├── stations.seed.ts
│   │       ├── operators.seed.ts
│   │       └── amenities.seed.ts
│   │
│   ├── modules/                         # Modules fonctionnels
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── verify-otp.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── trips/
│   │   │   ├── trips.module.ts
│   │   │   ├── trips.controller.ts       # CRUD + search + seats
│   │   │   ├── trips.service.ts
│   │   │   ├── segments.service.ts
│   │   │   ├── seats.service.ts
│   │   │   └── dto/
│   │   │       ├── search-trips.dto.ts
│   │   │       └── create-trip.dto.ts
│   │   │
│   │   ├── bookings/
│   │   │   ├── bookings.module.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.service.ts       # Hold + confirm + cancel
│   │   │   └── dto/
│   │   │
│   │   ├── tickets/
│   │   │   ├── tickets.module.ts
│   │   │   ├── tickets.controller.ts
│   │   │   ├── tickets.service.ts        # Generate QR, validate, transfer
│   │   │   └── dto/
│   │   │
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   ├── paydunya.service.ts       # Gateway PaydunYa
│   │   │   └── dto/
│   │   │
│   │   ├── operators/
│   │   │   ├── operators.module.ts
│   │   │   ├── operators.controller.ts   # CRUD + stories + reviews + services
│   │   │   ├── operators.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── stations/
│   │   │   ├── stations.module.ts
│   │   │   ├── stations.controller.ts    # CRUD + nearby
│   │   │   ├── stations.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── stories/
│   │   │   ├── stories.module.ts
│   │   │   ├── stories.controller.ts
│   │   │   ├── stories.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── ads/
│   │   │   ├── ads.module.ts
│   │   │   ├── ads.controller.ts         # Active ads + tracking
│   │   │   ├── ads-admin.controller.ts   # CRUD admin
│   │   │   ├── ads.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── promotions/
│   │   │   ├── promotions.module.ts
│   │   │   ├── promotions.controller.ts
│   │   │   ├── promotions.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── reviews/
│   │   │   ├── reviews.module.ts
│   │   │   ├── reviews.controller.ts
│   │   │   ├── reviews.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── referrals/
│   │   │   ├── referrals.module.ts
│   │   │   ├── referrals.controller.ts   # My info, convert, coupons
│   │   │   ├── referrals-admin.controller.ts
│   │   │   ├── referrals.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── support/
│   │   │   ├── support.module.ts
│   │   │   ├── support.controller.ts     # Messages + incidents
│   │   │   ├── support.service.ts
│   │   │   ├── incidents.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts  # Orchestrateur multi-canal
│   │   │   ├── fcm.service.ts            # Firebase Cloud Messaging
│   │   │   ├── email.service.ts          # SendGrid/Mailgun
│   │   │   ├── whatsapp.service.ts       # Infobip
│   │   │   └── dto/
│   │   │
│   │   ├── policies/
│   │   │   ├── policies.module.ts
│   │   │   ├── policies.controller.ts    # Platform + operator policies
│   │   │   ├── policies.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── integrations/
│   │   │   ├── integrations.module.ts
│   │   │   ├── integrations.controller.ts
│   │   │   ├── integrations.service.ts
│   │   │   ├── alerts.controller.ts      # Alert rules + fired alerts
│   │   │   ├── alerts.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── vehicles/
│   │   │   ├── vehicles.module.ts
│   │   │   ├── vehicles.controller.ts    # CRUD + GPS tracking
│   │   │   ├── vehicles.service.ts
│   │   │   ├── tracking.gateway.ts       # WebSocket pour GPS temps réel
│   │   │   └── dto/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.ts
│   │   │   ├── dashboard.controller.ts   # Overview, stats, real-time map
│   │   │   ├── dashboard.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── security/
│   │   │   ├── security.module.ts
│   │   │   ├── security.controller.ts    # 2FA, sessions, password change
│   │   │   ├── security.service.ts
│   │   │   ├── sessions.controller.ts    # Session management + IP blocking
│   │   │   ├── sessions.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── settings/
│   │   │   ├── settings.module.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── audit/
│   │   │   ├── audit.module.ts
│   │   │   ├── audit.controller.ts       # Logs list, stats, export
│   │   │   ├── audit.service.ts          # Interceptor-driven logging
│   │   │   └── dto/
│   │   │
│   │   ├── aws/
│   │   │   ├── aws.module.ts
│   │   │   ├── aws.controller.ts         # Health, S3 stats, CDN, Lightsail
│   │   │   ├── s3.service.ts             # Upload/download fichiers
│   │   │   ├── cloudfront.service.ts
│   │   │   └── lightsail.service.ts
│   │   │
│   │   └── cashier/                      # App Societe spécifique
│   │       ├── cashier.module.ts
│   │       ├── cashier.controller.ts     # Vente en gare, transactions caisse
│   │       ├── cashier.service.ts
│   │       ├── managers.controller.ts
│   │       ├── managers.service.ts
│   │       ├── routes.controller.ts      # Routes + schedule templates
│   │       ├── routes.service.ts
│   │       ├── price-segments.controller.ts
│   │       └── dto/
│   │
│   └── shared/
│       ├── utils/
│       │   ├── haversine.ts             # Calcul distance GPS
│       │   ├── qr-generator.ts          # Génération QR codes
│       │   └── code-generator.ts        # Codes alphanumériques uniques
│       └── constants/
│           ├── hold-ttl.ts              # HOLD_DURATION_MS = 10 * 60 * 1000
│           └── currencies.ts            # XOF
│
├── test/
│   ├── e2e/
│   │   ├── auth.e2e-spec.ts
│   │   ├── bookings.e2e-spec.ts
│   │   └── payments.e2e-spec.ts
│   └── unit/
│
├── docker-compose.yml                   # PostgreSQL + Redis
├── Dockerfile
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 5. Base de Données — Schéma Complet

### 5.1 Tables Existantes (migrations déjà écrites)

Les migrations SQL sont dans `Mobile/src/migrations/`. Ces tables sont **déjà définies** :

| # | Table | Migration | Colonnes Clés |
|---|-------|-----------|---------------|
| 1 | `users` | 003 | user_id UUID, email, phone, full_name, role, is_verified, is_active |
| 2 | `operators` | 003 | operator_id VARCHAR, name, logo, fleet_size, rating, amenities |
| 3 | `stations` | 003 | station_id VARCHAR, name, city, lat/lon, amenities, opening_hours |
| 4 | `seat_map_configs` | 003 | config_id UUID, rows, seats_per_row, aisle_after, total_seats |
| 5 | `vehicles` | 003 | vehicle_id, operator_id, type, registration_number, seat_map_config_id |
| 6 | `trips` | 003 | trip_id, operator_id, vehicle_id, departure/arrival_time, base_price, from/to_stop_id, available_seats |
| 7 | `segments` | 003 | segment_id, trip_id, from/to_stop_id, departure/arrival_time, available_seats, sequence_number |
| 8 | `seats` | 003 | seat_id UUID, trip_id, seat_number, status, booked_by_user_id, hold_expires_at |
| 9 | `bookings` | 003 | booking_id UUID, user_id, trip_id, operator_id, status, total_amount, num_passengers |
| 10 | `tickets` | 003 | ticket_id, trip_id, booking_id, passenger_name/phone, seat_number, qr_code, alphanumeric_code, price, status |
| 11 | `ticket_transfers` | 003 | transfer_id, ticket_id, from/to_user_id, status, transfer_token |
| 12 | `advertisements` | 002 | id, title, description, media_type, media_url, cta_text, action_type, target_pages[], priority, impressions_count, clicks_count |
| 13 | `ad_impressions` | 002 | id, ad_id, user_id, page, device_type, timestamp |
| 14 | `ad_clicks` | 002 | id, ad_id, user_id, page, action_type, timestamp |
| 15 | `ad_conversions` | 002 | id, ad_id, user_id, conversion_type, revenue_fcfa |
| 16 | `operator_stories` | 001 | id, operator_id, title, description, image_url, status, expires_at |
| 17 | `story_views` | 001 | id, story_id, user_id, viewed_at |
| 18 | `user_sessions` | 004 | session_id, user_id, device_type, ip_address, expires_at |
| 19 | `user_devices` | 004 | device_id, user_id, push_token, os_type, push_enabled |
| 20 | `payments` | 004 | payment_id UUID, booking_id, user_id, amount, payment_method, status, provider_reference |
| 21 | `story_categories` | 008 | category_id, name, slug, emoji, display_order |
| 22 | `user_operator_roles` | 008 | user_id, operator_id, role, is_active |
| 23 | `amenity_types` | 008 | amenity_id, name, icon, category |
| 24 | `vehicle_amenities` | 008 | vehicle_id, amenity_id |
| 25 | `reviews` | 008 | review_id, trip_id, operator_id, user_id, rating, aspects JSONB, status |
| 26 | `booking_segments` | 009 | booking_id, segment_id, seat_id |
| 27 | `operator_policies` | 011 | policy_id, operator_id, title, description, type, icon |
| 28 | `admin_stories` | 012 | id, title, description, emoji, gradient, category, priority, is_active |
| 29 | `promotions` | 013 | promotion_id, operator_id, trip_id, discount_type, discount_value, max_uses, is_active |
| 30 | `notifications` | 001 | (table basique dans migration stories) |
| 31 | `analytics_events` | 001 | (table basique dans migration stories) |

### 5.2 Tables MANQUANTES (à créer — Migration 014+)

Ces 19 tables sont référencées dans le frontend mais n'ont PAS de migration SQL :

#### Migration 014: Referral / Parrainage
```sql
-- ================================================
-- Migration 014: Système de Parrainage
-- ================================================

-- Ajout colonnes utilisateur pour parrainage
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users(user_id),
  ADD COLUMN IF NOT EXISTS referral_points_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_level VARCHAR(20) DEFAULT 'standard';

CREATE INDEX idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Table de suivi des parrainages
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES users(user_id),
  referred_user_id UUID NOT NULL REFERENCES users(user_id),
  referral_code VARCHAR(20) NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'validated', 'expired', 'cancelled')),
  validated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_referral UNIQUE(referrer_user_id, referred_user_id)
);

-- Coupons générés via points de parrainage
CREATE TABLE IF NOT EXISTS referral_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  code VARCHAR(20) NOT NULL UNIQUE,
  amount INTEGER NOT NULL CHECK (amount > 0), -- montant en XOF
  points_cost INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'expired')),
  booking_id UUID REFERENCES bookings(booking_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP
);

CREATE INDEX idx_referral_coupons_user ON referral_coupons(user_id);
CREATE INDEX idx_referral_coupons_code ON referral_coupons(code);

-- Configuration du système de parrainage
CREATE TABLE IF NOT EXISTS referral_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  points_per_referral INTEGER DEFAULT 10,
  coupon_500_cost INTEGER DEFAULT 100,
  coupon_1000_cost INTEGER DEFAULT 200,
  disabled_reason VARCHAR(255),
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer la config par défaut
INSERT INTO referral_config (enabled, points_per_referral, coupon_500_cost, coupon_1000_cost)
VALUES (true, 10, 100, 200);
```

#### Migration 015: Platform Policies
```sql
-- ================================================
-- Migration 015: Politiques de la Plateforme
-- ================================================

CREATE TABLE IF NOT EXISTS platform_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(30) NOT NULL CHECK (type IN ('privacy', 'terms', 'platform_rule', 'legal')),
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,             -- Markdown
  version VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  scope VARCHAR(30) NOT NULL DEFAULT 'global'
    CHECK (scope IN ('global', 'company_addon')),
  published_at TIMESTAMP,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_platform_policies_status ON platform_policies(status);
CREATE INDEX idx_platform_policies_type ON platform_policies(type);
```

#### Migration 016: Audit Logs & Security
```sql
-- ================================================
-- Migration 016: Audit Logs & Security Events
-- ================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,           -- 'CREATE_BOOKING', 'CANCEL_TRIP', etc.
  entity_type VARCHAR(50),                -- 'booking', 'trip', 'ticket', etc.
  entity_id VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  category VARCHAR(50),                   -- 'auth', 'payment', 'booking', 'admin'
  changes JSONB,                          -- { before: {...}, after: {...} }
  ip_address INET,
  user_agent TEXT,
  geo_location VARCHAR(100),
  session_id UUID,
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('error', 'critical');

-- Security events (login attempts, 2FA, password changes)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  event_type VARCHAR(50) NOT NULL
    CHECK (event_type IN ('login', 'logout', 'failed_login', 'password_change',
      '2fa_enabled', '2fa_disabled', '2fa_verified', 'session_revoked', 'account_locked')),
  ip_address INET,
  user_agent TEXT,
  location VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);

-- Blocked IPs
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip_address INET PRIMARY KEY,
  reason VARCHAR(255),
  blocked_by UUID REFERENCES users(user_id),
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP                    -- NULL = permanent
);
```

#### Migration 017: Support & Incidents
```sql
-- ================================================
-- Migration 017: Support Messages & Incidents
-- ================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  user_type VARCHAR(20) NOT NULL DEFAULT 'passenger'
    CHECK (user_type IN ('passenger', 'operator')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(30) NOT NULL
    CHECK (category IN ('booking', 'payment', 'technical', 'feedback', 'other')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(user_id),
  resolved_at TIMESTAMP,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(user_id),
  author_role VARCHAR(20) NOT NULL CHECK (author_role IN ('admin', 'user')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id VARCHAR(50) REFERENCES trips(trip_id),
  station_id VARCHAR(50) REFERENCES stations(station_id),
  company_id VARCHAR(50) REFERENCES operators(operator_id),
  reporter_id UUID NOT NULL REFERENCES users(user_id),
  reporter_type VARCHAR(20) NOT NULL CHECK (reporter_type IN ('passenger', 'company')),
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('accident', 'delay', 'cancellation', 'mechanical', 'other')),
  severity VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in-progress', 'resolved')),
  assigned_to UUID REFERENCES users(user_id),
  resolved_by UUID REFERENCES users(user_id),
  resolved_at TIMESTAMP,
  passengers_affected INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_trip ON incidents(trip_id);
```

#### Migration 018: Integrations & Alerts
```sql
-- ================================================
-- Migration 018: Integrations & Alert System
-- ================================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('payment', 'sms', 'email', 'analytics', 'mapping', 'storage')),
  provider VARCHAR(50) NOT NULL,          -- 'paydunya', 'infobip', 'sendgrid', 'aws', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'error', 'degraded')),
  config JSONB,                           -- Encrypted API keys et config
  webhook_url VARCHAR(500),
  billing_type VARCHAR(20) CHECK (billing_type IN ('monthly', 'per_use', 'free')),
  monthly_cost_fcfa INTEGER,
  last_health_check TIMESTAMP,
  last_health_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL
    CHECK (type IN ('quota_exceeded', 'high_latency', 'downtime', 'error_rate', 'cost_spike')),
  threshold NUMERIC NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  enabled BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_sms BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS integration_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES integration_alert_rules(id) ON DELETE SET NULL,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  current_value NUMERIC,
  threshold NUMERIC,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(user_id),
  acknowledged_at TIMESTAMP,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_unack ON integration_alerts(acknowledged) WHERE acknowledged = false;
```

#### Migration 019: PaydunYa
```sql
-- ================================================
-- Migration 019: PaydunYa Payment Gateway Config
-- ================================================

CREATE TABLE IF NOT EXISTS paydunya_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_key VARCHAR(255) NOT NULL,       -- Chiffré (AES-256)
  private_key VARCHAR(255) NOT NULL,      -- Chiffré
  token VARCHAR(255) NOT NULL,            -- Chiffré
  mode VARCHAR(10) NOT NULL DEFAULT 'test'
    CHECK (mode IN ('test', 'live')),
  channels JSONB NOT NULL DEFAULT '{}',   -- { "orange_money": { "enabled": true, "fee": 1.5 }, ... }
  updated_by UUID REFERENCES users(user_id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paydunya_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  channel_key VARCHAR(30),
  transaction_ref VARCHAR(100),
  amount INTEGER,
  currency VARCHAR(10) DEFAULT 'XOF',
  status VARCHAR(20),
  http_status INTEGER,
  response_time_ms INTEGER,
  payload JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_paydunya_logs_date ON paydunya_webhook_logs(created_at DESC);
CREATE INDEX idx_paydunya_logs_ref ON paydunya_webhook_logs(transaction_ref);
```

#### Migration 020: Notification Center
```sql
-- ================================================
-- Migration 020: Notification Center Avancé
-- ================================================

-- Templates de notifications
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(30),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campagnes envoyées
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (source IN ('auto', 'manual')),
  audience VARCHAR(50),                   -- 'all', 'new_users', 'inactive', etc.
  audience_count INTEGER DEFAULT 0,
  channels TEXT[],                        -- ['push', 'email', 'whatsapp']
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  sent_by UUID REFERENCES users(user_id),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications planifiées
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  audience VARCHAR(50),
  audience_count INTEGER DEFAULT 0,
  channels TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'cancelled')),
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Règles d'automatisation
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  trigger_event VARCHAR(50) NOT NULL,     -- 'booking_confirmed', 'trip_departure_1h', etc.
  template_id UUID REFERENCES notification_templates(id),
  channels TEXT[],
  is_active BOOLEAN DEFAULT true,
  sent_count INTEGER DEFAULT 0,
  category VARCHAR(30),                   -- 'onboarding', 'transactional', 'reminder', 'alert'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Migration 021: Vehicle GPS Tracking
```sql
-- ================================================
-- Migration 021: Vehicle Location Tracking
-- ================================================

CREATE TABLE IF NOT EXISTS vehicle_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id VARCHAR(50) NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
  vehicle_id VARCHAR(50) REFERENCES vehicles(vehicle_id),
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  heading NUMERIC(5, 2),                  -- Direction en degrés (0-360)
  speed NUMERIC(6, 2),                    -- km/h
  accuracy NUMERIC(6, 2),                 -- mètres
  progress_percent NUMERIC(5, 2),         -- 0-100
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_locations_trip ON vehicle_locations(trip_id, recorded_at DESC);

-- Note: La dernière position est aussi stockée dans Redis
-- pour accès temps réel via WebSocket (pas besoin de query DB)
```

### 5.3 Résumé des Tables

| # | Statut | Tables | Migration |
|---|--------|--------|-----------|
| 31 | ✅ Existantes | users, operators, stations, vehicles, trips, segments, seats, bookings, tickets, etc. | 001-013 |
| 19 | 🔴 Manquantes | referrals, referral_coupons, referral_config, platform_policies, audit_logs, security_events, blocked_ips, support_tickets, support_messages, incidents, integrations, integration_alert_rules, integration_alerts, paydunya_config, paydunya_webhook_logs, notification_templates, notification_campaigns, scheduled_notifications, automation_rules, vehicle_locations | 014-021 |
| **50** | **Total** | | |

---

## 6. API Endpoints — Référence Complète

Les endpoints sont définis par les 3 frontends. Le backend doit implémenter TOUS ces endpoints.

### 6.1 Authentification (`/auth/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| POST | `/auth/login` | Login email + mot de passe | Toutes |
| POST | `/auth/register` | Inscription passager | Mobile |
| POST | `/auth/logout` | Déconnexion | Toutes |
| POST | `/auth/verify-otp` | Vérification OTP (SMS via Infobip) | Mobile |
| POST | `/auth/resend-otp` | Renvoyer OTP | Mobile |
| POST | `/auth/refresh-token` | Renouveler JWT | Toutes |
| GET | `/auth/me` | Profil utilisateur courant | Toutes |
| POST | `/auth/reset-password` | Réinitialisation mot de passe | Toutes |

**Flux OTP Mobile:**
```
1. POST /auth/register → crée user (status: pending)
2. Backend envoie OTP via Infobip WhatsApp/SMS
3. POST /auth/verify-otp { phone, code } → valide, retourne JWT
4. Si expiré: POST /auth/resend-otp { phone }
```

### 6.2 Trajets (`/trips/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/trips` | Liste trajets (pagination, filtres) | Admin, Societe |
| GET | `/trips/search` | Recherche par from/to/date | Mobile |
| GET | `/trips/:id` | Détail trajet | Toutes |
| GET | `/trips/:id/seats` | État des sièges (map) | Mobile |
| GET | `/trips/nearby` | Trajets proches (GPS) | Mobile |
| POST | `/trips` | Créer trajet | Admin, Societe |
| PUT | `/trips/:id` | Modifier trajet | Admin, Societe |
| DELETE | `/trips/:id` | Supprimer trajet | Admin |
| POST | `/trips/:id/cancel` | Annuler trajet | Admin |
| POST | `/trips/generate-from-templates` | Générer depuis modèles | Societe |

**Règle CRITIQUE (Trip Capacity):**
```
trip.available_seats = Math.min(segment.available_seats pour chaque segment)
```
Un passager doit traverser TOUS les segments → la capacité est le minimum.

### 6.3 Réservations (`/bookings/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/bookings` | Mes réservations / Liste admin | Toutes |
| POST | `/bookings` | Réserver (HOLD 10 min) | Mobile |
| GET | `/bookings/:id` | Détail réservation | Toutes |
| POST | `/bookings/:id/confirm` | Confirmer après paiement | Mobile, Admin |
| POST | `/bookings/:id/cancel` | Annuler réservation | Toutes |
| PUT | `/bookings/:id` | Modifier réservation | Admin |

**Flux de réservation:**
```
1. POST /bookings { tripId, seats, passengers[] }
   → Vérifie disponibilité segments
   → Lock sièges (status: 'hold', hold_expires_at: +10min)
   → Retourne booking (status: 'HOLD')
   
2. POST /payments { bookingId, method, amount }
   → Initie paiement PaydunYa
   → Webhook reçoit confirmation
   
3. POST /bookings/:id/confirm
   → Met sièges en 'paid'
   → Génère tickets (QR + code alphanum)
   → Envoie notification
   
CRON: Chaque minute, expire les HOLD > 10 min
   → Libère sièges → status: 'available'
   → Booking status: 'CANCELLED'
```

### 6.4 Billets (`/tickets/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/tickets` | Mes billets / Liste | Toutes |
| GET | `/tickets/:id` | Détail billet | Toutes |
| POST | `/tickets/:id/validate` | Valider QR en gare | Societe |
| POST | `/tickets/:id/transfer` | Transférer à un autre passager | Mobile |
| GET | `/tickets/:id/download` | Télécharger PDF | Mobile |
| POST | `/tickets/:id/cancel` | Annuler billet | Toutes |
| POST | `/tickets/:id/refund` | Rembourser | Societe, Admin |

### 6.5 Paiements (`/payments/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| POST | `/payments` | Initier paiement | Mobile |
| GET | `/payments/:id` | Statut paiement | Toutes |
| GET | `/payments` | Liste paiements | Admin |
| GET | `/payment-methods` | Méthodes disponibles | Mobile |
| POST | `/payments/webhook` | Webhook PaydunYa (IPN) | Backend interne |
| POST | `/payments/:id/refund` | Rembourser | Admin |
| GET | `/payments/stats` | Statistiques paiements | Admin |

### 6.6 Opérateurs (`/operators/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/operators` | Liste opérateurs | Toutes |
| GET | `/operators/:id` | Détail opérateur | Toutes |
| POST | `/operators` | Créer opérateur | Admin |
| PUT | `/operators/:id` | Modifier | Admin |
| DELETE | `/operators/:id` | Supprimer | Admin |
| POST | `/operators/:id/toggle-status` | Activer/désactiver | Admin |
| GET | `/operators/:id/stats` | Statistiques | Admin |
| GET | `/operators/:id/services` | Services de l'opérateur | Mobile |
| GET | `/operators/:id/stories` | Stories de l'opérateur | Mobile |
| GET | `/operators/:id/reviews` | Avis de l'opérateur | Mobile |

### 6.7 Gares (`/stations/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/stations` | Liste gares | Toutes |
| GET | `/stations/:id` | Détail gare | Toutes |
| GET | `/stations/nearby` | Gares à proximité (GPS) | Mobile |
| POST | `/stations` | Créer gare | Admin |
| PUT | `/stations/:id` | Modifier | Admin |
| DELETE | `/stations/:id` | Supprimer | Admin |
| GET | `/stations/:id/stats` | Statistiques | Admin |

### 6.8 Stories (`/stories/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/stories` | Toutes les stories | Admin |
| GET | `/stories/active` | Stories actives | Mobile |
| POST | `/stories` | Créer story | Admin |
| POST | `/stories/mark-viewed` | Marquer comme vue | Mobile |
| GET | `/stories/viewed` | Stories vues par user | Mobile |

### 6.9 Publicités (`/ads/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/ads/active` | Pubs actives (ciblage) | Mobile |
| POST | `/ads/:id/impression` | Tracker impression | Mobile |
| POST | `/ads/:id/click` | Tracker clic | Mobile |
| POST | `/ads/:id/conversion` | Tracker conversion | Mobile |
| GET | `/ads` | Liste admin (CRUD) | Admin |
| GET | `/ads/:id` | Détail pub | Admin |
| POST | `/ads` | Créer pub | Admin |
| PUT | `/ads/:id` | Modifier pub | Admin |
| DELETE | `/ads/:id` | Supprimer pub | Admin |
| GET | `/ads/:id/stats` | Stats d'une pub | Admin |

### 6.10 Promotions (`/promotions/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/promotions` | Liste promotions | Admin |
| GET | `/promotions/:id` | Détail | Admin |
| POST | `/promotions` | Créer | Admin |
| PUT | `/promotions/:id` | Modifier | Admin |
| DELETE | `/promotions/:id` | Supprimer | Admin |
| POST | `/promotions/:id/toggle` | Activer/désactiver | Admin |

### 6.11 Avis (`/reviews/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| POST | `/reviews` | Créer avis | Mobile |
| GET | `/reviews/my-reviews` | Mes avis | Mobile |
| PUT | `/reviews/:id` | Modifier | Mobile |
| DELETE | `/reviews/:id` | Supprimer | Mobile, Admin |
| GET | `/reviews` | Liste admin | Admin |
| POST | `/reviews/:id/moderate` | Modérer | Admin |

### 6.12 Parrainage (`/referrals/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/referrals/me` | Mon info parrainage | Mobile |
| POST | `/referrals/convert` | Convertir points → coupon | Mobile |
| GET | `/referrals/coupons` | Mes coupons | Mobile |
| POST | `/referrals/validate` | Valider code parrainage | Mobile |
| POST | `/referrals/coupons/validate` | Valider coupon | Mobile |
| POST | `/referrals/coupons/use` | Utiliser coupon | Mobile |
| GET | `/admin/referrals` | Liste parrainages | Admin |
| GET | `/admin/referrals/stats` | Statistiques | Admin |
| GET | `/admin/referrals/config` | Config parrainage | Admin |
| GET | `/admin/referrals/coupons` | Tous les coupons | Admin |
| GET | `/admin/referrals/user/:userId` | Parrainages d'un user | Admin |

### 6.13 Support (`/support/`, `/tickets/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/support/messages/my-messages` | Mes messages | Mobile |
| POST | `/support/messages` | Envoyer message | Mobile |
| POST | `/support/incidents` | Signaler incident | Mobile |
| GET | `/support/incidents/my-incidents` | Mes incidents | Mobile |
| GET | `/support/incidents/:id` | Détail incident | Mobile |
| POST | `/support/incidents/:id/close` | Fermer incident | Mobile |
| POST | `/support/assistant/chat` | Chat assistant IA | Mobile |
| GET | `/tickets` | Liste tickets support | Admin |
| GET | `/tickets/:id` | Détail ticket | Admin |
| POST | `/tickets/:id/messages` | Répondre | Admin |
| POST | `/tickets/:id/close` | Clôturer | Admin |
| GET | `/incidents` | Liste incidents | Admin |
| POST | `/incidents/:id/resolve` | Résoudre | Admin |
| POST | `/incidents/:id/assign` | Assigner | Admin |

### 6.14 Politiques (`/policies/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/policies/platform?status=published` | CGU publiées | Mobile |
| GET | `/policies/platform` | Liste admin | Admin |
| GET | `/policies/platform/:id` | Détail | Admin |
| POST | `/policies/platform` | Créer | Admin |
| PUT | `/policies/platform/:id` | Modifier | Admin |
| DELETE | `/policies/platform/:id` | Supprimer | Admin |
| POST | `/policies/platform/:id/publish` | Publier | Admin |
| POST | `/policies/platform/:id/archive` | Archiver | Admin |
| GET | `/policies/operator` | Règles opérateurs | Admin |
| POST | `/policies/operator` | Créer règle | Admin |
| PUT | `/policies/operator/:id` | Modifier | Admin |

### 6.15 Notifications (`/notifications/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/notifications` | Mes notifications | Toutes |
| POST | `/notifications/:id/read` | Marquer lue | Toutes |
| POST | `/notifications/read-all` | Tout marquer lu | Toutes |
| DELETE | `/notifications/:id` | Supprimer | Toutes |

### 6.16 Utilisateurs (`/users/`, `/user/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/user/profile` | Mon profil | Mobile |
| PUT | `/user/profile` | Modifier profil | Mobile |
| GET | `/user/export` | Exporter mes données | Mobile |
| DELETE | `/user/delete` | Supprimer compte | Mobile |
| GET | `/users` | Liste utilisateurs | Admin |
| GET | `/users/:id` | Détail | Admin |
| POST | `/users` | Créer | Admin |
| PUT | `/users/:id` | Modifier | Admin |
| DELETE | `/users/:id` | Supprimer | Admin |
| POST | `/users/:id/block` | Bloquer | Admin |
| POST | `/users/:id/unblock` | Débloquer | Admin |

### 6.17 Dashboard (`/dashboard/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/dashboard/overview` | Overview général | Admin |
| GET | `/dashboard/stats` | Statistiques globales | Admin |
| GET | `/dashboard/recent-activity` | Activité récente | Admin |
| GET | `/dashboard/realtime-map` | Carte temps réel | Admin |

### 6.18 Sécurité (`/admin/security/`, `/sessions/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/admin/security/profile` | Profil sécurité | Admin |
| POST | `/admin/security/change-password` | Changer MDP | Admin |
| POST | `/admin/security/2fa/enable` | Activer 2FA | Admin |
| POST | `/admin/security/2fa/verify` | Vérifier 2FA | Admin |
| POST | `/admin/security/2fa/disable` | Désactiver 2FA | Admin |
| GET | `/admin/security/sessions` | Sessions actives | Admin |
| POST | `/admin/security/sessions/:id/revoke` | Révoquer session | Admin |
| POST | `/admin/security/sessions/revoke-others` | Révoquer toutes | Admin |
| GET | `/admin/security/events` | Événements sécurité | Admin |
| GET | `/sessions` | Liste sessions | Admin |
| POST | `/sessions/:id/terminate` | Terminer session | Admin |
| POST | `/sessions/terminate-bulk` | Terminer en masse | Admin |
| POST | `/sessions/block-ip` | Bloquer IP | Admin |
| GET | `/sessions/blocked-ips` | IPs bloquées | Admin |
| DELETE | `/sessions/blocked-ips/:ip` | Débloquer IP | Admin |

### 6.19 Logs & Audit (`/logs/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/logs` | Liste logs (filtres) | Admin |
| GET | `/logs/:id` | Détail log | Admin |
| GET | `/logs/stats` | Statistiques logs | Admin |
| GET | `/logs/export` | Exporter logs | Admin |

### 6.20 Intégrations & Alertes (`/integrations/`, `/alerts/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/integrations` | Liste intégrations | Admin |
| GET | `/integrations/:id` | Détail | Admin |
| PUT | `/integrations/:id` | Modifier config | Admin |
| POST | `/integrations/:id/test` | Test connexion | Admin |
| GET | `/alerts/rules` | Règles d'alerte | Admin |
| POST | `/alerts/rules` | Créer règle | Admin |
| POST | `/alerts/rules/:id/toggle` | Activer/désactiver | Admin |
| DELETE | `/alerts/rules/:id` | Supprimer règle | Admin |
| GET | `/alerts` | Alertes déclenchées | Admin |
| POST | `/alerts/:id/acknowledge` | Acquitter alerte | Admin |
| GET | `/alerts/active-count` | Compteur alertes actives | Admin |

### 6.21 AWS (`/aws/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/aws/health` | Santé globale AWS | Admin |
| GET | `/aws/s3/stats` | Stats S3 | Admin |
| GET | `/aws/cloudfront/stats` | Stats CDN | Admin |
| GET | `/aws/lightsail/metrics` | Métriques serveur | Admin |
| POST | `/aws/cloudfront/purge` | Purger cache CDN | Admin |
| POST | `/aws/lightsail/restart` | Redémarrer instance | Admin |

### 6.22 WhatsApp (`/whatsapp/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/whatsapp/account` | Info compte Infobip | Admin |
| POST | `/whatsapp/test-message` | Envoyer message test | Admin |
| GET | `/whatsapp/health` | Santé connexion | Admin |
| GET | `/whatsapp/delivery-stats` | Stats livraison | Admin |

### 6.23 PaydunYa (`/admin/paydunya/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/admin/paydunya` | Config actuelle | Admin |
| PUT | `/admin/paydunya/credentials` | Mettre à jour clés API | Admin |
| PUT | `/admin/paydunya/mode` | Basculer test/live | Admin |
| PUT | `/admin/paydunya/channels/:key/toggle` | Activer canal | Admin |
| PUT | `/admin/paydunya/channels/:key/fee` | Configurer frais | Admin |
| GET | `/admin/paydunya/health` | Vérifier connexion API | Admin |
| POST | `/admin/paydunya/test` | Transaction test | Admin |
| GET | `/admin/paydunya/stats/channels` | Stats par canal | Admin |
| GET | `/admin/paydunya/webhook-logs` | Logs webhooks | Admin |

### 6.24 Settings (`/settings/`)

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/settings` | Paramètres plateforme | Admin |
| PUT | `/settings` | Modifier paramètres | Admin |
| POST | `/settings/logo` | Upload logo | Admin |
| GET | `/settings/export?format=csv` | Exporter données | Admin |
| POST | `/settings/import` | Importer données | Admin |

### 6.25 App Societe — Endpoints Spécifiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | `/managers` | CRUD managers de gare |
| GET/POST | `/cashiers` | CRUD caissiers |
| GET/POST | `/routes` | CRUD routes (itinéraires) |
| GET/POST | `/schedule-templates` | Modèles d'horaires récurrents |
| GET/POST | `/price-segments` | Tarification par segment |
| GET | `/price-history` | Historique des prix |
| GET/POST | `/cash-transactions` | Transactions caisse |
| POST | `/stories/upload` | Upload story |

### 6.26 Vehicle Tracking

| Méthode | Endpoint | Description | Apps |
|---------|----------|-------------|------|
| GET | `/vehicle/trips/:tripId/location` | Dernière position GPS | Mobile |
| **WebSocket** | `/ws/tracking` | Temps réel GPS | Mobile, Admin |

---

## 7. Authentification & Sécurité

### 7.1 Stratégie JWT

```typescript
// jwt.config.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET,         // 256-bit random
  signOptions: { expiresIn: '1h' },       // Access token: 1h
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: '30d',                // Refresh token: 30 jours
};
```

### 7.2 Multi-Role Guards

Le backend sert 3 types d'utilisateurs avec des permissions différentes :

```typescript
// Décorateur personnalisé
@Roles('SUPER_ADMIN', 'OPERATOR_ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('/admin/users')
async listUsers() { ... }

// Endpoint public (pas de JWT)
@Public()
@Post('/auth/login')
async login() { ... }

// Endpoint passager uniquement
@Roles('PASSENGER')
@Get('/referrals/me')
async getMyReferralInfo() { ... }
```

**Rôles:**
| Rôle | App | Accès |
|------|-----|-------|
| `PASSENGER` | Mobile | Ses propres données uniquement |
| `SUPER_ADMIN` | Admin | Tout |
| `OPERATOR_ADMIN` | Admin | Opérateurs assignés |
| `SUPPORT_ADMIN` | Admin | Tickets + incidents |
| `FINANCE_ADMIN` | Admin | Paiements + stats |
| `responsable` | Societe | Sa compagnie |
| `manager` | Societe | Sa gare |
| `caissier` | Societe | Vente billets uniquement |

### 7.3 Rate Limiting

```typescript
// Throttler global
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // 60 secondes
      limit: 100,   // 100 requêtes max
    }),
  ],
})

// Endpoints sensibles : plus restrictif
@Throttle(5, 60)  // 5 tentatives par minute
@Post('/auth/login')
async login() { ... }

@Throttle(3, 300) // 3 OTP par 5 minutes
@Post('/auth/verify-otp')
async verifyOtp() { ... }
```

### 7.4 Flux OTP

```
1. Mobile: POST /auth/register { phone, email, name, password }
2. Backend: Crée user (status: 'pending'), génère OTP 6 chiffres, TTL 5 min
3. Backend: Envoie OTP via Infobip WhatsApp/SMS
4. Mobile: POST /auth/verify-otp { phone, code }
5. Backend: Vérifie OTP, active user, retourne JWT + refreshToken
6. Si expiré: POST /auth/resend-otp { phone } → nouveau code
```

---

## 8. Paiements — PaydunYa

### 8.1 Flux de Paiement

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Mobile  │     │ Backend  │     │ PaydunYa │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │ POST /payments │                │
     │ {bookingId,    │                │
     │  method,amount}│                │
     ├───────────────►│                │
     │                │ Create Invoice │
     │                ├───────────────►│
     │                │   invoiceUrl   │
     │                │◄───────────────┤
     │  {paymentUrl}  │                │
     │◄───────────────┤                │
     │                │                │
     │ (User pays on  │                │
     │  OrangeMoney/  │                │
     │  MoovMoney/    │                │
     │  Wave app)     │                │
     │                │   IPN Webhook  │
     │                │◄───────────────┤
     │                │ {status:       │
     │                │  completed}    │
     │                │                │
     │                │ → Confirm booking
     │                │ → Generate tickets
     │                │ → Send notification
     │  Push notif    │                │
     │◄───────────────┤                │
     │ "Paiement OK"  │                │
```

### 8.2 Configuration PaydunYa

```typescript
// paydunya.service.ts
import { PaydunyaSetup, PaydunyaStore, PaydunyaInvoice } from 'paydunya';

const setup = new PaydunyaSetup({
  masterKey: process.env.PAYDUNYA_MASTER_KEY,
  privateKey: process.env.PAYDUNYA_PRIVATE_KEY,
  token: process.env.PAYDUNYA_TOKEN,
  mode: process.env.PAYDUNYA_MODE, // 'test' ou 'live'
});

const store = new PaydunyaStore({
  name: 'FasoTravel',
  tagline: 'Transport routier Burkina Faso',
  phoneNumber: '+226 XX XX XX XX',
  postalAddress: 'Ouagadougou, Burkina Faso',
  websiteUrl: 'https://fasotravel.bf',
  logoUrl: 'https://fasotravel.bf/logo.png',
  callbackUrl: 'https://api.fasotravel.bf/payments/webhook', // IPN
  returnUrl: 'https://fasotravel.bf/payment/success',
  cancelUrl: 'https://fasotravel.bf/payment/cancel',
});
```

### 8.3 Webhook IPN (Instant Payment Notification)

```typescript
@Post('/payments/webhook')
@Public() // Pas d'auth JWT, mais vérification signature PaydunYa
async handleWebhook(@Body() body: any, @Req() req: Request) {
  // 1. Vérifier signature PaydunYa (HMAC)
  // 2. Trouver le paiement par transaction_ref
  // 3. Mettre à jour status du paiement
  // 4. Si complété:
  //    - Confirmer la réservation
  //    - Changer status sièges: 'hold' → 'paid'
  //    - Générer tickets (QR + code alphanum)
  //    - Envoyer notification au passager
  // 5. Logger dans paydunya_webhook_logs
}
```

### 8.4 Méthodes de paiement supportées

| Méthode | Clé API | Popularité BF |
|---------|---------|---------------|
| Orange Money | `orange_money` | ★★★★★ (dominant) |
| Moov Money | `moov_money` | ★★★★ |
| Wave | `wave` | ★★★ |
| Carte bancaire | `card` | ★★ |
| Cash (en gare) | `cash` | ★★★★ (app Societe) |

---

## 9. Notifications — Email, FCM, WhatsApp

### 9.1 Architecture Multi-Canal

```typescript
// notifications.service.ts — Orchestrateur
async sendNotification(params: {
  userId: string;
  type: 'booking_confirmed' | 'trip_reminder' | 'payment_received' | ...;
  channels: ('push' | 'email' | 'whatsapp' | 'sms')[];
  data: Record<string, any>;
}) {
  const user = await this.usersService.findById(params.userId);
  
  for (const channel of params.channels) {
    switch (channel) {
      case 'push':
        await this.fcmService.send(user.deviceTokens, params);
        break;
      case 'email':
        await this.emailService.send(user.email, params);
        break;
      case 'whatsapp':
        await this.whatsappService.send(user.phone, params);
        break;
    }
  }
  
  // Persister en DB
  await this.notificationsRepo.save({ userId, type, ... });
}
```

### 9.2 Firebase Cloud Messaging (Push)

```typescript
// fcm.service.ts
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendToDevice(token: string, notification: { title: string; body: string; data?: any }) {
    return admin.messaging().send({
      token,
      notification: { title: notification.title, body: notification.body },
      data: notification.data,
      android: { priority: 'high' },
    });
  }
}
```

**Mobile (Capacitor) doit:**
1. Enregistrer le device token: `POST /mobile/fcm/token { token, deviceId, os }`
2. Gérer les notifications foreground/background dans Capacitor

### 9.3 Email (SendGrid)

```typescript
// email.service.ts
@Injectable()
export class EmailService {
  private sgMail = require('@sendgrid/mail');
  
  constructor() {
    this.sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async send(to: string, template: string, variables: Record<string, any>) {
    await this.sgMail.send({
      to,
      from: 'noreply@fasotravel.bf',
      templateId: template, // ID template SendGrid
      dynamicTemplateData: variables,
    });
  }
}
```

**Templates email nécessaires:**
| Template | Déclencheur |
|----------|------------|
| Confirmation de réservation | booking:confirmed |
| Billet électronique | ticket:generated |
| Rappel de départ (1h avant) | cron job |
| Réinitialisation mot de passe | auth:reset-password |
| Bienvenue | auth:register |
| Remboursement effectué | payment:refunded |

### 9.4 WhatsApp/SMS (Infobip)

```typescript
// whatsapp.service.ts
@Injectable()
export class WhatsappService {
  private apiKey = process.env.INFOBIP_API_KEY;
  private baseUrl = process.env.INFOBIP_BASE_URL;

  async sendOtp(phone: string, code: string) {
    // Utiliser le template WhatsApp approuvé pour OTP
    await axios.post(`${this.baseUrl}/whatsapp/1/message/template`, {
      messages: [{
        from: process.env.INFOBIP_SENDER,
        to: phone,
        content: {
          templateName: 'otp_verification',
          templateData: { body: { placeholders: [code] } },
          language: 'fr',
        },
      }],
    }, {
      headers: { Authorization: `App ${this.apiKey}` },
    });
  }
}
```

---

## 10. Stockage Fichiers — AWS S3

### 10.1 Cas d'utilisation

| Type | Dossier S3 | Taille max |
|------|-----------|------------|
| Photos profil | `users/profile/` | 5 MB |
| Logos opérateurs | `operators/logos/` | 2 MB |
| Médias stories | `stories/media/` | 10 MB |
| Médias publicités | `ads/media/` | 10 MB |
| Billets PDF | `tickets/pdf/` | 1 MB |
| Pièces jointes support | `support/attachments/` | 5 MB |

### 10.2 Upload Flow

```
1. Frontend demande URL presignée: POST /uploads/presign { filename, contentType }
2. Backend génère URL presignée S3 (expire 15 min)
3. Frontend upload directement vers S3 (pas de transit backend)
4. Frontend confirme upload: POST /uploads/confirm { key, entityType, entityId }
5. Backend associe le fichier à l'entité et sert via CloudFront
```

---

## 11. Types Canoniques & Conventions

### 11.1 Source de Vérité

Le fichier `shared/types/standardized.ts` est la **source unique de vérité** pour tous les types.

**Convention:** Le backend DOIT retourner les réponses en **camelCase** exactement comme défini dans `standardized.ts`.

### 11.2 Format de Réponse API Standard

```typescript
// Succès
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-06-01T12:00:00Z"
}

// Succès paginé
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "timestamp": "2025-06-01T12:00:00Z"
}

// Erreur
{
  "success": false,
  "error": {
    "code": "BOOKING_EXPIRED",
    "message": "La réservation a expiré",
    "field": "bookingId",       // optionnel
    "details": { ... }          // optionnel
  },
  "timestamp": "2025-06-01T12:00:00Z"
}
```

Ces interfaces sont déjà définies dans `standardized.ts` : `ApiResponse<T>`, `PaginatedResponse<T>`.

### 11.3 Types Manquants dans standardized.ts

Ces types existent dans le frontend mais pas encore dans `standardized.ts` :

| Type | Utilisé dans | Action |
|------|-------------|--------|
| `Payment` | Mobile (services/types.ts) | Ajouter dans standardized.ts |
| `Notification` | Mobile (data/models.ts) | Ajouter dans standardized.ts |
| `Vehicle` | Admin + Societe | Ajouter dans standardized.ts |
| `Referral` | Mobile (shared/types/common.ts) | Ajouter dans standardized.ts |
| `ReferralCoupon` | Mobile (shared/types/common.ts) | Ajouter dans standardized.ts |
| `PlatformPolicy` | Mobile (platformPolicy.service.ts) | Ajouter dans standardized.ts |
| `Integration` | Admin | Ajouter dans standardized.ts |
| `AuditLog` | Admin | Ajouter dans standardized.ts |

### 11.4 Problème snake_case vs camelCase

**CRITIQUE:** `Mobile/src/data/models.ts` utilise snake_case pour beaucoup de types (User, Trip, Ticket, Booking, Payment, Station, Promotion, Review) alors que `standardized.ts` utilise camelCase.

**Décision:** Le backend retourne **camelCase** (conforme à standardized.ts). Les types snake_case dans `models.ts` devront être migrés progressivement vers les types canoniques.

**Stratégie de migration recommandée:**
1. Le backend implémente les types de `standardized.ts` tels quels
2. Les services Mobile sont déjà dans `services/types.ts` en camelCase → corrects
3. Les types de `data/models.ts` (snake_case) sont utilisés pour le mock → ils disparaîtront quand les mocks seront remplacés par les vrais appels API

---

## 12. Audit du Frontend — Problèmes à Résoudre

### 12.1 Duplications de Types

| Interface | Nombre de définitions | Fichiers |
|-----------|----------------------|----------|
| `Trip` | 9 | standardized.ts, models.ts, services/types.ts, common.ts, admin/standardized.ts, societe... |
| `Ticket` | 5 | standardized.ts, models.ts, services/types.ts, common.ts, admin... |
| `Booking` | 5 | similaraire |
| `Station` | 4 | |
| `User` (PassengerUser) | 4 | |
| `Promotion` | 4 | |

**Résolution:** Quand le backend est en place, chaque app doit migrer vers `import { Trip } from 'shared/types/standardized'`.

### 12.2 Violations Mock (6 services)

| Service | Problème | Priorité |
|---------|----------|----------|
| `platformPolicy.service.ts` | MOCK_POLICIES inline (60 lignes) | Moyenne (données statiques extractibles) |
| `referral.service.ts` | mockReferralInfo + mockCoupons inline (état mutable) | Moyenne |
| `auth.service.ts` | mockLogin/mockRegister (factories dynamiques) | Basse (disparaissent avec backend) |
| `operator.service.ts` | 4 mock methods inline (conflit types avec models.ts) | Basse |
| `payment.service.ts` | mockCreatePayment + mockGetPaymentMethods | Basse |
| `station.service.ts` | mockGetStations inline (conflit types avec STATIONS) | Basse |

**Résolution:** Ces mocks seront remplacés par des vrais appels API dès que le backend est en place. Pas prioritaire de les déplacer maintenant.

### 12.3 Fichier de Config Dupliqué

- `Mobile/src/services/config.ts` — **PRINCIPAL** (endpoints + API config)
- `Mobile/src/lib/config.ts` — **REDONDANT** (endpoints dupliqués + ADS_CONFIG)

**Résolution:** Consolider dans `services/config.ts`. Déplacer `ADS_CONFIG` et supprimer `lib/config.ts`.

### 12.4 Code Mort Nettoyé ✅

| Élément | Fichier | Action |
|---------|---------|--------|
| ~~`AdPlacement` type~~ | ~~models.ts~~ | ✅ Supprimé |
| ~~`Advertisement` (obsolète)~~ | ~~services/types.ts~~ | ✅ Supprimé |
| ~~`Advertisement` (dupliqué)~~ | ~~shared/types/common.ts~~ | ✅ Supprimé |

---

## 13. Plan d'Implémentation

### Phase 1 — Fondation (Semaine 1)

**Objectif:** Projet NestJS fonctionnel avec auth et persistance.

```
☐ 1.1 Initialiser projet NestJS
    $ nest new backend
    $ npm i @nestjs/typeorm typeorm pg
    $ npm i @nestjs/passport passport passport-jwt @nestjs/jwt
    $ npm i class-validator class-transformer
    $ npm i @nestjs/swagger swagger-ui-express
    $ npm i @nestjs/throttler
    $ npm i bcrypt
    $ npm i @nestjs/config
    
☐ 1.2 Docker Compose (PostgreSQL + Redis)
    - PostgreSQL 14
    - Redis 7
    - Adminer (optionnel, pour debug DB)

☐ 1.3 Configurer TypeORM
    - database.config.ts avec .env
    - Créer les entités des 31 tables existantes
    - Synchroniser le schéma (ou importer les migrations SQL)

☐ 1.4 Module Auth
    - POST /auth/register → créer user, hash password
    - POST /auth/login → vérifier password, retourner JWT
    - POST /auth/verify-otp (stub → à connecter Infobip plus tard)
    - POST /auth/refresh-token
    - GET /auth/me
    - Guards: JwtAuthGuard, RolesGuard
    
☐ 1.5 Intercepteur de réponse standard
    - Wrapper { success, data, timestamp }
    - Exception filter { success: false, error: { code, message } }
    
☐ 1.6 Swagger
    - Documentation auto-générée sur /api/docs
```

### Phase 2 — Core Transport (Semaine 2)

**Objectif:** Search → Book → Pay → Ticket.

```
☐ 2.1 Module Trips
    - GET /trips/search (from, to, date, passengers)
    - GET /trips/:id
    - GET /trips/:id/seats
    - Logique segments : trip.availableSeats = min(segments.availableSeats)
    - CRUD admin

☐ 2.2 Module Stations
    - GET /stations (list, filter by city)
    - GET /stations/nearby (haversine)
    - CRUD admin

☐ 2.3 Module Bookings
    - POST /bookings → HOLD (lock seats 10 min)
    - POST /bookings/:id/confirm → après paiement
    - POST /bookings/:id/cancel → libérer seats
    - CRON job: expire holds > 10 min

☐ 2.4 Module Tickets
    - Génération auto après confirmation booking
    - QR code (qrcode npm package)
    - Code alphanumérique unique (8 chars)
    - POST /tickets/:id/validate (scan en gare)
    - POST /tickets/:id/transfer

☐ 2.5 Module Payments
    - POST /payments → initier (PaydunYa ou stub)
    - POST /payments/webhook → recevoir IPN
    - GET /payment-methods
    - Enregistrer dans DB + lier au booking
```

### Phase 3 — Opérateurs & Contenu (Semaine 3)

**Objectif:** Gestion opérateurs, stories, avis, promotions.

```
☐ 3.1 Module Operators
    - CRUD complet
    - GET /operators/:id/services
    - GET /operators/:id/stories
    - GET /operators/:id/reviews
    - Statistiques par opérateur

☐ 3.2 Module Stories
    - CRUD admin stories + operator stories
    - Story circles
    - Mark viewed tracking
    - Expiration auto

☐ 3.3 Module Reviews
    - POST /reviews (passager après trajet)
    - Modération admin
    - Calcul rating moyen opérateur (trigger DB)

☐ 3.4 Module Promotions
    - CRUD admin
    - Validation code promo au moment du paiement
    - Calcul prix réduit
    - Toggle actif/inactif

☐ 3.5 Module Ads (Publicités)
    - GET /ads/active (ciblage par page, utilisateur)
    - Tracking impressions/clics/conversions
    - CRUD admin
    - Statistiques détaillées
```

### Phase 4 — Intégrations Externes (Semaine 4)

**Objectif:** Paiements réels, notifications, fichiers.

```
☐ 4.1 PaydunYa — Intégration complète
    - npm install paydunya
    - Créer invoices
    - Recevoir webhooks IPN
    - Configurer canaux (Orange Money, Moov, Wave, Carte)
    - Mode test puis live
    - Admin: config clés, toggle canaux, stats

☐ 4.2 Infobip — OTP + WhatsApp
    - Envoi OTP pour vérification téléphone
    - Templates WhatsApp approuvés
    - Notifications transactionnelles

☐ 4.3 Firebase — Push Notifications
    - npm install firebase-admin
    - Enregistrement device tokens
    - Envoi push (booking confirmed, trip reminder, etc.)

☐ 4.4 SendGrid — Email
    - npm install @sendgrid/mail
    - Templates email (confirmation, billet, rappel, reset password)
    - Bulk email pour campagnes

☐ 4.5 AWS S3 — Upload fichiers
    - npm install @aws-sdk/client-s3
    - URLs presignées pour upload direct
    - CloudFront pour serving
```

### Phase 5 — Administration & Sécurité (Semaine 5)

**Objectif:** Dashboard admin, sécurité, audit.

```
☐ 5.1 Module Dashboard
    - GET /dashboard/overview (stats agrégées)
    - GET /dashboard/stats (graphiques)
    - GET /dashboard/recent-activity
    - GET /dashboard/realtime-map

☐ 5.2 Module Audit Logs
    - Intercepteur global qui log chaque action
    - GET /logs (filtres, pagination)
    - Export CSV/JSON
    - Stats par catégorie

☐ 5.3 Module Security
    - Change password avec vérification ancien
    - 2FA (TOTP avec speakeasy)
    - Gestion sessions (list, revoke, revoke-all)
    - IP blocking
    - Security events logging

☐ 5.4 Module Notifications Center
    - Templates réutilisables
    - Campagnes (manual + scheduled)
    - Automatisation (trigger-based)
    - Stats livraison

☐ 5.5 Module Users Admin
    - CRUD utilisateurs
    - Block/unblock
    - Détail avec activité
```

### Phase 6 — Fonctionnalités Avancées (Semaine 6)

**Objectif:** Parrainage, support, politiques, GPS.

```
☐ 6.1 Module Referrals (Parrainage)
    - Génération codes uniques (FT-XXX-YYYY)
    - Tracking: qui a parrainé qui
    - Points balance
    - Conversion points → coupons
    - Validation/utilisation coupons au paiement
    - Admin: stats, config, liste

☐ 6.2 Module Support
    - Tickets support (CRUD + assign + resolve)
    - Messages dans un fil
    - Incidents (report → assign → resolve)
    - Intégration assistant IA (optionnel)

☐ 6.3 Module Policies
    - Platform policies (CGU, privacy) CRUD + publish/archive
    - Operator policies (règles par compagnie)
    - Versioning des politiques

☐ 6.4 Module Vehicles & GPS Tracking
    - CRUD véhicules
    - WebSocket gateway pour positions GPS temps réel
    - Stockage positions dans Redis (dernière) + DB (historique)
    - Broadcast aux clients abonnés à un trajet

☐ 6.5 Module Integrations
    - CRUD config intégrations
    - Test connectivity
    - Alert rules + fired alerts
    - Health check cron
```

### Phase 7 — App Societe (Semaine 7)

**Objectif:** Endpoints spécifiques caissiers/managers.

```
☐ 7.1 Module Cashier
    - Vente de billets en gare (cash)
    - Scan QR pour embarquement
    - Transactions caisse (opening/closing)
    - Liste billets par trajet

☐ 7.2 Module Managers
    - CRUD managers de gare
    - CRUD caissiers
    - Stats par gare

☐ 7.3 Module Routes & Scheduling
    - CRUD routes (itinéraires)
    - Schedule templates (horaires récurrents)
    - Génération auto de trips
    - Price segments (tarification)

☐ 7.4 Module Settings
    - Paramètres plateforme
    - Export/import données
    - Upload logo
```

### Phase 8 — Tests & Déploiement (Semaine 8)

```
☐ 8.1 Tests E2E
    - Auth flow complet (register → OTP → login → refresh)
    - Booking flow (search → hold → pay → ticket)
    - Payment webhook flow
    - Admin CRUD operations

☐ 8.2 Seed Data
    - Stations (villes Burkina Faso)
    - Opérateurs (compagnies réelles)
    - Amenities
    - Platform policies par défaut
    - Referral config par défaut
    - Admin super user

☐ 8.3 Déploiement
    - Dockerfile (multi-stage build)
    - docker-compose production
    - AWS Lightsail setup
    - SSL (Certbot/Let's Encrypt)
    - Domain configuration
    - Environment variables production
```

---

## 14. Déploiement & Infrastructure

### 14.1 AWS Lightsail (recommandé)

```
Instance: $20/mois (4 GB RAM, 2 vCPU, 80 GB SSD)
├── Docker
│   ├── NestJS API (port 3000)
│   ├── PostgreSQL (port 5432)
│   └── Redis (port 6379)
├── Nginx (reverse proxy + SSL)
└── Certbot (Let's Encrypt auto-renew)
```

### 14.2 Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://fasotravel:${DB_PASSWORD}@postgres:5432/fasotravel
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: fasotravel
      POSTGRES_USER: fasotravel
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 14.3 Nginx Config

```nginx
server {
    listen 443 ssl http2;
    server_name api.fasotravel.bf;

    ssl_certificate /etc/letsencrypt/live/api.fasotravel.bf/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.fasotravel.bf/privkey.pem;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 15. Variables d'Environnement

```env
# ======================
# APPLICATION
# ======================
NODE_ENV=production
PORT=3000
API_PREFIX=/api

# ======================
# DATABASE
# ======================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=fasotravel
DATABASE_USER=fasotravel
DATABASE_PASSWORD=<STRONG_PASSWORD>
DATABASE_SSL=false

# ======================
# REDIS
# ======================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>

# ======================
# JWT
# ======================
JWT_SECRET=<256_BIT_RANDOM_SECRET>
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=<256_BIT_RANDOM_SECRET>
JWT_REFRESH_EXPIRES_IN=30d

# ======================
# PAYDUNYA
# ======================
PAYDUNYA_MASTER_KEY=<MASTER_KEY>
PAYDUNYA_PRIVATE_KEY=<PRIVATE_KEY>
PAYDUNYA_TOKEN=<TOKEN>
PAYDUNYA_MODE=test

# ======================
# INFOBIP (WhatsApp/SMS)
# ======================
INFOBIP_API_KEY=<API_KEY>
INFOBIP_BASE_URL=https://xxxxx.api.infobip.com
INFOBIP_SENDER=<WHATSAPP_NUMBER>

# ======================
# FIREBASE (Push/FCM)
# ======================
FIREBASE_PROJECT_ID=fasotravel
FIREBASE_CLIENT_EMAIL=firebase@fasotravel.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=<PRIVATE_KEY>

# ======================
# SENDGRID (Email)
# ======================
SENDGRID_API_KEY=<API_KEY>
SENDGRID_FROM_EMAIL=noreply@fasotravel.bf
SENDGRID_FROM_NAME=FasoTravel

# ======================
# AWS
# ======================
AWS_ACCESS_KEY_ID=<ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
AWS_REGION=eu-west-3
AWS_S3_BUCKET=fasotravel-assets
AWS_CLOUDFRONT_DOMAIN=cdn.fasotravel.bf

# ======================
# ENCRYPTION
# ======================
ENCRYPTION_KEY=<32_BYTE_HEX_KEY>
```

---

## Résumé Exécutif

| Métrique | Valeur |
|----------|--------|
| **Tables DB totales** | 50 (31 existantes + 19 à créer) |
| **Endpoints API** | ~140 |
| **Modules NestJS** | 22 |
| **Intégrations externes** | 5 (PaydunYa, Infobip, Firebase, SendGrid, AWS) |
| **Phases d'implémentation** | 8 |
| **Priorité #1** | Auth + Trips + Bookings + Payments (Phase 1-2) |

---

*Document généré après audit complet des 3 frontends (Mobile, Admin, Societe) et de toutes les migrations SQL existantes.*
