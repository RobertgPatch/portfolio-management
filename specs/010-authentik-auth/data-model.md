# Data Model: Authentik Authentication Integration

**Spec**: 010 | **Date**: 2026-04-07

## Entities

### Existing Entities (Modified)

#### User (Prisma — `prisma/schema.prisma`)

No schema changes required. The existing fields support the Authentik integration:

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `provider` | `Provider` enum | None | `OIDC` value already exists |
| `thirdPartyId` | `String?` | None | Will store Authentik `sub` (UUID) |
| `role` | `Role` enum | None | Will be set from Authentik groups claim |
| `authChallenge` | `String?` | **Deprecate** | WebAuthn moves to Authentik |
| `authDevices` | `AuthDevice[]` | **Deprecate** | WebAuthn moves to Authentik |

#### Provider Enum (Prisma)

```prisma
enum Provider {
  ANONYMOUS      # Kept for backward compat during migration
  GOOGLE         # Deprecated — federated through Authentik
  INTERNET_IDENTITY  # Unchanged
  OIDC           # Primary — all Authentik logins use this
}
```

No enum changes needed. Existing `OIDC` value is sufficient.

### Existing Entities (Deprecated — Removal in Phase 2)

#### AuthDevice (Prisma)

WebAuthn/FIDO2 management moves to Authentik. The `AuthDevice` model and `AuthDeviceService`/`AuthDeviceController` will be removed after migration.

| Field | Type | Status |
|-------|------|--------|
| `credentialId` | `Bytes` | Deprecated |
| `credentialPublicKey` | `Bytes` | Deprecated |
| `counter` | `Int` | Deprecated |

#### ApiKey (Prisma)

**No changes.** API key authentication is independent of OIDC.

### New Entities

No new Prisma models required. Authentik maintains its own user/group/device data in its separate database.

### Bootstrap Super Admin

During `database:setup` (Prisma seed), a default admin user is created:

```typescript
// prisma/seed.mts — new seed logic
await prisma.user.upsert({
  where: { provider_thirdPartyId: { provider: 'OIDC', thirdPartyId: AUTHENTIK_ADMIN_SUB } },
  update: {},
  create: {
    provider: 'OIDC',
    thirdPartyId: AUTHENTIK_ADMIN_SUB,  // Authentik bootstrap admin's sub claim
    role: 'ADMIN'
  }
});
```

- `AUTHENTIK_ADMIN_SUB` is determined after first Authentik boot (the bootstrap admin's UUID)
- Alternatively, use a well-known placeholder that gets updated on first Authentik login
- This user has `role=ADMIN` and can create other users via `POST /admin/user`

### User Creation Model (Admin-Managed)

Admins create users by providing:

```typescript
interface CreateUserByAdminParams {
  thirdPartyId: string;   // Authentik user UUID (sub claim)
  role?: Role;            // ADMIN | USER | DEMO (default: USER)
}
```

The admin must first create the user in Authentik, then register them in Ghostfolio with the matching `thirdPartyId`. This ensures identity exists in both systems before the user can log in.

## Configuration Model

### New Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `AUTHENTIK_SECRET_KEY` | `string` | Yes (dev) | — | Authentik cryptographic secret (≥50 chars) |
| `AUTHENTIK_BOOTSTRAP_PASSWORD` | `string` | Yes (dev) | — | Initial Authentik admin password |
| `AUTHENTIK_BOOTSTRAP_EMAIL` | `string` | Yes (dev) | — | Initial Authentik admin email |
| `AUTHENTIK_PORT` | `number` | No | `9000` | Authentik HTTP port |

### Modified Environment Variables

| Variable | Change | Notes |
|----------|--------|-------|
| `OIDC_ISSUER` | Point to Authentik | `http://localhost:9000/application/o/ghostfolio/` |
| `OIDC_CLIENT_ID` | Authentik client ID | Generated in Authentik admin |
| `OIDC_CLIENT_SECRET` | Authentik client secret | Generated in Authentik admin |
| `OIDC_SCOPE` | Add `groups` | `openid profile email groups` |
| `ENABLE_FEATURE_AUTH_OIDC` | `true` | Enable OIDC flow |
| `ENABLE_FEATURE_AUTH_GOOGLE` | Remove | Google federated through Authentik |
| `GOOGLE_CLIENT_ID` | Remove from Ghostfolio | Move to Authentik Google Source config |
| `GOOGLE_SECRET` | Remove from Ghostfolio | Move to Authentik Google Source config |

### Removed Environment Variables (Post-Migration)

| Variable | Reason |
|----------|--------|
| `ENABLE_FEATURE_AUTH_GOOGLE` | Google handled by Authentik |
| `GOOGLE_CLIENT_ID` | Moved to Authentik |
| `GOOGLE_SECRET` | Moved to Authentik |
| `ENABLE_FEATURE_AUTH_TOKEN` | Anonymous login deprecated |
| `ACCESS_TOKEN_SALT` | No longer needed |

## State Transitions

### User Authentication State

```
[Unauthenticated] ──→ Click "Sign in" ──→ [Redirect to Authentik]
                                               │
                                               ▼
                                     [Authentik Login UI]
                                     (username/password, Google,
                                      WebAuthn — all at Authentik)
                                               │
                                               ▼
                                     [Authentik Callback]
                                     POST /api/auth/oidc/callback
                                               │
                                               ▼
                                     [OidcStrategy.validate()]
                                     Extract sub + groups claims
                                               │
                                     ┌─────────┴──────────┐
                                     ▼                    ▼
                              [User exists?]       [User NOT found]
                              Lookup by sub         → Return 403
                                     │              (no JIT provisioning)
                                     ▼
                              [Update role from
                               groups claim]
                                     │
                                     ▼
                              [Sign internal JWT {id}]
                                     │
                                     ▼
                              [Redirect to /en/auth/:jwt]
                                     │
                                     ▼
                              [Angular stores JWT]
                              TokenStorageService
                                     │
                                     ▼
                              [Authenticated]
                              All API calls use internal JWT
```

### Admin User Creation Flow

```
[Admin logged in] ──→ POST /admin/user
                       { thirdPartyId, role? }
                              │
                              ▼
                       [Validate admin permission]
                              │
                              ▼
                       [Create User in Prisma]
                       provider=OIDC, thirdPartyId, role
                              │
                              ▼
                       [Return created user]
                       User can now log in via Authentik
```

### Role Mapping State

```
Authentik Groups Claim        →    Ghostfolio Role
─────────────────────              ──────────────
["ghostfolio-admin", ...]     →    ADMIN
["ghostfolio-demo", ...]      →    DEMO
["ghostfolio-user"] or []     →    USER
(no user found + signup off)  →    REJECTED (403)
```

## Validation Rules

1. `thirdPartyId` must be non-empty when `provider=OIDC`
2. OIDC login MUST match an existing user — unknown `sub` values are rejected with 403 (no JIT provisioning)
3. Role mapping: `ghostfolio-admin` takes precedence over other groups
4. If no recognized group is present, default to `USER`
5. Public signup endpoint (`POST /user`) is permanently disabled (returns 403)
6. Only users with `accessAdminControl` permission can create new users
7. API key auth bypasses OIDC entirely — no validation against Authentik
8. Bootstrap admin user is created during `database:setup` with `role=ADMIN`
