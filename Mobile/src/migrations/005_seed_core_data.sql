-- ================================================
-- Migration 005: Seed Data - Données de test
-- Description: Insertion des données pour développement
-- Date: 2025-11-13
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- NOTES IMPORTANTES
-- ================================================

/*
CETTE MIGRATION AJOUTE DES DONNÉES DE TEST UNIQUEMENT
À exécuter APRÈS 003 et 004
À COMMENTER ou SUPPRIMER avant production

Les mocks viennent de src/data/models.ts et respectent la règle:
  trip.available_seats = MIN(segment.available_seats)
*/

-- ================================================
-- 1. SEED OPERATORS
-- ================================================

INSERT INTO operators (operator_id, name, operator_logo, rating, total_reviews, is_verified, is_active, created_at, updated_at)
VALUES 
  ('AIR_CANADA', 'Air Canada Bus', '✈️', 4.8, 820, true, true, NOW(), NOW()),
  ('SCOOT', 'Scoot Express', '🚌', 4.5, 420, false, true, NOW(), NOW()),
  ('RAKIETA', 'Rakieta Transport', '🚐', 4.7, 610, true, true, NOW(), NOW()),
  ('TSR', 'TSR Voyages', '🚍', 4.6, 380, false, true, NOW(), NOW()),
  ('STAF', 'STAF Burkina', '🚎', 4.4, 260, false, true, NOW(), NOW())
ON CONFLICT (operator_id) DO NOTHING;

-- ================================================
-- 2. SEED SEAT_MAP_CONFIGS
-- ================================================

INSERT INTO seat_map_configs (rows, seats_per_row, aisle_after, total_seats)
VALUES 
  (11, 4, 2, 44),
  (10, 3, 1, 30),
  (8, 4, 2, 32)
ON CONFLICT DO NOTHING;

-- Récupérer les IDs pour utilisation
DO $$
DECLARE
  config_44_id UUID;
  config_30_id UUID;
  config_32_id UUID;
BEGIN
  SELECT config_id INTO config_44_id FROM seat_map_configs WHERE total_seats = 44 LIMIT 1;
  SELECT config_id INTO config_30_id FROM seat_map_configs WHERE total_seats = 30 LIMIT 1;
  SELECT config_id INTO config_32_id FROM seat_map_configs WHERE total_seats = 32 LIMIT 1;
  
  -- ================================================
  -- 3. SEED VEHICLES
  -- ================================================
  
  INSERT INTO vehicles (vehicle_id, operator_id, type, seat_map_config_id, is_active, created_at, updated_at)
  VALUES 
    ('VEH_AC_001', 'AIR_CANADA', 'Bus climatisé', config_44_id, true, NOW(), NOW()),
    ('VEH_SCOOT_001', 'SCOOT', 'Mini-bus', config_30_id, true, NOW(), NOW()),
    ('VEH_RAKIETA_001', 'RAKIETA', 'Bus VIP', config_32_id, true, NOW(), NOW()),
    ('VEH_TSR_001', 'TSR', 'Bus climatisé', config_44_id, true, NOW(), NOW()),
    ('VEH_STAF_001', 'STAF', 'Mini-bus', config_30_id, true, NOW(), NOW())
  ON CONFLICT (vehicle_id) DO NOTHING;
  
END $$;

-- ================================================
-- 4. SEED STATIONS
-- ================================================

INSERT INTO stations (station_id, name, city, latitude, longitude, is_active, created_at, updated_at)
VALUES 
  ('OUAGA_CENTRE', 'Gare Routière Centrale', 'Ouagadougou', 12.3714, -1.5197, true, NOW(), NOW()),
  ('OUAGA_OUEST', 'Gare Ouest', 'Ouagadougou', 12.3547, -1.5410, true, NOW(), NOW()),
  ('BOBO_CENTRE', 'Gare Routière Bobo-Dioulasso', 'Bobo-Dioulasso', 11.1773, -4.2972, true, NOW(), NOW()),
  ('KOUDOUGOU', 'Gare de Koudougou', 'Koudougou', 12.2526, -2.3637, true, NOW(), NOW()),
  ('BANFORA', 'Gare de Banfora', 'Banfora', 10.6333, -4.7500, true, NOW(), NOW()),
  ('OUAHIGOUYA', 'Gare de Ouahigouya', 'Ouahigouya', 13.5828, -2.4214, true, NOW(), NOW()),
  ('FADA', 'Gare de Fada N''Gourma', 'Fada N''Gourma', 12.0614, 0.3582, true, NOW(), NOW())
ON CONFLICT (station_id) DO NOTHING;

-- ================================================
-- 5. SEED TRIPS & SEGMENTS
-- ================================================

-- TRIP_001: Ouaga → Bobo (Air Canada)
-- Segment 1: available_seats = 12, Segment 2: available_seats = 18
-- → trip.available_seats = MIN(12, 18) = 12 ✓
INSERT INTO trips (trip_id, operator_id, operator_name, operator_logo, vehicle_id, vehicle_type, 
                   departure_time, arrival_time, duration_minutes, base_price, 
                   from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                   available_seats, total_seats, is_cancelled, created_at, updated_at)
VALUES ('TRIP_001', 'AIR_CANADA', 'Air Canada Bus', '✈️', 'VEH_AC_001', 'Bus climatisé',
        '2025-11-04T07:00:00', '2025-11-04T13:00:00', 360, 8500,
        'OUAGA_CENTRE', 'BOBO_CENTRE', 'Ouagadougou', 'Bobo-Dioulasso',
        12, 45, false, NOW(), NOW())
ON CONFLICT (trip_id) DO NOTHING;

INSERT INTO segments (segment_id, trip_id, from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                      departure_time, arrival_time, distance_km, available_seats, total_seats,
                      sequence_number, base_price, created_at, updated_at)
VALUES 
  ('SEG_001_1', 'TRIP_001', 'OUAGA_CENTRE', 'KOUDOUGOU', 'Ouagadougou', 'Koudougou',
   '2025-11-04T07:00:00', '2025-11-04T09:15:00', 95.00, 12, 45, 1, 4250, NOW(), NOW()),
  ('SEG_001_2', 'TRIP_001', 'KOUDOUGOU', 'BOBO_CENTRE', 'Koudougou', 'Bobo-Dioulasso',
   '2025-11-04T09:30:00', '2025-11-04T13:00:00', 155.00, 18, 45, 2, 4250, NOW(), NOW())
ON CONFLICT (segment_id) DO NOTHING;

-- TRIP_002: Ouaga → Bobo (Scoot Express)
-- Segment: available_seats = 8
-- → trip.available_seats = 8 ✓
INSERT INTO trips (trip_id, operator_id, operator_name, operator_logo, vehicle_id, vehicle_type, 
                   departure_time, arrival_time, duration_minutes, base_price, 
                   from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                   available_seats, total_seats, is_cancelled, created_at, updated_at)
VALUES ('TRIP_002', 'SCOOT', 'Scoot Express', '🚌', 'VEH_SCOOT_001', 'Mini-bus',
        '2025-11-04T09:00:00', '2025-11-04T15:00:00', 360, 7000,
        'OUAGA_CENTRE', 'BOBO_CENTRE', 'Ouagadougou', 'Bobo-Dioulasso',
        8, 30, false, NOW(), NOW())
ON CONFLICT (trip_id) DO NOTHING;

INSERT INTO segments (segment_id, trip_id, from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                      departure_time, arrival_time, distance_km, available_seats, total_seats,
                      sequence_number, base_price, created_at, updated_at)
VALUES 
  ('SEG_002_1', 'TRIP_002', 'OUAGA_CENTRE', 'BOBO_CENTRE', 'Ouagadougou', 'Bobo-Dioulasso',
   '2025-11-04T09:00:00', '2025-11-04T15:00:00', 250.00, 8, 30, 1, 7000, NOW(), NOW())
ON CONFLICT (segment_id) DO NOTHING;

-- TRIP_002B: Ouaga → Bobo (Rakieta Transport)
-- Segment: available_seats = 22
-- → trip.available_seats = 22 ✓
INSERT INTO trips (trip_id, operator_id, operator_name, operator_logo, vehicle_id, vehicle_type, 
                   departure_time, arrival_time, duration_minutes, base_price, 
                   from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                   available_seats, total_seats, is_cancelled, created_at, updated_at)
VALUES ('TRIP_002B', 'RAKIETA', 'Rakieta Transport', '🚐', 'VEH_RAKIETA_001', 'Bus VIP',
        '2025-11-04T11:00:00', '2025-11-04T16:45:00', 345, 10000,
        'OUAGA_CENTRE', 'BOBO_CENTRE', 'Ouagadougou', 'Bobo-Dioulasso',
        22, 35, false, NOW(), NOW())
ON CONFLICT (trip_id) DO NOTHING;

INSERT INTO segments (segment_id, trip_id, from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                      departure_time, arrival_time, distance_km, available_seats, total_seats,
                      sequence_number, base_price, created_at, updated_at)
VALUES 
  ('SEG_002B_1', 'TRIP_002B', 'OUAGA_CENTRE', 'BOBO_CENTRE', 'Ouagadougou', 'Bobo-Dioulasso',
   '2025-11-04T11:00:00', '2025-11-04T16:45:00', 250.00, 22, 35, 1, 10000, NOW(), NOW())
ON CONFLICT (segment_id) DO NOTHING;

-- TRIP_003: Bobo → Ouaga (Air Canada)
-- Segment 1: available_seats = 16, Segment 2: available_seats = 14
-- → trip.available_seats = MIN(16, 14) = 14 ✓
INSERT INTO trips (trip_id, operator_id, operator_name, operator_logo, vehicle_id, vehicle_type, 
                   departure_time, arrival_time, duration_minutes, base_price, 
                   from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                   available_seats, total_seats, is_cancelled, created_at, updated_at)
VALUES ('TRIP_003', 'AIR_CANADA', 'Air Canada Bus', '✈️', 'VEH_AC_001', 'Bus climatisé',
        '2025-11-05T08:00:00', '2025-11-05T14:00:00', 360, 8500,
        'BOBO_CENTRE', 'OUAGA_CENTRE', 'Bobo-Dioulasso', 'Ouagadougou',
        14, 45, false, NOW(), NOW())
ON CONFLICT (trip_id) DO NOTHING;

INSERT INTO segments (segment_id, trip_id, from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                      departure_time, arrival_time, distance_km, available_seats, total_seats,
                      sequence_number, base_price, created_at, updated_at)
VALUES 
  ('SEG_003_1', 'TRIP_003', 'BOBO_CENTRE', 'KOUDOUGOU', 'Bobo-Dioulasso', 'Koudougou',
   '2025-11-05T08:00:00', '2025-11-05T11:30:00', 155.00, 16, 45, 1, 4250, NOW(), NOW()),
  ('SEG_003_2', 'TRIP_003', 'KOUDOUGOU', 'OUAGA_CENTRE', 'Koudougou', 'Ouagadougou',
   '2025-11-05T11:45:00', '2025-11-05T14:00:00', 95.00, 14, 45, 2, 4250, NOW(), NOW())
ON CONFLICT (segment_id) DO NOTHING;

-- TRIP_004: Bobo → Ouaga (Air Canada)
-- Segment: available_seats = 20
-- → trip.available_seats = 20 ✓
INSERT INTO trips (trip_id, operator_id, operator_name, operator_logo, vehicle_id, vehicle_type, 
                   departure_time, arrival_time, duration_minutes, base_price, 
                   from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                   available_seats, total_seats, is_cancelled, created_at, updated_at)
VALUES ('TRIP_004', 'AIR_CANADA', 'Air Canada Bus', '✈️', 'VEH_AC_001', 'Bus climatisé',
        '2025-11-05T15:00:00', '2025-11-05T21:00:00', 360, 8500,
        'BOBO_CENTRE', 'OUAGA_CENTRE', 'Bobo-Dioulasso', 'Ouagadougou',
        20, 45, false, NOW(), NOW())
ON CONFLICT (trip_id) DO NOTHING;

INSERT INTO segments (segment_id, trip_id, from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                      departure_time, arrival_time, distance_km, available_seats, total_seats,
                      sequence_number, base_price, created_at, updated_at)
VALUES 
  ('SEG_004_1', 'TRIP_004', 'BOBO_CENTRE', 'OUAGA_CENTRE', 'Bobo-Dioulasso', 'Ouagadougou',
   '2025-11-05T15:00:00', '2025-11-05T21:00:00', 250.00, 20, 45, 1, 8500, NOW(), NOW())
ON CONFLICT (segment_id) DO NOTHING;

-- TRIP_005: Bobo → Ouaga (Scoot Express)
-- Segment: available_seats = 10
-- → trip.available_seats = 10 ✓
INSERT INTO trips (trip_id, operator_id, operator_name, operator_logo, vehicle_id, vehicle_type, 
                   departure_time, arrival_time, duration_minutes, base_price, 
                   from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                   available_seats, total_seats, is_cancelled, created_at, updated_at)
VALUES ('TRIP_005', 'SCOOT', 'Scoot Express', '🚌', 'VEH_SCOOT_001', 'Mini-bus',
        '2025-11-05T10:00:00', '2025-11-05T15:50:00', 350, 7000,
        'BOBO_CENTRE', 'OUAGA_CENTRE', 'Bobo-Dioulasso', 'Ouagadougou',
        10, 30, false, NOW(), NOW())
ON CONFLICT (trip_id) DO NOTHING;

INSERT INTO segments (segment_id, trip_id, from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                      departure_time, arrival_time, distance_km, available_seats, total_seats,
                      sequence_number, base_price, created_at, updated_at)
VALUES 
  ('SEG_005_1', 'TRIP_005', 'BOBO_CENTRE', 'OUAGA_CENTRE', 'Bobo-Dioulasso', 'Ouagadougou',
   '2025-11-05T10:00:00', '2025-11-05T15:50:00', 250.00, 10, 30, 1, 7000, NOW(), NOW())
ON CONFLICT (segment_id) DO NOTHING;

-- TRIP_006: Bobo → Ouaga (Rakieta Transport)
-- Segment: available_seats = 15
-- → trip.available_seats = 15 ✓
INSERT INTO trips (trip_id, operator_id, operator_name, operator_logo, vehicle_id, vehicle_type, 
                   departure_time, arrival_time, duration_minutes, base_price, 
                   from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                   available_seats, total_seats, is_cancelled, created_at, updated_at)
VALUES ('TRIP_006', 'RAKIETA', 'Rakieta Transport', '🚐', 'VEH_RAKIETA_001', 'Bus VIP',
        '2025-11-05T14:30:00', '2025-11-05T20:15:00', 345, 10000,
        'BOBO_CENTRE', 'OUAGA_CENTRE', 'Bobo-Dioulasso', 'Ouagadougou',
        15, 35, false, NOW(), NOW())
ON CONFLICT (trip_id) DO NOTHING;

INSERT INTO segments (segment_id, trip_id, from_stop_id, to_stop_id, from_stop_name, to_stop_name,
                      departure_time, arrival_time, distance_km, available_seats, total_seats,
                      sequence_number, base_price, created_at, updated_at)
VALUES 
  ('SEG_006_1', 'TRIP_006', 'BOBO_CENTRE', 'OUAGA_CENTRE', 'Bobo-Dioulasso', 'Ouagadougou',
   '2025-11-05T14:30:00', '2025-11-05T20:15:00', 250.00, 15, 35, 1, 10000, NOW(), NOW())
ON CONFLICT (segment_id) DO NOTHING;

-- ================================================
-- 6. VALIDATION: Vérifier la règle available_seats
-- ================================================

-- Affiche trips avec vérification du calcul
SELECT 
  t.trip_id,
  t.operator_name,
  t.available_seats as declared_available,
  (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id) as calculated_min,
  CASE 
    WHEN t.available_seats = (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id)
    THEN '✓ OK'
    ELSE '❌ MISMATCH'
  END as validation
FROM trips t
ORDER BY t.trip_id;

-- ================================================
-- NOTES
-- ================================================

/*
1. INSERTION AVEC ON CONFLICT DO NOTHING
   - Permet de rejouer la migration sans erreur si données existent
   - À adapter selon tes besoins (UPDATE au lieu de DO NOTHING si besoin)

2. RÈGLE DISPONIBILITÉ
   - Tous les trips respectent: available_seats = MIN(segment.available_seats)
   - Query de vérification fournie à la fin
   - À valider après chaque insertion/modification en production

3. DONNÉES DE TEST
   - 6 trajets complets (3 aller Ouaga→Bobo, 3 retour Bobo→Ouaga)
   - 5 opérateurs
   - 7 stations
   - À conserver pour dev/test, à supprimer avant production

4. HORODATAGE
   - created_at/updated_at = NOW() (timestamp courant)
   - À adapter si tu veux des données "réalistes" avec dates passées

5. À AJOUTER ULTÉRIEUREMENT
   - Données utilisateur (users, bookings, tickets, payments)
   - Historiques d'analytics
*/

-- ================================================
-- FIN DE LA MIGRATION 005
-- ================================================
