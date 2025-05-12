# Ecolote Backend

## Sumário

1.  [Descrição Curta](#descrição-curta)
2.  [Tecnologias Principais](#tecnologias-principais)
3.  [Pré-requisitos para Desenvolvimento](#pré-requisitos-para-desenvolvimento)
4.  [Instalação](#instalação)
5.  [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
6.  [Como Executar a Aplicação Localmente](#como-executar-a-aplicação-localmente)
7.  [Estrutura do Projeto](#estrutura-do-projeto)
8.  [Endpoints da API (Principais Rotas)](#endpoints-da-api-principais-rotas)
    *   [Administradores](#administradores)
    *   [Pessoas Físicas](#pessoas-físicas)
    *   [Pessoas Jurídicas](#pessoas-jurídicas)
    *   [Investidores](#investidores)
9.  [Testes](#testes)
10. [Licença](#licença)

---

## Descrição Curta

O Ecolote Backend é o servidor responsável por toda a lógica de negócios e persistência de dados para a aplicação Ecolote. Ele gerencia o cadastro e submissão de formulários de pessoas físicas, pessoas jurídicas e investidores, além de prover a autenticação e funcionalidades para os administradores da plataforma.

---

## Tecnologias Principais

*   **Node.js**: Ambiente de execução JavaScript server-side.
*   **Express.js**: Framework web minimalista e flexível para Node.js, utilizado para o roteamento da API e gerenciamento de middlewares.
*   **Supabase**: Plataforma BaaS (Backend as a Service) que oferece um banco de dados PostgreSQL, autenticação, armazenamento e APIs auto-geradas. Utilizado aqui primariamente como banco de dados.
*   **JSON Web Tokens (JWT)**: Padrão aberto (RFC 7519) para criar tokens de acesso que afirmam um certo número de "claims". Utilizado para autenticação segura de administradores.
*   **bcryptjs**: Biblioteca para hashing de senhas, garantindo que as senhas dos administradores sejam armazenadas de forma segura.
*   **dotenv**: Módulo que carrega variáveis de ambiente de um arquivo `.env` para `process.env`, facilitando a configuração da aplicação em diferentes ambientes.
*   **cors**: Middleware do Express para habilitar o Cross-Origin Resource Sharing, permitindo que o frontend (hospedado em um domínio diferente) acesse a API do backend.

---

## Pré-requisitos para Desenvolvimento

Antes de iniciar, certifique-se de ter os seguintes softwares instalados em sua máquina:

*   **Node.js**: Versão 18.x ou superior é recomendada. Você pode verificar sua versão com `node -v`.
*   **npm**: Gerenciador de pacotes do Node.js. Geralmente instalado junto com o Node.js. Verifique com `npm -v`.
*   **Conta Supabase**: Você precisará de um projeto Supabase ativo e configurado com as tabelas de banco de dados necessárias (ex: `administradores`, `pessoas_fisicas`, `pessoas_juridicas`, `investidores`).

---

## Instalação

Siga os passos abaixo para configurar o ambiente de desenvolvimento local:

1.  **Clone o Repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO_ECOLOTE_BACKEND>
    cd ecolote_backend
    ```

2.  **Instale as Dependências:**
    Execute o seguinte comando na raiz do projeto para instalar todas as dependências listadas no `package.json`:
    ```bash
    npm install
    ```

---

## Configuração de Variáveis de Ambiente

Este projeto utiliza variáveis de ambiente para configurar aspectos cruciais como a conexão com o banco de dados e segredos de autenticação. Crie um arquivo chamado `.env` na raiz do projeto e adicione as seguintes variáveis com seus respectivos valores:

```env
# Configurações do Supabase
SUPABASE_URL="SUA_URL_DO_PROJETO_SUPABASE"
SUPABASE_KEY="SUA_CHAVE_ANON_OU_SERVICE_ROLE_DO_SUPABASE"

# Configurações do JWT (JSON Web Token)
JWT_SECRET="SUA_CHAVE_SECRETA_FORTE_PARA_JWT"
JWT_EXPIRES_IN="1d" # Tempo de expiração do token (ex: 1d para 1 dia, 7d para 7 dias)

# Configurações do Servidor
PORT=3001 # Porta em que o servidor backend será executado
```

**Observações:**
*   Substitua os valores de exemplo (`SUA_URL_DO_PROJETO_SUPABASE`, etc.) pelos dados reais do seu projeto Supabase e uma chave secreta forte para `JWT_SECRET`.
*   A `SUPABASE_KEY` pode ser a chave `anon` (pública) se as políticas de RLS (Row Level Security) do Supabase estiverem devidamente configuradas para proteger seus dados. Para operações que exigem mais privilégios (como algumas operações de escrita diretas, se não forem feitas via funções de borda ou triggers), a chave `service_role` pode ser necessária, mas use-a com extrema cautela no backend, pois ela bypassa todas as políticas de RLS.

---

## Como Executar a Aplicação Localmente

Após a instalação das dependências e configuração do arquivo `.env`, você pode iniciar o servidor de desenvolvimento com o seguinte comando:

```bash
npm start
```

Se o script `start` não estiver definido no `package.json`, você pode executar diretamente:

```bash
node src/server.js
```

O servidor estará em execução na porta especificada na variável `PORT` (padrão: 3001). Você deverá ver uma mensagem no console indicando que o servidor foi iniciado com sucesso.

---

## Estrutura do Projeto

O projeto segue uma estrutura modular para organizar o código de forma clara e facilitar a manutenção:

```
ecolote_backend/
├── node_modules/         # Dependências do projeto (gerenciado pelo npm)
├── src/
│   ├── app.js            # Configuração principal da aplicação Express (middlewares, rotas)
│   ├── server.js         # Ponto de entrada: inicia o servidor HTTP
│   ├── config/
│   │   ├── environment.js  # (Pode ser usado para carregar/validar .env, se necessário)
│   │   └── supabaseClient.js # Cliente Supabase inicializado e exportado
│   ├── controllers/      # Lógica de negócio para cada rota
│   │   ├── adminController.js
│   │   ├── pessoaFisicaController.js
│   │   ├── pessoaJuridicaController.js
│   │   └── investidorController.js
│   ├── middlewares/      # Middlewares customizados
│   │   └── authMiddleware.js # Proteção de rotas autenticadas (JWT)
│   ├── routes/           # Definição dos endpoints da API
│   │   ├── adminRoutes.js
│   │   ├── pessoaFisicaRoutes.js
│   │   ├── pessoaJuridicaRoutes.js
│   │   ├── investidorRoutes.js
│   │   └── index.js        # Agrupa e exporta todas as rotas para o app.js
│   └── services/         # (Pasta vazia, reservada para integrações com serviços externos)
├── .env                  # Arquivo de variáveis de ambiente (NÃO versionar)
├── .gitignore            # Especifica arquivos e pastas ignorados pelo Git
├── package-lock.json     # Registra as versões exatas das dependências
└── package.json          # Metadados do projeto, dependências e scripts
```

*   **`src/config/`**: Contém arquivos de configuração, como a inicialização do cliente Supabase.
*   **`src/controllers/`**: Cada arquivo aqui é responsável pela lógica de manipulação das requisições para um conjunto específico de rotas (ex: `adminController.js` lida com todas as requisições relacionadas a administradores).
*   **`src/middlewares/`**: Contém middlewares que podem ser usados em várias rotas, como o `authMiddleware.js` que verifica a validade de um token JWT para proteger endpoints.
*   **`src/routes/`**: Define os endpoints da API. Cada arquivo de rota agrupa os endpoints para um recurso específico (ex: `adminRoutes.js`) e os associa às funções correspondentes nos controllers. O `index.js` nesta pasta geralmente serve para importar todas as rotas e exportá-las de forma organizada para serem usadas no `app.js`.
*   **`src/app.js`**: É o coração da aplicação Express. Aqui, middlewares globais (como `cors`, `express.json`) são configurados, e as rotas principais da API são montadas.
*   **`src/server.js`**: Responsável por iniciar o servidor HTTP, escutando na porta configurada.

---

## Endpoints da API (Principais Rotas)

A seguir, uma visão geral das principais rotas da API. Todas as rotas são prefixadas com `/api` (configurado em `src/app.js`).

### Administradores

Gerenciamento e autenticação de administradores.

*   **`POST /api/admin/register`**
    *   Descrição: Registra um novo administrador. Requer `nome_completo`, `email` (deve ser `@ecolote.com.br`) e `senha`.
    *   Acesso: Público (ou pode ser restrito no futuro).
*   **`POST /api/admin/login`**
    *   Descrição: Autentica um administrador existente. Requer `email` e `senha`.
    *   Retorna: Token JWT e informações do administrador em caso de sucesso.
    *   Acesso: Público.
*   **`POST /api/admin/request-password-reset`**
    *   Descrição: Verifica se um email de administrador existe para iniciar o processo de redefinição de senha. Requer `email`.
    *   Retorna: Confirmação se o email existe (atualmente não envia email de redefinição).
    *   Acesso: Público.
*   **`GET /api/admin/data/pessoas-fisicas`**
    *   Descrição: Retorna todos os dados de formulários de pessoas físicas.
    *   Acesso: Protegido (requer token JWT de administrador válido).
*   **`GET /api/admin/data/pessoas-juridicas`**
    *   Descrição: Retorna todos os dados de formulários de pessoas jurídicas.
    *   Acesso: Protegido (requer token JWT de administrador válido).
*   **`GET /api/admin/data/investidores`**
    *   Descrição: Retorna todos os dados de formulários de investidores.
    *   Acesso: Protegido (requer token JWT de administrador válido).

### Pessoas Físicas

Submissão de formulários de pessoas físicas.

*   **`POST /api/pessoas-fisicas`**
    *   Descrição: Recebe e armazena os dados do formulário de pessoa física.
    *   Corpo da Requisição: JSON com os campos do formulário.
    *   Acesso: Público.

### Pessoas Jurídicas

Submissão de formulários de pessoas jurídicas.

*   **`POST /api/pessoas-juridicas`**
    *   Descrição: Recebe e armazena os dados do formulário de pessoa jurídica.
    *   Corpo da Requisição: JSON com os campos do formulário.
    *   Acesso: Público.

### Investidores

Submissão de formulários de investidores.

*   **`POST /api/investidores`**
    *   Descrição: Recebe e armazena os dados do formulário de investidor.
    *   Corpo da Requisição: JSON com os campos do formulário.
    *   Acesso: Público.

---

## Testes

Atualmente, o projeto não possui scripts de teste automatizados configurados no `package.json`. Recomenda-se a implementação de testes unitários e de integração utilizando frameworks como Jest, Mocha ou Supertest para garantir a qualidade e a estabilidade do código.

---

## Licença

Este projeto está licenciado sob a Licença ISC. Consulte o arquivo `LICENSE` (se existir) ou o `package.json` para mais detalhes.

---

*Este README foi gerado com base na estrutura e funcionalidades observadas no projeto. Sinta-se à vontade para atualizá-lo e expandi-lo conforme o projeto evolui.*

