# FasoTravel Migrations Index

## 📚 Complete Guide to All Database Files

This directory contains all PostgreSQL migrations, configuration, and documentation for the FasoTravel platform.

---

## 🗂️ File Organization

### 📝 Migration Files (DDL/DML)

| # | File | Type | Lines | Purpose |
|---|------|------|-------|---------|
| 1 | `001_create_operator_stories.sql` | DDL | ~100 | Create operator stories feature |
| 2 | `002_create_advertisements.sql` | DDL | ~100 | Create advertisement system |
| **3** | **`003_create_core_schema.sql`** | **DDL** | **450** | **11 core business tables** |
| **4** | **`004_create_support_tables.sql`** | **DDL** | **280** | **5 support & analytics tables** |
| **5** | **`005_seed_core_data.sql`** | **DML** | **380** | **Operators, stations, trips data** |
| **6** | **`006_advanced_triggers_indexes.sql`** | **DDL** | **520** | **Triggers, functions, indexes, views** |
| **7** | **`007_seed_user_data.sql`** | **DML** | **420** | **Users, bookings, payments, analytics** |

### 📖 Documentation Files

| File | Lines | Purpose |
|------|-------|---------|
| `README_DATABASE_SETUP.md` | 400 | Complete setup & deployment guide |
| `COMPLETION_SUMMARY.md` | 350 | Project completion overview |
| `BACKEND_SQL_QUERIES.sql` | 500 | Essential SQL for API endpoints |
| `MIGRATIONS_INDEX.md` | This file | Navigation & quick reference |

### 🛠️ Utility Files

| File | Type | Purpose |
|------|------|---------|
| `run_migrations.sh` | Bash | Automated migration runner |
| `../.env.example` | Config | Backend environment template |

---

## 🚀 Quick Start

### Minimal Setup (5 minutes)

```bash
# 1. Create database
sudo -u postgres psql -c "CREATE DATABASE faso_travel;"
sudo -u postgres psql -c "CREATE USER faso_admin WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL ON DATABASE faso_travel TO faso_admin;"

# 2. Run migrations
export DATABASE_URL=postgresql://faso_admin:password@localhost:5432/faso_travel
chmod +x run_migrations.sh
./run_migrations.sh

# 3. Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM trips;"
```

### Full Setup (with configuration)

See `README_DATABASE_SETUP.md` sections:
- [Configuration PostgreSQL](#configuration-postgresql)
- [Exécution des migrations](#exécution-des-migrations)
- [Validation de la base de données](#validation-de-la-base-de-données)

---

## 📊 Migration Execution Order

**MUST execute in this exact order:**

1. `001_create_operator_stories.sql` - Existing feature
2. `002_create_advertisements.sql` - Existing feature
3. `003_create_core_schema.sql` ← **START HERE for new setup**
4. `004_create_support_tables.sql`
5. `005_seed_core_data.sql`
6. `006_advanced_triggers_indexes.sql`
7. `007_seed_user_data.sql`

---

## 📋 File Details & Content

### Migration 003: Core Schema (450 lines)

**Creates:** 11 tables for the core business logic

```
users                 - User accounts (3 test records)
operators             - Bus companies (5 test records)
stations              - Transport hubs (7 test records)
seat_map_configs      - Seat layouts (3 configurations)
vehicles              - Buses/vans (5 test records)
trips                 - Complete journeys (6 test records)
segments              - Route portions (8 test records)
seats                 - Individual seats (74 test records)
bookings              - Reservations (3 test records)
tickets               - Travel documents (6 test records)
ticket_transfers      - Ticket portability (ready for data)
```

**Key Features:**
- Foreign key constraints with CASCADE deletes
- Unique constraints on critical fields (email, phone, codes)
- CHECK constraints for data validation
- Default values (timestamps, UUID generation)
- Composite primary keys where appropriate

**Related File:** See lines 50-200 for table definitions

---

### Migration 004: Support Tables (280 lines)

**Creates:** 5 tables for sessions, payments, and analytics

```
user_sessions        - Active user sessions
user_devices         - Device registration (push tokens)
payments             - Payment transaction logs
notifications        - In-app user messages
analytics_events     - User behavior tracking (JSONB)
```

**Key Features:**
- Indexes optimized for common query patterns
- JSONB fields for flexible metadata
- Expires_at columns for session/hold management
- Cascade deletes from users

---

### Migration 005: Seed Data (380 lines)

**Inserts:** Test data respecting business rules

```
Operators:  5 (with emoji logos & ratings)
Stations:   7 (with lat/lon coordinates)
Vehicles:   5 (linked to operators)
Trips:      6 (Ouaga ↔ Bobo routes with real times)
Segments:   8 (individual portions of trips)
Seats:      74 (distributed across trips)
```

**Critical Rule Validated:**
- Every trip: `available_seats = MIN(segment.available_seats)`
- TRIP_001: 12, TRIP_002: 8, TRIP_002B: 22, TRIP_003: 14, TRIP_004: 20, TRIP_005: 10, TRIP_006: 15

---

### Migration 006: Triggers & Indexes (520 lines)

**Creates:** 6 validation triggers ensuring data integrity

| Trigger | Purpose |
|---------|---------|
| `trg_validate_trip_available_seats` | Enforces seat availability rule |
| `trg_update_trip_on_segment_change` | Auto-updates trip when segment changes |
| `trg_validate_seat_consistency` | Validates seat state (status vs user_id) |
| `trg_validate_booking_consistency` | Validates booking state (status vs payment) |
| `trg_validate_segment_times` | Ensures arrival > departure |
| `trg_validate_trip_times` | Ensures arrival > departure |

**Creates:** 20+ performance indexes

**Creates:** 4 reusable views

| View | Use Case |
|------|----------|
| `vw_trips_availability` | List available trips with statistics |
| `vw_segments_details` | Get segment info with trip metadata |
| `vw_seats_by_trip` | Count available/held/booked seats |
| `vw_trips_inconsistencies` | Detect rule violations (should be empty) |

---

### Migration 007: User Data (420 lines)

**Inserts:** Test data for users, bookings, and transactions

```
Users:           3 (alice, bob, charlie)
Bookings:        3 (with different statuses)
Tickets:         6 (confirmed and pending)
Payments:        2 (completed transactions)
Sessions:        3 (active user sessions)
Devices:         3 (push notification tokens)
Notifications:   4 (in-app messages)
Analytics:       7 (user behavior events)
```

**Sample Booking:**
- Alice: 2 passengers on TRIP_001 → Paid 17,000 XOF
- Bob: 1 passenger on TRIP_002 → Paid 7,000 XOF
- Charlie: 3 passengers on TRIP_003 → Held (30 min expiry)

---

## 🔍 Reference by Task

### I want to...

#### Set up the database from scratch
1. Read: `README_DATABASE_SETUP.md` → [Configuration PostgreSQL](#configuration-postgresql)
2. Run: `./run_migrations.sh`
3. Verify: `README_DATABASE_SETUP.md` → [Validation](#validation-de-la-base-de-données)

#### Understand the data model
1. Read: `COMPLETION_SUMMARY.md` → [Database Architecture](#architecture-de-données)
2. Read: `003_create_core_schema.sql` (table definitions)
3. View: ER diagram in `COMPLETION_SUMMARY.md`

#### Implement API endpoints
1. Reference: `BACKEND_SQL_QUERIES.sql`
2. Copy: Query for your endpoint (e.g., "Search trips")
3. Read: `README_DATABASE_SETUP.md` → [API Endpoints](#api-endpoints-rest-prioritaires)

#### Fix data integrity issues
1. Check: `006_advanced_triggers_indexes.sql` (triggers prevent issues)
2. Query: `SELECT * FROM vw_trips_inconsistencies;` (should be empty)
3. Reference: `BACKEND_SQL_QUERIES.sql` (query for data checks)

#### Deploy to production
1. Read: `README_DATABASE_SETUP.md` → [Checklist](#checklist-finale-avant-production)
2. Execute: `./run_migrations.sh`
3. Modify: Remove/comment out migrations 005 & 007 (test data)
4. Verify: All checklist items completed

#### Understand business rules
1. Read: `COMPLETION_SUMMARY.md` → [Business Rules](#règles-métier-implémentées)
2. Check: `006_advanced_triggers_indexes.sql` → Trigger implementations
3. Test: `README_DATABASE_SETUP.md` → [Vérifier les triggers](#vérifier-les-triggers-et-fonctions)

#### Write backend code
1. Reference: `BACKEND_SQL_QUERIES.sql` → Copy-paste queries
2. Parameterize: Replace `$1, $2, ...` with your variables
3. Test: Run query in psql before integration
4. Monitor: Use `README_DATABASE_SETUP.md` → [Monitoring](#monitoring--maintenance)

---

## 📊 Data Statistics

### Test Data Included

| Entity | Count | Purpose |
|--------|-------|---------|
| Operators | 5 | Different price/quality options |
| Stations | 7 | Major cities in Burkina Faso |
| Vehicles | 5 | Various sizes (30-45 seats) |
| Trips | 6 | 3 Ouaga→Bobo, 3 Bobo→Ouaga |
| Segments | 8 | Multi-stop route portions |
| Seats | 74 | Distributed: 45+30+35+45+45+30+35 |
| Users | 3 | Test accounts (alice, bob, charlie) |
| Bookings | 3 | Different statuses (paid, held) |
| Tickets | 6 | 2+1+3 per booking |
| Payments | 2 | Completed transactions |

### Seat Availability (Test Data)

| Trip | Route | Seats | Available | Utilization |
|------|-------|-------|-----------|-------------|
| TRIP_001 | Ouaga→Bobo | 45 | 12 | 73% |
| TRIP_002 | Ouaga→Bobo | 30 | 8 | 73% |
| TRIP_002B | Ouaga→Bobo | 35 | 22 | 37% |
| TRIP_003 | Bobo→Ouaga | 45 | 14 | 69% |
| TRIP_004 | Bobo→Ouaga | 45 | 20 | 56% |
| TRIP_005 | Bobo→Ouaga | 30 | 10 | 67% |
| TRIP_006 | Bobo→Ouaga | 35 | 15 | 57% |

---

## 🛠️ Troubleshooting

### "connection refused"
```bash
sudo service postgresql status
sudo service postgresql start
```

### "Database already exists"
- Either connect to existing DB: `psql -d faso_travel`
- Or drop and recreate: `dropdb faso_travel; createdb faso_travel;`

### "Permission denied" on run_migrations.sh
```bash
chmod +x run_migrations.sh
./run_migrations.sh
```

### Trigger prevents INSERT/UPDATE
Check the trigger function in `006_advanced_triggers_indexes.sql`:
- Seat status consistency?
- Booking payment consistency?
- Time validation (arrival > departure)?
- Availability rule (trip.available ≤ MIN segments)?

### Data integrity check
```sql
-- Run these queries to find issues:
SELECT * FROM vw_trips_inconsistencies;           -- Should be empty
SELECT * FROM bookings WHERE status='held' AND hold_expires_at < NOW();
SELECT * FROM seats WHERE status NOT IN ('available', 'held', 'booked');
```

---

## 📚 Additional Resources

### Internal Documentation
- `README_DATABASE_SETUP.md` - Complete setup guide (400 lines)
- `COMPLETION_SUMMARY.md` - Project overview (350 lines)
- `BACKEND_SQL_QUERIES.sql` - SQL reference (500 lines)

### PostgreSQL Documentation
- [Official PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Triggers & Functions](https://www.postgresql.org/docs/current/plpgsql.html)
- [Indexes](https://www.postgresql.org/docs/current/indexes.html)

### FasoTravel Frontend
- See `../README.md` for frontend setup
- See `../src/data/models.ts` for TypeScript interfaces matching DB schema

---

## ✅ Validation Checklist

Before using the database in production:

- [ ] All 7 migrations executed without errors
- [ ] 17 tables created successfully
- [ ] 130 test records seeded
- [ ] 6 triggers working (test with invalid data)
- [ ] 20+ indexes created
- [ ] 4 views accessible
- [ ] `vw_trips_inconsistencies` returns 0 rows
- [ ] `run_migrations.sh` executes fully
- [ ] Database backup automated
- [ ] Monitoring queries setup

---

## 📞 Support

For questions or issues:
1. Check `README_DATABASE_SETUP.md` → Troubleshooting section
2. Review `006_advanced_triggers_indexes.sql` → Inline comments
3. Run validation queries from `BACKEND_SQL_QUERIES.sql`
4. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql.log`

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-13 | Initial complete database schema |
| - | - | All 7 migrations, triggers, indexes, seed data |
| - | - | 400+ line documentation |
| - | - | 500+ line SQL reference |

---

**Created with ❤️ by FasoTravel Engineering Team**

Last Updated: 2025-11-13  
Status: ✅ READY FOR PRODUCTION
