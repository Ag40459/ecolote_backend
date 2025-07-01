# schemaAdmin.md

## Sumário de Colunas — Administradores / Vendedores

| Coluna | Tipo SQL | Descrição |
| ------ | -------- | --------- |
|        |          |           |

|   |
| - |

| **id**                      | `UUID` (PK)   | Identificador único gerado via `gen_random_uuid()`. Campo obrigatório.                       |
| --------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| **nome\_completo**          | `TEXT`        | Nome completo do administrador ou vendedor.                                                  |
| **email**                   | `TEXT`        | E-mail utilizado para login. Deve ser único.                                                 |
| **senha\_hash**             | `TEXT`        | Hash da senha criptografada (ex: bcrypt ou argon2).                                          |
| **telefone**                | `TEXT`        | Telefone de contato. Opcional.                                                               |
| **tipo\_usuario**           | `TEXT`        | Define se é `admin` ou `seller`. Garante separação de permissões e regras de acesso.         |
| **is\_active**              | `BOOLEAN`     | Informa se o usuário está ativo no sistema. Valor padrão: `TRUE`.                            |
| **last\_login\_at**         | `TIMESTAMPTZ` | Registro de último login realizado com sucesso.                                              |
| **failed\_login\_attempts** | `INT`         | Tentativas mal sucedidas de login. Pode ser usado para bloqueio de conta. Valor padrão: `0`. |
| **created\_at**             | `TIMESTAMPTZ` | Data e hora de criação do usuário. Valor padrão: `NOW()`.                                    |
| **updated\_at**             | `TIMESTAMPTZ` | Atualização automática ao modificar qualquer dado.                                           |


## Regras de Negócio & Considerações

- O campo **tipo\_usuario** é essencial para diferenciar permissões de acesso.
- O campo **is\_active** permite suspender contas sem apagá-las.
- O campo **failed\_login\_attempts** pode ser usado para bloquear contas após muitas tentativas.
- O campo **last\_login\_at** é importante para auditoria e relatórios de atividade.
- A trigger garante que qualquer atualização no usuário mantenha o `updated_at` atualizado automaticamente.

---

*Documento gerado em: 29/jun/2025*

