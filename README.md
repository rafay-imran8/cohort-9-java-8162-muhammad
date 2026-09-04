# Contact Management System

A full-stack contact management application built with Spring Boot and React. Users can create an account, sign in with JWT authentication, manage their contacts, search and paginate through contacts, view their profile, and change their password.

## Technology Stack

- **Backend:** Java 21, Spring Boot 4.1, Spring MVC, Spring Security, Spring Data JPA, Hibernate, JWT, PostgreSQL
- **Frontend:** React 19, React Router, Axios, Vite
- **Quality:** Maven tests, JaCoCo coverage, ESLint, SonarQube configuration

## Project Structure

```text
backend/    Spring Boot REST API
frontend/   React single-page application
```

## Prerequisites

- Java 21 or newer
- Node.js and npm
- PostgreSQL
- A PostgreSQL database named `contact_management`

Create the database before starting the backend:

```sql
CREATE DATABASE contact_management;
```

## Configuration

The backend reads database credentials and the JWT signing secret from environment variables:

```text
DB_USERNAME=your_postgres_username
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_long_random_secret
```

The API runs on `http://localhost:8080` by default. These values are configured in [backend/src/main/resources/application.properties](backend/src/main/resources/application.properties).

Configure the frontend API URL in `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080
```

Do not commit real passwords or JWT secrets. Use HTTPS for non-local deployments.

## Run Locally

Open two terminals from the repository root.

### 1. Start the backend

PowerShell:

```powershell
cd backend
$env:DB_USERNAME="your_postgres_username"
$env:DB_PASSWORD="your_postgres_password"
$env:JWT_SECRET="your_long_random_secret"
./mvnw.cmd spring-boot:run
```

On macOS or Linux, use `./mvnw` instead of `./mvnw.cmd` and export the variables with `export`.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The backend health check is available at [http://localhost:8080/health](http://localhost:8080/health).

## API Overview

The API base path is `/api/v1`. Authenticated requests use the JWT returned by login in an `Authorization: Bearer <token>` header.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Register a user |
| `POST` | `/api/v1/auth/login` | Authenticate and receive a JWT |
| `POST` | `/api/v1/auth/change` | Change the authenticated user's password |
| `GET` | `/api/v1/users/me` | Get the current user's profile |
| `GET` | `/api/v1/contacts` | List contacts; supports `search`, `page`, and `size` query parameters |
| `GET` | `/api/v1/contacts/{id}` | Get one contact |
| `POST` | `/api/v1/contacts` | Create a contact |
| `PUT` | `/api/v1/contacts/{id}` | Update a contact |
| `DELETE` | `/api/v1/contacts/{id}` | Delete a contact |

Contact list pagination defaults to `page=0` and `size=10`; page sizes must be between 1 and 100.

## Frontend Routes

- `/login` - Sign in
- `/register` - Create an account
- `/dashboard` - View and manage contacts
- `/contacts/:id` - View or edit a contact
- `/profile` - View the current profile
- `/change-password` - Change the account password

The contact, profile, and password pages require authentication.

## Testing and Builds

Run backend tests and generate the JaCoCo report:

```bash
cd backend
./mvnw test
./mvnw verify
```

On Windows, use `mvnw.cmd` in place of `./mvnw`.

Run frontend checks and create a production build:

```bash
cd frontend
npm run lint
npm run build
```

The backend coverage report is generated at `backend/target/site/jacoco/index.html` after `verify`. SonarQube settings are defined in [sonar-project.properties](sonar-project.properties).
