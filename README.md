# Multi-Tenant SaaS Backend

A production-grade multi-tenant SaaS backend that simulates how modern software-as-a-service platforms operate — allowing multiple independent organizations to use a single application instance while keeping their data securely isolated.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Multi-Tenancy](#multi-tenancy)
- [Role-Based Access Control](#role-based-access-control)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)

---

## Overview

This backend powers a SaaS platform where multiple organizations (tenants) can register, manage their users, and operate in fully isolated environments. Each user belongs to a single tenant and is assigned a role that governs what they can do within the system.

Key capabilities:

- Secure JWT-based authentication with refresh token rotation
- Per-tenant data isolation enforced at the query level via middleware
- Role-based access control (Admin / Manager / Member)
- Audit logging for tracking user actions within each tenant
- Pagination and filtering for production-ready data querying
- Zod-powered request validation on all endpoints
- Security hardening with Helmet and rate limiting
- Full test suite — unit and integration tests with Vitest

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript (strict mode) |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Authentication | JWT (access + refresh tokens) |
| Validation | Zod |
| Dev Server | tsx |
| Testing | Vitest + Supertest |
| Session Store | PostgreSQL (Redis-ready) |

---

## Architecture

The system follows a layered architecture with clear separation of concerns:

```
Request → Route → Middleware → Controller → Service → Prisma → PostgreSQL
```

- **Routes** — Define API endpoints and attach middleware chains
- **Middleware** — Handle JWT verification, RBAC, request validation
- **Controllers** — Parse requests, call services, send responses
- **Services** — Contain all business logic and database queries
- **Validators** — Zod schemas that validate request body and query params

---

## Project Structure

```
prisma/
├── schema.prisma           # Database schema and models
└── migrations/             # Auto-generated migration files

src/
├── __tests__/
│   ├── unit/
│   │   └── auth.service.test.ts
│   └── integration/
│       ├── auth.routes.test.ts
│       └── users.routes.test.ts
├── controllers/
│   ├── auth.controllers.ts
│   ├── users.controllers.ts
│   └── tenants.controllers.ts
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   └── AppError.ts         # Custom error class
├── middleware/
│   ├── auth.middleware.ts       # JWT verification
│   ├── rbac.middleware.ts       # Role-based access control
│   ├── error.middleware.ts      # Global error handler
│   └── req-validator.middleware.ts  # Zod validation factory
├── routes/
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   └── tenants.routes.ts
├── service/
│   ├── auth.service.ts
│   ├── users.service.ts
│   ├── tenants.service.ts
│   └── audit.service.ts
├── types/
│   └── index.ts            # Express type augmentations
├── utils/
│   └── envVarsVerifier.ts  # Environment variable guard
├── validators/
│   ├── auth.validator.ts
│   ├── users.validator.ts
│   └── tenants.validator.ts
├── app.ts                  # Express app configuration
└── server.ts               # Server entry point

prisma.config.ts            # Prisma 7 configuration
```

---

## Database Schema

The database has four core models:

### Tenant
Represents an organization on the platform. Each tenant has a unique `slug` used for identification (e.g. `acme-corp`).

### User
Belongs to a tenant. The same email can exist across different tenants but not within the same tenant — enforced via a composite unique constraint `@@unique([email, tenantId])`. Passwords are hashed with bcrypt.

### RefreshToken
Stores hashed refresh tokens per user and tenant to manage session lifecycle. Designed to be swappable with Redis with no service-layer changes.

### AuditLog
Records every significant user action within a tenant — login, role updates, deletions — including the action type, affected entity, and optional JSON metadata.

### Role Enum
```
ADMIN | MANAGER | MEMBER
```

---

## Authentication

The system uses a dual-token strategy:

- **Access Token** — Short-lived (15 minutes), sent with every protected request in the `Authorization: Bearer <token>` header
- **Refresh Token** — Long-lived (7 days), stored in an httpOnly cookie, used to silently obtain a new access token

Both tokens embed `userId`, `tenantId`, and `role` — making tenant context available on every authenticated request without an extra database lookup.

### Refresh Token Rotation

Every call to `POST /auth/refresh-token` invalidates the old refresh token and issues a brand new one. This limits the damage window if a refresh token is ever compromised.

### Silent Refresh Flow

```
Client sends request with access token
  → Valid → proceed
  → Expired → server returns 401
    → Client calls POST /auth/refresh-token
    → New access token issued
    → Client retries original request
```

---

## Multi-Tenancy

Tenant isolation is enforced at the application layer via JWT context:

1. On login, the JWT is signed with the user's `tenantId`
2. `authMiddleware` verifies the token and attaches `req.user` (including `tenantId`) to every request
3. Every service function receives `tenantId` from the controller and scopes all database queries with `where: { tenantId }`

This makes cross-tenant data access structurally impossible — a user from Tenant A can never read or modify Tenant B's data, even with a valid token.

---

## Role-Based Access Control

Three roles with increasing permissions:

| Role | Capabilities |
|---|---|
| `MEMBER` | Read access to tenant data |
| `MANAGER` | Read access to tenant data |
| `ADMIN` | Full access — manage users, update tenant |

RBAC is enforced via the `requireRole()` middleware factory attached to individual routes:

```typescript
router.delete("/users/:id", authMiddleware, requireRole("ADMIN"), deleteUserController);
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- A `.env` file configured (see below)

### Installation

```bash
# Clone the repository
git clone https://github.com/abdullahjr958/Multi-Tenant-Saas-Backend-.git
cd Multi-Tenant-Saas-Backend-

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## Environment Variables

Create a `.env` file in the root directory. A `.env.example` is provided as a reference:

```env
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/saas_db"

# Server
PORT=3000

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRES_IN_MINUTES=15m
JWT_REFRESH_EXPIRES_IN_DAYS=7

# Node
NODE_ENV=development
```

---

## API Endpoints

### Auth

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/signup` | Register a new tenant and Admin user | Public |
| POST | `/auth/login` | Login and receive access + refresh tokens | Public |
| POST | `/auth/refresh-token` | Obtain a new access token via refresh token cookie | Public |
| POST | `/auth/logout` | Invalidate the refresh token and clear cookie | Public |

### Users

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/users/users` | List all users in tenant (paginated + filtered) | Any authenticated |
| GET | `/users/users/:id` | Get a specific user by ID | Any authenticated |
| PATCH | `/users/users/:id/role` | Update a user's role | Admin only |
| DELETE | `/users/users/:id` | Remove a user from the tenant | Admin only |

#### Query Parameters for `GET /users/users`

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |
| `role` | ADMIN \| MANAGER \| MEMBER | Filter by role |
| `email` | string | Partial email search (case-insensitive) |

#### Example Response

```json
{
  "data": [
    { "id": "uuid", "email": "user@acme.com", "role": "ADMIN" }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Tenants

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/tenants/me` | Get current tenant info | Any authenticated |
| PATCH | `/tenants/me` | Update tenant name or slug | Admin only |

---

## Testing

The project has a full test suite covering unit and integration tests.

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run all tests once with coverage report
npm run test:coverage
```

### Test Coverage

```
Unit Tests (13)
  ✓ signupService  — slug conflict, password hashing, token generation
  ✓ loginService   — tenant not found, user not found, wrong password, success
  ✓ refreshTokenService — invalid token, not in DB, expired, rotation
  ✓ logoutService  — success, DB error handling

Integration Tests (26)
  ✓ POST /auth/signup        — validation, conflict, success, cookie
  ✓ POST /auth/login         — validation, bad credentials, success, cookie
  ✓ POST /auth/refresh-token — no cookie, invalid, success, new cookie
  ✓ POST /auth/logout        — no cookie, success
  ✓ GET /users               — auth guard, pagination, role filter
  ✓ GET /users/:id           — auth guard, not found, success
  ✓ PATCH /users/:id/role    — RBAC, invalid role, success
  ✓ DELETE /users/:id        — RBAC, success
```

---

> Built as a learning project to demonstrate production-grade backend architecture, multi-tenancy patterns, JWT authentication, RBAC, audit logging, and testing with Vitest.