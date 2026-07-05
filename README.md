# Zela+

Sistema de acompanhamento de manutenção escolar da rede municipal de Caraguatatuba. Escolas registram ocorrências de manutenção (elétrica, hidráulica, estrutural etc.), a SEDUC acompanha e prioriza as demandas, e uma página pública mostra indicadores agregados de progresso para a comunidade.

## Linguagens e tecnologias

**Backend**
- Node.js (ES Modules) + [Express](https://expressjs.com/)
- [Prisma ORM](https://www.prisma.io/) + MySQL
- Autenticação com JWT (`jsonwebtoken`) e hash de senha com `bcryptjs`
- Upload de arquivos com `multer`
- Validação de payloads com `zod`

**Frontend**
- React 19 + [Vite](https://vitejs.dev/)
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Roteamento próprio via hash (sem react-router)
- [Leaflet](https://leafletjs.com/) / `react-leaflet` + `leaflet.heat` para o mapa de calor
- `react-easy-crop` para recorte de imagens
- `jspdf` para exportação de relatórios em PDF

## Estrutura do projeto

```
IFSPExceptions/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # modelos: Escola, User, Ocorrencia, Interacao, LogAuditoria, Notificacao, Comodo
│   │   ├── migrations/
│   │   ├── seed.js                # popula escolas + usuários de teste + ocorrências de exemplo
│   │   └── seeds/                 # dados-fonte da SEDUC usados pelo seed.js
│   │       ├── unidades_seduc_caraguatatuba.json          # escolas (nome, endereço, cômodos cadastrados...)
│   │       ├── ocorrencias_seduc_caraguatatuba_seed.json  # ocorrências de exemplo
│   │       └── scripts/           # scripts auxiliares de geração/normalização desses JSONs
│   ├── uploads/                    # fotos enviadas nas ocorrências (multer) — gerado em runtime, git-ignored
│   └── src/
│       ├── server.js               # ponto de entrada (sobe o Express)
│       ├── app.js                  # configuração do app (cors, json, rotas)
│       ├── config/                 # env.js, upload.js
│       ├── routes/                 # um arquivo de rotas por recurso
│       ├── controllers/            # um controller por recurso (Auth, Escola, Ocorrencia, User, Mapa, Notificacao, Auditoria)
│       ├── models/                 # acesso a dados via Prisma, por recurso
│       ├── middlewares/             # auth (JWT) e tratamento de erros
│       └── utils/                  # AppError, asyncHandler, jwt, validate
│
└── frontend/
    ├── public/
    │   ├── geo/                    # GeoJSON de bairros e do limite do município (usados no mapa de calor)
    │   ├── logo_fundo_branco.svg, logo_fundo_escuro.svg, icon_fundo_branco.svg
    │   └── school-exterior.png, school-courtyard.png, school-corridor.png, 1-13.jpg  # fotos da Landing
    └── src/
        ├── main.jsx / App.jsx      # bootstrap e roteador por hash (define quem vê o quê por role)
        ├── auth/                   # sessão do usuário (token/local storage)
        ├── components/             # componentes reutilizáveis (Layout, Sidebar, Select, Modal, etc.)
        ├── pages/                  # uma página por rota (Dashboard, Ocorrencias, Escolas, Mapa, AdminPages, Landing...)
        ├── services/                # api.js (client HTTP) e mapa.js (dados do mapa de calor)
        ├── seeds/                  # dados mock usados como fallback no frontend quando a API não responde
        └── utils/                  # formatação, métricas, geo de bairros, etc.
```

> Os JSONs de escolas/ocorrências da SEDUC vivem em `backend/prisma/seeds/` (fonte usada pelo `seed.js`). O `frontend/src/seeds/` é independente: dados mock usados só como fallback local do frontend.

## Papéis de usuário

| Role | Acesso |
| --- | --- |
| `SEDUC` | Acesso total: dashboard geral, todas as escolas/ocorrências, usuários, auditoria, categorias |
| `DIRETOR` | Vinculado a uma escola: dashboard e ocorrências apenas da própria escola |
| `EXTERNO` | Cria e acompanha apenas as próprias ocorrências |

---

## Como rodar o backend

O backend é a parte mais trabalhosa de configurar porque depende de um banco MySQL rodando e de variáveis de ambiente.

### 1. Pré-requisito: MySQL rodando localmente

Você precisa de um servidor MySQL acessível (local via XAMPP/MySQL Community/Docker, etc.) e um banco de dados criado (ex.: `zela`) — se o banco ainda não existir, o Prisma pode criá-lo para você no passo do `db push`.

### 2. Configure o `.env`

Dentro de `backend/`, copie o exemplo e preencha os valores:

```bash
cd backend
cp .env.example .env
```

Abra o `.env` gerado e ajuste:

```env
# String de conexão do MySQL: mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
DATABASE_URL="mysql://root:sua_senha@localhost:3306/zela"

# Porta da API (opcional, padrão 3333)
PORT=3333

# URL onde o frontend roda (usada pelo CORS)
FRONTEND_ORIGIN="http://localhost:5173"

# Segredo do JWT — obrigatório, o servidor não sobe sem isso.
# Gere um valor aleatório, por exemplo com: openssl rand -hex 32
JWT_SECRET="cole_aqui_uma_string_aleatoria_e_longa"

# Validade do token (opcional, padrão 8h)
JWT_EXPIRES_IN="8h"
```

### 3. Instale as dependências

```bash
npm i
```

### 4. Gere o Prisma Client

```bash
npx prisma generate
```

### 5. Sincronize o schema com o banco

```bash
npx prisma db push
```

Isso cria (ou atualiza) as tabelas no MySQL de acordo com `prisma/schema.prisma`, sem precisar gerenciar migrations manualmente.

### 6. Popule o banco com dados de exemplo

```bash
npm run prisma:seed
```

Isso carrega as escolas reais da SEDUC (`frontend/public/geo/unidades_seduc_caraguatatuba.json`) e cria os usuários de teste abaixo — um por papel (o seed também cria vários outros usuários `EXTERNO`, um por escola, todos com a mesma senha):

| Papel | Email | Senha |
| --- | --- | --- |
| SEDUC | `seduc@escola.gov.br` | `123456` |
| Diretor(a) | `diretor@escola.gov.br` | `123456` |
| Externo | `externo@escola.gov.br` | `123456` |

### 7. Suba o servidor

```bash
npm run dev
```

A API sobe em `http://localhost:3333` (ou na porta definida em `PORT`), com hot-reload via `node --watch`.

---

## Como rodar o frontend

```bash
cd frontend
npm i
npm run dev
```

O Vite sobe em `http://localhost:5173` e já tem proxy configurado para `/api` → `http://localhost:3333` (veja `frontend/vite.config.js`), então não é preciso configurar CORS manualmente para o dia a dia de desenvolvimento.

> Rode o backend antes (ou em paralelo) — o frontend depende da API para carregar escolas, ocorrências, usuários, etc.

---

## Scripts disponíveis

**Backend** (`backend/package.json`)
| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe a API com hot-reload (`node --watch`) |
| `npm start` | Roda `prisma migrate deploy` e sobe a API (uso em produção) |
| `npm run prisma:seed` | Popula o banco com escolas + usuários de teste |

**Frontend** (`frontend/package.json`)
| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe o Vite em modo desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Sobe um servidor local servindo o build de produção |
