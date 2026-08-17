# Infrastructure Notes

## Overview

This document summarizes the infrastructure architecture, local development setup, and GCP deployment configuration for the example-three-tier-application.

## Architecture

The application follows a three-tier architecture with clear separation of concerns:

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

Each tier runs in its own Docker container and communicates via HTTP (frontend to API) or TCP (API to database).

### Tier Breakdown

| Layer | Technology | Port | Location | Purpose |
|-------|-----------|------|----------|---------|
| Frontend | Next.js 16.2.9, React 19.2.4, Tailwind CSS 4 | 3000 | `src/web/` | User-facing web interface |
| API | Express 5.2.1, Node.js 22 | 3001 | `src/api/` | REST API for task management |
| Database | PostgreSQL 17 | 5432 | Docker / Cloud SQL | Persistent data storage |
| Migrations | node-pg-migrate 8.0.4 | N/A | `src/db/` | Schema versioning |
| Infrastructure | Terraform ~5.0 (Google), ~3.0 (Random) | N/A | `src/infrastructure/` | GCP resource provisioning |

## Local Development with Docker Compose

### Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- No need to install Node.js, PostgreSQL, or other dependencies locally

### Starting the Stack

```bash
docker compose up --build
```

This command orchestrates four services in dependency order:

1. **postgres** — PostgreSQL 17 Alpine image
   - Environment: `POSTGRES_DB=app`, `POSTGRES_USER=app`, `POSTGRES_PASSWORD=app`
   - Volume: `postgres_data:/var/lib/postgresql/data` (persists between runs)
   - Health check: `pg_isready -U app -d app` (5s interval, 5s timeout, 5 retries)
   - Waits for: None (starts first)

2. **migrate** — Database schema migration runner
   - Builds from: `src/db/Dockerfile`
   - Environment: `DATABASE_URL=postgres://app:app@postgres:5432/app`
   - Runs: `node-pg-migrate up` to apply all pending migrations
   - Waits for: `postgres` service to be healthy
   - Exits after: Migrations complete (does not stay running)

3. **api** — Express REST API server
   - Builds from: `src/api/Dockerfile`
   - Environment: `PORT=3001`, `DATABASE_URL=postgres://app:app@postgres:5432/app`
   - Exposes: Port 3001 (internal only, not mapped to host)
   - Waits for: `migrate` service to complete successfully
   - Runs: `node index.js` (listens on port 3001)

4. **web** — Next.js frontend server
   - Builds from: `src/web/Dockerfile`
   - Environment: `PORT=3000`, `API_URL=http://api:3001`
   - Ports: `3000:3000` (mapped to host)
   - Waits for: `api` service to be running
   - Runs: `next start` (listens on port 3000)

### Accessing the Application

- **Frontend**: http://localhost:3000
- **API**: Not directly exposed; accessible through the web container or by temporarily mapping port 3001

### Stopping and Cleanup

```bash
# Stop containers (keeps postgres_data volume)
docker compose down

# Stop and delete all data
docker compose down -v

# Rebuild after code changes
docker compose up --build
```

## Technology Stack with Exact Versions

### Frontend (src/web/)

**Package.json Dependencies:**
- `next`: 16.2.9
- `react`: 19.2.4
- `react-dom`: 19.2.4

**Package.json Dev Dependencies:**
- `@tailwindcss/postcss`: ^4 (latest 4.x)
- `@types/node`: ^20
- `@types/react`: ^19
- `@types/react-dom`: ^19
- `eslint`: ^9
- `eslint-config-next`: 16.2.9
- `tailwindcss`: ^4 (latest 4.x)
- `typescript`: ^5

**Package-lock.json Verified Versions:**
- `next`: 16.2.9 (resolved from npm registry)
- `react`: 19.2.4 (resolved from npm registry)
- `react-dom`: 19.2.4 (resolved from npm registry)

### API (src/api/)

**Package.json Dependencies:**
- `express`: ^5.2.1
- `pg`: ^8.21.0

**Package-lock.json Verified Versions:**
- `express`: 5.2.1 (resolved: https://registry.npmjs.org/express/-/express-5.2.1.tgz)
  - Integrity: sha512-hIS4idWWai69NezIdRt2xFVofaF4j+6INOpJlVOLDO8zXGpUVEVzIYk12UUi2JzjEzWL3IOAxcTubgz9Po0yXw==
- `pg`: 8.21.0 (resolved: https://registry.npmjs.org/pg/-/pg-8.21.0.tgz)
  - Integrity: sha512-AUP1EYJuHraQGsVoCQVIcM7TEJVGtDzxWtGFZd8rds9d+CCXlU5Js1rYgfLNvxy9iJrpHjGrRjoi/3BT9fRyiA==
  - Dependencies: pg-connection-string ^2.13.0, pg-pool ^3.14.0, pg-protocol ^1.14.0, pg-types 2.2.0, pgpass 1.0.5

### Database Migrations (src/db/)

**Package.json Dependencies:**
- `node-pg-migrate`: ^8.0.4
- `pg`: ^8.21.0

**Package-lock.json Verified Versions:**
- `node-pg-migrate`: 8.0.4 (resolved: https://registry.npmjs.org/node-pg-migrate/-/node-pg-migrate-8.0.4.tgz)
  - Integrity: sha512-HTlJ6fOT/2xHhAUtsqSN85PGMAqSbfGJNRwQF8+ZwQ1+sVGNUTl/ZGEshPsOI3yV22tPIyHXrKXr3S0JxeYLrg==
  - Dependencies: glob ~11.1.0, yargs ~17.7.0
- `pg`: 8.21.0 (same as API tier)

### Database

- **PostgreSQL**: 17 (Alpine image: `postgres:17-alpine`)
- **Default credentials**: user=`app`, password=`app`, database=`app`

### Infrastructure (Terraform)

**Terraform Version**: >= 1.5

**Required Providers:**
- `google`: ~> 5.0 (Hashicorp Google provider)
- `random`: ~> 3.0 (Hashicorp Random provider)

**Backend**: Google Cloud Storage (GCS)
- Bucket and prefix supplied at init time via `-backend-config` flags
- Example: `terraform init -backend-config="bucket=my-tf-state" -backend-config="prefix=terraform/dev"`

## API Endpoints

The Express API exposes the following REST endpoints:

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/health` | Health check | None | `{ "status": "ok" }` |
| GET | `/tasks` | List all tasks | None | Array of task objects, ordered by creation time |
| POST | `/tasks` | Create a new task | `{ "title": "string" }` | Created task object (201) |
| PATCH | `/tasks/:id` | Update a task | `{ "completed": boolean }` or `{ "title": "string" }` | Updated task object (200) or 404 if not found |

### Task Object Schema

```json
{
  "id": 1,
  "title": "Example task",
  "completed": false,
  "created_at": "2024-06-15T12:34:56.000Z"
}
```

### Input Validation

- **POST /tasks**: `title` must be a non-empty string (trimmed)
- **PATCH /tasks/:id**: Supports partial updates; only provided fields are changed
- **Error responses**: Minimal error handling; database errors may propagate as unhandled exceptions

## Database Schema

### Migrations

Migrations are stored in `src/db/migrations/` and use node-pg-migrate format.

**Migration 1718500000000_initial-schema.js:**
- Creates `users` table with columns: `id` (serial PK), `email` (varchar 255, unique), `created_at` (timestamp, default now())

**Migration 1718500001000_create-tasks.js:**
- Creates `tasks` table with columns:
  - `id` (serial, primary key)
  - `title` (varchar 500, not null)
  - `completed` (boolean, not null, default false)
  - `created_at` (timestamp, not null, default now())

### Running Migrations

**Locally (via Docker Compose):**
- Automatic: The `migrate` service runs `node-pg-migrate up` on startup

**Manually:**
```bash
cd src/db
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate up
```

**Rollback:**
```bash
DATABASE_URL=postgres://app:app@localhost:5432/app npx node-pg-migrate down
```

## GCP Deployment with Terraform

### Overview

The Terraform configuration in `src/infrastructure/` provisions a complete three-tier application on Google Cloud Platform:

- **VPC Network**: Private network with subnet and VPC Access Connector
- **Cloud SQL**: PostgreSQL 17 instance (private IP, optional backups)
- **Cloud Run**: Two services (API and Web frontend)
- **Secret Manager**: Stores database connection URL
- **Service Accounts**: IAM roles for Cloud Run services
- **Load Balancing**: Internal load balancer for API, public load balancer for Web

### Required Variables

Create `terraform.tfvars` (copy from `terraform.tfvars.example`):

```hcl
project_id  = "my-gcp-project-id"
region      = "us-central1"
app_name    = "todo"
environment = "dev"
db_tier     = "db-f1-micro"
api_image   = "gcr.io/my-gcp-project-id/api:latest"
web_image   = "gcr.io/my-gcp-project-id/web:latest"
db_image    = "gcr.io/my-gcp-project-id/db:latest"
```

### Optional Variables

```hcl
subnet_cidr       = "10.0.0.0/24"        # Default: 10.0.0.0/24
connector_cidr    = "10.0.1.0/28"        # Default: 10.0.1.0/28 (must be /28)
api_max_instances = 10                   # Default: 10
web_max_instances = 10                   # Default: 10
```

### Resource Breakdown

#### VPC & Networking

- **google_compute_network.main**: VPC network (no auto-created subnets)
- **google_compute_subnetwork.main**: Subnet with CIDR `10.0.0.0/24` (configurable)
- **google_compute_global_address.private_services**: Reserved IP range for VPC peering (16-bit prefix)
- **google_service_networking_connection.private_services**: Enables private services access for Cloud SQL
- **google_vpc_access_connector.main**: Allows Cloud Run to reach the VPC
  - Machine type: `e2-micro`
  - Min instances: 2
  - Max instances: 10
  - CIDR: `10.0.1.0/28` (configurable, must not overlap subnet)

#### Cloud SQL

- **google_sql_database_instance.main**: PostgreSQL 17 instance
  - Tier: `db-f1-micro` (configurable, use `db-g1-small` or `db-custom-*` for production)
  - Availability: ZONAL (dev/staging) or REGIONAL (prod)
  - Disk: SSD, auto-resize enabled
  - Max connections: 100
  - Backups: Enabled only in prod, starts at 03:00 UTC
  - Deletion protection: Enabled only in prod
  - Private IP: Connected to VPC, no public IP

- **google_sql_database.app**: Database named `app`

- **google_sql_user.app**: Database user `app` with randomly generated 32-character password (no special chars)

- **random_password.db**: Generates secure password for database user

#### Secret Manager

- **google_secret_manager_secret.db_url**: Stores database connection URL
  - Secret ID: `{app_name}-{environment}-db-url` (e.g., `todo-dev-db-url`)
  - Replication: Automatic

- **google_secret_manager_secret_version.db_url**: Secret version containing connection string
  - Format: `postgres://app:{password}@{private_ip}:5432/app`

#### Service Account & IAM

- **google_service_account.cloud_run**: Service account for Cloud Run services
  - Account ID: `{app_name}-{environment}-run` (e.g., `todo-dev-run`)

- **google_project_iam_member.cloud_run_sql**: Grants `roles/cloudsql.client` to service account

- **google_secret_manager_secret_iam_member.cloud_run_db_url**: Grants `roles/secretmanager.secretAccessor` to service account

#### Cloud Run: API Service

- **google_cloud_run_v2_service.api**: Express API service
  - Name: `{app_name}-{environment}-api` (e.g., `todo-dev-api`)
  - Ingress: `INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER` (not publicly accessible)
  - Min instances: 1 (prod) or 0 (dev/staging)
  - Max instances: 10 (configurable)
  - CPU: 1
  - Memory: 512Mi
  - Container port: 3001
  - Environment variables:
    - `DATABASE_URL`: Injected from Secret Manager
    - `PORT`: 3001
  - Startup probe: GET `/health` (5s initial delay, 5s period, 10 retries)
  - Liveness probe: GET `/health` (30s period, 3 retries)
  - VPC Access: Connector with `ALL_TRAFFIC` egress

#### Cloud Run: Web Service

- **google_cloud_run_v2_service.web**: Next.js frontend service
  - Name: `{app_name}-{environment}-web` (e.g., `todo-dev-web`)
  - Ingress: `INGRESS_TRAFFIC_ALL` (publicly accessible)
  - Min instances: 1 (prod) or 0 (dev/staging)
  - Max instances: 10 (configurable)
  - CPU: 1
  - Memory: 512Mi
  - Container port: 3000
  - Environment variables:
    - `PORT`: 3000
    - `API_URL`: Injected from API service URI
  - Startup probe: GET `/` (10s initial delay, 5s period, 10 retries)
  - VPC Access: Connector with `PRIVATE_RANGES_ONLY` egress
  - Depends on: API service (waits for API to be deployed first)

#### IAM Bindings

- **google_cloud_run_v2_service_iam_member.web_public**: Allows unauthenticated access to web service
  - Role: `roles/run.invoker`
  - Member: `allUsers`

- **google_cloud_run_v2_service_iam_member.api_invoker**: Allows web service to invoke API
  - Role: `roles/run.invoker`
  - Member: Service account email

#### Cloud Run Job: Database Migrations

- **google_cloud_run_v2_job.migrate**: One-off job for running database migrations
  - Name: `{app_name}-{environment}-migrate` (e.g., `todo-dev-migrate`)
  - Image: `db_image` variable
  - Max retries: 3
  - CPU: 1
  - Memory: 256Mi
  - Environment: `DATABASE_URL` from Secret Manager
  - VPC Access: Connector with `ALL_TRAFFIC` egress
  - Execute manually: `gcloud run jobs execute todo-dev-migrate --region us-central1 --wait`

### Outputs

After `terraform apply`, retrieve outputs with:

```bash
terraform output web_url          # Public URL of web frontend
terraform output api_url          # URL of API service
terraform output db_private_ip    # Private IP of Cloud SQL instance
terraform output db_instance_name # Cloud SQL connection name
terraform output vpc_name         # VPC network name
terraform output service_account_email  # Service account email
terraform output db_url_secret_id # Secret Manager secret ID (sensitive)
```

### Deployment Workflow

1. **Build and push container images:**
   ```bash
   docker build -t gcr.io/$PROJECT/api:latest ./src/api
   docker build -t gcr.io/$PROJECT/web:latest ./src/web
   docker build -t gcr.io/$PROJECT/db:latest ./src/db
   docker push gcr.io/$PROJECT/api:latest
   docker push gcr.io/$PROJECT/web:latest
   docker push gcr.io/$PROJECT/db:latest
   ```

2. **Initialize Terraform:**
   ```bash
   cd src/infrastructure
   terraform init -backend-config="bucket=my-tf-state" -backend-config="prefix=terraform/dev"
   ```

3. **Plan and apply:**
   ```bash
   terraform plan -var-file=terraform.tfvars
   terraform apply -var-file=terraform.tfvars
   ```

4. **Run database migrations:**
   ```bash
   gcloud run jobs execute todo-dev-migrate --region us-central1 --wait
   ```

5. **Access the application:**
   ```bash
   terraform output web_url
   ```

## CI/CD Pipeline (.github/workflows/deploy.yml)

The GitHub Actions workflow automates building, pushing, and deploying to GCP:

### Trigger Events

- **Push to main branch**: Deploys to `dev` environment
- **Manual workflow dispatch**: Choose environment (dev, staging, prod)

### Jobs

1. **build**: Build and push container images to GCR
   - Authenticates to GCP via Workload Identity Federation
   - Builds API, Web, and DB images with Docker Buildx
   - Pushes to `gcr.io/{project}/{service}:{sha}` and `:latest`
   - Uses layer caching for faster builds

2. **infrastructure**: Provision/update GCP resources with Terraform
   - Depends on: `build` job
   - Initializes Terraform with GCS backend
   - Runs `terraform plan` and `terraform apply`
   - Passes image URIs from build job

3. **migrate**: Run database migrations on Cloud Run Job
   - Depends on: `build` and `infrastructure` jobs
   - Executes the migration job and waits for completion

### Environment Variables

- `REGION`: `us-central1`
- `APP_NAME`: `todo`

### Secrets Required

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Workload Identity Provider resource name
- `GCP_SERVICE_ACCOUNT`: Service account email for GitHub Actions
- `GCP_PROJECT_ID`: GCP project ID
- `TF_STATE_BUCKET`: GCS bucket for Terraform state

## Development Conventions

### Migrations

- **Append-only**: Never edit an existing migration file; create a new one
- **Naming**: Use Unix timestamp prefix (e.g., `1718500000000_description.js`)
- **Format**: Use node-pg-migrate API (`pgm.createTable`, `pgm.dropTable`, etc.)

### Environment Variables

All configuration is passed via environment variables; no hardcoded values:

| Service | Variable | Default | Purpose |
|---------|----------|---------|---------|
| API | `PORT` | 3001 | Server port |
| API | `DATABASE_URL` | None (required) | PostgreSQL connection string |
| Web | `PORT` | 3000 | Server port |
| Web | `API_URL` | `http://localhost:3001` | API endpoint URL |
| DB | `DATABASE_URL` | None (required) | PostgreSQL connection string |

### Node.js & PostgreSQL Versions

- **Node.js**: 22 (specified in Dockerfiles)
- **PostgreSQL**: 17 (Alpine image)
- Match these versions in any new Dockerfiles or dependencies

### API Design

- **Health check**: GET `/health` returns `{ "status": "ok" }`
- **Error handling**: Minimal; database errors may propagate
- **Input validation**: POST validates non-empty title; PATCH allows partial updates
- **Ordering**: GET `/tasks` returns tasks ordered by `created_at ASC`

## Troubleshooting

### Docker Compose Issues

- **"postgres service is unhealthy"**: Wait for health check to pass (up to 25 seconds)
- **"migrate service keeps restarting"**: Check `DATABASE_URL` and database credentials
- **"API cannot connect to database"**: Ensure `postgres` service is healthy before `api` starts

### Terraform Issues

- **"Error: Error creating Cloud SQL instance"**: Ensure VPC peering is configured correctly
- **"Error: Error creating Cloud Run service"**: Check that container image exists in GCR
- **"Error: Error acquiring the state lock"**: Another Terraform operation is in progress

### Application Issues

- **"Cannot fetch tasks"**: Verify API is running and database migrations have completed
- **"API returns 404 for task"**: Check that task ID exists in database
- **"Web frontend shows blank page"**: Check browser console for API URL errors

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [node-pg-migrate Documentation](https://salsita.github.io/node-pg-migrate/)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
