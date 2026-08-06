# Application Files Documentation

This document provides a comprehensive listing and description of all files in the `src` folder of the example-three-tier-application.

---

## 1. API Layer Files (`src/api/`)

The API layer is a Node.js/Express backend service that handles task management operations.

### 1.1 `src/api/index.js`
**Purpose:** Main API server entry point
**Description:** 
- Express.js server running on port 3001
- Implements RESTful endpoints for task management:
  - `GET /health` - Health check endpoint
  - `GET /tasks` - Retrieve all tasks ordered by creation date
  - `POST /tasks` - Create a new task with title validation
  - `PATCH /tasks/:id` - Update task (toggle completion status or rename)
- Uses PostgreSQL database via `db.js` module
- Includes error handling and input validation

### 1.2 `src/api/db.js`
**Purpose:** Database connection module
**Description:**
- Exports a PostgreSQL connection pool using the `pg` library
- Reads `DATABASE_URL` from environment variables
- Provides a reusable pool for all database queries in the API

### 1.3 `src/api/package.json`
**Purpose:** Node.js project configuration and dependencies
**Description:**
- Project name: `api` (version 1.0.0)
- Main entry point: `index.js`
- Scripts:
  - `start` - Run the API server with Node.js
  - `dev` - Run the API server with file watching enabled
- Dependencies:
  - `express@^5.2.1` - Web framework
  - `pg@^8.21.0` - PostgreSQL client

### 1.4 `src/api/Dockerfile`
**Purpose:** Container image definition for the API service
**Description:**
- Base image: `node:22-alpine`
- Multi-stage build (implicit single stage)
- Installs production dependencies only (`npm ci --omit=dev`)
- Exposes port 3001
- Runs `node index.js` as the default command
- Optimized for production deployment

---

## 2. Database Layer Files (`src/db/`)

The database layer manages PostgreSQL schema migrations and initialization.

### 2.1 `src/db/package.json`
**Purpose:** Database migration tool configuration
**Description:**
- Project name: `db` (version 1.0.0)
- Uses `node-pg-migrate` for schema management
- Scripts:
  - `migrate` - Run pending migrations (up)
  - `migrate:down` - Rollback migrations (down)
- Dependencies:
  - `node-pg-migrate@^8.0.4` - Migration framework
  - `pg@^8.21.0` - PostgreSQL client

### 2.2 `src/db/Dockerfile`
**Purpose:** Container image for running database migrations
**Description:**
- Base image: `node:22-alpine`
- Installs production dependencies only
- Copies migration files into the container
- Default command: `npx node-pg-migrate up`
- Designed to run as a one-off job before API deployment
- Connects to an already-running PostgreSQL instance

### 2.3 `src/db/migrations/1718500000000_initial-schema.js`
**Purpose:** Initial database schema migration
**Description:**
- Creates the `users` table with:
  - `id` (serial primary key)
  - `email` (varchar 255, unique, not null)
  - `created_at` (timestamp, defaults to current time)
- Includes rollback function to drop the table
- Migration timestamp: 1718500000000

### 2.4 `src/db/migrations/1718500001000_create-tasks.js`
**Purpose:** Tasks table creation migration
**Description:**
- Creates the `tasks` table with:
  - `id` (serial primary key)
  - `title` (varchar 500, not null)
  - `completed` (boolean, defaults to false)
  - `created_at` (timestamp, defaults to current time)
- Includes rollback function to drop the table
- Migration timestamp: 1718500001000
- Executed after the initial schema migration

---

## 3. Web/Frontend Layer Files (`src/web/`)

The web layer is a Next.js React frontend application for the task management UI.

### 3.1 Configuration Files

#### 3.1.1 `src/web/package.json`
**Purpose:** Next.js project configuration and dependencies
**Description:**
- Project name: `web` (version 0.1.0)
- Scripts:
  - `dev` - Start development server
  - `build` - Build for production
  - `start` - Start production server
  - `lint` - Run ESLint
- Core dependencies:
  - `next@16.2.9` - React framework
  - `react@19.2.4` - React library
  - `react-dom@19.2.4` - React DOM library
- Dev dependencies:
  - `@tailwindcss/postcss@^4` - Tailwind CSS PostCSS plugin
  - `tailwindcss@^4` - Utility-first CSS framework
  - `typescript@^5` - TypeScript compiler
  - `eslint@^9` - Linting tool
  - `eslint-config-next@16.2.9` - Next.js ESLint configuration
  - Type definitions for Node, React, and React DOM

#### 3.1.2 `src/web/tsconfig.json`
**Purpose:** TypeScript compiler configuration
**Description:**
- Target: ES2017
- Strict mode enabled for type safety
- Module resolution: bundler
- JSX: react-jsx
- Path aliases: `@/*` maps to root directory
- Includes Next.js plugin for enhanced type checking
- Incremental compilation enabled

#### 3.1.3 `src/web/next.config.ts`
**Purpose:** Next.js configuration
**Description:**
- Output mode: `standalone` for optimized Docker deployments
- Enables self-contained builds without node_modules

#### 3.1.4 `src/web/eslint.config.mjs`
**Purpose:** ESLint configuration for code quality
**Description:**
- Uses Next.js core web vitals configuration
- Includes TypeScript support
- Custom global ignores for Next.js build artifacts:
  - `.next/`, `out/`, `build/`, `next-env.d.ts`

#### 3.1.5 `src/web/postcss.config.mjs`
**Purpose:** PostCSS configuration for CSS processing
**Description:**
- Integrates Tailwind CSS PostCSS plugin
- Enables Tailwind utility classes in the application

#### 3.1.6 `src/web/Dockerfile`
**Purpose:** Multi-stage container image for the web service
**Description:**
- **Stage 1 (deps):** Install dependencies
- **Stage 2 (builder):** Build the Next.js application
- **Stage 3 (runner):** Production runtime
  - Base image: `node:22-alpine`
  - Environment: NODE_ENV=production
  - Copies standalone build output
  - Exposes port 3000
  - Runs `node server.js` as default command

### 3.2 App Directory Files (`src/web/app/`)

#### 3.2.1 `src/web/app/layout.tsx`
**Purpose:** Root layout component for the Next.js application
**Description:**
- Imports Geist font family (sans and mono variants)
- Imports global styles (`globals.css`)
- Sets metadata: title and description
- Wraps all pages with HTML structure
- Applies Tailwind classes for styling:
  - `h-full antialiased` on html element
  - `min-h-full flex flex-col` on body element
- Provides consistent layout across all pages

#### 3.2.2 `src/web/app/page.tsx`
**Purpose:** Home page component displaying the to-do list UI
**Description:**
- Async component that fetches tasks on the server
- Displays a task management interface with:
  - Title: "To-Do List"
  - Form to add new tasks with title input and submit button
  - List of all tasks with:
    - Checkbox to toggle completion status
    - Task title with strikethrough styling when completed
    - Visual feedback for completed/incomplete states
  - Task counter showing completed vs total tasks
- Uses Tailwind CSS for responsive, dark-mode-aware styling
- Calls server actions: `getTasks`, `createTask`, `toggleTask`

#### 3.2.3 `src/web/app/actions.ts`
**Purpose:** Server-side actions for task operations
**Description:**
- Marked with `'use server'` directive for Next.js server actions
- Defines `Task` type interface with properties:
  - `id` (number)
  - `title` (string)
  - `completed` (boolean)
  - `created_at` (string)
- Functions:
  - `getTasks()` - Fetches all tasks from the API (no caching)
  - `createTask(formData)` - Creates a new task from form data
  - `toggleTask(id, completed)` - Updates task completion status
- Uses `revalidatePath('/')` to refresh the page after mutations
- API_URL configurable via environment variable (defaults to `http://localhost:3001`)

#### 3.2.4 `src/web/app/globals.css`
**Purpose:** Global styles and Tailwind CSS configuration
**Description:**
- Imports Tailwind CSS framework
- Defines CSS custom properties:
  - `--background` and `--foreground` colors
  - Font variables for Geist Sans and Mono
- Light mode: white background, dark foreground
- Dark mode: dark background, light foreground
- Applies base styles to body element
- Supports system dark mode preference

#### 3.2.5 `src/web/app/favicon.ico`
**Purpose:** Website favicon
**Description:**
- Binary image file for browser tab display
- Standard favicon format (ICO)

---

## 4. Infrastructure Files (`src/infrastructure/`)

The infrastructure layer defines Google Cloud Platform resources using Terraform.

### 4.1 `src/infrastructure/main.tf`
**Purpose:** Primary Terraform configuration for GCP infrastructure
**Description:**

#### Terraform Configuration
- Required version: >= 1.5
- Backend: Google Cloud Storage (GCS) with dynamic configuration
- Providers:
  - Google (~> 5.0) for GCP resources
  - Random (~> 3.0) for generating random values

#### VPC and Networking
- **VPC Network:** Custom VPC with manual subnet creation
- **Subnet:** Private subnet with configurable CIDR range
- **Private Services Access:** VPC peering for Cloud SQL
- **VPC Access Connector:** Enables Cloud Run to reach VPC resources
  - Min instances: 2, Max instances: 10
  - Machine type: e2-micro

#### Cloud SQL Database
- **Instance:** PostgreSQL 17 with:
  - Configurable machine tier (default: db-f1-micro)
  - Availability: REGIONAL for prod, ZONAL for dev
  - Auto-resizing SSD storage
  - Private IP only (no public access)
  - Automated backups for prod environment
  - Max connections: 100
  - Deletion protection for prod
- **Database:** Named "app"
- **User:** Named "app" with auto-generated 32-character password
- **Password:** Stored in Secret Manager

#### Secret Manager
- **Secret:** DATABASE_URL containing full connection string
- Format: `postgres://app:PASSWORD@PRIVATE_IP:5432/app`
- Auto-replicated across regions

#### Service Account
- **Cloud Run Service Account:** For running API and web services
- **IAM Roles:**
  - Cloud SQL Client (for database access)
  - Secret Manager Secret Accessor (for DATABASE_URL)

#### Cloud Run Services

**API Service:**
- Name: `{app_name}-{environment}-api`
- Image: Configurable via `var.api_image`
- Port: 3001
- Ingress: Internal Load Balancer only
- Scaling: Min 1 (prod) / 0 (dev), Max configurable
- VPC Access: ALL_TRAFFIC egress
- Environment variables:
  - DATABASE_URL (from Secret Manager)
  - PORT (3001)
- Resources: 1 CPU, 512Mi memory
- Health checks: Startup (5s interval, 10 retries) and liveness (30s interval, 3 retries)

**Web Service:**
- Name: `{app_name}-{environment}-web`
- Image: Configurable via `var.web_image`
- Port: 3000
- Ingress: All traffic (public)
- Scaling: Min 1 (prod) / 0 (dev), Max configurable
- VPC Access: PRIVATE_RANGES_ONLY egress
- Environment variables:
  - PORT (3000)
  - API_URL (from API service URI)
- Resources: 1 CPU, 512Mi memory
- Health checks: Startup (10s initial delay, 5s interval, 10 retries)
- IAM: Public access via `allUsers` invoker role

#### IAM Permissions
- Web service: Public access (allUsers can invoke)
- API service: Internal access only (Cloud Run service account can invoke)

### 4.2 `src/infrastructure/migration.tf`
**Purpose:** Cloud Run Job for database migrations
**Description:**
- **Job Name:** `{app_name}-{environment}-migrate`
- **Purpose:** One-off job to run database migrations
- **Execution:** Manual via `gcloud run jobs execute` or CI/CD pipeline
- **Timing:** Should run before API deployment
- **Configuration:**
  - Service account: Shared Cloud Run service account
  - Max retries: 3
  - VPC Access: ALL_TRAFFIC egress
  - Image: Configurable via `var.db_image`
  - Environment: DATABASE_URL from Secret Manager
  - Resources: 1 CPU, 256Mi memory
- **Input Variable:** `db_image` (required) - Container image for migrations

### 4.3 `src/infrastructure/variables.tf`
**Purpose:** Terraform input variables and validation
**Description:**

#### Required Variables
- **project_id** - GCP project ID (no default)
- **api_image** - Container image for API service (no default)
- **web_image** - Container image for web service (no default)

#### Optional Variables with Defaults
- **region** - GCP region (default: us-central1)
- **app_name** - Application name prefix (default: todo)
- **environment** - Deployment environment (default: dev)
  - Validation: Must be one of: dev, staging, prod
- **subnet_cidr** - Subnet CIDR range (default: 10.0.0.0/24)
- **connector_cidr** - VPC Access Connector CIDR (default: 10.0.1.0/28)
  - Note: Must be /28 and not overlap with subnet_cidr
- **db_tier** - Cloud SQL machine tier (default: db-f1-micro)
- **api_max_instances** - Max Cloud Run instances for API (default: 10)
- **web_max_instances** - Max Cloud Run instances for web (default: 10)

### 4.4 `src/infrastructure/outputs.tf`
**Purpose:** Terraform output values for deployment information
**Description:**

#### Public Outputs
- **web_url** - Public URL of the web frontend
- **api_url** - URL of the API service
- **db_private_ip** - Private IP address of Cloud SQL instance
- **db_instance_name** - Cloud SQL connection name
- **vpc_name** - Name of the VPC network
- **service_account_email** - Email of Cloud Run service account

#### Sensitive Outputs
- **db_url_secret_id** - Secret Manager secret ID for DATABASE_URL (marked sensitive)

---

## Summary

### Architecture Overview
- **API Layer:** Node.js/Express backend on Cloud Run (port 3001)
- **Web Layer:** Next.js React frontend on Cloud Run (port 3000)
- **Database Layer:** PostgreSQL 17 on Cloud SQL (private)
- **Infrastructure:** Google Cloud Platform with Terraform IaC

### Key Technologies
- **Backend:** Express.js, PostgreSQL, Node.js
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Infrastructure:** Terraform, Google Cloud Platform
- **Containerization:** Docker (multi-stage builds)
- **Migrations:** node-pg-migrate

### Deployment Flow
1. Build and push container images (API, Web, DB migration)
2. Initialize Terraform with GCS backend
3. Apply Terraform configuration to create GCP resources
4. Execute database migration job
5. Deploy API and Web services to Cloud Run
