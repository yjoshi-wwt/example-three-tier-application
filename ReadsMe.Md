When running via Docker Compose the `migrate` service handles this automatically on startup.
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate down
```

# Roll back the last migration
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate up

# Apply all pending migrations (run inside the db container or with DATABASE_URL set)
cd src/db
```bash

Migrations live in `src/db/migrations/` and use [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).

## Database migrations

After apply, `terraform output web_url` gives the public URL.
```

cd src/infrastructure
terraform init
terraform apply -var="project_id=my-project" \
                -var="api_image=gcr.io/my-project/api:latest" \
                -var="web_image=gcr.io/my-project/web:latest"
```bash

| `environment` | `dev`, `staging`, or `prod` (default: `dev`) |
| `region` | GCP region (default: `us-central1`) |
| `web_image` | Container image URI for the web frontend |
| `api_image` | Container image URI for the API (e.g. `gcr.io/PROJECT/api:TAG`) |
| `project_id` | GCP project ID |

| Variable | Description |
|----------|-------------|

### Required variables

- Service accounts and IAM bindings
- Secret Manager secret for the database URL
- Cloud Run services for the API and web frontend
- Cloud SQL PostgreSQL 17 instance (private IP)
- VPC network and subnet

The `src/infrastructure/` directory contains Terraform that provisions:

## Deploying to GCP

```
└── infrastructure/ # Terraform for GCP deployment
    ├── main.tf
    ├── variables.tf
    └── outputs.tf
├── web/            # Next.js frontend
│   ├── app/        # App Router pages and components
│   └── Dockerfile
├── db/             # Database migrations
│   ├── migrations/ # node-pg-migrate migration files
│   └── Dockerfile
├── api/            # Express REST API
│   ├── index.js    # Route handlers
│   ├── db.js       # PostgreSQL connection pool
│   └── Dockerfile
src/
```

## Project structure

| PATCH | `/tasks/:id` | Update a task (`{ "completed": true }` or `{ "title": "..." }`) |
| POST | `/tasks` | Create a task (`{ "title": "..." }`) |
| GET | `/tasks` | List all tasks |
| GET | `/health` | Health check |

| Method | Path | Description |
|--------|------|-------------|

### API endpoints

```bash
docker compose up --build
```

### Rebuild after code changes

```bash
docker compose down -v
```

# Stop and delete all data

```bash
docker compose down
```

# Stop containers (keeps the postgres_data volume)

### Stop and clean up

Once running, open [http://localhost:3000](http://localhost:3000).

4. **web** — Next.js frontend on port 3000 (exposed to host)
3. **api** — Express API on port 3001 (internal only)
2. **migrate** — runs `node-pg-migrate up` to apply schema migrations, then exits
1. **postgres** — PostgreSQL 17 database, waits until healthy

This starts four services in order:

```bash
docker compose up --build
```

### Start the stack

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)

### Prerequisites

## Running locally with Docker Compose

The app is a simple task manager (to-do list) that demonstrates how the three tiers communicate.

| Infrastructure | Terraform (GCP) | `src/infrastructure/` |
| Migrations | node-pg-migrate | `src/db/` |
| Database | PostgreSQL 17 | managed by Docker / Cloud SQL |
| API | Express 5, Node.js 22 | `src/api/` |
| Frontend | Next.js 16, React 19, Tailwind CSS | `src/web/` |

| Layer | Technology | Location |
|-------|-----------|----------|

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

## Architecture

A reference implementation of a three-tier web application: a Next.js frontend, an Express REST API, and a PostgreSQL database. It runs locally with Docker Compose and deploys to Google Cloud Platform (Cloud Run + Cloud SQL) via Terraform.

# example-three-tier-application
