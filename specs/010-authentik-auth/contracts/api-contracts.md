# API Contracts: Authentication Endpoints

**Spec**: 010 | **Date**: 2026-04-07

## Endpoints Overview

### Modified Endpoints

#### `GET /api/auth/oidc`

**Purpose**: Initiate Authentik OIDC Authorization Code flow.

**Change**: Remove `ENABLE_FEATURE_AUTH_OIDC` guard — OIDC becomes the primary auth method.

**Request**: Browser redirect (no body)

**Response**: `302 Redirect` to Authentik authorization endpoint

**Scopes sent**: `openid profile email groups`

---

#### `GET /api/auth/oidc/callback`

**Purpose**: Handle Authentik callback after successful authentication.

**Change**: Enhanced to extract `groups` claim and map to Ghostfolio `Role`. **No JIT provisioning** — if `sub` does not match an existing user, return 403.

**Request**: Query params from Authentik (`code`, `state`)

**Response**:
- `302 Redirect` to `/en/auth/:jwt` on success
- `403 Forbidden` if user with matching `thirdPartyId` does not exist

**Internal flow**:
1. `passport-openidconnect` exchanges `code` for tokens
2. `OidcStrategy.validate()` extracts `sub` and `groups` from profile/idToken
3. `AuthService.validateOAuthLogin({ provider: OIDC, thirdPartyId: sub, groups })` → lookup user (no creation)
4. If user not found → throw 403 Forbidden
5. If user found → update role from groups claim, sign internal JWT `{ id: user.id }` (180-day expiry)
6. Redirect with JWT in URL

---

#### `POST /api/v1/auth/anonymous` (Deprecated)

**Current**: Validates access token, returns JWT.

**Change**: Mark as deprecated. Will be removed after migration. No code changes in Phase 1 — controlled by `ENABLE_FEATURE_AUTH_TOKEN` feature flag.

**Request**:
```json
{ "accessToken": "string" }
```

**Response**:
```json
{ "authToken": "string" }
```

---

#### `POST /api/v1/user` (Disabled)

**Current**: Public self-registration — creates anonymous user, returns access token.

**Change**: **Permanently disabled.** Always returns 403 Forbidden. Remove `isUserSignupEnabled` check — public signup is never allowed.

**Request**: (any)

**Response**: `403 Forbidden`

---

### New Endpoints

#### `POST /api/v1/admin/user`

**Purpose**: Admin creates a new Ghostfolio user that maps to an existing Authentik account.

**Auth**: `@UseGuards(AuthGuard('jwt'), HasPermissionGuard)`
**Permission**: `accessAdminControl`

**Request**:
```json
{
  "thirdPartyId": "authentik-user-uuid",
  "role": "USER"  // optional, default USER. One of: ADMIN, USER, DEMO
}
```

**Response** (201 Created):
```json
{
  "id": "ghostfolio-user-uuid",
  "provider": "OIDC",
  "thirdPartyId": "authentik-user-uuid",
  "role": "USER",
  "createdAt": "2026-04-07T00:00:00.000Z"
}
```

**Error responses**:
- `403 Forbidden` — caller lacks admin permission
- `409 Conflict` — user with this `thirdPartyId` already exists
- `400 Bad Request` — invalid role or missing `thirdPartyId`

---

### Removed Endpoints (Post-Migration)

| Endpoint | Reason |
|----------|--------|
| `GET /api/auth/google` | Google federated through Authentik |
| `GET /api/auth/google/callback` | Google federated through Authentik |
| `GET /api/auth/anonymous/:accessToken` | Anonymous login deprecated |
| `POST /api/auth/webauthn/generate-authentication-options` | WebAuthn managed by Authentik |
| `GET /api/auth/webauthn/generate-registration-options` | WebAuthn managed by Authentik |
| `POST /api/auth/webauthn/verify-attestation` | WebAuthn managed by Authentik |
| `POST /api/auth/webauthn/verify-authentication` | WebAuthn managed by Authentik |
| `DELETE /api/v1/auth-device/:id` | AuthDevice model deprecated |
| `GET /register` (frontend) | No self-registration |

### Removed/Deprecated Concepts

| Concept | Reason |
|---------|--------|
| `isUserSignupEnabled` property | Self-registration removed entirely |
| `createUserAccount` global permission | No public signup; admin creates users |
| `PROPERTY_IS_USER_SIGNUP_ENABLED` | Property no longer needed |
| Admin Overview "User Signup" toggle | Replaced by admin user creation |

### Unchanged Endpoints

| Endpoint | Notes |
|----------|-------|
| All endpoints using `@UseGuards(AuthGuard('jwt'))` | Internal JWT validation unchanged |
| All endpoints using `@UseGuards(AuthGuard('api-key'))` | API key auth fully independent |

---

## ValidateOAuthLogin Interface Change

### Current

```typescript
interface ValidateOAuthLoginParams {
  provider: Provider;
  thirdPartyId: string;
}
```

### Proposed

```typescript
interface ValidateOAuthLoginParams {
  provider: Provider;
  thirdPartyId: string;
  groups?: string[];  // NEW: OIDC groups claim for role mapping
}
```

### Behavior Change: No JIT Provisioning

```typescript
// AuthService.validateOAuthLogin() — BEFORE:
// If user not found && isUserSignupEnabled -> createUser()

// AuthService.validateOAuthLogin() — AFTER:
// If user not found -> throw ForbiddenException('User not provisioned')
// If user found -> update role from groups claim -> sign JWT
```

### Role Mapping Logic

```typescript
function mapGroupsToRole(groups: string[]): Role {
  if (groups?.includes('ghostfolio-admin')) return Role.ADMIN;
  if (groups?.includes('ghostfolio-demo')) return Role.DEMO;
  return Role.USER;
}
```

---

## Authentik OIDC Discovery Contract

**Issuer URL**: `http://localhost:${AUTHENTIK_PORT}/application/o/ghostfolio/`

**Discovery endpoint**: `{issuer}/.well-known/openid-configuration`

**Expected claims in ID token / userinfo**:

```json
{
  "sub": "authentik-user-uuid",
  "preferred_username": "user@example.com",
  "email": "user@example.com",
  "groups": ["ghostfolio-admin", "ghostfolio-user"],
  "iss": "http://localhost:9000/application/o/ghostfolio/",
  "aud": "<OIDC_CLIENT_ID>"
}
```

---

## Docker Compose Contract (Dev Environment)

### New Services

```yaml
# Added to docker/docker-compose.dev.yml
authentik-server:
  image: ghcr.io/goauthentik/server:2024.12
  command: server
  container_name: gf-authentik-server
  environment:
    AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
    AUTHENTIK_POSTGRESQL__HOST: gf-postgres-dev
    AUTHENTIK_POSTGRESQL__PORT: 5432
    AUTHENTIK_POSTGRESQL__NAME: authentik
    AUTHENTIK_POSTGRESQL__USER: ${POSTGRES_USER}
    AUTHENTIK_POSTGRESQL__PASSWORD: ${POSTGRES_PASSWORD}
    AUTHENTIK_REDIS__HOST: gf-redis-dev
    AUTHENTIK_REDIS__PORT: 6379
    AUTHENTIK_REDIS__PASSWORD: ${REDIS_PASSWORD}
    AUTHENTIK_REDIS__DB: 1
    AUTHENTIK_BOOTSTRAP_PASSWORD: ${AUTHENTIK_BOOTSTRAP_PASSWORD}
    AUTHENTIK_BOOTSTRAP_EMAIL: ${AUTHENTIK_BOOTSTRAP_EMAIL}
  ports:
    - "${AUTHENTIK_PORT:-9000}:9000"
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy

authentik-worker:
  image: ghcr.io/goauthentik/server:2024.12
  command: worker
  container_name: gf-authentik-worker
  environment:
    # Same as authentik-server (minus ports)
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
```

### PostgreSQL Init Script

A Docker entrypoint init script to create the `authentik` database:

```sql
-- docker/init-authentik-db.sql
CREATE DATABASE authentik;
```

Mounted via volume in postgres service:
```yaml
volumes:
  - ./init-authentik-db.sql:/docker-entrypoint-initdb.d/init-authentik-db.sql
```
