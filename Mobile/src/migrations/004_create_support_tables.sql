-- ================================================
-- Migration 004: Tables Support & Analytics
-- Description: Payments, notifications, analytics, sessions utilisateur
-- Date: 2025-11-13
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- ROLLBACK
-- ================================================
/*
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
*/

-- ================================================
-- 1. TABLE: user_sessions
-- Sessions utilisateurs (authentification)
-- ================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_type VARCHAR(20) DEFAULT 'MOBILE_WEB' CHECK (
    device_type IN ('MOBILE_APP', 'MOBILE_WEB', 'DESKTOP_WEB', 'KIOSK')
  ),
  device_id VARCHAR(255),
  ip_address VARCHAR(45),  -- IPv4 ou IPv6
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_session_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_sessions_active ON user_sessions(last_active_at DESC);

-- ================================================
-- 2. TABLE: user_devices
-- Appareils enregistrés par l'utilisateur (pour push notifications)
-- ================================================

CREATE TABLE IF NOT EXISTS user_devices (
  device_id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  push_token VARCHAR(500),
  device_type VARCHAR(20) DEFAULT 'MOBILE_WEB',
  app_version VARCHAR(20),
  os_version VARCHAR(50),
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  push_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_device_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_devices_user ON user_devices(user_id);
CREATE INDEX idx_devices_push_enabled ON user_devices(push_enabled) WHERE push_enabled = true;

-- ================================================
-- 3. TABLE: payments
-- Paiements pour les réservations
-- ================================================

CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) DEFAULT 'XOF',
  payment_method VARCHAR(50) NOT NULL CHECK (
    payment_method IN ('ORANGE_MONEY', 'MOOV_MONEY', 'CARTE_BANCAIRE', 'CASH')
  ),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')
  ),
  provider_reference VARCHAR(255),  -- ID du paiement chez le provider (Orange, Moov, etc.)
  provider_metadata JSONB,  -- Métadonnées du provider (optionnel)
  refund_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  failed_reason VARCHAR(500),
  
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id)
    REFERENCES bookings(booking_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_ref ON payments(provider_reference);

-- ================================================
-- 4. TABLE: notifications
-- Notifications envoyées aux utilisateurs
-- ================================================

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (
    type IN ('BOOKING_CONFIRMED', 'TRIP_REMINDER', 'PRICE_DROP', 'OPERATOR_UPDATE', 'PROMO', 'PAYMENT_SUCCESS', 'TICKET_READY')
  ),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  deep_link VARCHAR(500),
  image_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  read_at TIMESTAMP,
  metadata JSONB,  -- Données additionnelles (booking_id, trip_id, etc.)
  
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_expires ON notifications(expires_at);

-- ================================================
-- 5. TABLE: analytics_events
-- Événements d'analytics (page view, booking step, etc.)
-- ================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- NULL si non authentifié
  event_type VARCHAR(100) NOT NULL,  -- 'page_view', 'search_result_viewed', 'booking_step_completed', etc.
  event_data JSONB NOT NULL,  -- Données spécifiques à l'événement
  device_type VARCHAR(20),
  session_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  location JSONB,  -- { latitude, longitude, accuracy }
  
  CONSTRAINT fk_analytics_user FOREIGN KEY (user_id)
    REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_date ON analytics_events(created_at DESC);

-- ================================================
-- VÉRIFICATIONS
-- ================================================

SELECT 
  table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'user_sessions', 'user_devices', 'payments', 'notifications', 'analytics_events'
  )
ORDER BY table_name;

-- ================================================
-- NOTES
-- ================================================

/*
1. USER_SESSIONS
   - Authentification JWT-based
   - expires_at: token expire après X jours
   - last_active_at: pour tracking activité

2. PAYMENTS
   - payment_method: Orange Money, Moov Money, Carte Bancaire, Cash
   - provider_reference: ID externe du provider (pour réconciliation)
   - provider_metadata: données JSON du provider (optionnel)
   - status: PENDING → COMPLETED ou FAILED
   - refund_id: pour tracer les remboursements

3. NOTIFICATIONS
   - type: BOOKING_CONFIRMED, TRIP_REMINDER, PRICE_DROP, OPERATOR_UPDATE, PROMO, etc.
   - deep_link: URL pour ouvrir l'app à une page spécifique
   - metadata: JSONB pour stocker booking_id, trip_id, etc. sans ajouter colonnes

4. ANALYTICS_EVENTS
   - Collecte les événements utilisateur (page views, search, booking steps, etc.)
   - event_data: JSONB flexible pour stocker données spécifiques
   - user_id: NULL si session anonyme
   - location: { latitude, longitude, accuracy_meters } optionnel

5. INDEXES
   - Optimisés pour recherches par user + date
   - Index partiels pour statuts courants (is_read = false, push_enabled = true)

6. RETENTION
   - Ajouter un job CRON pour nettoyer les anciennes données
     (ex: DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days')
*/

-- ================================================
-- FIN DE LA MIGRATION 004
-- ================================================
