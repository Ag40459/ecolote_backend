CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS administradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome_completo TEXT,
    email TEXT UNIQUE,
    senha_hash TEXT,
    telefone TEXT,

    tipo_usuario TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_tipo_usuario_valid CHECK (
        tipo_usuario IS NULL OR tipo_usuario IN ('admin', 'seller')
    )
);

CREATE INDEX IF NOT EXISTS idx_admin_email ON administradores (email);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trg_admin_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_on_admin ON administradores;
CREATE TRIGGER set_updated_at_on_admin
BEFORE UPDATE ON administradores
FOR EACH ROW
EXECUTE FUNCTION trg_admin_set_updated_at();