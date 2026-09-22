# AuthGuard-RBAC

A full-stack **Role-Based Access Control (RBAC)** system: JWT authentication, and
granular, database-driven permissions for Users, Roles, and Permissions —
built with React, Express, Prisma, and PostgreSQL.

**Live demo:** [https://auth-guard-rbac-ojxmkupw2-anuska-maity.vercel.app/]

---

## Features

- **Authentication** — register, login, JWT-based sessions, session revalidation on page load
- **Role-Based Access Control** — users are assigned one or more roles; roles are
  assigned one or more permissions, through explicit join tables (`UserRole`,
  `RolePermission`)
- **Admin dashboard** — live counts of users, roles, and permissions
- **User management** — list users, assign/remove roles, delete users
- **Role management** — create/edit/delete roles, assign permissions to a role
- **Permission management** — create/edit/delete permissions (`resource:ACTION` format,
  e.g. `users:CREATE`)
- **Defense in depth** — the UI hides actions a user lacks permission for, but every
  request is independently re-checked and enforced on the backend (a hidden button is
  not the security boundary — the API is)

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, React Router 7, Axios |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 (with `@prisma/adapter-pg` driver adapter) |
| Auth | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` password hashing |
| Deployment | Vercel (frontend as a static Vite build, backend as a serverless function) |

## Architecture

```
AuthGuard-RBAC/
├── backend/
│   ├── api/index.js          # Vercel serverless entry point
│   ├── prisma/
│   │   ├── schema.prisma     # User, Role, Permission, UserRole, RolePermission
│   │   ├── config.js         # PrismaClient instance (driver-adapter based)
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/      # auth, users, roles, permissions, assign
│   │   ├── middleware/       # authMiddleware (JWT), checkPermission (RBAC)
│   │   ├── routes/
│   │   └── config/seed.ts    # seeds default roles/permissions + admin user
│   └── server.js
└── frontend/
    ├── src/
    │   ├── api/client.js     # axios instance, JWT injection, 401 handling
    │   ├── context/AuthContext.jsx
    │   ├── components/       # Header, Sidebar/Layout, ProtectedRoute
    │   └── pages/             # Login, Register, Dashboard, Users, Roles, Permissions
    └── vite.config.js
```

### Data model

A user can hold multiple roles; a role can hold multiple permissions — modeled with
explicit join tables rather than an implicit many-to-many, so each relationship carries
its own identity and can be queried/managed directly:

```
User ──< UserRole >── Role ──< RolePermission >── Permission
```

## Getting started locally

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local, or a free cloud instance — [Neon](https://neon.tech) or
  [Supabase](https://supabase.com) both work well and give you a connection string in
  under 2 minutes)

### 1. Clone and install
```bash
git clone https://github.com/Aksh-dev-code/AuthGuard-RBAC.git
cd AuthGuard-RBAC
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

`backend/.env` (copy from `backend/.env.example`):
```env
DATABASE_URL="postgresql://user:password@host:5432/authguard_rbac?sslmode=require"
JWT_SECRET="a-long-random-string"
JWT_EXPIRES_IN="1d"
SEED_ADMIN_PASSWORD="choose-a-password"
PORT=5000
```

`frontend/.env` — not required for local dev (Vite proxies `/api` to `localhost:5000`
automatically, see `vite.config.js`). Only needed in production — see `.env.example`.

### 3. Set up the database
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```
This creates the schema and seeds:
- An `admin` role with every permission
- A default `user` role (no elevated permissions — assigned automatically on self-registration)
- An admin account: `admin134@gmail.com` / `SEED_ADMIN_PASSWORD` from your `.env`

### 4. Run it
```bash
# backend
cd backend && npm start        # http://localhost:5000

# frontend, in a second terminal
cd frontend && npm run dev     # http://localhost:5173
```

## API overview

All routes are mounted under `/api`.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account (default `user` role assigned) |
| POST | `/api/auth/login` | Log in, returns a JWT |
| GET | `/api/auth/me` | Current user (roles + permissions) |
| PUT | `/api/auth/me` | Update own profile |
| GET/POST/PUT/DELETE | `/api/users`, `/api/users/:id` | Manage users |
| GET/POST/PUT/DELETE | `/api/roles`, `/api/roles/:id` | Manage roles |
| GET/POST/PUT/DELETE | `/api/permission`, `/api/permission/:id` | Manage permissions |
| POST/DELETE | `/api/assign/user-role` | Assign/remove a role from a user |
| POST/DELETE | `/api/assign/role-permission` | Assign/remove a permission from a role |

Every route besides register/login requires a `Bearer <token>` header; role/permission/user
management routes additionally require the caller to hold the matching permission
(e.g. `roles:CREATE`) — admins bypass this check.

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full Vercel deployment guide (frontend +
backend as two separate Vercel projects, with a note on Prisma + serverless connection
pooling).

