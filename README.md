# Three-Tier Admin Portal (React + Java 21 Spring Boot + AWS RDS)

A production-grade, secure **Three-Tier Web Application** designed specifically for DevOps CI/CD pipelines, containerized orchestration, and AWS Cloud deployments.

---

## 1. Architecture Overview

```
                +-----------------------------------------------+
                |         Tier 1: Presentation Layer            |
                |          React 18 + Vite (Port 3000)          |
                |   Pure JavaScript (No TS), Axios Interceptors |
                +-----------------------+-----------------------+
                                        |
                             HTTPS / JSON REST API
                         Authorization: Bearer <JWT>
                                        |
                                        v
                +-----------------------------------------------+
                |          Tier 2: Application Layer            |
                |       Java 21 + Spring Boot 3.3.4 (Port 8080) |
                |       Spring Security, BCrypt, Actuator       |
                +-----------------------+-----------------------+
                                        |
                              JDBC (TLS / Port 3306)
                                        |
                                        v
                +-----------------------------------------------+
                |             Tier 3: Database Layer            |
                |     AWS RDS Relational Database (MySQL / PG)  |
                |        Spring Data JPA (users table)          |
                +-----------------------------------------------+
```

### Tier 1 · Presentation Tier (Frontend)
- **Framework**: React 18 Single-Page Application (SPA) powered by Vite.
- **Language**: Pure JavaScript (`.jsx` / `.js`) — clean architectural modularity without TypeScript overhead.
- **HTTP Client**: Axios with automatic request interceptors injecting JWT Bearer tokens from `localStorage` and response interceptors handling 401 expiration.
- **UI & UX**: Tailored console interface with high-contrast, zero-pill typography, server hostname detection, live Actuator health probes, and credentials auto-fill.

### Tier 2 · Application Tier (Backend)
- **Runtime**: Java 21 (LTS) with Spring Boot 3.3.4.
- **Security**: Spring Security 6 with stateless session management, BCrypt password hashing (10 rounds), and cryptographic HMAC-SHA256 JWT tokens.
- **Auto Data Seeding**: `AdminDataSeeder` checks `userRepository.count() == 0` on startup and seeds default admin credentials (`admin` / `admin@589`).
- **DevOps Observability**: Spring Boot Actuator exposing `/actuator/health/liveness` and `/actuator/health/readiness` probes for AWS ALB target group health checks, coupled with graceful shutdown (`server.shutdown: graceful`).

### Tier 3 · Data Tier (Database)
- **Persistence**: AWS RDS Relational Database (MySQL 8.0 or PostgreSQL 16) managed via Spring Data JPA and Hibernate (`ddl-auto: update`).
- **Entity**: `User` entity mapped to `users` table (`id`, `username`, `password_hash`, `full_name`, `email`, `role`, `department`, `created_at`).
- **CI Test Isolation**: In-memory H2 database configured in `application-test.yml` allowing `mvn clean test` to run seamlessly in headless CI runners without live RDS connections.

---

## 2. Repository Directory Structure

```
three-tier-admin-portal/
|-- .gitignore
|-- README.md
|-- index.html
|-- package.json
|-- vite.config.js
|
|-- backend/                                 (Tier 2: Java Spring Boot API)
|   |-- pom.xml
|   `-- src/
|       |-- main/
|       |   |-- java/com/devops/portal/
|       |   |   |-- PortalBackendApplication.java
|       |   |   |-- config/
|       |   |   |   |-- AdminDataSeeder.java
|       |   |   |   `-- CorsConfig.java
|       |   |   |-- controller/
|       |   |   |   `-- AuthProfileController.java
|       |   |   |-- model/
|       |   |   |   `-- User.java
|       |   |   |-- repository/
|       |   |   |   `-- UserRepository.java
|       |   |   `-- security/
|       |   |       `-- JwtUtil.java
|       |   `-- resources/
|       |       `-- application.yml
|       `-- test/
|           |-- java/com/devops/portal/
|           |   `-- PortalBackendApplicationTests.java
|           `-- resources/
|               `-- application-test.yml
|
`-- frontend/                                (Tier 1: React.js Web UI)
    |-- package.json
    |-- vite.config.js
    |-- index.html
    `-- src/
        |-- main.jsx
        |-- App.jsx
        |-- api.js
        `-- components/
            |-- LoginPage.jsx
            `-- ProfilePage.jsx
```

---

## 3. Security Highlights

1. **One-Way Password Hashing**: Passwords are never stored in plaintext. Passwords are hashed using BCrypt before database persistence and verified at runtime using `BCryptPasswordEncoder.matches()`.
2. **Cryptographic Token Verification**: JWT tokens are signed using HMAC-SHA256 (`HmacSHA256`) with a configurable secret key (`JWT_SECRET`). Expired tokens and tampered signatures are rejected with HTTP 401.
3. **Stateless Session Security**: Spring Security disables session cookies and CSRF overhead for stateless JSON REST APIs (`SessionCreationPolicy.STATELESS`).
4. **Parameterized Queries**: Spring Data JPA repositories eliminate SQL injection vulnerabilities by binding inputs via prepared statements.
5. **Configurable Cross-Origin Resource Sharing (CORS)**: Restricts allowed origins via `CORS_ALLOWED_ORIGINS` to prevent unauthorized cross-site requests.
6. **Zero Client Secrets**: Sensitive database credentials and signing secrets remain strictly within Tier 2 and are passed via standard environment variables.

---

## 4. Default Seeded Admin Credentials

On first boot against a new RDS instance, the backend seeds:
- **Username**: `admin`
- **Password**: `admin@589`
- **Full Name**: `System Administrator`
- **Email**: `admin@devopsportal.com`
- **Role**: `ADMIN`
- **Department**: `Cloud & DevOps Engineering`

---

## 5. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Validates credentials; returns JWT token + user metadata | No |
| `GET` | `/api/profile` | Returns full admin profile + server hostname + app version | Yes (`Bearer <token>`) |
| `GET` | `/actuator/health` | Complete system health, disk space, and RDS status | No |
| `GET` | `/actuator/health/liveness` | Kubernetes / AWS ALB liveness probe | No |
| `GET` | `/actuator/health/readiness` | AWS ALB target group readiness probe | No |

---

## 6. AWS RDS & DevOps Deployment Guide

### A. Backend Build & Execution
```bash
# 1. Run automated unit tests using H2 in-memory DB (CI pipeline)
cd backend
mvn clean test -B

# 2. Package production executable JAR
mvn clean package -DskipTests -B

# 3. Run JAR on EC2 or container with AWS RDS environment variables
export RDS_HOSTNAME="your-rds-cluster.cxxxxxx.us-east-1.rds.amazonaws.com"
export RDS_PORT="3306"
export RDS_DB_NAME="adminportal"
export RDS_USERNAME="admin"
export RDS_PASSWORD="YourSecureRdsPassword!"
export JWT_SECRET="your-high-entropy-production-secret-min-32-bytes"

java -jar target/three-tier-backend.jar
```

### B. Frontend Build & Static Asset Serving
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Build production assets pointing to AWS ALB or backend URL
VITE_API_BASE_URL="https://api.yourcompany.com/api" npm run build

# 3. Output located in frontend/dist/ (deploy to AWS S3 + CloudFront or Nginx)
```

### C. AWS Health Check Configuration
- **Health Check Protocol**: HTTP
- **Health Check Path**: `/actuator/health/readiness`
- **Success Code**: `200`
- **Interval**: 10 seconds
- **Unhealthy Threshold**: 3 failures
