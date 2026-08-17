# Infrastructure Notes

## Overview

This document provides a comprehensive summary of the three-tier application infrastructure, including the Docker Compose local development setup, technology stack with exact versions, API endpoints, and GCP Terraform configuration.

## Architecture

The application follows a three-tier architecture with linear request flow:

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

Each tier runs in its own Docker container and communicates over HTTP (frontend to API) or TCP (API to database).

## Technology Stack

### Frontend Tier
- **Framework**: Next.js 16.2.9
- **Runtime**: Node.js 22 (via Docker base image)
- **UI Library**: React 19.2.4
- **Styling**: Tailwind CSS 4.x
- **Type System**: TypeScript 5.x
- **Linting**: ESLint 9.x with Next.js config
- **Additional**: React DOM 19.2.4

### API Tier
- **Framework**: Express 5.2.1
- **Runtime**: Node.js 22
- **Database Driver**: pg 8.21.0
- **Type System**: CommonJS (no TypeScript)

### Database Tier
- **Database**: PostgreSQL 17 (Alpine Linux variant)
- **Migration Tool**: node-pg-migrate 8.0.4
- **Database Driver**: pg 8.21.0

### Infrastructure
- **IaC Tool**: Terraform ~1.5
- **Cloud Provider**: Google Cloud Platform (GCP)
- **Terraform Providers**:
  - Google Provider: ~5.0
  - Random Provider: ~3.0
- **State Backend**: Google Cloud Storage (GCS)

## Docker Compose Setup

### Local Development Orchestration

The `docker-compose.yml` file defines four services that start in dependency order:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 5s
      retries: 5

  migrate:
    build:
      context: ./src/db
    environment:
      DATABASE_URL: postgres://app:app@postgres:5432/app
    depends_on:
      postgres:
        condition: service_healthy
    restart: on-failure

  api:
    build:
      context: ./src/api
    environment:
      PORT: 3001
      DATABASE_URL: postgres://app:app@postgres:5432/app
    depends_on:
      migrate:
        condition: service_completed_successfully
    expose:
      - "3001"

  web:
    build:
      context: ./src/web
    environment:
      PORT: 3000
      API_URL: http://api:3001
    ports:
      - "3000:3000"
    depends_on:
      - api
```

**Startup Order**:
1. **postgres** — PostgreSQL 17 database with health check
2. **migrate** — Runs `node-pg-migrate up` to apply schema migrations, then exits
3. **api** — Express API on port 3001 (internal only, not exposed to host)
4. **web** — Next.js frontend on port 3000 (exposed to host)

**Database Configuration**:
- Database: `app`
- User: `app`
- Password: `app`
- Connection String: `postgres://app:app@postgres:5432/app`
- Persistent Volume: `postgres_data`

### Running Locally

```bash
# Start the stack
docker compose up --build

# Stop containers (keeps postgres_data volume)
docker compose down

# Stop and delete all data
docker compose down -v

# Rebuild after code changes
docker compose up --build
```

## API Endpoints

The API is not exposed directly to the host in Docker Compose; all external traffic goes through the web tier. However, the following endpoints are available internally:

| Method | Path | Description | Request Body | Response |
|--------|------|-------------|--------------|----------|
| GET | `/health` | Health check | N/A | `{ "status": "ok" }` |
| GET | `/tasks` | List all tasks | N/A | Array of task objects, ordered by `created_at` ASC |
| POST | `/tasks` | Create a task | `{ "title": "..." }` | Created task object (status 201) |
| PATCH | `/tasks/:id` | Update a task | `{ "completed": true }` or `{ "title": "..." }` | Updated task object or 404 if not found |

**API Implementation** (`src/api/index.js`):
- Listens on port 3001 (configurable via `PORT` env var)
- Uses `express.json()` middleware for request parsing
- Connects to PostgreSQL via `pg` connection pool
- Minimal error handling; database errors propagate as unhandled exceptions
- Input validation: POST `/tasks` requires non-empty string `title`
- Partial updates: PATCH endpoint allows updating only provided fields

## Database Schema

### Migrations

Database migrations are managed by `node-pg-migrate` and located in `src/db/migrations/`.

**Migration 1: Initial Schema** (`1718500000000_initial-schema.js`)
```javascript
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'serial', primaryKey: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
};
```

**Migration 2: Create Tasks Table** (`1718500001000_create-tasks.js`)
```javascript
exports.up = (pgm) => {
  pgm.createTable('tasks', {
    id: { type: 'serial', primaryKey: true },
    title: { type: 'varchar(500)', notNull: true },
    completed: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });
};
```

### Tables

**users**
- `id` (serial, primary key)
- `email` (varchar(255), not null, unique)
- `created_at` (timestamp, not null, default: now())

**tasks**
- `id` (serial, primary key)
- `title` (varchar(500), not null)
- `completed` (boolean, not null, default: false)
- `created_at` (timestamp, not null, default: now())

## GCP Terraform Configuration

### Overview

The Terraform configuration in `src/infrastructure/` provisions a complete three-tier application on Google Cloud Platform with the following components:

- VPC network and subnet
- Cloud SQL PostgreSQL 17 instance (private IP)
- Cloud Run services for API and web frontend
- Secret Manager secret for database URL
- Service accounts and IAM bindings
- VPC Access Connector for Cloud Run to reach the VPC

### Terraform Files

#### `main.tf`

**Terraform Configuration**:
```hcl
terraform {
  required_version = ">= 1.5"

  backend "gcs" {
    # bucket and prefix are supplied at init time via -backend-config flags
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}
```

**VPC Configuration**:
- Network: `${app_name}-${environment}-vpc` (auto_create_subnetworks: false)
- Subnet: `${app_name}-${environment}-subnet` with CIDR `10.0.0.0/24` (default)
- Private IP Google Access: enabled
- VPC Peering for Cloud SQL: configured via `google_compute_global_address` and `google_service_networking_connection`
- VPC Access Connector: `${app_name}-${environment}-connector` with CIDR `10.0.1.0/28` (default), min 2 instances, max 10 instances, machine type `e2-micro`

**Cloud SQL Configuration**:
- Instance Name: `${app_name}-${environment}-postgres`
- Database Version: PostgreSQL 17
- Database Name: `app`
- Database User: `app` (password auto-generated, 32 chars, no special chars)
- Machine Tier: `db-f1-micro` (default, configurable)
- Availability: ZONAL (dev/staging) or REGIONAL (prod)
- Disk: SSD with autoresize enabled
- Backup: enabled only in prod, starts at 03:00 UTC
- Max Connections: 100
- Deletion Protection: enabled only in prod
- IP Configuration: private IP only, no public IP

**Secret Manager**:
- Secret ID: `${app_name}-${environment}-db-url`
- Secret Value: `postgres://app:${password}@${private_ip}:5432/app`
- Replication: auto

**Service Account**:
- Account ID: `${app_name}-${environment}-run`
- Display Name: `${app_name} Cloud Run (${environment})`
- IAM Roles:
  - `roles/cloudsql.client` — access to Cloud SQL
  - `roles/secretmanager.secretAccessor` — access to database URL secret

**Cloud Run: API Service**:
- Name: `${app_name}-${environment}-api`
- Ingress: `INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER` (internal only)
- Scaling: min 0 (dev/staging) or 1 (prod), max 10 (configurable)
- VPC Access: connector with `ALL_TRAFFIC` egress
- Container Port: 3001
- Environment Variables:
  - `DATABASE_URL` — from Secret Manager (latest version)
  - `PORT` — 3001
- Resources: 1 CPU, 512 MB memory
- Startup Probe: GET `/health` on port 3001, initial delay 5s, period 5s, failure threshold 10
- Liveness Probe: GET `/health` on port 3001, period 30s, failure threshold 3

**Cloud Run: Web Service**:
- Name: `${app_name}-${environment}-web`
- Ingress: `INGRESS_TRAFFIC_ALL` (public)
- Scaling: min 0 (dev/staging) or 1 (prod), max 10 (configurable)
- VPC Access: connector with `PRIVATE_RANGES_ONLY` egress
- Container Port: 3000
- Environment Variables:
  - `PORT` — 3000
  - `API_URL` — from API service URI
- Resources: 1 CPU, 512 MB memory
- Startup Probe: GET `/` on port 3000, initial delay 10s, period 5s, failure threshold 10
- IAM: `roles/run.invoker` for `allUsers` (public access)

**Service Account Permissions**:
- Web service account can invoke API service (internal traffic)
- Web service account has Cloud SQL client role
- Web service account can access database URL secret

#### `variables.tf`

**Input Variables**:

```hcl
variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Application name used as a prefix for resource names"
  type        = string
  default     = "todo"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod"
  }
}

variable "subnet_cidr" {
  description = "CIDR range for the main subnet"
  type        = string
  default     = "10.0.0.0/24"
}

variable "connector_cidr" {
  description = "CIDR range for the VPC Access Connector (must be /28, not overlapping subnet_cidr)"
  type        = string
  default     = "10.0.1.0/28"
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "api_image" {
  description = "Container image for the API service (e.g. gcr.io/PROJECT/api:TAG)"
  type        = string
}

variable "web_image" {
  description = "Container image for the web service (e.g. gcr.io/PROJECT/web:TAG)"
  type        = string
}

variable "api_max_instances" {
  description = "Maximum number of Cloud Run instances for the API"
  type        = number
  default     = 10
}

variable "web_max_instances" {
  description = "Maximum number of Cloud Run instances for the web frontend"
  type        = number
  default     = 10
}
```

#### `outputs.tf`

**Output Values**:

```hcl
output "web_url" {
  description = "Public URL of the web frontend"
  value       = google_cloud_run_v2_service.web.uri
}

output "api_url" {
  description = "URL of the API service"
  value       = google_cloud_run_v2_service.api.uri
}

output "db_private_ip" {
  description = "Private IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.main.private_ip_address
}

output "db_instance_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "vpc_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.main.name
}

output "service_account_email" {
  description = "Email of the Cloud Run service account"
  value       = google_service_account.cloud_run.email
}

output "db_url_secret_id" {
  description = "Secret Manager secret ID holding the DATABASE_URL"
  value       = google_secret_manager_secret.db_url.secret_id
  sensitive   = true
}
```

#### `migration.tf`

**Cloud Run Job for Database Migrations**:

```hcl
variable "db_image" {
  description = "Container image for the db migration job (e.g. gcr.io/PROJECT/db:TAG)"
  type        = string
}

resource "google_cloud_run_v2_job" "migrate" {
  name     = "${local.name_prefix}-migrate"
  location = var.region

  template {
    template {
      service_account = google_service_account.cloud_run.email

      max_retries = 3

      vpc_access {
        connector = google_vpc_access_connector.main.id
        egress    = "ALL_TRAFFIC"
      }

      containers {
        image = var.db_image

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.db_url.secret_id
              version = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "256Mi"
          }
        }
      }
    }
  }
}
```

**Purpose**: One-off Cloud Run Job that runs database migrations before deploying the API. Executed manually or as part of CI/CD pipeline:
```bash
gcloud run jobs execute ${app_name}-${environment}-migrate --region ${region} --wait
```

### Deployment Variables

**Required at `terraform apply` time**:
- `project_id` — GCP project ID
- `api_image` — Container image URI for API (e.g., `gcr.io/PROJECT/api:TAG`)
- `web_image` — Container image URI for web (e.g., `gcr.io/PROJECT/web:TAG`)
- `db_image` — Container image URI for migrations (e.g., `gcr.io/PROJECT/db:TAG`)

**Optional (with defaults)**:
- `region` — GCP region (default: `us-central1`)
- `app_name` — Application name prefix (default: `todo`)
- `environment` — Deployment environment (default: `dev`, must be one of: dev, staging, prod)
- `subnet_cidr` — Subnet CIDR (default: `10.0.0.0/24`)
- `connector_cidr` — VPC Access Connector CIDR (default: `10.0.1.0/28`)
- `db_tier` — Cloud SQL machine tier (default: `db-f1-micro`)
- `api_max_instances` — Max Cloud Run instances for API (default: 10)
- `web_max_instances` — Max Cloud Run instances for web (default: 10)

### Terraform State Management

State is stored in Google Cloud Storage (GCS) with backend configuration supplied at init time:

```bash
terraform init \
  -backend-config="bucket=my-terraform-state-bucket" \
  -backend-config="prefix=terraform/dev"
```

## CI/CD Pipeline

The `.github/workflows/deploy.yml` workflow automates building, pushing, and deploying the application:

### Workflow Stages

**1. Build & Push Images**
- Authenticates to GCP using Workload Identity Federation
- Configures Docker for GCR (Google Container Registry)
- Builds and pushes three images:
  - `gcr.io/${PROJECT}/api:${SHA}` and `:latest`
  - `gcr.io/${PROJECT}/web:${SHA}` and `:latest`
  - `gcr.io/${PROJECT}/db:${SHA}` and `:latest`
- Uses Docker layer caching for faster builds

**2. Terraform Apply**
- Initializes Terraform with GCS backend
- Runs `terraform plan` and `terraform apply`
- Passes image URIs and environment variables to Terraform

**3. Database Migrations**
- Executes the Cloud Run migration job
- Waits for completion before considering deployment done

### Trigger Conditions

- **Automatic**: Push to `main` branch
- **Manual**: Workflow dispatch with environment selection (dev, staging, prod)

### Required Secrets

- `GCP_WORKLOAD_IDENTITY_PROVIDER` — Workload Identity Provider resource name
- `GCP_SERVICE_ACCOUNT` — Service account email for Workload Identity
- `GCP_PROJECT_ID` — GCP project ID
- `TF_STATE_BUCKET` — GCS bucket for Terraform state

## Dependency Versions Summary

### Frontend (Next.js)
- **next**: 16.2.9
- **react**: 19.2.4
- **react-dom**: 19.2.4
- **tailwindcss**: 4.x (dev)
- **@tailwindcss/postcss**: 4.x (dev)
- **typescript**: 5.x (dev)
- **eslint**: 9.x (dev)
- **eslint-config-next**: 16.2.9 (dev)
- **@types/node**: 20.x (dev)
- **@types/react**: 19.x (dev)
- **@types/react-dom**: 19.x (dev)

### API (Express)
- **express**: 5.2.1
- **pg**: 8.21.0

### Database Migrations
- **node-pg-migrate**: 8.0.4
- **pg**: 8.21.0

### Infrastructure
- **Terraform**: ~1.5
- **Google Provider**: ~5.0
- **Random Provider**: ~3.0

## Key Design Decisions

1. **Private Database**: Cloud SQL instance uses private IP only, accessible only from Cloud Run via VPC Access Connector
2. **Environment-Based Scaling**: Production uses minimum 1 instance (always running); dev/staging use minimum 0 (scales to zero)
3. **Secrets Management**: Database URL stored in Secret Manager, injected at runtime
4. **Internal API**: API service is internal-only; all external traffic routes through web frontend
5. **Migrations as Job**: Database migrations run as a separate Cloud Run Job, decoupled from API deployment
6. **Terraform State in GCS**: State stored remotely with environment-specific prefixes
7. **Docker Layer Caching**: CI/CD uses registry caching for faster builds

## Running Locally vs. Deploying to GCP

### Local Development
```bash
docker compose up --build
# Access at http://localhost:3000
```

### GCP Deployment
```bash
cd src/infrastructure
terraform init -backend-config="bucket=..." -backend-config="prefix=..."
terraform apply \
  -var="project_id=..." \
  -var="api_image=gcr.io/.../api:TAG" \
  -var="web_image=gcr.io/.../web:TAG" \
  -var="db_image=gcr.io/.../db:TAG"
```

Or trigger via GitHub Actions by pushing to `main` or using workflow dispatch.

## Troubleshooting

### Local Development
- **Migrate service keeps restarting**: Check database migrations for errors; review logs with `docker compose logs migrate`
- **API can't connect to database**: Verify `DATABASE_URL` environment variable and that postgres service is healthy
- **Web can't reach API**: Ensure `API_URL` is set to `http://api:3001` (internal Docker network)

### GCP Deployment
- **Cloud Run services failing to start**: Check startup probe configuration and container logs
- **Database connection errors**: Verify VPC Access Connector is configured and service account has `cloudsql.client` role
- **Migrations not running**: Ensure migration job has access to database URL secret and VPC connectivity

