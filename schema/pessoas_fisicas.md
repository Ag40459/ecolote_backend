
# pessoas_fisicas.md

## Sumário de Colunas — Pessoas Físicas

| Coluna | Tipo SQL | Descrição |
|--------|----------|-----------|
| **id** | `UUID` (PK) | Identificador único gerado via `gen_random_uuid()` |
| nome_completo | `TEXT` | Nome completo do potencial cliente |
| telefone | `TEXT` | Telefone de contato |
| email | `TEXT` | E‑mail único para comunicação |
| modelo_imovel | `TEXT` | Tipo de imóvel (casa, apartamento, etc.) |
| outro_modelo_imovel | `TEXT` | Preenchido quando `modelo_imovel = 'outro'` |
| media_conta_energia | `TEXT` | Valor médio da conta de energia atual |
| cep, rua, numero, complemento, bairro, cidade, estado | `TEXT` | Endereço completo |
| pretensao_pagamento | `TEXT` | Forma de pagamento desejada (à vista, financiamento...) |
| created_at | `TIMESTAMPTZ` | Timestamp de criação |
| updated_at | `TIMESTAMPTZ` | Atualizado automaticamente via trigger |

### Regras & Índices
* **`chk_pf_modelo_imovel_valid`** garante que `modelo_imovel` contenha apenas valores válidos.
* Índices em `email` e `telefone` aceleram pesquisas no CRM.
