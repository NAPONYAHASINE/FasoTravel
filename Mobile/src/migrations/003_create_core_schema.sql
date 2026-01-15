-- ================================================
-- Migration 003: Schema Core - Tables principales
-- Description: Création des tables pour transport, réservations, billets
-- Date: 2025-11-13
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- ROLLBACK (à exécuter en cas d'erreur)
-- ================================================
/*
DROP TABLE IF EXISTS ticket_transfers CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS operators CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP INDEX IF EXISTS idx_trips_operator_date;
DROP INDEX IF EXISTS idx_trips_route;
DROP INDEX IF EXISTS idx_segments_trip;
DROP INDEX IF EXISTS idx_bookings_user;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_tickets_booking;
DROP INDEX IF EXISTS idx_tickets_user;
DROP INDEX IF EXISTS idx_seats_trip;
DROP INDEX IF EXISTS idx_seats_status;
*/

-- ================================================
-- 1. TABLE: users
-- Stocke les utilisateurs de l'app
-- ================================================

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'OPERATOR_ADMIN', 'SUPER_ADMIN')),
  preferred_language VARCHAR(10) DEFAULT 'fr',
  profile_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- ================================================
-- 2. TABLE: operators
-- Compagnies de transport
-- ================================================

CREATE TABLE IF NOT EXISTS operators (
  operator_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  operator_logo VARCHAR(10) NOT NULL,  -- emoji (ex: '✈️')
  logo_url VARCHAR(500),  -- URL image uploadée (optionnel)
  description TEXT,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  website_url VARCHAR(500),
  founded_year INTEGER,
  fleet_size INTEGER,
  total_trips INTEGER DEFAULT 0,
  amenities TEXT[],  -- Array: ['WiFi', 'AC', 'USB', ...]
  rating NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operators_active ON operators(is_active) WHERE is_active = true;
CREATE INDEX idx_operators_rating ON operators(rating DESC);

-- ================================================
-- 3. TABLE: stations (gares)
-- Points de départ/arrivée des trajets
-- ================================================

CREATE TABLE IF NOT EXISTS stations (
  station_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  address VARCHAR(500),
  operator_id VARCHAR(50),
  amenities TEXT[],
  opening_hours VARCHAR(50),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_station_operator FOREIGN KEY (operator_id)
    REFERENCES operators(operator_id) ON DELETE SET NULL
);

CREATE INDEX idx_stations_city ON stations(city);
CREATE INDEX idx_stations_location ON stations(latitude, longitude);
CREATE INDEX idx_stations_active ON stations(is_active) WHERE is_active = true;
CREATE INDEX idx_stations_operator ON stations(operator_id);  -- ✅ Added for filtering stations by operator

-- ================================================
-- 4. TABLE: seat_map_configs
-- Configuration du plan de sièges (partagée par véhicule)
-- ================================================

CREATE TABLE IF NOT EXISTS seat_map_configs (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rows INTEGER NOT NULL CHECK (rows > 0),
  seats_per_row INTEGER NOT NULL CHECK (seats_per_row > 0),
  aisle_after INTEGER DEFAULT 0,  -- Colonne après laquelle placer l'allée
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  layout JSONB,  -- Disposition exacte si besoin (optionnel)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- 5. TABLE: vehicles
-- Véhicules de transport (bus, minibus, etc.)
-- ================================================

CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id VARCHAR(50) PRIMARY KEY,
  operator_id VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,  -- 'Bus climatisé', 'Mini-bus', etc.
  registration_number VARCHAR(20) UNIQUE,
  seat_map_config_id UUID NOT NULL,
  amenities TEXT[],
  accessibility_features TEXT[],
  last_maintenance_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_vehicle_operator FOREIGN KEY (operator_id)
    REFERENCES operators(operator_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_vehicle_seat_config FOREIGN KEY (seat_map_config_id)
    REFERENCES seat_map_configs(config_id) ON DELETE RESTRICT
);

CREATE INDEX idx_vehicles_operator ON vehicles(operator_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active) WHERE is_active = true;

-- ================================================
-- 6. TABLE: trips
-- Trajets proposés par les opérateurs
-- ================================================

CREATE TABLE IF NOT EXISTS trips (
  trip_id VARCHAR(50) PRIMARY KEY,
  operator_id VARCHAR(50) NOT NULL,
  operator_name VARCHAR(255) NOT NULL,
  operator_logo VARCHAR(10),  -- emoji
  vehicle_id VARCHAR(50) NOT NULL,
  vehicle_type VARCHAR(100),
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  base_price INTEGER NOT NULL CHECK (base_price > 0),
  currency VARCHAR(10) DEFAULT 'XOF',
  from_stop_id VARCHAR(50) NOT NULL,
  to_stop_id VARCHAR(50) NOT NULL,
  from_stop_name VARCHAR(255),
  to_stop_name VARCHAR(255),
  amenities TEXT[],
  has_live_tracking BOOLEAN DEFAULT false,
  available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_trip_operator FOREIGN KEY (operator_id)
    REFERENCES operators(operator_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_trip_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
  
  CONSTRAINT fk_trip_from_station FOREIGN KEY (from_stop_id)
    REFERENCES stations(station_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_trip_to_station FOREIGN KEY (to_stop_id)
    REFERENCES stations(station_id) ON DELETE CASCADE,
  
  CONSTRAINT check_times CHECK (arrival_time > departure_time),
  CONSTRAINT check_available_seats CHECK (available_seats <= total_seats)
);

CREATE INDEX idx_trips_operator_date ON trips(operator_id, departure_time);
CREATE INDEX idx_trips_route ON trips(from_stop_id, to_stop_id, departure_time);
CREATE INDEX idx_trips_active ON trips(is_cancelled, departure_time) WHERE is_cancelled = false;

-- ================================================
-- 7. TABLE: segments
-- Segments d'un trajet (arrêts intermédiaires)
-- ================================================

CREATE TABLE IF NOT EXISTS segments (
  segment_id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50) NOT NULL,
  from_stop_id VARCHAR(50) NOT NULL,
  to_stop_id VARCHAR(50) NOT NULL,
  from_stop_name VARCHAR(255),
  to_stop_name VARCHAR(255),
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  distance_km NUMERIC(10, 2),
  available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  base_price INTEGER NOT NULL CHECK (base_price > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_segment_trip FOREIGN KEY (trip_id)
    REFERENCES trips(trip_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_segment_from_station FOREIGN KEY (from_stop_id)
    REFERENCES stations(station_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_segment_to_station FOREIGN KEY (to_stop_id)
    REFERENCES stations(station_id) ON DELETE CASCADE,
  
  CONSTRAINT check_segment_times CHECK (arrival_time > departure_time),
  CONSTRAINT check_segment_seats CHECK (available_seats <= total_seats),
  
  -- Un segment par trip+sequence
  CONSTRAINT unique_trip_sequence UNIQUE(trip_id, sequence_number)
);

CREATE INDEX idx_segments_trip ON segments(trip_id, sequence_number);
CREATE INDEX idx_segments_route ON segments(from_stop_id, to_stop_id);

-- ================================================
-- 8. TABLE: seats
-- État des sièges d'un trajet
-- Status: 'available', 'hold', 'paid', 'offline_reserved', 'selected'
-- ================================================

CREATE TABLE IF NOT EXISTS seats (
  seat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id VARCHAR(50) NOT NULL,
  seat_number VARCHAR(10) NOT NULL,  -- 'A1', 'B5', etc.
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'hold', 'paid', 'offline_reserved', 'selected')
  ),
  booked_by_user_id UUID,
  booked_at TIMESTAMP,
  hold_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_seat_trip FOREIGN KEY (trip_id)
    REFERENCES trips(trip_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_seat_user FOREIGN KEY (booked_by_user_id)
    REFERENCES users(user_id) ON DELETE SET NULL,
  
  CONSTRAINT unique_trip_seat UNIQUE(trip_id, seat_number)
);

CREATE INDEX idx_seats_trip ON seats(trip_id);
CREATE INDEX idx_seats_status ON seats(status) WHERE status IN ('hold', 'paid');
CREATE INDEX idx_seats_user ON seats(booked_by_user_id);

-- ================================================
-- 9. TABLE: bookings
-- Réservations (HOLD ou CONFIRMED)
-- ================================================

CREATE TABLE IF NOT EXISTS bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trip_id VARCHAR(50) NOT NULL,
  operator_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'HOLD' CHECK (
    status IN ('HOLD', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
  ),
  total_amount INTEGER NOT NULL CHECK (total_amount > 0),
  currency VARCHAR(10) DEFAULT 'XOF',
  num_passengers INTEGER NOT NULL CHECK (num_passengers > 0),
  hold_expires_at TIMESTAMP,
  payment_id UUID,
  payment_status VARCHAR(50),
  booking_for VARCHAR(50),  -- 'self', 'other'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_booking_trip FOREIGN KEY (trip_id)
    REFERENCES trips(trip_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_booking_operator FOREIGN KEY (operator_id)
    REFERENCES operators(operator_id) ON DELETE CASCADE
);

CREATE INDEX idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_payment ON bookings(payment_status);

-- ================================================
-- 10. TABLE: tickets
-- Billets d'un trajet (un par passager)
-- ================================================

CREATE TABLE IF NOT EXISTS tickets (
  ticket_id VARCHAR(50) PRIMARY KEY,
  bundle_id UUID,  -- Group multiple tickets
  trip_id VARCHAR(50) NOT NULL,
  booking_id UUID NOT NULL,
  operator_id VARCHAR(50) NOT NULL,
  operator_name VARCHAR(255),
  from_stop_id VARCHAR(50),
  to_stop_id VARCHAR(50),
  from_stop_name VARCHAR(255),
  to_stop_name VARCHAR(255),
  departure_time TIMESTAMP,
  arrival_time TIMESTAMP,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_phone VARCHAR(20),
  passenger_email VARCHAR(255),
  seat_number VARCHAR(10),
  status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (
    status IN ('AVAILABLE', 'HOLD', 'PAID', 'EMBARKED', 'CANCELLED')
  ),
  qr_code VARCHAR(500) NOT NULL UNIQUE,
  alphanumeric_code VARCHAR(50) NOT NULL UNIQUE,
  price INTEGER NOT NULL CHECK (price > 0),
  currency VARCHAR(10) DEFAULT 'XOF',
  payment_method VARCHAR(50),
  payment_id VARCHAR(100),
  expires_at TIMESTAMP,
  holder_downloaded BOOLEAN DEFAULT false,
  holder_downloaded_at TIMESTAMP,
  holder_presented BOOLEAN DEFAULT false,
  holder_presented_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  can_cancel BOOLEAN DEFAULT true,
  can_transfer BOOLEAN DEFAULT true,
  cancellation_reason VARCHAR(500),
  refund_status VARCHAR(50),  -- 'PENDING', 'COMPLETED', 'REJECTED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_ticket_trip FOREIGN KEY (trip_id)
    REFERENCES trips(trip_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_ticket_operator FOREIGN KEY (operator_id)
    REFERENCES operators(operator_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_ticket_from_station FOREIGN KEY (from_stop_id)
    REFERENCES stations(station_id) ON DELETE SET NULL,
  
  CONSTRAINT fk_ticket_to_station FOREIGN KEY (to_stop_id)
    REFERENCES stations(station_id) ON DELETE SET NULL
);

CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_tickets_trip ON tickets(trip_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_code ON tickets(qr_code, alphanumeric_code);
CREATE INDEX idx_tickets_passenger ON tickets(passenger_name, passenger_phone);

-- ================================================
-- 11. TABLE: ticket_transfers
-- Historique de transferts de billets
-- ================================================

CREATE TABLE IF NOT EXISTS ticket_transfers (
  transfer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(50) NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  transfer_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'COMPLETED', 'CANCELLED')
  ),
  expires_at TIMESTAMP NOT NULL,
  transfer_token VARCHAR(255) UNIQUE,
  
  CONSTRAINT fk_transfer_ticket FOREIGN KEY (ticket_id)
    REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_transfer_from_user FOREIGN KEY (from_user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_transfer_to_user FOREIGN KEY (to_user_id)
    REFERENCES users(user_id) ON DELETE CASCADE,
  
  CONSTRAINT check_expires CHECK (expires_at > transfer_time)
);

CREATE INDEX idx_transfers_ticket ON ticket_transfers(ticket_id);
CREATE INDEX idx_transfers_from_user ON ticket_transfers(from_user_id);
CREATE INDEX idx_transfers_to_user ON ticket_transfers(to_user_id);
CREATE INDEX idx_transfers_status ON ticket_transfers(status);

-- ================================================
-- VÉRIFICATIONS
-- ================================================

-- Vérifier que les tables sont créées
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'operators', 'stations', 'vehicles', 'seat_map_configs',
    'trips', 'segments', 'seats', 'bookings', 'tickets', 'ticket_transfers'
  )
ORDER BY table_name;

-- Vérifier les foreign keys
SELECT 
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.key_column_usage
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'
ORDER BY table_name, constraint_name;

-- ================================================
-- NOTES
-- ================================================

/*
1. SEAT AVAILABILITY RULE (CRITIQUE)
   - trip.available_seats = Math.min(segment.available_seats)
   - Raison: Un passager doit parcourir TOUS les segments du trajet
   - Cette règle sera validée côté backend + trigger optionnel

2. RELATIONS CLÉS:
   - operators → vehicles → trips → segments
   - trips → seats (état de chaque siège)
   - bookings → tickets (un ticket par passager)
   - users → bookings, tickets, ticket_transfers

3. STATUTS:
   - SEAT: available, hold (10-15 min), paid, offline_reserved, selected
   - BOOKING: HOLD, CONFIRMED, CANCELLED, COMPLETED
   - TICKET: AVAILABLE, HOLD, PAID, EMBARKED, CANCELLED

4. HÉRITAGE DE DONNÉES:
   - trip.operator_id, trip.operator_name, trip.operator_logo
   - trip.from_stop_id, trip.from_stop_name (dénorm pour rapidité)
   - ticket.passenger_name, ticket.passenger_phone (spécifique au billet)

5. INDEXES:
   - Optimisés pour recherches courantes (trips par route+date, bookings par utilisateur)
   - Index partiels sur is_active, status pour colonnes très bimodales

6. CONSTRAINTS:
   - CHECK price > 0, available_seats >= 0 <= total_seats
   - CHECK times: arrival > departure
   - UNIQUE: QR code, alphanumeric code, email, phone, registration_number

7. CASCADES:
   - operator → trips/vehicles/seats (ON DELETE CASCADE)
   - trip → segments, seats, bookings, tickets (ON DELETE CASCADE)
   - Attention: seat_map_config ON DELETE RESTRICT (protège config)
*/

-- ================================================
-- FIN DE LA MIGRATION 003
-- ================================================
