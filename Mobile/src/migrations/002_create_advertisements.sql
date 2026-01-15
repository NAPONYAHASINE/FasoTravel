-- Migration: Système de publicités interstitielles
-- Description: Tables pour gérer les annonces publicitaires dans l'app
-- Date: 2025-11-04

-- =============================================
-- TABLE: advertisements
-- Stocke toutes les annonces publicitaires
-- =============================================

CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contenu de l'annonce
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Media (image, vidéo ou gradient)
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'gradient')),
  media_url TEXT,                    -- URL de l'image/vidéo hébergée
  gradient TEXT,                     -- CSS gradient (ex: 'linear-gradient(...)')
  emoji VARCHAR(10),                 -- Emoji décoratif optionnel
  
  -- Call-to-action et navigation
  cta_text VARCHAR(100),             -- Texte du bouton ("Réserver", "Voir l'offre", etc.)
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('internal', 'external', 'none')),
  action_url TEXT,                   -- URL externe si action_type = 'external'
  internal_page VARCHAR(50),         -- Page de l'app si action_type = 'internal'
  internal_data JSONB,               -- Données à passer à la page interne
  
  -- Ciblage
  target_pages TEXT[],               -- Pages où afficher ['home', 'tickets', etc.]
  target_new_users BOOLEAN DEFAULT false, -- Cibler uniquement nouveaux utilisateurs
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- Priorité d'affichage
  
  -- Programmation
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  max_impressions INTEGER,           -- Limite d'affichages (NULL = illimité)
  max_clicks INTEGER,                -- Limite de clics (NULL = illimité)
  
  -- Statistiques
  impressions_count INTEGER DEFAULT 0 CHECK (impressions_count >= 0),
  clicks_count INTEGER DEFAULT 0 CHECK (clicks_count >= 0),
  
  -- Administration
  created_by UUID NOT NULL,          -- ID de l'admin qui a créé l'annonce
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  -- Contraintes
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_media CHECK (
    (media_type = 'image' AND media_url IS NOT NULL) OR
    (media_type = 'video' AND media_url IS NOT NULL) OR
    (media_type = 'gradient' AND gradient IS NOT NULL)
  ),
  CONSTRAINT valid_action CHECK (
    (action_type = 'external' AND action_url IS NOT NULL) OR
    (action_type = 'internal' AND internal_page IS NOT NULL) OR
    (action_type = 'none')
  )
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_ads_active ON advertisements(is_active, start_date, end_date) 
  WHERE is_active = true;

CREATE INDEX idx_ads_priority ON advertisements(priority DESC);

CREATE INDEX idx_ads_target_pages ON advertisements USING GIN(target_pages);

CREATE INDEX idx_ads_dates ON advertisements(start_date, end_date);

-- =============================================
-- TABLE: ad_impressions
-- Stocke chaque affichage d'annonce (analytics)
-- =============================================

CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id UUID,                      -- NULL si utilisateur non connecté
  page VARCHAR(50),                  -- Page où l'annonce a été vue
  device_type VARCHAR(20),           -- 'mobile', 'desktop', 'tablet'
  user_agent TEXT,                   -- User agent du navigateur
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Index
  CONSTRAINT fk_ad_impression FOREIGN KEY (ad_id) REFERENCES advertisements(id)
);

CREATE INDEX idx_impressions_ad_date ON ad_impressions(ad_id, timestamp DESC);
CREATE INDEX idx_impressions_user ON ad_impressions(user_id);
CREATE INDEX idx_impressions_page ON ad_impressions(page);

-- =============================================
-- TABLE: ad_clicks
-- Stocke chaque clic sur une annonce (analytics)
-- =============================================

CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id UUID,                      -- NULL si utilisateur non connecté
  page VARCHAR(50),                  -- Page où le clic a eu lieu
  action_type VARCHAR(20),           -- 'internal' ou 'external'
  device_type VARCHAR(20),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Index
  CONSTRAINT fk_ad_click FOREIGN KEY (ad_id) REFERENCES advertisements(id)
);

CREATE INDEX idx_clicks_ad_date ON ad_clicks(ad_id, timestamp DESC);
CREATE INDEX idx_clicks_user ON ad_clicks(user_id);
CREATE INDEX idx_clicks_page ON ad_clicks(page);

-- =============================================
-- TABLE: ad_conversions (optionnel)
-- Stocke les conversions (réservations suite à une pub)
-- =============================================

CREATE TABLE IF NOT EXISTS ad_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  conversion_type VARCHAR(50),       -- 'booking', 'registration', etc.
  revenue_fcfa INTEGER,              -- Montant de la transaction en FCFA
  booking_id UUID,                   -- ID de la réservation si applicable
  timestamp TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_ad_conversion FOREIGN KEY (ad_id) REFERENCES advertisements(id)
);

CREATE INDEX idx_conversions_ad ON ad_conversions(ad_id, timestamp DESC);
CREATE INDEX idx_conversions_user ON ad_conversions(user_id);

-- =============================================
-- VUE: ad_analytics
-- Vue pour obtenir les statistiques agrégées
-- =============================================

CREATE OR REPLACE VIEW ad_analytics AS
SELECT 
  a.id,
  a.title,
  a.media_type,
  a.action_type,
  a.priority,
  a.target_pages,
  a.start_date,
  a.end_date,
  a.impressions_count,
  a.clicks_count,
  
  -- CTR (Click-Through Rate)
  CASE 
    WHEN a.impressions_count > 0 
    THEN ROUND((a.clicks_count::NUMERIC / a.impressions_count::NUMERIC) * 100, 2)
    ELSE 0
  END as ctr_percent,
  
  -- Conversions
  COALESCE(conv.conversion_count, 0) as conversion_count,
  COALESCE(conv.total_revenue, 0) as total_revenue_fcfa,
  
  -- Taux de conversion
  CASE 
    WHEN a.clicks_count > 0 
    THEN ROUND((COALESCE(conv.conversion_count, 0)::NUMERIC / a.clicks_count::NUMERIC) * 100, 2)
    ELSE 0
  END as conversion_rate_percent,
  
  -- Statut
  CASE
    WHEN a.is_active = false THEN 'inactive'
    WHEN NOW() < a.start_date THEN 'scheduled'
    WHEN NOW() > a.end_date THEN 'expired'
    WHEN a.max_impressions IS NOT NULL AND a.impressions_count >= a.max_impressions THEN 'limit_reached'
    WHEN a.max_clicks IS NOT NULL AND a.clicks_count >= a.max_clicks THEN 'limit_reached'
    ELSE 'active'
  END as status,
  
  a.created_at,
  a.updated_at
  
FROM advertisements a
LEFT JOIN (
  SELECT 
    ad_id,
    COUNT(*) as conversion_count,
    SUM(revenue_fcfa) as total_revenue
  FROM ad_conversions
  GROUP BY ad_id
) conv ON conv.ad_id = a.id
ORDER BY a.priority DESC, a.created_at DESC;

-- =============================================
-- FONCTION: update_ad_timestamp
-- Met à jour automatiquement updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_ad_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ad_timestamp
BEFORE UPDATE ON advertisements
FOR EACH ROW
EXECUTE FUNCTION update_ad_timestamp();

-- =============================================
-- FONCTION: increment_ad_impressions
-- Incrémente le compteur d'impressions
-- =============================================

CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE advertisements 
  SET impressions_count = impressions_count + 1
  WHERE id = ad_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FONCTION: increment_ad_clicks
-- Incrémente le compteur de clics
-- =============================================

CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE advertisements 
  SET clicks_count = clicks_count + 1
  WHERE id = ad_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FONCTION: get_active_ads
-- Récupère les annonces actives selon critères
-- =============================================

CREATE OR REPLACE FUNCTION get_active_ads(
  target_page VARCHAR(50) DEFAULT NULL,
  is_new_user BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(200),
  description TEXT,
  media_type VARCHAR(20),
  media_url TEXT,
  gradient TEXT,
  emoji VARCHAR(10),
  cta_text VARCHAR(100),
  action_type VARCHAR(20),
  action_url TEXT,
  internal_page VARCHAR(50),
  internal_data JSONB,
  priority INTEGER,
  impressions_count INTEGER,
  clicks_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.media_type,
    a.media_url,
    a.gradient,
    a.emoji,
    a.cta_text,
    a.action_type,
    a.action_url,
    a.internal_page,
    a.internal_data,
    a.priority,
    a.impressions_count,
    a.clicks_count
  FROM advertisements a
  WHERE 
    a.is_active = true
    AND NOW() BETWEEN a.start_date AND a.end_date
    AND (a.max_impressions IS NULL OR a.impressions_count < a.max_impressions)
    AND (a.max_clicks IS NULL OR a.clicks_count < a.max_clicks)
    AND (target_page IS NULL OR a.target_pages IS NULL OR target_page = ANY(a.target_pages))
    AND (a.target_new_users = false OR (a.target_new_users = true AND is_new_user = true))
  ORDER BY a.priority DESC, RANDOM()
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DONNÉES DE TEST (optionnel, à supprimer en prod)
-- =============================================

-- Créer un utilisateur admin test (ajustez l'UUID selon votre table users)
-- INSERT INTO advertisements (
--   title,
--   description,
--   media_type,
--   gradient,
--   emoji,
--   cta_text,
--   action_type,
--   internal_page,
--   target_pages,
--   priority,
--   start_date,
--   end_date,
--   created_by
-- ) VALUES (
--   '🎉 Promotion Ouaga-Bobo',
--   'Profitez de -30% sur tous les trajets Ouagadougou ↔ Bobo-Dioulasso ce mois-ci !',
--   'gradient',
--   'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)',
--   '🚌',
--   'Voir les offres',
--   'internal',
--   'search-results',
--   ARRAY['home', 'tickets'],
--   8,
--   NOW(),
--   NOW() + INTERVAL '30 days',
--   'ADMIN_USER_ID_HERE'
-- );

-- =============================================
-- PERMISSIONS (ajustez selon vos besoins)
-- =============================================

-- Admins : accès complet
-- GRANT ALL ON advertisements TO admin_role;
-- GRANT ALL ON ad_impressions TO admin_role;
-- GRANT ALL ON ad_clicks TO admin_role;
-- GRANT ALL ON ad_conversions TO admin_role;

-- Users : lecture seule sur annonces actives
-- GRANT SELECT ON advertisements TO user_role;
-- GRANT INSERT ON ad_impressions TO user_role;
-- GRANT INSERT ON ad_clicks TO user_role;

-- =============================================
-- FIN DE LA MIGRATION
-- =============================================
