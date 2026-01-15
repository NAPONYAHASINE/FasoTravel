-- ================================================
-- Migration 008: Additional Tables - Features Manquantes
-- Description: Ajoute les tables critiques manquantes pour:
--   1. Catégories de stories (admin feature)
--   2. User-Operator mapping (multi-tenant support)
--   3. Amenity normalization (data consistency)
--   4. Reviews & ratings (user-facing feature)
-- Date: 2025-11-13
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- 1. STORY CATEGORIES - Requis par PREPARATION_BACKEND_COMPLETE.md
-- ================================================

CREATE TABLE IF NOT EXISTS story_categories (
  category_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE,
  emoji VARCHAR(10),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lier stories aux catégories
ALTER TABLE operator_stories 
ADD COLUMN IF NOT EXISTS category_id VARCHAR(50) 
REFERENCES story_categories(category_id) ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_operator_stories_category 
ON operator_stories(category_id);

-- Seed story categories
INSERT INTO story_categories (category_id, name, slug, emoji, description, display_order)
VALUES 
  ('PROMO', 'Promotions', 'promo', '🎁', 'Offres spéciales et réductions', 1),
  ('NEWS', 'Actualités', 'news', '📰', 'Mises à jour et nouveautés', 2),
  ('EVENT', 'Événements', 'event', '🎉', 'Événements et trajets spéciaux', 3),
  ('SAFETY', 'Sécurité', 'safety', '🛡️', 'Consignes de sécurité et santé', 4),
  ('MAINTENANCE', 'Maintenance', 'maintenance', '🔧', 'Travaux et interruptions', 5),
  ('COMMUNITY', 'Communauté', 'community', '👥', 'Contenu communautaire', 6)
ON CONFLICT (category_id) DO NOTHING;

-- ================================================
-- 2. USER-OPERATOR MAPPING - Support multi-tenant
-- Description: Permet aux admins de gérer plusieurs opérateurs
-- ================================================

CREATE TABLE IF NOT EXISTS user_operator_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operator_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('OPERATOR_ADMIN', 'SUPPORT', 'DRIVER', 'DISPATCHER')),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE (user_id, operator_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id) ON DELETE CASCADE
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_user_operator_roles_user 
ON user_operator_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_operator_roles_operator 
ON user_operator_roles(operator_id);

CREATE INDEX IF NOT EXISTS idx_user_operator_roles_active 
ON user_operator_roles(is_active) WHERE is_active = true;

-- ================================================
-- 3. AMENITY TYPES - Normalization (replaces TEXT[] array)
-- Description: Table maître pour tous les amenités disponibles
-- ================================================

CREATE TABLE IF NOT EXISTS amenity_types (
  amenity_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),  -- Unicode emoji ou classe Font Awesome
  category VARCHAR(50) CHECK (category IN ('COMFORT', 'ENTERTAINMENT', 'SAFETY', 'FACILITY', 'OTHER')),
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standard amenities
INSERT INTO amenity_types (amenity_id, name, icon, category, description)
VALUES 
  ('WIFI', 'WiFi', '📡', 'ENTERTAINMENT', 'Connexion Internet sans fil'),
  ('POWER', 'Prises électriques', '🔌', 'ENTERTAINMENT', 'Prises USB et 220V pour recharger'),
  ('AC', 'Climatisation', '❄️', 'COMFORT', 'Climatisation complète du véhicule'),
  ('TOILET', 'Toilettes à bord', '🚽', 'FACILITY', 'Toilettes disponibles'),
  ('WATER', 'Eau gratuite', '💧', 'COMFORT', 'Bouteilles d\'eau gratuites'),
  ('SNACKS', 'Collations', '🍿', 'FACILITY', 'Snacks et boissons disponibles'),
  ('TV', 'Écrans vidéo', '📺', 'ENTERTAINMENT', 'Divertissement vidéo à bord'),
  ('MUSIC', 'Musique', '🎵', 'ENTERTAINMENT', 'Système audio en bus'),
  ('RECLINING', 'Sièges inclinables', '🛏️', 'COMFORT', 'Sièges inclinables pour plus de confort'),
  ('BLANKET', 'Couvertures', '🛌', 'COMFORT', 'Couvertures fournies'),
  ('FIRST_AID', 'Trousse de secours', '🚑', 'SAFETY', 'Équipement de premiers secours'),
  ('FIRE_EXT', 'Extincteur', '🧯', 'SAFETY', 'Extincteurs de secours'),
  ('GPS_TRACK', 'Suivi GPS', '📍', 'SAFETY', 'Suivi GPS en temps réel'),
  ('DRIVER_INFO', 'Info chauffeur', '👤', 'SAFETY', 'Informations du chauffeur disponibles')
ON CONFLICT (amenity_id) DO NOTHING;

-- Junction table: Vehicle → Amenities (replaces TEXT[] array)
CREATE TABLE IF NOT EXISTS vehicle_amenities (
  vehicle_id VARCHAR(50) NOT NULL,
  amenity_id VARCHAR(50) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vehicle_id, amenity_id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenity_types(amenity_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vehicle_amenities_vehicle 
ON vehicle_amenities(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_amenities_amenity 
ON vehicle_amenities(amenity_id);

-- Migrate existing TEXT[] amenities to new structure (if any exist)
-- Note: If vehicles table has existing TEXT[] amenities, migrate manually

-- ================================================
-- 4. REVIEWS & RATINGS - User-generated content
-- Description: Avis détaillés sur trajets et opérateurs
-- ================================================

CREATE TABLE IF NOT EXISTS reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id VARCHAR(50),  -- NULL si review générale d'opérateur
  operator_id VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  aspects JSONB DEFAULT '{}',  -- {'cleanliness': 5, 'comfort': 4, 'timing': 5}
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  is_verified_traveler BOOLEAN DEFAULT false,  -- Vérifier que l'utilisateur a vraiment pris ce trajet
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE SET NULL,
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_reviews_operator_rating 
ON reviews(operator_id, rating DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_trip 
ON reviews(trip_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user 
ON reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_status 
ON reviews(status) WHERE status = 'APPROVED';

CREATE INDEX IF NOT EXISTS idx_reviews_created 
ON reviews(created_at DESC);

-- ================================================
-- 5. REVIEW HELPFULNESS - Track helpful votes
-- ================================================

CREATE TABLE IF NOT EXISTS review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,  -- true = helpful, false = unhelpful
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (review_id, user_id),  -- Un utilisateur ne peut voter qu'une fois par review
  FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review 
ON review_helpfulness(review_id);

-- ================================================
-- 6. TRIP SCHEDULES (OPTIONAL) - Recurring routes
-- Description: Définit les trajets périodiques (ex: Ouaga→Bobo tous les jours)
-- ================================================

CREATE TABLE IF NOT EXISTS trip_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id VARCHAR(50) NOT NULL,
  vehicle_id VARCHAR(50),  -- Vehicle par défaut pour ce schedule
  from_stop_id VARCHAR(50) NOT NULL,
  to_stop_id VARCHAR(50) NOT NULL,
  departure_time TIME NOT NULL,
  duration_minutes INTEGER,  -- Durée estimée du trajet
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price > 0),
  
  -- Récurrence
  recurrence_pattern VARCHAR(50) NOT NULL CHECK (recurrence_pattern IN ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY')),
  days_of_week INTEGER DEFAULT 127,  -- Bitmap pour jours de la semaine (127 = tous les jours)
  start_date DATE NOT NULL,
  end_date DATE,  -- NULL = aucune fin
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by_user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
  FOREIGN KEY (from_stop_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
  FOREIGN KEY (to_stop_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_schedules_operator 
ON trip_schedules(operator_id);

CREATE INDEX IF NOT EXISTS idx_trip_schedules_active 
ON trip_schedules(is_active) WHERE is_active = true;

-- ================================================
-- 7. OPERATOR BRANCHES (OPTIONAL) - Multi-location support
-- ================================================

CREATE TABLE IF NOT EXISTS operator_branches (
  branch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  station_id VARCHAR(50),  -- Primary station for this branch
  phone_number VARCHAR(20),
  email VARCHAR(255),
  manager_user_id UUID,  -- User managing this branch
  
  address VARCHAR(500),
  city VARCHAR(100),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE SET NULL,
  FOREIGN KEY (manager_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_operator_branches_operator 
ON operator_branches(operator_id);

CREATE INDEX IF NOT EXISTS idx_operator_branches_active 
ON operator_branches(is_active) WHERE is_active = true;

-- ================================================
-- VIEWS - Pour simplifier les requêtes
-- ================================================

-- View: Operators avec stats complètes
DROP VIEW IF EXISTS vw_operators_with_stats CASCADE;
CREATE VIEW vw_operators_with_stats AS
SELECT 
  o.*,
  COUNT(DISTINCT t.trip_id) as active_trips,
  COUNT(DISTINCT v.vehicle_id) as total_vehicles,
  COALESCE(AVG(r.rating), 0) as avg_rating,
  COUNT(DISTINCT r.review_id) as review_count,
  COUNT(DISTINCT b.booking_id) as total_bookings
FROM operators o
LEFT JOIN trips t ON o.operator_id = t.operator_id AND t.is_cancelled = false
LEFT JOIN vehicles v ON o.operator_id = v.operator_id
LEFT JOIN reviews r ON o.operator_id = r.operator_id AND r.status = 'APPROVED'
LEFT JOIN bookings b ON o.operator_id = b.operator_id
GROUP BY o.operator_id, o.name, o.operator_logo, o.logo_url, o.description, 
         o.phone_number, o.email, o.website_url, o.founded_year, o.fleet_size, 
         o.total_trips, o.amenities, o.rating, o.total_reviews, o.is_verified, 
         o.is_active, o.created_at, o.updated_at;

-- View: Véhicules avec amenities détaillées
DROP VIEW IF EXISTS vw_vehicles_with_amenities CASCADE;
CREATE VIEW vw_vehicles_with_amenities AS
SELECT 
  v.*,
  json_agg(
    json_build_object(
      'amenity_id', a.amenity_id,
      'name', a.name,
      'icon', a.icon,
      'category', a.category
    )
  ) FILTER (WHERE a.amenity_id IS NOT NULL) as amenities
FROM vehicles v
LEFT JOIN vehicle_amenities va ON v.vehicle_id = va.vehicle_id
LEFT JOIN amenity_types a ON va.amenity_id = a.amenity_id
GROUP BY v.vehicle_id, v.operator_id, v.type, v.seat_map_config_id, 
         v.is_active, v.created_at, v.updated_at;

-- ================================================
-- ROLLBACK SECTION
-- ================================================

/*
-- À exécuter en cas de rollback:

DROP VIEW IF EXISTS vw_vehicles_with_amenities CASCADE;
DROP VIEW IF EXISTS vw_operators_with_stats CASCADE;

DROP TABLE IF EXISTS operator_branches CASCADE;
DROP TABLE IF EXISTS trip_schedules CASCADE;
DROP TABLE IF EXISTS review_helpfulness CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS vehicle_amenities CASCADE;
DROP TABLE IF EXISTS amenity_types CASCADE;
DROP TABLE IF EXISTS user_operator_roles CASCADE;

ALTER TABLE operator_stories 
DROP COLUMN IF EXISTS category_id;

DROP TABLE IF EXISTS story_categories CASCADE;
*/

-- ================================================
-- NOTES IMPORTANTES
-- ================================================

/*
1. STORY_CATEGORIES
   - Requis par: PREPARATION_BACKEND_COMPLETE.md (useStoryCategories hook)
   - Endpoints: GET /api/story-categories, POST /api/story-categories
   - Frontend: Admin peut créer/gérer catégories

2. USER_OPERATOR_ROLES
   - Permet aux admins de gérer PLUSIEURS opérateurs
   - Rôles: OPERATOR_ADMIN, SUPPORT, DRIVER, DISPATCHER
   - Important pour scalabilité multi-tenant

3. AMENITY_TYPES + VEHICLE_AMENITIES
   - Remplace TEXT[] array (meilleure normalisation)
   - Permet des stats/analytics ("combien de bus ont WiFi?")
   - Junction table pour flexibilité

4. REVIEWS
   - Avis détaillés avec aspects individuels (JSON)
   - Vérification que utilisateur a pris le trajet
   - Modération (status: PENDING/APPROVED/REJECTED)
   - Utiles pour: ranking operators, user decisions

5. TRIP_SCHEDULES
   - Optional mais recommandé
   - Pour trajets périodiques (même trajet chaque jour)
   - Bitmap pour jours de la semaine

6. OPERATOR_BRANCHES
   - Optional pour multi-location operators
   - Permet de gérer bureaux par ville
   - Staff assignment par branch

7. INDEXES
   - Tous les indexes sont optimisés pour les requêtes courantes
   - Partial indexes où approprié (is_active, status = 'APPROVED')

8. MIGRABILITY
   - Peut être exécutée après 007_seed_user_data.sql
   - Utilise IF NOT EXISTS pour idempotence
   - Rollback section fournie
*/

-- ================================================
-- FIN DE LA MIGRATION 008
-- ================================================
