# AutoFlow Sri Lanka

## Overview
Web Based Vehicle Service and Fuel Station Management System.

The application uses a React/Vite frontend, a Spring Boot backend, and MySQL.

## Project Structure
- `frontend/` - React + Vite application
- `backend/` - Spring Boot Java backend
- `database/` - Database scripts; the `legacy/` directory contains historic SQL Server exports
- `docs/` - Documentation, requirements, architecture notes, and maintenance tools
- `assets/` - Static assets and resources

## Setup
### Backend
- Install JDK 21 and Maven, then navigate to `backend`.
- Copy `src/main/resources/application-local.properties.example` to
  `application-local.properties` and supply local secrets, or set the listed
  environment variables.
- Start with `mvn spring-boot:run`.

### Database
- Create a MySQL database (the default name is `autoflowsrilanka_db`). Hibernate
  currently creates/updates the application tables on startup.

### Frontend

- Navigate to `frontend` and run `npm install` followed by `npm run dev`.
- The development server runs on `http://localhost:3000` by default.

### Configuration

Never commit credentials. The backend reads the following environment variables:
`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`,
`ADMIN_REGISTRATION_SECRET`, and `CORS_ALLOWED_ORIGINS`. `JWT_SECRET` must be a
Base64-encoded key of at least 32 bytes. Admin registration is disabled until
`ADMIN_REGISTRATION_SECRET` is configured.
