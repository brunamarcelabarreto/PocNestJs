# Commandix — Multi-Tenant Contract Management SaaS Platform

Plataforma SaaS para gestão de contratos com suporte a multi-tenancy, templates configuráveis e auditoria completa de alterações.

---

## Quick Start

### Pré-requisitos

- Docker & Docker Compose
- Git

### Subir tudo com Docker Compose

```bash
git clone <your-repo-url>
cd PocNestJs

docker compose up -d

# Aguarde ~30s para os serviços iniciarem
docker compose logs -f backend
```

Serviços disponíveis:

| Serviço | URL |
|---------|-----|
| API | http://localhost:3000 |
| Frontend | http://localhost:5173 |
| PostgreSQL | localhost:5432 |

---

## Credenciais de teste

Após o seed completar:

| Email | Senha | Role | Tenant |
|-------|-------|------|--------|
| `admin@user1.com` | `Password@123` | ADMIN | Acme Corporation |
| `viewer@user2.com` | `Password@456` | VIEWER | Acme Corporation |
| `admin@user3.com` | `Password@789` | ADMIN | TechStart Inc |

---

## Dados pré-populados

- **2 Tenants** (Acme Corporation, TechStart Inc)
- **3 Usuários** (2 na Acme, 1 na TechStart)
- **2 Templates** (Service Agreement, NDA Template)
- **5 Contratos** (3 da Acme, 2 da TechStart — status variados)
- **Audit Logs** rastreando alterações

---

## Desenvolvimento local (sem Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env com sua DATABASE_URL

npm run db:generate
npm run db:migrate
npm run db:seed
npm run start:dev
# API: http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend: http://localhost:5173
```

---

## Testes

### Backend

```bash
cd backend
npm test            # unitários (46 testes)
npm run test:cov    # com cobertura
```

### Frontend

```bash
cd frontend
npm test -- --run   # execução única (56 testes)
```

---

## Estrutura do projeto

```
PocNestJs/
├── backend/                      # NestJS API
│   ├── src/
│   │   ├── modules/              # Auth, Contract, History, Template, Tenant
│   │   └── common/
│   │       ├── constants/        # auth, pagination, validation
│   │       ├── decorators/       # @CurrentUser, @CurrentTenant, @Roles
│   │       ├── guards/           # JwtGuard, RolesGuard
│   │       └── prisma/           # PrismaService
│   ├── prisma/
│   │   ├── schema.prisma         # Schema do banco (8 modelos)
│   │   └── seed.ts               # Dados de teste
│   └── Dockerfile
│
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── api/                  # HTTP clients
│   │   ├── constants/            # auth.ts, contracts.ts
│   │   ├── contexts/             # AuthContext
│   │   ├── pages/                # Login, Dashboard, Contracts, Templates
│   │   └── components/           # UI reutilizável
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## Arquitetura

```
┌──────────────────────────────────────┐
│           React Frontend             │
│  (Vite, TypeScript, shadcn/ui)       │
└─────────────────┬────────────────────┘
                  │ REST API
                  ↓
┌──────────────────────────────────────┐
│           NestJS Backend             │
│  Controllers → Services → Guards     │
│  (Auth, Contract, Template, History) │
│              Prisma ORM              │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│           PostgreSQL                 │
│  Multi-tenant via tenantId           │
└──────────────────────────────────────┘
```

---

## API Endpoints

### Autenticação

```
POST  /api/auth/register-tenant   Cria tenant + admin
POST  /api/auth/login             Login
POST  /api/auth/refresh           Renova access token
POST  /api/auth/logout            Logout
```

### Contratos

```
GET   /api/contracts              Listar (paginado, filtros)
POST  /api/contracts              Criar
GET   /api/contracts/:id          Detalhe
PUT   /api/contracts/:id          Editar (ADMIN)
PATCH /api/contracts/:id/activate Ativar (ADMIN)
PATCH /api/contracts/:id/close    Encerrar (ADMIN)
GET   /api/contracts/:id/history  Histórico de auditoria
```

### Templates

```
GET   /api/templates              Listar
POST  /api/templates              Criar (ADMIN)
PUT   /api/templates/:id          Atualizar (ADMIN)
```

---

## Stack técnica

### Backend
- NestJS 10 · TypeScript · Prisma 5 · PostgreSQL · JWT · Bcryptjs · Class-Validator · Jest

### Frontend
- React 18 · Vite · TypeScript · React Router v6 · Axios · Tailwind CSS · shadcn/ui · Zod · Vitest

### Infraestrutura
- Docker · Docker Compose · Alpine Linux

---

## Segurança

- **Multi-tenancy**: isolamento de dados via `tenantId` em todas as queries
- **Autenticação**: JWT access token (1h) + refresh token (7 dias)
- **Autorização**: RBAC Admin/Viewer com guards por endpoint
- **Senhas**: bcrypt com 10 salt rounds
- **Auditoria**: todas as alterações registradas em `AuditLog`

---

## Docker — comandos úteis

```bash
# Subir
docker compose up -d

# Parar
docker compose down

# Logs
docker compose logs -f backend

# Rebuild
docker compose up -d --build

# Reset completo do banco
docker compose down -v && docker compose up -d

# Acesso ao banco
docker compose exec postgres psql -U commandix_user -d commandix_db
```

---

## Documentação adicional

- [Backend README](./backend/README.md) — endpoints, estrutura, variáveis de ambiente
- [Frontend README](./frontend/README.md) — páginas, fluxo de autenticação, estrutura
- [Schema do banco](./backend/prisma/schema.prisma)

---

**Last Updated:** Junho 2026
**Status:** Produção-ready para testes
