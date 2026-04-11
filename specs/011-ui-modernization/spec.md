# Feature Specification: UI Modernization & Redesign

**Feature Branch**: `011-ui-modernization`
**Created**: 2026-04-11
**Status**: Draft
**Input**: Modernize the Ghostfolio Family Office UI — replace dropdown-submenu navigation with a top-bar + contextual left sidebar pattern, migrate from Angular Material M2 to M3, eliminate Bootstrap dependency, establish a design-token system, and create a cohesive, modern visual identity.

---

## Problem Statement

The current UI suffers from accumulated technical debt across multiple dimensions:

1. **Dropdown submenu navigation** — The top navbar uses `mat-menu` dropdowns for each section (FMV, Partnerships, K-1 Center, Analysis, Admin). This is not aligned with modern dashboard UIs (Stripe, GitHub, Linear, Addepar) which use a top bar + left sidebar pattern. Submenus are awkward on mobile and obscure available pages.
2. **Flat mobile navigation** — Mobile dumps all ~25 navigation items into a single `mat-menu` with no grouping or hierarchy.
3. **Outdated theming** — Still on Angular Material M2 API (`mat.m2-define-light-theme`) despite running Angular 21, which ships M3 as default. M2 will eventually be removed.
4. **Dual CSS frameworks** — Bootstrap 4.6 is imported for grid/utilities alongside Angular Material, creating conflicting paradigms (`d-flex`/`d-none` vs Material layout).
5. **No design-token system** — Colors, spacing, and typography are hardcoded across components (e.g., `#1976d2`, `#4caf50`, `rgba(0,0,0,0.6)` literals in dashboard).
6. **650+ line global stylesheet** — Monolithic `styles.scss` with specificity hacks and `!important` overrides.
7. **Inconsistent component patterns** — Family dashboard has 200+ lines of inline CSS; navigation mixes Bootstrap utility classes with Material components.
8. **Legacy branding** — "My Ghostfolio" still appears; overly-specific nav labels (e.g., "K-1 Center", "FMV").

---

## Goals

| # | Goal | Measurable Outcome |
|---|---|---|
| G1 | Replace dropdown submenus with top-bar + contextual left sidebar | Zero `mat-menu` navigation dropdowns; `mat-sidenav` used for section sub-navigation |
| G2 | Generalize navigation labels | Top bar shows: Dashboard, Valuations, Entities, Documents, Analytics, Admin |
| G3 | Migrate to Angular Material M3 theming | Zero references to `mat.m2-*` APIs |
| G4 | Remove Bootstrap dependency | `bootstrap` removed from `package.json`; no `d-*` utility classes |
| G5 | Establish CSS custom property design tokens | Spacing scale, color palette, typography, border-radius, shadows defined as tokens |
| G6 | Unify component styling | All page components use external SCSS files; no inline style arrays > 20 lines |
| G7 | Apply family-office branding | Consistent brand identity across all pages — logo, colors, typography |
| G8 | Improve dashboard UX | Card-based layout with clear hierarchy, data-viz consistency, loading states |

---

## User Scenarios & Testing

### User Story 1 — Consistent Visual Identity (Priority: P1)

As a family office administrator, I want the application to have a polished, consistent visual style across all pages so that it looks professional and purpose-built for family office management.

**Acceptance Scenarios**:
1. **Given** the user navigates between Dashboard, Partnerships, K-1 Center, and FMV pages, **When** they compare the visual styling, **Then** all pages use the same color palette, typography, card styles, and spacing.
2. **Given** the user toggles dark mode, **When** any page renders, **Then** all custom components and cards respect the dark theme with proper contrast ratios (WCAG AA).
3. **Given** the application loads, **When** the user inspects any component, **Then** no hardcoded hex colors appear in inline styles — all colors reference CSS custom properties.

### User Story 2 — Modern Navigation (Priority: P1)

As a family office administrator, I want navigation that uses a clean top bar for sections and a left sidebar for sub-pages so that I never have to interact with dropdown menus and can always see where I am within a section.

**Acceptance Scenarios**:
1. **Given** the user is on desktop (≥1024px), **When** the header renders, **Then** the top bar shows generalized section labels (Dashboard, Valuations, Entities, Documents, Analytics, Admin) with NO dropdown submenus.
2. **Given** the user clicks a top-bar section (e.g., "Entities"), **When** the page loads, **Then** a left sidebar (260px wide) appears showing that section's sub-pages (Entities, Partnerships, Distributions) with icons and labels.
3. **Given** the user clicks "Dashboard" in the top bar, **When** the page loads, **Then** NO sidebar appears (Dashboard is a single page with no sub-navigation).
4. **Given** the user clicks a different top-bar section while a sidebar is open, **When** the new section loads, **Then** the sidebar content swaps to the new section's items without closing and reopening.
5. **Given** the user is on mobile (<1024px), **When** they tap the menu icon, **Then** a slide-out drawer opens over the content with grouped navigation sections.
6. **Given** the user navigates between sub-pages within the sidebar, **When** they click a sidebar item, **Then** the active item is highlighted with the primary brand color and the sidebar remains open.
7. **Given** the user clicks a collapse toggle at the bottom of the sidebar, **When** the sidebar collapses, **Then** it shrinks to 64px showing only icons with tooltips, and the collapse state persists across sessions.

### User Story 3 — Dashboard Modernization (Priority: P2)

As a family office administrator, I want the dashboard to present financial data with clear card hierarchy, consistent chart styling, and smooth loading states.

**Acceptance Scenarios**:
1. **Given** the dashboard is loading data, **When** API calls are in-flight, **Then** skeleton loaders appear in place of each card (not a single global spinner).
2. **Given** data has loaded, **When** the dashboard renders, **Then** the hero metrics use large type with subtle animations (countup), and allocation/chart cards have consistent rounded corners, padding, and shadows.
3. **Given** the user resizes the browser, **When** the width drops below 768px, **Then** cards stack vertically in a single column with no horizontal overflow.

### User Story 4 — M3 Theme Migration (Priority: P2)

As a developer, I want the codebase to use Angular Material M3 theming so that we stay current with the framework and benefit from built-in design tokens.

**Acceptance Scenarios**:
1. **Given** the build runs, **When** the compiler processes SCSS, **Then** there are zero references to deprecated `mat.m2-*` functions.
2. **Given** the M3 theme is applied, **When** any Material component renders, **Then** it uses the M3 visual style (rounded shapes, tonal elevation, updated typography scale).
3. **Given** dark mode is toggled, **When** the theme switches, **Then** Material components, custom cards, and charts all update correctly.

---

## Technical Approach

### Phase 1: Design Tokens & Foundation

Create a design-token system using CSS custom properties, organized into layers:

```
tokens/
  _primitive.scss     → raw values (colors, font sizes, spacing units)
  _semantic.scss      → role-based tokens (--color-surface, --color-on-surface, --spacing-card, etc.)
  _component.scss     → component-level tokens (--card-radius, --card-shadow, --button-height, etc.)
```

**Color palette** (existing, to be tokenized):
- Primary: `#36CFCC` (teal)
- Secondary: `#3686CF` (blue)
- Warn: `#DC3545` (red)
- Surfaces: `#FFFFFF` / `#191919` (light/dark)
- Font: Inter, Roboto, Helvetica Neue

**Spacing scale** (4px base):
```
--space-1: 0.25rem   (4px)
--space-2: 0.5rem    (8px)
--space-3: 0.75rem   (12px)
--space-4: 1rem      (16px)
--space-6: 1.5rem    (24px)
--space-8: 2rem      (32px)
--space-12: 3rem     (48px)
--space-16: 4rem     (64px)
```

### Phase 2: Angular Material M3 Migration

1. Replace `mat.m2-define-light-theme` → `mat.define-theme` (M3 API)
2. Define M3 theme with custom palettes using `mat.define-colors`
3. Update density from `-3` to M3 density tokens
4. Remove all `mat-` prefixed CSS class overrides that conflict with M3

### Phase 3: Bootstrap Removal

1. Replace Bootstrap grid (`row`/`col-*`) with CSS Grid / Flexbox
2. Replace `d-flex`, `d-none d-sm-block`, etc. with custom utility classes or `@media` queries
3. Replace `text-muted`, `font-weight-bold`, `list-inline` with token-based classes
4. Remove `bootstrap` from `package.json`

### Phase 4: Navigation Redesign — Top Bar + Contextual Left Sidebar

Eliminate all dropdown submenus. Replace with a two-tier navigation:

**Top Bar** (`mat-toolbar`): Generalized section labels only — no dropdowns.

| Top Bar Label | Routes Covered | Sidebar Items |
|---|---|---|
| **Dashboard** | `/family-office` | *(no sidebar — single page)* |
| **Valuations** | `/fmv`, `/accounts` | FMV Dashboard, Accounts |
| **Entities** | `/entities`, `/partnerships`, `/distributions` | Entities, Partnerships, Distributions |
| **Documents** | `/k1-import`, `/k-documents`, `/cell-mapping` | K-1 Import, K-1 Documents, Cell Mapping |
| **Analytics** | `/home/*`, `/portfolio/*`, `/portfolio-views` | Overview, Holdings, Summary, Markets, Watchlist, Portfolio Views, FIRE, X-Ray |
| **Admin** | `/admin/*`, `/accounts`, `/resources`, `/pricing` | Admin Control, Accounts, Resources, Pricing |

**Left Sidebar** (`mat-sidenav` with `mat-nav-list`):
- Desktop ≥1024px: `mode="side"`, persistent, 260px expanded / 64px collapsed (icon-only)
- Mobile <1024px: `mode="over"`, backdrop, full slide-out
- Content is driven reactively by a `NavigationService` that maps URL segments to section + sidebar items
- Active link highlighting uses `routerLinkActive` directive (replacing manual `ngClass` comparisons)
- Collapse toggle at bottom of sidebar; state persisted in `localStorage`

**Layout change** (`app.component.html`):
```
Before: <header> → <main><router-outlet></main> → <footer>
After:  <header> → <mat-sidenav-container>
                      <mat-sidenav>sidebar</mat-sidenav>
                      <mat-sidenav-content>
                        <main><router-outlet></main>
                        <footer>...</footer>
                      </mat-sidenav-content>
                    </mat-sidenav-container>
```

**Components to create**:
- `NavigationService` — reactive section detection from URL, sidebar item provider
- `AppSidenavComponent` — contextual sidebar wrapper

**Components to retire**:
- `GfNavMenuGroupComponent` — the dropdown menu wrapper (no longer needed)

### Phase 5: Page-by-Page Modernization

Priority order:
1. Family Dashboard (`/family-office`) — extract inline styles, card redesign
2. FMV page (`/fmv`) — consistent cards
3. Partnership pages — entity detail, partnership detail
4. K-1 pages — documents, import
5. Portfolio/Analysis pages — holdings, summary
6. Admin pages

---

## Non-Goals

- **No functional changes** — This spec is purely visual/structural. No new features, API changes, or data model modifications.
- **No upstream Ghostfolio route removal** — Legacy routes (`/home`, `/zen`, `/portfolio`) remain functional but are deprioritized in navigation.
- **No SSR changes** — Server-side rendering (if any) is not in scope.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| M3 migration breaks component layouts | High | Migrate one component family at a time; visual regression screenshots |
| Bootstrap removal causes layout shifts | Medium | Replace grid by grid, class by class; don't bulk-remove |
| Dark mode regressions | Medium | Test every component in both themes after token migration |
| Large diff makes review hard | Medium | Break into focused PRs per phase if needed |

---

## Dependencies

- Angular Material 21.x (already installed — M3 APIs available)
- No new external dependencies required
- open-color 1.9.1 may be removable after token system is in place

---

## Success Criteria

1. `bootstrap` removed from `package.json`
2. Zero `mat.m2-*` references in SCSS
3. All colors in components reference CSS custom properties (no hardcoded hex in templates/styles)
4. Zero `mat-menu` dropdown navigation — top bar uses plain links, sub-nav uses `mat-sidenav`
5. Left sidebar renders contextual items for each section (Valuations, Entities, Documents, Analytics, Admin)
6. Dashboard page has no sidebar (single-page section)
7. Mobile navigation uses `mat-sidenav` drawer with `mode="over"`, not `mat-menu`
8. Sidebar collapse toggle works; collapsed state persists in `localStorage`
9. Family dashboard renders with consistent card styling and skeleton loaders
10. Lighthouse accessibility score ≥ 90 on dashboard page
11. Both light and dark themes work without visual artifacts
12. `GfNavMenuGroupComponent` removed from codebase
