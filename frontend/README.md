# Commandix — Frontend

Interface React para a plataforma de gestão de contratos multi-tenant Commandix.

## Stack

- **React 18** + **TypeScript**
- **Vite** — build e dev server
- **React Router v6** — navegação
- **Axios** — HTTP client com interceptors de refresh token
- **Tailwind CSS** + **shadcn/ui** — estilização
- **Zod** — validação de formulários
- **Vitest** + **Testing Library** — testes unitários

## Como rodar localmente

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

> Requer o backend rodando em `http://localhost:3000` ou configure `VITE_API_URL` no `.env`.

## Variáveis de ambiente

```env
VITE_API_URL=http://localhost:3000
```

## Testes

```bash
npm test          # modo watch
npm test -- --run # execução única
```

## Build

```bash
npm run build
npm run preview
```

## Estrutura

```
src/
├── api/              # Clientes HTTP (auth, contracts, templates)
├── components/       # Componentes reutilizáveis (modais, dialogs)
│   └── ui/           # Primitivos shadcn/ui
├── constants/        # Constantes de domínio e configuração
│   ├── auth.ts       # STORAGE_KEYS, AUTH_EVENT, USER_ROLE, API_AUTH_PATH
│   └── contracts.ts  # STATUS_LABEL, ACTION_LABEL, limites de paginação, LOCALE
├── contexts/
│   └── AuthContext   # Autenticação global (user, login, logout)
├── lib/              # Validações Zod
├── pages/            # Páginas da aplicação
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── ContractList.tsx
│   ├── ContractDetail.tsx
│   └── TemplateConfig.tsx
└── types/            # Tipos TypeScript compartilhados
```

## Páginas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/login` | Público | Login com email e senha |
| `/register` | Público | Cadastro de novo tenant + admin |
| `/` | Autenticado | Dashboard com estatísticas |
| `/contracts` | Autenticado | Lista de contratos com filtros |
| `/contracts/:id` | Autenticado | Detalhe, ativação e encerramento |
| `/templates` | ADMIN | Configuração de templates de contrato |

## Fluxo de autenticação

O `client.ts` gerencia refresh token automaticamente:

1. Requisição falha com `401`
2. Interceptor tenta renovar via `POST /api/auth/refresh`
3. Sucesso: reprocessa a fila de requisições com novo token
4. Falha: dispara evento `auth:logout` → `AuthContext` redireciona para `/login`
