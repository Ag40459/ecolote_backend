# 📄 Esquema da Tabela lead_status_history e Triggers Associados

Este documento detalha o esquema da tabela `lead_status_history` e as funções e triggers associados, conforme implementado para registrar automaticamente todas as mudanças de status de leads.

## 🎯 Extensões Necessárias
| Extensão  | Descrição |
|-----------|-----------|
| pgcrypto  | Necessária para gerar UUIDs aleatórios. |

## 📜 Tabela lead_status_history

Esta tabela armazena um registro de cada alteração de status de um lead, fornecendo um histórico auditável.

| Coluna         | Tipo SQL   | Descrição |
|----------------|------------|-----------|
| id             | UUID       | Identificador único do registro de histórico. Gerado automaticamente. |
| lead_id        | UUID       | ID do lead ao qual este registro de histórico pertence. |
| old_status     | TEXT       | Status anterior do lead (pode ser NULL para novas criações). |
| new_status     | TEXT       | Novo status do lead. |
| changed_by     | UUID       | ID do usuário que realizou a alteração de status. |
| changed_at     | TIMESTAMPTZ| Data e hora da alteração de status. Padrão é o momento atual. |
| notes          | TEXT       | Notas automáticas sobre a mudança de status. |

### Chaves e Restrições
- **Chave Primária**: `id`
- **Chave Estrangeira**: `fk_lead_status_history_lead_id` referencia `leads(id)` com `ON DELETE CASCADE` (registros de histórico são excluídos se o lead correspondente for excluído).

### Índices
- `idx_lead_status_history_lead_id`: Otimiza buscas por histórico de um lead específico.
- `idx_lead_status_history_changed_at`: Otimiza buscas por data de alteração.
- `idx_lead_status_history_changed_by`: Otimiza buscas por usuário que realizou a alteração.

## 📊 Tabela logs (para Depuração)

Esta tabela é utilizada para registrar mensagens de depuração das triggers, útil para investigar o fluxo de execução e valores internos.

| Coluna       | Tipo SQL   | Descrição |
|--------------|------------|-----------|
| message      | TEXT       | A mensagem de log. |
| created_at   | TIMESTAMPTZ| Data e hora em que a mensagem foi registrada. |

## ⚙️ Funções e Triggers Associados

### Função trg_leads_status_history()

Esta função é o coração do sistema de histórico de status. Ela é executada automaticamente sempre que um lead é inserido ou seu status é atualizado.

**Propósito**: Registrar as mudanças de status na tabela `lead_status_history`.

**Obtenção do changed_by**: O ID do usuário que fez a alteração (`changed_by`) é obtido diretamente da nova coluna `NEW.last_changed_by_user_id` da tabela `leads`. Isso garante que o usuário responsável pela mudança seja registrado, sem depender de variáveis de sessão.

### Lógica de Registro:
- Só registra se o `OLD.status` for diferente do `NEW.status` (ou se for uma nova inserção, onde `OLD.status` é NULL).
- Gera **notes automáticas** baseadas na mudança de status, com a seguinte prioridade:
  - 'Lead criado' (quando `OLD.status` é NULL).
  - 'Lead descartado' (quando `NEW.status` começa com 'Descartado%').
  - 'Lead marcado para reativação por inatividade' (quando `NEW.status` é 'Aguardando Reativação').
  - 'Lead reativado' (quando `OLD.status` era 'Aguardando Reativação' e `NEW.status mudou` para outra coisa).
  - 'Status alterado' (para todas as outras mudanças de status).
  
- Inclui um log na tabela `logs` para depuração, mostrando o `user_id` lido.

### Trigger trg_leads_status_history (para UPDATE)

- **Evento**: `AFTER UPDATE` na tabela `leads`.
- **Ação**: Para cada linha atualizada, executa a função `trg_leads_status_history()`.

### Trigger trg_leads_status_history_insert (para INSERT)

- **Evento**: `AFTER INSERT` na tabela `leads`.
- **Ação**: Para cada nova linha inserida, executa a função `trg_leads_status_history()`.