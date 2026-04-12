# Tasks: UI Modernization & Redesign

**Input**: Design documents from `/specs/011-ui-modernization/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/navigation.md

**Tests**: Not explicitly requested in spec — test tasks omitted. Manual visual verification included.

**Organization**: Tasks grouped by user story. US4 (M3 Migration) is placed in Foundational phase because it blocks US1 and US3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Design Token System)

**Purpose**: Create the CSS custom property design-token foundation that all subsequent phases depend on.

- [x] T001 Create `apps/client/src/styles/tokens/_primitive.scss` with color ramps (teal-50..900, blue-50..900, red-50..900, gray-50..900), spacing scale (4px base: space-1 through space-16), border radii (sm/md/lg/xl/full), shadows (sm/md/lg), font sizes (xs through 3xl), font weights, line heights
- [x] T002 [P] Create `apps/client/src/styles/tokens/_semantic.scss` with role-based tokens for light and dark modes: --color-primary, --color-primary-rgb, --color-secondary, --color-secondary-rgb, --color-warn, --color-surface, --color-surface-raised, --color-on-surface, --color-text-primary, --color-text-secondary, --color-text-muted, --color-border, --color-divider
- [x] T003 [P] Create `apps/client/src/styles/tokens/_component.scss` with card tokens (radius, padding, shadow, bg), button tokens (radius, height), input tokens (radius, border), nav tokens (height, bg), sidebar tokens (width-expanded: 260px, width-collapsed: 64px, bg, border, item-height, item-active-bg, item-hover-bg, transition), table tokens (row-alt-bg, border)
- [x] T004 Create `apps/client/src/styles/tokens/_index.scss` barrel file that forwards _primitive, _semantic, _component
- [x] T005 [P] Create `apps/client/src/styles/_utilities.scss` with utility classes: flex/inline-flex, display (hidden responsive variants), spacing (m-*/p-* using token scale), typography (text-muted, text-center, text-right, text-nowrap, font-weight-bold/normal), alignment (items-center, justify-center/between/end)
- [x] T006 [P] Create `apps/client/src/styles/_breakpoints.scss` with breakpoint map ($breakpoints: sm 576px, md 768px, lg 1024px, xl 1200px, xxl 1400px) and `respond-to($bp)` mixin

**Checkpoint**: Token files exist. No visual changes yet — build must still pass.

---

## Phase 2: Foundational (M3 Migration + Token Integration) — includes US4

**Purpose**: Migrate Angular Material from M2 to M3 theming and wire token system into global styles. **BLOCKS all user stories.**

**⚠️ CRITICAL**: US1, US2, and US3 cannot begin until this phase is complete.

- [x] T007 [US4] Replace `mat.m2-define-light-theme()` with `mat.define-theme()` in `apps/client/src/styles/theme.scss`
- [x] T008 [US4] Define M3 color scheme using `#36CFCC` as primary seed and `#3686CF` as tertiary in `apps/client/src/styles/theme.scss`
- [x] T009 [US4] Update density from `-3` to M3-compatible scale (`-1` or `0`) in `apps/client/src/styles/theme.scss`
- [x] T010 [US4] Replace `mat.all-component-themes($theme)` and `mat.all-component-typographies()` with `@include mat.theme($theme)` in `apps/client/src/styles/theme.scss`
- [x] T011 [US4] Update dark mode theme to use `mat.define-theme()` with `theme-type: dark` in `apps/client/src/styles/theme.scss`
- [x] T012 [US4] Audit and fix M2-specific CSS overrides in `apps/client/src/styles.scss` — remove `!important` hacks targeting `.mat-mdc-*` classes that conflict with M3 defaults
- [x] T013 [US4] Fix typography scale changes from M2→M3 — verify headings, body text, button labels, form labels render correctly across all pages
- [x] T014 Integrate token imports into `apps/client/src/styles.scss` — add `@use 'styles/tokens'` and map existing `:root` custom properties to token values
- [x] T015 [US4] Verify build succeeds with zero `mat.m2-*` references in any SCSS file

**Checkpoint**: M3 theme active. Token system integrated. All Material components render with M3 styling. US4 acceptance criteria met: zero M2 references, M3 visual style, correct dark mode.

---

## Phase 3: User Story 1 — Consistent Visual Identity (Priority: P1) 🎯 MVP

**Goal**: Remove Bootstrap dependency and ensure all components use token-based CSS custom properties — zero hardcoded hex colors, zero Bootstrap classes.

**Independent Test**: Build passes with `bootstrap` removed from `package.json`. `grep -r "d-flex\|d-none\|col-\|row " apps/client/src/` returns zero matches. No hardcoded hex colors in component templates.

### Implementation for User Story 1

- [x] T016 [US1] Audit all Bootstrap class usage across `apps/client/src/` — generate list grouped by class pattern and file count (reference research.md Bootstrap Class Audit table)
- [x] T017 [P] [US1] Replace `row`/`col-*` grid classes with CSS Grid or token Flexbox utilities across all component templates (~200 occurrences per research.md)
- [x] T018 [P] [US1] Replace `d-flex`/`d-inline-flex` display utilities with `.flex`/`.inline-flex` token utilities (~150 occurrences)
- [x] T019 [P] [US1] Replace `d-none`/`d-*-none`/`d-*-block`/`d-*-flex` responsive display classes with `@media` queries or `.hidden-*` token utilities (~80 occurrences)
- [x] T020 [P] [US1] Replace `text-muted`/`text-center`/`text-right`/`text-nowrap` typography classes with `color: var(--color-text-muted)` and token utility classes (~30 occurrences)
- [x] T021 [P] [US1] Replace `font-weight-bold`/`font-weight-normal` with `font-weight: var(--font-weight-bold)` token utilities (~25 occurrences)
- [x] T022 [P] [US1] Replace `mx-*`/`my-*`/`p-*`/`m-*`/`px-*`/`py-*` spacing classes with token-based spacing utilities (~100 occurrences)
- [x] T023 [P] [US1] Replace `align-items-center`/`justify-content-*` with `.items-center`/`.justify-*` token utilities (~100 occurrences)
- [x] T024 [P] [US1] Replace `badge`/`badge-*` with Material chip or custom badge component (~10 occurrences)
- [x] T025 [P] [US1] Replace `list-inline`/`list-inline-item`/`list-unstyled` with Flexbox (~5 occurrences)
- [x] T026 [US1] Replace all hardcoded hex colors in component templates and SCSS files with CSS custom property references (e.g., `#1976d2` → `var(--color-primary)`)
- [x] T027 [US1] Remove `@import 'styles/bootstrap'` from `apps/client/src/styles.scss`
- [x] T028 [US1] Delete `apps/client/src/styles/bootstrap.scss`
- [x] T029 [US1] Delete `apps/client/src/styles/variables.scss` (values merged into token files in Phase 1)
- [x] T030 [US1] Remove `bootstrap` from `package.json` and run `pnpm install`
- [x] T031 [US1] Full build verification: `pnpm nx run client:build` passes with zero Bootstrap classes and zero hardcoded hex colors

**Checkpoint**: Bootstrap fully removed. All components use token-based styling. US1 acceptance criteria met: consistent palette, dark mode contrast, no inline hex colors.

---

## Phase 4: User Story 2 — Modern Navigation (Priority: P1)

**Goal**: Replace dropdown-submenu navigation with a top-bar + contextual left sidebar. Users click a top-bar section and a left sidebar shows that section's sub-pages. No `mat-menu` dropdowns for navigation.

**Independent Test**: All 6 top-bar sections (Dashboard, Valuations, Entities, Documents, Analytics, Admin) link correctly. Sidebar shows contextual items per contracts/navigation.md. Dashboard has no sidebar. Mobile shows hamburger → overlay drawer.

### 4A: Interfaces & Service

- [x] T032 [P] [US2] Create `NavSection`, `NavItem` interfaces and `SidebarState` type in `libs/common/src/lib/interfaces/nav.interface.ts` per data-model.md interface definitions
- [x] T033 [US2] Export `NavSection`, `NavItem`, `SidebarState` from `libs/common/src/index.ts` barrel
- [x] T034 [US2] Create `NavigationService` in `apps/client/src/app/core/navigation.service.ts` — define all 6 sections with children per contracts/navigation.md §2, implement URL→section detection via `Router.events` (longest routePrefix match), expose `activeSection$`, `sidebarItems$`, `sidebarState$` (persisted in `localStorage`), `toggleSidebar()`, `setSidebarState()`

### 4B: Sidebar Component

- [x] T035 [P] [US2] Create `GfSidenavComponent` TypeScript in `libs/ui/src/lib/sidenav/sidenav.component.ts` — standalone component with `@Input() items: NavItem[]`, `@Input() state: SidebarState`, `@Input() activeRoute: string`, `@Output() itemClick`, `@Output() toggle`
- [x] T036 [P] [US2] Create `libs/ui/src/lib/sidenav/sidenav.component.html` — `mat-nav-list` with `@for`, `routerLink`, `routerLinkActive="active"`, `mat-icon` + conditional label per contracts/navigation.md §5 template structure
- [x] T037 [P] [US2] Create `libs/ui/src/lib/sidenav/sidenav.component.scss` — 260px expanded width, 64px collapsed, `width 200ms cubic-bezier(0.4,0,0.2,1)` transition, active/hover backgrounds using sidebar tokens, collapse toggle button at bottom
- [x] T038 [US2] Create `libs/ui/src/lib/sidenav/index.ts` barrel and export `GfSidenavComponent` from `libs/ui/src/index.ts`

### 4C: App Shell Integration

- [x] T039 [US2] Update `apps/client/src/app/app.component.html` — wrap `<main>` and `<gf-footer>` in `<mat-sidenav-container>` with `<mat-sidenav>` containing `<gf-sidenav>` per contracts/navigation.md §6 app shell layout
- [x] T040 [US2] Update `apps/client/src/app/app.component.ts` — inject `NavigationService` and `BreakpointObserver`, create signals for `sidebarMode` (side vs over), `sidebarOpened`, `sidebarWidth`, `sidebarItems`, `sidebarState`, `currentRoute` per responsive rules in contracts/navigation.md §3
- [x] T041 [US2] Update `apps/client/src/app/app.component.scss` — `mat-sidenav-container` height `calc(100vh - var(--nav-height))`, sidebar transition, responsive media queries for 768px and 1200px breakpoints

### 4D: Header Simplification

- [x] T042 [US2] Update `apps/client/src/app/components/header/header.component.html` — remove ALL `mat-menu` elements and `gf-nav-menu-group` components; render 6 flat section links (Dashboard, Valuations, Entities, Documents, Analytics, Admin) with `routerLink` to each section's default route and `routerLinkActive` per contracts/navigation.md §1
- [x] T043 [US2] Update `apps/client/src/app/components/header/header.component.ts` — remove `fmvMenuItems`, `partnershipsMenuItems`, `k1CenterMenuItems`, `legacyMenuItems` arrays and `NavMenuItem` import; inject `NavigationService`; expose `sections` for template; add hamburger toggle method
- [x] T044 [US2] Add hamburger `mat-icon-button` (menu icon) visible only on mobile (<768px) in `apps/client/src/app/components/header/header.component.html` that calls `NavigationService.toggleSidebar()`
- [x] T045 [US2] Update `apps/client/src/app/components/header/header.component.scss` — active section gets 2px bottom border in primary color; remove all dropdown/menu-related styles; hide section links on mobile (<768px)

### 4E: Cleanup & Verification

- [x] T046 [US2] Delete `libs/ui/src/lib/nav-menu-group/` directory entirely (component TS, HTML, SCSS, interface, index)
- [x] T047 [US2] Remove all `GfNavMenuGroupComponent` imports and `NavMenuItem` interface references across the codebase
- [x] T048 [US2] Test all 6 top-bar sections navigate correctly and highlight active section per contracts/navigation.md §7 URL mapping table
- [x] T049 [US2] Test sidebar renders correct items for each section — verify Dashboard has no sidebar, Entities shows 3 items, Documents shows 3 items, Analytics shows 3 items per contracts/navigation.md §2
- [x] T050 [US2] Test responsive behavior: ≥1200px sidebar expanded (260px), 768–1199px sidebar collapsed (64px icons), <768px sidebar hidden + hamburger per contracts/navigation.md §3
- [x] T051 [US2] Test sidebar collapse toggle (expanded↔collapsed), localStorage persistence, and mobile hamburger open/close with backdrop

**Checkpoint**: Navigation fully redesigned. Zero `mat-menu` dropdowns for nav. Sidebar shows contextual sub-pages. Mobile drawer works. US2 all 7 acceptance scenarios met.

---

## Phase 5: User Story 3 — Dashboard Modernization (Priority: P2)

**Goal**: Transform the family dashboard into a card-based layout with clear hierarchy, consistent styling, smooth loading states, and responsive grid.

**Independent Test**: Dashboard at `/family-office` has no sidebar. Hero metrics use large typography. All cards have consistent rounded corners and shadows. Skeleton loaders appear during data fetch. Cards stack to 1-column on mobile (<768px).

### Implementation for User Story 3

- [x] T052 [US3] Extract inline styles from `apps/client/src/app/pages/family-dashboard/dashboard-page.component.ts` (200+ lines of `styles:[]`) to new `apps/client/src/app/pages/family-dashboard/dashboard-page.component.scss`
- [x] T053 [US3] Redesign hero metrics card in `apps/client/src/app/pages/family-dashboard/` — large type using `var(--font-size-2xl)`, token-based colors `var(--color-primary)`, countup animation for numeric values
- [x] T054 [US3] Create consistent card wrapper pattern — shared `.fo-card` class using `var(--card-radius)`, `var(--card-padding)`, `var(--card-shadow)`, `var(--card-bg)` in dashboard component SCSS
- [x] T055 [P] [US3] Restyle allocation bars in dashboard with token colors (teal/blue palette) and `matTooltip` hover details
- [x] T056 [P] [US3] Update dashboard tables to use Material table styling with `var(--table-row-alt-bg)` alternating row backgrounds
- [x] T057 [US3] Add per-card skeleton loaders using `ngx-skeleton-loader` in `apps/client/src/app/pages/family-dashboard/dashboard-page.component.html` — each card shows loader independently while its data loads
- [x] T058 [US3] Implement responsive card grid in dashboard — CSS Grid `auto-fit minmax()`: 1-col below 768px, 2-col 768–1199px, 3-col ≥1200px
- [x] T059 [US3] Verify dark mode renders correctly for all dashboard elements — cards, charts, tables, hero metrics, skeleton loaders

**Checkpoint**: Dashboard is polished and responsive. US3 all 3 acceptance scenarios met. Skeleton loaders, card hierarchy, responsive stacking all verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Apply consistent token-based styling to all remaining pages. Each page task is independent and parallelizable.

- [x] T060 [P] [US1] FMV page (`apps/client/src/app/pages/fmv/`) — replace any remaining Bootstrap classes, apply token card pattern, verify responsive layout and dark mode
- [x] T061 [P] [US1] Entity detail page (`apps/client/src/app/pages/entities/`) — card styling with tokens, dark mode verification
- [x] T062 [P] [US1] Partnership detail page (`apps/client/src/app/pages/partnerships/`) — consistent card/table styling with tokens
- [x] T063 [P] [US1] Partnership performance page — chart styling consistency using token colors for Chart.js datasets
- [x] T064 [P] [US1] Distributions page (`apps/client/src/app/pages/distributions/`) — table styling with `var(--table-*)` tokens, card wrappers
- [x] T065 [P] [US1] K-1 Documents page (`apps/client/src/app/pages/k-documents/`) — list/table styling with tokens
- [x] T066 [P] [US1] K-1 Import page (`apps/client/src/app/pages/k1-import/`) — form styling, upload area UX, token colors
- [x] T067 [P] [US1] Cell Mapping page (`apps/client/src/app/pages/cell-mapping/`) — table styling with tokens
- [x] T068 [P] [US1] Accounts page — consistent cards and tables with tokens
- [x] T069 [P] [US1] Portfolio Views page (`apps/client/src/app/pages/portfolio-views/`) — card grid layout with tokens
- [x] T070 [P] [US1] Holdings page — table styling, token colors, dark mode
- [x] T071 [P] [US1] Analysis / Summary pages — chart consistency with token palette, dark mode
- [x] T072 [P] [US1] Markets page — token-based colors for market data display
- [x] T073 [P] [US1] Admin pages (`apps/client/src/app/pages/admin/`) — consistent form and table styling
- [x] T074 [P] [US1] User Account page (`apps/client/src/app/pages/account/`) — form styling with tokens
- [x] T075 Run `quickstart.md` validation checklist — all visual checks listed in quickstart.md Testing section

---

## Final Validation

- [ ] T076 Full build: `pnpm nx run client:build` succeeds
- [ ] T077 Lint: `pnpm nx run client:lint` passes
- [ ] T078 Verify zero `mat.m2-*` references in any SCSS file
- [ ] T079 Verify zero Bootstrap classes in any template or SCSS file (`bootstrap` not in `package.json`)
- [ ] T080 All 6 top-bar section links highlight correctly with active route
- [ ] T081 Sidebar shows correct contextual items for each section per contracts/navigation.md §2
- [ ] T082 Sidebar expand/collapse works at all breakpoints per contracts/navigation.md §3
- [ ] T083 Mobile hamburger opens overlay sidebar with backdrop
- [ ] T084 Dashboard at `/family-office` has no sidebar
- [ ] T085 All pages verified in light mode
- [ ] T086 All pages verified in dark mode
- [ ] T087 Mobile navigation tested at 375px, 768px, and 1200px widths
- [ ] T088 Lighthouse accessibility score ≥ 90 on dashboard page

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 completion (needs M3 theme + tokens active)
- **US2 (Phase 4)**: Depends on Phase 2 completion (needs tokens for sidebar styling). **Independent of US1** — can run in parallel with Phase 3
- **US3 (Phase 5)**: Depends on Phase 2 (tokens) and Phase 3 (Bootstrap removal — dashboard needs clean template)
- **Polish (Phase 6)**: Depends on Phase 3 (Bootstrap removed) and Phase 4 (sidebar exists for layout context)
- **Final Validation (Phase 7)**: Depends on all previous phases

### User Story Dependencies

- **US4 (M3 Migration)**: In Foundational (Phase 2) — blocks US1, US3
- **US1 (Visual Identity)**: After Foundational — no dependency on other stories
- **US2 (Navigation)**: After Foundational — **independent of US1** (can parallelize)
- **US3 (Dashboard)**: After US1 (needs token utility classes and Bootstrap-free templates)

### Within Each User Story

- Audit/create interfaces before implementation tasks
- Core logic (service, interfaces) before UI components
- UI components before integration (app shell, header)
- Integration before cleanup/deletion
- Verification tasks last

### Parallel Opportunities per Phase

**Phase 1**: T002, T003, T005, T006 can all run in parallel (different files, no dependencies)
**Phase 3 (US1)**: T017–T025 can all run in parallel (each targets a different class pattern across different files)
**Phase 4 (US2)**: T032 (interfaces) and T035–T037 (sidenav component files) can run in parallel
**Phase 5 (US3)**: T055, T056 can run in parallel (different component areas)
**Phase 6**: ALL tasks (T060–T075) can run in parallel (each targets a different page)

---

## Parallel Example: User Story 2 (Navigation)

```bash
# Step 1: Interfaces + Sidenav component (parallel)
Task T032: Create nav.interface.ts
Task T035: Create sidenav.component.ts    # [P]
Task T036: Create sidenav.component.html  # [P]
Task T037: Create sidenav.component.scss  # [P]

# Step 2: Wire up (sequential — depends on Step 1)
Task T033: Export from barrel
Task T034: Create NavigationService
Task T038: Export sidenav from barrel

# Step 3: Integrate into app shell (sequential)
Task T039: Update app.component.html
Task T040: Update app.component.ts
Task T041: Update app.component.scss

# Step 4: Simplify header (sequential)
Task T042: Rewrite header template
Task T043: Simplify header TS
Task T044: Add hamburger button
Task T045: Update header SCSS

# Step 5: Cleanup (sequential — depends on Step 4)
Task T046: Delete nav-menu-group
Task T047: Remove dead imports
Task T048–T051: Verification
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + US2 Navigation Only)

1. Complete Phase 1: Setup (token files)
2. Complete Phase 2: Foundational (M3 migration)
3. Complete Phase 4: US2 — Modern Navigation
4. **STOP and VALIDATE**: Navigation works with top bar + sidebar
5. Deploy/demo if ready — users immediately see the new nav pattern

### Incremental Delivery

1. Setup + Foundational → Token system + M3 active
2. US1 (Bootstrap removal) → Clean CSS foundation → Validate independently
3. US2 (Navigation redesign) → New nav pattern live → Validate independently
4. US3 (Dashboard polish) → Polished dashboard → Validate independently
5. Polish → All pages consistent → Final validation
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational is complete:
- **Developer A**: US1 (Bootstrap removal — Phase 3)
- **Developer B**: US2 (Navigation redesign — Phase 4)
- Both complete independently, then:
- **Developer A or B**: US3 (Dashboard — Phase 5)
- **Both**: Phase 6 Polish (all page tasks are [P] parallelizable)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks within the phase
- [Story] label maps each task to a specific user story for traceability
- US4 (M3 Migration) is delivered in Phase 2 (Foundational) because it blocks US1 and US3
- US1 and US2 can be implemented in parallel after Foundational
- Tests not included (not requested in spec) — verification is via manual visual checks and build/lint passes
- Commit after each task or logical group
- Reference contracts/navigation.md for all navigation structure decisions
- Reference research.md for Bootstrap class audit counts and M3 API mappings
