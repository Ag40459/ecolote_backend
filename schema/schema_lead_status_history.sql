-- Script SQL para implementar a Fase 6: Integração com lead_status_history
-- Este script cria a tabela lead_status_history e o trigger para registrar automaticamente
-- todas as mudanças de status de leads.

-- Extensão necessária para UUIDs aleatórios (se não existir)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar a tabela lead_status_history se não existir
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

-- Criar índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id ON lead_status_history (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_at ON lead_status_history (changed_at);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_changed_by ON lead_status_history (changed_by);

-- Criar a tabela logs para depuração (se não existir)
CREATE TABLE IF NOT EXISTS logs (
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para registrar mudanças de status na tabela lead_status_history
CREATE OR REPLACE FUNCTION trg_leads_status_history()
RETURNS TRIGGER AS $$
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
            -- Adiciona uma nota automática baseada na mudança (lógica CASE corrigida)
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
END; $$ LANGUAGE plpgsql;

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

-- A função set_current_user_id e seus comentários foram removidos,
-- pois a obtenção do changed_by agora é feita diretamente da coluna
-- last_changed_by_user_id na tabela leads.
