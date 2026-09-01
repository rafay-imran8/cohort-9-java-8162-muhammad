# Contact Management System - Frontend

React frontend for the Contact Management System.

## Tech Stack

* React
* React Router
* Axios
* Vite
* CSS

## Prerequisites

Before running the frontend, make sure the Spring Boot backend is running and accessible.

The frontend communicates with the backend API through the configured API URL.

## Installation

From the `frontend` directory:

```bash
npm install
```

## Environment Configuration

Create a `.env` file based on `.env.example`.

Configure the backend API URL:

```env
VITE_API_URL=http://localhost:8080
```

For production deployments, use an HTTPS API URL.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at the URL displayed by Vite.

## Production Build

Create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Authentication

The frontend uses JWT-based authentication.

After successful login, the authentication token is stored by the frontend and automatically attached to authenticated API requests.

Protected routes require an authenticated user.

## Backend Requirement

The backend Spring Boot application must be running and accessible at the configured `VITE_API_URL` for login, registration, contact management, profile, and password operations to work correctly.
