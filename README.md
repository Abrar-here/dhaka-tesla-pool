# Dhaka Tesla Pool 🚗⚡

> Share a seat. Split the fare. Survive Dhaka traffic.

A ride-pooling MVP built for the RoBenDevs internship challenge — passengers
request rides, get automatically pooled with others heading the same way,
and split the fare; drivers accept pooled requests and run them through a
full trip lifecycle.

## Live Demo

- Frontend: _(link added after deployment)_
- Backend API: _(link added after deployment)_

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Atlas) with Mongoose
- **Auth:** JWT + bcrypt
- **Testing:** Jest + Supertest + mongodb-memory-server
- **Containerization:** Docker (backend)

## Architecture

See [`docs/architecture-diagram.png`](docs/architecture-diagram.png) and
[`docs/erd-diagram.png`](docs/erd-diagram.png) for the system design, drawn
before implementation began (see [`docs/SCHEMA.md`](docs/SCHEMA.md) for the
full written schema and design rationale, including how the "last seat"
race condition is prevented atomically at the database level).

Browser → React Frontend → Node.js + Express API → MongoDB

## Project Structure

dhaka-tesla-pool/
├── backend/
│ ├── src/
│ │ ├── models/ # Mongoose schemas
│ │ ├── services/ # Business logic (fare calc, pooling, state machine, auth)
│ │ ├── controllers/ # HTTP request handlers
│ │ ├── routes/ # Express route definitions
│ │ ├── middleware/ # Auth, error handling
│ │ └── utils/ # Constants, error classes, seed script
│ ├── tests/ # Jest test suites
│ └── Dockerfile
├── frontend/
│ └── src/
│ ├── pages/ # Login, Register, Passenger/Driver dashboards
│ ├── context/ # AuthContext
│ ├── api/ # API client + endpoint functions
│ └── theme.js # Design tokens
├── docs/ # Schema doc, architecture diagram, ERD
└── docker-compose.yml

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- A MongoDB Atlas account (free tier) or local MongoDB instance
- npm

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/dhaka-tesla-pool.git
cd dhaka-tesla-pool
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (see `.env.example` at the project
root for the full list of variables):
