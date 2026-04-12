# Railway Deployment Guide

This guide explains how to deploy the application to [Railway](https://railway.app).

## Architecture

The app deploys as a **single Docker image** that includes both the NestJS API and the pre-built Angular client (served via `@nestjs/serve-static`). On Railway, you provision **six services**:

| Service | Type | Notes |
|---------|------|-------|
| **App** | Docker (this repo) | API + Client in one container |
| **Postgres** | Railway managed | Ghostfolio database (`postgresql://...`) |
| **Redis** | Railway managed | Used for caching and Bull job queues |
| **Authentik Postgres** | Railway managed | Separate database for Authentik |
| **Authentik Server** | Docker image | OIDC identity provider (HTTP interface) |
| **Authentik Worker** | Docker image | Background tasks (email, cleanup, etc.) |

## Quick Start

### 1. Create a Railway Project

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** service (click "Add Service" → "Database" → "PostgreSQL") — this is the **Ghostfolio DB**
3. Add a **Redis** service (click "Add Service" → "Database" → "Redis")
4. Add a second **PostgreSQL** service — this is the **Authentik DB** (rename it to "Authentik Postgres" for clarity)
5. Add your app (click "Add Service" → "GitHub Repo" → select this repo)

### 2. Configure Environment Variables

In your app service's **Variables** tab, set:

```
# From Railway's Postgres service (use the "Connect" tab to copy these)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?connect_timeout=300&sslmode=prefer
POSTGRES_DB=railway
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<from Railway>

# From Railway's Redis service (use the "Connect" tab to copy these)  
REDIS_HOST=<Redis private host>
REDIS_PORT=6379
REDIS_PASSWORD=<from Railway>

# App secrets (generate random strings)
ACCESS_TOKEN_SALT=<random-32-char-string>
JWT_SECRET_KEY=<random-32-char-string>

# OIDC / Authentik (see "Deploy Authentik" section below)
ENABLE_FEATURE_AUTH_OIDC=true
OIDC_ISSUER=https://<authentik-server-domain>/application/o/ghostfolio/
OIDC_CLIENT_ID=ghostfolio
OIDC_CLIENT_SECRET=<from Authentik OAuth2 provider>
OIDC_SCOPE=["openid","profile","email","groups"]

# Railway sets PORT automatically — do NOT set it manually
```

> **Tip:** Use Railway's [variable references](https://docs.railway.app/guides/variables#referencing-another-services-variable) to auto-wire `DATABASE_URL` from the Postgres service:
> ```
> DATABASE_URL=${{Postgres.DATABASE_URL}}?connect_timeout=300&sslmode=prefer
> REDIS_HOST=${{Redis.REDIS_HOST}}
> REDIS_PORT=${{Redis.REDIS_PORT}}
> REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
> ```

### 3. Deploy Authentik (Server + Worker)

Authentik provides OIDC-based authentication. On Railway you need two services: the **server** (HTTP UI/API) and the **worker** (background processing). Both use the same Docker image.

#### 3a. Create the Authentik Server service

1. Click **"Add Service" → "Docker Image"**
2. Set image to: `ghcr.io/goauthentik/server:2024.12`
3. Set **Start Command** to: `server`
4. Rename the service to **"Authentik Server"**
5. In **Settings**, click **"Generate Domain"** to get a public URL (e.g., `authentik-server-production-xxxx.up.railway.app`)
6. Set these **Variables**:

```
# Authentik core
AUTHENTIK_SECRET_KEY=<random-string-at-least-50-chars>
AUTHENTIK_BOOTSTRAP_PASSWORD=<admin-password-for-first-login>
AUTHENTIK_BOOTSTRAP_EMAIL=admin@yourdomain.com

# Authentik Postgres (from the second Postgres service)
AUTHENTIK_POSTGRESQL__HOST=${{Authentik Postgres.PGHOST}}
AUTHENTIK_POSTGRESQL__PORT=${{Authentik Postgres.PGPORT}}
AUTHENTIK_POSTGRESQL__NAME=${{Authentik Postgres.PGDATABASE}}
AUTHENTIK_POSTGRESQL__USER=${{Authentik Postgres.PGUSER}}
AUTHENTIK_POSTGRESQL__PASSWORD=${{Authentik Postgres.PGPASSWORD}}

# Redis (shared with Ghostfolio, use DB 1 to avoid collisions)
AUTHENTIK_REDIS__HOST=${{Redis.REDIS_HOST}}
AUTHENTIK_REDIS__PORT=${{Redis.REDIS_PORT}}
AUTHENTIK_REDIS__PASSWORD=${{Redis.REDIS_PASSWORD}}
AUTHENTIK_REDIS__DB=1
```

#### 3b. Create the Authentik Worker service

1. Click **"Add Service" → "Docker Image"**
2. Set image to: `ghcr.io/goauthentik/server:2024.12`
3. Set **Start Command** to: `worker`
4. Rename the service to **"Authentik Worker"**
5. **No domain needed** — the worker only processes background jobs
6. Set the **exact same variables** as the Authentik Server (copy them, or use Railway shared variables)

#### 3c. Configure Authentik after first deploy

Once both Authentik services are running:

1. Open `https://<authentik-server-domain>/if/flow/initial-setup/` in your browser
2. Log in with the bootstrap email/password
3. Go to **Applications → Providers → Create** → **OAuth2/OIDC Provider**
   - Name: `ghostfolio`
   - Client ID: `ghostfolio` (or auto-generated)
   - Client Secret: copy this → put in Ghostfolio's `OIDC_CLIENT_SECRET`
   - Redirect URIs: `https://<ghostfolio-app-domain>/api/auth/anonymous/callback`
   - Scopes: `openid`, `profile`, `email`, `groups`
4. Go to **Applications → Applications → Create**
   - Name: `Ghostfolio`
   - Slug: `ghostfolio`
   - Provider: select the provider you just created
5. Create an **API Token** (optional, for automation):
   - Go to **Directory → Tokens and App passwords → Create**
   - Copy the token → set as `AUTHENTIK_API_TOKEN` in Ghostfolio's env vars
6. Update Ghostfolio's `OIDC_ISSUER` to: `https://<authentik-server-domain>/application/o/ghostfolio/`

### 4. Deploy the App

Railway auto-detects the `railway.toml` and `Dockerfile` in the repo root. Push to your connected branch and Railway will:

1. Build the Docker image (multi-stage: builder → slim runtime)
2. Run database migrations via `prisma migrate deploy`
3. Seed the database (if applicable)
4. Start the Node.js server on the Railway-assigned `$PORT`
5. Health-check at `/api/v1/health`

### 5. Set Up Networking

- In the app service's **Settings** tab, click **Generate Domain** to get a public URL
- Optionally add a custom domain

## Local Testing (Railway-like)

To test the full Docker build locally in a Railway-equivalent topology:

```bash
# 1. Copy the template and fill in your values
cp .env.railway .env.railway.local

# 2. Build and run all services
docker compose -f docker/docker-compose.railway.yml --env-file .env.railway.local up --build

# 3. Open http://localhost:3333
```

## File Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build: installs deps, builds API + Client, creates slim runtime image |
| `railway.toml` | Railway build & deploy configuration |
| `.dockerignore` | Excludes unnecessary files from Docker context |
| `.env.railway` | Template for Railway environment variables (including Authentik) |
| `docker/entrypoint.sh` | Container startup: runs migrations, seeds DB, starts server |
| `docker/docker-compose.railway.yml` | Local simulation of Railway topology (app + DBs + Authentik) |
| `docker/init-authentik-db.sql` | Creates the `authentik` database on first Postgres startup |

## Troubleshooting

### Build fails with OOM
Railway's free tier has limited memory. If the build fails, try:
- Upgrade to a paid plan (recommended for production)
- Or set `NODE_OPTIONS=--max-old-space-size=4096` in build environment variables

### Database connection refused
- Ensure `DATABASE_URL` uses the **private** networking hostname (not external)
- Verify the Postgres service is running in the same Railway project
- Check `?connect_timeout=300&sslmode=prefer` is appended to the URL

### Redis connection issues
- Use `REDIS_HOST` from the Redis service's private networking
- Ensure `REDIS_PASSWORD` matches exactly

### Health check failing
- The app needs ~30-40 seconds to start (migrations + seed + boot)
- The health check has a 40-second start period configured
- Check logs in Railway dashboard for startup errors

### Authentik not starting
- Verify the Authentik Postgres service is healthy (check its logs)
- Ensure `AUTHENTIK_SECRET_KEY` is at least 50 characters
- Both server and worker must have **identical** environment variables
- The worker does not need a public domain — only the server does
- If you see `OperationalError: FATAL: database "authentik" does not exist`, the Authentik Postgres was not provisioned as a separate Railway Postgres service (it needs its own DB, not a shared one with Ghostfolio)

### OIDC login redirect fails
- `OIDC_ISSUER` must end with `/application/o/ghostfolio/` (trailing slash required)
- Redirect URI in Authentik must match exactly: `https://<app-domain>/api/auth/anonymous/callback`
- Ensure `ENABLE_FEATURE_AUTH_OIDC=true` is set on the Ghostfolio app service
