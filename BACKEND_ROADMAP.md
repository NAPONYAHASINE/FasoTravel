# 🗺️ FEUILLE DE ROUTE BACKEND — FasoTravel

> **Début :** 3 avril 2026  
> **Deadline :** 31 mai 2026  
> **Durée :** 8 semaines (~58 jours)  
> **Méthode :** Module par module, testé à 100% avant le suivant

---

## RÈGLES ABSOLUES

| # | Règle | Détail |
|---|-------|--------|
| 1 | **0 duplication** | Une seule source de vérité par type, par constante, par DTO |
| 2 | **0 donnée en dur** | Tout vient de `.env`, de la DB, ou de constantes dans `common/constants/` |
| 3 | **0 mock en production** | Seed data pour dev, jamais de `if (isDev) return fakeData` |
| 4 | **Réutilisation max** | Base DTOs hérités, services génériques, intercepteurs partagés |
| 5 | **Test avant avancement** | Chaque module a ses tests unitaires + e2e. On ne passe pas au suivant tant que ça ne passe pas à 100% |
| 6 | **Types partagés** | Le backend exporte ses types et le frontend les consomme (via `shared/`) |
| 7 | **Validation stricte** | `class-validator` sur chaque DTO entrant, aucune donnée non validée |

---

## VUE D'ENSEMBLE — 8 SEMAINES

```
Sem 1  ███░░░░░  Fondation (NestJS + DB + Auth)
Sem 2  ███░░░░░  Core Transport (Trips + Bookings + Tickets)
Sem 3  ███░░░░░  Paiements + Opérateurs + Gares
Sem 4  ███░░░░░  Contenu (Stories + Ads + Promotions + Reviews)
Sem 5  ███░░░░░  Admin (Dashboard + Users + Audit + Security)
Sem 6  ███░░░░░  Avancé (Notifications + Referrals + Support + Policies)
Sem 7  ███░░░░░  Societe (Cashier + Managers + Routes + Settings)
Sem 8  ███░░░░░  Intégrations externes + Déploiement + Tests finaux
```

---

## SEMAINE 1 — FONDATION

> **Objectif :** Projet NestJS qui démarre, se connecte à PostgreSQL + Redis, authentifie un user, et retourne des réponses standardisées.

### Module 1.1 — Scaffold & Infrastructure

| Étape | Tâche | Fichier(s) créé(s) |
|-------|-------|---------------------|
| 1.1.1 | `nest new backend` + installer dépendances | `backend/` |
| 1.1.2 | Docker Compose (PostgreSQL 14 + Redis 7 + Adminer) | `docker-compose.yml` |
| 1.1.3 | `.env` avec toutes les variables (cf. blueprint §15) | `.env`, `.env.example` |
| 1.1.4 | `database.config.ts` — TypeORM async config depuis `.env` | `src/config/database.config.ts` |
| 1.1.5 | `redis.config.ts` — connexion Redis | `src/config/redis.config.ts` |

**Dépendances à installer :**
```
@nestjs/typeorm typeorm pg
@nestjs/config
@nestjs/swagger swagger-ui-express
@nestjs/throttler
@nestjs/cache-manager cache-manager cache-manager-redis-yet
class-validator class-transformer
bcrypt @types/bcrypt
uuid @types/uuid
```

**Test de validation :**
```
✅ docker compose up → PostgreSQL et Redis démarrent
✅ npm run start:dev → NestJS démarre sur :3003
✅ GET http://localhost:3003/api → { success: true, message: "FasoTravel API" }
✅ Adminer accessible sur :8080
```

---

### Module 1.2 — Common (Partagé)

> Tout ce qui sera **réutilisé** dans chaque module futur.

| Étape | Tâche | Fichier(s) |
|-------|-------|------------|
| 1.2.1 | `TransformInterceptor` — wraps toute réponse en `{ success, data, timestamp }` | `common/interceptors/transform.interceptor.ts` |
| 1.2.2 | `HttpExceptionFilter` — wraps erreurs en `{ success: false, error: { code, message } }` | `common/filters/http-exception.filter.ts` |
| 1.2.3 | `GlobalValidationPipe` — rejette les requêtes invalides avec messages clairs | `common/pipes/validation.pipe.ts` |
| 1.2.4 | `PaginationDto` — réutilisable (page, limit, sort, order) | `common/dto/pagination.dto.ts` |
| 1.2.5 | `PaginatedResponse<T>` — type generic pour listes paginées | `common/dto/paginated-response.dto.ts` |
| 1.2.6 | `@Roles()` decorator + `RolesGuard` | `common/decorators/roles.decorator.ts`, `common/guards/roles.guard.ts` |
| 1.2.7 | `@CurrentUser()` decorator — extrait l'user du JWT | `common/decorators/current-user.decorator.ts` |
| 1.2.8 | `@Public()` decorator — skip auth | `common/decorators/public.decorator.ts` |
| 1.2.9 | `LoggingInterceptor` — log chaque requête (méthode, URL, durée) | `common/interceptors/logging.interceptor.ts` |
| 1.2.10 | `TimeoutInterceptor` — timeout 30s par défaut | `common/interceptors/timeout.interceptor.ts` |
| 1.2.11 | Constantes globales (`USER_ROLES`, `BOOKING_STATUSES`, etc.) | `common/constants/` |

**Tests de validation :**
```
✅ POST /any avec body invalide → 400 { success: false, error: { message: [...] } }
✅ GET /any route → réponse wrappée { success: true, data: ..., timestamp: ... }
✅ GET /route-inexistante → 404 { success: false, error: { code: 404 } }
✅ Tests unitaires TransformInterceptor (3 cas)
✅ Tests unitaires HttpExceptionFilter (4 cas : 400, 401, 404, 500)
✅ Tests unitaires PaginationDto (validation page/limit)
```

---

### Module 1.3 — Entités DB (Tables existantes)

> On crée les 31 entités TypeORM correspondant aux tables existantes.

| Étape | Tâche | Entité(s) |
|-------|-------|-----------|
| 1.3.1 | `BaseEntity` abstract — `id`, `createdAt`, `updatedAt` | `database/entities/base.entity.ts` |
| 1.3.2 | Users | `user.entity.ts` |
| 1.3.3 | Operators + UserOperatorRoles | `operator.entity.ts`, `user-operator-role.entity.ts` |
| 1.3.4 | Stations + AmenityTypes | `station.entity.ts`, `amenity-type.entity.ts` |
| 1.3.5 | Vehicles + SeatMapConfigs + VehicleAmenities | `vehicle.entity.ts`, `seat-map-config.entity.ts`, `vehicle-amenity.entity.ts` |
| 1.3.6 | Trips + Segments + Seats + BookingSegments | `trip.entity.ts`, `segment.entity.ts`, `seat.entity.ts`, `booking-segment.entity.ts` |
| 1.3.7 | Bookings + Tickets + TicketTransfers | `booking.entity.ts`, `ticket.entity.ts`, `ticket-transfer.entity.ts` |
| 1.3.8 | Payments | `payment.entity.ts` |
| 1.3.9 | Advertisements + AdImpressions + AdClicks + AdConversions | `advertisement.entity.ts`, `ad-impression.entity.ts`, `ad-click.entity.ts`, `ad-conversion.entity.ts` |
| 1.3.10 | OperatorStories + StoryViews + StoryCategories + AdminStories | `operator-story.entity.ts`, `story-view.entity.ts`, `story-category.entity.ts`, `admin-story.entity.ts` |
| 1.3.11 | OperatorPolicies + Promotions | `operator-policy.entity.ts`, `promotion.entity.ts` |
| 1.3.12 | UserSessions + UserDevices + Notifications + AnalyticsEvents | `user-session.entity.ts`, `user-device.entity.ts`, `notification.entity.ts`, `analytics-event.entity.ts` |
| 1.3.13 | Reviews | `review.entity.ts` |

**Tests de validation :**
```
✅ npm run start:dev → NestJS synchronise le schéma sans erreur
✅ Toutes les relations (FK) correctement définies
✅ Pas de table dupliquée, pas de colonne dupliquée
✅ TypeORM metadata dump montre 31 entités
```

---

### Module 1.4 — Auth

> Le module Auth sert les 3 apps (Mobile, Admin, Societe).

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 1.4.1 | `AuthModule` + `AuthService` + `AuthController` | — |
| 1.4.2 | `RegisterDto` (email, phone, fullName, password) + validation | — |
| 1.4.3 | `POST /auth/register` — hash password (bcrypt 12 rounds), créer user | `/auth/register` |
| 1.4.4 | `POST /auth/login` — vérifier credentials, retourner access + refresh tokens | `/auth/login` |
| 1.4.5 | `POST /auth/verify-otp` — stub (toujours OK pour l'instant) | `/auth/verify-otp` |
| 1.4.6 | `POST /auth/refresh-token` (+ alias `POST /auth/refresh`) | `/auth/refresh-token` |
| 1.4.7 | `GET /auth/me` — retourner profil du user connecté | `/auth/me` |
| 1.4.8 | `POST /auth/forgot-password` + `POST /auth/reset-password` | `/auth/forgot-password` |
| 1.4.9 | `JwtStrategy` + `JwtAuthGuard` (global) | — |
| 1.4.10 | `RolesGuard` — vérifie `@Roles('ADMIN', 'OPERATOR', 'PASSENGER')` | — |

**Configuration JWT :**
```
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=30d
JWT_SECRET=<256-bit random depuis .env>
```

**Tests de validation :**
```
✅ POST /auth/register avec email valide → 201 { success: true, data: { user, tokens } }
✅ POST /auth/register avec email dupliqué → 409 Conflict
✅ POST /auth/register avec body invalide → 400 (class-validator errors)
✅ POST /auth/login avec bons credentials → 200 { tokens: { accessToken, refreshToken } }
✅ POST /auth/login avec mauvais password → 401 Unauthorized
✅ GET /auth/me avec token valide → 200 { user profile }
✅ GET /auth/me sans token → 401
✅ POST /auth/refresh-token avec refresh valide → nouveaux tokens
✅ POST /auth/refresh-token avec refresh expiré → 401
✅ RolesGuard: PASSENGER ne peut pas accéder aux routes @Roles('ADMIN') → 403
```

---

### Module 1.5 — Swagger

| Étape | Tâche |
|-------|-------|
| 1.5.1 | Configurer Swagger dans `main.ts` sur `/api/docs` |
| 1.5.2 | Ajouter `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()` sur auth endpoints |

**Test de validation :**
```
✅ GET http://localhost:3003/api/docs → Swagger UI affiche tous les endpoints Auth
```

---

### ✅ CHECKPOINT SEMAINE 1

```
Avant de passer à la semaine 2, TOUT DOIT ÊTRE VERT :

□ docker compose up → PostgreSQL + Redis + Adminer OK
□ NestJS démarre sur :3003 sans erreur
□ 31 entités synchronisées en DB
□ Auth register/login/me/refresh fonctionnent
□ Réponses standardisées { success, data } ou { success: false, error }
□ Validation rejette les mauvais inputs
□ RolesGuard bloque les accès non autorisés
□ Swagger affiche la doc
□ TOUS les tests passent : npm run test && npm run test:e2e
```

---

## SEMAINE 2 — CORE TRANSPORT

> **Objectif :** Un passager peut chercher un trajet, réserver des sièges, et recevoir un billet.

### Module 2.1 — Stations

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 2.1.1 | `StationsModule` + `StationsService` + `StationsController` | — |
| 2.1.2 | `GET /stations` — liste + filtres (city, search) | `/stations` |
| 2.1.3 | `GET /stations/nearby` — lat/lon + rayon (Haversine) | `/stations/nearby` |
| 2.1.4 | `GET /stations/:id` — détail | `/stations/:id` |
| 2.1.5 | CRUD admin : POST, PUT, DELETE (guards `@Roles('ADMIN')`) | `/stations` |

**Tests :**
```
✅ GET /stations → liste paginée
✅ GET /stations?city=Ouagadougou → filtre fonctionne
✅ GET /stations/nearby?lat=12.37&lon=-1.52&radius=10 → stations proches
✅ POST /stations (admin) → crée une station
✅ POST /stations (passager) → 403 Forbidden
```

---

### Module 2.2 — Trips + Segments + Seats

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 2.2.1 | `TripsModule` + `TripsService` + controller | — |
| 2.2.2 | `GET /trips/search` — (from, to, date, passengers) | `/trips/search` |
| 2.2.3 | Logique segments : `availableSeats = min(segments.availableSeats)` | — |
| 2.2.4 | `GET /trips/:id` — détail complet (segments, operator info) | `/trips/:id` |
| 2.2.5 | `GET /trips/:id/seats` — plan des sièges (disponibles, réservés, bloqués) | `/trips/:id/seats` |
| 2.2.6 | `GET /trips/popular` — trajets populaires | `/trips/popular` |
| 2.2.7 | CRUD admin | `/trips` (POST, PUT, DELETE) |

**Tests :**
```
✅ GET /trips/search?from=ouaga&to=bobo&date=2026-04-10&passengers=2 → résultats
✅ GET /trips/search sans params → 400 (from, to, date requis)
✅ GET /trips/:id/seats → chaque siège a un status (available/booked/held)
✅ Logique segment : si un segment a 0 places, le trip n'apparaît pas
```

---

### Module 2.3 — Bookings

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 2.3.1 | `BookingsModule` + service + controller | — |
| 2.3.2 | `POST /bookings` → status=HOLD, lock seats, expire dans 10min | `/bookings` |
| 2.3.3 | `POST /bookings/:id/confirm` → après paiement (appelé par webhook ou manuellement) | `/bookings/:id/confirm` |
| 2.3.4 | `POST /bookings/:id/cancel` → libérer seats, status=CANCELLED | `/bookings/:id/cancel` |
| 2.3.5 | `GET /bookings/my` → bookings du user connecté | `/bookings/my` |
| 2.3.6 | `GET /bookings/:id` → détail | `/bookings/:id` |
| 2.3.7 | `CRON` : expire holds > 10 min (toutes les minutes) | — |
| 2.3.8 | Transaction atomic : lock seats + create booking dans une seule transaction | — |

**Tests :**
```
✅ POST /bookings → seats passent de "available" à "held", booking status="HOLD"
✅ POST /bookings pour siège déjà held → 409 Conflict
✅ POST /bookings/:id/confirm → status="CONFIRMED"
✅ POST /bookings/:id/cancel → seats libérés, status="CANCELLED"
✅ CRON: booking HOLD > 10min → auto-cancel + seats libérés
✅ Transaction: si le lock échoue, rien n'est créé (rollback)
```

---

### Module 2.4 — Tickets

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 2.4.1 | `TicketsModule` + service + controller | — |
| 2.4.2 | Génération auto à la confirmation booking (1 ticket par siège) | — |
| 2.4.3 | QR code (data = `{ ticketId, bookingId, tripId, seatNumber }`) | — |
| 2.4.4 | Code alphanumérique unique (8 chars, ex: `FT-AB12CD34`) | — |
| 2.4.5 | `GET /tickets/my` → billets du user | `/tickets/my` |
| 2.4.6 | `GET /tickets/:id` → détail billet | `/tickets/:id` |
| 2.4.7 | `POST /tickets/:id/validate` → scan en gare (Societe/Caissier) | `/tickets/:id/validate` |
| 2.4.8 | `POST /tickets/:id/transfer` → transfert billet | `/tickets/:id/transfer` |
| 2.4.9 | `GET /tickets/verify/:code` → vérifier par code alphanumérique | `/tickets/verify/:code` |

**Tests :**
```
✅ Après confirm booking → tickets auto-générés (1 par passager)
✅ Chaque ticket a un QR unique + code alphanumérique unique
✅ GET /tickets/my → renvoie les billets du user connecté
✅ POST /tickets/:id/validate → status passe à "validated"
✅ POST /tickets/:id/validate sur billet déjà validé → 409
✅ POST /tickets/:id/transfer → crée un ticket_transfer
```

---

### ✅ CHECKPOINT SEMAINE 2

```
□ Un passager peut chercher un trajet
□ Voir les sièges disponibles
□ Réserver (HOLD 10min)
□ Les seats held expirent automatiquement
□ Confirmer une réservation → billets générés
□ Chaque billet a un QR code + code alphanumérique
□ Un billet peut être validé en gare
□ TOUS les tests : npm run test && npm run test:e2e
```

---

## SEMAINE 3 — PAIEMENTS + OPÉRATEURS + GARES

### Module 3.1 — Payments

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 3.1.1 | `PaymentsModule` + service + controller | — |
| 3.1.2 | `POST /payments` — initier un paiement (stub PaydunYa) | `/payments` |
| 3.1.3 | `POST /payments/webhook` — recevoir IPN (PaydunYa callback) | `/payments/webhook` |
| 3.1.4 | `GET /payment-methods` — méthodes disponibles | `/payment-methods` |
| 3.1.5 | `GET /payments/:id` — détail paiement | `/payments/:id` |
| 3.1.6 | Logique : webhook reçu → vérifier signature → confirm booking → générer tickets | — |
| 3.1.7 | Enum status : `PENDING → COMPLETED / FAILED / EXPIRED` | — |

**Tests :**
```
✅ POST /payments → crée un paiement PENDING lié au booking
✅ POST /payments/webhook avec signature valide → paiement COMPLETED + booking confirmé + tickets générés
✅ POST /payments/webhook avec signature invalide → 403
✅ POST /payments/webhook idempotent (même événement 2x → pas de double-confirm)
✅ GET /payment-methods → liste avec frais par canal
```

---

### Module 3.2 — Operators

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 3.2.1 | `OperatorsModule` + service + controller | — |
| 3.2.2 | `GET /operators` — liste (filtres, pagination) | `/operators` |
| 3.2.3 | `GET /operators/:id` — détail (services, rating, fleet) | `/operators/:id` |
| 3.2.4 | `GET /operators/:id/stories` — stories opérateur | `/operators/:id/stories` |
| 3.2.5 | `GET /operators/:id/reviews` — avis opérateur | `/operators/:id/reviews` |
| 3.2.6 | CRUD admin (POST, PUT, DELETE) | `/operators` |

**Tests :**
```
✅ GET /operators → liste paginée avec rating
✅ GET /operators/:id → détail complet
✅ CRUD admin protégé par @Roles('ADMIN')
```

---

### ✅ CHECKPOINT SEMAINE 3

```
□ Flow complet : Search → Book → Pay → Ticket fonctionne de bout en bout
□ Webhook PaydunYa déclenche toute la chaîne (confirm + tickets)
□ Opérateurs avec leurs stories et reviews
□ TOUS les tests passent
```

---

## SEMAINE 4 — CONTENU

### Module 4.1 — Stories

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 4.1.1 | `StoriesModule` + service + controller | — |
| 4.1.2 | Mobile : `GET /stories/active`, `POST /stories/mark-viewed`, `GET /stories/viewed` | Mobile |
| 4.1.3 | Admin : CRUD `/admin/stories` (create, update, publish, archive, delete) | Admin |
| 4.1.4 | Admin : CRUD `/admin/story-circles` (create, update, delete) | Admin |

**Tests :**
```
✅ GET /stories/active → renvoie seulement les stories published + non expirées
✅ POST /stories/mark-viewed → crée un story_view
✅ Admin CRUD stories complet
✅ Admin CRUD story-circles complet
```

---

### Module 4.2 — Ads (Publicités)

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 4.2.1 | `AdsModule` + service + controller | — |
| 4.2.2 | `GET /ads/active` — ciblage par page + priorité | Mobile |
| 4.2.3 | `POST /ads/:id/impression`, `POST /ads/:id/click`, `POST /ads/:id/conversion` | Mobile |
| 4.2.4 | Admin CRUD + `GET /ads/:id/stats` | Admin |

**Tests :**
```
✅ GET /ads/active?page=home → renvoie pubs ciblées pour cette page
✅ POST /ads/:id/impression → incrémente compteur
✅ Admin CRUD protégé
✅ GET /ads/:id/stats → impressions, clics, conversions, CTR
```

---

### Module 4.3 — Promotions

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 4.3.1 | `PromotionsModule` + service + controller | — |
| 4.3.2 | Admin CRUD + toggle actif/inactif | Admin |
| 4.3.3 | `POST /promotions/validate` — valider code promo au moment du booking | Mobile |
| 4.3.4 | Logique : vérifier max_uses, date_range, operator_id match | — |

**Tests :**
```
✅ POST /promotions/validate avec code valide → { valid: true, discount }
✅ POST /promotions/validate avec code expiré → { valid: false }
✅ POST /promotions/validate avec code déjà utilisé max fois → { valid: false }
```

---

### Module 4.4 — Reviews (Avis)

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 4.4.1 | `ReviewsModule` + service + controller | — |
| 4.4.2 | `POST /reviews` — passager après un trajet (1 seul par booking) | Mobile |
| 4.4.3 | `GET /reviews` — liste (filtres par operator, trip) | Global |
| 4.4.4 | Calcul automatique `operator.rating` (trigger ou service) | — |
| 4.4.5 | Admin : modération (approve, reject) | Admin |

**Tests :**
```
✅ POST /reviews → crée un avis pour un trajet terminé
✅ POST /reviews pour trip non terminé → 403
✅ POST /reviews 2x pour même booking → 409
✅ Rating opérateur recalculé après nouveau review
```

---

### ✅ CHECKPOINT SEMAINE 4

```
□ Stories (admin + mobile), Ads (ciblage + tracking), Promotions (validation), Reviews (avis + rating)
□ TOUS les tests passent
```

---

## SEMAINE 5 — ADMINISTRATION & SÉCURITÉ

### Module 5.1 — Dashboard & Analytics

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 5.1.1 | `DashboardModule` + service + controller | — |
| 5.1.2 | `GET /dashboard/overview` — KPIs (revenue, bookings, users, trips) | Admin |
| 5.1.3 | `GET /dashboard/stats` — graphiques (par période) | Admin |
| 5.1.4 | `GET /dashboard/recent-activity` — dernières actions | Admin |
| 5.1.5 | `GET /admin/analytics/platform` — croissance plateforme | Admin |
| 5.1.6 | `GET /admin/analytics/registrations` — inscriptions par semaine | Admin |
| 5.1.7 | `GET /admin/analytics/stations/activity` — activité par gare | Admin |
| 5.1.8 | `GET /admin/financial/metrics` — métriques financières | Admin |
| 5.1.9 | `GET /admin/financial/daily-revenue` — revenus par jour | Admin |
| 5.1.10 | `GET /admin/financial/payment-methods` — stats par méthode | Admin |
| 5.1.11 | `GET /admin/financial/top-companies` — classement sociétés | Admin |

**Tests :**
```
✅ GET /dashboard/overview → { totalRevenue, totalBookings, totalUsers, ... }
✅ GET /admin/financial/metrics?period=week → données agrégées
✅ Tous protégés @Roles('ADMIN')
```

---

### Module 5.2 — Users Admin + Passengers

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 5.2.1 | `UsersModule` + service + controller | — |
| 5.2.2 | `GET /users`, `GET /users/:id`, `PUT /users/:id` | Admin |
| 5.2.3 | `GET /admin/passengers` — liste passagers | Admin |
| 5.2.4 | `PATCH /admin/passengers/:id` — modifier | Admin |
| 5.2.5 | `POST /admin/passengers/:id/suspend` + `/reactivate` | Admin |
| 5.2.6 | `DELETE /admin/passengers/:id` | Admin |

**Tests :**
```
✅ GET /admin/passengers → liste paginée avec filtres
✅ POST /admin/passengers/:id/suspend → is_active = false
✅ POST /admin/passengers/:id/reactivate → is_active = true
```

---

### Module 5.3 — Audit Logs

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 5.3.1 | Migration 016 : créer tables `audit_logs`, `security_events`, `blocked_ips` | DB |
| 5.3.2 | `AuditInterceptor` global — log chaque mutation (POST, PUT, DELETE) automatiquement | — |
| 5.3.3 | `GET /logs` — filtres (action, entity_type, severity, date range, pagination) | Admin |
| 5.3.4 | `GET /logs/:id` — détail | Admin |
| 5.3.5 | `GET /logs/stats` — agrégation | Admin |
| 5.3.6 | `GET /logs/export?format=csv` — export | Admin |

**Tests :**
```
✅ Toute requête POST/PUT/DELETE crée un audit_log automatiquement
✅ GET /logs?severity=critical → filtre fonctionne
✅ GET /logs/export?format=csv → fichier CSV valide
```

---

### Module 5.4 — Security

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 5.4.1 | `POST /admin/security/change-password` | Admin |
| 5.4.2 | 2FA TOTP (enable/verify/disable) avec `speakeasy` | Admin |
| 5.4.3 | `GET /admin/security/sessions` + revoke + revoke-all | Admin |
| 5.4.4 | `GET /sessions` — gestion sessions globale (pagination, filtres) | Admin |
| 5.4.5 | `POST /sessions/block-ip` + `GET /sessions/blocked-ips` + `DELETE /sessions/blocked-ips/:ip` | Admin |
| 5.4.6 | `GET /admin/security/events` — logs sécurité | Admin |

**Tests :**
```
✅ POST /admin/security/change-password avec ancien mot de passe valide → OK
✅ POST /admin/security/change-password avec ancien mot de passe faux → 401
✅ 2FA enable → retourne QR code base64
✅ 2FA verify avec bon TOTP → activé
✅ Session revoke → token invalidé
✅ Block IP → requêtes depuis cette IP rejetées
```

---

### ✅ CHECKPOINT SEMAINE 5

```
□ Dashboard avec vraies métriques agrégées de la DB
□ Gestion utilisateurs/passagers (suspend, reactivate, delete)
□ Audit logs automatiques sur toutes les mutations
□ Security : 2FA, sessions, IP blocking
□ TOUS les tests passent
```

---

## SEMAINE 6 — FONCTIONNALITÉS AVANCÉES

### Module 6.1 — Notifications Center

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 6.1.1 | Migration 020 : tables `notification_templates`, `notification_campaigns`, `scheduled_notifications`, `automation_rules` | DB |
| 6.1.2 | `GET /admin/notifications` — inbox admin | Admin |
| 6.1.3 | `POST /admin/notifications/send-bulk` — envoi en masse | Admin |
| 6.1.4 | `GET /admin/notifications/stats` — stats globales | Admin |
| 6.1.5 | CRUD templates (`/admin/notifications/templates`) | Admin |
| 6.1.6 | CRUD automation rules (`/admin/notifications/automation-rules`) | Admin |
| 6.1.7 | Scheduled notifications (create + cancel + CRON send) | Admin |
| 6.1.8 | `GET /admin/notifications/history` — campagnes envoyées | Admin |
| 6.1.9 | Mobile : `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` | Mobile |

**Tests :**
```
✅ POST /admin/notifications/send-bulk → crée une campagne + envoie
✅ CRUD templates complet
✅ CRUD automation rules complet
✅ Scheduled notification → envoyée au moment prévu (CRON)
✅ Mobile : marquer comme lu fonctionne
```

---

### Module 6.2 — Referrals (Parrainage)

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 6.2.1 | Migration 014 : tables `referrals`, `referral_coupons`, `referral_config` | DB |
| 6.2.2 | Auto-génération code parrainage à l'inscription (`FT-XXX-YYYY`) | — |
| 6.2.3 | Mobile : `GET /referrals/my-code` + `GET /referrals/stats` + `POST /referrals/redeem` | Mobile |
| 6.2.4 | Logique : parrainage validé quand le filleul fait sa 1ère réservation | — |
| 6.2.5 | Conversion points → coupon (avec montants configurables) | — |
| 6.2.6 | Admin : `GET /admin/referrals` + stats + config | Admin |

**Tests :**
```
✅ Inscription avec code parrainage → referral créé (status=pending)
✅ 1ère réservation du filleul → referral validé + points attribués au parrain
✅ POST /referrals/redeem avec assez de points → coupon généré
✅ POST /referrals/redeem sans assez de points → 400
✅ Coupon appliqué au booking → montant réduit
```

---

### Module 6.3 — Support & Incidents

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 6.3.1 | Migration 017 : tables `support_tickets`, `support_messages`, `incidents` | DB |
| 6.3.2 | Mobile : `POST /support/contact` (créer ticket) + `GET /support/my-tickets` | Mobile |
| 6.3.3 | Admin : CRUD `/support-tickets` + assign + resolve + messages | Admin |
| 6.3.4 | Admin : CRUD `/incidents` + assign + resolve | Admin |

**Tests :**
```
✅ POST /support/contact → crée un ticket (status=open)
✅ Admin assign → status=in-progress
✅ Admin resolve → status=resolved
✅ Messages dans un fil de discussion
```

---

### Module 6.4 — Policies

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 6.4.1 | Migration 015 : table `platform_policies` | DB |
| 6.4.2 | Admin : CRUD `/policies/platform` + publish + archive | Admin |
| 6.4.3 | Admin : CRUD `/policies/operator` | Admin |
| 6.4.4 | Mobile : `GET /policies` (seules les publiées) | Mobile |

**Tests :**
```
✅ Admin crée → status=draft
✅ Admin publie → status=published, visible côté mobile
✅ Admin archive → n'apparaît plus côté mobile
✅ GET /policies (mobile) → seulement published
```

---

### ✅ CHECKPOINT SEMAINE 6

```
□ Centre de notifications complet (templates, campaigns, automation, scheduled)
□ Parrainage fonctionnel (code → filleul → validation → points → coupon)
□ Support tickets + incidents (CRUD + workflow)
□ Policies (CRUD + publish/archive)
□ TOUS les tests passent
```

---

## SEMAINE 7 — APP SOCIETE + INTÉGRATIONS

### Module 7.1 — Societe : Auth & Managers

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 7.1.1 | `POST /auth/societe/login` — login societe (même auth, role=OPERATOR) | Societe |
| 7.1.2 | `GET /societe/managers` + CRUD | Societe |
| 7.1.3 | `GET /societe/cashiers` + CRUD | Societe |

---

### Module 7.2 — Societe : Routes & Scheduling

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 7.2.1 | `GET /societe/routes` + CRUD | Societe |
| 7.2.2 | `GET /societe/schedule-templates` + CRUD | Societe |
| 7.2.3 | `GET /societe/trips` + CRUD | Societe |
| 7.2.4 | `GET /societe/price-segments` + history | Societe |

---

### Module 7.3 — Societe : Cashier Operations

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 7.3.1 | `POST /societe/tickets` — vente en gare (cash) | Societe |
| 7.3.2 | `POST /societe/tickets/scan` — scan QR embarquement | Societe |
| 7.3.3 | `GET /societe/cash-transactions` + POST | Societe |

---

### Module 7.4 — Settings & Exports

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 7.4.1 | `GET /settings` + `PUT /settings` | Admin |
| 7.4.2 | `POST /settings/logo` — upload | Admin |
| 7.4.3 | `GET /settings/export` + `POST /settings/import` | Admin |

---

### Module 7.5 — Intégrations Admin

| Étape | Tâche | Endpoint |
|-------|-------|----------|
| 7.5.1 | Migration 018 : tables `integrations`, `integration_alert_rules`, `integration_alerts` | DB |
| 7.5.2 | CRUD intégrations + test connectivity | Admin |
| 7.5.3 | Alert rules + fired alerts + acknowledge | Admin |
| 7.5.4 | PaydunYa admin (config, credentials, mode, channels, health, stats, webhook-logs) | Admin |
| 7.5.5 | WhatsApp admin (account info, test message, health, delivery stats) | Admin |
| 7.5.6 | AWS admin (health, S3 stats, CDN stats, Lightsail metrics, purge, restart) | Admin |

---

### ✅ CHECKPOINT SEMAINE 7

```
□ App Societe complète (managers, cashiers, routes, trips, tickets, cash)
□ Settings + import/export
□ Intégrations admin (PaydunYa, WhatsApp, AWS)
□ TOUS les tests passent
```

---

## SEMAINE 8 — INTÉGRATIONS RÉELLES + DÉPLOIEMENT

### Module 8.1 — PaydunYa (Prod)

| Étape | Tâche |
|-------|-------|
| 8.1.1 | Installer SDK PaydunYa + configurer clés live |
| 8.1.2 | Créer invoices réelles (Orange Money, Moov, Wave, Carte) |
| 8.1.3 | Recevoir + vérifier webhooks IPN en production |
| 8.1.4 | Tester le flow réel : initier paiement → callback → confirm booking → ticket |

---

### Module 8.2 — Firebase Push + Infobip OTP

| Étape | Tâche |
|-------|-------|
| 8.2.1 | `firebase-admin` pour push notifications (FCM) |
| 8.2.2 | Enregistrement device tokens (`POST /user/devices`) |
| 8.2.3 | Push automatique : booking confirmed, trip reminder 1h avant, etc. |
| 8.2.4 | Infobip : envoi OTP réel pour vérification téléphone |
| 8.2.5 | Infobip : WhatsApp templates transactionnels |

---

### Module 8.3 — AWS S3 + Upload

| Étape | Tâche |
|-------|-------|
| 8.3.1 | `@aws-sdk/client-s3` pour upload fichiers |
| 8.3.2 | Presigned URLs pour upload direct depuis le client |
| 8.3.3 | CloudFront pour serving images/médias |

---

### Module 8.4 — Vehicle GPS (WebSocket)

| Étape | Tâche |
|-------|-------|
| 8.4.1 | `@nestjs/websockets` Gateway pour tracking GPS |
| 8.4.2 | Driver publie position → Redis (dernière) + DB (historique) |
| 8.4.3 | Passagers abonnés à un trip reçoivent les updates en temps réel |
| 8.4.4 | `GET /vehicle/trips/:tripId/location` — dernière position |

---

### Module 8.5 — Seed Data

| Seed | Données |
|------|---------|
| Stations | 15+ gares (Ouagadougou, Bobo-Dioulasso, Koudougou, Banfora, etc.) |
| Opérateurs | 5+ compagnies réelles (STAF, TSR, TCV, Rakieta, SOTRAO) |
| Amenities | WiFi, Climatisation, Prises USB, Toilettes, etc. |
| Admin user | Super admin (email + mot de passe) |
| Referral config | Config par défaut (points, coûts coupons) |
| Platform policies | CGU + Politique de confidentialité |

---

### Module 8.6 — Déploiement

| Étape | Tâche |
|-------|-------|
| 8.6.1 | `Dockerfile` (multi-stage: builder → production) |
| 8.6.2 | `docker-compose.prod.yml` (PostgreSQL, Redis, Backend, Nginx) |
| 8.6.3 | AWS Lightsail : instance + IP statique + domaine |
| 8.6.4 | SSL avec Certbot (Let's Encrypt) |
| 8.6.5 | Variables d'environnement production |
| 8.6.6 | Nginx reverse proxy |
| 8.6.7 | CI/CD basique (GitHub Actions → build → deploy) |

---

### Module 8.7 — Tests Finaux E2E

```
FLOW COMPLET — TEST DE BOUT EN BOUT :

1. Register user → verify OTP → login → get tokens
2. Search trips → select → view seats
3. Hold booking → initiate payment
4. PaydunYa webhook → confirm booking → generate tickets
5. View tickets → scan QR (validate)
6. Leave review → verify operator rating updated
7. Use referral code → filleul books → points awarded
8. Redeem points → coupon → apply coupon to new booking
9. Admin: view dashboard → manage users → view audit logs
10. Societe: login → create trip → sell ticket at counter → view cash
```

---

### ✅ CHECKPOINT FINAL

```
□ Paiements réels PaydunYa fonctionnent
□ Push notifications Firebase
□ OTP Infobip
□ Upload S3
□ GPS WebSocket temps réel
□ Seed data chargé
□ Déployé sur AWS Lightsail
□ SSL actif
□ Test E2E complet du flow passager → booking → ticket → validation
□ Test E2E admin dashboard + CRUD
□ Test E2E societe operations
□ 0 duplication, 0 donnée en dur, 100% réutilisable
```

---

## RÉSUMÉ CHIFFRÉ

| Métrique | Valeur |
|----------|--------|
| **Modules NestJS** | ~25 |
| **Endpoints API** | ~180+ |
| **Entités TypeORM** | 51 (31 existantes + 20 nouvelles) |
| **Migrations SQL** | 21 (13 existantes + 8 nouvelles) |
| **Tests unitaires** | ~200+ |
| **Tests E2E** | ~50+ |
| **Durée** | 8 semaines (3 avril → 31 mai 2026) |
| **Deadline** | 31 mai 2026 |
