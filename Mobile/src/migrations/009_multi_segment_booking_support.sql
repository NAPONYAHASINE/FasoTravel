-- ================================================
-- Migration 009: Multi-Segment Booking Support
-- Description: Permet aux réservations de spécifier
--   où l'utilisateur monte et où il descend
--   (support pour boarding/alighting à stations intermédiaires)
-- Date: 2025-11-13
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- ROLLBACK (à exécuter en cas d'erreur)
-- ================================================
/*
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_booking_boarding_station;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS fk_booking_alighting_station;
ALTER TABLE bookings DROP COLUMN IF EXISTS boarding_station_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS alighting_station_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS from_segment_id;
ALTER TABLE bookings DROP COLUMN IF EXISTS to_segment_id;

ALTER TABLE seats DROP COLUMN IF EXISTS segment_id;
ALTER TABLE seats DROP CONSTRAINT IF EXISTS fk_seat_segment;

DROP TABLE IF EXISTS booking_segments CASCADE;
DROP VIEW IF EXISTS vw_available_seats_by_segment CASCADE;
DROP VIEW IF EXISTS vw_booking_routes CASCADE;
*/

-- ================================================
-- 1. ÉTENDRE TABLE BOOKINGS
-- Description: Ajouter boarding/alighting stations
-- ================================================

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS boarding_station_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS alighting_station_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS from_segment_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS to_segment_id VARCHAR(50),
ADD CONSTRAINT fk_booking_boarding_station 
  FOREIGN KEY (boarding_station_id) REFERENCES stations(station_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_booking_alighting_station 
  FOREIGN KEY (alighting_station_id) REFERENCES stations(station_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_booking_from_segment 
  FOREIGN KEY (from_segment_id) REFERENCES segments(segment_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_booking_to_segment 
  FOREIGN KEY (to_segment_id) REFERENCES segments(segment_id) ON DELETE SET NULL;

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_bookings_boarding_station ON bookings(boarding_station_id);
CREATE INDEX IF NOT EXISTS idx_bookings_alighting_station ON bookings(alighting_station_id);
CREATE INDEX IF NOT EXISTS idx_bookings_from_segment ON bookings(from_segment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_to_segment ON bookings(to_segment_id);

-- ================================================
-- 2. ÉTENDRE TABLE SEATS
-- Description: Lier les sièges aux segments
-- ================================================

ALTER TABLE seats 
ADD COLUMN IF NOT EXISTS segment_id VARCHAR(50),
ADD CONSTRAINT fk_seat_segment 
  FOREIGN KEY (segment_id) REFERENCES segments(segment_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seats_segment ON seats(segment_id);

-- ================================================
-- 3. CRÉER TABLE BOOKING_SEGMENTS
-- Description: Junction table pour mapper
--   une booking à une liste de segments parcourus
-- ================================================

CREATE TABLE IF NOT EXISTS booking_segments (
  booking_segment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  segment_id VARCHAR(50) NOT NULL,
  seat_id UUID,  -- Siège utilisé pour ce segment (optionnel si même siège pour tous)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (booking_id, segment_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (segment_id) REFERENCES segments(segment_id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seats(seat_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_segments_booking ON booking_segments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_segments_segment ON booking_segments(segment_id);

-- ================================================
-- 4. CRÉER VIEW: Disponibilité par Segment
-- Description: Affiche le nombre de places dispo
--   pour chaque segment
-- ================================================

DROP VIEW IF EXISTS vw_available_seats_by_segment CASCADE;
CREATE VIEW vw_available_seats_by_segment AS
SELECT 
  s.segment_id,
  s.trip_id,
  s.from_stop_id,
  s.to_stop_id,
  s.from_stop_name,
  s.to_stop_name,
  s.departure_time,
  s.arrival_time,
  COUNT(CASE WHEN st.status = 'available' END) as available_count,
  COUNT(CASE WHEN st.status IN ('hold', 'paid') END) as booked_count,
  COUNT(CASE WHEN st.status = 'hold' END) as hold_count,
  COUNT(CASE WHEN st.status = 'paid' END) as paid_count,
  s.total_seats
FROM segments s
LEFT JOIN seats st ON st.trip_id = s.trip_id 
  AND (st.segment_id = s.segment_id OR st.segment_id IS NULL)
GROUP BY s.segment_id, s.trip_id, s.from_stop_id, s.to_stop_id, 
         s.from_stop_name, s.to_stop_name, s.departure_time, 
         s.arrival_time, s.total_seats;

-- ================================================
-- 5. CRÉER VIEW: Itinéraires de Réservation
-- Description: Affiche la route complète
--   (segments parcourus) pour chaque booking
-- ================================================

DROP VIEW IF EXISTS vw_booking_routes CASCADE;
CREATE VIEW vw_booking_routes AS
SELECT 
  b.booking_id,
  b.user_id,
  b.trip_id,
  b.operator_id,
  b.status,
  b.num_passengers,
  st_from.name as boarding_station_name,
  st_from.city as boarding_city,
  st_to.name as alighting_station_name,
  st_to.city as alighting_city,
  seg_from.departure_time as boarding_time,
  seg_to.arrival_time as alighting_time,
  COUNT(DISTINCT bs.segment_id) as num_segments_booked,
  b.total_amount,
  b.created_at,
  b.hold_expires_at
FROM bookings b
LEFT JOIN stations st_from ON b.boarding_station_id = st_from.station_id
LEFT JOIN stations st_to ON b.alighting_station_id = st_to.station_id
LEFT JOIN segments seg_from ON b.from_segment_id = seg_from.segment_id
LEFT JOIN segments seg_to ON b.to_segment_id = seg_to.segment_id
LEFT JOIN booking_segments bs ON b.booking_id = bs.booking_id
GROUP BY b.booking_id, b.user_id, b.trip_id, b.operator_id, b.status,
         b.num_passengers, st_from.name, st_from.city, st_to.name, st_to.city,
         seg_from.departure_time, seg_to.arrival_time, b.total_amount,
         b.created_at, b.hold_expires_at;

-- ================================================
-- 6. CRÉER FONCTION: Valider Route de Booking
-- Description: Vérifie que from/to_segment_id
--   forment une route valide et contiguë
-- ================================================

CREATE OR REPLACE FUNCTION validate_booking_route()
RETURNS TRIGGER AS $$
DECLARE
  trip_id_val VARCHAR(50);
  from_seq INTEGER;
  to_seq INTEGER;
BEGIN
  -- Si from_segment_id et to_segment_id sont spécifiés, valider
  IF NEW.from_segment_id IS NOT NULL AND NEW.to_segment_id IS NOT NULL THEN
    -- Vérifier que les deux segments appartiennent au même trip
    SELECT trip_id INTO trip_id_val FROM segments WHERE segment_id = NEW.from_segment_id;
    
    IF trip_id_val != NEW.trip_id THEN
      RAISE EXCEPTION 'from_segment_id % does not belong to trip %', 
        NEW.from_segment_id, NEW.trip_id;
    END IF;
    
    SELECT trip_id INTO trip_id_val FROM segments WHERE segment_id = NEW.to_segment_id;
    
    IF trip_id_val != NEW.trip_id THEN
      RAISE EXCEPTION 'to_segment_id % does not belong to trip %', 
        NEW.to_segment_id, NEW.trip_id;
    END IF;
    
    -- Vérifier que from_sequence <= to_sequence
    SELECT sequence_number INTO from_seq FROM segments WHERE segment_id = NEW.from_segment_id;
    SELECT sequence_number INTO to_seq FROM segments WHERE segment_id = NEW.to_segment_id;
    
    IF from_seq > to_seq THEN
      RAISE EXCEPTION 'from_segment (seq %) must come before to_segment (seq %)',
        from_seq, to_seq;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 7. CRÉER TRIGGER: Valider Route de Booking
-- ================================================

DROP TRIGGER IF EXISTS trg_validate_booking_route ON bookings;
CREATE TRIGGER trg_validate_booking_route
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_route();

-- ================================================
-- 8. CRÉER FONCTION: Remplir booking_segments
-- Description: Quand une booking est créée,
--   créer les entrées dans booking_segments
-- ================================================

CREATE OR REPLACE FUNCTION populate_booking_segments()
RETURNS TRIGGER AS $$
BEGIN
  -- Remplir booking_segments avec tous les segments entre from et to
  INSERT INTO booking_segments (booking_id, segment_id)
  SELECT 
    NEW.booking_id,
    segment_id
  FROM segments
  WHERE trip_id = NEW.trip_id
    AND (
      -- Si les segments sont spécifiés, utiliser la gamme
      (NEW.from_segment_id IS NOT NULL AND NEW.to_segment_id IS NOT NULL
       AND sequence_number >= (SELECT sequence_number FROM segments WHERE segment_id = NEW.from_segment_id)
       AND sequence_number <= (SELECT sequence_number FROM segments WHERE segment_id = NEW.to_segment_id))
      OR
      -- Sinon, utiliser tous les segments du trip (trajet complet)
      (NEW.from_segment_id IS NULL AND NEW.to_segment_id IS NULL)
    )
  ON CONFLICT (booking_id, segment_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 9. CRÉER TRIGGER: Remplir booking_segments
-- ================================================

DROP TRIGGER IF EXISTS trg_populate_booking_segments ON bookings;
CREATE TRIGGER trg_populate_booking_segments
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION populate_booking_segments();

-- ================================================
-- 10. AJOUTER COLONNES DE MÉTADONNÉES
-- Description: Stocker des infos utiles sur les
--   stations de montée/descente
-- ================================================

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS boarding_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS alighting_time TIMESTAMP;

-- Fonction pour mettre à jour boarding_time et alighting_time
CREATE OR REPLACE FUNCTION update_booking_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Récupérer les heures des segments
  SELECT seg.departure_time INTO NEW.boarding_time
  FROM segments seg
  WHERE seg.segment_id = NEW.from_segment_id;
  
  SELECT seg.arrival_time INTO NEW.alighting_time
  FROM segments seg
  WHERE seg.segment_id = NEW.to_segment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_booking_times ON bookings;
CREATE TRIGGER trg_update_booking_times
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_times();

-- ================================================
-- NOTES IMPORTANTES
-- ================================================

/*
UTILISATION:

1. BOOKING AVEC TRAJET COMPLET (par défaut):
   INSERT INTO bookings (user_id, trip_id, operator_id, status, num_passengers)
   VALUES (user_id, 'TRIP_001', 'AIR_CANADA', 'HOLD', 1);
   -- from_segment_id et to_segment_id sont NULL
   -- booking_segments sera rempli avec TOUS les segments du trip
   -- vw_booking_routes montrera la route complète

2. BOOKING AVEC TRAJET PARTIEL:
   INSERT INTO bookings (user_id, trip_id, operator_id, status, num_passengers,
                         boarding_station_id, alighting_station_id,
                         from_segment_id, to_segment_id)
   VALUES (user_id, 'TRIP_001', 'AIR_CANADA', 'HOLD', 1,
           'OUAGA_CENTRE', 'KOUDOUGOU',  -- User monte à Ouaga, descend à Koudougou
           'SEG_001_1', 'SEG_001_1');     -- Un seul segment
   -- booking_segments sera rempli avec SEG_001_1
   -- vw_booking_routes montrera seulement Ouaga → Koudougou

3. QUERY: Afficher toutes les bookings avec leurs routes:
   SELECT * FROM vw_booking_routes;

4. QUERY: Afficher la disponibilité par segment:
   SELECT * FROM vw_available_seats_by_segment WHERE trip_id = 'TRIP_001';

AVANTAGES:
- ✅ Support complet pour boarding/alighting à stations intermédiaires
- ✅ Tracking automatique des segments parcourus
- ✅ Prévention des routes invalides (from > to)
- ✅ Views pour analytics et display

LIMITATIONS RÉSIDUELLES:
- Les sièges sont toujours créés au level TRIP, pas SEGMENT
  (À résoudre dans Migration 010 si nécessaire)
*/

-- ================================================
-- FIN DE LA MIGRATION 009
-- ================================================
