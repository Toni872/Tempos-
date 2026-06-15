-- =====================================================
-- Script idempotente para crear la tabla email_verifications
-- en la base de datos de producción de Railway.
--
-- Cómo ejecutarlo:
--   Railway Dashboard → PostgreSQL → SQL Editor → Pegar y ejecutar
--   O vía CLI: railway db exec --service=<postgres-service-id> -- < este archivo
-- =====================================================

CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(128) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS "IDX_email_verifications_token_used"
  ON email_verifications (token, used);

CREATE INDEX IF NOT EXISTS "IDX_email_verifications_uid_email"
  ON email_verifications (uid, email);

-- Verificar que quedó bien
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'email_verifications'
  ) THEN
    RAISE NOTICE '✅ Tabla email_verifications creada o ya existe';
  ELSE
    RAISE WARNING '⚠️ Tabla NO fue creada - revisar error';
  END IF;
END $$;
