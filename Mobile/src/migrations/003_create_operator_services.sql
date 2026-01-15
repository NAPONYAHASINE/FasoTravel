-- Migration: Create Operator Services/Extras table for additional pricing
-- Purpose: Model operator-configured service pricing (baggage, food, comfort upgrades, etc.)
-- Date: 2025-11-29

-- ============================================
-- Create operator_services table
-- ============================================
CREATE TABLE IF NOT EXISTS operator_services (
  service_id VARCHAR(50) PRIMARY KEY DEFAULT (UUID()),
  operator_id VARCHAR(50) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  service_type ENUM('BAGGAGE', 'FOOD', 'COMFORT', 'ENTERTAINMENT', 'OTHER') NOT NULL DEFAULT 'BAGGAGE',
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'FCFA',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id) ON DELETE CASCADE,
  INDEX idx_operator_id (operator_id),
  INDEX idx_service_type (service_type)
);

-- ============================================
-- Extend trips table to include available services
-- ============================================
-- NOTE: This assumes your trips table exists
-- If trips already has a services_json column, skip this line
-- ALTER TABLE trips ADD COLUMN available_services JSON COMMENT 'Array of available service_ids for this trip';

-- ============================================
-- Sample data (for development/testing)
-- ============================================
-- INSERT INTO operator_services (operator_id, service_name, service_type, description, price) VALUES
-- ('op-001', 'Bagage supplémentaire', 'BAGGAGE', 'Bagage supplémentaire (25kg max)', 1500),
-- ('op-001', 'Bagage excédentaire', 'BAGGAGE', 'Bagage excédentaire (50kg max)', 3000),
-- ('op-001', 'Repas léger', 'FOOD', 'Repas léger pendant le voyage', 5000),
-- ('op-002', 'Bagage supplémentaire', 'BAGGAGE', 'Bagage supplémentaire (30kg max)', 2000),
-- ('op-002', 'Siège premium', 'COMFORT', 'Siège avec plus d\'espace', 10000);
