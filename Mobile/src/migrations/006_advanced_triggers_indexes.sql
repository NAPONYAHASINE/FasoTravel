-- ================================================
-- Migration 006: Advanced Triggers & Indexes
-- Description: Validation de règles métier & optimisation requêtes
-- Date: 2025-11-13
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- RÈGLES MÉTIER À VALIDER
-- ================================================

/*
1. DISPONIBILITÉ SIÈGES
   - trip.available_seats = MIN(segment.available_seats)
   - Vérifié avant toute modification segment

2. INTÉGRITÉ TEMPORELLE
   - segment.arrival_time > segment.departure_time
   - trip.arrival_time > trip.departure_time

3. CAPACITÉ COHÉRENCE
   - seat.status = 'held' → hold_expires_at IS NOT NULL
   - seat.status = 'booked' → user_id IS NOT NULL
   - seat.status = 'available' → user_id IS NULL AND hold_expires_at IS NULL

4. PAIEMENT & RÉSERVATION
   - booking.status = 'paid' → booking.payment_id IS NOT NULL
   - booking.status = 'held' → booking.hold_expires_at IS NOT NULL
*/

-- ================================================
-- 1. FONCTION: Validation disponibilité trip
-- ================================================

CREATE OR REPLACE FUNCTION validate_trip_available_seats()
RETURNS TRIGGER AS $$
DECLARE
  min_available INT;
  trip_available INT;
BEGIN
  -- Récupérer le MIN des segment disponibles pour ce trip
  SELECT MIN(available_seats) INTO min_available
  FROM segments
  WHERE trip_id = NEW.trip_id;

  -- Si aucun segment, retourner erreur
  IF min_available IS NULL THEN
    RAISE EXCEPTION 'No segments found for trip %', NEW.trip_id;
  END IF;

  -- Vérifier cohérence: trip.available_seats ne doit pas dépasser le MIN des segments
  IF NEW.available_seats > min_available THEN
    RAISE EXCEPTION 
      'Trip %.available_seats (%) exceeds MIN segment availability (%). Rule: trip.available = MIN(segments.available)',
      NEW.trip_id, NEW.available_seats, min_available;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 2. TRIGGER: Validation avant INSERT/UPDATE trip
-- ================================================

DROP TRIGGER IF EXISTS trg_validate_trip_available_seats ON trips;
CREATE TRIGGER trg_validate_trip_available_seats
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION validate_trip_available_seats();

-- ================================================
-- 3. FONCTION: Auto-update trip.available_seats
-- ================================================

CREATE OR REPLACE FUNCTION update_trip_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand un segment change ses available_seats,
  -- recalculer le trip.available_seats = MIN(segments.available_seats)
  UPDATE trips
  SET available_seats = (
    SELECT MIN(available_seats) FROM segments WHERE trip_id = NEW.trip_id
  ),
  updated_at = NOW()
  WHERE trip_id = NEW.trip_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 4. TRIGGER: Update trip après modification segment
-- ================================================

DROP TRIGGER IF EXISTS trg_update_trip_on_segment_change ON segments;
CREATE TRIGGER trg_update_trip_on_segment_change
  AFTER INSERT OR UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_available_seats();

-- ================================================
-- 5. FONCTION: Validation cohérence siège
-- ================================================

CREATE OR REPLACE FUNCTION validate_seat_status_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Si status = 'held', hold_expires_at doit être renseigné
  IF NEW.status = 'held' AND NEW.hold_expires_at IS NULL THEN
    RAISE EXCEPTION 'Seat % cannot be held without hold_expires_at', NEW.seat_id;
  END IF;

  -- Si status = 'booked', user_id doit être renseigné
  IF NEW.status = 'booked' AND NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Seat % cannot be booked without user_id', NEW.seat_id;
  END IF;

  -- Si status = 'available', user_id et hold_expires_at doivent être NULL
  IF NEW.status = 'available' THEN
    IF NEW.user_id IS NOT NULL OR NEW.hold_expires_at IS NOT NULL THEN
      RAISE EXCEPTION 'Seat % cannot be available with user_id or hold_expires_at', NEW.seat_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 6. TRIGGER: Validation avant INSERT/UPDATE seat
-- ================================================

DROP TRIGGER IF EXISTS trg_validate_seat_consistency ON seats;
CREATE TRIGGER trg_validate_seat_consistency
  BEFORE INSERT OR UPDATE ON seats
  FOR EACH ROW
  EXECUTE FUNCTION validate_seat_status_consistency();

-- ================================================
-- 7. FONCTION: Validation cohérence booking
-- ================================================

CREATE OR REPLACE FUNCTION validate_booking_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- Si status = 'paid', payment_id doit être renseigné
  IF NEW.status = 'paid' AND NEW.payment_id IS NULL THEN
    RAISE EXCEPTION 'Booking % cannot be paid without payment_id', NEW.booking_id;
  END IF;

  -- Si status = 'held', hold_expires_at doit être renseigné
  IF NEW.status = 'held' AND NEW.hold_expires_at IS NULL THEN
    RAISE EXCEPTION 'Booking % cannot be held without hold_expires_at', NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. TRIGGER: Validation avant INSERT/UPDATE booking
-- ================================================

DROP TRIGGER IF EXISTS trg_validate_booking_consistency ON bookings;
CREATE TRIGGER trg_validate_booking_consistency
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_consistency();

-- ================================================
-- 9. FONCTION: Validation cohérence temps segment
-- ================================================

CREATE OR REPLACE FUNCTION validate_segment_times()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.arrival_time <= NEW.departure_time THEN
    RAISE EXCEPTION 'Segment %: arrival_time (%) must be after departure_time (%)',
      NEW.segment_id, NEW.arrival_time, NEW.departure_time;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 10. TRIGGER: Validation temps segment
-- ================================================

DROP TRIGGER IF EXISTS trg_validate_segment_times ON segments;
CREATE TRIGGER trg_validate_segment_times
  BEFORE INSERT OR UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION validate_segment_times();

-- ================================================
-- 11. FONCTION: Validation cohérence temps trip
-- ================================================

CREATE OR REPLACE FUNCTION validate_trip_times()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.arrival_time <= NEW.departure_time THEN
    RAISE EXCEPTION 'Trip %: arrival_time (%) must be after departure_time (%)',
      NEW.trip_id, NEW.arrival_time, NEW.departure_time;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 12. TRIGGER: Validation temps trip
-- ================================================

DROP TRIGGER IF EXISTS trg_validate_trip_times ON trips;
CREATE TRIGGER trg_validate_trip_times
  BEFORE INSERT OR UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION validate_trip_times();

-- ================================================
-- INDEXES SUPPLÉMENTAIRES
-- ================================================
-- Les contraintes Foreign Key créent déjà certains indexes
-- Ajouter les manquants pour les requêtes les plus courantes

-- ================================================
-- 13. INDEXES: Recherche par date & route
-- ================================================

CREATE INDEX IF NOT EXISTS idx_trips_from_to_departure
  ON trips(from_stop_id, to_stop_id, departure_time);

CREATE INDEX IF NOT EXISTS idx_trips_operator_date
  ON trips(operator_id, DATE(departure_time));

CREATE INDEX IF NOT EXISTS idx_segments_trip_sequence
  ON segments(trip_id, sequence_number);

-- ================================================
-- 14. INDEXES: Recherche sièges & statut
-- ================================================

CREATE INDEX IF NOT EXISTS idx_seats_trip_status
  ON seats(trip_id, status);

CREATE INDEX IF NOT EXISTS idx_seats_user_status
  ON seats(user_id, status);

CREATE INDEX IF NOT EXISTS idx_seats_hold_expires
  ON seats(hold_expires_at) 
  WHERE status = 'held';

-- ================================================
-- 15. INDEXES: Recherche réservations & paiements
-- ================================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_status
  ON bookings(user_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_trip_status
  ON bookings(trip_id, status);

CREATE INDEX IF NOT EXISTS idx_bookings_payment_id
  ON bookings(payment_id);

CREATE INDEX IF NOT EXISTS idx_bookings_hold_expires
  ON bookings(hold_expires_at)
  WHERE status = 'held';

-- ================================================
-- 16. INDEXES: Recherche tickets
-- ================================================

CREATE INDEX IF NOT EXISTS idx_tickets_booking_id
  ON tickets(booking_id);

CREATE INDEX IF NOT EXISTS idx_tickets_code
  ON tickets(alphanumeric_code, qr_code);

CREATE INDEX IF NOT EXISTS idx_tickets_passenger
  ON tickets(passenger_name, passenger_phone);

CREATE INDEX IF NOT EXISTS idx_tickets_user_status
  ON tickets(user_id, status);

-- ================================================
-- 17. INDEXES: Recherche paiements
-- ================================================

CREATE INDEX IF NOT EXISTS idx_payments_user_status
  ON payments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id
  ON payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_payments_provider_ref
  ON payments(provider_reference);

-- ================================================
-- 18. INDEXES: Recherche notifications & sessions
-- ================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_expires
  ON user_sessions(user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_devices_user
  ON user_devices(user_id);

-- ================================================
-- 19. INDEXES: Recherche analytics
-- ================================================

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_date
  ON analytics_events(user_id, DATE(created_at));

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type
  ON analytics_events(event_type);

-- ================================================
-- 20. VIEW: Availabilité trips - pour requêtes rapides
-- ================================================

DROP VIEW IF EXISTS vw_trips_availability CASCADE;

CREATE VIEW vw_trips_availability AS
SELECT 
  t.trip_id,
  t.operator_id,
  t.operator_name,
  t.operator_logo,
  t.from_stop_id,
  t.to_stop_id,
  t.from_stop_name,
  t.to_stop_name,
  t.departure_time,
  t.arrival_time,
  t.base_price,
  t.available_seats,
  t.total_seats,
  ROUND(100.0 * t.available_seats / t.total_seats, 2) as availability_percent,
  CASE 
    WHEN t.available_seats = 0 THEN 'FULL'
    WHEN t.available_seats < 5 THEN 'CRITICAL'
    WHEN t.available_seats < t.total_seats / 4 THEN 'LOW'
    ELSE 'AVAILABLE'
  END as availability_status,
  (SELECT COUNT(*) FROM segments WHERE trip_id = t.trip_id) as num_segments,
  (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id) as min_segment_available,
  CASE 
    WHEN t.available_seats = (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id)
    THEN true
    ELSE false
  END as is_consistent,
  t.is_cancelled,
  t.created_at,
  t.updated_at
FROM trips t;

-- ================================================
-- 21. VIEW: Détails complets segments
-- ================================================

DROP VIEW IF EXISTS vw_segments_details CASCADE;

CREATE VIEW vw_segments_details AS
SELECT 
  s.segment_id,
  s.trip_id,
  t.operator_name,
  t.operator_logo,
  s.from_stop_id,
  s.to_stop_id,
  s.from_stop_name,
  s.to_stop_name,
  s.departure_time,
  s.arrival_time,
  s.sequence_number,
  s.distance_km,
  s.available_seats,
  s.total_seats,
  ROUND(100.0 * s.available_seats / s.total_seats, 2) as availability_percent,
  s.base_price,
  s.created_at,
  s.updated_at
FROM segments s
JOIN trips t ON s.trip_id = t.trip_id;

-- ================================================
-- 22. VIEW: Sièges occupés par trip
-- ================================================

DROP VIEW IF EXISTS vw_seats_by_trip CASCADE;

CREATE VIEW vw_seats_by_trip AS
SELECT 
  trip_id,
  COUNT(*) as total_seats,
  COUNT(*) FILTER (WHERE status = 'available') as available_count,
  COUNT(*) FILTER (WHERE status = 'held') as held_count,
  COUNT(*) FILTER (WHERE status = 'booked') as booked_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'available') / COUNT(*), 2) as availability_percent
FROM seats
GROUP BY trip_id;

-- ================================================
-- 23. STATISTIQUES: Queries utiles pour monitoring
-- ================================================

-- Vérifier que tous les trips respectent la règle
-- À exécuter régulièrement en production
DROP VIEW IF EXISTS vw_trips_inconsistencies CASCADE;

CREATE VIEW vw_trips_inconsistencies AS
SELECT 
  t.trip_id,
  t.operator_name,
  t.available_seats as declared_available,
  (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id) as calculated_min,
  'MISMATCH' as status
FROM trips t
WHERE t.available_seats != (SELECT MIN(available_seats) FROM segments WHERE trip_id = t.trip_id)
  OR NOT EXISTS (SELECT 1 FROM segments WHERE trip_id = t.trip_id);

-- ================================================
-- ROLLBACK SECTION
-- ================================================

/*
-- À exécuter si rollback nécessaire:

DROP TRIGGER IF EXISTS trg_validate_trip_times ON trips;
DROP TRIGGER IF EXISTS trg_validate_segment_times ON segments;
DROP TRIGGER IF EXISTS trg_validate_booking_consistency ON bookings;
DROP TRIGGER IF EXISTS trg_validate_seat_consistency ON seats;
DROP TRIGGER IF EXISTS trg_update_trip_on_segment_change ON segments;
DROP TRIGGER IF EXISTS trg_validate_trip_available_seats ON trips;

DROP FUNCTION IF EXISTS validate_trip_times();
DROP FUNCTION IF EXISTS validate_segment_times();
DROP FUNCTION IF EXISTS validate_booking_consistency();
DROP FUNCTION IF EXISTS validate_seat_status_consistency();
DROP FUNCTION IF EXISTS update_trip_available_seats();
DROP FUNCTION IF EXISTS validate_trip_available_seats();

DROP VIEW IF EXISTS vw_trips_inconsistencies;
DROP VIEW IF EXISTS vw_seats_by_trip;
DROP VIEW IF EXISTS vw_segments_details;
DROP VIEW IF EXISTS vw_trips_availability;

DROP INDEX IF EXISTS idx_analytics_events_event_type;
DROP INDEX IF EXISTS idx_analytics_events_user_date;
DROP INDEX IF EXISTS idx_user_devices_user;
DROP INDEX IF EXISTS idx_user_sessions_user_expires;
DROP INDEX IF EXISTS idx_notifications_user_read;
DROP INDEX IF EXISTS idx_payments_provider_ref;
DROP INDEX IF EXISTS idx_payments_booking_id;
DROP INDEX IF EXISTS idx_payments_user_status;
DROP INDEX IF EXISTS idx_tickets_user_status;
DROP INDEX IF EXISTS idx_tickets_passenger;
DROP INDEX IF EXISTS idx_tickets_code;
DROP INDEX IF EXISTS idx_tickets_booking_id;
DROP INDEX IF EXISTS idx_bookings_hold_expires;
DROP INDEX IF EXISTS idx_bookings_payment_id;
DROP INDEX IF EXISTS idx_bookings_trip_status;
DROP INDEX IF EXISTS idx_bookings_user_status;
DROP INDEX IF EXISTS idx_seats_hold_expires;
DROP INDEX IF EXISTS idx_seats_user_status;
DROP INDEX IF EXISTS idx_seats_trip_status;
DROP INDEX IF EXISTS idx_segments_trip_sequence;
DROP INDEX IF EXISTS idx_trips_operator_date;
DROP INDEX IF EXISTS idx_trips_from_to_departure;
*/

-- ================================================
-- NOTES IMPORTANTES
-- ================================================

/*
1. TRIGGERS POUR VALIDATION MÉTIER
   - validate_trip_available_seats(): Trip.available_seats <= MIN(segments.available_seats)
   - validate_seat_status_consistency(): Cohérence status vs user_id/hold_expires_at
   - validate_booking_consistency(): Cohérence status vs payment_id/hold_expires_at
   - validate_segment_times(): arrival > departure
   - validate_trip_times(): arrival > departure

2. TRIGGERS POUR AUTO-MISE À JOUR
   - update_trip_available_seats(): Recalcule trip.available après modif segment
   - Permet de ne pas coder logique complexe côté backend

3. INDEXES POUR PERFORMANCE
   - Couvrir les WHERE clauses les plus courants
   - Couvrir les joins (trip_id, user_id, etc)
   - PARTIAL INDEX pour les holds expirant (status = 'held')

4. VIEWS POUR SIMPLIFIER REQUÊTES
   - vw_trips_availability: Liste des trips avec stats disponibilité
   - vw_trips_inconsistencies: Détecter violations de la règle métier
   - vw_seats_by_trip: Stats sièges par trip
   - À utiliser pour API REST & monitoring

5. À TESTER
   - Créer un trip avec segment.available_seats < trip.available_seats → doit échouer
   - Modifier segment.available_seats → doit mettre à jour trip
   - Créer seat avec status='held' sans hold_expires_at → doit échouer

6. PERFORMANCE
   - Indexes créés sur colonnes les plus interrogées
   - Views pré-calculées pour éviter agrégations côté app
   - Penser à VACUUM & ANALYZE après grandes modifications
*/

-- ================================================
-- FIN DE LA MIGRATION 006
-- ================================================
