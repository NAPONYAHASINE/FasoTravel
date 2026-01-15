-- ================================================
-- Migration 001: Stories des compagnies
-- Description: Création des tables pour le système de stories Instagram-style
-- Date: 2025-11-04
-- ================================================

-- ================================================
-- ROLLBACK (à exécuter en cas d'erreur)
-- ================================================
/*
DROP TABLE IF EXISTS story_views CASCADE;
DROP TABLE IF EXISTS operator_stories CASCADE;
DROP INDEX IF EXISTS idx_operator_stories_operator_expires;
DROP INDEX IF EXISTS idx_operator_stories_expires;
DROP INDEX IF EXISTS idx_story_views_user;
DROP INDEX IF EXISTS idx_story_views_story;
*/

-- ================================================
-- MIGRATION
-- ================================================

-- 1. Table des stories des opérateurs
CREATE TABLE IF NOT EXISTS operator_stories (
  id VARCHAR(255) PRIMARY KEY,
  operator_id VARCHAR(255) NOT NULL,
  
  -- Type et format de la story
  type VARCHAR(50) NOT NULL CHECK (type IN ('PROMO', 'NEW_ROUTE', 'ANNOUNCEMENT', 'EVENT', 'ACHIEVEMENT')),
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'gradient')),
  
  -- Contenu média
  media_url VARCHAR(500), -- URL vers l'image/vidéo (S3, Cloudinary, etc.)
  gradient VARCHAR(100),  -- Classes Tailwind pour gradient (ex: 'from-red-600 to-green-600')
  
  -- Contenu texte
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(150),
  description TEXT,
  emoji VARCHAR(10),
  
  -- Call-to-action
  cta_text VARCHAR(50),
  cta_link VARCHAR(500),
  
  -- Durée d'affichage en secondes
  duration_seconds INT DEFAULT 5 CHECK (duration_seconds > 0 AND duration_seconds <= 30),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  -- Contraintes
  CONSTRAINT fk_operator_stories_operator 
    FOREIGN KEY (operator_id) 
    REFERENCES operators(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT check_expires_after_created 
    CHECK (expires_at > created_at),
  
  CONSTRAINT check_media_required
    CHECK (media_url IS NOT NULL OR gradient IS NOT NULL)
);

-- 2. Table de tracking des vues par utilisateur
CREATE TABLE IF NOT EXISTS story_views (
  user_id VARCHAR(255) NOT NULL,
  story_id VARCHAR(255) NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Clé primaire composite (évite les doublons)
  PRIMARY KEY (user_id, story_id),
  
  -- Foreign key vers les stories
  CONSTRAINT fk_story_views_story 
    FOREIGN KEY (story_id) 
    REFERENCES operator_stories(id) 
    ON DELETE CASCADE
);

-- 3. Index pour performance

-- Index pour récupérer les stories actives d'un opérateur
CREATE INDEX idx_operator_stories_operator_expires 
ON operator_stories(operator_id, expires_at);

-- Index pour le nettoyage automatique des stories expirées
CREATE INDEX idx_operator_stories_expires 
ON operator_stories(expires_at);

-- Index pour récupérer toutes les vues d'un utilisateur
CREATE INDEX idx_story_views_user 
ON story_views(user_id);

-- Index pour compter les vues d'une story
CREATE INDEX idx_story_views_story 
ON story_views(story_id);

-- ================================================
-- DONNÉES DE TEST (optionnel - à commenter en prod)
-- ================================================

-- Insérer des stories de test pour Air Canada Bus
INSERT INTO operator_stories (id, operator_id, type, media_type, gradient, title, subtitle, description, emoji, cta_text, cta_link, duration_seconds, created_at, expires_at)
VALUES 
(
  'AC_STORY_1',
  'AIR_CANADA',
  'PROMO',
  'gradient',
  'from-red-600 via-amber-500 to-green-600',
  '-20% sur Ouaga-Bobo',
  'Valable jusqu''au 15 novembre',
  'Réservez maintenant et profitez de notre promotion exceptionnelle sur tous les trajets Ouagadougou-Bobo-Dioulasso !',
  '🎉',
  'Réserver maintenant',
  'transportbf://search?route=OUAGA-BOBO',
  5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '10 days'
),
(
  'AC_STORY_2',
  'AIR_CANADA',
  'NEW_ROUTE',
  'gradient',
  'from-blue-600 via-purple-500 to-pink-600',
  'Nouveau : Ouaga-Dori',
  'Départs tous les lundis et jeudis',
  'Découvrez notre nouvelle ligne directe vers Dori avec des bus climatisés et WiFi gratuit.',
  '🚌',
  'Voir les horaires',
  'transportbf://trips?route=OUAGA-DORI',
  5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '15 days'
),
(
  'AC_STORY_3',
  'AIR_CANADA',
  'ACHIEVEMENT',
  'gradient',
  'from-amber-400 via-orange-500 to-red-600',
  '15 ans d''excellence',
  'Merci de votre confiance !',
  'Air Canada Bus célèbre 15 ans de service au Burkina Faso. Plus de 500 000 passagers transportés !',
  '🎂',
  NULL,
  NULL,
  5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '5 days'
);

-- Insérer des stories de test pour Scoot Express
INSERT INTO operator_stories (id, operator_id, type, media_type, gradient, title, subtitle, description, emoji, cta_text, cta_link, duration_seconds, created_at, expires_at)
VALUES 
(
  'SCOOT_STORY_1',
  'SCOOT',
  'ANNOUNCEMENT',
  'gradient',
  'from-green-600 via-teal-500 to-blue-600',
  'Horaires modifiés',
  'À partir du 10 novembre',
  'Nouveaux horaires pour mieux vous servir ! Consultez notre planning mis à jour.',
  '⏰',
  'Voir les horaires',
  'transportbf://schedule',
  5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days'
),
(
  'SCOOT_STORY_2',
  'SCOOT',
  'PROMO',
  'gradient',
  'from-pink-600 via-rose-500 to-orange-600',
  'Voyage de groupe',
  'À partir de 5 personnes',
  'Réduction de 15% pour les groupes de 5 personnes et plus. Idéal pour les voyages en famille !',
  '👨‍👩‍👧‍👦',
  'En savoir plus',
  'transportbf://group-booking',
  5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '12 days'
);

-- Insérer des stories de test pour Rakieta Transport
INSERT INTO operator_stories (id, operator_id, type, media_type, gradient, title, subtitle, description, emoji, cta_text, cta_link, duration_seconds, created_at, expires_at)
VALUES 
(
  'RAKIETA_STORY_1',
  'RAKIETA',
  'EVENT',
  'gradient',
  'from-purple-600 via-indigo-500 to-blue-600',
  'Tournée de Noël',
  'Réservations ouvertes',
  'Préparez vos fêtes de fin d''année ! Réservez dès maintenant vos billets pour décembre.',
  '🎄',
  'Réserver',
  'transportbf://search?month=december',
  5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '20 days'
),
(
  'RAKIETA_STORY_2',
  'RAKIETA',
  'ANNOUNCEMENT',
  'gradient',
  'from-yellow-500 via-amber-500 to-orange-600',
  'Nouveaux bus climatisés',
  'Confort amélioré',
  'Découvrez notre nouvelle flotte de bus ultra-confortables avec sièges inclinables.',
  '🚐',
  NULL,
  NULL,
  5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '8 days'
);

-- Insérer quelques vues de test (simuler un utilisateur qui a vu certaines stories)
INSERT INTO story_views (user_id, story_id, viewed_at)
VALUES 
('USER_TEST_1', 'SCOOT_STORY_1', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('USER_TEST_1', 'SCOOT_STORY_2', CURRENT_TIMESTAMP - INTERVAL '1 hour');

-- ================================================
-- VÉRIFICATION
-- ================================================

-- Vérifier que les tables sont créées
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name IN ('operator_stories', 'story_views');

-- Vérifier que les index sont créés
SELECT 
  indexname, 
  tablename 
FROM pg_indexes 
WHERE tablename IN ('operator_stories', 'story_views');

-- Compter les stories de test insérées
SELECT 
  operator_id,
  COUNT(*) as total_stories
FROM operator_stories
GROUP BY operator_id;

-- Afficher les stories actives (non expirées)
SELECT 
  operator_id,
  title,
  expires_at,
  CASE 
    WHEN expires_at > CURRENT_TIMESTAMP THEN 'ACTIVE'
    ELSE 'EXPIRED'
  END as status
FROM operator_stories
ORDER BY operator_id, created_at DESC;

-- ================================================
-- NOTES
-- ================================================

/*
1. Cette migration crée les tables nécessaires pour le système de stories

2. Les contraintes garantissent l'intégrité des données:
   - type et media_type doivent être des valeurs valides
   - expires_at doit être après created_at
   - Au moins media_url OU gradient doit être défini
   - duration_seconds entre 1 et 30 secondes

3. Les index optimisent les requêtes fréquentes:
   - Récupération des stories d'un opérateur
   - Nettoyage des stories expirées
   - Vérification des vues par utilisateur
   - Statistiques de vues par story

4. Les données de test permettent de vérifier le fonctionnement
   - Commentez la section "DONNÉES DE TEST" en production
   - Ou supprimez-la après avoir testé

5. Pour nettoyer les données de test:
   DELETE FROM story_views WHERE user_id LIKE 'USER_TEST_%';
   DELETE FROM operator_stories WHERE id LIKE '%_STORY_%';
*/

-- ================================================
-- FIN DE LA MIGRATION
-- ================================================
