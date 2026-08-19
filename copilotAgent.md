# Working with GitHub Copilot on this repo

This guide covers how to use [GitHub Copilot](https://github.com/features/copilot) effectively with this codebase, including Copilot Chat, Copilot in IDE, and Copilot CLI. It provides patterns and prompts for AI-assisted development on three-tier applications.

## Getting started with GitHub Copilot

GitHub Copilot is available in multiple forms:

- **Copilot in IDE** — Available as extensions for VS Code, JetBrains IDEs, Neovim, and others. Provides inline code suggestions and chat.
- **Copilot Chat** — Web-based chat interface at [github.com/copilot](https://github.com/copilot) for conversational coding assistance.
- **Copilot CLI** — Command-line tool for explaining and generating shell commands.

To get started with this repo:

1. Install Copilot in your IDE of choice (VS Code recommended)
2. Open the repository folder
3. Use `@workspace` in Copilot Chat to give it context about the entire project
4. Start with scoped, specific tasks rather than broad requests

## Suggested prompts for common tasks

### Understanding the codebase

```
@workspace Explain how a task flows from the browser through the web tier, to the API, and into the database.
```

```
@workspace What tables exist in the database and what are their schemas?
```

```
@workspace Walk me through what happens when docker compose up runs, in order.
```

```
@workspace Show me the structure of the three-tier architecture and how each tier communicates.
```

### Adding features

```
@workspace Add a DELETE /tasks/:id endpoint to the API and wire it up to a delete button in the frontend.
```

```
@workspace Add a due_date column to the tasks table. Create the migration, update the API to accept and return it, and show it in the UI.
```

```
@workspace Add input validation to the POST /tasks endpoint so that titles longer than 200 characters are rejected with a 422 status.
```

```
@workspace Add a priority field to tasks. Update the database schema, API endpoints, and frontend UI to support it.
```

### Database migrations

```
@workspace Create a node-pg-migrate migration that adds a priority column (integer, default 0) to the tasks table.
```

```
@workspace Show me all the migrations that have been applied and what schema they created.
```

```
@workspace I need to add a new column to the tasks table. What's the process for creating and running a migration?
```

### Docker and infrastructure

```
@workspace The migrate service keeps restarting. Read the Dockerfile and docker-compose.yml and tell me why.
```

```
@workspace Add a .env.example file documenting all environment variables used across the three services.
```

```
@workspace Explain the Terraform in src/infrastructure/ and what GCP resources it creates.
```

```
@workspace How do I run the application locally with docker-compose?
```

### Code review and cleanup

```
@workspace Review the API's error handling. Are there cases where the server could crash or return an unhelpful error?
```

```
@workspace Is there any N+1 query risk in the API? Check all database calls.
```

```
@workspace Check the frontend for accessibility issues and suggest improvements.
```

## Using Copilot Chat with slash commands

GitHub Copilot Chat supports slash commands for specific tasks:

### `/explain` — Understand code

Select code in your editor and use `/explain` to get a detailed explanation:

```
/explain
// Explains the selected code block
```

### `/fix` — Fix problems

When you have an error or issue, use `/fix`:

```
/fix
// Suggests a fix for the selected code or error message
```

### `/generate` — Create code

Use `/generate` to create new code based on context:

```
/generate a function that validates task titles
```

### `/tests` — Write tests

Generate test cases for your code:

```
/tests
// Generates test cases for the selected function
```

### `/doc` — Add documentation

Generate comments and documentation:

```
/doc
// Adds JSDoc comments to the selected function
```

## Copilot in IDE inline suggestions

Copilot provides real-time inline suggestions as you type:

- **Accept suggestion** — Press `Tab` or `Cmd+Right Arrow`
- **Reject suggestion** — Press `Esc`
- **Next suggestion** — Press `Alt+]` (or `Opt+]` on Mac)
- **Previous suggestion** — Press `Alt+[` (or `Opt+[` on Mac)

### Tips for better inline suggestions

1. **Write clear variable and function names** — Copilot uses naming conventions to infer intent
2. **Add comments above the code** — Describe what you want to do
3. **Provide context** — Keep related code visible in the editor
4. **Use type hints** — In TypeScript/JSDoc, explicit types help Copilot understand your intent

Example:

```javascript
// Fetch all tasks from the API and filter by completion status
async function getTasksByStatus(completed) {
  // Copilot will suggest the implementation
}
```

## Copilot CLI for shell commands

Use Copilot CLI to understand and generate shell commands:

```bash
# Explain a command
gh copilot explain "docker compose up"

# Generate a command
gh copilot suggest "list all running docker containers"
```

## General AI-assisted development tips

### Give context, not just a command

Instead of:
> "Fix the bug"

Try:
> "The PATCH /tasks/:id endpoint returns 200 even when the id doesn't exist. Fix it to return 404."

Copilot can find the relevant file, but telling it which endpoint and what the expected behavior is saves a round-trip.

### Use @workspace for multi-file context

When working on features that span multiple files, use `@workspace` in Copilot Chat to give it full project context:

```
@workspace I need to add a status field to tasks. What files need to change?
```

### Scope changes to one tier at a time

Three-tier apps have a natural seam at each layer boundary. When adding a feature, ask Copilot to do one layer at a time and verify each before moving on:

1. **Migration first** — get the schema right
2. **API next** — add the endpoint and test it with curl
3. **Frontend last** — wire up the UI

### Use Copilot to understand errors

When you get an error, select the error message and use `/explain`:

```
/explain
// Copilot explains what the error means and suggests fixes
```

### Ask for explanations before changes

Before a risky change (schema migration, refactor), ask Copilot to explain what it plans to do:

```
@workspace Before you make any changes, explain your plan for adding user authentication to this app.
```

### Use inline suggestions for boilerplate

Copilot excels at generating boilerplate code. Let it handle:

- Test file structure
- Component scaffolding
- API endpoint handlers
- Migration file templates

### Review generated code carefully

Always review Copilot's suggestions:

- Does it match the project's style and conventions?
- Are there edge cases it missed?
- Does it follow the three-tier architecture?

## Project-specific conventions

These conventions help Copilot understand the codebase patterns:

- **Migrations are append-only** — never edit an existing migration file; create a new one. This ensures database consistency across environments.
- **The API is internal** — it's not exposed outside the Docker network; all external traffic goes through the web tier at port 3000.
- **Environment variables are the config boundary** — connection strings, ports, and URLs are all passed via env vars. No hardcoded values. Examples: `DATABASE_URL`, `API_URL`, `PORT`.
- **Node 22 / PostgreSQL 17** — match these versions in any new Dockerfiles or dependencies.
- **Three-tier communication flow** — Browser → Web (Next.js :3000) → API (Express :3001) → PostgreSQL. Each tier runs in its own Docker container.
- **Express REST API** — The API tier uses Express 5 with Node.js 22. Endpoints follow REST conventions: GET for retrieval, POST for creation, PATCH for updates.
- **Next.js frontend** — The web tier uses Next.js 16 with React 19 and Tailwind CSS. Server actions in `src/web/app/actions.ts` handle API communication.
- **Database schema** — PostgreSQL 17 manages the schema. Migrations use node-pg-migrate and are stored in `src/db/migrations/`.

## Copilot-specific capabilities for this architecture

### Understanding the data flow

Use Copilot to trace how data moves through the system:

```
@workspace Show me the complete data flow when a user creates a new task, from the frontend form submission through the API to the database.
```

### Debugging across tiers

When something isn't working, ask Copilot to check all three tiers:

```
@workspace The frontend shows an error when creating a task. Check the frontend code, the API endpoint, and the database schema to find the issue.
```

### Infrastructure as Code

Copilot can help with Terraform:

```
@workspace Explain the Terraform configuration in src/infrastructure/ and what GCP resources it provisions.
```

```
@workspace I need to add a new environment variable to the Terraform configuration. Where should I add it and how?
```

### Docker and containerization

Use Copilot to understand and modify Docker configurations:

```
@workspace Review the Dockerfiles in src/api/, src/web/, and src/db/. Are there any improvements for security or performance?
```

```
@workspace Explain what docker-compose.yml does and how the services communicate.
```

## Workflow example: Adding a feature with Copilot

Here's a typical workflow for adding a feature using Copilot:

1. **Plan** — Ask Copilot to outline the changes needed:
   ```
   @workspace I want to add a "tags" field to tasks. What files need to change and in what order?
   ```

2. **Create migration** — Use Copilot to generate the migration:
   ```
   @workspace Create a node-pg-migrate migration that adds a tags column (text array) to the tasks table.
   ```

3. **Update API** — Add the endpoint changes:
   ```
   @workspace Update the GET /tasks and POST /tasks endpoints to handle the tags field.
   ```

4. **Update frontend** — Wire up the UI:
   ```
   @workspace Add a tags input field to the task creation form in the frontend.
   ```

5. **Test** — Ask Copilot to help verify:
   ```
   @workspace Write a test that creates a task with tags and verifies it's stored and retrieved correctly.
   ```

## Tips for best results

- **Be specific** — "Add a delete button" is better than "improve the UI"
- **Reference files** — "In src/api/index.js, add a DELETE endpoint" is clearer than "add a delete endpoint"
- **Show examples** — If you want a specific style, show Copilot an example from the codebase
- **Use the right tool** — Copilot Chat for planning, inline suggestions for implementation, `/fix` for debugging
- **Iterate** — If Copilot's suggestion isn't quite right, refine your prompt and try again
