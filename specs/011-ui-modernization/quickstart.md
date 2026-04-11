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
| `apps/client/src/styles/bootstrap.scss` | Bootstrap imports (**DELETED in Phase 3**) |
| `apps/client/src/styles/tokens/` | Design token SCSS files (**Created in Phase 1**) |
| `apps/client/src/styles/_utilities.scss` | Utility classes replacing Bootstrap (**Phase 1**) |
| `apps/client/src/styles/_breakpoints.scss` | Responsive breakpoint system (**Phase 1**) |
| `apps/client/src/app/core/navigation.service.ts` | Section detection + sidebar items (**Phase 4**) |
| `libs/ui/src/lib/sidenav/` | Contextual sidebar component (**Phase 4**) |
| `libs/common/src/lib/interfaces/nav.interface.ts` | NavSection / NavItem interfaces (**Phase 4**) |
| `apps/client/src/app/components/header/` | Top bar (simplified in **Phase 4**) |
| `apps/client/src/app/app.component.html` | App shell with mat-sidenav-container (**Phase 4**) |
| `apps/client/src/app/pages/family-dashboard/` | Main dashboard |

## Working Order

1. **Phase 1** — Design tokens must exist before anything else
2. **Phase 2** — M3 migration sets the Material foundation
3. **Phase 3** — Bootstrap removal uses the utility classes from Phase 1
4. **Phase 4** — Navigation redesign (top bar + contextual sidebar)
5. **Phase 5** — Dashboard polish
6. **Phase 6** — Page-level template cleanup

## Navigation Architecture

```
┌─────────────────────────────────────────────────┐
│  Header (mat-toolbar) — flat section links       │
├─────────┬───────────────────────────────────────┤
│ Sidebar │  <router-outlet />                     │
│  260px  │                                        │
│  (side) │  Main content area                     │
│         │                                        │
├─────────┴───────────────────────────────────────┤
│  Footer                                          │
└─────────────────────────────────────────────────┘
```

- **Top bar**: Section labels only (Dashboard, Valuations, Entities, Documents, Analytics, Admin)
- **Sidebar**: Contextual `mat-sidenav` — items change based on active section
- **No dropdowns**: `GfNavMenuGroupComponent` is deleted
- **NavigationService**: Maps current URL → active section → sidebar items

## Testing Changes

After each phase:
```bash
pnpm nx run client:build    # Build succeeds
pnpm nx run client:lint      # No lint errors
```

Visual checks:
- Toggle dark mode in user settings
- Resize browser from 375px to 1920px+
- All 6 section links work in top bar
- Sidebar shows correct items for each section
- Sidebar collapses/expands on toggle
- Mobile: hamburger opens overlay sidebar
- Dashboard has no sidebar
- Verify Valuations, Entities, Documents, Analytics, Admin pages
