
# investidores.md

## Sumário de Colunas — Investidores

| Coluna | Tipo SQL | Descrição |
|--------|----------|-----------|
| **id** | `UUID` (PK) | Identificador único gerado via `gen_random_uuid()` |
| nome_investidor | `TEXT` | Nome do potencial investidor |
| email_investidor | `TEXT` | E‑mail único para contato |
| telefone_investor | `TEXT` | Telefone para ligação ou WhatsApp |
| tipo_investidor | `TEXT` | Perfil: anjo, venture, outro |
| area_interesse_principal | `TEXT` | Nicho ou segmento de interesse |
| valor_interesse_investimento | `TEXT` | Faixa de investimento |
| mensagem_investidor | `TEXT` | Observações enviadas pelo investidor |
| cidade_investidor, estado_investidor | `TEXT` | Localização |
| created_at | `TIMESTAMPTZ` | Timestamp de criação |
| data_atualizacao | `TIMESTAMPTZ` | Atualizado via trigger |

### Regras & Índices
* **`chk_tipo_invest_valid`** garante valores adequados em `tipo_investidor`.
* Índice em `email_investidor` previne duplicidades e agiliza busca.
