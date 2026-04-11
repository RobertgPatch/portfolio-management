# Research: Authentik Seamless SSO Fix

**Spec**: 010 (Amendment) | **Date**: 2026-04-07

> This research amends the original 010-authentik-auth plan to fix the double-login problem.
> After completing Phases 1–7 of the original spec, the OIDC plumbing works but the UX requires
> three clicks to sign in. The user expects seamless SSO: visit app → Authentik login → app.

## Problem Analysis

After the initial Authentik integration, the login experience requires **three separate user actions**:

1. User visits the app → AuthGuard redirects to `/start` landing page (marketing page)
2. User clicks "Sign in" in the header → a MatDialog opens
3. Dialog shows a single "Sign in" link to `/api/auth/oidc`
4. Only then does OIDC redirect to Authentik happen
5. User authenticates on Authentik's default-branded page
6. Redirected back via `/en/auth/:jwt` → JWT saved → navigated to `/`

**Expected**: Visit app → see branded Authentik login → enter credentials → logged in.

## R1: AuthGuard Should Redirect to OIDC, Not Landing Page

**Decision**: When OIDC is the sole auth method, `AuthGuard` redirects unauthenticated users directly to `/api/auth/oidc` via `window.location.href` (full-page navigation, not Angular routing).

**Rationale**: In `auth.guard.ts` line 55, the guard navigates to `publicRoutes.start.routerLink` when `userService.get()` returns 401. Since Authentik is now the sole authentication provider, this intermediate landing page adds friction. A direct OIDC redirect gives seamless SSO.

**Alternatives considered**:
- *Keep landing page with auto-redirect meta tag*: Adds an unnecessary round-trip. Rejected.
- *Show a brief "Redirecting to sign in…" spinner*: Adds complexity for a sub-second state. Could be a future polish item but not needed initially. Deferred.
- *Use Angular route guard returning `UrlTree` to external URL*: Angular guards can't redirect to external URLs or non-Angular routes. Must use `window.location.href`. Confirmed.

## R2: Remove the Login Dialog

**Decision**: Eliminate `GfLoginWithAccessTokenDialogComponent` entirely. The header "Sign in" button navigates directly to `/api/auth/oidc`.

**Rationale**: The dialog now contains only a single OIDC link — it's a wrapper around one button. Per the constitution ("Simplicity First"), removing it eliminates an unnecessary intermediate step. The header button becomes `<a href="/api/auth/oidc">Sign in</a>`.

**Alternatives considered**:
- *Keep dialog for future multi-provider support*: YAGNI per constitution ("don't add abstractions until needed"). If multiple auth methods return, the dialog can be restored from git history. Rejected.

## R3: OIDC Callback Flow Is Correct

**Decision**: Keep the current `/en/auth/:jwt` callback mechanism unchanged.

**Rationale**: The server-side callback at `GET /api/auth/oidc/callback` correctly:
1. Validates OIDC response via passport
2. Creates internal JWT via `authService.validateOAuthLogin()`
3. Redirects browser to `/en/auth/<jwt>`
4. Angular `GfAuthPageComponent` saves JWT to storage and navigates to `/`

This is the standard server-side OIDC handoff pattern. No changes needed.

## R4: Authentik Custom Branding via Brand API

**Decision**: Theme Authentik to match Ghostfolio's visual identity via Brand settings (custom CSS, logo, favicon, title). Provision via a setup script or Authentik YAML blueprint.

**Rationale**: Authentik supports per-Brand customization. The default brand (UUID: `24dceb77-a736-4b9b-a9a4-0488e6dfdd7d`, domain: `authentik-default`) can be updated with:
- `branding_title`: "Ghostfolio"
- `branding_logo`: Ghostfolio ghost SVG/PNG
- `branding_favicon`: Ghostfolio favicon
- `web_certificate`: none (HTTP in dev)
- Custom CSS: Match Ghostfolio's color palette

**Ghostfolio Colors**:
| Role | Hex |
|------|-----|
| Primary | `#36CFCC` (teal) |
| Accent | `#3686CF` (blue) |
| Warn | `#DC3545` (red) |
| Light BG | `#FAFAFA` |
| Dark BG | `#191919` |
| Font | `'Inter', Roboto, 'Helvetica Neue', sans-serif` |

**Authentik CSS targeting** (PatternFly framework):
```css
/* Background */
:root {
  --ak-flow-background: #FAFAFA;
}
/* Primary buttons */
.pf-c-button.pf-m-primary {
  --pf-c-button--m-primary--BackgroundColor: #36CFCC;
  --pf-c-button--m-primary--hover--BackgroundColor: #30CAC7;
}
/* Typography */
body, .pf-c-title, .pf-c-form-control {
  font-family: 'Inter', Roboto, 'Helvetica Neue', sans-serif !important;
}
/* Logo sizing */
.pf-c-brand { max-height: 48px; }
```

**Alternatives considered**:
- *Embed Authentik in iframe*: Blocked by `X-Frame-Options: DENY` and CSP `frame-ancestors 'self'`. Security risk. Rejected.
- *Build custom login form calling Authentik flow executor API*: Fragile — breaks with MFA, captcha, consent stages. Must replicate Authentik's flow engine. Rejected.
- *Proxy Authentik through Ghostfolio*: Complex session management, security risk. Rejected.

## R5: Authentik Blueprint for Reproducible Setup

**Decision**: Create an Authentik YAML blueprint that provisions the OAuth2 provider, application, scope mapping, groups, and branding. Mount it into the container for auto-apply on startup.

**Rationale**: The current setup requires manual API calls. A blueprint in `docker/authentik/blueprints/` mounted into `/blueprints/custom/` auto-applies on startup, ensuring reproducible environments. Combined with a setup script that copies the logo and applies the brand CSS.

**Blueprint provisions**:
1. OAuth2 Provider: `ghostfolio` (client_id, redirect_uris, scopes)
2. Application: `ghostfolio` (slug, linked to provider)
3. Scope Mapping: `groups` claim
4. Groups: `ghostfolio-admin`, `ghostfolio-user`, `ghostfolio-demo`
5. Group membership: `akadmin` → `ghostfolio-admin`

**Brand theming** (cannot be done via blueprint — must use API or Django shell):
- Logo, favicon, custom CSS, title

**Alternatives considered**:
- *Setup script only (no blueprint)*: Works but less declarative. Blueprint is the Authentik-native way. Rejected as sole approach.
- *Manual setup documented in quickstart*: Not reproducible. Keep as fallback docs. Rejected as primary.

## R6: Remove Landing Page for Authenticated-Only Deployments

**Decision**: When OIDC is the sole auth method, skip the landing/start page entirely. The wildcard route already redirects to `family-office`.

**Rationale**: The landing page (`landing-page.component.ts`) is a 383-line marketing page ("Manage your wealth like a boss") designed for SaaS. In a family-office deployment with Authentik:
- No self-registration ("Get Started" links to removed `/register`)
- No need for a marketing page
- The "Sign in" button is already in the header

There are two strategies:
1. **AuthGuard auto-redirect**: Unauthenticated users hitting protected routes get redirected to OIDC directly — they never see the landing page. ✅
2. **Remove landing page route**: Not necessary — it simply won't be reached if the guard redirects first. Can be kept for direct navigation.

## R7: Default "Stay Signed In" to True

**Decision**: Default JWT persistence to `localStorage` (stay signed in) rather than `sessionStorage`.

**Rationale**: The OIDC flow is a full-page redirect through Authentik. If the JWT is stored in `sessionStorage`, closing the tab loses the session, and the next visit triggers a full OIDC redirect. Using `localStorage` by default gives a smoother experience — users stay logged in across browser sessions until the JWT expires (180 days).

**Alternatives considered**:
- *OIDC silent refresh via iframe*: More complex, requires Authentik refresh token configuration and SPA handling. Deferred to future enhancement.
- *Keep sessionStorage default*: Users would need to re-authenticate on every new tab. Poor UX in a family-office setting. Rejected.

## R8: Relative URL Bug in Login Dialog

**Decision**: Fix is moot since the dialog is being removed (R2), but for reference: the dialog used `href="../api/auth/oidc"` which is a relative URL. If the page is at `/en/start`, `../` resolves up one segment, but this depends on the base href. Should have been `/api/auth/oidc` (absolute path).

## Summary of Decisions

| # | Decision | Impact |
|---|----------|--------|
| R1 | AuthGuard redirects to `/api/auth/oidc` directly | Eliminates landing page intermediate step |
| R2 | Remove login dialog component | Eliminates dialog intermediate step |
| R3 | Keep callback flow as-is | No changes to OIDC plumbing |
| R4 | Theme Authentik with Ghostfolio branding | Visual continuity during login |
| R5 | Create Authentik blueprint + setup script | Reproducible, version-controlled config |
| R6 | Skip landing page for OIDC-only auth | No marketing page for private deployment |
| R7 | Default stay signed in to true | Smoother persistent sessions |
| R8 | Relative URL fix (moot) | N/A — dialog removed |
