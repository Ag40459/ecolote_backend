# 📄 Esquema Completo da Tabela leads (schema: Seller)

Este documento detalha todas as colunas da tabela `leads`, seus tipos e finalidades com base no schema SQL fornecido, incluindo as novas funcionalidades da Fase 4 e Fase 6.

## 🎯 Identificação
| Coluna   | Tipo SQL | Descrição |
|----------|----------|-----------|
| id       | UUID     | Identificador único. Gerado automaticamente com gen_random_uuid(). |
| place_id | TEXT     | ID no Google Places. Deve ser único para evitar duplicação. |

## 📍 Localização e Origem
| Coluna               | Tipo SQL    | Descrição |
|----------------------|-------------|-----------|
| name                 | TEXT        | Nome do local (condomínio, hotel etc.). |
| formatted_address    | TEXT        | Endereço completo retornado pela API do Google. |
| city                 | TEXT        | Cidade do local. |
| state                | TEXT        | Estado (UF) do local. |
| neighborhood         | TEXT        | Bairro do local. |
| formatted_phone_number | TEXT      | Telefone principal do local. |
| latitude             | DECIMAL(10,8) | Latitude para uso em mapa. |
| longitude            | DECIMAL(11,8) | Longitude para uso em mapa. |
| image_urls           | TEXT[]      | Lista de URLs de imagens (carrossel). |
| type                 | TEXT        | Categoria do local ("Condomínio", "Hotel", etc). |
| collected_at         | TIMESTAMPTZ | Timestamp da coleta do lead. |

## 📞 Contato e Follow-up
| Coluna               | Tipo SQL    | Descrição |
|----------------------|-------------|-----------|
| last_contact_at      | TIMESTAMPTZ | Data do último contato feito. |
| last_contact_method  | TEXT        | Método de contato (WhatsApp, ligação etc.). |
| last_contact_notes   | TEXT        | Observações sobre o contato. |
| follow_up_date       | DATE        | Próxima data de follow-up agendada. |
| follow_up_notes      | TEXT        | Notas sobre o próximo contato. |
| contact_successful   | BOOLEAN     | NOVA: Indica se o contato inicial com o número cadastrado foi bem-sucedido. |
| contact_attempts     | INTEGER     | NOVA: Contador de tentativas de contato para o lead. |
| contact_history      | JSONB       | NOVA: Histórico detalhado de todas as tentativas de contato. |

## 👤 Qualificação
| Coluna                        | Tipo SQL    | Descrição |
|-------------------------------|-------------|-----------|
| responsible_person_name        | TEXT        | Nome do responsável pelo local. |
| responsible_person_phone_numbers | TEXT[]     | Telefones adicionais do responsável. |
| client_email                   | TEXT        | Email de contato. |
| current_light_bill_value       | DECIMAL(10,2) | Valor da conta de energia mais recente (R$). |
| last_kwh_consumption          | DECIMAL(10,2) | Consumo de energia (kWh) mais recente. |
| is_energy_from_other_source   | BOOLEAN     | Se já usa energia de outra fonte (solar, etc). |
| payment_preference            | TEXT        | Preferência de pagamento (à vista, financiamento etc.). |
| payment_type                  | TEXT        | Tipo de pagamento (CDC, consórcio etc.). |
| bank_approval_status          | TEXT        | Status da aprovação bancária. |
| proposal_generated_at          | TIMESTAMPTZ | Data/hora da geração da proposta. |
| proposal_url                  | TEXT        | Link direto para proposta comercial. |
| lead_interest_level           | TEXT        | NOVA: Nível de interesse do cliente (opções pré-definidas). |
| meeting_scheduled_at          | TIMESTAMPTZ | NOVA: Data e hora da reunião agendada com o cliente. |

## 🔄 Gestão de Atendimento e Reativação
| Coluna                    | Tipo SQL    | Descrição |
|---------------------------|-------------|-----------|
| status                    | TEXT        | Status atual do lead. (Ver lista completa abaixo) |
| last_status_update_at     | TIMESTAMPTZ | Última vez que o status foi alterado. |
| assigned_to_user_id       | UUID        | ID do usuário ao qual o lead foi atribuído. |
| assigned_at               | TIMESTAMPTZ | Quando o lead foi atribuído. |
| attended_by_user_id       | UUID        | Usuário que iniciou o último atendimento. |
| attended_at               | TIMESTAMPTZ | Quando o atendimento foi iniciado. |
| is_active_attendance      | BOOLEAN     | TRUE se atendimento está ativo. Default: FALSE. |
| last_attended_by_user_id  | UUID        | NOVA: ID do último vendedor que iniciou atendimento ou teve o lead atribuído. |
| last_attended_at          | TIMESTAMPTZ | NOVA: Data/hora do último atendimento iniciado ou atribuição. |
| last_interaction_at       | TIMESTAMPTZ | NOVA: Data/hora da última interação (qualquer atualização significativa do lead). |
| reactivation_due_date     | DATE        | NOVA: Data limite para reativação do lead após 15 dias de inatividade. |
| reactivation_notes        | TEXT        | NOVA: Notas sobre o motivo da extensão do prazo de reativação ou reativação. |

## 🗑️ Motivos e Justificativas
| Coluna                    | Tipo SQL    | Descrição |
|---------------------------|-------------|-----------|
| discard_reason             | TEXT        | Motivo para descarte do lead. |
| extended_follow_up_reason | TEXT        | Justificativa para prolongar follow-up (>20 dias). |

## 🕓 Auditoria
| Coluna                        | Tipo SQL    | Descrição |
|-------------------------------|-------------|-----------|
| last_changed_by_user_id        | UUID        | NOVA: ID do usuário que realizou a última alteração significativa no lead. |
| created_at                     | TIMESTAMPTZ | Data de criação do registro (default NOW()). |
| updated_at                     | TIMESTAMPTZ | Atualizado automaticamente via trigger em cada update (ver abaixo). |

## ⚙️ Extras Técnicos

### Regra de Domínio para Status (chk_leads_status_valid) - ATUALIZADA
A constraint `chk_leads_status_valid` garante que a coluna `status` aceite apenas os seguintes valores:
- Disponível
- Em Atendimento
- Aguardando Retorno
- Não Interessado
- Descartado pelo Vendedor
- Aguardando Aprovação do Banco
- Fechado
- Inativo
- Aguardando Reativação
- Descartado - Inatividade
- Descartado - Sem Interesse

### Trigger trg_leads_set_updated_at
Este trigger mantém o campo `updated_at` sempre atualizado automaticamente para o timestamp atual (NOW()) sempre que um registro na tabela `leads` é modificado.

### Trigger trg_leads_set_last_interaction
Este trigger é acionado BEFORE UPDATE na tabela `leads` e atualiza a coluna `last_interaction_at` para o timestamp atual (NOW()) se houver uma modificação significativa em qualquer um dos seguintes campos:
- status
- last_contact_at
- last_contact_method
- last_contact_notes
- responsible_person_phone_numbers
- follow_up_date
- contact_successful
- contact_attempts
- lead_interest_level
- meeting_scheduled_at
- is_energy_from_other_source
- discard_reason
- reactivation_notes
- assigned_to_user_id
- attended_by_user_id
- is_active_attendance

### Índices
Os seguintes índices otimizam as consultas na tabela `leads`:
- idx_leads_status
- idx_leads_assigned_to_user
- idx_leads_city_state_type
- idx_leads_collected_at
- idx_leads_follow_up_date
- idx_leads_last_interaction_at
- idx_leads_reactivation_due_date
- idx_leads_contact_attempts
- idx_leads_last_changed_by_user_id (NOVO)

## 📜 Tabela lead_status_history (Fase 6)

Esta tabela registra todas as mudanças de status dos leads, fornecendo um histórico auditável.

| Coluna             | Tipo SQL    | Descrição |
|--------------------|-------------|-----------|
| id                 | UUID        | Identificador único do registro de histórico. |
| lead_id            | UUID        | ID do lead ao qual este registro de histórico pertence. |
| old_status         | TEXT        | Status anterior do lead. |
| new_status         | TEXT        | Novo status do lead. |
| changed_by         | UUID        | ID do usuário que realizou a alteração de status. |
| changed_at         | TIMESTAMPTZ | Data e hora da alteração de status. |
| notes              | TEXT        | Notas automáticas sobre a mudança de status (ex: "Lead criado", "Status alterado"). |

### Índices da Tabela lead_status_history
- idx_lead_status_history_lead_id: Otimiza buscas por histórico de um lead específico.
- idx_lead_status_history_changed_at: Otimiza buscas por data de alteração.
- idx_lead_status_history_changed_by: Otimiza buscas por usuário que realizou a alteração.

### Trigger trg_leads_status_history (Fase 6)
Esta trigger é acionada AFTER UPDATE e AFTER INSERT na tabela `leads`. Ela registra automaticamente uma nova entrada na tabela `lead_status_history` sempre que o status de
