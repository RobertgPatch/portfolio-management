# Implementation Plan: Authentik Seamless SSO Fix

**Branch**: `010-authentik-auth` | **Date**: 2026-04-07 | **Spec**: [spec.md](spec.md)
**Input**: User report — after Authentik login, user is returned to Ghostfolio login page instead of being seamlessly logged in. Authentik should replace all auth screens with branded theming.

## Summary

Fix the double-login UX issue where unauthenticated users see the Ghostfolio landing page and must manually click through a login dialog before being redirected to Authentik. Instead, unauthenticated users should be automatically redirected to Authentik (themed to match Ghostfolio). After authenticating, they should be seamlessly logged into the app with no intermediate pages.

## Technical Context

**Language/Version**: TypeScript 5.x (Angular 21+ / NestJS 11+)
**Primary Dependencies**: Angular Material, passport-openidconnect, Authentik 2024.12
**Storage**: PostgreSQL via Prisma, Authentik Brand API
**Testing**: Jest unit tests
**Target Platform**: Web (localhost:4200 client, localhost:3333 API, localhost:9000 Authentik)
**Project Type**: Web application (monorepo: apps/api + apps/client + libs/)
**Performance Goals**: Login latency <2s for OIDC flow
**Constraints**: No iframe embedding (blocked by Authentik CSP), no custom flow executor
**Scale/Scope**: 3 files modified (auth guard, header, token storage), 1 file deleted (login dialog), 1 setup script created

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Nx Monorepo Structure | PASS | Changes in `apps/client` and `docker/` only |
| II. NestJS Module Pattern | PASS | No API changes needed — callback flow works correctly |
| III. Prisma Data Layer | PASS | No schema changes |
| IV. TypeScript Strict Conventions | PASS | Removing unused code improves compliance |
| V. Simplicity First | PASS | Removing the login dialog and landing page redirect simplifies the flow |
| VI. Interface-First Design | PASS | No new interfaces needed |

**Post-Phase 1 re-check**: All gates still pass. Changes reduce complexity (fewer components, simpler guard logic).

## Project Structure

### Documentation (this feature)

```text
specs/010-authentik-auth/
├── plan.md              # This file (amended for SSO fix)
├── research.md          # Phase 0 output (amended)
├── data-model.md        # Unchanged from original
├── quickstart.md        # Updated with new flow
├── contracts/           # Unchanged from original
│   └── api-contracts.md
└── tasks.md             # Phase 2 output
```

### Source Code Changes

```text
apps/client/src/app/
├── core/
│   └── auth.guard.ts                    # MODIFY: Redirect to /api/auth/oidc instead of /start
├── components/
│   └── header/
│       ├── header.component.ts          # MODIFY: Sign in button → direct OIDC link
│       └── header.component.html        # MODIFY: Remove dialog open, use <a href>
│   └── login-with-access-token-dialog/  # DELETE: Entire directory (dialog no longer needed)
├── services/
│   └── token-storage.service.ts         # MODIFY: Default to localStorage (stay signed in)
└── pages/
    └── auth/
        └── auth-page.component.ts       # No change (callback handling works correctly)

docker/
├── authentik/
│   └── branding/
│       └── setup-branding.sh            # CREATE: Script to theme Authentik via API
└── docker-compose.dev.yml               # MODIFY: Mount logo + blueprint volume
```

**Structure Decision**: Modifying 3-4 existing files in `apps/client`, deleting 1 component directory, creating 1 setup script. Well within the "maximum 3 Nx projects per feature" constraint (only `apps/client` and `docker/` are touched).

## Complexity Tracking

> No constitution violations. Changes _reduce_ complexity by removing the login dialog component.
