# Commandix — Backend

API NestJS para a plataforma de gestão de contratos multi-tenant Commandix.

## Stack

- **NestJS 10** + **TypeScript**
- **Prisma** — ORM com client gerado automaticamente
- **PostgreSQL** — banco de dados relacional
- **JWT** — access token (1h) + refresh token (7 dias)
- **Bcryptjs** — hash de senhas (10 salt rounds)
- **Class-Validator** — validação de DTOs
- **Jest** — testes unitários

## Quick Start

### Desenvolvimento local

```bash
cd backend
npm install

cp .env.example .env
# Editar .env com sua DATABASE_URL

npm run db:generate   # gera Prisma Client
npm run db:migrate    # aplica migrations
npm run db:seed       # popula dados de teste

npm run start:dev
# API: http://localhost:3000
```

### Via Docker Compose (raiz do projeto)

```bash
docker compose up -d
# API: http://localhost:3000
```

## Variáveis de ambiente

```env
DATABASE_URL=postgresql://user:password@localhost:5432/commandix_db

JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRATION=3600
JWT_REFRESH_EXPIRATION=604800s

API_PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Testes

```bash
npm test          # unitários
npm run test:cov  # com cobertura
npm run test:e2e  # e2e
```

## Credenciais de teste (após seed)

| Email | Senha | Role | Tenant |
|-------|-------|------|--------|
| `admin@user1.com` | `Password@123` | ADMIN | Acme Corporation |
| `viewer@user2.com` | `Password@456` | VIEWER | Acme Corporation |
| `admin@user3.com` | `Password@789` | ADMIN | TechStart Inc |

## Estrutura

```
src/
├── modules/
│   ├── auth/           # Autenticação, JWT, refresh token
│   │   └── dto/        # RegisterTenantDto, LoginDto, UserRole enum
│   ├── contract/       # CRUD de contratos e validação de campos
│   │   └── dto/        # ContractStatus enum, ContractListQueryDto
│   ├── history/        # Auditoria de alterações
│   │   └── dto/        # AuditAction enum
│   ├── template/       # Templates de contrato
│   └── tenant/         # Informações do tenant
├── common/
│   ├── constants/      # Constantes de domínio
│   │   ├── auth.constants.ts        # Senha, slug, bcrypt, expiração token
│   │   ├── pagination.constants.ts  # Limites de paginação
│   │   └── validation.constants.ts  # Regex e regras de validação
│   ├── decorators/     # @CurrentUser, @CurrentTenant, @Roles
│   ├── guards/         # JwtGuard, RolesGuard
│   ├── dto/            # PaginationDto, PaginatedResponseDto
│   └── prisma/         # PrismaService
├── app.module.ts
└── main.ts
```

## API Endpoints

### Autenticação

```
POST  /api/auth/register-tenant   Cria tenant + admin
POST  /api/auth/login             Login
POST  /api/auth/refresh           Renova access token
POST  /api/auth/logout            Logout
```

### Tenant

```
GET   /api/tenants/me             Info do tenant atual
```

### Templates

```
GET   /api/templates              Listar templates
POST  /api/templates              Criar template (ADMIN)
PUT   /api/templates/:id          Atualizar template (ADMIN)
```

### Contratos

```
GET   /api/contracts              Listar (paginado, filtros: status, data, busca)
POST  /api/contracts              Criar contrato
GET   /api/contracts/:id          Detalhe
PUT   /api/contracts/:id          Editar campos (ADMIN, apenas DRAFT)
PATCH /api/contracts/:id/activate Ativar: DRAFT → ACTIVE (ADMIN)
PATCH /api/contracts/:id/close    Encerrar: ACTIVE → CLOSED (ADMIN)
```

### Histórico

```
GET   /api/contracts/:id/history  Timeline de alterações (paginado)
```

## Ciclo de vida de um contrato

```
DRAFT → (ativar) → ACTIVE → (encerrar) → CLOSED
```

Toda transição de estado é registrada em `AuditLog` com usuário e timestamp.

## Multi-tenancy

- `tenantId` extraído do JWT em cada requisição via `@CurrentTenant()`
- Todas as queries filtram por `tenantId` — sem vazamento entre tenants
- Validação em múltiplas camadas: JWT → Guard → Service
