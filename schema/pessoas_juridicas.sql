
-- pessoas_juridicas.sql
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.pessoas_juridicas (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

    razao_social               TEXT,
    nome_fantasia              TEXT,
    cnpj                       TEXT UNIQUE,
    telefone_comercial         TEXT,
    email_comercial            TEXT,
    nome_responsavel           TEXT,
    telefone_responsavel       TEXT,
    tipo_imovel_comercial      TEXT,
    outro_tipo_imovel_comercial TEXT,
    media_conta_energia_pj     TEXT,
    cep_pj                     TEXT,
    rua_pj                     TEXT,
    numero_pj                  TEXT,
    complemento_pj             TEXT,
    bairro_pj                  TEXT,
    cidade_pj                  TEXT,
    estado_pj                  TEXT,
    pretensao_pagamento_pj     TEXT,

    created_at                 TIMESTAMPTZ DEFAULT NOW(),
    data_atualizacao           TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_pj_tipo_imovel_valid CHECK (
        tipo_imovel_comercial IS NULL OR tipo_imovel_comercial IN ('galpao', 'loja', 'industria', 'outro')
    )
);

COMMENT ON COLUMN public.pessoas_juridicas.outro_tipo_imovel_comercial IS
    'Preenchido se tipo_imovel_comercial for ''outro''';

CREATE INDEX IF NOT EXISTS idx_pj_cnpj  ON public.pessoas_juridicas (cnpj);
CREATE INDEX IF NOT EXISTS idx_pj_email ON public.pessoas_juridicas (email_comercial);

DROP TRIGGER IF EXISTS set_timestamp_pessoas_juridicas ON public.pessoas_juridicas;
CREATE TRIGGER set_timestamp_pessoas_juridicas
BEFORE UPDATE ON public.pessoas_juridicas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
