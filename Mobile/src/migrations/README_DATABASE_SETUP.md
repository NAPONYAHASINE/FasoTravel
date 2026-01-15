# FasoTravel - Database Setup & Backend Preparation

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration PostgreSQL](#configuration-postgresql)
3. [Exécution des migrations](#exécution-des-migrations)
4. [Validation de la base de données](#validation-de-la-base-de-données)
5. [Architecture de données](#architecture-de-données)
6. [Règles métier implémentées](#règles-métier-implémentées)
7. [Préparation du backend](#préparation-du-backend)

---

## Prérequis

### Logiciels requis

- **PostgreSQL 12+** (recommandé: PostgreSQL 14 ou 15)
- **psql** (client PostgreSQL)
- **Node.js 16+** (pour le backend Express)
- **npm** ou **yarn**
- Un compte admin PostgreSQL ou utilisateur avec droits de création de base

### Vérification de l'installation

```bash
# Vérifier PostgreSQL
psql --version

# Vérifier Node.js
node --version
npm --version
```

---

## Configuration PostgreSQL

### 1. Création de la base de données

```bash
# En tant qu'utilisateur admin PostgreSQL
sudo -u postgres psql

# Dans psql:
CREATE DATABASE faso_travel;
CREATE USER faso_admin WITH PASSWORD 'your_secure_password_here';
ALTER ROLE faso_admin SET client_encoding TO 'utf8';
ALTER ROLE faso_admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE faso_admin SET default_transaction_deferrable TO on;
ALTER ROLE faso_admin SET default_time_zone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE faso_travel TO faso_admin;
\q
```

### 2. Configuration de la chaîne de connexion

Créer un fichier `.env` à la racine du backend:

```env
# Database Connection
DATABASE_URL=postgresql://faso_admin:your_secure_password_here@localhost:5432/faso_travel
DB_HOST=localhost
DB_PORT=5432
DB_NAME=faso_travel
DB_USER=faso_admin
DB_PASSWORD=your_secure_password_here

# Node Environment
NODE_ENV=development
PORT=3000

# JWT Secrets
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Payment Provider (optionnel)
PAYMENT_PROVIDER_KEY=your_payment_key_here

# Logs
LOG_LEVEL=debug
```

### 3. Test de la connexion

```bash
# Test direct
psql postgresql://faso_admin:your_secure_password_here@localhost:5432/faso_travel

# Si succès, taper:
\q
```

---

## Exécution des migrations

### Ordre d'exécution obligatoire

Les migrations doivent être exécutées dans l'ordre strict suivant:

| # | Fichier | Description | Objets créés |
|---|---------|-------------|--------------|
| 1 | `001_create_operator_stories.sql` | Stories des opérateurs | `operator_stories`, `story_views` |
| 2 | `002_create_advertisements.sql` | Système de publicités | `advertisements`, `ad_analytics` |
| 3 | `003_create_core_schema.sql` | Schéma principal | users, operators, stations, vehicles, trips, segments, seats, bookings, tickets |
| 4 | `004_create_support_tables.sql` | Tables support | sessions, devices, payments, notifications, analytics |
| 5 | `005_seed_core_data.sql` | Données de test (opérateurs, trajets) | Données de dev/test |
| 6 | `006_advanced_triggers_indexes.sql` | Validation métier & index | Triggers, functions, indexes, views |
| 7 | `007_seed_user_data.sql` | Utilisateurs & transactions | Données test bookings/payments |

### Méthode 1: Script bash automatisé

```bash
#!/bin/bash
# save as: run_migrations.sh

DB_URL="postgresql://faso_admin:password@localhost:5432/faso_travel"
MIGRATIONS_DIR="./src/migrations"

for migration in \
  001_create_operator_stories.sql \
  002_create_advertisements.sql \
  003_create_core_schema.sql \
  004_create_support_tables.sql \
  005_seed_core_data.sql \
  006_advanced_triggers_indexes.sql \
  007_seed_user_data.sql
do
  echo "Exécuting: $migration"
  psql "$DB_URL" -f "$MIGRATIONS_DIR/$migration"
  if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'exécution de $migration"
    exit 1
  fi
  echo "✓ $migration exécutée"
done

echo "✓ Toutes les migrations exécutées avec succès!"
```

Exécution:

```bash
chmod +x run_migrations.sh
./run_migrations.sh
```

### Méthode 2: Exécution manuelle (psql)

```bash
# Pour chaque migration dans l'ordre:
psql postgresql://faso_admin:password@localhost:5432/faso_travel \
  -f src/migrations/001_create_operator_stories.sql

psql postgresql://faso_admin:password@localhost:5432/faso_travel \
  -f src/migrations/002_create_advertisements.sql

psql postgresql://faso_admin:password@localhost:5432/faso_travel \
  -f src/migrations/003_create_core_schema.sql

# ... etc pour 004, 005, 006, 007
```

### Méthode 3: Connexion interactive (psql)

```bash
psql postgresql://faso_admin:password@localhost:5432/faso_travel

-- Puis dans psql, exécuter chaque migration:
\i src/migrations/001_create_operator_stories.sql
\i src/migrations/002_create_advertisements.sql
\i src/migrations/003_create_core_schema.sql
-- ... etc
```

---

## Validation de la base de données

### 1. Vérifier les tables créées

```sql
-- Se connecter à la base
psql postgresql://faso_admin:password@localhost:5432/faso_travel

-- Liste toutes les tables
\dt

-- Résultat attendu:
-- Schema |               Name                | Type  | Owner
-- --------+-----------------------------------+-------+----------
-- public | advertisements                    | table | faso_admin
-- public | analytics_events                  | table | faso_admin
-- public | bookings                          | table | faso_admin
-- public | notifications                     | table | faso_admin
-- public | operator_stories                  | table | faso_admin
-- public | operators                         | table | faso_admin
-- public | payments                          | table | faso_admin
-- public | seat_map_configs                  | table | faso_admin
-- public | segments                          | table | faso_admin
-- public | seats                             | table | faso_admin
-- public | stations                          | table | faso_admin
-- public | tickets                           | table | faso_admin
-- public | trips                             | table | faso_admin
-- public | users                             | table | faso_admin
-- public | user_devices                      | table | faso_admin
-- public | user_sessions                     | table | faso_admin
-- public | vehicles                          | table | faso_admin
```

### 2. Vérifier les données de test

```sql
-- Compter les données de test
SELECT 'OPERATORS' as table_name, COUNT(*) as count FROM operators
UNION ALL SELECT 'STATIONS', COUNT(*) FROM stations
UNION ALL SELECT 'VEHICLES', COUNT(*) FROM vehicles
UNION ALL SELECT 'TRIPS', COUNT(*) FROM trips
UNION ALL SELECT 'SEGMENTS', COUNT(*) FROM segments
UNION ALL SELECT 'USERS', COUNT(*) FROM users
UNION ALL SELECT 'BOOKINGS', COUNT(*) FROM bookings
UNION ALL SELECT 'SEATS', COUNT(*) FROM seats
UNION ALL SELECT 'TICKETS', COUNT(*) FROM tickets;

-- Résultat attendu:
-- table_name  | count
-- ----------+-------
-- OPERATORS  |     5
-- STATIONS   |     7
-- VEHICLES   |     5
-- TRIPS      |     6
-- SEGMENTS   |     8
-- USERS      |     3
-- BOOKINGS   |     3
-- SEATS      |    74
-- TICKETS    |     6
```

### 3. Vérifier la règle métier (disponibilité sièges)

```sql
-- La règle: trip.available_seats = MIN(segment.available_seats)
-- Tous les trips doivent passer cette vérification:

SELECT 
  t.trip_id,
  t.operator_name,
  t.available_seats as declared_seats,
  (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id) as calculated_min,
  CASE 
    WHEN t.available_seats = (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id)
    THEN '✓ OK'
    ELSE '❌ MISMATCH'
  END as status
FROM trips t
ORDER BY t.trip_id;

-- Résultat attendu: toutes les lignes avec status = '✓ OK'
```

### 4. Vérifier les triggers et fonctions

```sql
-- Lister les fonctions
\df+

-- Lister les triggers
SELECT event_object_table, trigger_name, event_manipulation
FROM information_schema.triggers
ORDER BY event_object_table;

-- Résultat attendu: 12 triggers
-- - trg_validate_trip_available_seats (BEFORE INSERT/UPDATE on trips)
-- - trg_update_trip_on_segment_change (AFTER INSERT/UPDATE on segments)
-- - trg_validate_seat_consistency (BEFORE INSERT/UPDATE on seats)
-- - trg_validate_booking_consistency (BEFORE INSERT/UPDATE on bookings)
-- - trg_validate_segment_times (BEFORE INSERT/UPDATE on segments)
-- - trg_validate_trip_times (BEFORE INSERT/UPDATE on trips)
-- etc...
```

### 5. Vérifier les indexes

```sql
-- Lister tous les indexes
\di+

-- Compter les indexes créés
SELECT COUNT(*) as total_indexes 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Résultat attendu: 20+ indexes créés
```

### 6. Vérifier les views

```sql
-- Lister les views
\dv

-- Résultat attendu:
-- vw_trips_availability
-- vw_segments_details
-- vw_seats_by_trip
-- vw_trips_inconsistencies
```

---

## Architecture de données

### Diagramme entités-relations simplifié

```
OPERATORS (5)
  ├─→ VEHICLES (5)
  │    └─→ SEAT_MAP_CONFIGS (3)
  │
  ├─→ TRIPS (6)
  │    ├─→ SEGMENTS (8)
  │    ├─→ SEATS (74)
  │    ├─→ BOOKINGS (3)
  │    │    ├─→ PAYMENTS (2)
  │    │    └─→ TICKETS (6)
  │    │         └─→ TICKET_TRANSFERS
  │    └─→ TICKET_TRANSFERS
  │
  └─→ STATIONS (7)

USERS (3)
  ├─→ USER_SESSIONS
  ├─→ USER_DEVICES
  ├─→ BOOKINGS → TRIPS → OPERATORS
  ├─→ PAYMENTS
  ├─→ NOTIFICATIONS
  └─→ ANALYTICS_EVENTS

OPERATOR_STORIES & ADVERTISEMENTS (marketing)
AD_ANALYTICS
```

### Capacités de sièges (test data)

| Trip | From | To | Capacity | Available | Utilisation |
|------|------|----|---------|-----------|-----------:|
| TRIP_001 | Ouaga | Bobo | 45 | 12 | 73% |
| TRIP_002 | Ouaga | Bobo | 30 | 8 | 73% |
| TRIP_002B | Ouaga | Bobo | 35 | 22 | 37% |
| TRIP_003 | Bobo | Ouaga | 45 | 14 | 69% |
| TRIP_004 | Bobo | Ouaga | 45 | 20 | 56% |
| TRIP_005 | Bobo | Ouaga | 30 | 10 | 67% |
| TRIP_006 | Bobo | Ouaga | 35 | 15 | 57% |

---

## Règles métier implémentées

### 1. Disponibilité des sièges (Critique ⚠️)

**Règle:** `trip.available_seats = MIN(segment.available_seats)`

**Logique:**
- Un trajet a plusieurs segments (portions du voyage)
- Un siège est disponible sur tout le trajet seulement s'il l'est sur TOUS les segments
- Donc: places disponibles = minimum des places disponibles sur les segments

**Implémentation:**
- Trigger `trg_validate_trip_available_seats`: Valide avant INSERT/UPDATE trip
- Trigger `trg_update_trip_on_segment_change`: Auto-met à jour après modif segment
- View `vw_trips_inconsistencies`: Détecte les violations

**Exemple:**
```sql
-- TRIP_001 avec 2 segments:
-- SEG_001_1: 12 places dispo
-- SEG_001_2: 18 places dispo
-- → trip.available_seats = MIN(12, 18) = 12 ✓

-- Essayer d'insérer trip.available_seats = 15:
-- → ERREUR! Trigger bloque (15 > min de 12)
```

### 2. Cohérence des sièges

**Règle:** L'état (`status`) d'un siège doit correspondre aux données de réservation

```sql
-- Valide:
status='available' → user_id=NULL, hold_expires_at=NULL
status='held'      → hold_expires_at IS NOT NULL
status='booked'    → user_id IS NOT NULL

-- Invalide:
status='booked' avec user_id=NULL   → ❌ Trigger bloque
status='held' sans hold_expires_at  → ❌ Trigger bloque
```

### 3. Cohérence des réservations

**Règle:** L'état (`status`) d'une réservation doit correspondre aux paiements

```sql
-- Valide:
status='held'  → hold_expires_at IS NOT NULL
status='paid'  → payment_id IS NOT NULL

-- Invalide:
status='paid' sans payment_id      → ❌ Trigger bloque
status='held' sans hold_expires_at → ❌ Trigger bloque
```

### 4. Chronologie des trajets

**Règle:** `arrival_time > departure_time` pour trips et segments

```sql
-- Valide:
departure: 07:00, arrival: 13:00 → ✓

-- Invalide:
departure: 13:00, arrival: 13:00 → ❌ Trigger bloque
departure: 14:00, arrival: 13:00 → ❌ Trigger bloque
```

---

## Préparation du backend

### 1. Architecture Express recommandée

```
backend/
├── config/
│   ├── database.js      # Pool PostgreSQL
│   └── env.js           # Variables d'environnement
├── routes/
│   ├── auth.js          # Login/Register
│   ├── trips.js         # GET /trips, GET /trips/:id
│   ├── bookings.js      # POST /bookings, GET /bookings/:id
│   ├── payments.js      # POST /payments, webhook handlers
│   ├── tickets.js       # GET /tickets, validate QR code
│   ├── operators.js     # GET /operators, GET /operators/:id
│   └── admin.js         # Admin endpoints
├── middleware/
│   ├── auth.js          # JWT validation
│   ├── errorHandler.js  # Error handling
│   └── validation.js    # Input validation
├── models/
│   ├── Trip.js
│   ├── Booking.js
│   ├── Payment.js
│   └── Ticket.js
├── services/
│   ├── tripService.js
│   ├── bookingService.js
│   ├── paymentService.js
│   └── ticketService.js
├── utils/
│   ├── db.js            # DB helpers
│   ├── logger.js        # Logging
│   └── validators.js    # Business logic validation
└── server.js            # Entry point
```

### 2. Dépendances Node.js recommandées

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.8.0",
    "pg-pool": "^3.5.0",
    "dotenv": "^16.0.3",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "joi": "^17.9.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.4.0",
    "supertest": "^6.3.3"
  }
}
```

### 3. Configuration du pool PostgreSQL

```javascript
// backend/config/database.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
```

### 4. Endpoints REST prioritaires

```
# Authentification
POST   /api/auth/register          # Créer compte
POST   /api/auth/login             # Se connecter
POST   /api/auth/refresh-token     # Renouveler JWT

# Trajets
GET    /api/trips                  # Lister (filtres: from, to, date)
GET    /api/trips/:tripId          # Détail + segments + disponibilité
GET    /api/trips/:tripId/seats    # Plan de sièges

# Réservations
POST   /api/bookings               # Créer (seat hold)
GET    /api/bookings/:bookingId    # Détail
PATCH  /api/bookings/:bookingId    # Confirmer (status: held → paid)
DELETE /api/bookings/:bookingId    # Annuler

# Paiements
POST   /api/payments               # Initier paiement
GET    /api/payments/:paymentId    # Statut
POST   /api/payments/webhook       # Webhook provider

# Tickets
GET    /api/tickets/:ticketId      # Détail + QR code
POST   /api/tickets/:ticketId/validate # Valider scan QR
GET    /api/tickets/:ticketId/transfer # Transfert de ticket

# Opérateurs & Stations
GET    /api/operators              # Lister
GET    /api/operators/:operatorId  # Détail
GET    /api/stations               # Lister
```

### 5. Queries SQL essentielles pour backend

```sql
-- 1. Chercher trajets disponibles
SELECT * FROM vw_trips_availability
WHERE from_stop_id = 'OUAGA_CENTRE'
  AND to_stop_id = 'BOBO_CENTRE'
  AND DATE(departure_time) = '2025-11-04'
  AND is_cancelled = false
  AND available_seats > 0
ORDER BY departure_time;

-- 2. Récupérer détail trip + segments + sièges
SELECT t.*, 
       json_agg(json_build_object(
         'segment_id', s.segment_id,
         'from_stop', s.from_stop_name,
         'to_stop', s.to_stop_name,
         'departure', s.departure_time,
         'arrival', s.arrival_time,
         'available_seats', s.available_seats
       )) as segments
FROM trips t
LEFT JOIN segments s ON s.trip_id = t.trip_id
WHERE t.trip_id = $1
GROUP BY t.trip_id;

-- 3. Vérifier disponibilité sièges
SELECT seat_id, seat_number, status
FROM seats
WHERE trip_id = $1 AND status = 'available'
LIMIT $2;

-- 4. Créer réservation (hold)
BEGIN;
  INSERT INTO bookings (booking_id, user_id, trip_id, operator_id, num_passengers, 
                        status, amount, hold_expires_at)
  VALUES ($1, $2, $3, $4, $5, 'held', $6, NOW() + INTERVAL '30 minutes');
  
  UPDATE seats
  SET status = 'held', hold_expires_at = NOW() + INTERVAL '30 minutes'
  WHERE trip_id = $3 AND seat_number = ANY($7) AND status = 'available';
  
  UPDATE trips
  SET available_seats = available_seats - $5
  WHERE trip_id = $3;
COMMIT;

-- 5. Convertir hold → paid (après paiement)
BEGIN;
  UPDATE bookings
  SET status = 'paid', payment_id = $1, hold_expires_at = NULL
  WHERE booking_id = $2;
  
  UPDATE seats
  SET status = 'booked', hold_expires_at = NULL
  WHERE trip_id = (SELECT trip_id FROM bookings WHERE booking_id = $2)
    AND status = 'held';
COMMIT;

-- 6. Annuler réservation (hold expiré ou user cancel)
BEGIN;
  UPDATE seats
  SET status = 'available', hold_expires_at = NULL
  WHERE trip_id = $1 AND status IN ('held', 'booked');
  
  UPDATE bookings
  SET status = 'cancelled', hold_expires_at = NULL
  WHERE trip_id = $1 AND status IN ('held', 'paid');
  
  UPDATE trips
  SET available_seats = total_seats - (
    SELECT COUNT(*) FROM seats 
    WHERE trip_id = $1 AND status = 'booked'
  )
  WHERE trip_id = $1;
COMMIT;
```

### 6. Testing des migrations

```javascript
// backend/tests/migrations.test.js

const pool = require('../config/database');

describe('Database Integrity Tests', () => {
  
  test('should have all tables created', async () => {
    const res = await pool.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    expect(res.rows.length).toBeGreaterThan(15);
  });

  test('should validate seat availability rule', async () => {
    const res = await pool.query(
      `SELECT * FROM vw_trips_inconsistencies`
    );
    expect(res.rows.length).toBe(0); // Aucune violation!
  });

  test('should have all triggers installed', async () => {
    const res = await pool.query(
      `SELECT trigger_name FROM information_schema.triggers 
       WHERE event_object_schema = 'public'`
    );
    expect(res.rows.length).toBeGreaterThanOrEqual(6);
  });

  test('should reject seat with invalid status', async () => {
    await expect(
      pool.query(
        `INSERT INTO seats (seat_id, trip_id, seat_number, status, user_id)
         VALUES ($1, $2, $3, 'booked', NULL)`,
        ['id', 'TRIP_001', 'A1']
      )
    ).rejects.toThrow();
  });

});
```

### 7. Monitoring & Maintenance

```bash
# Health check script (run periodically)
#!/bin/bash

psql $DATABASE_URL << EOF
  -- Vérifier les violations de règles métier
  SELECT * FROM vw_trips_inconsistencies;
  
  -- Vérifier les holds expirant
  SELECT booking_id, hold_expires_at 
  FROM bookings 
  WHERE status = 'held' AND hold_expires_at < NOW();
  
  -- Stats de capacité
  SELECT operator_name, 
         COUNT(*) as total_trips,
         AVG(available_seats) as avg_available
  FROM trips
  GROUP BY operator_name;
  
  -- Analyser table stats pour performance
  VACUUM ANALYZE;
EOF
```

---

## Checklist finale avant production

- [ ] Base de données créée et connectée
- [ ] 7 migrations exécutées sans erreur
- [ ] Toutes les 17+ tables présentes
- [ ] 6 triggers validant règles métier
- [ ] 20+ indexes créés pour performance
- [ ] 4 views disponibles pour requêtes rapides
- [ ] Règle `trip.available_seats = MIN(segments)` validée sur 100%
- [ ] Données de test seeding fonctionnel
- [ ] Données utilisateur (users, bookings, payments) présentes
- [ ] Backend connecté à la base de données
- [ ] Tests d'intégrité passants
- [ ] Logs et monitoring configurés
- [ ] Backups PostgreSQL programmés

---

## Support et dépannage

### Erreur: "connection refused"

```bash
# Vérifier que PostgreSQL est en cours d'exécution
sudo service postgresql status

# Redémarrer si nécessaire
sudo service postgresql restart

# Sur macOS avec Homebrew:
brew services start postgresql
```

### Erreur: "role does not exist"

```bash
# L'utilisateur 'faso_admin' n'existe pas
# Créer comme indiqué dans la section Configuration
sudo -u postgres psql
CREATE USER faso_admin WITH PASSWORD 'password';
```

### Erreur: "database does not exist"

```bash
# La base de données 'faso_travel' n'existe pas
sudo -u postgres psql
CREATE DATABASE faso_travel;
GRANT ALL PRIVILEGES ON DATABASE faso_travel TO faso_admin;
```

### Rollback d'une migration

```bash
# Chaque fichier migration contient une section ROLLBACK
# Extraire et exécuter manuellement

# Exemple pour 003_create_core_schema.sql:
psql $DATABASE_URL << EOF
DROP TABLE IF EXISTS ticket_transfers CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
-- ... (voir la migration pour la liste complète)
EOF
```

---

## Notes importantes

✓ **Données de test incluses:** 5 opérateurs, 6 trajets, 7 stations, 3 utilisateurs de test
⚠️ **À supprimer avant production:** Commentarisez les migrations 005 et 007 (seed data)
🔐 **Sécurité:** Changez les mots de passe, les JWT secrets, et les clés d'API
📊 **Performance:** Exécutez `VACUUM ANALYZE` régulièrement après modifications massives

---

**Créé avec ❤️ par l'équipe FasoTravel - v1.0.0**
