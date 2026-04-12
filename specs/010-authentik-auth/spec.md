# Feature Spec: Authentik Authentication Integration

**Spec ID**: 010 | **Branch**: `010-authentik-auth` | **Date**: 2026-04-07

## Problem Statement

Ghostfolio currently manages authentication internally via multiple strategies (anonymous tokens, Google OAuth, generic OIDC, WebAuthn, API keys). This creates maintenance burden, limits SSO capabilities, and couples identity management tightly to the application. A centralized identity provider (IdP) would simplify auth management, enable MFA/passkey policies at the IdP level, and allow future multi-application SSO.

## Requirements

### Functional Requirements

1. **FR-1**: Replace internal anonymous/password login with Authentik OIDC Authorization Code flow
2. **FR-2**: Replace Google OAuth strategy with Authentik as the identity broker (Authentik handles Google as a social source)
3. **FR-3**: Move WebAuthn/passkey management to Authentik (Authentik natively supports FIDO2)
4. **FR-4**: Preserve API key authentication for programmatic access (unchanged)
5. **FR-5**: Map Authentik groups to Ghostfolio roles (`ADMIN`, `USER`, `DEMO`)
6. **FR-6**: No self-registration — remove public signup endpoint (`POST /user`) and `/register` page
7. **FR-7**: Admin-only user creation — new `POST /admin/user` endpoint allows admins to create users (pre-provisioned in both Authentik and Ghostfolio)
8. **FR-8**: Bootstrap a default super admin user during `database:setup` that maps to the Authentik bootstrap admin account
9. **FR-9**: OIDC login only succeeds for pre-existing users (no JIT provisioning) — unrecognized `sub` values are rejected with 403
10. **FR-10**: Manage user lifecycle (create, disable, delete) from admin panel
11. **FR-11**: Add Authentik server + worker to Docker Compose dev environment (reuse existing PostgreSQL and Redis)
12. **FR-12**: Preserve "Stay signed in" functionality via OIDC refresh tokens
13. **FR-13**: Support silent token renewal in the Angular SPA

### Non-Functional Requirements

1. **NFR-1**: No user-facing downtime during migration — existing JWTs remain valid during transition
2. **NFR-2**: Authentik containers must add <300MB total memory overhead
3. **NFR-3**: Login latency must remain under 2 seconds for OIDC flow
4. **NFR-4**: Configuration via environment variables (no hardcoded Authentik URLs)

## Out of Scope

- Self-registration / public signup (all user creation is admin-managed)
- Migrating existing anonymous user passwords to Authentik
- Multi-tenant Authentik configuration (single tenant/realm)
- SAML support (OIDC only)
- Custom Authentik theming (default UI acceptable)

## Success Criteria

- [ ] A default super admin user is created during `database:setup` and maps to the Authentik bootstrap admin
- [ ] User can log in via Authentik OIDC flow and access Ghostfolio
- [ ] Admin user in Authentik group maps to `ADMIN` role in Ghostfolio
- [ ] Google login works via Authentik identity brokering
- [ ] WebAuthn/passkeys managed at the Authentik level
- [ ] API key auth continues to work unchanged
- [ ] No public signup endpoint exists — `POST /user` returns 403
- [ ] Admin can create new users via `POST /admin/user`
- [ ] OIDC login for an unknown user returns 403 (no JIT provisioning)
- [ ] `docker compose -f docker/docker-compose.dev.yml up -d` starts Authentik alongside PostgreSQL and Redis
- [ ] Existing internal auth code can be removed after migration
