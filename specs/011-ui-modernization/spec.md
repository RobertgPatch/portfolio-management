# Feature Specification: UI Modernization & Redesign

**Feature Branch**: `011-ui-modernization`
**Created**: 2025-04-11
**Status**: Draft
**Input**: Modernize the Ghostfolio Family Office UI — migrate from Angular Material M2 to M3, eliminate Bootstrap dependency, establish a design-token system, and create a cohesive, modern visual identity.

---

## Problem Statement

The current UI suffers from accumulated technical debt across multiple dimensions:

1. **Outdated theming** — Still on Angular Material M2 API (`mat.m2-define-light-theme`) despite running Angular 21, which ships M3 as default. M2 will eventually be removed.
2. **Dual CSS frameworks** — Bootstrap 4.6 is imported for grid/utilities alongside Angular Material, creating conflicting paradigms (`d-flex`/`d-none` vs Material layout).
3. **No design-token system** — Colors, spacing, and typography are hardcoded across components (e.g., `#1976d2`, `#4caf50`, `rgba(0,0,0,0.6)` literals in dashboard).
4. **650+ line global stylesheet** — Monolithic `styles.scss` with specificity hacks and `!important` overrides.
5. **Inconsistent component patterns** — Family dashboard has 200+ lines of inline CSS; navigation mixes Bootstrap utility classes with Material components.
6. **Poor mobile experience** — Mobile nav dumps all items into a flat `mat-menu` with no structure.
7. **Legacy branding** — "My Ghostfolio" still appears; no cohesive family-office visual identity.

---

## Goals

| # | Goal | Measurable Outcome |
|---|---|---|
| G1 | Migrate to Angular Material M3 theming | Zero references to `mat.m2-*` APIs |
| G2 | Remove Bootstrap dependency | `bootstrap` removed from `package.json`; no `d-*` utility classes |
| G3 | Establish CSS custom property design tokens | Spacing scale, color palette, typography, border-radius, shadows defined as tokens |
| G4 | Unify component styling | All page components use external SCSS files; no inline style arrays > 20 lines |
| G5 | Modernize navigation | Responsive sidebar/drawer on mobile; grouped navigation with icons |
| G6 | Apply family-office branding | Consistent brand identity across all pages — logo, colors, typography |
| G7 | Improve dashboard UX | Card-based layout with clear hierarchy, data-viz consistency, loading states |

---

## User Scenarios & Testing

### User Story 1 — Consistent Visual Identity (Priority: P1)

As a family office administrator, I want the application to have a polished, consistent visual style across all pages so that it looks professional and purpose-built for family office management.

**Acceptance Scenarios**:
1. **Given** the user navigates between Dashboard, Partnerships, K-1 Center, and FMV pages, **When** they compare the visual styling, **Then** all pages use the same color palette, typography, card styles, and spacing.
2. **Given** the user toggles dark mode, **When** any page renders, **Then** all custom components and cards respect the dark theme with proper contrast ratios (WCAG AA).
3. **Given** the application loads, **When** the user inspects any component, **Then** no hardcoded hex colors appear in inline styles — all colors reference CSS custom properties.

### User Story 2 — Modern Navigation (Priority: P1)

As a family office administrator, I want navigation that works well on both desktop and mobile devices with clear grouping and visual hierarchy.

**Acceptance Scenarios**:
1. **Given** the user is on desktop (≥1024px), **When** the header renders, **Then** the navigation shows grouped top-level items with dropdown submenus, each with an icon and label.
2. **Given** the user is on mobile (<1024px), **When** they tap the menu icon, **Then** a slide-out drawer opens with grouped navigation sections (expandable/collapsible).
3. **Given** the user is on any page, **When** they look at the navigation, **Then** the active section and page are visually highlighted with the primary brand color.

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

### Phase 4: Navigation Redesign

**Desktop**: Keep top toolbar but with cleaner grouped dropdowns, icon+label pairs, active state indicator (bottom border accent).

**Mobile**: Replace flat mat-menu dump with `mat-sidenav` drawer containing collapsible `mat-expansion-panel` groups:
- Dashboard
- Fair Market Value → [Dashboard, Accounts]
- Partnerships → [Entities, Partnerships, Distributions]
- K-1 Center → [Import, Documents, Cell Mapping]
- Analysis → [Overview, Holdings, Summary, Markets]
- Admin → [Control, Accounts, Resources]

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
4. Mobile navigation uses drawer pattern, not flat menu dump
5. Family dashboard renders with consistent card styling and skeleton loaders
6. Lighthouse accessibility score ≥ 90 on dashboard page
7. Both light and dark themes work without visual artifacts
