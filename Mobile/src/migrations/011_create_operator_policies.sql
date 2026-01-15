-- 011_create_operator_policies.sql
-- Ajoute la table operator_policies et des colonnes optionnelles sur operators
-- Safe: utilise IF NOT EXISTS / contrôle de contraintes pour être idempotent

BEGIN;

-- 1) Table des politiques des opérateurs
CREATE TABLE IF NOT EXISTS operator_policies (
  policy_id VARCHAR(50) PRIMARY KEY,
  operator_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_policy_operator FOREIGN KEY (operator_id)
    REFERENCES operators(operator_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_operator_policies_operator_id ON operator_policies(operator_id);

-- 2) Colonnes optionnelles sur operators pour rendre l'affichage autonome
ALTER TABLE operators
  ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(255),
  ADD COLUMN IF NOT EXISTS primary_station_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS primary_station_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS primary_station_city VARCHAR(100);

-- 3) FK optionnelle vers stations (si table stations existante)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'operators'
      AND tc.constraint_name = 'fk_operator_primary_station'
  ) THEN
    ALTER TABLE operators
      ADD CONSTRAINT fk_operator_primary_station FOREIGN KEY (primary_station_id)
        REFERENCES stations(station_id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- ignore if stations table not present
  RAISE NOTICE 'stations table not found, skipping fk creation';
END$$;

COMMIT;