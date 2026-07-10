# 🔐 Auth Service (Centralized Authentication & Token Management)

A production-ready **centralized authentication microservice** designed to handle user authentication, client-app validation, and secure token issuance/rotation for multiple consumer applications (e.g., HRM, CRM, etc.). 

**Production Endpoint:** `https://auth.mzsk.fun`

By using asymmetric encryption (RSA-256) and JSON Web Encryption (JWE), this service allows client applications to verify access tokens locally without making continuous network requests back to the Auth Service.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐
│          Auth Service           │  ← Handles signup, login, refresh, logout
│           (Port: 5000)          │  ← Stores users, clients, refresh tokens
└────────────────┬────────────────┘
                 │
                 │ Asymmetric JWT tokens (RSA-256 + JWE)
                 │
     ┌───────────┴───────────┐
     │                       │
┌────▼────┐             ┌────▼────┐
│ HRM App │             │ CRM App │  ← Client apps verify tokens locally
│  :5001  │             │  :5002  │  ← and manage their own databases
└─────────┘             └─────────┘
```

### Key Highlights:
* **Single Sign-On (SSO) Foundation:** A single auth source registers users and issues tokens scoped to registered client applications.
* **Local Verification:** Consumer apps decrypt and verify tokens using a shared public key locally (zero HTTP overhead for authentication checks).
* **Token Rotation & Security:** Access tokens have a short lifespan (e.g., 15 minutes) and are paired with a rotated, secure refresh token (stored in `httpOnly` cookies).
* **Just-In-Time Provisioning:** Client apps auto-create local profiles for verified users on their first access.

---

## 🚀 Tech Stack

* **Runtime:** Node.js (v20+)
* **Framework:** Express (v5)
* **Database:** PostgreSQL (v15)
* **ORM:** Prisma
* **Security & Tokens:** `jose` (JWE/JWT), `bcryptjs`, `cookie-parser`, `helmet`, `xss`
* **Testing:** Node.js Native Test Runner
* **Containerization:** Docker & Docker Compose
* **CI/CD:** Jenkins Pipeline

---

## 📁 Project Structure

This repository contains the standalone **Auth Service** implementation:

```
Multi-Auth/
├── config/                  # Server, Database, and Prisma configuration
│   ├── config.js
│   ├── db.js
│   └── prisma.js
├── controllers/             # Authentication endpoint handlers
│   └── auth.controller.js
├── middlewares/             # Request interceptors
│   ├── catchAsync.js        # Global async error wrapper
│   ├── errorHandler.js      # Global JSON error responses
│   ├── sanitization.js      # Input sanitization
│   ├── validateClient.js    # Client-application ID/secret verification
│   └── validator.js         # Joi schema validator
├── prisma/                  # Database schema & migrations
│   ├── migrations/
│   └── schema.prisma
├── repositories/            # Direct database queries (Prisma)
│   ├── client.repository.js
│   ├── refreshToken.repository.js
│   └── user.repository.js
├── routes/                  # API endpoints definition
│   ├── auth.routes.js
│   └── index.routes.js
├── scripts/                 # Key generator and database seeding scripts
│   ├── seed-clients.js
│   └── setup-keys.js
├── services/                # Authentication business logic
│   └── auth.service.js
├── tests/                   # Native Node.js unit tests
│   ├── jwt.utils.test.js
│   └── responseHandler.test.js
├── utils/                   # Helpers (JWT generation, response structures)
│   ├── jwt.utils.js
│   └── responseHandler.js
├── validations/             # Joi input validation schemas
│   └── auth.validation.js
├── Dockerfile               # Node.js service containerization instructions
├── docker-compose.yml       # Orchestrates the service and PostgreSQL DB
├── Jenkinsfile              # Declarative CI/CD pipeline
├── server.js                # Application entrypoint
└── KEYS_SETUP.md            # Details on RSA key setup
```

---

## 🔧 Setup Instructions

### Prerequisites
* **Node.js** (v20+)
* **PostgreSQL** (v15+)
* **Docker / Docker Compose** (Optional, for containerized run)

---

### 1️⃣ Local Development (Native Node)

#### A. Install Dependencies
```bash
npm install
```

#### B. Generate RSA Keys
Run the helper script to generate the required 2048-bit RSA key pair:
```bash
npm run setup-keys
```
This generates files under `/keys`:
* `private.key` & `public.key`: Raw key files.
* `private_env.txt` & `public_env.txt`: Single-line environment-safe key strings.

> [!WARNING]
> Never commit the `/keys` directory to Git. It is automatically gitignored.

#### C. Configure Environment Variables
1. Copy the template `.env.example` file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values:
   * Paste the single-line private key from `keys/private_env.txt` into `JWT_PRIVATE_KEY`.
   * Paste the single-line public key from `keys/public_env.txt` into `JWT_PUBLIC_KEY`.
   * Update the `DATABASE_URL` with your PostgreSQL database credentials.

#### D. Setup Database & Migrations
Ensure PostgreSQL is running, then create the database:
```sql
CREATE DATABASE auth_service;
```
Run Prisma migrations and generate client types:
```bash
npm run migrate
npm run prisma:generate
```

#### E. Seed Client Credentials
To authorize consumer applications (like the HRM app), seed their client configurations into the database:
```bash
npm run seed:clients
```

#### F. Run the Application
Start the development server:
```bash
npm run dev
```
The Auth Service runs at: **http://localhost:5000** (or http://127.0.0.1:5000)

---

### 2️⃣ Containerized Setup (Docker Compose)

You can run the application and its PostgreSQL database inside Docker containers.

1. Ensure the key generation step (Step B above) has been completed.
2. Ensure you have copied and configured your `.env` file (Step C above).
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
This commands spins up:
* A `db` service running PostgreSQL on port `5432`.
* An `app` service running the Auth Service application on port `5000`.

---

## 🧪 Running Unit Tests

This project uses the native Node.js test runner for unit tests. Tests are located in the `/tests` directory.

To run the test suite locally:
```bash
node --test
```
*(If PowerShell execution policies allow, you can also run `npm test`)*

---

## ⚙️ CI/CD Pipeline (Jenkins)

The repository includes a declarative `Jenkinsfile` configuring an automated build and deploy pipeline. The pipeline executes the following stages:

1. **Pull Repository:** Checks out the latest source code from Git.
2. **Run Tests:** Runs the test suite in an isolated, lightweight `node:20-alpine` Docker container (`npm test`).
3. **Build Docker Image:** Builds the Docker container image, tagging it as `omthakur03/auth-service:latest` and `omthakur03/auth-service:<build_number>`.
4. **Push to Docker Hub:** Signs into Docker Hub using stored Jenkins credentials (`Docker-ID`) and pushes the built image.
5. **Deploy Container:** Performs a rolling update on the target EC2 host, removing any existing container and spawning the newly-built container with the production configurations.
6. **Cleanup:** Removes temporary builds and images from the host to prevent storage exhaustion.

---

## 📚 API Endpoints

All Auth Service routes require the custom HTTP headers `x-client-id` and `x-client-secret` for client registration verification (except refresh, logout, and verify which utilize secure cookies).

| Method | Endpoint | Required Headers / Cookies | Description |
|:---|:---|:---|:---|
| **POST** | `/auth/signup` | Headers: `x-client-id`, `x-client-secret` | Register a new user profile |
| **POST** | `/auth/login` | Headers: `x-client-id`, `x-client-secret` | Login user, issues access & refresh token cookies |
| **GET** | `/auth/verify` | Cookie: `accessToken` | Decrypt and verify access token validity |
| **POST** | `/auth/refresh` | Cookie: `refreshToken` | Validate and rotate tokens without prompting re-login |
| **POST** | `/auth/logout` | Cookie: `refreshToken` | Invalidate and revoke the active user session |
| **GET** | `/` | *None* | Basic health check endpoint |

---

## 🔐 Security Standards Implemented

* **RSA-256 JWT Signing:** Access tokens are signed using a private key and validated with a public key.
* **JWE Token Encryption:** Access token payloads are encrypted, rendering them unreadable to clients and attackers sniffing network traffic.
* **httpOnly & Secure Cookies:** Access and refresh tokens are stored in the browser's cookie jar, protected from XSS scripts.
* **CSRF & Cors Protection:** Cors origin checks and SameSite options restrict unwanted cross-origin access.
* **Input Sanitization:** Uses `xss` and `Joi` validations to avoid script injections.

---

## 💡 Client Integration Reference (e.g., HRM App)

To integrate a client application (such as the HRM App) with this Auth Service:

1. **Register the Client:** Seed client credentials in the Auth Service (`HRM_CLIENT_ID` and `HRM_CLIENT_SECRET`).
2. **Key Sharing:** Copy the generated `keys/public.key` to the client app's `keys/` directory (needed to verify signatures).
3. **Configure client `.env`:**
   ```env
   PORT=5001
   DATABASE_URL=postgresql://user:password@localhost:5432/hrm_db
   AUTH_SERVICE_URL=https://auth.mzsk.fun
   CLIENT_ID=hrm-app
   CLIENT_SECRET=hrm-super-secret-key-change-in-production
   JWT_PUBLIC_KEY=<paste from keys/public_env.txt>
   ```
4. **Local Middleware:** When a request is received on a protected client route, extract the token cookie, decrypt it locally using `JWT_PUBLIC_KEY`, check expiration, and provision the user locally if they don't already exist in the local client database.

---

## 🐛 Troubleshooting

* **Prisma Client Issues:** If you make changes to `prisma/schema.prisma`, run `npx prisma generate` to rebuild the types.
* **Key Mismatch:** If token decryption fails in client apps, verify they are using the exact same public key generated by the Auth Service.
* **Docker DB Connection Refused:** Make sure the database healthcheck is running. If you are using Docker Compose, the application container will wait for the postgres container to be healthy before starting.