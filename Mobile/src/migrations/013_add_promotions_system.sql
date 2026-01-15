-- ================================================
-- Migration 013: Promotions System & Baggage Pricing
-- Description: Ajoute le système de promotions complet
--   1. Table promotions pour gérer les réductions
--   2. Colonnes de promotion dans trips pour les promo actives
--   3. Champ baggage_price dans operators pour tarif bagage
-- Date: 2025-11-29
-- Database: PostgreSQL 12+
-- ================================================

-- ================================================
-- 1. CREATE TABLE: promotions
-- ================================================

DROP TABLE IF EXISTS promotions CASCADE;

CREATE TABLE IF NOT EXISTS promotions (
  promotion_id VARCHAR(100) PRIMARY KEY,
  operator_id VARCHAR(50) NOT NULL,
  trip_id VARCHAR(50), -- NULL = s'applique à TOUS les trajets de l'opérateur
  promotion_name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE', -- 'PERCENTAGE' ou 'FIXED_AMOUNT'
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    -- Si discount_type = 'PERCENTAGE': 20 signifie 20%
    -- Si discount_type = 'FIXED_AMOUNT': 2000 signifie -2000 FCFA
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  max_uses INTEGER, -- NULL = pas de limite
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_promo_operator FOREIGN KEY (operator_id)
    REFERENCES operators(operator_id) ON DELETE CASCADE,
  
  CONSTRAINT fk_promo_trip FOREIGN KEY (trip_id)
    REFERENCES trips(trip_id) ON DELETE CASCADE,
  
  CONSTRAINT check_dates CHECK (end_date > start_date),
  CONSTRAINT check_discount_type CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT'))
);

-- ================================================
-- 2. INDEXES for promotions
-- ================================================

-- Récupérer les promotions actives non expirées
CREATE INDEX IF NOT EXISTS idx_promotions_active 
ON promotions(is_active, start_date, end_date) 
WHERE is_active = true AND start_date <= CURRENT_TIMESTAMP AND end_date > CURRENT_TIMESTAMP;

-- Promotions par opérateur
CREATE INDEX IF NOT EXISTS idx_promotions_operator 
ON promotions(operator_id, is_active);

-- Promotions par trajet
CREATE INDEX IF NOT EXISTS idx_promotions_trip 
ON promotions(trip_id) 
WHERE trip_id IS NOT NULL;

-- Promotions utilisées (pour limiter le nombre d'utilisations)
CREATE INDEX IF NOT EXISTS idx_promotions_usage 
ON promotions(max_uses, uses_count) 
WHERE max_uses IS NOT NULL;

-- ================================================
-- 3. ALTER TABLE operators - Add baggage_price
-- ================================================

ALTER TABLE operators 
ADD COLUMN IF NOT EXISTS baggage_price INTEGER DEFAULT 0 CHECK (baggage_price >= 0);

-- Index pour rechercher les opérateurs avec tarification baggage
CREATE INDEX IF NOT EXISTS idx_operators_baggage_price 
ON operators(baggage_price) 
WHERE baggage_price > 0;

-- ================================================
-- 4. ALTER TABLE trips - Add promotion fields
-- ================================================

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS promotion_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS promoted_price INTEGER,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2);

-- Ajouter les foreign keys et contraintes
ALTER TABLE trips 
ADD CONSTRAINT fk_trip_promotion FOREIGN KEY (promotion_id)
  REFERENCES promotions(promotion_id) ON DELETE SET NULL;

-- Contrainte: promoted_price doit être < base_price
ALTER TABLE trips 
ADD CONSTRAINT check_promoted_price CHECK (promoted_price IS NULL OR promoted_price < base_price);

-- Contrainte: discount_percentage doit être entre 0 et 100
ALTER TABLE trips 
ADD CONSTRAINT check_discount_percentage CHECK (
  discount_percentage IS NULL OR (discount_percentage > 0 AND discount_percentage <= 100)
);

-- ================================================
-- 5. INDEXES for trips promotion fields
-- ================================================

-- Trouvez les trajets avec promo active
CREATE INDEX IF NOT EXISTS idx_trips_promotion 
ON trips(promotion_id, promoted_price) 
WHERE promotion_id IS NOT NULL;

-- ================================================
-- 6. VIEW: Promotions actives avec détails
-- ================================================

DROP VIEW IF EXISTS vw_active_promotions CASCADE;

CREATE VIEW vw_active_promotions AS
SELECT 
  p.promotion_id,
  p.operator_id,
  o.name as operator_name,
  p.trip_id,
  CASE 
    WHEN p.trip_id IS NOT NULL THEN 
      (SELECT CONCAT(t.from_stop_name, ' → ', t.to_stop_name) 
       FROM trips t WHERE t.trip_id = p.trip_id)
    ELSE 'Tous les trajets'
  END as trip_description,
  p.promotion_name,
  p.description,
  p.discount_type,
  p.discount_value,
  p.start_date,
  p.end_date,
  p.max_uses,
  p.uses_count,
  p.is_active,
  CASE 
    WHEN p.is_active = false THEN 'INACTIVE'
    WHEN CURRENT_TIMESTAMP < p.start_date THEN 'PENDING'
    WHEN CURRENT_TIMESTAMP > p.end_date THEN 'EXPIRED'
    WHEN p.max_uses IS NOT NULL AND p.uses_count >= p.max_uses THEN 'EXHAUSTED'
    ELSE 'ACTIVE'
  END as status,
  p.created_at,
  p.updated_at
FROM promotions p
JOIN operators o ON p.operator_id = o.operator_id;

COMMENT ON VIEW vw_active_promotions IS 
'Vue pour récupérer les promotions avec statut détaillé.
Status possible: INACTIVE, PENDING, EXPIRED, EXHAUSTED, ACTIVE';

-- ================================================
-- 7. VIEW: Trajets avec promo appliquée
-- ================================================

DROP VIEW IF EXISTS vw_trips_with_promotions CASCADE;

CREATE VIEW vw_trips_with_promotions AS
SELECT 
  t.trip_id,
  t.operator_id,
  t.operator_name,
  t.base_price,
  t.currency,
  t.promotion_id,
  t.promoted_price,
  t.discount_percentage,
  p.promotion_name,
  p.discount_type,
  p.discount_value,
  CASE 
    WHEN p.promotion_id IS NOT NULL AND t.promoted_price IS NOT NULL 
    THEN t.promoted_price
    ELSE t.base_price
  END as effective_price,
  CASE 
    WHEN p.promotion_id IS NOT NULL THEN true
    ELSE false
  END as has_active_promotion,
  t.departure_time,
  t.arrival_time,
  t.from_stop_name,
  t.to_stop_name,
  t.available_seats,
  t.total_seats,
  t.created_at,
  t.updated_at
FROM trips t
LEFT JOIN vw_active_promotions p ON t.promotion_id = p.promotion_id;

COMMENT ON VIEW vw_trips_with_promotions IS 
'Vue pour afficher les trajets avec le prix réel (base_price ou promoted_price)
et les détails de la promotion si applicable';

-- ================================================
-- 8. FUNCTION: Calculate discounted price
-- ================================================

DROP FUNCTION IF EXISTS calculate_promoted_price(INTEGER, VARCHAR, NUMERIC);

CREATE FUNCTION calculate_promoted_price(
  base_price INTEGER,
  discount_type VARCHAR,
  discount_value NUMERIC
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  promoted_price INTEGER;
BEGIN
  IF discount_type = 'PERCENTAGE' THEN
    promoted_price := FLOOR(base_price * (1 - discount_value / 100.0));
  ELSIF discount_type = 'FIXED_AMOUNT' THEN
    promoted_price := base_price - FLOOR(discount_value);
  ELSE
    promoted_price := base_price;
  END IF;
  
  RETURN GREATEST(promoted_price, 0); -- Ensure non-negative
END;
$$;

COMMENT ON FUNCTION calculate_promoted_price IS 
'Calcule le prix réduit en fonction du type et de la valeur de réduction.
PERCENTAGE: promoted_price = base_price * (1 - discount_value/100)
FIXED_AMOUNT: promoted_price = base_price - discount_value';

-- ================================================
-- 9. FUNCTION: Calculate discount percentage for display
-- ================================================

DROP FUNCTION IF EXISTS calculate_discount_percentage(INTEGER, INTEGER);

CREATE FUNCTION calculate_discount_percentage(
  base_price INTEGER,
  promoted_price INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF base_price = 0 OR promoted_price >= base_price THEN
    RETURN 0;
  END IF;
  RETURN ROUND((base_price - promoted_price)::NUMERIC / base_price * 100, 2);
END;
$$;

COMMENT ON FUNCTION calculate_discount_percentage IS 
'Calcule le pourcentage de réduction pour l''affichage (-20%, etc.)
discount% = (base_price - promoted_price) / base_price * 100';

-- ================================================
-- 10. TRIGGER: Auto-update promotion fields when promotion is linked
-- ================================================

DROP TRIGGER IF EXISTS trg_update_promotion_fields ON trips CASCADE;
DROP FUNCTION IF EXISTS fn_update_promotion_fields();

CREATE FUNCTION fn_update_promotion_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  promo_rec RECORD;
BEGIN
  -- Si une promotion est liée au trajet
  IF NEW.promotion_id IS NOT NULL THEN
    SELECT * INTO promo_rec
    FROM promotions
    WHERE promotion_id = NEW.promotion_id
    AND is_active = true
    AND start_date <= CURRENT_TIMESTAMP
    AND end_date > CURRENT_TIMESTAMP;
    
    IF promo_rec IS NOT NULL THEN
      -- Calculer le prix réduit
      NEW.promoted_price := calculate_promoted_price(
        NEW.base_price,
        promo_rec.discount_type,
        promo_rec.discount_value
      );
      
      -- Calculer le pourcentage pour l'affichage
      NEW.discount_percentage := calculate_discount_percentage(
        NEW.base_price,
        NEW.promoted_price
      );
    ELSE
      -- Si la promo n'est plus active, nettoyer les champs
      NEW.promotion_id := NULL;
      NEW.promoted_price := NULL;
      NEW.discount_percentage := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_promotion_fields
BEFORE INSERT OR UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION fn_update_promotion_fields();

COMMENT ON FUNCTION fn_update_promotion_fields IS 
'Met à jour automatiquement promoted_price et discount_percentage 
quand une promotion est liée au trajet ou modifiée.';

-- ================================================
-- 11. SEED DATA: Example promotions
-- ================================================

-- Insérer une promo d'exemple (optionnel, à adapter selon vos besoins)
INSERT INTO promotions (
  promotion_id, operator_id, trip_id, promotion_name, description,
  discount_type, discount_value, start_date, end_date, max_uses, is_active
)
VALUES 
  (
    'promo_001',
    'op-001',
    NULL, -- S'applique à tous les trajets de op-001
    'Grand promo automne 2025',
    'Réduction de 20% sur tous les trajets en novembre',
    'PERCENTAGE',
    20,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    NULL, -- Pas de limite d'utilisation
    true
  )
ON CONFLICT (promotion_id) DO NOTHING;

-- ================================================
-- 12. VERIFICATION QUERIES
-- ================================================

-- Vérifier la structure des tables
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name IN ('promotions', 'operators', 'trips')
-- ORDER BY table_name, ordinal_position;

-- ================================================
-- COMMENTS & DOCUMENTATION
-- ================================================

COMMENT ON TABLE promotions IS 
'Table pour gérer les promotions/réductions.
- operator_id: opérateur qui propose la promo
- trip_id: NULL = promo globale pour l''opérateur, sinon spécifique à un trajet
- discount_type: "PERCENTAGE" (20 = 20%) ou "FIXED_AMOUNT" (2000 = -2000 FCFA)
- max_uses: limite du nombre d''utilisations (NULL = illimitée)
- status déterminé par: is_active, dates (start/end), max_uses vs uses_count';

COMMENT ON COLUMN promotions.discount_type IS 
'Type de réduction:
- PERCENTAGE: discount_value en % (ex: 20 = 20% off)
- FIXED_AMOUNT: discount_value en monnaie (ex: 2000 = -2000 FCFA)';

COMMENT ON COLUMN promotions.max_uses IS 
'NULL = pas de limite, sinon nombre maximal d''utilisations';

COMMENT ON COLUMN operators.baggage_price IS 
'Tarif par défaut du bagage supplémentaire pour cet opérateur (0 = gratuit)
Peut être surchargé au niveau des trajets si besoin';

COMMENT ON COLUMN trips.promotion_id IS 
'Foreign key vers la promotion active pour ce trajet
Rempli automatiquement si une promo s''applique au trajet';

COMMENT ON COLUMN trips.promoted_price IS 
'Prix réduit si promotion active, NULL sinon
Calculé automatiquement par le trigger trg_update_promotion_fields';

COMMENT ON COLUMN trips.discount_percentage IS 
'Pourcentage de réduction pour affichage UI (-20%, etc.)
Calculé automatiquement par le trigger trg_update_promotion_fields';

-- ================================================
-- ROLLBACK SCRIPT (si besoin de revenir en arrière)
-- ================================================

/*
-- Rollback Migration 013:
-- 1. Supprimer les vues et fonctions
DROP VIEW IF EXISTS vw_trips_with_promotions CASCADE;
DROP VIEW IF EXISTS vw_active_promotions CASCADE;
DROP FUNCTION IF EXISTS calculate_discount_percentage(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS calculate_promoted_price(INTEGER, VARCHAR, NUMERIC);

-- 2. Supprimer les triggers
DROP TRIGGER IF EXISTS trg_update_promotion_fields ON trips;
DROP FUNCTION IF EXISTS fn_update_promotion_fields();

-- 3. Supprimer les colonnes de trips
ALTER TABLE trips
DROP COLUMN IF EXISTS discount_percentage,
DROP COLUMN IF EXISTS promoted_price,
DROP COLUMN IF EXISTS promotion_id;

-- 4. Supprimer le champ baggage_price de operators
ALTER TABLE operators
DROP COLUMN IF EXISTS baggage_price;

-- 5. Supprimer la table promotions
DROP TABLE IF EXISTS promotions CASCADE;
*/
