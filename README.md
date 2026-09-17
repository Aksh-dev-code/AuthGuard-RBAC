# AuthGuard-RBAC

A full-stack **Role-Based Access Control (RBAC)** application built with **React, Node.js, TypeScript Express, Prisma, and PostgreSQL**.

AuthGuard-RBAC allows administrators to manage users, roles, and permissions and control what users are allowed to access through role-based authorisation.

---

## Features

* User authentication
* JWT-based authorisation
* Password hashing with bcrypt
* Role-Based Access Control (RBAC)
* User management
* Role management
* Permission management
* Assign roles to users
* Assign permissions to roles
* Remove roles from users
* Remove permissions from roles
* Protected API routes
* React protected pages
* PostgreSQL database
* Prisma ORM
* REST API architecture

---

## Tech Stack

### Frontend

* React
* Vite
* Axios
* React Router
* CSS

### Backend

* Node.js
* TypeScript
* Express.js
* JWT
* bcryptjs
* Prisma ORM
* PostgreSQL

### Development Tools

* VS Code
* Insomnia / Postman
* Git & GitHub

---

## Project Architecture

```text
AuthGuard-RBAC/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   │
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Permissions.jsx
│   │   │   ├── Roles.jsx
│   │   │   └── Users.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   └── .env
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── roleController.js
│   │   ├── permissionController.js
│   │   └── assignController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── roleRoutes.js
│   │   ├── permissionRoutes.js
│   │   └── assignRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── permissionMiddleware.js
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── README.md
```

---

# RBAC Architecture

The application uses three main entities:

```text
User
  │
  │ has
  ▼
Role
  │
  │ has
  ▼
Permission
```

A user can have multiple roles.

A role can have multiple permissions.

This is implemented using two many-to-many relationship tables:

```text
User ───────< UserRole >─────── Role

Role ───────< RolePermission >─────── Permission
```

---

# Database Schema

## User

Stores application users.

```text
id
name
email
password
status
createdAt
updatedAt
```

User status can be:

```text
ACTIVE
INACTIVE
SUSPENDED
```

---

## Role

Stores roles such as:

```text
Admin
Manager
Editor
User
```

Each role can have multiple permissions.

---

## Permission

Stores individual permissions.

Examples:

```text
users:create
users:read
users:update
users:delete

roles:create
roles:read
roles:update
roles:delete
```

---

## UserRole

Connects users and roles.

```text
userId
roleId
```

A user can have multiple roles.

---

## RolePermission

Connects roles and permissions.

```text
roleId
permissionId
```

A role can have multiple permissions.

---

# Authentication Flow

The authentication flow works approximately like this:

```text
User
 │
 ▼
Login Page
 │
 ▼
POST /api/auth/login
 │
 ▼
Backend
 │
 ├── Find user
 ├── Compare password
 └── Generate JWT
 │
 ▼
JWT Token
 │
 ▼
Frontend
 │
 ▼
localStorage
 │
 ▼
Authorization: Bearer <token>
```

Protected API requests send the JWT in the `Authorization` header.

---

# Authorisation Flow

After authentication, the user's permissions are determined through their roles.

```text
User
 │
 ├── Role: Admin
 │       │
 │       ├── users:create
 │       ├── users:read
 │       ├── users:update
 │       └── users:delete
 │
 └── Role: Editor
         │
         ├── users:read
         └── users:update
```

The backend can then check whether the authenticated user has the required permission before allowing an operation.

---

# API Endpoints

## Authentication

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

---

# User APIs

Example:

```http
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

---

# Role APIs

Example:

```http
GET    /api/roles
POST   /api/roles
GET    /api/roles/:id
PUT    /api/roles/:id
DELETE /api/roles/:id
```

---

# Permission APIs

Example:

```http
GET    /api/permissions
POST   /api/permissions
GET    /api/permissions/:id
PUT    /api/permissions/:id
DELETE /api/permissions/:id
```

---

# Role Assignment APIs

## Assign Role to User

```http
POST /api/assign/role
```

Request:

```json
{
  "userId": 1,
  "roleId": 1
}
```

---

## Remove Role from User

```http
DELETE /api/assign/role
```

Request:

```json
{
  "userId": 1,
  "roleId": 1
}
```

---

# Permission Assignment APIs

## Assign Permission to Role

```http
POST /api/assign/permission
```

Request:

```json
{
  "roleId": 1,
  "permissionId": 2
}
```

---

## Remove Permission from Role

```http
DELETE /api/assign/permission
```

Request:

```json
{
  "roleId": 1,
  "permissionId": 2
}
```

---

# Environment Variables

## Backend

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/authguard_rbac"

JWT_SECRET="your-super-secret-jwt-key"

PORT=5000
```

Do not commit `.env` to GitHub.

Add:

```text
.env
```

to `.gitignore`.

---

## Frontend

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
```

After changing the Vite environment variables, restart the frontend development server.

---

# Installation

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd AuthGuard-RBAC
```

---

# Backend Setup

Go to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Configure:

```text
backend/.env
```

with your PostgreSQL connection string.

---

## Prisma Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

If your project uses an existing migration setup, run the migrations appropriate to that database.

---

## Seed Database

If a seed script is configured:

```bash
npx prisma db seed
```

This can create initial roles and permissions.

---

# Start Backend

If the project has a development script:

```bash
npm run dev
```

Otherwise:

```bash
npm start
```

The backend should run on:

```text
http://localhost:5000
```

---

# Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# Testing With Insomnia

You can test the backend independently from the React frontend.

Example:

```text
POST http://localhost:5000/api/auth/login
```

Then use:

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

After receiving a JWT, send it with protected requests:

```text
Authorization: Bearer <your-token>
```

---

# Example RBAC Setup

Create a role:

```text
Admin
```

Create permissions:

```text
users:create
users:read
users:update
users:delete

roles:create
roles:read
roles:update
roles:delete

permissions:create
permissions:read
permissions:update
permissions:delete
```

Assign permissions to Admin:

```text
Admin
 │
 ├── users:create
 ├── users:read
 ├── users:update
 ├── users:delete
 ├── roles:create
 ├── roles:read
 ├── roles:update
 ├── roles:delete
 ├── permissions:create
 ├── permissions:read
 ├── permissions:update
 └── permissions:delete
```

Then assign:

```text
Admin → User
```

The user can now perform operations allowed by the Admin role.

---

# Security

The project is designed around several security practices:

* Passwords are hashed using bcrypt.
* Authentication uses JWT.
* Protected endpoints require authentication.
* Authorisation is based on roles and permissions.
* Database relationships use foreign keys.
* Cascade deletion is configured for relationship tables.
* Environment variables are used for secrets and database credentials.

For production, additional protections should be added, including:

* Refresh-token rotation
* Rate limiting
* HTTP security headers
* Input validation
* Request sanitisation
* Secure cookies where appropriate
* Token expiration and revocation strategy
* Production database credentials
* HTTPS

---

# Future Improvements

Possible improvements include:

* Role and permission management UI
* User creation/editing from the dashboard
* Permission-based frontend rendering
* Dynamic sidebar based on permissions
* Search and pagination
* Audit logs
* Refresh tokens
* Password reset
* Email verification
* Account lockout
* Admin activity monitoring
* Docker deployment
* Automated testing
* CI/CD pipeline
* Production deployment

---

# Project Goal

The goal of **AuthGuard-RBAC** is to demonstrate how a real-world application can implement:

```text
Authentication
      ↓
JWT
      ↓
User
      ↓
Roles
      ↓
Permissions
      ↓
Protected Resources
```

It is designed as a practical full-stack project for understanding **authentication, authorisation, REST APIs, relational database design, Prisma ORM, and React frontend integration**.

---

# Author

**Aunska Maity**

B.Tech Computer Science & Engineering

GitHub: `github.com/Aksh-dev-code`

LinkedIn: `https://www.linkedin.com/in/akshmaity/`

---

# License

This project is available for educational and personal use.

