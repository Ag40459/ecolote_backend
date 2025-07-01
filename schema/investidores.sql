
-- investidores.sql
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.investidores (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

    nome_investidor              TEXT,
    email_investidor             TEXT UNIQUE,
    telefone_investor            TEXT,   -- mantido para compatibilidade
    tipo_investidor              TEXT,
    area_interesse_principal     TEXT,
    valor_interesse_investimento TEXT,
    mensagem_investidor          TEXT,
    cidade_investidor            TEXT,
    estado_investidor            TEXT,

    created_at                   TIMESTAMPTZ DEFAULT NOW(),
    data_atualizacao             TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_tipo_invest_valid CHECK (
        tipo_investidor IS NULL OR tipo_investidor IN ('anjo','venture','outro')
    )
);

CREATE INDEX IF NOT EXISTS idx_inv_email ON public.investidores (email_investidor);

DROP TRIGGER IF EXISTS set_timestamp_investidores ON public.investidores;
CREATE TRIGGER set_timestamp_investidores
BEFORE UPDATE ON public.investidores
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
