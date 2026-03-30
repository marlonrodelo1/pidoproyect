-- Añadir campos de tarifas de envío a la tabla socios
ALTER TABLE socios
  ADD COLUMN IF NOT EXISTS tarifa_base FLOAT DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS radio_tarifa_base_km FLOAT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS precio_km_adicional FLOAT DEFAULT 0.50;

-- Añadir constraint para que tarifa_base no sea inferior a 3€
ALTER TABLE socios
  ADD CONSTRAINT socios_tarifa_base_minima CHECK (tarifa_base >= 3.00);
