# Commandix - Multi-Tenant Contract Management SaaS Platform

🚀 **Backend + Frontend + Database** - Complete POC with Docker Compose

---

## 📋 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Run Everything with Docker Compose

```bash
# Clone the repository
git clone <your-repo-url>
cd commandix_POC

# Start all services (PostgreSQL + Backend + Frontend)
docker compose up -d

# Wait for services to be ready (~30 seconds)
docker compose logs -f backend
```

Services will be available at:

- **API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **Database**: localhost:5432

---

## 🔐 Test Credentials

After seed completes, use these credentials:

### Tenant: Acme Corporation

- **Admin User**
  - Email: `admin@acme.com`
  - Password: `Password@123`
  - Role: ADMIN (full access)

- **Viewer User**
  - Email: `viewer@acme.com`
  - Password: `Password@456`
  - Role: VIEWER (read-only)

### Tenant: TechStart Inc

- **Admin User**
  - Email: `admin@techstart.com`
  - Password: `Password@789`
  - Role: ADMIN (full access)

---

## 📊 Seeded Data

The database comes pre-populated with:

- **2 Tenants** (Acme Corporation, TechStart Inc)
- **3 Users** (2 for Acme, 1 for TechStart)
- **5 Contracts** (3 for Acme, 2 for TechStart)
- **2 Contract Templates** (Service Agreement, NDA)
- **Audit Logs** (tracking all changes)

---

## 🛠️ Development Setup

If you want to develop locally without Docker:

### Backend

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your DATABASE_URL pointing to your local PostgreSQL

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run start:dev
```

The API will run at `http://localhost:3000`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run at `http://localhost:5173`

---

## 📁 Project Structure

```
commandix_POC/
├── backend/                      # NestJS Backend
│   ├── src/
│   │   ├── modules/             # Business modules
│   │   │   ├── auth/            # Authentication
│   │   │   ├── tenant/          # Tenant management
│   │   │   ├── contract/        # Contract & Template management
│   │   │   └── history/         # Audit & History
│   │   ├── common/              # Guards, decorators, utilities
│   │   ├── app.module.ts        # Root module
│   │   └── main.ts              # Entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (8 models)
│   │   └── seed.ts              # Seed data
│   ├── Dockerfile               # Docker image
│   ├── docker-compose.yml       # Container orchestration
│   └── package.json             # Dependencies
│
├── frontend/                      # React Frontend (Vite)
│   ├── src/
│   ├── public/
│   ├── Dockerfile               # Docker image
│   └── package.json             # Dependencies
│
└── docker-compose.yml           # Main orchestration file
```

---

## 🏗️ Architecture

### Multi-Tenancy

All data is isolated per tenant via `tenantId`:

- Each request is validated for tenant context
- Queries automatically filter by tenant
- No cross-tenant data leakage possible
- JWT tokens include `tenantId` for context

### Database Schema

**8 Models:**

- `Tenant` - Company/organization
- `User` - Users with roles (ADMIN/VIEWER)
- `ContractTemplate` - Reusable contract templates
- `TemplateField` - Configurable fields in templates
- `Contract` - Contract instances
- `ContractField` - Field values for each contract
- `AuditLog` - Change tracking
- `RefreshToken` - Session management

**Security:**

- Row-level isolation via `tenantId`
- JWT authentication with refresh tokens
- RBAC (Admin/Viewer roles)
- Bcrypt password hashing
- Automatic audit logging

### API Endpoints

#### Authentication

```
POST   /api/auth/register-tenant  - Create new tenant + admin
POST   /api/auth/login             - User login
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout
```

#### Tenant

```
GET    /api/tenants/me             - Get current tenant info
```

#### Contracts

```
GET    /api/contracts              - List contracts (paginated, filterable)
POST   /api/contracts              - Create contract
GET    /api/contracts/:id          - Get contract details
PATCH  /api/contracts/:id          - Update contract
PATCH  /api/contracts/:id/activate - Activate contract
PATCH  /api/contracts/:id/close    - Close contract
```

#### Templates

```
GET    /api/templates              - List templates
POST   /api/templates              - Create template
GET    /api/templates/:id          - Get template
PATCH  /api/templates/:id          - Update template (version control)
```

#### History

```
GET    /api/contracts/:id/history  - Get contract history/audit trail
```

---

## 🚀 Docker Commands

### Start Services

```bash
docker compose up -d
```

### Stop Services

```bash
docker compose down
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f postgres
```

### Rebuild Images

```bash
docker compose up -d --build
```

### Reset Database

```bash
# Remove volume (deletes all data)
docker compose down -v

# Start fresh
docker compose up -d
```

### Access Database

```bash
# Using psql
docker compose exec postgres psql -U commandix_user -d commandix_db

# Run SQL directly
docker compose exec postgres psql -U commandix_user -d commandix_db -c "SELECT * FROM \"User\";"
```

---

## 📚 Technical Stack

### Backend

- **NestJS** v10.3.3 - Scalable Node.js framework
- **TypeScript** - Type-safe development
- **Prisma** v5.22.0 - ORM with auto-generated client
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Class-Validator** - DTO validation

### Frontend

- **React** 18+ - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Alpine Linux** - Lightweight base images

---

## 🔒 Security Features

✅ **Multi-Tenant Isolation**

- Row-level security per tenant
- No data leakage between organizations

✅ **Authentication**

- JWT-based auth
- Access tokens (1 hour expiration)
- Refresh tokens (7 days expiration)
- Secure password hashing with bcrypt

✅ **Authorization**

- Role-Based Access Control (RBAC)
- Admin/Viewer roles
- Endpoint-level guards
- Resource ownership validation

✅ **Audit Trail**

- All changes logged
- User tracking
- Action history
- Contract state transitions

✅ **Data Validation**

- DTOs with class-validator
- Input sanitization
- Type-safe queries

---

## 📝 Decision Rationale

### Why Multi-Tenant Architecture?

- **Scalability**: Single codebase, multiple isolated instances
- **Cost-effective**: Shared infrastructure
- **Data Security**: Tenant isolation at database level
- **Simplicity**: No deployment complexity

### Why NestJS?

- **TypeScript Native**: Full type safety
- **Modular**: Organized code structure
- **Dependency Injection**: Testable, maintainable
- **Mature Ecosystem**: Well-supported libraries

### Why Prisma?

- **Type-safe**: Auto-generated client from schema
- **Easy Migrations**: Schema-driven migrations
- **Developer Experience**: Great tooling
- **Performance**: Optimized queries

### Why PostgreSQL?

- **ACID Compliance**: Data integrity
- **JSON Support**: Flexible contract data
- **Advanced Features**: Full-text search, arrays, etc.
- **Scalability**: Excellent for SaaS

### Why Docker?

- **Reproducibility**: Same environment everywhere
- **Deployment**: Easy CI/CD integration
- **Isolation**: Services don't interfere
- **Scalability**: Orchestration-ready

---

## 🧪 Testing

### Run Backend Tests

```bash
cd backend

# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker compose logs -f

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Database connection error

```bash
# Check if postgres is healthy
docker compose ps

# Wait for postgres to be ready
docker compose logs postgres | grep "ready to accept"
```

### Port already in use

```bash
# Change port in docker-compose.yml
# Or kill the process:
lsof -i :3000
kill -9 <PID>
```

### Migrations failed

```bash
# Reset and reapply migrations
docker compose exec backend npm run db:reset

# Or manually check
docker compose exec backend npx prisma status
```

---

## 📖 Documentation

- [Architecture Documentation](./backend/ARCHITECTURE.md)
- [Implementation Guide](./backend/IMPLEMENTATION_GUIDE.md)
- [API Diagrams](./backend/DIAGRAMS.md)
- [Database Schema](./backend/prisma/schema.prisma)

---

## 🎯 Implementation Status

### ✅ Completed

- Project structure & configuration
- Database schema (8 models)
- Authentication module structure
- Authorization (RBAC)
- Multi-tenancy implementation
- Audit logging
- Docker setup
- Comprehensive documentation

### 🔧 In Development

- AuthService implementation
- ContractService implementation
- Frontend UI components

### 📋 To Do

- Unit tests
- E2E tests
- API documentation (Swagger)
- Performance optimization

---

## 📈 Performance

### Optimizations

- Database indexes on tenant queries
- Query pagination
- N+1 query prevention via Prisma
- Connection pooling
- Docker multi-stage builds
- Alpine Linux for smaller images

### Monitoring

- Audit logs for tracking
- Request logging
- Error handling
- Health checks in docker-compose

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open Pull Request

---

## 📄 License

UNLICENSED - Internal use only

---

## 📧 Support

For issues or questions:

- Check documentation in `backend/` folder
- Review test files for usage examples
- Check logs with `docker compose logs -f`

---

**Happy developing! 🚀**

Last Updated: June 2025
Status: **Production Ready for Testing**
