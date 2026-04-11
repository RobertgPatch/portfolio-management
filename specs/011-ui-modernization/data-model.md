# 011 UI Modernization — Data Model

No data model changes. This spec is purely visual/structural (CSS, SCSS, templates, component styles).

## Files Created

| File | Purpose |
|---|---|
| `apps/client/src/styles/tokens/_primitive.scss` | Raw design values |
| `apps/client/src/styles/tokens/_semantic.scss` | Role-based tokens |
| `apps/client/src/styles/tokens/_component.scss` | Component-level tokens |
| `apps/client/src/styles/tokens/_index.scss` | Barrel import |
| `apps/client/src/styles/_utilities.scss` | Utility classes replacing Bootstrap |
| `apps/client/src/styles/_breakpoints.scss` | Responsive breakpoint system |

## Files Modified (Major)

| File | Change |
|---|---|
| `apps/client/src/styles.scss` | Refactored to import tokens; remove Bootstrap; reduce to < 200 lines |
| `apps/client/src/styles/theme.scss` | M2 → M3 migration |
| `apps/client/src/styles/bootstrap.scss` | **Deleted** |
| `apps/client/src/styles/variables.scss` | Merged into tokens, then **deleted** |
| `apps/client/src/app/components/header/header.component.html` | Navigation redesign |
| `apps/client/src/app/components/header/header.component.ts` | Mobile drawer logic |
| `apps/client/src/app/pages/family-dashboard/dashboard-page.component.ts` | Inline styles extracted |
| `apps/client/src/app/pages/family-dashboard/dashboard-page.component.scss` | **Created** — extracted styles |
| 30+ component template files | Bootstrap class → token utility replacement |

## Design Token Schema

### Primitive Tokens
```
--color-teal-{50..900}
--color-blue-{50..900}
--color-red-{50..900}
--color-gray-{50..900}
--space-{1,2,3,4,6,8,12,16}
--radius-{sm,md,lg,xl,full}
--shadow-{sm,md,lg}
--font-size-{xs,sm,base,lg,xl,2xl,3xl}
--font-weight-{normal,medium,semibold,bold}
--line-height-{tight,normal,relaxed}
```

### Semantic Tokens
```
--color-primary
--color-secondary
--color-warn
--color-surface
--color-surface-raised
--color-on-surface
--color-text-primary
--color-text-secondary
--color-text-muted
--color-border
--color-divider
```

### Component Tokens
```
--card-radius
--card-padding
--card-shadow
--card-bg
--button-radius
--button-height
--input-radius
--input-border
--nav-height
--nav-bg
--table-row-alt-bg
--table-border
```
