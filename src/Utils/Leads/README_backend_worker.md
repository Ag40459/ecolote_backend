
# Google Places **Python Worker** Integration

Guia passo‑a‑passo para incorporar o **\`google_places_fetch.py\`** ao projeto
**\`ecolote_backend\`** (Node + Express), consumindo o script como _worker_ via
\`child_process\` e recebendo JSON pelo **stdout**.

---

## 📑 Sumário

- [Visão Geral](#visão-geral)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Pré‑requisitos](#pré-requisitos)
- [Instalação](#instalação)
  - [Dependências Node](#dependências-node)
  - [Dependências Python](#dependências-python)
- [Configuração](#configuração)
- [Implementação no Backend](#implementação-no-backend)
  - [Endpoint \`POST /leads/fetch-more\`](#endpoint-post-leadsfetch-more)
  - [Controller (\`src/controllers/fetchMore.js\`)](#controller-srccontrollersfetchmorejs)
  - [Serviço de Worker (\`src/workers/placesWorker.js\`)](#serviço-de-worker-srcworkersplacesworkerjs)
- [Caminhos de Saída](#caminhos-de-saída)
- [Execução Local](#execução-local)
- [Execução via Docker (Opcional)](#execução-via-docker-opcional)
- [Boas Práticas](#boas-práticas)
- [Licença](#licença)

---

## Visão Geral

> _“Buscar mais leads quando o front detectar que não há dados suficientes.”_

1. **Front‑end** dispara \`POST /leads/fetch-more\` com \`{{ term: "hotel" }}\`.  
2. **Backend** cria um processo Python (\`google_places_fetch.py --term hotel --json\`).  
3. Script devolve JSON no **stdout**; Node lê, filtra duplicados no Supabase
   grava novos registros e registra quantos foram duplicados(de forma organizada para medir a eficiencia da api de busca de lead).  
4. Backend responde ao front com a quantidade inserida.  

---

## Estrutura de Pastas

```
Defina a melhor forma baseado na sua analise do projeto de backend completo
```

- **\`lists/\`** substitui a pasta “Listas” ( aqui era onde erão salvos os arquivos completos que vinham da busca no script pelo pydroid, adaptar para o modelo com banco de dados que ja usamos no projeto).  
- **\`backup/\`** O mesmo da situação acima, porem gravava os backup para se o codigo quebrar ele retornar de onde parou.

---

## Pré‑requisitos

| Tecnologia | Versão |
|------------|--------|
| Node.js    | ≥ 18   |
| Python     | ≥ 3.9  |
| Supabase   | Tabela \`leads\` configurada (\`place_id\` UNIQUE) |

OU  auqe você julgar se a mlehor par ao cenario atual

---

## Instalação

### Dependências Node

```bash
cd ecolote_backend
npm i python-shell dotenv
```

> Se preferir baixa dependência, pode usar \`child_process.spawn\` nativo.

### Dependências Python

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install requests pandas tqdm python-dotenv
```

---

## Configuração

1. **Crie** \`python/.env\` com  

   \`\`\`
   GOOGLE_API_KEY=SUA_CHAVE_GOOGLE
   \`\`\`

2. **Edite** variáveis no topo do \`google_places_fetch.py\`
   (\`SEARCH_TERMS\`, \`LOCATION\`, etc.) se quiser defaults diferentes.

---

## Implementação no Backend

### Endpoint \`POST /leads/fetch-more\`

```js
// src/routes/index.js
import express from 'express';
import { fetchMore } from '../controllers/fetchMore.js';
const router = express.Router();

router.post('/leads/fetch-more', fetchMore);
export default router;
```

### Controller (\`src/controllers/fetchMore.js\`)

```js
import { runPlacesWorker } from '../workers/placesWorker.js';
import { supabase } from '../services/supabase.js';

export async function fetchMore(req, res) {
  const { term } = req.body;
  if (!term) return res.status(400).json({ error: 'term is required' });

  try {
    const places = await runPlacesWorker(term);

    // 1. verifica duplicados
    const ids = places.map(p => p.place_id);
    const { data: existing } = await supabase
      .from('leads')
      .select('place_id')
      .in('place_id', ids);

    const newRows = places.filter(
      p => !existing?.some(e => e.place_id === p.place_id)
    );

    // 2. insere novos
    if (newRows.length) {
      await supabase.from('leads').insert(newRows);
    }

    return res.json({ inserted: newRows.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'worker failed' });
  }
}
```

### Serviço de Worker (\`src/workers/placesWorker.js\`)

```js
import path from 'node:path';
import { spawn } from 'node:child_process';

export function runPlacesWorker(term) {
  return new Promise((resolve, reject) => {
    const pyPath = path.resolve('python/google_places_fetch.py');
    const proc = spawn('python', [pyPath, '--term', term, '--json'], {
      cwd: path.dirname(pyPath),
      env: { ...process.env }, // inclui GOOGLE_API_KEY
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => (stdout += chunk));
    proc.stderr.on('data', chunk => (stderr += chunk));

    proc.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`Python exited ${code}\\n${stderr}`));
      }
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch {
        reject(new Error('Invalid JSON from worker'));
      }
    });
  });
}
```

---

## Caminhos de Saída

- **\`data/lists/\`** – O próprio script grava o CSV aqui, nomeado  
  \`resultados_YYYYMMDD_HHMMSS.csv\`.  
- **\`data/backup/\`** – Se desejar, acrescente no final do Python:

  ```python
  import shutil, datetime, pathlib
  dst = pathlib.Path(__file__).resolve().parents[1] / 'data' / 'backup'
  dst.mkdir(parents=True, exist_ok=True)
  shutil.make_archive(dst / f"backup_{datetime.date.today()}", "zip", OUT_DIR)
  ```

- O backend usa apenas o **stdout JSON**; salvar arquivos é opcional para auditoria.

---

## Execução Local

```bash
# Terminal 1 – backend
npm start

# Terminal 2 – front (opcional)
npm run dev
```

Dispare via `curl` ou Postman:

```bash
curl -X POST http://localhost:3000/leads/fetch-more \
  -H "Content-Type: application/json" \
  -d '{"term":"hotel"}'
```

---

## Execução via Docker (Opcional)

```Dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci
RUN apk add --no-cache python3 py3-pip
RUN pip install --no-cache-dir -r python/requirements.txt
CMD ["npm","start"]
```

---

## Boas Práticas

| Tema | Dica |
|------|------|
| **Rate‑limit** | `express-rate-limit` no endpoint para evitar spam |
| **Fila** | Use `bullmq` + Redis se múltiplos termos simultâneos forem comuns |
| **Observabilidade** | Logar stdout/stderr do worker para debugar quota da API |
| **Créditos Google** | Exibir “Image © Google” nas fotos mostradas pelo front |

---

## Licença

MIT — use à vontade, **sem garantias**.

> Gerado em **2025-06-27**
