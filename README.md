# AuthGuard-RBAC — School Attendance System

A full-stack **Role-Based Access Control (RBAC)** system, purpose-built for school
attendance management: JWT authentication, and granular, database-driven permissions
across four roles — Student, Teacher, Principal, and Super Admin — built with React,
Express, Prisma, and PostgreSQL.

**Live demo:** [https://auth-guard-rbac.vercel.app]

---

## Roles

| Role | Icon | What they can do |
|---|---|---|
| **Student** | 👨‍🎓 | View their own attendance record |
| **Teacher** | 👨‍🏫 | Mark attendance and view attendance for their assigned students only |
| **Principal** | 👨‍💼 | View everyone's attendance; assign/manage teachers and their student rosters |
| **Super Admin** | 🛡️ | Manage the entire system — users, roles, permissions, teacher-student assignments, and all attendance |

Every role is enforced **both** in the UI (actions are hidden if you lack permission) and
independently on the backend (every request is re-checked server-side) — a hidden button
is never the real security boundary.

## Features

- **Authentication** — register, login, JWT-based sessions, session revalidation on page load
- **Role-Based Access Control** — users hold one or more roles; roles hold one or more
  permissions, through explicit join tables (`UserRole`, `RolePermission`)
- **Scoped attendance access** — beyond simple role checks, a dedicated scope-resolution
  layer determines *which rows* a caller may see: their own (student), their assigned
  students' (teacher), or everyone's (principal/super admin)
- **Attendance tracking** — mark Present/Absent/Late per student per day; one record per
  student per date (re-marking updates it rather than duplicating)
- **Teacher-student assignment** — principals/admins link teachers to the specific
  students they teach, which is what "assigned students" actually means under the hood
- **Admin console** — manage Users, Roles, and Permissions with full CRUD
- **Defense in depth** — UI hides actions a user lacks permission for; the API
  independently enforces every request regardless of what the UI shows

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
│   ├── api/index.js            # Vercel serverless entry point
│   ├── prisma/
│   │   ├── schema.prisma       # User, Role, Permission, UserRole, RolePermission,
│   │   │                       # Attendance, TeacherStudent
│   │   ├── config.js           # PrismaClient instance (driver-adapter based)
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/        # auth, users, roles, permissions, assign,
│   │   │                       # attendance, teacherAssignment
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # verifies JWT, loads user + roles + permissions
│   │   │   ├── checkPermission.js    # coarse-grained: "does this role have permission X"
│   │   │   └── attendanceScope.js    # fine-grained: "which rows may this caller see"
│   │   ├── routes/
│   │   └── config/seed.ts      # seeds roles, permissions, and the super admin account
│   └── server.js
└── frontend/
    ├── src/
    │   ├── api/client.js       # axios instance, JWT injection, 401 handling
    │   ├── context/AuthContext.jsx   # hasRole() / hasPermission() helpers
    │   ├── components/         # Header, Sidebar (permission-gated nav), ProtectedRoute
    │   └── pages/
    │       ├── Login.jsx, Register.jsx, Dashboard.jsx
    │       ├── Users.jsx, Roles.jsx, Permissions.jsx      # admin console
    │       ├── Attendance.jsx                              # role-adaptive: student/
    │       │                                                # teacher/principal/admin view
    │       └── TeacherAssignments.jsx                       # link teachers to students
    └── vite.config.js
```

### Data model

```
User ──< UserRole >── Role ──< RolePermission >── Permission

User ──< Attendance >── User        (student, and separately, who marked it)
User ──< TeacherStudent >── User    (teacher <-> student assignment)
```

A user can hold multiple roles; a role can hold multiple permissions, modeled with
explicit join tables rather than an implicit many-to-many so each relationship can be
queried and managed directly. `TeacherStudent` is what gives "assigned students" concrete
meaning — without it there'd be nothing to scope a teacher's access against.

### Permission reference

| Permission | Who has it by default |
|---|---|
| `attendance:CREATE` | teacher, super_admin |
| `attendance:READ` | principal, super_admin |
| `attendance:READ_OWN` | student |
| `attendance:READ_ASSIGNED` | teacher |
| `students:READ` | teacher, principal, super_admin |
| `teachers:MANAGE` | principal, super_admin |
| `users:*`, `roles:*`, `permissions:*` | super_admin (principal gets `users:READ` only) |

## Getting started locally

### Prerequisites
- Node.js 18+
- A PostgreSQL database — a free [Neon](https://neon.tech) or
  [Supabase](https://supabase.com) instance works well and gives you a ready-to-use
  connection string in under 2 minutes

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
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="a-long-random-string"
JWT_EXPIRES_IN="1d"
SEED_ADMIN_PASSWORD="choose-a-password"
PORT=5000
```

`frontend/.env` — not required for local dev (Vite proxies `/api` to `localhost:5000`
automatically). Only needed in production — see `.env.example`.

### 3. Set up the database
```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```
This creates the schema and seeds:
- Four roles: `super_admin` (every permission), `principal`, `teacher`, `student`, each
  with the permission set listed above
- A super admin account: `admin134@gmail.com` / `SEED_ADMIN_PASSWORD` from your `.env`

New self-registered accounts default to the `student` role.

### 4. Run it
```bash
# backend
cd backend && npm start        # http://localhost:5000

# frontend, in a second terminal
cd frontend && npm run dev     # http://localhost:5173
```

### 5. Try the different roles

Log in as `admin134@gmail.com` and, from **Users**, assign yourself (or test accounts you
register) the `teacher` or `principal` role to see how the UI and available data change.
From **Teacher Assignments**, link a teacher to a student so that teacher can mark and
view that student's attendance.

## API overview

All routes are mounted under `/api`. Every route besides register/login requires a
`Bearer <token>` header.

| Method | Route | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Create an account (default `student` role) | Public |
| POST | `/api/auth/login` | Log in, returns a JWT | Public |
| GET | `/api/auth/me` | Current user (roles + permissions) | Authenticated |
| PUT | `/api/auth/me` | Update own profile | Authenticated |
| GET | `/api/attendance` | List attendance, auto-scoped to caller's role | Authenticated |
| POST | `/api/attendance` | Mark/update one student's attendance for a date | `attendance:CREATE` |
| GET/POST/DELETE | `/api/teachers/:teacherId/students` | View/assign/remove a teacher's students | `teachers:MANAGE` |
| GET/POST/PUT/DELETE | `/api/users`, `/api/users/:id` | Manage users | `users:*` |
| GET/POST/PUT/DELETE | `/api/roles`, `/api/roles/:id` | Manage roles | `roles:*` |
| GET/POST/PUT/DELETE | `/api/permission`, `/api/permission/:id` | Manage permissions | `permissions:*` |
| POST/DELETE | `/api/assign/user-role` | Assign/remove a role from a user | `users:UPDATE` |
| POST/DELETE | `/api/assign/role-permission` | Assign/remove a permission from a role | `roles:UPDATE` |

Role/permission/user management routes require the caller to hold the matching
permission — `super_admin` bypasses per-permission checks entirely.

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full Vercel deployment guide (frontend +
backend as two separate Vercel projects, with a note on Prisma + serverless connection
pooling).

## License

[Add your license here — e.g. MIT]