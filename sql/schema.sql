-- ===================================================================
-- SCRIPT SQL COMPLETO DO PROJETO ECOLote - Tabelas, Triggers e RLS
-- Banco: PostgreSQL (Supabase)
-- ===================================================================

-- FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 1. TABELA: pessoas_fisicas
-- ================================================
CREATE TABLE IF NOT EXISTS public.pessoas_fisicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    nome_completo TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    modelo_imovel TEXT NOT NULL,
    outro_modelo_imovel TEXT,
    media_conta_energia TEXT NOT NULL,
    cep TEXT NOT NULL,
    rua TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    bairro TEXT NOT NULL,
    cidade TEXT NOT NULL,
    estado TEXT NOT NULL,
    pretensao_pagamento TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON COLUMN public.pessoas_fisicas.outro_modelo_imovel IS 
    'Preenchido se modelo_imovel for ''outro''';

CREATE TRIGGER set_timestamp_pessoas_fisicas
BEFORE UPDATE ON public.pessoas_fisicas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- ================================================
-- 2. TABELA: pessoas_juridicas
-- ================================================
CREATE TABLE IF NOT EXISTS public.pessoas_juridicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    telefone_comercial TEXT NOT NULL,
    email_comercial TEXT NOT NULL,
    nome_responsavel TEXT NOT NULL,
    telefone_responsavel TEXT NOT NULL,
    tipo_imovel_comercial TEXT NOT NULL,
    outro_tipo_imovel_comercial TEXT,
    media_conta_energia_pj TEXT NOT NULL,
    cep_pj TEXT NOT NULL,
    rua_pj TEXT NOT NULL,
    numero_pj TEXT NOT NULL,
    complemento_pj TEXT,
    bairro_pj TEXT NOT NULL,
    cidade_pj TEXT NOT NULL,
    estado_pj TEXT NOT NULL,
    pretensao_pagamento_pj TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    data_atualizacao TIMESTAMPTZ DEFAULT now() NOT NULL
);


COMMENT ON COLUMN public.pessoas_juridicas.outro_tipo_imovel_comercial IS 
    'Preenchido se tipo_imovel_comercial for ''outro''';

CREATE INDEX IF NOT EXISTS idx_pessoas_juridicas_cnpj ON public.pessoas_juridicas(cnpj);
CREATE INDEX IF NOT EXISTS idx_pessoas_juridicas_email ON public.pessoas_juridicas(email_comercial);

CREATE TRIGGER set_timestamp_pessoas_juridicas
BEFORE UPDATE ON public.pessoas_juridicas
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- ================================================
-- 3. TABELA: investidores
-- ================================================
CREATE TABLE IF NOT EXISTS public.investidores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    nome_investidor TEXT NOT NULL,
    email_investidor TEXT NOT NULL UNIQUE,
    telefone_investor TEXT,
    tipo_investidor TEXT NOT NULL,
    area_interesse_principal TEXT,
    valor_interesse_investimento TEXT,
    mensagem_investidor TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    data_atualizacao TIMESTAMPTZ DEFAULT now() NOT NULL,
    cidade_investidor TEXT,
    estado_investidor TEXT
);


CREATE INDEX IF NOT EXISTS idx_investidores_email ON public.investidores(email_investidor);

CREATE TRIGGER set_timestamp_investidores
BEFORE UPDATE ON public.investidores
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- ================================================
-- 4. TABELA: administradores
-- ================================================
CREATE TABLE IF NOT EXISTS public.administradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    nome_completo TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


COMMENT ON TABLE public.administradores IS 
    'Tabela para armazenar os dados dos usuários administradores do sistema Ecolote.';
COMMENT ON COLUMN public.administradores.id IS 
    'Identificador único do administrador (UUID).';
COMMENT ON COLUMN public.administradores.nome_completo IS 
    'Nome completo do administrador.';
COMMENT ON COLUMN public.administradores.email IS 
    'Email do administrador, usado para login. Deve ser do domínio @ecolote.com.br.';
COMMENT ON COLUMN public.administradores.senha_hash IS 
    'Hash da senha do administrador (gerado com bcryptjs).';
COMMENT ON COLUMN public.administradores.created_at IS 
    'Timestamp de criação.';
COMMENT ON COLUMN public.administradores.updated_at IS 
    'Timestamp da última atualização.';

CREATE INDEX IF NOT EXISTS idx_administradores_email ON public.administradores(email);

CREATE TRIGGER set_timestamp_administradores
BEFORE UPDATE ON public.administradores
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- ================================================
-- ROW LEVEL SECURITY (RLS) - Apenas para administradores
-- ================================================
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

-- Política para service_role (backend)
CREATE POLICY "Allow service_role all access to administradores" 
ON public.administradores FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Política padrão para negar acessos não autorizados
CREATE POLICY "Deny all access to non-service roles by default for administradores" 
ON public.administradores FOR ALL
USING (false)
WITH CHECK (false);

-- ================================================
-- RECOMENDAÇÕES GERAIS
-- ================================================
-- ⚠ Após a criação, configure RLS para as outras tabelas conforme necessário.
-- Exemplo:
-- ALTER TABLE public.pessoas_fisicas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY ... (para usuários autenticados acessarem seus próprios dados)

-- ⚠ Considere adicionar CHECK CONSTRAINTS adicionais para validar valores permitidos nos campos de seleção (ex: modelo_imovel, tipo_investidor)

-- ⚠ Proteja sua chave service_role no backend. Nunca exponha no frontend.
