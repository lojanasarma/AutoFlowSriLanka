# Web-based Vehicle Service and Fuel Station Management System

## SE2030 – Software Engineering

- **Institution:** Kandy UNI
- **Batch:** 01
- **Group ID:** 2026-Y2-S1-KU-01
- **Module:** SE2030 - Software Engineering
- **Project Type:** Group Project

---

## Project Overview

The Web-based Vehicle Service and Fuel Station Management System is designed to streamline the daily operations of vehicle service centers and fuel stations through a centralized web application. The system enables efficient management of customers, vehicles, service bookings, fuel inventory, billing, employee records, and reports.

---

## Team

- **Group:** SE2030 Software Engineering
- **Batch:** 01
- **Group ID:** 2026-Y2-S1-KU-01
- **Institution:** Kandy UNI

---

## Objectives

- Manage customer and vehicle information
- Schedule and track vehicle services
- Manage fuel inventory and sales
- Generate invoices and receipts
- Manage employees and user roles
- Produce reports and analytics

---

## Technologies

- **Frontend:** React, HTML5, CSS3, JavaScript / TypeScript
- **Backend:** Java 21, Spring Boot, Spring Data JPA, Spring Security (JWT)
- **Database:** MySQL
- **Build & Package Tools:** Maven, npm
- **Version Control:** Git, GitHub

---

## Setup

### Prerequisites

- JDK 21
- Apache Maven
- Node.js & npm
- MySQL Server

---

### Backend

- Install JDK 21 and Maven, then navigate to `backend`.
- Copy `src/main/resources/application-local.properties.example` to `src/main/resources/application-local.properties` and supply local secrets, or set the listed environment variables.
- Start with `mvn spring-boot:run`.

```bash
cd backend
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
mvn spring-boot:run
```

---

### Database

Create a MySQL database (the default name is `autoflowsrilanka_db`). Hibernate currently creates/updates the application tables on startup.

```sql
CREATE DATABASE autoflowsrilanka_db;
```

---

### Frontend

Navigate to `frontend` and run `npm install` followed by `npm run dev`.
The development server runs on `http://localhost:3000` by default.

```bash
cd frontend
npm install
npm run dev
```

---

## Configuration

Never commit credentials. The backend reads the following environment variables:
`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_REGISTRATION_SECRET`, and `CORS_ALLOWED_ORIGINS`.

- `JWT_SECRET` must be a Base64-encoded key of at least 32 bytes.
- Admin registration is disabled until `ADMIN_REGISTRATION_SECRET` is configured.

| Variable | Description |
|---|---|
| `DB_URL` | JDBC connection URL for MySQL (e.g., `jdbc:mysql://localhost:3306/autoflowsrilanka_db`) |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Base64-encoded secret key (minimum 32 bytes) |
| `ADMIN_REGISTRATION_SECRET` | Secret key required to register administrative accounts |
| `CORS_ALLOWED_ORIGINS` | Permitted frontend origins (default: `http://localhost:3000`) |

---

## Repository Structure

```
.
├── frontend/
├── backend/
├── database/
├── docs/
├── assets/
├── README.md
├── LICENSE
└── .gitignore
```

---

## License

This project is developed for academic purposes as part of the SE2030 Software Engineering module.
