# 011 UI Modernization — Tasks

## Phase 1: Design Tokens & Foundation

- [ ] 1.1 Create `apps/client/src/styles/tokens/_primitive.scss` with raw color values, spacing scale (4px base), border radii, shadow definitions, font sizes
- [ ] 1.2 Create `apps/client/src/styles/tokens/_semantic.scss` with role-based tokens (surface, on-surface, primary, secondary, text-primary, text-secondary, text-muted, border, divider) for light and dark modes
- [ ] 1.3 Create `apps/client/src/styles/tokens/_component.scss` with card, button, input, table, nav, **sidebar** tokens
- [ ] 1.4 Create `apps/client/src/styles/tokens/_index.scss` barrel file
- [ ] 1.5 Create `apps/client/src/styles/_utilities.scss` with flexbox, display, spacing, typography, and responsive utility classes
- [ ] 1.6 Create `apps/client/src/styles/_breakpoints.scss` with breakpoint map and `respond-to` mixin
- [ ] 1.7 Integrate token imports into `styles.scss`, mapping existing `:root` custom properties to token values
- [ ] 1.8 Verify build succeeds and no visual regressions

## Phase 2: Angular Material M3 Migration

- [ ] 2.1 Read Angular Material M3 migration guide (check `node_modules/@angular/material` for latest API)
- [ ] 2.2 Update `styles/theme.scss` — replace `mat.m2-define-light-theme()` with `mat.define-theme()`
- [ ] 2.3 Define M3 color scheme using `#36CFCC` as primary seed, `#3686CF` as tertiary
- [ ] 2.4 Update density from `-3` to M3-compatible scale (`-1`)
- [ ] 2.5 Replace `mat.all-component-themes()` and `mat.all-component-typographies()` with `mat.theme()`
- [ ] 2.6 Update dark mode theme to use `mat.define-theme()` with `theme-type: dark`
- [ ] 2.7 Audit and fix Material component CSS overrides in `styles.scss` (remove M2-specific hacks)
- [ ] 2.8 Test all Material components: buttons, cards, menus, tables, dialogs, snackbars, form fields, chips, progress bars
- [ ] 2.9 Fix any typography scale changes from M2→M3
- [ ] 2.10 Verify build succeeds with zero `mat.m2-*` references

## Phase 3: Bootstrap Removal

- [ ] 3.1 Audit all Bootstrap class usage across codebase (generate full list by file)
- [ ] 3.2 Replace `row`/`col-*` grid classes with CSS Grid or Flexbox (header, dashboard, pages)
- [ ] 3.3 Replace `d-flex`, `d-inline-flex` display utilities
- [ ] 3.4 Replace `d-none`, `d-*-none`, `d-*-block`, `d-*-flex` responsive display utilities
- [ ] 3.5 Replace `text-muted`, `text-center`, `text-right`, `text-nowrap` typography utilities
- [ ] 3.6 Replace `font-weight-bold`, `font-weight-normal` utilities
- [ ] 3.7 Replace `mx-*`, `my-*`, `p-*`, `m-*`, `px-*`, `py-*` spacing utilities
- [ ] 3.8 Replace `badge`, `badge-*` with Material chip or custom badge
- [ ] 3.9 Replace `list-inline`, `list-inline-item`, `list-unstyled` with Flexbox
- [ ] 3.10 Remove `styles/bootstrap.scss` import from `styles.scss`
- [ ] 3.11 Remove `bootstrap` from `package.json` and run `pnpm install`
- [ ] 3.12 Full build verification and visual regression check

## Phase 4: Navigation Redesign (Top Bar + Contextual Sidebar)

### 4A: Interfaces & Service
- [ ] 4.1 Create `libs/common/src/lib/interfaces/nav.interface.ts` with `NavSection`, `NavItem`, `SidebarState` types
- [ ] 4.2 Export new interfaces from `libs/common/src/index.ts` barrel
- [ ] 4.3 Create `apps/client/src/app/core/navigation.service.ts` with section definitions, URL→section mapping, sidebar state management
- [ ] 4.4 Write unit tests for `NavigationService` — URL detection, sidebar items, state transitions

### 4B: Sidebar Component
- [ ] 4.5 Create `libs/ui/src/lib/sidenav/sidenav.component.ts` with `@Input() items`, `@Input() state`, `@Output() toggle`
- [ ] 4.6 Create `libs/ui/src/lib/sidenav/sidenav.component.html` — `mat-nav-list` with `routerLinkActive`, icon + label, collapse support
- [ ] 4.7 Create `libs/ui/src/lib/sidenav/sidenav.component.scss` — 260px expanded, 64px collapsed, transitions
- [ ] 4.8 Export sidenav component from `libs/ui/src/index.ts`

### 4C: App Shell Integration
- [ ] 4.9 Update `apps/client/src/app/app.component.html` — wrap content in `mat-sidenav-container` with `mat-sidenav` + `gf-sidenav`
- [ ] 4.10 Update `apps/client/src/app/app.component.ts` — inject `NavigationService`, manage sidebar mode/state signals
- [ ] 4.11 Create or update `apps/client/src/app/app.component.scss` — sidebar layout, responsive media queries

### 4D: Header Simplification
- [ ] 4.12 Update `header.component.html` — remove all `mat-menu` and `gf-nav-menu-group` usage; render flat section links with `routerLinkActive`
- [ ] 4.13 Update `header.component.ts` — remove `fmvMenuItems`, `partnershipsMenuItems`, `k1CenterMenuItems`, `legacyMenuItems` arrays; inject `NavigationService` for sections
- [ ] 4.14 Add hamburger button for mobile (< 768px) that calls `NavigationService.toggleSidebar()`
- [ ] 4.15 Update `header.component.scss` — active state styling (bottom border accent), remove dropdown styles

### 4E: Cleanup
- [ ] 4.16 Delete `libs/ui/src/lib/nav-menu-group/` directory (component, module, interface)
- [ ] 4.17 Remove `GfNavMenuGroupComponent` from all imports
- [ ] 4.18 Remove `NavMenuItem` interface references
- [ ] 4.19 Test all 6 sections: top bar highlights, sidebar items, route navigation
- [ ] 4.20 Test responsive behavior: ≥ 1200px (expanded), 768–1199px (collapsed), < 768px (overlay)
- [ ] 4.21 Test sidebar toggle (expanded ↔ collapsed) and mobile hamburger open/close

## Phase 5: Dashboard Modernization

- [ ] 5.1 Extract inline styles from `dashboard-page.component.ts` to `dashboard-page.component.scss`
- [ ] 5.2 Redesign hero metrics card with token-based colors, large type, countup animation
- [ ] 5.3 Create consistent card wrapper pattern (shared styles for title, content, optional legend)
- [ ] 5.4 Restyle allocation bars with token colors and hover tooltips
- [ ] 5.5 Update tables to use Material table with token-based alternating row colors
- [ ] 5.6 Add per-card skeleton loaders using `ngx-skeleton-loader`
- [ ] 5.7 Implement responsive grid (1-col mobile, 2-col tablet, 3-col desktop)
- [ ] 5.8 Verify dark mode renders correctly for all dashboard elements

## Phase 6: Page-by-Page Polish

- [ ] 6.1 FMV page — replace Bootstrap classes, consistent cards, responsive layout
- [ ] 6.2 Entity detail page — card styling, token colors, dark mode
- [ ] 6.3 Partnership detail page — consistent styling
- [ ] 6.4 Partnership performance page — chart consistency
- [ ] 6.5 Distributions page — table styling, cards
- [ ] 6.6 K-1 Documents page — list/table styling
- [ ] 6.7 K-1 Import page — form styling, upload UX
- [ ] 6.8 Cell Mapping page — table styling
- [ ] 6.9 Accounts page — consistent cards and tables
- [ ] 6.10 Portfolio Views page — card grid
- [ ] 6.11 Holdings page — table styling, dark mode
- [ ] 6.12 Analysis / Summary pages — chart consistency
- [ ] 6.13 Markets page — token colors
- [ ] 6.14 Admin pages — consistent styling
- [ ] 6.15 User Account page — form styling

## Final Validation

- [ ] 7.1 Full build: `pnpm nx run client:build` succeeds
- [ ] 7.2 Lint: `pnpm nx run client:lint` passes
- [ ] 7.3 Zero `mat.m2-*` references in SCSS
- [ ] 7.4 Zero `bootstrap` classes in templates/styles
- [ ] 7.5 All 6 top-bar section links highlight correctly
- [ ] 7.6 Sidebar shows correct items for each section
- [ ] 7.7 Sidebar expand/collapse works at all breakpoints
- [ ] 7.8 Mobile hamburger + overlay sidebar works
- [ ] 7.9 Dashboard has no sidebar
- [ ] 7.10 All pages verified in light mode
- [ ] 7.11 All pages verified in dark mode
- [ ] 7.12 Mobile navigation tested (375px, 768px, 1200px)
- [ ] 7.13 Lighthouse accessibility ≥ 90 on dashboard
