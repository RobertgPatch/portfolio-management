# 011 UI Modernization — Data Model

No database/data model changes. This spec is purely visual/structural (CSS, SCSS, templates, component styles, navigation architecture).

## New Interfaces

### NavSection (in `@ghostfolio/common`)

```typescript
export interface NavSection {
  id: string;           // e.g., 'dashboard', 'valuations', 'entities'
  label: string;        // Display label in top bar
  icon: string;         // Material icon name
  route: string;        // Default route when section clicked
  children: NavItem[];  // Sidebar items (empty = no sidebar)
  routePrefixes: string[]; // URL prefixes that activate this section
  permission?: string;  // Optional permission gate (e.g., admin)
}

export interface NavItem {
  label: string;        // Display label in sidebar
  icon: string;         // Material icon name
  route: string;        // Router link
}
```

### SidebarState

```typescript
export type SidebarState = 'expanded' | 'collapsed' | 'hidden';
```

## Files Created

| File | Purpose |
|---|---|
| `apps/client/src/styles/tokens/_primitive.scss` | Raw design values (colors, spacing, type, radii, shadows) |
| `apps/client/src/styles/tokens/_semantic.scss` | Role-based tokens (surface, text, border, divider) |
| `apps/client/src/styles/tokens/_component.scss` | Component-level tokens (card, button, input, sidebar, nav) |
| `apps/client/src/styles/tokens/_index.scss` | Barrel import |
| `apps/client/src/styles/_utilities.scss` | Utility classes replacing Bootstrap |
| `apps/client/src/styles/_breakpoints.scss` | Responsive breakpoint system |
| `apps/client/src/app/core/navigation.service.ts` | Reactive section detection + sidebar item provider |
| `libs/ui/src/lib/sidenav/sidenav.component.ts` | Contextual sidebar component |
| `libs/ui/src/lib/sidenav/sidenav.component.html` | Sidebar template with nav list |
| `libs/ui/src/lib/sidenav/sidenav.component.scss` | Sidebar styles |
| `libs/common/src/lib/interfaces/nav.interface.ts` | NavSection, NavItem interfaces |
| `apps/client/src/app/pages/family-dashboard/dashboard-page.component.scss` | Extracted inline styles |

## Files Modified (Major)

| File | Change |
|---|---|
| `apps/client/src/styles.scss` | Refactored: import tokens, remove Bootstrap import, reduce from 650+ to ~200 lines |
| `apps/client/src/styles/theme.scss` | M2 → M3 migration (`mat.define-theme()`) |
| `apps/client/src/app/app.component.html` | Wrap main content in `mat-sidenav-container` |
| `apps/client/src/app/app.component.ts` | Inject `NavigationService`, manage sidebar state |
| `apps/client/src/app/app.component.scss` | Sidebar layout CSS |
| `apps/client/src/app/components/header/header.component.html` | Remove all dropdown menus; plain top-bar links with `routerLinkActive` |
| `apps/client/src/app/components/header/header.component.ts` | Remove menu items, simplify to section links |
| `apps/client/src/app/pages/family-dashboard/dashboard-page.component.ts` | Extract inline styles to external SCSS |
| 30+ component template files | Bootstrap class → token utility replacement |

## Files Deleted

| File | Reason |
|---|---|
| `apps/client/src/styles/bootstrap.scss` | Bootstrap removed entirely |
| `apps/client/src/styles/variables.scss` | Merged into token files |
| `libs/ui/src/lib/nav-menu-group/` | Dropdown menu wrapper no longer needed |

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
--color-primary / --color-primary-rgb
--color-secondary / --color-secondary-rgb
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
--card-radius / --card-padding / --card-shadow / --card-bg
--button-radius / --button-height
--input-radius / --input-border
--nav-height / --nav-bg
--sidebar-width-expanded / --sidebar-width-collapsed
--sidebar-bg / --sidebar-border
--sidebar-item-height / --sidebar-item-active-bg / --sidebar-item-hover-bg
--table-row-alt-bg / --table-border
```
