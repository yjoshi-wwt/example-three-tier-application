# Context Probe: Three-Tier Application Infrastructure & Dependencies

**Generated:** 2025-01-01  
**Repository:** yjoshi-wwt/example-three-tier-application  
**Branch:** main

---

## Executive Summary

This document provides a comprehensive snapshot of the three-tier application's infrastructure architecture, deployment topology, and all locked dependency versions across the API, database, and web tiers. It serves as a reference for understanding the complete system composition and verifying dependency consistency.

---

## Architecture Overview

### Three-Tier Request Flow

```
Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL
```

The application is a task manager (to-do list) that demonstrates communication between all three tiers:
- Users interact with the **frontend** (Next.js) in their browser
- The frontend makes HTTP requests to the **API** (Express) to fetch and modify tasks
- The API queries and updates the **database** (PostgreSQL) to persist data

### Deployment Topology

**Local Development (Docker Compose):**
- `postgres:17-alpine` — PostgreSQL 17 database
- `migrate` — node-pg-migrate service for schema migrations
- `api` — Express REST API on port 3001 (internal only)
- `web` — Next.js frontend on port 3000 (exposed to host)

**Cloud Deployment (GCP via Terraform):**
- **VPC Network** — Custom VPC with private subnet (10.0.0.0/24)
- **Cloud SQL** — PostgreSQL 17 instance (private IP, ZONAL/REGIONAL based on environment)
- **Cloud Run Services** — API and Web frontend services
- **VPC Access Connector** — Enables Cloud Run to reach the VPC (10.0.1.0/28)
- **Secret Manager** — Stores DATABASE_URL for secure credential management
- **Service Accounts** — IAM-based access control for Cloud Run services

---

## Technology Stack

| Layer | Technology | Version | Location |
|-------|-----------|---------|----------|
| Frontend | Next.js | 16.2.9 | `src/web/` |
| Frontend | React | 19.2.4 | `src/web/` |
| Frontend | React DOM | 19.2.4 | `src/web/` |
| Frontend | Tailwind CSS | 4.3.1 | `src/web/` |
| Frontend | TypeScript | 5.9.3 | `src/web/` |
| Frontend | ESLint | 9.39.4 | `src/web/` |
| API | Express | 5.2.1 | `src/api/` |
| API | Node.js | 22 (base image) | Dockerfile |
| API | pg (PostgreSQL client) | 8.21.0 | `src/api/` |
| Database | PostgreSQL | 17 | Docker/Cloud SQL |
| Migrations | node-pg-migrate | 8.0.4 | `src/db/` |
| Migrations | pg (PostgreSQL client) | 8.21.0 | `src/db/` |
| Infrastructure | Terraform | >= 1.5 | `src/infrastructure/` |
| Infrastructure | Google Provider | ~5.0 | `src/infrastructure/` |
| Infrastructure | Random Provider | ~3.0 | `src/infrastructure/` |

---

## API Tier Dependencies

### Package: `src/api/package.json`

**Direct Dependencies:**
- `express@^5.2.1` — Web framework for REST API
- `pg@^8.21.0` — PostgreSQL client library

**Locked Versions (from package-lock.json):**

```json
{
  "express": "5.2.1",
  "pg": "8.21.0"
}
```

**Express 5.2.1 Dependency Tree (Key Transitive Dependencies):**
- `accepts@2.0.0` — HTTP content negotiation
- `body-parser@2.3.0` — Request body parsing middleware
- `content-disposition@1.1.0` — Content-Disposition header handling
- `content-type@1.0.5` — Content-Type header parsing
- `cookie@0.7.2` — Cookie parsing and serialization
- `cookie-signature@1.2.2` — Cookie signing
- `debug@4.4.3` — Debugging utility
- `depd@2.0.0` — Deprecation utility
- `encodeurl@2.0.0` — URL encoding
- `escape-html@1.0.3` — HTML escaping
- `etag@1.8.1` — ETag generation
- `finalhandler@2.1.1` — Final HTTP response handler
- `fresh@2.0.0` — HTTP freshness checking
- `http-errors@2.0.1` — HTTP error objects
- `merge-descriptors@2.0.0` — Object descriptor merging
- `mime-types@3.0.2` — MIME type utilities
- `on-finished@2.4.1` — HTTP request completion detection
- `once@1.4.0` — Function execution once
- `parseurl@1.3.3` — URL parsing
- `proxy-addr@2.0.7` — Proxy address parsing
- `qs@6.15.2` — Query string parsing
- `range-parser@1.2.1` — HTTP Range header parsing
- `router@2.2.0` — Express router
- `send@1.2.1` — Static file serving
- `serve-static@2.2.1` — Static file middleware
- `statuses@2.0.2` — HTTP status codes
- `type-is@2.1.0` — Content-Type checking
- `vary@1.1.2` — Vary header handling

**pg 8.21.0 Dependency Tree (Key Transitive Dependencies):**
- `pg-connection-string@2.13.0` — PostgreSQL connection string parsing
- `pg-pool@3.14.0` — Connection pooling
- `pg-protocol@1.14.0` — PostgreSQL wire protocol
- `pg-types@2.2.0` — PostgreSQL type conversion
- `pgpass@1.0.5` — .pgpass file parsing
- `split2@4.2.0` — Streaming line splitter

**API Endpoints:**
- `GET /health` — Health check (returns `{ status: 'ok' }`)
- `GET /tasks` — List all tasks (ordered by creation time)
- `POST /tasks` — Create a new task (requires non-empty `title` string)
- `PATCH /tasks/:id` — Update a task (supports partial updates: `completed` boolean, `title` string)

---

## Database Tier Dependencies

### Package: `src/db/package.json`

**Direct Dependencies:**
- `node-pg-migrate@^8.0.4` — Database migration tool
- `pg@^8.21.0` — PostgreSQL client library

**Locked Versions (from package-lock.json):**

```json
{
  "node-pg-migrate": "8.0.4",
  "pg": "8.21.0"
}
```

**node-pg-migrate 8.0.4 Dependency Tree (Key Transitive Dependencies):**
- `glob@11.1.0` — File globbing
- `yargs@17.7.2` — Command-line argument parsing
- `@isaacs/cliui@9.0.0` — CLI UI utilities
- `cliui@8.0.1` — CLI UI components
- `escalade@3.2.0` — Directory traversal
- `get-caller-file@2.0.5` — Caller file detection
- `require-directory@2.1.1` — Directory requiring
- `string-width@4.2.3` — String width calculation
- `strip-ansi@6.0.1` — ANSI escape sequence removal
- `wrap-ansi@7.0.0` — ANSI escape sequence wrapping
- `y18n@5.0.8` — Internationalization
- `yargs-parser@21.1.1` — Argument parsing

**pg 8.21.0** — Same as API tier (see above)

**Database Schema:**
- Migrations stored in `src/db/migrations/`
- Migration files use node-pg-migrate format
- Initial schema: `1718500000000_initial-schema.js`
- Tasks table: `1718500001000_create-tasks.js`

**Migration Commands:**
- `npm run migrate` — Apply all pending migrations
- `npm run migrate:down` — Roll back the last migration

---

## Web Tier Dependencies

### Package: `src/web/package.json`

**Direct Dependencies:**
- `next@16.2.9` — React framework with server-side rendering
- `react@19.2.4` — React library
- `react-dom@19.2.4` — React DOM rendering

**Dev Dependencies:**
- `@tailwindcss/postcss@^4` — Tailwind CSS PostCSS plugin
- `@types/node@^20` — TypeScript types for Node.js
- `@types/react@^19` — TypeScript types for React
- `@types/react-dom@^19` — TypeScript types for React DOM
- `eslint@^9` — JavaScript linter
- `eslint-config-next@16.2.9` — ESLint configuration for Next.js
- `tailwindcss@^4` — Utility-first CSS framework
- `typescript@^5` — TypeScript compiler

**Locked Versions (from package-lock.json):**

```json
{
  "next": "16.2.9",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "tailwindcss": "4.3.1",
  "typescript": "5.9.3",
  "eslint": "9.39.4"
}
```

**Next.js 16.2.9 Dependency Tree (Key Transitive Dependencies):**
- `@next/env@16.2.9` — Environment variable handling
- `@next/eslint-plugin-next@16.2.9` — ESLint plugin for Next.js
- `@next/swc-*` — SWC compiler binaries for various platforms
- `@swc/helpers@0.5.15` — SWC helper utilities
- `client-only@0.0.1` — Client-only code marker

**Tailwind CSS 4.3.1 Dependency Tree (Key Transitive Dependencies):**
- `@tailwindcss/node@4.3.1` — Tailwind CSS Node.js integration
- `@tailwindcss/oxide@4.3.1` — Tailwind CSS Rust-based compiler
- `@tailwindcss/postcss@4.3.1` — PostCSS plugin
- `lightningcss@1.32.0` — CSS parser and transformer
- `jiti@2.7.0` — Runtime TypeScript loader
- `magic-string@0.30.21` — String manipulation with source maps
- `source-map-js@1.2.1` — Source map utilities

**ESLint 9.39.4 Dependency Tree (Key Transitive Dependencies):**
- `@eslint/config-array@0.21.2` — Configuration array handling
- `@eslint/config-helpers@0.4.2` — Configuration helpers
- `@eslint/core@0.17.0` — ESLint core
- `@eslint/eslintrc@3.3.5` — ESLintRC configuration
- `@eslint/js@9.39.4` — ESLint JavaScript rules
- `@eslint/object-schema@2.1.7` — Object schema validation
- `@eslint/plugin-kit@0.4.1` — Plugin kit utilities
- `@humanfs/core@0.19.2` — Human-friendly file system
- `@humanfs/node@0.16.8` — Node.js file system implementation
- `@humanwhocodes/module-importer@1.0.1` — Module importing
- `@humanwhocodes/retry@0.4.3` — Retry logic
- `ajv@6.15.0` — JSON schema validator
- `chalk@4.1.2` — Terminal color output
- `cross-spawn@7.0.6` — Cross-platform process spawning
- `debug@4.4.3` — Debugging utility
- `espree@10.0.1` — JavaScript parser
- `globals@14.0.0` — Global variable names
- `ignore@5.2.0` — .gitignore-style pattern matching
- `import-fresh@3.2.1` — Fresh module importing
- `js-yaml@4.1.1` — YAML parser
- `minimatch@3.1.5` — Glob pattern matching
- `strip-json-comments@3.1.1` — JSON comment removal

**TypeScript 5.9.3 Dependency Tree (Key Transitive Dependencies):**
- `typescript` — TypeScript compiler (no transitive dependencies)

**React 19.2.4 & React DOM 19.2.4:**
- No transitive dependencies (peer dependencies only)

**Web Tier Features:**
- App Router (Next.js 13+ architecture)
- Server Actions for API communication
- Tailwind CSS for styling
- TypeScript for type safety
- ESLint for code quality

---

## Infrastructure (Terraform)

### Terraform Configuration: `src/infrastructure/`

**Required Version:**
```hcl
terraform {
  required_version = ">= 1.5"
}
```

**Required Providers:**
```hcl
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
```

**GCP Resources Provisioned:**

1. **VPC Network** (`google_compute_network.main`)
   - Name: `{app_name}-{environment}-vpc`
   - Auto-create subnetworks: disabled
   - Custom subnet: `{app_name}-{environment}-subnet` (10.0.0.0/24)

2. **Private Services Access** (`google_compute_global_address.private_services`)
   - Purpose: VPC_PEERING for Cloud SQL private connectivity
   - Address type: INTERNAL
   - Prefix length: 16

3. **VPC Access Connector** (`google_vpc_access_connector.main`)
   - Name: `{app_name}-{environment}-connector`
   - CIDR range: 10.0.1.0/28
   - Min instances: 2
   - Max instances: 10
   - Machine type: e2-micro

4. **Cloud SQL PostgreSQL Instance** (`google_sql_database_instance.main`)
   - Database version: POSTGRES_17
   - Tier: `db-f1-micro` (default, configurable)
   - Availability: ZONAL (dev/staging) or REGIONAL (prod)
   - Disk type: PD_SSD
   - Disk autoresize: enabled
   - Max connections: 100
   - Backups: enabled only in prod
   - Deletion protection: enabled only in prod
   - Private IP only (no public IP)

5. **Cloud SQL Database** (`google_sql_database.app`)
   - Name: `app`

6. **Cloud SQL User** (`google_sql_user.app`)
   - Username: `app`
   - Password: randomly generated (32 characters, no special chars)

7. **Secret Manager Secret** (`google_secret_manager_secret.db_url`)
   - Secret ID: `{app_name}-{environment}-db-url`
   - Replication: auto
   - Content: PostgreSQL connection string

8. **Service Account** (`google_service_account.cloud_run`)
   - Account ID: `{app_name}-{environment}-run`
   - Roles:
     - `roles/cloudsql.client` — Cloud SQL access
     - `roles/secretmanager.secretAccessor` — Secret Manager access

9. **Cloud Run Service: API** (`google_cloud_run_v2_service.api`)
   - Name: `{app_name}-{environment}-api`
   - Ingress: INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER (internal only)
   - Port: 3001
   - CPU: 1
   - Memory: 512Mi
   - Min instances: 1 (prod) or 0 (dev/staging)
   - Max instances: 10 (configurable)
   - Startup probe: GET /health (5s initial delay, 5s period, 10 retries)
   - Liveness probe: GET /health (30s period, 3 retries)
   - VPC Access: ALL_TRAFFIC egress

10. **Cloud Run Service: Web** (`google_cloud_run_v2_service.web`)
    - Name: `{app_name}-{environment}-web`
    - Ingress: INGRESS_TRAFFIC_ALL (public)
    - Port: 3000
    - CPU: 1
    - Memory: 512Mi
    - Min instances: 1 (prod) or 0 (dev/staging)
    - Max instances: 10 (configurable)
    - Startup probe: GET / (10s initial delay, 5s period, 10 retries)
    - VPC Access: PRIVATE_RANGES_ONLY egress
    - Environment: API_URL set to API service URI

11. **Cloud Run IAM Bindings**
    - Web service: public access (`allUsers` → `roles/run.invoker`)
    - API service: service account access (service account → `roles/run.invoker`)

12. **Cloud Run Job: Migrations** (`google_cloud_run_v2_job.migrate`)
    - Name: `{app_name}-{environment}-migrate`
    - Max retries: 3
    - CPU: 1
    - Memory: 256Mi
    - VPC Access: ALL_TRAFFIC egress

**Terraform Variables:**

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `project_id` | string | (required) | GCP project ID |
| `region` | string | `us-central1` | GCP region for all resources |
| `app_name` | string | `todo` | Application name prefix |
| `environment` | string | `dev` | Deployment environment (dev/staging/prod) |
| `subnet_cidr` | string | `10.0.0.0/24` | Main subnet CIDR range |
| `connector_cidr` | string | `10.0.1.0/28` | VPC Access Connector CIDR range |
| `db_tier` | string | `db-f1-micro` | Cloud SQL machine tier |
| `api_image` | string | (required) | Container image URI for API |
| `web_image` | string | (required) | Container image URI for Web |
| `api_max_instances` | number | 10 | Max Cloud Run instances for API |
| `web_max_instances` | number | 10 | Max Cloud Run instances for Web |

**Terraform Outputs:**

| Output | Description |
|--------|-------------|
| `web_url` | Public URL of the web frontend |
| `api_url` | URL of the API service |
| `db_private_ip` | Private IP address of the Cloud SQL instance |
| `db_instance_name` | Cloud SQL instance connection name |
| `vpc_name` | Name of the VPC network |
| `service_account_email` | Email of the Cloud Run service account |
| `db_url_secret_id` | Secret Manager secret ID (sensitive) |

---

## Docker Compose Configuration

**File:** `docker-compose.yml`

**Services:**

1. **postgres** (PostgreSQL 17 Alpine)
   - Image: `postgres:17-alpine`
   - Environment:
     - `POSTGRES_DB=app`
     - `POSTGRES_USER=app`
     - `POSTGRES_PASSWORD=app`
   - Volume: `postgres_data:/var/lib/postgresql/data`
   - Healthcheck: `pg_isready -U app -d app` (5s interval, 5s timeout, 5 retries)

2. **migrate** (Database Migrations)
   - Build context: `./src/db`
   - Environment: `DATABASE_URL=postgres://app:app@postgres:5432/app`
   - Depends on: `postgres` (service_healthy)
   - Restart policy: on-failure

3. **api** (Express REST API)
   - Build context: `./src/api`
   - Environment:
     - `PORT=3001`
     - `DATABASE_URL=postgres://app:app@postgres:5432/app`
   - Depends on: `migrate` (service_completed_successfully)
   - Expose: port 3001 (internal only)

4. **web** (Next.js Frontend)
   - Build context: `./src/web`
   - Environment:
     - `PORT=3000`
     - `API_URL=http://api:3001`
   - Ports: `3000:3000` (exposed to host)
   - Depends on: `api`

**Volumes:**
- `postgres_data` — Persistent PostgreSQL data storage

---

## CI/CD Pipeline

**File:** `.github/workflows/deploy.yml`

**Trigger Events:**
- Push to `main` branch
- Manual workflow dispatch with environment selection (dev/staging/prod)

**Jobs:**

1. **build** (Build & Push Container Images)
   - Runs on: `ubuntu-latest`
   - Authenticates to GCP via Workload Identity
   - Configures Docker for GCR
   - Builds and pushes three images:
     - `gcr.io/{PROJECT}/api:{SHA}` and `:latest`
     - `gcr.io/{PROJECT}/web:{SHA}` and `:latest`
     - `gcr.io/{PROJECT}/db:{SHA}` and `:latest`
   - Uses Docker layer caching

2. **infrastructure** (Terraform Apply)
   - Runs on: `ubuntu-latest`
   - Depends on: `build` job
   - Terraform version: `~1.5`
   - Initializes with GCS backend
   - Runs plan and apply with image URIs from build job

3. **migrate** (Run Database Migrations)
   - Runs on: `ubuntu-latest`
   - Depends on: `build` and `infrastructure` jobs
   - Executes Cloud Run Job: `{app_name}-{environment}-migrate`
   - Waits for job completion

---

## Dependency Version Summary

### Locked Versions by Tier

**API Tier (src/api/package-lock.json):**
- express: **5.2.1**
- pg: **8.21.0**

**Database Tier (src/db/package-lock.json):**
- node-pg-migrate: **8.0.4**
- pg: **8.21.0**

**Web Tier (src/web/package-lock.json):**
- next: **16.2.9**
- react: **19.2.4**
- react-dom: **19.2.4**
- tailwindcss: **4.3.1**
- typescript: **5.9.3**
- eslint: **9.39.4**

**Infrastructure (src/infrastructure/main.tf):**
- terraform: **>= 1.5**
- google provider: **~> 5.0**
- random provider: **~> 3.0**

---

## Key Architectural Decisions

1. **Three-Tier Separation:** Clear separation of concerns with independent deployment units
2. **Private Database:** Cloud SQL instance is private (no public IP), accessible only via VPC
3. **VPC Access Connector:** Enables Cloud Run services to reach the private VPC
4. **Service Accounts:** IAM-based access control instead of hardcoded credentials
5. **Secret Manager:** DATABASE_URL stored securely, injected at runtime
6. **Health Checks:** Startup and liveness probes on Cloud Run services
7. **Environment-Based Scaling:** Dev/staging scale to zero; prod maintains minimum instances
8. **Immutable Infrastructure:** Terraform manages all infrastructure as code
9. **Docker Compose for Local Dev:** Mirrors production architecture locally
10. **Node.js 22:** Latest LTS version for API and database tiers

---

## Verification Checklist

- [x] Express version 5.2.1 confirmed in src/api/package-lock.json
- [x] pg version 8.21.0 confirmed in src/api/package-lock.json
- [x] node-pg-migrate version 8.0.4 confirmed in src/db/package-lock.json
- [x] pg version 8.21.0 confirmed in src/db/package-lock.json
- [x] Next.js version 16.2.9 confirmed in src/web/package-lock.json
- [x] React version 19.2.4 confirmed in src/web/package-lock.json
- [x] React DOM version 19.2.4 confirmed in src/web/package-lock.json
- [x] Tailwind CSS version 4.3.1 confirmed in src/web/package-lock.json
- [x] TypeScript version 5.9.3 confirmed in src/web/package-lock.json
- [x] ESLint version 9.39.4 confirmed in src/web/package-lock.json
- [x] Terraform required_version >= 1.5 confirmed in src/infrastructure/main.tf
- [x] Google provider version ~> 5.0 confirmed in src/infrastructure/main.tf
- [x] Random provider version ~> 3.0 confirmed in src/infrastructure/main.tf

---

## Verification

This document was verified by re-reading the following package-lock files and Terraform configuration to confirm all versions are accurate and current:

### Package-Lock Files Checked

1. **src/api/package-lock.json** — Verified Express 5.2.1 and pg 8.21.0 locked versions
2. **src/db/package-lock.json** — Verified node-pg-migrate 8.0.4 and pg 8.21.0 locked versions
3. **src/web/package-lock.json** — Verified Next.js 16.2.9, React 19.2.4, React DOM 19.2.4, Tailwind CSS 4.3.1, TypeScript 5.9.3, and ESLint 9.39.4 locked versions

### Infrastructure Configuration Checked

4. **src/infrastructure/main.tf** — Verified Terraform required_version >= 1.5, Google provider ~> 5.0, and Random provider ~> 3.0

All versions documented in this Context Probe have been cross-referenced against the actual lock files and Terraform configuration files. The document accurately reflects the current state of all dependencies and infrastructure requirements as of the verification date.

---

## References

- **README.md** — Project overview and local development instructions
- **agents.md** — AI agent working guidelines and conventions
- **docker-compose.yml** — Local development orchestration
- **.github/workflows/deploy.yml** — CI/CD pipeline definition
- **src/infrastructure/main.tf** — GCP infrastructure provisioning
- **src/infrastructure/variables.tf** — Terraform input variables
- **src/infrastructure/outputs.tf** — Terraform output values
- **src/infrastructure/migration.tf** — Cloud Run Job for migrations
- **src/api/index.js** — Express API server and endpoints
- **src/api/db.js** — PostgreSQL connection pool
- **src/db/migrations/** — Database schema migrations
- **src/web/app/** — Next.js App Router pages and components

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-01  
**Status:** Verified and Complete
