# 011 UI Modernization — Quickstart

## Branch

```bash
git checkout 011-ui-modernization
```

## Prerequisites

```bash
pnpm install
docker compose -f docker/docker-compose.dev.yml up -d
pnpm run database:setup
```

## Development

```bash
# Start API
pnpm nx run api:serve

# Start Client (separate terminal)
pnpm nx run client:serve
```

Open http://localhost:4200

## Key Files

| File | Purpose |
|---|---|
| `apps/client/src/styles.scss` | Global styles entry point |
| `apps/client/src/styles/theme.scss` | Angular Material theme (M2 → M3) |
| `apps/client/src/styles/bootstrap.scss` | Bootstrap imports (TO BE REMOVED) |
| `apps/client/src/styles/tokens/` | Design token system (TO BE CREATED) |
| `apps/client/src/app/components/header/` | Navigation component |
| `apps/client/src/app/pages/family-dashboard/` | Main dashboard |

## Working Order

1. **Phase 1 first** — Design tokens must exist before anything else
2. **Phase 2** — M3 migration sets the Material foundation
3. **Phase 3** — Bootstrap removal uses the utility classes from Phase 1
4. **Phases 4-6** — Can be done in any order after 1-3

## Testing Changes

After each phase:
```bash
pnpm nx run client:build    # Build succeeds
pnpm nx run client:lint      # No lint errors
```

Visual checks:
- Toggle dark mode in user settings
- Resize browser from 375px to 1920px+
- Check all nav items work
- Verify dashboard, FMV, partnerships, K-1 pages
