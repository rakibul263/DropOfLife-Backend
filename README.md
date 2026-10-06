# 🩸 DropOfLife Backend API (জীবনের এক ফোঁটা)
> **Enterprise Real-Time Blood Donation, Emergency Telemetry & Clinical Dispatch REST API**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748.svg?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1.svg?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Google OAuth](https://img.shields.io/badge/Google_OAuth-2.0-4285F4.svg?logo=google&logoColor=white)](https://developers.google.com/identity)
[![Stripe](https://img.shields.io/badge/Payments-Stripe_Checkout-635BFF.svg?logo=stripe&logoColor=white)](https://stripe.com/)
[![Resend](https://img.shields.io/badge/Email-Resend_Service-000000.svg)](https://resend.com/)
[![Swagger](https://img.shields.io/badge/Documentation-Swagger_OpenAPI_3.0-85EA2D.svg?logo=swagger&logoColor=black)](https://dropoflife-backend.onrender.com/docs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 GitHub Repository Details (About Section)

* **Repository Description**:
  > 🩸 Enterprise-grade RESTful API for DropOfLife (জীবনের এক ফোঁটা). Features dual-token JWT authentication, Google OAuth 2.0 direct sign-in, strict email & phone uniqueness verification, Neon PostgreSQL with Prisma ORM, Stripe payments, Resend automated emails, and real-time emergency blood telemetry across all 64 districts of Bangladesh.
* **Website / Live API**: `https://dropoflife-backend.onrender.com`
* **Swagger OpenAPI Docs**: `https://dropoflife-backend.onrender.com/docs`
* **Topics / Tags**:
  `blood-donation`, `blood-bank-management`, `emergency-healthcare`, `expressjs`, `typescript`, `prisma-orm`, `postgresql`, `neon-database`, `google-oauth`, `stripe-payment`, `jwt-authentication`, `resend-email`, `swagger-documentation`, `bangladesh-healthcare`, `rest-api`

---

## 📖 Overview

**DropOfLife (জীবনের এক ফোঁটা)** is a mission-critical, enterprise healthcare infrastructure platform connecting voluntary blood donors, emergency patients, trauma units, and accredited hospital blood banks across all 64 districts of Bangladesh.

The backend service is engineered with a **Layered Modular MVC Architecture** (`Routes -> Controllers -> Services -> Validations -> Interfaces`), ensuring high maintainability, strict validation, and bank-grade data security. It integrates **Neon Serverless PostgreSQL** via **Prisma ORM** along with a resilient state engine for high-frequency emergency dispatch queries.

---

## 🚀 Key Engineering Highlights

### 1. 🔐 Dual-Token JWT & Google OAuth 2.0 Direct Authentication
- **Unique Account Protection**: Strictly prevents creating duplicate accounts using the same email or phone number across both traditional registration and Google onboarding.
- **Direct Google Sign-In**: Existing registered users who sign in via "Continue with Google" are authenticated instantly into their session without re-prompting Step 2 profile completion.
- **Strict Phone Normalization**: Strips non-digits and compares subscriber phone keys to prevent multi-account duplication regardless of formatting (`017XXXXXXXX`, `+88017XXXXXXXX`, etc.).
- **Dual JWT Tokens**: Issues short-lived Access Tokens (1 day) paired with rotating Refresh Tokens (30 days) stored in secure `HttpOnly` and `SameSite=Lax` cookies.

### 2. 🩸 Smart Clinical Matching & Compatibility Engine
- Full mathematical ABO and Rh factor compatibility matrix calculations.
- Intelligent donor cool-down algorithms enforcing 90-day safe donation recovery intervals.
- Priority scoring based on clinical emergency triage levels: `Standard`, `Urgent`, and `Critical (ICU/CCU)`.

### 3. 🏥 Hospital Blood Bank Inventory Telemetry
- Real-time stock counts by blood component: `Whole Blood`, `PRBC (Packed Red Blood Cells)`, `FFP (Fresh Frozen Plasma)`, and `Platelets`.
- Proactive low-stock threshold triggers and automatic hospital coordination alerts.

### 4. 🏕️ Blood Donation Camps & Requisition Dispatch
- Camp scheduling with geolocation coordinates, real-time donor slot booking, and capacity tracking.
- Instant automated dispatch hotline routing (`+8801521711716` / `02-9351969`).

### 5. 💳 Stripe Lifesaver Fund & Webhooks
- Secure Stripe Checkout payment intents for transparent humanitarian donations.
- Automated webhook listener with cryptographic signature verification, recording transactions into Neon PostgreSQL.

### 6. 📧 Automated Email Notifications
- Dual email delivery engine with **Resend** and secure **SMTP (Gmail App Passwords)**.
- Automated transactional welcome emails, emergency requisition alerts, donor confirmation notices, and OTP password resets.

---

## 🏛️ Project Directory Structure

```
backend/
├── prisma/
│   └── schema.prisma               # PostgreSQL Prisma data model
├── src/
│   ├── app/
│   │   ├── config/                 # Environment variables, CORS whitelist & Swagger configs
│   │   ├── errors/                 # Standardized ApiError class
│   │   ├── middlewares/            # RBAC auth, rate limiters, request loggers, global error handler
│   │   ├── modules/                # Domain-driven modular MVC packages
│   │   │   ├── admin/              # Platform telemetry, analytics, moderation & audit logs
│   │   │   ├── auth/               # Dual-token JWT auth, Google OAuth, unique verification
│   │   │   ├── bloodRequest/       # 64-district emergency requisitions & matching engine
│   │   │   ├── camp/               # Blood donation camps & scheduling
│   │   │   ├── donor/              # Geo-aware donor registry & availability status
│   │   │   ├── inventory/          # Hospital blood bank component inventories
│   │   │   ├── payment/            # Stripe payment intents, transactions & webhooks
│   │   │   └── user/               # User profiles, roles (donor, provider, admin)
│   │   ├── routes/                 # Central router index (/api/v1)
│   │   ├── shared/                 # Prisma client singleton
│   │   └── utils/                  # Resilient dataStore, JWT helpers, emailService, winston logger
│   ├── app.ts                      # Express app initialization, CORS, cookie parser, routes
│   └── server.ts                   # Server lifecycle, PostgreSQL connection, graceful shutdown
├── Dockerfile                      # Production container image definition
├── render.yaml                     # Render Cloud deployment blueprint
├── package.json
└── tsconfig.json
```

---

## 📡 REST API Documentation

The backend includes an interactive **Swagger OpenAPI 3.0** documentation interface available at:
👉 **[http://localhost:5050/docs](http://localhost:5050/docs)** (or **[https://dropoflife-backend.onrender.com/docs](https://dropoflife-backend.onrender.com/docs)** in production).

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new donor or provider (enforces unique email & phone) | Public |
| `POST` | `/api/v1/auth/login` | Email & password login (issues dual JWT tokens) | Public |
| `POST` | `/api/v1/auth/google` | Google OAuth 2.0 authentication (direct login for existing accounts) | Public |
| `GET` | `/api/v1/auth/me` | Fetch currently authenticated user profile | Authenticated |
| `POST` | `/api/v1/auth/refresh-token` | Exchange refresh token for a fresh access token | Public |
| `POST` | `/api/v1/auth/logout` | Terminate session and clear authentication cookies | Public |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset verification code / link | Public |
| `POST` | `/api/v1/auth/reset-password` | Verify code and update user password | Public |

### 🩸 Donors Directory (`/api/v1/donors`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/donors` | Search donors by blood group, division, district, and availability | Public |
| `GET` | `/api/v1/donors/:id` | Get individual donor clinical profile & request cooldown status | Public |
| `PATCH` | `/api/v1/donors/availability` | Toggle donor live availability switch | Donor / Admin |

### 🚨 Emergency Blood Requests (`/api/v1/requests`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/requests` | List emergency requisitions with urgency filters | Public |
| `POST` | `/api/v1/requests` | Create emergency blood requisition | Public / User |
| `GET` | `/api/v1/requests/:id` | Retrieve single request with matched donor telemetry | Public |
| `PATCH` | `/api/v1/requests/:id/status` | Update requisition status (`Pending`, `In Progress`, `Fulfilled`) | Authenticated |

### 🏥 Blood Bank Inventory (`/api/v1/inventory`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/inventory` | View live stock counts across hospital blood banks | Public |
| `POST` | `/api/v1/inventory` | Add new blood component units | Provider / Admin |
| `PATCH` | `/api/v1/inventory/:id` | Update stock quantity or critical thresholds | Provider / Admin |

### 💳 Stripe Payments (`/api/v1/payments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/payments/create-payment-intent` | Initialize Stripe payment intent | Public / User |
| `GET` | `/api/v1/payments/history` | Retrieve verified contribution receipts | Authenticated |
| `POST` | `/api/v1/payments/webhook` | Stripe webhook listener (cryptographic verification) | Public |

### 🛡️ Administrative Portal (`/api/v1/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/v1/admin/stats` | Platform-wide clinical telemetry, donor counts & activity | Admin |
| `GET` | `/api/v1/admin/users` | Manage all registered users, verification, and suspension | Admin |
| `PATCH` | `/api/v1/admin/users/:id/status` | Verify or suspend account with reason | Admin |
| `GET` | `/api/v1/admin/complaints` | Review user misconduct reports & clinical flags | Admin |

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5050
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

# JWT Authentication
JWT_SECRET="your_super_secure_jwt_secret_key_lifesaver"
JWT_EXPIRES_IN=7d

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Services (Resend & Gmail SMTP)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=onboarding@resend.dev
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_digit_app_password
SMTP_FROM=DropOfLife <your_email@gmail.com>
```

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v18.x or v20.x or v22.x
- **PostgreSQL**: Local instance or Neon Serverless connection string

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rakibul263/DropOfLife-Backend.git
cd DropOfLife-Backend
npm install
```

### 2. Generate Prisma Client & Push Schema
```bash
npx prisma generate
npx prisma db push
```

### 3. Start Development Server
```bash
npm run dev
```
The server will boot up at `http://localhost:5050`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🌐 Production Deployment

The backend is fully configured for deployment on **Render**, **Railway**, or **Docker**:
- **Health Check Endpoint**: `/api/v1/health`
- **Render Configuration**: Pre-configured `render.yaml` and `Dockerfile`
- **Zero Downtime**: Graceful shutdown handles in-flight transactions before terminating connections.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
