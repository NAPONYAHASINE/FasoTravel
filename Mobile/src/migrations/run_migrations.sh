#!/bin/bash
# ================================================
# run_migrations.sh
# Exécute toutes les migrations PostgreSQL dans l'ordre
# Usage: ./run_migrations.sh
# ================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MIGRATIONS_DIR="./src/migrations"
DB_URL="${DATABASE_URL}"

# If DATABASE_URL not set, use default
if [ -z "$DB_URL" ]; then
    DB_URL="postgresql://faso_admin:password@localhost:5432/faso_travel"
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, using default: $DB_URL${NC}"
fi

# Array of migrations in order
migrations=(
    "001_create_operator_stories.sql"
    "002_create_advertisements.sql"
    "003_create_core_schema.sql"
    "004_create_support_tables.sql"
    "005_seed_core_data.sql"
    "006_advanced_triggers_indexes.sql"
    "007_seed_user_data.sql"
)

echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}FasoTravel Database Migrations${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "Database: $DB_URL"
echo -e "Directory: $MIGRATIONS_DIR"
echo ""

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
if psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo -e "${RED}   Check DATABASE_URL or PostgreSQL server${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Starting migrations...${NC}"
echo ""

# Execute each migration
success_count=0
fail_count=0

for migration in "${migrations[@]}"; do
    migration_path="$MIGRATIONS_DIR/$migration"
    
    if [ ! -f "$migration_path" ]; then
        echo -e "${RED}❌ $migration - FILE NOT FOUND${NC}"
        ((fail_count++))
        continue
    fi
    
    echo -e "${YELLOW}Executing: $migration${NC}"
    
    if psql "$DB_URL" -f "$migration_path" > /tmp/migration_output.log 2>&1; then
        echo -e "${GREEN}✓ $migration${NC}"
        ((success_count++))
    else
        echo -e "${RED}❌ $migration${NC}"
        echo -e "${RED}   Error output:${NC}"
        cat /tmp/migration_output.log | sed 's/^/   /'
        ((fail_count++))
        # Continue to next migration instead of stopping
    fi
    
    echo ""
done

# Summary
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}Migration Summary${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "${GREEN}✓ Successful: $success_count${NC}"
echo -e "${RED}❌ Failed: $fail_count${NC}"

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations completed successfully!${NC}"
    
    # Run validation queries
    echo ""
    echo -e "${YELLOW}Running validation queries...${NC}"
    psql "$DB_URL" << EOF
    
    -- Count tables
    \echo 'Tables created:'
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    -- Count data
    \echo ''
    \echo 'Data rows:'
    SELECT 'OPERATORS' as table_name, COUNT(*) as count FROM operators
    UNION ALL SELECT 'TRIPS', COUNT(*) FROM trips
    UNION ALL SELECT 'SEGMENTS', COUNT(*) FROM segments
    UNION ALL SELECT 'USERS', COUNT(*) FROM users
    UNION ALL SELECT 'SEATS', COUNT(*) FROM seats
    UNION ALL SELECT 'BOOKINGS', COUNT(*) FROM bookings
    UNION ALL SELECT 'TICKETS', COUNT(*) FROM tickets
    ORDER BY 1;
    
    -- Validate availability rule
    \echo ''
    \echo 'Seat availability validation:'
    SELECT 
      trip_id,
      available_seats as declared,
      (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id) as calculated,
      CASE 
        WHEN available_seats = (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id)
        THEN '✓ OK'
        ELSE '❌ MISMATCH'
      END as status
    FROM trips t
    ORDER BY trip_id;
    
EOF
    
    exit 0
else
    echo -e "${RED}❌ Some migrations failed!${NC}"
    echo -e "${RED}   Check error messages above${NC}"
    exit 1
fi
