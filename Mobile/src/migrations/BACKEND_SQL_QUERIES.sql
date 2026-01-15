-- ================================================
-- Essential SQL Queries for Backend Implementation
-- FasoTravel API Endpoints Reference
-- ================================================
-- Copy these queries into backend services
-- Parameterized for security (use $1, $2, etc.)

-- ================================================
-- 1. AUTHENTICATION & USERS
-- ================================================

-- Register new user
INSERT INTO users (user_id, email, phone, full_name, role, password_hash, is_verified, is_active, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, 'user', $4, false, true, NOW(), NOW())
RETURNING user_id, email, full_name, role;

-- Login: Get user by email
SELECT user_id, email, full_name, password_hash, role, is_verified, is_active
FROM users
WHERE email = $1 AND is_active = true;

-- Verify email
UPDATE users
SET is_verified = true, updated_at = NOW()
WHERE user_id = $1
RETURNING user_id, is_verified;

-- Create user session
INSERT INTO user_sessions (session_id, user_id, device_type, auth_token, is_active, expires_at, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, true, NOW() + INTERVAL '30 days', NOW(), NOW())
RETURNING session_id, auth_token;

-- Get active sessions for user
SELECT session_id, device_type, is_active, expires_at
FROM user_sessions
WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
ORDER BY created_at DESC;

-- Register device for push notifications
INSERT INTO user_devices (device_id, user_id, push_token, device_model, os_type, os_version, last_active_at, push_notifications_enabled, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW(), true, NOW(), NOW())
ON CONFLICT (device_id) DO UPDATE
SET push_token = $3, last_active_at = NOW(), updated_at = NOW()
RETURNING device_id;

-- ================================================
-- 2. TRIP SEARCH & DISCOVERY
-- ================================================

-- Search trips by route and date
SELECT * FROM vw_trips_availability
WHERE from_stop_id = $1
  AND to_stop_id = $2
  AND DATE(departure_time) = $3
  AND is_cancelled = false
  AND availability_status != 'FULL'
ORDER BY departure_time ASC;

-- Get trip details with segments
SELECT 
  t.trip_id,
  t.operator_id,
  t.operator_name,
  t.operator_logo,
  t.from_stop_name,
  t.to_stop_name,
  t.departure_time,
  t.arrival_time,
  t.base_price,
  t.available_seats,
  t.total_seats,
  t.is_cancelled,
  json_agg(
    json_build_object(
      'segment_id', s.segment_id,
      'from_stop_id', s.from_stop_id,
      'to_stop_id', s.to_stop_id,
      'from_stop_name', s.from_stop_name,
      'to_stop_name', s.to_stop_name,
      'departure_time', s.departure_time,
      'arrival_time', s.arrival_time,
      'distance_km', s.distance_km,
      'available_seats', s.available_seats,
      'base_price', s.base_price,
      'sequence_number', s.sequence_number
    ) ORDER BY s.sequence_number
  ) as segments
FROM trips t
LEFT JOIN segments s ON s.trip_id = t.trip_id
WHERE t.trip_id = $1
GROUP BY t.trip_id, t.operator_id, t.operator_name, t.operator_logo, 
         t.from_stop_name, t.to_stop_name, t.departure_time, t.arrival_time, 
         t.base_price, t.available_seats, t.total_seats, t.is_cancelled;

-- Get seat map for a trip
SELECT 
  t.trip_id,
  t.total_seats,
  t.available_seats,
  smc.rows,
  smc.seats_per_row,
  smc.aisle_after,
  json_agg(
    json_build_object(
      'seat_id', s.seat_id,
      'seat_number', s.seat_number,
      'status', s.status,
      'user_id', CASE WHEN s.status = 'booked' THEN s.user_id ELSE NULL END
    ) ORDER BY s.seat_number
  ) as seats
FROM trips t
JOIN vehicles v ON t.vehicle_id = v.vehicle_id
JOIN seat_map_configs smc ON v.seat_map_config_id = smc.config_id
LEFT JOIN seats s ON s.trip_id = t.trip_id
WHERE t.trip_id = $1
GROUP BY t.trip_id, t.total_seats, t.available_seats, smc.rows, smc.seats_per_row, smc.aisle_after;

-- Get nearby trips (geolocation)
SELECT t.*, 
  st_from.latitude as from_latitude,
  st_from.longitude as from_longitude,
  st_to.latitude as to_latitude,
  st_to.longitude as to_longitude
FROM trips t
JOIN stations st_from ON t.from_stop_id = st_from.station_id
JOIN stations st_to ON t.to_stop_id = st_to.station_id
WHERE DATE(t.departure_time) BETWEEN NOW()::date AND (NOW() + INTERVAL '7 days')::date
  AND t.is_cancelled = false
  AND t.available_seats > 0
ORDER BY t.departure_time
LIMIT $1;

-- ================================================
-- 3. SEAT SELECTION & HOLDING
-- ================================================

-- Check seat availability (real-time)
SELECT seat_id, seat_number, status
FROM seats
WHERE trip_id = $1 AND seat_number = ANY($2)
FOR UPDATE; -- Lock for transaction

-- Hold seats (TRANSACTION)
BEGIN;
  INSERT INTO seats (seat_id, trip_id, seat_number, status, hold_expires_at, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), $1, $2, 'held', NOW() + INTERVAL '30 minutes', NOW(), NOW()),
    (gen_random_uuid(), $1, $3, 'held', NOW() + INTERVAL '30 minutes', NOW(), NOW())
  ON CONFLICT DO NOTHING;
  
  UPDATE seats
  SET status = 'held', hold_expires_at = NOW() + INTERVAL '30 minutes'
  WHERE trip_id = $1 AND seat_number = ANY($2::text[]) AND status = 'available';
  
  SELECT seat_id, seat_number
  FROM seats
  WHERE trip_id = $1 AND seat_number = ANY($2::text[]);
COMMIT;

-- Release held seats (on timeout or user cancel)
UPDATE seats
SET status = 'available', hold_expires_at = NULL, updated_at = NOW()
WHERE trip_id = $1 AND status = 'held' AND hold_expires_at < NOW()
RETURNING seat_id, seat_number;

-- ================================================
-- 4. BOOKING & RESERVATION
-- ================================================

-- Create booking (TRANSACTION)
BEGIN;
  -- Insert booking
  INSERT INTO bookings 
    (booking_id, user_id, trip_id, operator_id, num_passengers, status, amount, hold_expires_at, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), $1, $2, $3, $4, 'held', $5, NOW() + INTERVAL '30 minutes', NOW(), NOW())
  RETURNING booking_id, status, hold_expires_at;
  
  -- Update seats as held
  UPDATE seats
  SET status = 'held', hold_expires_at = NOW() + INTERVAL '30 minutes'
  WHERE trip_id = $2 AND seat_number = ANY($6::text[]);
  
COMMIT;

-- Get user's bookings
SELECT 
  b.booking_id,
  b.trip_id,
  b.operator_id,
  b.num_passengers,
  b.status,
  b.amount,
  b.hold_expires_at,
  b.created_at,
  t.operator_name,
  t.from_stop_name,
  t.to_stop_name,
  t.departure_time,
  t.arrival_time
FROM bookings b
JOIN trips t ON b.trip_id = t.trip_id
WHERE b.user_id = $1
ORDER BY b.created_at DESC
LIMIT $2;

-- Get booking details
SELECT 
  b.*,
  t.operator_name,
  t.operator_logo,
  t.from_stop_name,
  t.to_stop_name,
  t.departure_time,
  t.arrival_time,
  t.base_price,
  o.rating,
  o.total_reviews,
  json_agg(
    json_build_object(
      'ticket_id', tk.ticket_id,
      'passenger_name', tk.passenger_name,
      'passenger_phone', tk.passenger_phone,
      'seat_number', tk.seat_number,
      'status', tk.status,
      'qr_code', tk.qr_code
    )
  ) as tickets
FROM bookings b
JOIN trips t ON b.trip_id = t.trip_id
JOIN operators o ON b.operator_id = o.operator_id
LEFT JOIN tickets tk ON b.booking_id = tk.booking_id
WHERE b.booking_id = $1
GROUP BY b.booking_id, t.trip_id, t.operator_name, t.operator_logo, 
         t.from_stop_name, t.to_stop_name, t.departure_time, t.arrival_time,
         t.base_price, o.operator_id, o.rating, o.total_reviews;

-- Update booking status (after payment)
UPDATE bookings
SET status = 'paid', payment_id = $1, hold_expires_at = NULL, updated_at = NOW()
WHERE booking_id = $2
RETURNING booking_id, status;

-- Cancel booking (TRANSACTION)
BEGIN;
  -- Mark booking as cancelled
  UPDATE bookings
  SET status = 'cancelled', updated_at = NOW()
  WHERE booking_id = $1;
  
  -- Release held seats
  UPDATE seats
  SET status = 'available', hold_expires_at = NULL, updated_at = NOW()
  WHERE trip_id IN (SELECT trip_id FROM bookings WHERE booking_id = $1);
  
COMMIT;

-- Check for expired holds
SELECT booking_id, hold_expires_at
FROM bookings
WHERE status = 'held' AND hold_expires_at < NOW();

-- ================================================
-- 5. PAYMENTS
-- ================================================

-- Create payment record
INSERT INTO payments 
  (payment_id, booking_id, user_id, amount, currency, payment_method, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), $1, $2, $3, 'XOF', $4, 'pending', NOW(), NOW())
RETURNING payment_id, status;

-- Update payment status (from provider webhook)
UPDATE payments
SET status = $2, provider_reference = $3, updated_at = NOW()
WHERE payment_id = $1
RETURNING payment_id, status, booking_id;

-- Get payment details
SELECT 
  p.payment_id,
  p.booking_id,
  p.amount,
  p.currency,
  p.payment_method,
  p.status,
  p.provider_reference,
  p.created_at,
  b.trip_id,
  b.num_passengers
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.booking_id
WHERE p.payment_id = $1;

-- Get user's payment history
SELECT 
  p.payment_id,
  p.amount,
  p.currency,
  p.payment_method,
  p.status,
  p.created_at,
  b.booking_id,
  t.trip_id,
  t.operator_name,
  t.departure_time
FROM payments p
LEFT JOIN bookings b ON p.booking_id = b.booking_id
LEFT JOIN trips t ON b.trip_id = t.trip_id
WHERE p.user_id = $1
ORDER BY p.created_at DESC
LIMIT $2;

-- Get failed/pending payments for retry
SELECT payment_id, booking_id, amount, provider_reference
FROM payments
WHERE status IN ('pending', 'failed') AND updated_at < NOW() - INTERVAL '15 minutes'
ORDER BY created_at ASC;

-- ================================================
-- 6. TICKETS
-- ================================================

-- Get user's tickets
SELECT 
  tk.ticket_id,
  tk.booking_id,
  tk.trip_id,
  tk.passenger_name,
  tk.passenger_phone,
  tk.seat_number,
  tk.status,
  tk.alphanumeric_code,
  tk.qr_code,
  tk.created_at,
  t.operator_name,
  t.operator_logo,
  t.from_stop_name,
  t.to_stop_name,
  t.departure_time,
  t.arrival_time
FROM tickets tk
JOIN trips t ON tk.trip_id = t.trip_id
WHERE tk.user_id = $1 AND tk.status != 'cancelled'
ORDER BY t.departure_time DESC
LIMIT $2;

-- Get ticket details (for display)
SELECT 
  tk.*,
  t.operator_name,
  t.operator_logo,
  t.from_stop_name,
  t.to_stop_name,
  t.departure_time,
  t.arrival_time,
  t.base_price,
  b.num_passengers
FROM tickets tk
JOIN trips t ON tk.trip_id = t.trip_id
JOIN bookings b ON tk.booking_id = b.booking_id
WHERE tk.ticket_id = $1;

-- Validate ticket (QR scan)
SELECT 
  tk.ticket_id,
  tk.passenger_name,
  tk.seat_number,
  tk.status,
  t.trip_id,
  t.departure_time,
  t.operator_name,
  b.user_id
FROM tickets tk
JOIN trips t ON tk.trip_id = t.trip_id
JOIN bookings b ON tk.booking_id = b.booking_id
WHERE tk.alphanumeric_code = $1 OR tk.qr_code = $1
LIMIT 1;

-- Generate tickets from booking (TRANSACTION)
BEGIN;
  INSERT INTO tickets 
    (ticket_id, booking_id, trip_id, operator_id, user_id, 
     passenger_name, passenger_phone, status, alphanumeric_code, qr_code, created_at, updated_at)
  SELECT 
    'TKT_' || gen_random_uuid()::text,
    $1,
    b.trip_id,
    b.operator_id,
    b.user_id,
    $2, -- passenger name
    $3, -- passenger phone
    'confirmed',
    'FT-' || b.trip_id || '-' || LPAD((SELECT COUNT(*) + 1 FROM tickets WHERE booking_id = $1)::text, 5, '0'),
    'QR_' || gen_random_uuid()::text,
    NOW(),
    NOW()
  FROM bookings b
  WHERE b.booking_id = $1;
  
  RETURN QUERY SELECT ticket_id FROM tickets WHERE booking_id = $1;
COMMIT;

-- Update ticket status (checked-in)
UPDATE tickets
SET status = 'used', updated_at = NOW()
WHERE ticket_id = $1
RETURNING ticket_id, status;

-- ================================================
-- 7. OPERATORS & RATINGS
-- ================================================

-- Get operator details
SELECT 
  o.operator_id,
  o.name,
  o.operator_logo,
  o.rating,
  o.total_reviews,
  o.is_verified,
  (SELECT COUNT(*) FROM trips WHERE operator_id = o.operator_id AND is_cancelled = false) as active_trips,
  (SELECT COUNT(*) FROM trips WHERE operator_id = o.operator_id) as total_trips
FROM operators o
WHERE o.operator_id = $1;

-- Get operators list with trip stats
SELECT 
  o.operator_id,
  o.name,
  o.operator_logo,
  o.rating,
  o.total_reviews,
  o.is_verified,
  COUNT(t.trip_id) as trip_count,
  SUM(t.available_seats) as total_available_seats
FROM operators o
LEFT JOIN trips t ON o.operator_id = t.operator_id AND t.is_cancelled = false
GROUP BY o.operator_id, o.name, o.operator_logo, o.rating, o.total_reviews, o.is_verified
ORDER BY o.rating DESC;

-- Get operator's trips (for dashboard)
SELECT 
  t.trip_id,
  t.from_stop_name,
  t.to_stop_name,
  t.departure_time,
  t.available_seats,
  t.total_seats,
  (SELECT COUNT(*) FROM bookings WHERE trip_id = t.trip_id AND status = 'paid') as confirmed_bookings,
  (SELECT COUNT(*) FROM bookings WHERE trip_id = t.trip_id AND status = 'held') as pending_bookings
FROM trips t
WHERE t.operator_id = $1 AND t.departure_time > NOW()
ORDER BY t.departure_time ASC;

-- ================================================
-- 8. NOTIFICATIONS
-- ================================================

-- Send notification
INSERT INTO notifications 
  (notification_id, user_id, type, title, message, deep_link, is_read, created_at, updated_at)
VALUES 
  (gen_random_uuid(), $1, $2, $3, $4, $5, false, NOW(), NOW())
RETURNING notification_id;

-- Get unread notifications
SELECT notification_id, type, title, message, deep_link, created_at
FROM notifications
WHERE user_id = $1 AND is_read = false
ORDER BY created_at DESC
LIMIT $2;

-- Mark notification as read
UPDATE notifications
SET is_read = true, updated_at = NOW()
WHERE notification_id = $1
RETURNING notification_id;

-- ================================================
-- 9. ANALYTICS
-- ================================================

-- Track event
INSERT INTO analytics_events 
  (event_id, user_id, event_type, event_data, device_type, user_ip, created_at)
VALUES 
  (gen_random_uuid(), $1, $2, $3::jsonb, $4, $5, NOW());

-- Get user activity
SELECT 
  event_type,
  COUNT(*) as count,
  DATE(created_at) as date
FROM analytics_events
WHERE user_id = $1
GROUP BY event_type, DATE(created_at)
ORDER BY date DESC;

-- Get funnel stats (booking flow)
SELECT 
  COUNT(*) FILTER (WHERE event_type = 'search_trip') as searched,
  COUNT(*) FILTER (WHERE event_type = 'view_trip') as viewed,
  COUNT(*) FILTER (WHERE event_type = 'select_seats') as selected_seats,
  COUNT(*) FILTER (WHERE event_type = 'complete_booking') as completed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = 'complete_booking') / 
        NULLIF(COUNT(*) FILTER (WHERE event_type = 'search_trip'), 0), 2) as conversion_rate
FROM analytics_events
WHERE DATE(created_at) = $1::date;

-- ================================================
-- 10. ADMIN QUERIES
-- ================================================

-- System status
SELECT 
  'OPERATORS' as entity, COUNT(*) as count FROM operators
UNION ALL
SELECT 'TRIPS', COUNT(*) FROM trips WHERE is_cancelled = false
UNION ALL
SELECT 'BOOKINGS (Paid)', COUNT(*) FROM bookings WHERE status = 'paid'
UNION ALL
SELECT 'BOOKINGS (Held)', COUNT(*) FROM bookings WHERE status = 'held'
UNION ALL
SELECT 'SEATS (Available)', COUNT(*) FROM seats WHERE status = 'available'
UNION ALL
SELECT 'SEATS (Booked)', COUNT(*) FROM seats WHERE status = 'booked'
UNION ALL
SELECT 'USERS', COUNT(*) FROM users WHERE is_active = true
UNION ALL
SELECT 'PAYMENTS (Completed)', COUNT(*) FROM payments WHERE status = 'completed';

-- Revenue report
SELECT 
  DATE(p.created_at) as date,
  COUNT(p.payment_id) as transactions,
  SUM(p.amount) as total_revenue,
  AVG(p.amount) as avg_amount,
  COUNT(DISTINCT p.user_id) as unique_users
FROM payments p
WHERE p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(p.created_at)
ORDER BY date DESC;

-- Capacity utilization
SELECT 
  t.operator_name,
  t.trip_id,
  t.from_stop_name || ' → ' || t.to_stop_name as route,
  t.total_seats,
  t.available_seats,
  (t.total_seats - t.available_seats) as booked,
  ROUND(100.0 * (t.total_seats - t.available_seats) / t.total_seats, 1) as utilization_percent
FROM trips t
WHERE DATE(t.departure_time) = $1::date
ORDER BY t.departure_time;

-- Data integrity check
SELECT 
  'Seat availability rule' as check_name,
  COUNT(*) as violations
FROM vw_trips_inconsistencies
UNION ALL
SELECT 'Expired holds', COUNT(*)
FROM bookings
WHERE status = 'held' AND hold_expires_at < NOW()
UNION ALL
SELECT 'Orphaned seats', COUNT(*)
FROM seats
WHERE trip_id NOT IN (SELECT trip_id FROM trips);

-- ================================================
-- END OF QUERY REFERENCE
-- ================================================
