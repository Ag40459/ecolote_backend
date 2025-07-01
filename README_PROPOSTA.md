
# Implementação da Geração de Propostas Comerciais em PDF

Este relatório detalha as modificações e novas implementações realizadas no projeto `ecolote-backend` para permitir a geração de propostas comerciais em PDF, baseadas no modelo fornecido e com integração entre Node.js (backend principal), Python (geração de PDF com ReportLab) e PostgreSQL (armazenamento de dados).

## 1. Análise UX do Modelo de Proposta

O modelo de proposta fornecido (`PropostaComercialCondomínioSobrado.pdf`) é visualmente atraente e bem estruturado. Foram identificados os seguintes pontos fortes e sugeridas melhorias para a implementação:

**Pontos Fortes:**
- Design moderno e profissional com identidade visual consistente.
- Estrutura clara com 5 páginas bem organizadas, facilitando a leitura e compreensão.
- Uso eficiente de cores (roxo/azul da marca) e ícones para destacar informações.
- Informações financeiras (valor da conta de luz, economia, valor do Ecolote, opções de financiamento) são destacadas adequadamente.
- Fluxo lógico de apresentação: Resumo Financeiro → Benefícios para o Bolso → O que o Ecolote Oferece → Passo a Passo da Entrega → Como Funciona a Geração de Energia Remota → Informações Importantes.

**Melhorias Sugeridas (para futuras iterações ou personalização):**
- **Capa Personalizada**: Adicionar uma capa inicial com dados específicos do cliente (nome do condomínio, endereço, etc.) e, opcionalmente, uma imagem do prédio/condomínio para maior personalização e impacto visual.
- **Dados Detalhados do Cliente**: Incluir uma seção dedicada com as informações coletadas pelo vendedor (responsável, telefones, e-mail, etc.) para que o cliente se sinta mais atendido.
- **Cronograma Visual Detalhado**: Uma timeline mais interativa ou detalhada do processo de instalação e homologação.

## 2. Modificações no PostgreSQL

Para suportar as novas funcionalidades de gerenciamento de leads e armazenamento de propostas, a tabela `leads` no PostgreSQL foi atualizada com os seguintes campos. Foi mantida a flexibilidade de nenhum campo ser obrigatório inicialmente.

**Script SQL (`sql/schema_update.sql`):**
```sql
ALTER TABLE leads
ADD COLUMN status TEXT,
ADD COLUMN last_status_update_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN assigned_to_user_id UUID,
ADD COLUMN assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN attended_by_user_id UUID,
ADD COLUMN attended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_active_attendance BOOLEAN DEFAULT FALSE,
ADD COLUMN last_contact_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_contact_method TEXT,
ADD COLUMN last_contact_notes TEXT,
ADD COLUMN follow_up_date DATE,
ADD COLUMN follow_up_notes TEXT,
ADD COLUMN responsible_person_name TEXT,
ADD COLUMN responsible_person_phone_numbers TEXT[],
ADD COLUMN current_light_bill_value DECIMAL(10, 2),
ADD COLUMN last_kwh_consumption DECIMAL(10, 2),
ADD COLUMN payment_preference TEXT,
ADD COLUMN proposal_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN proposal_url TEXT,
ADD COLUMN client_email TEXT, -- Adicionado conforme sua solicitação
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar índices para otimização de busca
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_user_id ON leads (assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_city_state_type ON leads (city, state, type);
```

**Como aplicar:**
Execute este script SQL no seu banco de dados PostgreSQL para atualizar a tabela `leads`.

## 3. Implementação da Geração de PDF (Python com ReportLab)

Um novo script Python (`src/Utils/Proposals/generate_proposal.py`) foi criado para gerar o PDF da proposta comercial, replicando o design e o conteúdo do modelo fornecido. Ele utiliza a biblioteca `ReportLab` para um controle preciso sobre o layout.

**Funcionalidades:**
- **Replicação Visual**: O script tenta replicar o máximo possível do layout, cores, fontes e estrutura do PDF original.
- **Dados Dinâmicos**: Aceita um dicionário de dados como entrada (via `stdin` quando chamado pelo Node.js) para preencher as informações específicas da proposta (nome do cliente, valores financeiros, datas, etc.).
- **Assets**: Uma logo (`ecolote_logo.png`) foi gerada e está incluída no mesmo diretório do script Python para ser usada no PDF.

**Dependências Python:**
- `reportlab`
- `psycopg2-binary` (já instalado para o backend, mas listado aqui para referência)

**Como funciona:**
O script `generate_proposal.py` recebe os dados da proposta via `stdin` (como uma string JSON), gera o PDF e o salva em um caminho especificado. Ele então imprime o caminho do PDF gerado no `stdout` para que o Node.js possa capturá-lo.

## 4. Integração com o Backend Node.js

O backend Node.js foi modificado para:

1.  **Novo Endpoint**: Criado um novo arquivo de rota (`src/routes/proposalRoutes.js`) com um endpoint `POST /api/leads/:leadId/generate-proposal`.
2.  **Chamada ao Python**: Este endpoint recebe os dados da proposta do frontend, invoca o script Python (`generate_proposal.py`) usando `child_process.spawn`, passa os dados via `stdin` e captura a saída (`stdout`).
3.  **Armazenamento de PDFs**: Os PDFs gerados são salvos em um novo diretório `generated_proposals` na raiz do projeto backend.
4.  **Serviço de Arquivos Estáticos**: O `app.js` foi configurado para servir os PDFs gerados estaticamente através da URL `/generated_proposals/`.
5.  **Atualização do PostgreSQL**: O `proposalRoutes.js` inclui um comentário indicando onde a `proposal_url` deve ser atualizada no PostgreSQL após a geração bem-sucedida do PDF. Você precisará integrar seu cliente de banco de dados (ex: `pg` ou um ORM) aqui.

**Modificações nos arquivos Node.js:**
- **`src/routes/proposalRoutes.js`**: Novo arquivo contendo a lógica do endpoint de geração de proposta.
- **`src/app.js`**: Modificado para:
    - Importar `proposalRoutes`.
    - Usar `proposalRoutes` para o endpoint `/api`.
    - Configurar `express.static` para servir os PDFs gerados do diretório `generated_proposals`.

## 5. Estrutura de Arquivos e Pastas

A estrutura de pastas do seu `ecolote-backend` foi expandida para acomodar os novos componentes:

```
ecolote_backend_new/
├── generated_proposals/  # Novo: Onde os PDFs gerados serão salvos
├── sql/                  # Contém o script de atualização do schema
│   └── schema_update.sql
├── src/
│   ├── app.js            # Modificado: Integração das novas rotas e serving de estáticos
│   ├── routes/
│   │   ├── index.js
│   │   └── proposalRoutes.js # Novo: Rotas para geração de propostas
│   └── Utils/
│       ├── Leads/
│       │   └── googlePlacesFetch.py
│       │   └── README_backend_worker.md
│       └── Proposals/    # Novo: Contém o script Python de geração de PDF e assets
│           ├── generate_proposal.py
│           └── ecolote_logo.png
└── ... (outros arquivos do seu projeto Node.js)
```

## 6. Próximos Passos para Você

1.  **Aplicar o SQL**: Execute o script `sql/schema_update.sql` no seu banco de dados PostgreSQL.
2.  **Instalar Dependências Python**: Certifique-se de que `reportlab` e `psycopg2-binary` estão instalados no ambiente Python que seu Node.js usará para spawnar o script.
3.  **Integrar no Node.js**: No `src/routes/proposalRoutes.js`, você precisará adicionar a lógica para atualizar o campo `proposal_url` e `proposal_generated_at` no seu banco de dados PostgreSQL usando seu cliente de DB/ORM (onde há um comentário `// Aqui você atualizaria o PostgreSQL...`).
4.  **Integrar no Frontend**: O frontend precisará:
    - Chamar o novo endpoint `POST /api/leads/:leadId/generate-proposal` no backend, enviando os dados necessários para a proposta.
    - Receber a `pdfUrl` da resposta do backend e atualizar o estado do lead no frontend e no banco de dados.
    - Exibir um link para o PDF gerado no card do lead ou na página de detalhes.

Este pacote contém todas as modificações necessárias para que você possa dar continuidade à implementação da geração de propostas. Se tiver qualquer dúvida, estou à disposição!

