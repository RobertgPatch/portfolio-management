# Quickstart: Authentik Authentication Integration

**Spec**: 010 | **Branch**: `010-authentik-auth` | **Date**: 2026-04-07

> **Amendment (SSO Fix)**: Updated to reflect the seamless SSO flow — unauthenticated users
> are automatically redirected to Authentik (branded to match Ghostfolio). No intermediate
> landing page or login dialog.

## Prerequisites

- Docker Desktop running
- Node.js ≥22.18.0
- `.env` file configured (copy from `.env.dev`)

## Setup Steps

### 1. Add Authentik Environment Variables to `.env`

Append to your existing `.env`:

```env
# Authentik
AUTHENTIK_SECRET_KEY=change-me-to-a-very-long-random-string-at-least-50-chars-long!!
AUTHENTIK_BOOTSTRAP_PASSWORD=admin-password
AUTHENTIK_BOOTSTRAP_EMAIL=admin@ghostfolio.local
AUTHENTIK_PORT=9000

# OIDC (point to Authentik)
ENABLE_FEATURE_AUTH_OIDC=true
OIDC_ISSUER=http://localhost:9000/application/o/ghostfolio/
OIDC_CLIENT_ID=ghostfolio
OIDC_CLIENT_SECRET=<generated-in-step-3>
OIDC_SCOPE=["openid","profile","email","groups"]
```

### 2. Start Docker Services

```bash
docker compose --env-file .env -f docker/docker-compose.dev.yml up -d
```

This starts PostgreSQL, Redis, Authentik Server, and Authentik Worker.

### 3. Configure Authentik (First-Time Setup)

1. Open http://localhost:9000/if/flow/initial-setup/ and log in with bootstrap credentials
2. Navigate to **Admin** → **Applications** → **Providers** → Create **OAuth2/OpenID Provider**:
   - Name: `Ghostfolio`
   - Client type: `Confidential`
   - Client ID: `ghostfolio`
   - Client Secret: (copy and set as `OIDC_CLIENT_SECRET` in `.env`)
   - Redirect URIs: `http://localhost:4200/api/auth/oidc/callback` (or your `ROOT_URL + /api/auth/oidc/callback`)
   - Scopes: Assign the `groups` scope mapping (see step 4)
3. Create **Application**:
   - Name: `Ghostfolio`
   - Slug: `ghostfolio`
   - Provider: Select `Ghostfolio` from above
4. Create **Scope Mapping** for groups:
   - Go to **Customization** → **Property Mappings** → Create **Scope Mapping**
   - Name: `groups`
   - Scope name: `groups`
   - Expression: `return {"groups": [group.name for group in request.user.ak_groups.all()]}`
5. Create **Groups**:
   - `ghostfolio-admin` — assign admin users
   - `ghostfolio-user` — assign regular users
   - `ghostfolio-demo` — assign demo users

### 4. Apply Authentik Branding (Ghostfolio Theme)

Run the branding setup script to theme Authentik to match Ghostfolio:

```bash
bash docker/authentik/branding/setup-branding.sh
```

This applies:
- **Title**: "Ghostfolio"
- **Logo & Favicon**: Ghostfolio ghost icon
- **Custom CSS**: Teal primary buttons (`#36CFCC`), Inter font, matching background colors
- **Brand domain**: `authentik-default` (applies to all requests)

Alternatively, configure branding manually in the Authentik Admin UI:
1. Go to **System** → **Brands** → Edit `authentik-default`
2. Set title to "Ghostfolio"
3. Upload logo/favicon in **Branding** section
4. Add custom CSS in **Custom CSS** field (see `research.md` R4 for CSS)

### 5. Start Ghostfolio

```bash
npm run database:setup    # Seeds bootstrap super admin user
npm run start:server      # Terminal 1
npm run start:client      # Terminal 2
```

The seed creates a super admin user mapped to the Authentik bootstrap admin account.

### 6. Test Seamless Login

The expected flow is now **fully seamless** — no intermediate pages or dialogs:

1. Open https://localhost:4200/en/family-office (or any protected route)
2. **Automatic redirect**: AuthGuard detects no JWT → redirects to `/api/auth/oidc` → Authentik login page
3. You see the **Ghostfolio-branded** Authentik login page (teal buttons, ghost logo)
4. Enter credentials (`AUTHENTIK_BOOTSTRAP_EMAIL` / `AUTHENTIK_BOOTSTRAP_PASSWORD`)
5. **Automatic redirect**: Authentik → callback → JWT saved → you're in the app

**No clicks required to initiate login** — just visit any route and authenticate.

Alternatively, if already on a public page, click "Sign in" in the header — this links directly to `/api/auth/oidc` (no dialog).

### 7. Staying Signed In

JWT tokens are stored in `localStorage` by default ("stay signed in"). This means:
- Closing the browser tab does **not** log you out
- Sessions persist for 180 days (JWT expiry)
- To sign out, use the app's sign-out feature (clears localStorage)

### 8. Create Additional Users

1. **In Authentik**: Create a new user in the Authentik admin UI (http://localhost:9000/if/admin/)
2. Assign the user to the appropriate group (`ghostfolio-admin`, `ghostfolio-user`, or `ghostfolio-demo`)
3. Note the user's Authentik UUID (visible in user details)
4. **In Ghostfolio**: Go to Admin → Users → click "Create User"
5. Enter the Authentik UUID as the `thirdPartyId` and select a role
6. The new user can now log in via Authentik

### 9. (Optional) Configure Google Login via Authentik

1. In Authentik admin → **Directory** → **Federation & Social Login** → Create **OAuth Source**
2. Provider type: `Google`
3. Client ID / Secret: Your Google OAuth credentials
4. Users will see "Sign in with Google" on the Authentik login page

## Authentication Flow Diagram

```
User visits any route
        │
        ▼
  AuthGuard checks JWT
        │
   ┌────┴────┐
   │ Valid?   │
   │  Yes     │──→ Show requested page
   │  No      │
   └────┬─────┘
        │
        ▼
  window.location = /api/auth/oidc
        │
        ▼
  302 → Authentik Login
  (Ghostfolio-branded)
        │
        ▼
  User enters credentials
        │
        ▼
  Authentik validates → 302 → /api/auth/oidc/callback
        │
        ▼
  Server: validate OIDC, create JWT
        │
        ▼
  302 → /en/auth/:jwt
        │
        ▼
  Angular: save JWT to localStorage, navigate to /
        │
        ▼
  App loaded, user authenticated ✓
```

## Verification Checklist

- [ ] `docker ps` shows `gf-postgres-dev`, `gf-redis-dev`, `gf-authentik-server`, `gf-authentik-worker`
- [ ] http://localhost:9000 loads Authentik admin UI
- [ ] Authentik login page shows Ghostfolio branding (logo, teal buttons, title)
- [ ] **Seamless redirect**: Visiting any protected route auto-redirects to Authentik (no landing page)
- [ ] **No login dialog**: Header "Sign in" button links directly to OIDC (no dialog popup)
- [ ] **Stay signed in**: Closing and reopening browser keeps you logged in
- [ ] Bootstrap admin can log in to Ghostfolio via Authentik OIDC
- [ ] Bootstrap admin has `ADMIN` role in Ghostfolio
- [ ] Admin can create new users via Admin → Users → Create User
- [ ] Newly created users can log in via Authentik
- [ ] Visiting `/register` returns 404 or redirects (page removed)
- [ ] `POST /api/v1/user` returns 403 (public signup disabled)
- [ ] OIDC login with unregistered Authentik user returns 403
- [ ] Authentik group membership maps to correct Ghostfolio role
- [ ] API key authentication still works independently
