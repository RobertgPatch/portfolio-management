# Ghostfolio Development Guide

## Development Environment

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop)
- [Node.js](https://nodejs.org/en/download) (version `>=22.18.0`)
- Create a local copy of this Git repository (clone)
- Copy the file `.env.dev` to `.env` and populate it with your data (`cp .env.dev .env`)

### Setup

1. Run `npm install`
1. Run `docker compose -f docker/docker-compose.dev.yml up -d` to start [PostgreSQL](https://www.postgresql.org), [Redis](https://redis.io), and [Authentik](https://goauthentik.io) (identity provider)
1. Run `npm run database:setup` to initialize the database schema
1. Configure Authentik (see [Authentik Setup](#authentik-setup) below)
1. Start the [server](#start-server) and the [client](#start-client)
1. Open https://localhost:4200/en in your browser
1. Sign in via Authentik OIDC

### Authentik Setup

After starting Docker containers, configure Authentik at `http://localhost:9000/if/flow/initial-setup/`:

1. Create the initial admin account (akadmin)
2. Create an **OAuth2/OpenID Provider** named `ghostfolio`:
   - Client type: Confidential
   - Redirect URI: `http://localhost:4200/api/auth/oidc/callback`
   - Scopes: `openid`, `profile`, `email`
   - Note the **Client ID** and **Client Secret**
3. Create an **Application** named `ghostfolio` linked to the provider
4. Create a **Group** named `ghostfolio-admin` and assign your user to it
5. Add the following to your `.env` file:
   ```
   ENABLE_FEATURE_AUTH_OIDC=true
   OIDC_CLIENT_ID=<client-id>
   OIDC_CLIENT_SECRET=<client-secret>
   OIDC_ISSUER=http://localhost:9000/application/o/ghostfolio
   OIDC_SCOPE=["openid","profile","email"]
   ```
6. Set `AUTHENTIK_ADMIN_SUB` in `.env` to your Authentik user's sub claim, then run `npm run database:setup` to seed the bootstrap admin user
7. New users must be created through the Admin panel (Admin > Users > Create User)

### Start Server

#### Debug

Run `npm run watch:server` and click _Debug API_ in [Visual Studio Code](https://code.visualstudio.com)

#### Serve

Run `npm run start:server`

### Start Client

#### English (Default)

Run `npm run start:client` and open https://localhost:4200/en in your browser.

#### Other Languages

To start the client in a different language, such as German (`de`), adapt the `start:client` script in the `package.json` file by changing `--configuration=development-en` to `--configuration=development-de`. Then, run `npm run start:client` and open https://localhost:4200/de in your browser.

### Start _Storybook_

Run `npm run start:storybook`

### Migrate Database

With the following command you can keep your database schema in sync:

```bash
npm run database:push
```

## Testing

Run `npm test`

## Experimental Features

New functionality can be enabled using a feature flag switch from the user settings.

### Backend

Remove permission in `UserService` using `without()`

### Frontend

Use `@if (user?.settings?.isExperimentalFeatures) {}` in HTML template

## Component Library (_Storybook_)

https://ghostfol.io/development/storybook

## Git

### Rebase

`git rebase -i --autosquash main`

## Dependencies

### Angular

#### Upgrade (minor versions)

1. Run `npx npm-check-updates --upgrade --target "minor" --filter "/@angular.*/"`

### Nx

#### Upgrade

1. Run `npx nx migrate latest`
1. Make sure `package.json` changes make sense and then run `npm install`
1. Run `npx nx migrate --run-migrations`

### Prisma

#### Access database via GUI

Run `npm run database:gui`

https://www.prisma.io/studio

#### Synchronize schema with database for prototyping

Run `npm run database:push`

https://www.prisma.io/docs/concepts/components/prisma-migrate/db-push

#### Create schema migration

Run `npm run prisma migrate dev --name added_job_title`

https://www.prisma.io/docs/concepts/components/prisma-migrate#getting-started-with-prisma-migrate

## SSL

Generate `localhost.cert` and `localhost.pem` files.

```
openssl req -x509 -newkey rsa:2048 -nodes -keyout apps/client/localhost.pem -out apps/client/localhost.cert -days 365 \
  -subj "/C=CH/ST=State/L=City/O=Organization/OU=Unit/CN=localhost"
```
