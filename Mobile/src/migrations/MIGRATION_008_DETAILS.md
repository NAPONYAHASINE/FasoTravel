# Migration 008 — Details & Apply Instructions

Purpose
-------
This file documents Migration 008 (`008_additional_tables.sql`) which adds the following items:

- `story_categories` and `operator_stories.category_id`
- `user_operator_roles` (multi-tenant admin roles)
- `amenity_types` and `vehicle_amenities` (normalization)
- `reviews` and `review_helpfulness`
- `trip_schedules` (optional recurring trips)
- `operator_branches` (operator sub-branches / stations)

Idempotence
----------
The migration uses `IF NOT EXISTS` guards where applicable so it is safe to re-run in most environments. Always run on a development copy first.

PowerShell: Apply migration (example)
------------------------------------
1) Ensure env vars are set (or adjust values):

```powershell
$PGHOST = 'localhost'
$PGPORT = 5432
$PGUSER = 'postgres'
$PGDB   = 'fasotravel_dev'
$PGPASS = 'your_password'
```

2) Run the SQL file with `psql` (Windows PowerShell syntax):

```powershell
$env:PGPASSWORD = $PGPASS;
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDB -f "src/migrations/008_additional_tables.sql";

# Unset the password variable afterwards
Remove-Variable PGPASS -ErrorAction SilentlyContinue
```

Notes on verification
---------------------
After running the migration, run these verification queries to confirm schema changes:

- Check story_categories exists and sample rows:

```sql
SELECT * FROM story_categories LIMIT 10;
```

- Confirm operator_stories has `category_id` column:

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'operator_stories' AND column_name = 'category_id';
```

- Verify user_operator_roles table:

```sql
SELECT * FROM user_operator_roles LIMIT 10;
```

- Verify amenity types + sample vehicle amenities:

```sql
SELECT * FROM amenity_types LIMIT 20;
SELECT * FROM vehicle_amenities LIMIT 20;
```

- Verify reviews table and index:

```sql
SELECT COUNT(*) FROM reviews;
SELECT * FROM reviews WHERE status = 'APPROVED' LIMIT 5;
```

Rollback (if needed)
---------------------
A rollback snippet is included at the bottom of the migration file. Use it carefully; review dependencies before dropping tables in production.

Next steps (recommended)
------------------------
1. Run migration on dev database and paste verification outputs here.
2. Update `MIGRATIONS_INDEX.md` and `COMPLETION_SUMMARY.md` to reference the new migration.
3. Implement backend endpoints (admin + public) for story categories, branch management, amenity types, reviews, and operator roles.
4. Update frontend forms: operator creation flow must collect `branches` data and POST it to the proper endpoint.
5. Migrate any legacy `vehicles.amenities` TEXT[] arrays into the new normalized schema.

If you want, I can now:
- Prepare the backend route examples and SQL queries for the new endpoints, and/or
- Update `MIGRATIONS_INDEX.md` to include Migration 008, and/or
- Generate the frontend form changes (React + TSX) for operator creation including branches.

Tell me which next action to perform and I will proceed.
