-- Extensão necessária para UUIDs aleatórios
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================
--  Tabela: leads  (schema Seller)
--  OBS.: Somente a coluna id é obrigatória. Todas as outras são
--        opcionais para facilitar importação incremental.
-- ==============================================================
CREATE TABLE IF NOT EXISTS leads (
    id                              UUID PRIMARY KEY                DEFAULT gen_random_uuid(),

    -- Dados do local (Google Places)
    place_id                        TEXT UNIQUE,
    name                            TEXT,
    formatted_address               TEXT,
    city                            TEXT,
    state                           TEXT,
    neighborhood                    TEXT,
    formatted_phone_number          TEXT,
    latitude                        DECIMAL(10,8),
    longitude                       DECIMAL(11,8),
    image_urls                      TEXT[],
    type                            TEXT,
    collected_at                    TIMESTAMPTZ,

    -- Gestão de atendimento
    status                          TEXT,
    last_status_update_at           TIMESTAMPTZ,
    assigned_to_user_id             UUID,
    assigned_at                     TIMESTAMPTZ,
    attended_by_user_id             UUID,
    attended_at                     TIMESTAMPTZ,
    is_active_attendance            BOOLEAN                         DEFAULT FALSE,

    -- Contato e follow‑up
    last_contact_at                 TIMESTAMPTZ,
    last_contact_method             TEXT,
    last_contact_notes              TEXT,
    follow_up_date                  DATE,
    follow_up_notes                 TEXT,
    contact_successful              BOOLEAN,
    contact_attempts                INTEGER DEFAULT 0,
    contact_history                 JSONB DEFAULT '[]'::jsonb,

    -- Qualificação
    responsible_person_name         TEXT,
    responsible_person_phone_numbers TEXT[],
    current_light_bill_value        DECIMAL(10,2),
    last_kwh_consumption            DECIMAL(10,2),
    is_energy_from_other_source     BOOLEAN,
    payment_preference              TEXT,
    payment_type                    TEXT,
    bank_approval_status            TEXT,
    proposal_generated_at           TIMESTAMPTZ,
    proposal_url                    TEXT,
    client_email                    TEXT,
    lead_interest_level             TEXT,
    meeting_scheduled_at            TIMESTAMPTZ,

    -- Motivos & pipeline
    discard_reason                  TEXT,
    extended_follow_up_reason       TEXT,
    reactivation_notes              TEXT,

    -- Controle de reativação e último atendimento
    last_interaction_at             TIMESTAMPTZ,
    reactivation_due_date           DATE,
    last_attended_by_user_id        UUID,
    last_attended_at                TIMESTAMPTZ,

    -- Auditoria
    last_changed_by_user_id         UUID, -- NOVA COLUNA ADICIONADA
    created_at                      TIMESTAMPTZ                     DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ                     DEFAULT NOW()
);

-- ==============================================================
--  Índices dedicados
-- ==============================================================
CREATE INDEX IF NOT EXISTS idx_leads_status               ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_user     ON leads (assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_city_state_type      ON leads (city, state, type);
CREATE INDEX IF NOT EXISTS idx_leads_collected_at         ON leads (collected_at);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date       ON leads (follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_last_interaction_at ON leads (last_interaction_at);
CREATE INDEX IF NOT EXISTS idx_leads_reactivation_due_date ON leads (reactivation_due_date);
CREATE INDEX IF NOT EXISTS idx_leads_contact_attempts ON leads (contact_attempts);
CREATE INDEX IF NOT EXISTS idx_leads_last_changed_by_user_id ON leads (last_changed_by_user_id); -- NOVO ÍNDICE

-- ==============================================================
--  Regra de domínio para status (NULL permitido) - ATUALIZADA
-- ==============================================================
ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_leads_status_valid;
ALTER TABLE leads
    ADD CONSTRAINT chk_leads_status_valid
    CHECK (
        status IS NULL OR status IN (
            'Disponível',
            'Em Atendimento',
            'Aguardando Retorno',
            'Não Interessado',
            'Descartado pelo Vendedor',
            'Aguardando Aprovação do Banco',
            'Fechado',
            'Inativo',
            'Aguardando Reativação',
            'Descartado - Inatividade',
            'Descartado - Sem Interesse'
        )
    );

-- ==============================================================
--  Trigger: mantém updated_at sempre correto
-- ==============================================================
CREATE OR REPLACE FUNCTION trg_leads_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_on_leads ON leads;
CREATE TRIGGER set_updated_at_on_leads
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION trg_leads_set_updated_at();

-- ==============================================================
--  Trigger: atualiza last_interaction_at automaticamente
-- ==============================================================
CREATE OR REPLACE FUNCTION trg_leads_set_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza last_interaction_at sempre que houver uma modificação significativa
    IF (OLD.status IS DISTINCT FROM NEW.status OR
        OLD.last_contact_at IS DISTINCT FROM NEW.last_contact_at OR
        OLD.last_contact_method IS DISTINCT FROM NEW.last_contact_method OR
        OLD.last_contact_notes IS DISTINCT FROM NEW.last_contact_notes OR
        OLD.responsible_person_phone_numbers IS DISTINCT FROM NEW.responsible_person_phone_numbers OR
        OLD.follow_up_date IS DISTINCT FROM NEW.follow_up_date OR
        OLD.contact_successful IS DISTINCT FROM NEW.contact_successful OR
        OLD.contact_attempts IS DISTINCT FROM NEW.contact_attempts OR
        OLD.lead_interest_level IS DISTINCT FROM NEW.lead_interest_level OR
        OLD.meeting_scheduled_at IS DISTINCT FROM NEW.meeting_scheduled_at OR
        OLD.is_energy_from_other_source IS DISTINCT FROM NEW.is_energy_from_other_source OR
        OLD.discard_reason IS DISTINCT FROM NEW.discard_reason OR
        OLD.reactivation_notes IS DISTINCT FROM NEW.reactivation_notes OR
        OLD.assigned_to_user_id IS DISTINCT FROM NEW.assigned_to_user_id OR
        OLD.attended_by_user_id IS DISTINCT FROM NEW.attended_by_user_id OR
        OLD.is_active_attendance IS DISTINCT FROM NEW.is_active_attendance) THEN
        NEW.last_interaction_at = NOW();
    END IF;

    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_last_interaction_on_leads ON leads;
CREATE TRIGGER set_last_interaction_on_leads
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION trg_leads_set_last_interaction();

-- Inicializar last_interaction_at para leads existentes (usar updated_at como base)
UPDATE leads
SET last_interaction_at = COALESCE(updated_at, created_at)
WHERE last_interaction_at IS NULL;

-- ==============================================================
--  Tabela: lead_status_history
-- ==============================================================
CREATE TABLE IF NOT EXISTS lead_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,
    old_status TEXT,
    new_status TEXT,
    changed_by UUID, -- ID do usuário que fez a alteração
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    CONSTRAINT fk_lead_status_history_lead_id
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Criar índices para otimização de consultas na lead_status_history
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_at ON lead_status_history (changed_at);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_by ON lead_status_history (changed_by);

-- ==============================================================
--  Tabela: logs (para depuração)
-- ==============================================================
CREATE TABLE IF NOT EXISTS logs (
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================
--  Função e Trigger: trg_leads_status_history (para registrar mudanças de status)
-- ==============================================================
CREATE OR REPLACE FUNCTION public.trg_leads_status_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    current_user_id UUID;
BEGIN
    -- Obtém o user_id diretamente da nova coluna 'last_changed_by_user_id' na tabela leads
    current_user_id := NEW.last_changed_by_user_id;

    -- Só registra se o status realmente mudou
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        -- Adiciona uma mensagem de log na tabela logs para depuração
        INSERT INTO logs (message)
        VALUES (concat('Trigger reads User ID from leads table: ', current_user_id));

        INSERT INTO lead_status_history (
            lead_id,
            old_status,
            new_status,
            changed_by,
            changed_at,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            current_user_id, -- Usa o user_id da coluna NEW.last_changed_by_user_id
            NOW(),
            CASE
                WHEN OLD.status IS NULL THEN 'Lead criado'
                WHEN NEW.status LIKE 'Descartado%' THEN 'Lead descartado'
                WHEN NEW.status = 'Aguardando Reativação' THEN 'Lead marcado para reativação por inatividade'
                WHEN OLD.status = 'Aguardando Reativação' AND NEW.status != 'Aguardando Reativação' THEN 'Lead reativado'
                ELSE 'Status alterado'
            END
        );
    END IF;

    RETURN NEW;
END; $function$;

-- Criar o trigger na tabela leads para UPDATE
DROP TRIGGER IF EXISTS trg_leads_status_history ON leads;
CREATE TRIGGER trg_leads_status_history
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION trg_leads_status_history();

-- Também criar trigger para INSERT (quando um lead é criado)
DROP TRIGGER IF EXISTS trg_leads_status_history_insert ON leads;
CREATE TRIGGER trg_leads_status_history_insert
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION trg_leads_status_history();
