# merchant API

Payment Service Provider API built with NestJS, PostgreSQL, Redis/BullMQ.

## Architecture

- **api** — HTTP API server (port 3000), Swagger at `/docs`
- **worker** — BullMQ job processor (async KYB risk reviews)
- **kyb-mock** — Simulated KYB provider (port 4000)
- **postgres** — Application database
- **redis** — Job queue backend

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

## Running with Docker

```bash
# 1. Copy and configure environment
cp .env.example .env

# 2. Build and start all services
docker compose up --build

# 3. API is ready at http://localhost:3000
#    Swagger UI at http://localhost:3000/docs
```

To run in background:

```bash
docker compose up --build -d
docker compose logs -f api worker
```

To stop:

```bash
docker compose down
# To also remove the database volume:
docker compose down -v
```

## Running locally (without Docker)

Requires PostgreSQL on port 5433 and Redis on port 6379.

```bash
pnpm install

# Start API server
pnpm run start:dev api

# Start worker (separate terminal)
pnpm exec ts-node --esm apps/api/src/worker.ts
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5433` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASS` | Database password | `postgres` |
| `DB_NAME` | Database name | `merchant` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | Access token secret (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | — |
| `FIELD_ENCRYPTION_KEY` | AES-256-GCM key, exactly 64 hex chars | — |
| `KYB_MOCK_URL` | KYB mock service URL | `http://kyb-mock:4000` |
| `KYB_MOCK_API_KEY` | KYB mock API key | `mock-api-key` |

## API Overview

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Email + password → access + refresh tokens |
| `POST` | `/auth/refresh` | Refresh token → new access token |

### Merchant Applications (SALES role)

| Method | Path | Description |
|---|---|---|
| `POST` | `/merchants/applications` | Create draft |
| `GET` | `/merchants/applications` | List own applications |
| `GET` | `/merchants/applications/:id` | Get application |
| `PATCH` | `/merchants/applications/:id` | Update draft fields |
| `POST` | `/merchants/applications/:id/submit` | Submit for KYB review |

## KYB Simulation

Control the KYB outcome by setting `legalBusinessName` to a keyword:

| Keyword | Outcome |
|---|---|
| `approved` | Application approved |
| `flagged` | Application flagged for manual review |
| `rejected` | Application rejected |
| `outage` | Simulates provider outage (retried) |
| `slow` | 4-second delay, then approved |

## Seeding a User

The database is seeded automatically on first run via TypeORM `synchronize`. To create a user, call `POST /auth/login` after manually inserting one, or add a seeder script.
# merchant-system
