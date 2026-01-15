-- ================================================
-- Migration 010: Trip Progression & Seat Management
-- Description: Ajoute la logique de:
--   1. Tracking progression du car (current_segment, status)
--   2. Décrémentation auto des places par segment
--   3. Liaison sièges ↔ réservations
--   4. Validation disponibilité multi-segment
-- Date: 2025-11-13
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- ROLLBACK (à exécuter en cas d'erreur)
-- ================================================
/*
DROP TRIGGER IF EXISTS trg_decrement_on_booking ON bookings;
DROP TRIGGER IF EXISTS trg_increment_on_cancel ON bookings;
DROP TRIGGER IF EXISTS trg_validate_segments_availability ON bookings;
DROP TRIGGER IF EXISTS trg_update_trip_status ON trips;

DROP FUNCTION IF EXISTS decrement_segment_available_seats();
DROP FUNCTION IF EXISTS increment_segment_available_seats_on_cancel();
DROP FUNCTION IF EXISTS validate_booking_segments_availability();
DROP FUNCTION IF EXISTS update_trip_status_on_completion();

DROP VIEW IF EXISTS vw_trip_full_route CASCADE;

ALTER TABLE trips DROP COLUMN IF EXISTS current_segment_id;
ALTER TABLE trips DROP COLUMN IF EXISTS current_station_id;
ALTER TABLE trips DROP COLUMN IF EXISTS status;
ALTER TABLE trips DROP COLUMN IF EXISTS last_location_update;
ALTER TABLE trips DROP COLUMN IF EXISTS gps_latitude;
ALTER TABLE trips DROP COLUMN IF EXISTS gps_longitude;

ALTER TABLE segments DROP COLUMN IF EXISTS status;

ALTER TABLE seats DROP COLUMN IF EXISTS booked_by_booking_id;
*/

-- ================================================
-- 1. ÉTENDRE TABLE TRIPS - Progression du Car
-- ================================================

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS current_segment_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_station_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SCHEDULED'
  CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'ARRIVED', 'CANCELLED', 'DELAYED')),
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS gps_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS gps_longitude NUMERIC(11, 8),
ADD CONSTRAINT fk_trip_current_segment 
  FOREIGN KEY (current_segment_id) REFERENCES segments(segment_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_trip_current_station 
  FOREIGN KEY (current_station_id) REFERENCES stations(station_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_current_segment ON trips(current_segment_id);

-- ================================================
-- 2. ÉTENDRE TABLE SEGMENTS - Status
-- ================================================

ALTER TABLE segments 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'SCHEDULED'
  CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'));

CREATE INDEX IF NOT EXISTS idx_segments_status ON segments(status);

-- ================================================
-- 3. ÉTENDRE TABLE SEATS - Lier aux Bookings
-- ================================================

ALTER TABLE seats 
ADD COLUMN IF NOT EXISTS booked_by_booking_id UUID,
ADD CONSTRAINT fk_seat_booking 
  FOREIGN KEY (booked_by_booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_seats_booking ON seats(booked_by_booking_id);

-- ================================================
-- 4. FONCTION: Valider Disponibilité Multi-Segment
-- CRITIQUE: Vérifie que TOUS les segments entre
--   from et to ont assez de places
-- ================================================

CREATE OR REPLACE FUNCTION validate_booking_segments_availability()
RETURNS TRIGGER AS $$
DECLARE
  seg_rec RECORD;
  from_seq INTEGER;
  to_seq INTEGER;
  total_segments INTEGER;
  checked_segments INTEGER := 0;
BEGIN
  -- Si from_segment_id et to_segment_id ne sont pas spécifiés,
  -- supposer le trajet complet
  IF NEW.from_segment_id IS NULL THEN
    SELECT segment_id INTO NEW.from_segment_id 
    FROM segments 
    WHERE trip_id = NEW.trip_id 
    ORDER BY sequence_number ASC 
    LIMIT 1;
  END IF;

  IF NEW.to_segment_id IS NULL THEN
    SELECT segment_id INTO NEW.to_segment_id 
    FROM segments 
    WHERE trip_id = NEW.trip_id 
    ORDER BY sequence_number DESC 
    LIMIT 1;
  END IF;

  -- Récupérer sequence_numbers
  SELECT sequence_number INTO from_seq 
  FROM segments WHERE segment_id = NEW.from_segment_id;
  
  SELECT sequence_number INTO to_seq 
  FROM segments WHERE segment_id = NEW.to_segment_id;

  -- Vérifier chaque segment dans la gamme
  FOR seg_rec IN SELECT * FROM segments 
    WHERE trip_id = NEW.trip_id
    AND sequence_number >= from_seq
    AND sequence_number <= to_seq
  LOOP
    checked_segments := checked_segments + 1;
    
    -- Vérifier qu'il y a assez de places
    IF seg_rec.available_seats < NEW.num_passengers THEN
      RAISE EXCEPTION 'Segment % (% → %): Not enough seats (need %, have %)',
        seg_rec.segment_id, seg_rec.from_stop_name, seg_rec.to_stop_name,
        NEW.num_passengers, seg_rec.available_seats;
    END IF;
  END LOOP;

  -- Vérifier qu'on a bien trouvé des segments
  IF checked_segments = 0 THEN
    RAISE EXCEPTION 'No segments found between from_segment % and to_segment %',
      NEW.from_segment_id, NEW.to_segment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 5. TRIGGER: Valider Avant INSERT Booking
-- ================================================

DROP TRIGGER IF EXISTS trg_validate_segments_availability ON bookings;
CREATE TRIGGER trg_validate_segments_availability
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_segments_availability();

-- ================================================
-- 6. FONCTION: Décrémenter Sièges Disponibles
-- CRITIQUE: Quand booking créée, décrémenter
--   available_seats sur tous les segments concernés
-- ================================================

CREATE OR REPLACE FUNCTION decrement_segment_available_seats()
RETURNS TRIGGER AS $$
DECLARE
  seg_rec RECORD;
  from_seq INTEGER;
  to_seq INTEGER;
BEGIN
  -- Seulement si status est HOLD ou CONFIRMED
  IF NEW.status NOT IN ('HOLD', 'CONFIRMED') THEN
    RETURN NEW;
  END IF;

  -- Récupérer les sequences
  SELECT sequence_number INTO from_seq 
  FROM segments WHERE segment_id = NEW.from_segment_id;
  
  SELECT sequence_number INTO to_seq 
  FROM segments WHERE segment_id = NEW.to_segment_id;

  -- Décrémenter chaque segment concerné
  FOR seg_rec IN SELECT * FROM segments 
    WHERE trip_id = NEW.trip_id
    AND sequence_number >= from_seq
    AND sequence_number <= to_seq
  LOOP
    UPDATE segments 
    SET available_seats = GREATEST(0, available_seats - NEW.num_passengers),
        updated_at = NOW()
    WHERE segment_id = seg_rec.segment_id;
  END LOOP;

  -- Recalculer trip.available_seats = MIN
  UPDATE trips
  SET available_seats = COALESCE((
    SELECT MIN(available_seats) FROM segments WHERE trip_id = NEW.trip_id
  ), 0),
  updated_at = NOW()
  WHERE trip_id = NEW.trip_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 7. TRIGGER: Décrémenter Après INSERT Booking
-- ================================================

DROP TRIGGER IF EXISTS trg_decrement_on_booking ON bookings;
CREATE TRIGGER trg_decrement_on_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION decrement_segment_available_seats();

-- ================================================
-- 8. FONCTION: Réincrémenter si Annulation
-- IMPORTANT: Si booking annulée, remettre les places
-- ================================================

CREATE OR REPLACE FUNCTION increment_segment_available_seats_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  seg_rec RECORD;
  from_seq INTEGER;
  to_seq INTEGER;
BEGIN
  -- Seulement si transition vers CANCELLED
  IF NEW.status != 'CANCELLED' OR OLD.status = 'CANCELLED' THEN
    RETURN NEW;
  END IF;

  -- Récupérer les sequences
  SELECT sequence_number INTO from_seq 
  FROM segments WHERE segment_id = NEW.from_segment_id;
  
  SELECT sequence_number INTO to_seq 
  FROM segments WHERE segment_id = NEW.to_segment_id;

  -- Réincrémenter chaque segment concerné
  FOR seg_rec IN SELECT * FROM segments 
    WHERE trip_id = NEW.trip_id
    AND sequence_number >= from_seq
    AND sequence_number <= to_seq
  LOOP
    UPDATE segments 
    SET available_seats = LEAST(total_seats, available_seats + OLD.num_passengers),
        updated_at = NOW()
    WHERE segment_id = seg_rec.segment_id;
  END LOOP;

  -- Recalculer trip.available_seats
  UPDATE trips
  SET available_seats = COALESCE((
    SELECT MIN(available_seats) FROM segments WHERE trip_id = NEW.trip_id
  ), 0),
  updated_at = NOW()
  WHERE trip_id = NEW.trip_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 9. TRIGGER: Réincrémenter Après UPDATE Booking
-- ================================================

DROP TRIGGER IF EXISTS trg_increment_on_cancel ON bookings;
CREATE TRIGGER trg_increment_on_cancel
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION increment_segment_available_seats_on_cancel();

-- ================================================
-- 10. FONCTION: Mettre à Jour Status du Trip
-- IMPORTANT: Quand trip progresse, mettre à jour
--   ses segments et son statut
-- ================================================

CREATE OR REPLACE FUNCTION update_trip_status_on_segment_change()
RETURNS TRIGGER AS $$
DECLARE
  total_segs INTEGER;
  completed_segs INTEGER;
  trip_rec RECORD;
BEGIN
  -- Compter segments complétés
  SELECT COUNT(*) INTO completed_segs 
  FROM segments WHERE trip_id = NEW.trip_id AND status = 'COMPLETED';
  
  SELECT COUNT(*) INTO total_segs 
  FROM segments WHERE trip_id = NEW.trip_id;

  -- Récupérer infos du trip
  SELECT * INTO trip_rec FROM trips WHERE trip_id = NEW.trip_id;

  -- Mettre à jour le status du trip
  IF completed_segs = total_segs THEN
    -- Tous les segments sont complétés
    UPDATE trips 
    SET status = 'ARRIVED',
        last_location_update = NOW()
    WHERE trip_id = NEW.trip_id;
  ELSIF NEW.status = 'IN_PROGRESS' THEN
    -- Au moins un segment est en cours
    UPDATE trips 
    SET status = 'IN_PROGRESS',
        current_segment_id = NEW.segment_id,
        last_location_update = NOW()
    WHERE trip_id = NEW.trip_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 11. TRIGGER: Mettre à Jour Trip Quand Segment Change
-- ================================================

DROP TRIGGER IF EXISTS trg_update_trip_status ON segments;
CREATE TRIGGER trg_update_trip_status
  AFTER UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_status_on_segment_change();

-- ================================================
-- 12. VIEW: Parcours Complet d'un Trip
-- AFFICHAGE: Affiche tous les segments dans l'ordre
-- ================================================

DROP VIEW IF EXISTS vw_trip_full_route CASCADE;
CREATE VIEW vw_trip_full_route AS
SELECT 
  t.trip_id,
  t.operator_id,
  o.name as operator_name,
  t.from_stop_id as start_station_id,
  st_from.name as start_station_name,
  t.to_stop_id as end_station_id,
  st_to.name as end_station_name,
  t.status as trip_status,
  t.current_segment_id,
  t.available_seats as trip_available_seats,
  t.departure_time,
  t.arrival_time,
  JSON_BUILD_OBJECT(
    'latitude', t.gps_latitude,
    'longitude', t.gps_longitude,
    'updated_at', t.last_location_update
  ) as current_location,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'segment_id', s.segment_id,
      'sequence', s.sequence_number,
      'from_station_id', s.from_stop_id,
      'from_station_name', s.from_stop_name,
      'to_station_id', s.to_stop_id,
      'to_station_name', s.to_stop_name,
      'departure_time', s.departure_time,
      'arrival_time', s.arrival_time,
      'distance_km', s.distance_km,
      'available_seats', s.available_seats,
      'total_seats', s.total_seats,
      'status', s.status
    ) ORDER BY s.sequence_number
  ) as segments_route
FROM trips t
LEFT JOIN operators o ON t.operator_id = o.operator_id
LEFT JOIN stations st_from ON t.from_stop_id = st_from.station_id
LEFT JOIN stations st_to ON t.to_stop_id = st_to.station_id
LEFT JOIN segments s ON t.trip_id = s.trip_id
GROUP BY t.trip_id, t.operator_id, o.name, t.from_stop_id, st_from.name,
         t.to_stop_id, st_to.name, t.status, t.current_segment_id,
         t.available_seats, t.departure_time, t.arrival_time,
         t.gps_latitude, t.gps_longitude, t.last_location_update;

-- ================================================
-- 13. VIEW: Disponibilité par Segment
-- ================================================

DROP VIEW IF EXISTS vw_segment_availability CASCADE;
CREATE VIEW vw_segment_availability AS
SELECT 
  s.segment_id,
  s.trip_id,
  t.operator_id,
  o.name as operator_name,
  s.from_stop_id,
  st_from.name as from_station_name,
  s.to_stop_id,
  st_to.name as to_station_name,
  s.sequence_number,
  s.departure_time,
  s.arrival_time,
  s.available_seats,
  s.total_seats,
  (s.total_seats - s.available_seats) as booked_count,
  CASE 
    WHEN s.available_seats <= 0 THEN 'FULL'
    WHEN s.available_seats <= 3 THEN 'ALMOST_FULL'
    ELSE 'AVAILABLE'
  END as availability_status,
  s.status
FROM segments s
LEFT JOIN trips t ON s.trip_id = t.trip_id
LEFT JOIN operators o ON t.operator_id = o.operator_id
LEFT JOIN stations st_from ON s.from_stop_id = st_from.station_id
LEFT JOIN stations st_to ON s.to_stop_id = st_to.station_id;

-- ================================================
-- 14. VIEW: Bookings avec Route Complète
-- ================================================

DROP VIEW IF EXISTS vw_booking_details CASCADE;
CREATE VIEW vw_booking_details AS
SELECT 
  b.booking_id,
  b.user_id,
  u.full_name as passenger_name,
  b.trip_id,
  b.operator_id,
  o.name as operator_name,
  st_board.name as boarding_station_name,
  st_alight.name as alighting_station_name,
  b.from_segment_id,
  b.to_segment_id,
  (SELECT COUNT(*) FROM booking_segments WHERE booking_id = b.booking_id) as num_segments,
  b.num_passengers,
  b.total_amount,
  b.status,
  b.created_at,
  b.hold_expires_at,
  CASE 
    WHEN b.status = 'HOLD' AND b.hold_expires_at < NOW() THEN 'EXPIRED_HOLD'
    ELSE b.status
  END as effective_status
FROM bookings b
LEFT JOIN users u ON b.user_id = u.user_id
LEFT JOIN operators o ON b.operator_id = o.operator_id
LEFT JOIN stations st_board ON b.boarding_station_id = st_board.station_id
LEFT JOIN stations st_alight ON b.alighting_station_id = st_alight.station_id;

-- ================================================
-- NOTES D'UTILISATION
-- ================================================

/*
1. CRÉER UN TRAJET AVEC SEGMENTS:
   - Trip_001: Ouaga (07:00) → Bobo (13:00)
     * Segment 1: 07:00-09:15 Ouaga→Kou (45 sièges)
     * Segment 2: 09:30-13:00 Kou→Bobo (45 sièges)

2. CRÉER UNE RÉSERVATION:
   INSERT INTO bookings (
     user_id, trip_id, operator_id,
     from_segment_id, to_segment_id,
     boarding_station_id, alighting_station_id,
     status, num_passengers
   ) VALUES (
     user_123, 'TRIP_001', 'AIR_CANADA',
     'SEG_001', 'SEG_002',
     'OUAGA_CENTRE', 'BOBO_CENTRE',
     'HOLD', 1
   );
   
   AUTOMATIQUEMENT:
   - Trigger validate_booking_segments_availability() vérifie les 2 segments
   - Trigger decrement_segment_available_seats() décrémente:
     * Segment 1: 45 → 44
     * Segment 2: 45 → 44
     * Trip: 45 → 44

3. TRACKER LA PROGRESSION DU CAR:
   -- Car quitte Ouagadougou
   UPDATE trips SET status = 'IN_PROGRESS', 
                   current_segment_id = 'SEG_001'
   WHERE trip_id = 'TRIP_001';

   -- Car arrive à Koudougou
   UPDATE segments SET status = 'COMPLETED' 
   WHERE segment_id = 'SEG_001';
   
   UPDATE trips SET current_segment_id = 'SEG_002'
   WHERE trip_id = 'TRIP_001';
   
   UPDATE segments SET status = 'IN_PROGRESS'
   WHERE segment_id = 'SEG_002';
   
   -- Trigger update_trip_status() met à jour automatiquement trip.status

4. AFFICHER LA ROUTE COMPLÈTE:
   SELECT * FROM vw_trip_full_route WHERE trip_id = 'TRIP_001';

5. AFFICHER LA DISPONIBILITÉ PAR SEGMENT:
   SELECT * FROM vw_segment_availability 
   WHERE trip_id = 'TRIP_001';

6. AFFICHER LES DÉTAILS DES RÉSERVATIONS:
   SELECT * FROM vw_booking_details 
   WHERE trip_id = 'TRIP_001';
*/

-- ================================================
-- FIN DE LA MIGRATION 010
-- ================================================
