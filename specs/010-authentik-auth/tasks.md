# Tasks: Authentik Authentication Integration

**Input**: Design documents from `/specs/010-authentik-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, quickstart.md

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Environment & Configuration)

**Purpose**: Environment variables, `.env` template, and shared configuration

- [X] T001 Add Authentik environment variables to `.env.dev` template (`AUTHENTIK_SECRET_KEY`, `AUTHENTIK_BOOTSTRAP_PASSWORD`, `AUTHENTIK_BOOTSTRAP_EMAIL`, `AUTHENTIK_PORT`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_SCOPE`) in `.env.dev`
- [X] T002 [P] Update `.env` with Authentik configuration values per quickstart.md in `.env`
- [X] T003 [P] Register `AUTHENTIK_ADMIN_SUB` in `ConfigurationService` for bootstrap admin mapping in `apps/api/src/services/configuration/configuration.service.ts`

---

## Phase 2: Foundational — Docker Infrastructure (Blocking Prerequisites)

**Purpose**: Authentik containers must be running before any OIDC work can be tested

**⚠️ CRITICAL**: No OIDC or auth changes can be validated until this phase is complete

- [X] T004 Create PostgreSQL init script to create `authentik` database in `docker/init-authentik-db.sql`
- [X] T005 Add init script volume mount to postgres service in `docker/docker-compose.yml`
- [X] T006 Add `authentik-server` service to `docker/docker-compose.dev.yml` with environment variables for PostgreSQL (separate DB), Redis (DB index 1), bootstrap credentials, and port mapping `${AUTHENTIK_PORT:-9000}:9000`
- [X] T007 Add `authentik-worker` service to `docker/docker-compose.dev.yml` with same environment variables as server (command: worker, no ports)
- [X] T008 Validate Docker Compose starts all 4 containers: run `docker compose --env-file .env -f docker/docker-compose.dev.yml up -d` and verify `gf-postgres-dev`, `gf-redis-dev`, `gf-authentik-server`, `gf-authentik-worker` are healthy

**Checkpoint**: `docker ps` shows all 4 containers running; http://localhost:9000 loads Authentik admin UI

---

## Phase 3: User Story 1 — OIDC Login with Role Mapping (Priority: P1) 🎯 MVP

**Goal**: Users with pre-existing Ghostfolio accounts can log in via Authentik OIDC and their role is updated from Authentik group claims

**Independent Test**: Start Ghostfolio + Authentik, manually create a user in Ghostfolio DB with `provider=OIDC` and `thirdPartyId` matching an Authentik user's sub. Log in via Authentik and verify JWT is issued and role maps correctly.

### Implementation for User Story 1

- [X] T009 [US1] Add `groups?: string[]` to `ValidateOAuthLoginParams` interface in `apps/api/src/app/auth/interfaces/interfaces.ts`
- [X] T010 [US1] Implement `mapGroupsToRole(groups: string[]): Role` helper function in `apps/api/src/app/auth/auth.service.ts` — maps `ghostfolio-admin` → ADMIN, `ghostfolio-demo` → DEMO, default → USER
- [X] T011 [US1] Modify `AuthService.validateOAuthLogin()` to reject unknown users with 403 (remove JIT provisioning / `createUser` call) and update user role from groups claim on each login in `apps/api/src/app/auth/auth.service.ts`
- [X] T012 [US1] Modify `OidcStrategy.validate()` to extract `groups` claim from OIDC profile/idToken/userinfo and pass to `validateOAuthLogin()` in `apps/api/src/app/auth/oidc.strategy.ts`
- [X] T013 [US1] Remove `ENABLE_FEATURE_AUTH_OIDC` feature flag guard from `GET /auth/oidc` endpoint — OIDC is now always enabled in `apps/api/src/app/auth/auth.controller.ts`
- [X] T014 [US1] Update OIDC scope configuration to include `groups` — set `OIDC_SCOPE=openid profile email groups` in `.env` and verify `auth.module.ts` passes scope to strategy in `apps/api/src/app/auth/auth.module.ts`

**Checkpoint**: User with existing Ghostfolio record can log in via Authentik, receives correct role from group claims, and unregistered users get 403

---

## Phase 4: User Story 2 — Bootstrap Super Admin & Admin User Creation (Priority: P2)

**Goal**: A super admin is seeded on `database:setup` and can create new users from the admin panel

**Independent Test**: Run `npm run database:setup`, verify admin user exists in DB with `provider=OIDC` and `role=ADMIN`. Log in as admin, call `POST /admin/user` with a `thirdPartyId`, verify new user appears in DB and can log in.

### Implementation for User Story 2

- [X] T015 [US2] Add bootstrap super admin seed logic to `prisma/seed.mts` — upsert user with `provider=OIDC`, `thirdPartyId` from `AUTHENTIK_ADMIN_SUB` env var, `role=ADMIN`
- [X] T016 [US2] Add `createUserByAdmin(params: { thirdPartyId: string; role?: Role })` method to `AdminService` in `apps/api/src/app/admin/admin.service.ts` — creates user with `provider=OIDC`, validates no duplicate `thirdPartyId`, defaults role to `USER`
- [X] T017 [US2] Add `POST /admin/user` endpoint to `AdminController` with `@HasPermission(permissions.accessAdminControl)` guard, request body `{ thirdPartyId, role? }`, returns 201 with created user, 409 on duplicate in `apps/api/src/app/admin/admin.controller.ts`
- [X] T018 [US2] Disable public signup — modify `POST /user` endpoint in `UserController` to always return 403 Forbidden (remove `isUserSignupEnabled` check) in `apps/api/src/app/user/user.controller.ts`
- [X] T019 [US2] Remove `hasAdmin()` auto-role assignment logic from `UserService.createUser()` — role is now always explicitly provided in `apps/api/src/app/user/user.service.ts`

**Checkpoint**: `npm run database:setup` creates admin user; admin can create users via API; public signup returns 403

---

## Phase 5: User Story 3 — Frontend Auth UI Updates (Priority: P3)

**Goal**: Login page shows "Sign in" button pointing to OIDC, admin panel has "Create User" button, register page is removed

**Independent Test**: Navigate to https://localhost:4200/en, verify "Sign in" redirects to Authentik. Navigate to admin Users tab, verify "Create User" button opens a dialog and successfully creates a user. Verify `/register` route no longer exists.

### Implementation for User Story 3

- [X] T020 [US3] Update login dialog to show a single "Sign in" button linked to `/api/auth/oidc` — remove token input field and "Stay signed in" checkbox when OIDC is enabled in `apps/client/src/app/components/login-with-access-token-dialog/login-with-access-token-dialog.component.ts` and `.html`
- [X] T021 [US3] Add "Create User" button and dialog to admin Users component — dialog has fields for `thirdPartyId` (text input) and `role` (dropdown: USER/ADMIN/DEMO), calls `POST /admin/user` in `apps/client/src/app/components/admin-users/admin-users.component.ts` and `.html`
- [X] T022 [US3] Create `AdminCreateUserDialogComponent` standalone component with Material form fields for thirdPartyId and role selection in `apps/client/src/app/components/admin-users/create-user-dialog/`
- [X] T023 [US3] Add `postAdminUser(params: { thirdPartyId: string; role?: string })` method to `DataService` in `apps/client/src/app/services/data.service.ts`
- [X] T024 [US3] Remove the `/register` route and `RegisterPageComponent` — delete `apps/client/src/app/pages/register/` directory and remove route from app routing
- [X] T025 [US3] Remove `isUserSignupEnabled` toggle from admin overview — remove the "User Signup" slide toggle in `apps/client/src/app/components/admin-overview/admin-overview.component.ts` and `.html`
- [X] T026 [US3] Remove `createUserAccount` from global permissions computation in `apps/api/src/app/info/info.service.ts`

**Checkpoint**: Login page has clean "Sign in" button, admin can create users via UI, no registration page exists

---

## Phase 6: User Story 4 — Remove Deprecated Auth Strategies (Priority: P4)

**Goal**: Remove Google OAuth, WebAuthn, and anonymous login code that is now handled by Authentik

**Independent Test**: Verify `GET /auth/google`, WebAuthn endpoints, and `GET /auth/anonymous/:token` all return 404. Verify app compiles cleanly. Verify OIDC login and API key auth still work.

### Implementation for User Story 4

- [X] T027 [P] [US4] Delete `GoogleStrategy` and remove `passport-google-oauth20` dependency — delete `apps/api/src/app/auth/google.strategy.ts` and `npm uninstall passport-google-oauth20`
- [X] T028 [P] [US4] Delete `WebAuthService` — delete `apps/api/src/app/auth/web-auth.service.ts` and `npm uninstall @simplewebauthn/server`
- [X] T029 [P] [US4] Delete `AuthDeviceModule`, `AuthDeviceController`, `AuthDeviceService` — delete `apps/api/src/app/auth-device/` directory
- [X] T030 [US4] Remove Google OAuth endpoints (`GET /auth/google`, `GET /auth/google/callback`) from `apps/api/src/app/auth/auth.controller.ts`
- [X] T031 [US4] Remove WebAuthn endpoints (`POST /auth/webauthn/*`, `GET /auth/webauthn/*`) from `apps/api/src/app/auth/auth.controller.ts`
- [X] T032 [US4] Remove anonymous login endpoints (`GET /auth/anonymous/:accessToken`, `POST /auth/anonymous`) from `apps/api/src/app/auth/auth.controller.ts`
- [X] T033 [US4] Update `AuthModule` — remove `GoogleStrategy`, `WebAuthService`, `AuthDeviceModule` imports/providers in `apps/api/src/app/auth/auth.module.ts`
- [X] T034 [US4] Remove `ENABLE_FEATURE_AUTH_GOOGLE`, `GOOGLE_CLIENT_ID`, `GOOGLE_SECRET`, `ENABLE_FEATURE_AUTH_TOKEN`, `ACCESS_TOKEN_SALT` from `ConfigurationService` in `apps/api/src/services/configuration/configuration.service.ts`
- [X] T035 [US4] Remove `validateAnonymousLogin()` method from `AuthService` in `apps/api/src/app/auth/auth.service.ts`
- [X] T036 [US4] Remove `PROPERTY_IS_USER_SIGNUP_ENABLED` property handling from `PropertyService` in `apps/api/src/services/property/property.service.ts`
- [X] T037 [P] [US4] Remove Google/WebAuthn-related interfaces and types from `apps/api/src/app/auth/interfaces/interfaces.ts` and `libs/common/src/lib/interfaces/`
- [X] T038 [P] [US4] Clean up unused imports across auth module files — verify `tsc --noEmit` passes with no errors

**Checkpoint**: All deprecated auth strategies removed, app compiles cleanly, OIDC + API key auth verified working

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and validation

- [X] T039 [P] Update `DEVELOPMENT.md` with new Authentik setup instructions per quickstart.md
- [X] T040 [P] Update `docker/docker-compose.railway.yml` and `railway.toml` for production Authentik deployment (N/A — Authentik is an external service in production)
- [X] T041 [P] Update `README.md` authentication section to reference Authentik
- [X] T042 Remove unused npm packages — `passport-google-oauth20`, `@simplewebauthn/server`, `@simplewebauthn/types` from `package.json`
- [X] T043 Run full quickstart.md verification checklist end-to-end (builds pass, lint has only pre-existing warnings)
- [X] T044 Run `npx nx run-many --target=lint --all` — only pre-existing warnings, no new errors from auth changes
- [X] T045 Run `npx nx run-many --target=test --all` — all failures are pre-existing in portfolio/calculator/roai (unrelated to auth)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Docker Infrastructure)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1: OIDC Login)**: Depends on Phase 2 — requires Authentik running
- **Phase 4 (US2: Admin User Mgmt)**: Depends on Phase 2; can run in parallel with Phase 3
- **Phase 5 (US3: Frontend UI)**: Depends on Phase 3 (OIDC endpoints) and Phase 4 (admin API)
- **Phase 6 (US4: Remove Deprecated)**: Depends on Phases 3, 4, 5 — only after new auth is validated
- **Phase 7 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (OIDC Login)**: Foundation only — no dependency on other stories
- **US2 (Admin User Mgmt)**: Foundation only — can run in parallel with US1
- **US3 (Frontend UI)**: Depends on US1 (OIDC endpoint changes) + US2 (admin API)
- **US4 (Remove Deprecated)**: Depends on US1, US2, US3 fully verified — cleanup phase

### Within Each User Story

- Interface changes before service changes
- Service changes before controller changes
- Backend before frontend
- Core implementation before integration

### Parallel Opportunities

**Phase 1**: T001, T002, T003 — all in parallel (different files)

**Phase 2**: T004, T005 → T006, T007 → T008 (sequential docker-compose edits)

**Phase 3 (US1)**: T009 (interface) in parallel with T010 (helper), then T011 → T012 → T013, T014

**Phase 4 (US2)**: T015 (seed) in parallel with T016+T017 (admin API) in parallel with T018+T019 (disable signup)

**Phase 5 (US3)**: T020, T022, T023, T024, T025 — multiple parallel (different files)

**Phase 6 (US4)**: T027, T028, T029, T037 — deletions in parallel, then T030-T036 (controller/service edits), then T038 (verify)

---

## Parallel Example: User Story 2

```bash
# These can run in parallel (different files):
Task T015: "Add bootstrap super admin seed in prisma/seed.mts"
Task T016: "Add createUserByAdmin() to AdminService in apps/api/src/app/admin/admin.service.ts"
Task T018: "Disable public signup in apps/api/src/app/user/user.controller.ts"

# Then sequentially (same file or depends on above):
Task T017: "Add POST /admin/user endpoint in apps/api/src/app/admin/admin.controller.ts" (depends on T016)
Task T019: "Remove hasAdmin() auto-role in apps/api/src/app/user/user.service.ts" (depends on T018)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (env vars)
2. Complete Phase 2: Docker Infrastructure (Authentik running)
3. Complete Phase 3: US1 — OIDC Login with Role Mapping
4. **STOP and VALIDATE**: Manually test login with pre-seeded user
5. This is the minimum viable auth integration

### Incremental Delivery

1. Phase 1 + 2 → Authentik running alongside Ghostfolio
2. Phase 3 (US1) → OIDC login works → **MVP!**
3. Phase 4 (US2) → Admin can create users, bootstrap admin seeded
4. Phase 5 (US3) → Clean frontend UI, no more register page
5. Phase 6 (US4) → All legacy auth code removed
6. Phase 7 → Docs updated, tests passing, ready for merge
