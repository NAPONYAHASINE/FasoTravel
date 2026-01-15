-- ================================================
-- Migration 007: Données Utilisateur & Transactionnelles
-- Description: Données de test pour bookings, payments, tickets
-- Date: 2025-11-13
-- Database: PostgreSQL 12+
-- OPTIONNEL: À commenter/supprimer pour production
-- ================================================

-- ================================================
-- 1. SEED USERS - 3 utilisateurs de test
-- ================================================

INSERT INTO users (user_id, email, phone, full_name, role, password_hash, is_verified, is_active, created_at, updated_at)
VALUES 
  ('USER_001', 'alice@fasotravel.local', '+226 70 00 00 01', 'Alice Dubois', 'user', 
   '$2b$10$abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab12', true, true, NOW(), NOW()),
  ('USER_002', 'bob@fasotravel.local', '+226 70 00 00 02', 'Bob Martin', 'user',
   '$2b$10$abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab12', true, true, NOW(), NOW()),
  ('USER_003', 'charlie@fasotravel.local', '+226 70 00 00 03', 'Charlie Traore', 'user',
   '$2b$10$abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab12', false, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ================================================
-- 2. SEED PAYMENTS - Test payment data
-- ================================================

INSERT INTO payments (payment_id, booking_id, user_id, amount, currency, payment_method, 
                      status, provider_reference, created_at, updated_at)
VALUES 
  ('PAY_001', NULL, 'USER_001', 8500.00, 'XOF', 'mobile_money', 'completed',
   'MTN_MOMO_12345678', NOW(), NOW()),
  ('PAY_002', NULL, 'USER_002', 7000.00, 'XOF', 'card', 'completed',
   'VISA_CARD_87654321', NOW(), NOW())
ON CONFLICT (payment_id) DO NOTHING;

-- ================================================
-- 3. SEED BOOKINGS - Réservations de test
-- ================================================

-- Booking pour USER_001 sur TRIP_001 (12 sièges dispo)
INSERT INTO bookings (booking_id, user_id, trip_id, operator_id, num_passengers, 
                      status, amount, payment_id, hold_expires_at, created_at, updated_at)
VALUES 
  ('BOOK_001', 'USER_001', 'TRIP_001', 'AIR_CANADA', 2, 'paid', 17000.00, 'PAY_001', NULL, NOW(), NOW()),
  ('BOOK_002', 'USER_002', 'TRIP_002', 'SCOOT', 1, 'paid', 7000.00, 'PAY_002', NULL, NOW(), NOW()),
  ('BOOK_003', 'USER_003', 'TRIP_003', 'AIR_CANADA', 3, 'held', 25500.00, NULL, NOW() + INTERVAL '30 minutes', NOW(), NOW())
ON CONFLICT (booking_id) DO NOTHING;

-- ================================================
-- 4. SEED SEATS - Sièges réservés
-- ================================================

-- Seats pour TRIP_001 (44 total, 12 available → 32 occupés)
INSERT INTO seats (seat_id, trip_id, seat_number, status, user_id, hold_expires_at, created_at, updated_at)
VALUES 
  -- Disponibles (12)
  (gen_random_uuid(), 'TRIP_001', 'A1', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'A2', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'A3', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'A4', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'B1', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'B2', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'B3', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'B4', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'C1', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'C2', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'C3', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'C4', 'available', NULL, NULL, NOW(), NOW()),
  
  -- Réservés pour BOOK_001 (USER_001, 2 passagers)
  (gen_random_uuid(), 'TRIP_001', 'D1', 'booked', 'USER_001', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'D2', 'booked', 'USER_001', NULL, NOW(), NOW()),
  
  -- Autres sièges (32 - 2 = 30 occupés par autres clients)
  (gen_random_uuid(), 'TRIP_001', 'D3', 'booked', 'OTHER_001', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'D4', 'booked', 'OTHER_002', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'E1', 'booked', 'OTHER_003', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'E2', 'booked', 'OTHER_004', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'E3', 'booked', 'OTHER_005', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'E4', 'booked', 'OTHER_006', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'F1', 'booked', 'OTHER_007', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'F2', 'booked', 'OTHER_008', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'F3', 'booked', 'OTHER_009', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'F4', 'booked', 'OTHER_010', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'G1', 'booked', 'OTHER_011', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'G2', 'booked', 'OTHER_012', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'G3', 'booked', 'OTHER_013', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'G4', 'booked', 'OTHER_014', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'H1', 'booked', 'OTHER_015', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'H2', 'booked', 'OTHER_016', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'H3', 'booked', 'OTHER_017', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'H4', 'booked', 'OTHER_018', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'I1', 'booked', 'OTHER_019', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'I2', 'booked', 'OTHER_020', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'I3', 'booked', 'OTHER_021', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'I4', 'booked', 'OTHER_022', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'J1', 'booked', 'OTHER_023', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'J2', 'booked', 'OTHER_024', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'J3', 'booked', 'OTHER_025', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'J4', 'booked', 'OTHER_026', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'K1', 'booked', 'OTHER_027', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'K2', 'booked', 'OTHER_028', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'K3', 'booked', 'OTHER_029', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_001', 'K4', 'booked', 'OTHER_030', NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Seats pour TRIP_002 (30 total, 8 available → 22 occupés)
INSERT INTO seats (seat_id, trip_id, seat_number, status, user_id, hold_expires_at, created_at, updated_at)
VALUES 
  -- Disponibles (8)
  (gen_random_uuid(), 'TRIP_002', 'A1', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'A2', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'A3', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'B1', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'B2', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'B3', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'C1', 'available', NULL, NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'C2', 'available', NULL, NULL, NOW(), NOW()),
  
  -- Réservé pour BOOK_002 (USER_002, 1 passager)
  (gen_random_uuid(), 'TRIP_002', 'C3', 'booked', 'USER_002', NULL, NOW(), NOW()),
  
  -- Autres occupés
  (gen_random_uuid(), 'TRIP_002', 'D1', 'booked', 'OTHER_031', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'D2', 'booked', 'OTHER_032', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'D3', 'booked', 'OTHER_033', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'E1', 'booked', 'OTHER_034', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'E2', 'booked', 'OTHER_035', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'E3', 'booked', 'OTHER_036', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'F1', 'booked', 'OTHER_037', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'F2', 'booked', 'OTHER_038', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'F3', 'booked', 'OTHER_039', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'G1', 'booked', 'OTHER_040', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'G2', 'booked', 'OTHER_041', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'G3', 'booked', 'OTHER_042', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'H1', 'booked', 'OTHER_043', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'H2', 'booked', 'OTHER_044', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'H3', 'booked', 'OTHER_045', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'I1', 'booked', 'OTHER_046', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'I2', 'booked', 'OTHER_047', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'I3', 'booked', 'OTHER_048', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'J1', 'booked', 'OTHER_049', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'J2', 'booked', 'OTHER_050', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'J3', 'booked', 'OTHER_051', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'TRIP_002', 'K1', 'held', NULL, NOW() + INTERVAL '30 minutes', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ================================================
-- 5. SEED TICKETS - Billets générés
-- ================================================

INSERT INTO tickets (ticket_id, booking_id, trip_id, operator_id, user_id, passenger_name, passenger_phone,
                     seat_number, status, alphanumeric_code, qr_code, created_at, updated_at)
VALUES 
  -- Tickets pour BOOK_001 (2 passagers)
  ('TKT_001_P1', 'BOOK_001', 'TRIP_001', 'AIR_CANADA', 'USER_001', 'Alice Dubois', '+226 70 00 00 01',
   'D1', 'confirmed', 'FT-TRIP001-00001', 'QR001001', NOW(), NOW()),
  ('TKT_001_P2', 'BOOK_001', 'TRIP_001', 'AIR_CANADA', 'USER_001', 'Jean Dubois', '+226 70 00 00 01',
   'D2', 'confirmed', 'FT-TRIP001-00002', 'QR001002', NOW(), NOW()),
  
  -- Ticket pour BOOK_002 (1 passager)
  ('TKT_002_P1', 'BOOK_002', 'TRIP_002', 'SCOOT', 'USER_002', 'Bob Martin', '+226 70 00 00 02',
   'C3', 'confirmed', 'FT-TRIP002-00001', 'QR002001', NOW(), NOW()),
  
  -- Tickets pour BOOK_003 (3 passagers, status=held)
  ('TKT_003_P1', 'BOOK_003', 'TRIP_003', 'AIR_CANADA', 'USER_003', 'Charlie Traore', '+226 70 00 00 03',
   NULL, 'pending', 'FT-TRIP003-00001', 'QR003001', NOW(), NOW()),
  ('TKT_003_P2', 'BOOK_003', 'TRIP_003', 'AIR_CANADA', 'USER_003', 'Fatou Traore', '+226 78 00 00 03',
   NULL, 'pending', 'FT-TRIP003-00002', 'QR003002', NOW(), NOW()),
  ('TKT_003_P3', 'BOOK_003', 'TRIP_003', 'AIR_CANADA', 'USER_003', 'Youssef Traore', '+226 78 00 00 04',
   NULL, 'pending', 'FT-TRIP003-00003', 'QR003003', NOW(), NOW())
ON CONFLICT (ticket_id) DO NOTHING;

-- ================================================
-- 6. SEED USER_SESSIONS - Sessions authentifiées
-- ================================================

INSERT INTO user_sessions (session_id, user_id, device_type, auth_token, is_active, expires_at, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'USER_001', 'mobile', 'AUTH_TOKEN_USER001_SESSION001', true, NOW() + INTERVAL '30 days', NOW(), NOW()),
  (gen_random_uuid(), 'USER_002', 'mobile', 'AUTH_TOKEN_USER002_SESSION001', true, NOW() + INTERVAL '30 days', NOW(), NOW()),
  (gen_random_uuid(), 'USER_003', 'web', 'AUTH_TOKEN_USER003_SESSION001', true, NOW() + INTERVAL '30 days', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ================================================
-- 7. SEED USER_DEVICES - Appareils enregistrés
-- ================================================

INSERT INTO user_devices (device_id, user_id, push_token, device_model, os_type, os_version, 
                          last_active_at, push_notifications_enabled, created_at, updated_at)
VALUES 
  ('DEVICE_USER001_001', 'USER_001', 'FCM_TOKEN_USER001_001', 'Samsung Galaxy A21', 'android', '11',
   NOW(), true, NOW(), NOW()),
  ('DEVICE_USER002_001', 'USER_002', 'FCM_TOKEN_USER002_001', 'iPhone 13', 'ios', '15',
   NOW(), true, NOW(), NOW()),
  ('DEVICE_USER003_001', 'USER_003', 'FCM_TOKEN_USER003_001', 'OnePlus 9', 'android', '12',
   NOW() - INTERVAL '2 days', false, NOW(), NOW())
ON CONFLICT (device_id) DO NOTHING;

-- ================================================
-- 8. SEED NOTIFICATIONS - Messages pour utilisateurs
-- ================================================

INSERT INTO notifications (notification_id, user_id, type, title, message, deep_link, is_read, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'USER_001', 'booking_confirmation', 'Réservation confirmée',
   'Votre réservation pour le trajet TRIP_001 est confirmée. Numéro de booking: BOOK_001',
   'app://booking/BOOK_001', false, NOW() - INTERVAL '2 hours', NOW()),
  (gen_random_uuid(), 'USER_001', 'reminder', 'Rappel départ',
   'Votre bus part demain à 07:00. Présentez-vous 30 min avant.',
   'app://trip/TRIP_001', false, NOW() - INTERVAL '1 hour', NOW()),
  (gen_random_uuid(), 'USER_002', 'booking_confirmation', 'Réservation confirmée',
   'Votre réservation pour le trajet TRIP_002 est confirmée. Numéro de booking: BOOK_002',
   'app://booking/BOOK_002', true, NOW() - INTERVAL '3 hours', NOW()),
  (gen_random_uuid(), 'USER_003', 'booking_hold_expiring', 'Réservation expire',
   'Votre réservation BOOK_003 expire dans 30 minutes. Confirmez votre paiement.',
   'app://booking/BOOK_003/payment', false, NOW() - INTERVAL '5 minutes', NOW())
ON CONFLICT DO NOTHING;

-- ================================================
-- 9. SEED ANALYTICS_EVENTS - Événements utilisateur
-- ================================================

INSERT INTO analytics_events (event_id, user_id, event_type, event_data, device_type, user_ip, created_at)
VALUES 
  (gen_random_uuid(), 'USER_001', 'app_open', '{"version": "1.0.0", "location": "home"}', 'mobile',
   '192.168.1.100', NOW() - INTERVAL '5 minutes'),
  (gen_random_uuid(), 'USER_001', 'search_trip', '{"from": "OUAGA_CENTRE", "to": "BOBO_CENTRE", "results": 3}', 'mobile',
   '192.168.1.100', NOW() - INTERVAL '4 minutes'),
  (gen_random_uuid(), 'USER_001', 'view_trip', '{"trip_id": "TRIP_001", "duration_seconds": 45}', 'mobile',
   '192.168.1.100', NOW() - INTERVAL '3 minutes'),
  (gen_random_uuid(), 'USER_001', 'select_seats', '{"trip_id": "TRIP_001", "seats": ["D1", "D2"]}', 'mobile',
   '192.168.1.100', NOW() - INTERVAL '2 minutes'),
  (gen_random_uuid(), 'USER_001', 'complete_booking', '{"booking_id": "BOOK_001", "amount": 17000}', 'mobile',
   '192.168.1.100', NOW() - INTERVAL '1 minute'),
  (gen_random_uuid(), 'USER_002', 'app_open', '{"version": "1.0.0", "location": "home"}', 'mobile',
   '192.168.1.101', NOW() - INTERVAL '10 minutes'),
  (gen_random_uuid(), 'USER_003', 'app_open', '{"version": "1.0.0", "location": "search"}', 'web',
   '192.168.1.102', NOW() - INTERVAL '20 minutes')
ON CONFLICT DO NOTHING;

-- ================================================
-- VALIDATION & STATISTIQUES
-- ================================================

-- Afficher les stats de la base
SELECT 
  'OPERATORS' as table_name, COUNT(*) as row_count FROM operators
UNION ALL
SELECT 'USERS' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'STATIONS' as table_name, COUNT(*) FROM stations
UNION ALL
SELECT 'VEHICLES' as table_name, COUNT(*) FROM vehicles
UNION ALL
SELECT 'TRIPS' as table_name, COUNT(*) FROM trips
UNION ALL
SELECT 'SEGMENTS' as table_name, COUNT(*) FROM segments
UNION ALL
SELECT 'SEATS' as table_name, COUNT(*) FROM seats
UNION ALL
SELECT 'BOOKINGS' as table_name, COUNT(*) FROM bookings
UNION ALL
SELECT 'TICKETS' as table_name, COUNT(*) FROM tickets
UNION ALL
SELECT 'PAYMENTS' as table_name, COUNT(*) FROM payments
UNION ALL
SELECT 'USER_SESSIONS' as table_name, COUNT(*) FROM user_sessions
UNION ALL
SELECT 'USER_DEVICES' as table_name, COUNT(*) FROM user_devices
UNION ALL
SELECT 'NOTIFICATIONS' as table_name, COUNT(*) FROM notifications
UNION ALL
SELECT 'ANALYTICS_EVENTS' as table_name, COUNT(*) FROM analytics_events
ORDER BY table_name;

-- ================================================
-- ROLLBACK SECTION
-- ================================================

/*
-- Supprimer les données de test (si besoin):

DELETE FROM analytics_events WHERE user_id IN ('USER_001', 'USER_002', 'USER_003');
DELETE FROM notifications WHERE user_id IN ('USER_001', 'USER_002', 'USER_003');
DELETE FROM user_devices WHERE user_id IN ('USER_001', 'USER_002', 'USER_003');
DELETE FROM user_sessions WHERE user_id IN ('USER_001', 'USER_002', 'USER_003');
DELETE FROM tickets WHERE user_id IN ('USER_001', 'USER_002', 'USER_003');
DELETE FROM seats WHERE user_id IN ('USER_001', 'USER_002', 'USER_003') OR user_id LIKE 'OTHER_%';
DELETE FROM bookings WHERE user_id IN ('USER_001', 'USER_002', 'USER_003');
DELETE FROM payments WHERE user_id IN ('USER_001', 'USER_002', 'USER_003');
DELETE FROM users WHERE user_id IN ('USER_001', 'USER_002', 'USER_003');
*/

-- ================================================
-- FIN DE LA MIGRATION 007
-- ================================================
