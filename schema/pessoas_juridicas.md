
# pessoas_juridicas.md

## Sumário de Colunas — Pessoas Jurídicas

| Coluna | Tipo SQL | Descrição |
|--------|----------|-----------|
| **id** | `UUID` (PK) | Identificador único gerado via `gen_random_uuid()` |
| razao_social, nome_fantasia | `TEXT` | Identificação da empresa |
| cnpj | `TEXT` | Cadastro nacional de pessoa jurídica (único) |
| telefone_comercial, email_comercial | `TEXT` | Contatos principais |
| nome_responsavel, telefone_responsavel | `TEXT` | Quem lida com o projeto |
| tipo_imovel_comercial | `TEXT` | Tipo de imóvel comercial |
| outro_tipo_imovel_comercial | `TEXT` | Complemento se `tipo_imovel_comercial = 'outro'` |
| media_conta_energia_pj | `TEXT` | Média da conta de energia atual |
| Endereço (cep_pj, rua_pj, … estado_pj) | `TEXT` | Localização do negócio |
| pretensao_pagamento_pj | `TEXT` | Forma de pagamento desejada |
| created_at | `TIMESTAMPTZ` | Timestamp de criação |
| data_atualizacao | `TIMESTAMPTZ` | Atualizado via trigger |

### Regras & Índices
* **`chk_pj_tipo_imovel_valid`** controla valores de `tipo_imovel_comercial`.
* Índices em `cnpj` e `email_comercial` aceleram consultas e evitam duplicidade.
