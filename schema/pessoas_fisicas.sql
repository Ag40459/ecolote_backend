
-- pessoas_fisicas.sql
-- ------------------------------------------------------------
-- Cria apenas a tabela pessoas_fisicas e gatilhos relacionados
-- Pode ser executado isoladamente no Beekeeper Studio
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função de atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/*------------------------------------------------------------*/
/*  Tabela: pessoas_fisicas                                   */
/*------------------------------------------------------------*/
CREATE TABLE IF NOT EXISTS public.pessoas_fisicas (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

    nome_completo            TEXT,
    telefone                 TEXT,
    email                    TEXT UNIQUE,
    modelo_imovel            TEXT,
    outro_modelo_imovel      TEXT,
    media_conta_energia      TEXT,
    cep                      TEXT,
    rua                      TEXT,
    numero                   TEXT,
    complemento              TEXT,
    bairro                   TEXT,
    cidade                   TEXT,
    estado                   TEXT,
    pretensao_pagamento      TEXT,

    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_pf_modelo_imovel_valid CHECK (
        modelo_imovel IS NULL OR modelo_imovel IN ('casa', 'apartamento', 'galpao', 'outro')
    )
);

COMMENT ON COLUMN public.pessoas_fisicas.outro_modelo_imovel IS
    'Preenchido se modelo_imovel for ''outro''';

/* Índices auxiliares */
CREATE INDEX IF NOT EXISTS idx_pf_email    ON public.pessoas_fisicas (email);
CREATE INDEX IF NOT EXISTS idx_pf_telefone ON public.pessoas_fisicas (telefone);

/* Trigger de updated_at */
DROP TRIGGER IF EXISTS set_timestamp_pessoas_fisicas ON public.pessoas_fisicas;
CREATE TRIGGER set_timestamp_pessoas_fisicas
BEFORE UPDATE ON public.pessoas_fisicas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
