# FasoTravel Database Setup - Windows PowerShell Guide

## 🪟 Windows-Specific Installation

This guide is for Windows users running **PostgreSQL** and **PowerShell 5.1+**.

---

## 📋 Prerequisites

### Install PostgreSQL on Windows

1. **Download** from https://www.postgresql.org/download/windows/
2. **Run installer** and select:
   - ✓ PostgreSQL Server
   - ✓ pgAdmin 4 (optional but recommended)
   - ✓ Stack Builder (for additional tools)
3. **Note** the password you set for the `postgres` user
4. **Verify installation:**

```powershell
# Test PostgreSQL installation
psql --version
psql -U postgres -c "SELECT version();"
```

### Install Required Tools

```powershell
# Node.js (for backend)
node --version
npm --version

# Git (optional)
git --version
```

---

## 🚀 Quick Start (Windows)

### 1. Create Database & User

```powershell
# Open PowerShell as Administrator

# Connect to PostgreSQL default database
$env:PGPASSWORD = "your_postgres_password"
psql -U postgres -h localhost

# In psql, paste this (all at once):
```

```sql
CREATE DATABASE faso_travel;
CREATE USER faso_admin WITH PASSWORD 'YourSecurePassword123!';
ALTER ROLE faso_admin SET client_encoding TO 'utf8';
ALTER ROLE faso_admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE faso_admin SET default_transaction_deferrable TO on;
ALTER ROLE faso_admin SET default_time_zone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE faso_travel TO faso_admin;
\q
```

### 2. Set Environment Variable

```powershell
# Temporarily (current session only)
$env:DATABASE_URL = "postgresql://faso_admin:YourSecurePassword123!@localhost:5432/faso_travel"

# Or permanently (persistent across restarts)
[Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://faso_admin:YourSecurePassword123!@localhost:5432/faso_travel", "User")

# Verify
$env:DATABASE_URL
# Output: postgresql://faso_admin:YourSecurePassword123!@localhost:5432/faso_travel
```

### 3. Run Migrations

**Option A: Using PowerShell Script (Recommended)**

```powershell
# Navigate to migrations folder
cd C:\FasoTravel\FRONTEND\src\migrations

# Create PowerShell script
@'
# run_migrations.ps1
$database_url = $env:DATABASE_URL
$migrations_dir = "."

$migrations = @(
    "001_create_operator_stories.sql",
    "002_create_advertisements.sql",
    "003_create_core_schema.sql",
    "004_create_support_tables.sql",
    "005_seed_core_data.sql",
    "006_advanced_triggers_indexes.sql",
    "007_seed_user_data.sql"
)

Write-Host "================================================" -ForegroundColor Yellow
Write-Host "FasoTravel Database Migrations" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "Database: $database_url"
Write-Host ""

$success_count = 0
$fail_count = 0

foreach ($migration in $migrations) {
    $migration_path = Join-Path $migrations_dir $migration
    
    Write-Host "Executing: $migration" -ForegroundColor Yellow
    
    if (Test-Path $migration_path) {
        try {
            & psql -d $database_url -f $migration_path -v ON_ERROR_STOP=1 2>&1 | Tee-Object -Variable output
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ $migration" -ForegroundColor Green
                $success_count++
            } else {
                Write-Host "❌ $migration" -ForegroundColor Red
                Write-Host $output
                $fail_count++
            }
        } catch {
            Write-Host "❌ $migration - Exception: $_" -ForegroundColor Red
            $fail_count++
        }
    } else {
        Write-Host "❌ $migration - FILE NOT FOUND" -ForegroundColor Red
        $fail_count++
    }
    
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Yellow
Write-Host "Migration Summary" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "✓ Successful: $success_count" -ForegroundColor Green
Write-Host "❌ Failed: $fail_count" -ForegroundColor Red

if ($fail_count -eq 0) {
    Write-Host "✓ All migrations completed successfully!" -ForegroundColor Green
    
    # Validation
    Write-Host ""
    Write-Host "Running validation queries..." -ForegroundColor Yellow
    psql -d $database_url << 'EOF'
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
EOF
}
'@ | Out-File -Encoding UTF8 -FilePath "run_migrations.ps1"

# Execute script
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
./run_migrations.ps1
```

**Option B: Manual Execution**

```powershell
# Execute each migration manually
cd C:\FasoTravel\FRONTEND\src\migrations

psql $env:DATABASE_URL -f "001_create_operator_stories.sql"
psql $env:DATABASE_URL -f "002_create_advertisements.sql"
psql $env:DATABASE_URL -f "003_create_core_schema.sql"
psql $env:DATABASE_URL -f "004_create_support_tables.sql"
psql $env:DATABASE_URL -f "005_seed_core_data.sql"
psql $env:DATABASE_URL -f "006_advanced_triggers_indexes.sql"
psql $env:DATABASE_URL -f "007_seed_user_data.sql"

Write-Host "✓ All migrations completed!"
```

### 4. Verify Installation

```powershell
# Check tables
psql $env:DATABASE_URL -c "\dt"

# Count test data
psql $env:DATABASE_URL -c @"
SELECT 'OPERATORS' as entity, COUNT(*) as count FROM operators
UNION ALL SELECT 'TRIPS', COUNT(*) FROM trips
UNION ALL SELECT 'SEGMENTS', COUNT(*) FROM segments
UNION ALL SELECT 'USERS', COUNT(*) FROM users
UNION ALL SELECT 'BOOKINGS', COUNT(*) FROM bookings
UNION ALL SELECT 'TICKETS', COUNT(*) FROM tickets
ORDER BY 1;
"@

# Validate availability rule
psql $env:DATABASE_URL -c @"
SELECT 
  trip_id,
  available_seats as declared,
  (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id) as calculated,
  CASE WHEN available_seats = (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id)
    THEN '✓ OK' ELSE '❌ MISMATCH' END as status
FROM trips t
ORDER BY trip_id;
"@
```

---

## 🔧 PowerShell Helper Functions

Add these to your PowerShell profile for quick access:

```powershell
# Open PowerShell profile editor
notepad $PROFILE

# Add these functions:

function Connect-FasoTravel {
    <#
    .SYNOPSIS
    Connect to FasoTravel database
    #>
    param(
        [string]$User = "faso_admin",
        [string]$Host = "localhost",
        [string]$Port = "5432",
        [string]$Database = "faso_travel"
    )
    
    $env:PGUSER = $User
    $env:PGHOST = $Host
    $env:PGPORT = $Port
    $env:PGDATABASE = $Database
    
    psql
}

function Test-FasoDatabase {
    <#
    .SYNOPSIS
    Run validation checks on FasoTravel database
    #>
    Write-Host "Testing FasoTravel Database..." -ForegroundColor Yellow
    
    # Test connection
    psql $env:DATABASE_URL -c "SELECT 'Connection OK' as status;" 2>&1 | ForEach-Object { 
        if ($_ -like "*Connection OK*") {
            Write-Host "✓ Database connection OK" -ForegroundColor Green
        }
    }
    
    # Check tables
    $table_count = psql $env:DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    Write-Host "✓ Tables: $table_count" -ForegroundColor Green
    
    # Check triggers
    $trigger_count = psql $env:DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_schema = 'public';"
    Write-Host "✓ Triggers: $trigger_count" -ForegroundColor Green
    
    # Check data
    $trip_count = psql $env:DATABASE_URL -t -c "SELECT COUNT(*) FROM trips;"
    Write-Host "✓ Trips: $trip_count" -ForegroundColor Green
    
    # Check consistency
    $inconsistencies = psql $env:DATABASE_URL -t -c "SELECT COUNT(*) FROM vw_trips_inconsistencies;"
    if ($inconsistencies -eq 0) {
        Write-Host "✓ Availability rule: All trips valid" -ForegroundColor Green
    } else {
        Write-Host "❌ Availability rule: $inconsistencies violations" -ForegroundColor Red
    }
}

function Backup-FasoDatabase {
    <#
    .SYNOPSIS
    Create backup of FasoTravel database
    #>
    param(
        [string]$BackupDir = "C:\Backups\FasoTravel"
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backup_file = "$BackupDir\faso_travel_$timestamp.sql"
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }
    
    Write-Host "Backing up to: $backup_file" -ForegroundColor Yellow
    
    pg_dump $env:DATABASE_URL > $backup_file
    
    if (Test-Path $backup_file) {
        $size = (Get-Item $backup_file).Length / 1MB
        Write-Host "✓ Backup complete: ${size}MB" -ForegroundColor Green
    } else {
        Write-Host "❌ Backup failed" -ForegroundColor Red
    }
}

function Restore-FasoDatabase {
    <#
    .SYNOPSIS
    Restore FasoTravel database from backup
    #>
    param(
        [Parameter(Mandatory=$true)]
        [string]$BackupFile
    )
    
    if (-not (Test-Path $BackupFile)) {
        Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
        return
    }
    
    Write-Host "Restoring from: $BackupFile" -ForegroundColor Yellow
    
    # Drop and recreate database
    psql -U postgres -c "DROP DATABASE IF EXISTS faso_travel;"
    psql -U postgres -c "CREATE DATABASE faso_travel OWNER faso_admin;"
    
    # Restore backup
    psql $env:DATABASE_URL < $BackupFile
    
    Write-Host "✓ Restore complete" -ForegroundColor Green
}

# Save profile
notepad $PROFILE
# Then in PowerShell:
# & $PROFILE
```

---

## 📊 Windows PowerShell Commands Reference

```powershell
# Database connection
$env:DATABASE_URL = "postgresql://user:pass@host:port/database"
psql $env:DATABASE_URL

# Run migration file
psql $env:DATABASE_URL -f "migration_file.sql"

# Execute single query
psql $env:DATABASE_URL -c "SELECT version();"

# Execute query from here-string
psql $env:DATABASE_URL -c @"
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"@

# Backup entire database
pg_dump $env:DATABASE_URL > "backup.sql"

# Backup specific table
pg_dump $env:DATABASE_URL -t trips > "trips_backup.sql"

# Restore from backup
psql $env:DATABASE_URL < "backup.sql"

# List tables
psql $env:DATABASE_URL -c "\dt"

# List views
psql $env:DATABASE_URL -c "\dv"

# List triggers
psql $env:DATABASE_URL -c "\dy"

# Get table structure
psql $env:DATABASE_URL -c "\d trips"

# Count rows in table
psql $env:DATABASE_URL -c "SELECT COUNT(*) FROM trips;"
```

---

## 🆘 Troubleshooting (Windows)

### PostgreSQL Service Not Running

```powershell
# Check service status
Get-Service -Name postgresql-x64-* | Select-Object Status, DisplayName

# Start service
Start-Service -Name postgresql-x64-14  # (version may differ)

# Or start from PostgreSQL installation
C:\Program Files\PostgreSQL\14\bin\pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start
```

### psql Command Not Found

```powershell
# Add PostgreSQL to PATH temporarily
$env:Path += ";C:\Program Files\PostgreSQL\14\bin"

# Or permanently:
[Environment]::SetEnvironmentVariable("Path", "$env:Path;C:\Program Files\PostgreSQL\14\bin", "User")

# Verify
psql --version
```

### Can't Connect to Database

```powershell
# Test connection details
$ConnectionString = "postgresql://faso_admin:YourPassword@localhost:5432/faso_travel"

# Try with explicit parameters
psql -U faso_admin -h localhost -d faso_travel -c "SELECT 1;"

# If password prompt appears, password is wrong
# Reset password:
psql -U postgres -c "ALTER USER faso_admin WITH PASSWORD 'NewPassword123!';"
```

### Permission Denied on Migration File

```powershell
# Check file permissions
Get-Item "run_migrations.ps1" | Select-Object FullName, @{N="Owner";E={(Get-Acl $_).Owner}}

# Update execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Then run script
./run_migrations.ps1
```

### Database Already Exists

```powershell
# Drop existing database (WARNING: Deletes all data!)
psql -U postgres -c "DROP DATABASE IF EXISTS faso_travel;"

# Then recreate:
psql -U postgres -c "CREATE DATABASE faso_travel OWNER faso_admin;"

# And run migrations again
./run_migrations.ps1
```

---

## 📁 Recommended Directory Structure

```
C:\
└── FasoTravel\
    ├── FRONTEND\
    │   ├── src\
    │   │   └── migrations\          ← You are here
    │   │       ├── 001_...sql
    │   │       ├── 002_...sql
    │   │       ├── ...
    │   │       ├── run_migrations.ps1
    │   │       ├── README_DATABASE_SETUP.md
    │   │       └── ...other docs
    │   └── .env.example
    │
    ├── BACKEND\                      ← To create
    │   ├── src\
    │   │   ├── routes\
    │   │   ├── services\
    │   │   └── config\
    │   ├── .env                      ← Copy from .env.example
    │   └── package.json
    │
    └── Backups\                      ← For database backups
        ├── faso_travel_20251113_120000.sql
        └── ...
```

---

## 🔐 Windows Credential Manager (Optional)

Store PostgreSQL password securely:

```powershell
# Add credential
$cred = Get-Credential -UserName faso_admin -Message "Enter PostgreSQL password"
$cred.Password | ConvertFrom-SecureString | Out-File "$env:APPDATA\faso_travel_cred.txt"

# Retrieve credential
$password = Get-Content "$env:APPDATA\faso_travel_cred.txt" | ConvertTo-SecureString
$database_url = "postgresql://faso_admin:$($password | ConvertFrom-SecureString -AsPlainText)@localhost:5432/faso_travel"
```

---

## ✅ Windows Setup Checklist

- [ ] PostgreSQL 12+ installed
- [ ] Database `faso_travel` created
- [ ] User `faso_admin` created with password
- [ ] DATABASE_URL environment variable set
- [ ] run_migrations.ps1 script created & executed
- [ ] All 7 migrations completed
- [ ] 17 tables created
- [ ] 130 test records seeded
- [ ] Availability rule validated (0 inconsistencies)
- [ ] Backup function tested
- [ ] PowerShell helper functions added (optional)

---

## 📞 Windows-Specific Help

### pgAdmin 4 (GUI Alternative to psql)

1. Open pgAdmin 4 from Start Menu
2. Right-click "Servers" → "Create" → "Server"
3. Name: "FasoTravel"
4. Host name: localhost
5. Username: faso_admin
6. Password: Your password
7. Click "Save"
8. Navigate: Servers → FasoTravel → Databases → faso_travel
9. Right-click → Query Tool
10. Paste and run SQL queries

### VS Code Extension (Optional)

Install "SQLTools" extension in VS Code:
1. Open Extensions (Ctrl+Shift+X)
2. Search: "SQLTools"
3. Install by Matheus Teixeira
4. Click "Add Connection"
5. Database: PostgreSQL
6. Hostname: localhost
7. Username: faso_admin
8. Password: Your password
9. Port: 5432
10. Database: faso_travel

---

**Created for Windows developers • Last Updated: 2025-11-13**
