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

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Language | TypeScript (strict mode) |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT (access + refresh tokens) |
| Validation | Zod |
| Dev Server | tsx |
| Session Store | PostgreSQL (Redis optional) |

---

## Architecture

The system follows a layered architecture with clear separation of concerns:

```
Request → Route → Middleware → Controller → Service → Prisma → PostgreSQL
```

- **Routes** — Define API endpoints and attach middleware
- **Middleware** — Handle JWT verification, tenant resolution, and RBAC
- **Controllers** — Parse requests, call services, send responses
- **Services** — Contain all business logic and database queries
- **Validators** — Zod schemas that validate incoming request data

---

## Project Structure

```
prisma/
└── schema.prisma           # Database schema and models

src/
├── config/
│   └── db.ts               # Database configuration
├── middleware/
│   ├── auth.middleware.ts  # JWT verification
│   ├── tenant.middleware.ts# Tenant context injection
│   └── rbac.middleware.ts  # Role-based access control
├── controllers/
│   ├── auth.controllers.ts
│   ├── users.controllers.ts
│   └── tenants.controllers.ts
├── routes/
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   └── tenants.routes.ts
├── validators/
│   ├── auth.validator.ts
│   ├── users.validator.ts
│   └── tenants.validator.ts
├── lib/
│   └── prisma.ts           # Prisma client singleton
├── service/
│   ├── auth.service.ts
│   ├── users.service.ts
│   └── tenants.service.ts
├── types/
│   └── index.ts            # Custom TypeScript types
├── app.ts                  # Express app configuration
└── server.ts               # Server entry point
```

---

## Database Schema

The database has four core models:

### Tenant
Represents an organization on the platform. Each tenant has a unique `slug` used for identification.

### User
Belongs to a tenant. The same email address can exist across different tenants but not within the same tenant — enforced via a composite unique constraint `@@unique([email, tenantId])`.

### RefreshToken
Stores refresh tokens per user and tenant to manage session lifecycle. Designed to be swappable with Redis.

### AuditLog
Records every significant user action within a tenant, including the action type, affected entity, and optional metadata.

### Role Enum
```
ADMIN | MANAGER | MEMBER
```

---

## Authentication

The system uses a dual-token strategy:

- **Access Token** — Short-lived (15 minutes), sent with every request in the `Authorization` header as a Bearer token
- **Refresh Token** — Long-lived (7 days), used to obtain a new access token without requiring the user to log in again

Both tokens embed the user's `id`, `tenantId`, and `role` — making tenant context available on every authenticated request.

---

## Multi-Tenancy

Tenant isolation is enforced at the application layer:

1. The JWT contains the `tenantId` of the authenticated user
2. A tenant middleware extracts and attaches this to every request
3. Every database query in the service layer is scoped with `where: { tenantId }` — making cross-tenant data access structurally impossible

---

## Role-Based Access Control

Three roles with increasing permissions:

| Role | Permissions |
|---|---|
| `MEMBER` | Read access to tenant data |
| `MANAGER` | Read + write access |
| `ADMIN` | Full access including user management |

RBAC is enforced via middleware attached to individual routes.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- A `.env` file configured (see below)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/saas-backend.git
cd saas-backend

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/saas_db"

# Server
PORT=3000

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Node
NODE_ENV=development
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new tenant and admin user |
| POST | `/auth/login` | Login and receive access + refresh tokens |
| POST | `/auth/refresh` | Obtain a new access token |
| POST | `/auth/logout` | Invalidate the refresh token |

### Users
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/users` | List all users in the tenant | Manager+ |
| GET | `/users/:id` | Get a specific user | Manager+ |
| PATCH | `/users/:id` | Update a user's role | Admin |
| DELETE | `/users/:id` | Remove a user from the tenant | Admin |

### Tenants
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/tenants/me` | Get current tenant info | Any |
| PATCH | `/tenants/me` | Update tenant details | Admin |

---

> Built as a learning project to demonstrate advanced backend architecture, multi-tenancy patterns, and production-grade SaaS design.
