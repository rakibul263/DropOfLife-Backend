# 🩸 DropOfLife Backend API (জীবনের এক ফোঁটা)
> **Enterprise Real-Time Blood Donation & Emergency Telemetry Dispatch REST API**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg?logo=express)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-teal.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1.svg?logo=postgresql)](https://neon.tech/)
[![Arcjet](https://img.shields.io/badge/Security-Arcjet_Shield-orange.svg)](https://arcjet.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe_Checkout-6772E5.svg?logo=stripe)](https://stripe.com/)
[![Resend](https://img.shields.io/badge/Email-Resend_Service-000000.svg)](https://resend.com/)
[![Swagger](https://img.shields.io/badge/Documentation-Swagger_OpenAPI_3.0-85EA2D.svg?logo=swagger)](http://localhost:5050/docs)

---

## 📖 Overview

**DropOfLife (জীবনের এক ফোঁটা)** is a mission-critical, enterprise-grade emergency blood donation and telemetry platform. The backend provides high-performance RESTful APIs, role-based authorization, automated blood group compatibility algorithms, live donor discovery, hospital blood bank inventory monitoring, and Stripe payment processing for the Lifesaver Fund.

Designed with a **Layered Modular MVC Architecture** (`Controller-Service-Route-Validation-Interface`), the server supports dual-layer storage: **Neon Serverless PostgreSQL with Prisma ORM** along with an **In-Memory Reactive Data Store** for sub-millisecond telemetry feeds and real-time frontend synchronization.

---

## 🏛️ System Architecture

```
src/
├── app/
│   ├── config/             # Environment, Swagger & Server configs
│   ├── middlewares/        # Global error handler, RBAC auth, Arcjet, Zod validator
│   ├── modules/            # Domain-driven feature modules
│   │   ├── admin/          # Platform telemetry, analytics, audit logs
│   │   ├── auth/           # JWT auth, user registration, bcrypt, token refresh
│   │   ├── bloodRequest/   # Emergency blood requisitions & urgency matching
│   │   ├── camp/           # Blood donation camps & slot booking
│   │   ├── donor/          # Geo-aware donor directory & eligibility screening
│   │   ├── inventory/      # Hospital blood bank units & expiration tracking
│   │   ├── payment/        # Stripe payment intents, webhooks & receipts
│   │   └── user/           # User schema, profiles, and role definitions
│   ├── routes/             # Unified API router aggregations (v1)
│   ├── shared/             # Prisma client singleton instance
│   └── utils/              # Arcjet client, Resend email service, JWT helpers
├── constants/              # Blood compatibility matrices & system enums
├── prisma/                 # Prisma PostgreSQL schema
├── app.ts                  # Express application setup, middlewares, swagger mount
└── server.ts               # Server lifecycle, graceful shutdown hooks, port 5050
```

---

## 🚀 Key Features

- **🔐 Robust Authentication & RBAC**:
  - JWT Access & Refresh token rotation with HttpOnly cookie support.
  - Multi-tiered roles: `DONOR`, `RECIPIENT`, `HOSPITAL_ADMIN`, `VOLUNTEER`, `SUPER_ADMIN`.
  - Secure bcrypt password hashing with salt rounds.

- **🩸 Smart Blood Compatibility Matching Engine**:
  - Comprehensive ABO & Rh factor matrix calculations.
  - Real-time donor eligibility filters (health conditions, last donation interval).
  - Priority scoring based on request urgency (`NORMAL`, `URGENT`, `CRITICAL`).

- **🏥 Hospital Blood Bank Inventory**:
  - Real-time stock counts by blood type across medical centers.
  - Expiration monitoring and proactive critical shortage alerts.

- **🏕️ Blood Donation Camps**:
  - Camp scheduling, geo-location coordinates, capacity tracking, and slot reservation.

- **💳 Stripe Lifesaver Fund Payments**:
  - Embedded and custom checkout intents with webhook listener verification.
  - Instant automated tax receipts and donor badge allocations.

- **🛡️ Enterprise Security & Attack Shield**:
  - **Arcjet** bot detection, rate limiting, and DDoS mitigation.
  - Strict **Zod** request payload validation.
  - Granular CORS policies for client frontends.

- **⚡ Reactive Live Telemetry**:
  - Fast in-memory state engine mirroring database records for high-frequency dispatch queries.
  - National emergency dispatch hotline integration: `+8801521711716` / `02-9351969`.

- **📚 Interactive Swagger OpenAPI 3.0 Documentation**:
  - Complete interactive API playground available at `http://localhost:5050/docs`.

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new donor or recipient account | Public |
| `POST` | `/api/v1/auth/login` | Authenticate user and issue JWT tokens | Public |
| `POST` | `/api/v1/auth/refresh-token` | Exchange refresh token for new access token | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Authenticated |

### 🩸 Donors Directory (`/api/v1/donors`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/donors` | Search donors by blood group, division, availability | Public |
| `GET` | `/api/v1/donors/:id` | Fetch specific donor profile and donation history | Public |
| `GET` | `/api/v1/donors/stats/overview` | Platform blood group availability statistics | Public |

### 🚨 Emergency Blood Requests (`/api/v1/requests`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/requests` | List all emergency requests with filter queries | Public |
| `POST` | `/api/v1/requests` | Create emergency blood requisition | Authenticated |
| `GET` | `/api/v1/requests/:id` | Get emergency requisition details | Public |
| `PATCH` | `/api/v1/requests/:id/status` | Update requisition status (`PENDING` -> `FULFILLED`) | Authorized |

### 🏕️ Donation Camps (`/api/v1/camps`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/camps` | List upcoming blood donation camps | Public |
| `GET` | `/api/v1/camps/:id` | Get camp details, venue, and timings | Public |
| `POST` | `/api/v1/camps/:id/register` | Register donor attendance for camp | Authenticated |

### 🏥 Blood Bank Inventory (`/api/v1/inventory`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/inventory` | Real-time blood units stock by hospital | Hospital/Admin |
| `GET` | `/api/v1/inventory/shortage-alerts` | Critical blood inventory shortage list | Public / Admin |

### 💳 Stripe Payments (`/api/v1/payments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/payments/create-intent` | Initialize Stripe PaymentIntent for Lifesaver fund | Public |
| `POST` | `/api/v1/payments/webhook` | Stripe webhook event handler | Stripe Signature |

### 📊 Admin Telemetry (`/api/v1/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/admin/overview` | High-level metrics, active donors, critical requests | Admin |
| `GET` | `/api/v1/admin/audit-logs` | Security and audit trail logs | Super Admin |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**
- **PostgreSQL**: Neon serverless database URL (or local PostgreSQL)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rakibul263/DropOfLife-Backend.git
cd DropOfLife-Backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the configuration parameters:
```env
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:3000

DATABASE_URL="postgresql://username:password@ep-sample.us-east-2.aws.neon.tech/dropoflife?sslmode=require"

JWT_SECRET="your_jwt_secret_key"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"

ARCJET_KEY="ajkey_your_key"
RESEND_API_KEY="re_your_key"
STRIPE_SECRET_KEY="sk_test_your_key"
```

### 3. Initialize Prisma ORM
```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to PostgreSQL database
npm run prisma:migrate
```

### 4. Run Development Server
```bash
npm run dev
```
The API server will boot up on:
```
Server listening on port 5050: http://localhost:5050
Swagger OpenAPI Documentation: http://localhost:5050/docs
Health Check: http://localhost:5050/health
```

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `ts-node-dev --respawn --transpile-only src/server.ts` | Starts live-reloading dev server |
| `npm run build` | `tsc` | Compiles TypeScript to `dist/` |
| `npm start` | `node dist/server.js` | Runs production build |
| `npm run prisma:generate` | `prisma generate` | Generates typed Prisma client |
| `npm run prisma:migrate` | `prisma migrate dev` | Runs migrations against database |
| `npm run prisma:studio` | `prisma studio` | Opens interactive Prisma web studio |

---

## 🛡️ License & Authors

- **Platform**: DropOfLife (জীবনের এক ফোঁটা)
- **Author**: Rakibul Hasan ([@rakibul263](https://github.com/rakibul263))
- **License**: ISC
