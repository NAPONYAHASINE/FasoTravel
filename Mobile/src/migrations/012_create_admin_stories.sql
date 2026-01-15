-- ================================================
-- Migration 012: Admin Stories Table
-- Description: Crée la table pour les stories générales (Promotions, Destinations, Annonces)
-- affichées sur la homepage accessible par tous les utilisateurs.
-- Ces stories sont gérées par l'administrateur du système, indépendamment des compagnies.
-- Date: 2025-11-29
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- ADMIN STORIES TABLE
-- ================================================

DROP TABLE IF EXISTS admin_stories CASCADE;

CREATE TABLE IF NOT EXISTS admin_stories (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  emoji VARCHAR(10) DEFAULT '📢',
  gradient VARCHAR(100) DEFAULT 'from-purple-500 to-pink-500', -- Tailwind gradient classes
  category VARCHAR(50) NOT NULL, -- PROMO, NEW, DESTINATION, TIPS, PARTNERS, ANNOUNCEMENT
  priority INTEGER DEFAULT 0, -- Lower = shown first
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- Story expires after this date
  
  CONSTRAINT valid_category CHECK (category IN (
    'PROMO', 'NEW', 'DESTINATION', 'TIPS', 'PARTNERS', 
    'ANNOUNCEMENT', 'ACTUALITE', 'ALERTE', 'EVENT', 'ACHIEVEMENT'
  ))
);

-- ================================================
-- INDEXES
-- ================================================

-- Index pour récupérer les stories actives (non expirées)
CREATE INDEX IF NOT EXISTS idx_admin_stories_active 
ON admin_stories(is_active, expires_at) 
WHERE is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);

-- Index pour le tri par priorité
CREATE INDEX IF NOT EXISTS idx_admin_stories_priority 
ON admin_stories(priority, created_at DESC);

-- Index pour recherche par catégorie
CREATE INDEX IF NOT EXISTS idx_admin_stories_category 
ON admin_stories(category);

-- ================================================
-- SEED DATA - 4 Stories par défaut
-- ================================================

INSERT INTO admin_stories (id, title, description, emoji, gradient, category, priority, is_active, created_by, created_at, expires_at)
VALUES 
  (
    'story_1',
    'Promotions',
    '🎁 Profitez de -20% sur tous les trajets ce week-end !',
    '🎉',
    'from-red-500 to-amber-500',
    'PROMO',
    1,
    true,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '7 days'
  ),
  (
    'story_2',
    'Nouveautés',
    '✨ Découvrez nos nouvelles destinations',
    '✨',
    'from-amber-500 to-green-500',
    'NEW',
    2,
    true,
    'admin',
    CURRENT_TIMESTAMP,
    NULL -- Never expires
  ),
  (
    'story_3',
    'Destinations',
    '🏖️ Explorez les plus belles destinations du Burkina Faso',
    '🌍',
    'from-amber-500 to-orange-500',
    'DESTINATION',
    3,
    true,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '7 days'
  ),
  (
    'story_4',
    'Annonces',
    '📢 Informations importantes sur nos services',
    '📣',
    'from-orange-500 to-red-500',
    'ANNOUNCEMENT',
    4,
    true,
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '7 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- COMMENTS
-- ================================================

COMMENT ON TABLE admin_stories IS 
'Stories affichées sur la homepage pour tous les utilisateurs. 
Gérées par les administrateurs du système.
Différentes de operator_stories qui sont créées par chaque compagnie.';

COMMENT ON COLUMN admin_stories.gradient IS 
'Classes Tailwind pour le gradient (ex: "from-red-500 to-amber-500")
Utilisé côté frontend pour le styling des cercles';

COMMENT ON COLUMN admin_stories.expires_at IS 
'NULL = story ne expire jamais
Date future = story disparaît après cette date
Permet au admin de planifier les stories temporaires (promotions de week-end, etc.)';
