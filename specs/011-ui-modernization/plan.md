# 011 UI Modernization — Implementation Plan

## Phase Overview

| Phase | Name | Est. Tasks | Priority |
|---|---|---|---|
| 1 | Design Tokens & Foundation | 8 | P0 — everything depends on this |
| 2 | Angular Material M3 Migration | 10 | P1 — core framework update |
| 3 | Bootstrap Removal | 12 | P1 — must follow M3 migration |
| 4 | Navigation Redesign | 6 | P1 — high-visibility improvement |
| 5 | Dashboard Modernization | 8 | P2 — main landing page |
| 6 | Page-by-Page Polish | 15 | P2 — remaining pages |
| **Total** | | **~59** | |

---

## Phase 1: Design Tokens & Foundation

**Goal**: Establish a token-based design system that all subsequent phases reference.

### Steps

1. **Create token SCSS files**
   - `apps/client/src/styles/tokens/_primitive.scss` — raw color values, font sizes, spacing scale, border radii, shadows
   - `apps/client/src/styles/tokens/_semantic.scss` — role-based tokens (`--color-surface`, `--color-on-surface`, `--color-primary`, `--color-text-secondary`, etc.)
   - `apps/client/src/styles/tokens/_component.scss` — component-level tokens (`--card-radius`, `--card-padding`, `--card-shadow`, `--button-height`, etc.)
   - `apps/client/src/styles/tokens/_index.scss` — barrel file

2. **Create utility classes**
   - `apps/client/src/styles/_utilities.scss` — Replacement for Bootstrap utilities
   - Flexbox: `.flex`, `.flex-col`, `.flex-wrap`, `.items-center`, `.justify-between`, `.gap-*`
   - Display: `.hidden`, `.block`, `.inline-flex`
   - Responsive: `.sm:hidden`, `.md:flex`, `.lg:grid` (mobile-first breakpoints)
   - Spacing: `.p-*`, `.m-*`, `.px-*`, `.py-*`, `.mx-*`, `.my-*` using token scale
   - Typography: `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.font-bold`, `.font-medium`, `.text-muted`

3. **Integrate tokens into `styles.scss`**
   - Import token files
   - Replace existing `:root` hardcoded values with token references
   - Maintain backward compatibility during migration

4. **Define breakpoint system**
   ```scss
   $breakpoints: (
     sm: 576px,
     md: 768px,
     lg: 1024px,
     xl: 1280px,
   );
   ```

### Deliverable
The design token system is importable and all existing CSS custom properties are mapped to tokens. No visual changes yet — pure foundation.

---

## Phase 2: Angular Material M3 Migration

**Goal**: Replace all M2 API usage with M3 equivalents.

### Steps

1. **Update `theme.scss`** — Replace `mat.m2-define-light-theme()` with `mat.define-theme()`
2. **Define custom M3 color scheme** using `#36CFCC` as primary seed
3. **Update density** from `-3` to `-1` (M3 scale)
4. **Replace `mat.all-component-themes()`** with `mat.theme()`
5. **Fix dark mode** — Use `mat.define-theme()` with `theme-type: dark`
6. **Audit Material component overrides** in `styles.scss` — remove M2-specific hacks
7. **Test all Material components** — buttons, cards, menus, tables, dialogs, snackbars, form fields
8. **Fix typography** — M3 uses a different type scale; update any explicit type references
9. **Update `mat-flat-button`** references if needed (M3 may rename)
10. **Verify** — Build succeeds, no M2 API warnings

### Deliverable
Clean M3 theme with custom teal/blue palette. All Material components render correctly in light and dark modes.

---

## Phase 3: Bootstrap Removal

**Goal**: Remove all Bootstrap class usage, replace with tokens/utilities, remove package.

### Steps

1. **Grid replacement** — Replace `row`/`col-*` with CSS Grid or Flexbox
   - Dashboard grid → `display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
   - Form layouts → Flexbox
   - List layouts → CSS Grid

2. **Display utilities** — Replace `d-flex`, `d-none`, `d-*-block` with custom utils or media queries

3. **Spacing utilities** — Replace `mx-*`, `p-*` with token-based spacing utils

4. **Typography utilities** — Replace `text-muted`, `font-weight-bold`, `text-center` with token classes

5. **Badge component** — Replace Bootstrap `.badge` with Material chip or custom badge

6. **Breadcrumb** — Replace Bootstrap breadcrumb with custom component

7. **List utilities** — Replace `list-inline`, `list-unstyled` with Flexbox

8. **Remove `styles/bootstrap.scss`** import

9. **Remove `bootstrap` from `package.json`**

10. **Run full build** — fix any remaining Bootstrap references

11. **Run `pnpm install`** — ensure lock file updated

12. **Visual regression check** — compare before/after screenshots

### Deliverable
Zero Bootstrap references in codebase. `pnpm list bootstrap` returns empty.

---

## Phase 4: Navigation Redesign

**Goal**: Modern responsive navigation with icons, grouping, and mobile drawer.

### Steps

1. **Design nav structure** — Finalize groups, icons, labels (see research.md)

2. **Desktop nav update**
   - Add Material icons to each nav group
   - Improve dropdown styling (wider, with descriptions)
   - Active state: bottom border accent line (2px primary color) instead of bold+underline
   - Fix duplicate "Accounts" issue

3. **Mobile nav — sidebar drawer**
   - Replace flat `mat-menu` with `mat-sidenav`
   - Use `mat-expansion-panel` for collapsible groups
   - Each group has icon, label, and expandable children
   - Active item highlighted with primary color

4. **User menu cleanup**
   - Move user menu to top-right (both desktop and mobile)
   - Consistent avatar/icon treatment

5. **Remove "My Ghostfolio" branding** — Replace with "Family Office" or user's org name

6. **Test responsive behavior** — Desktop ↔ mobile transitions, drawer open/close

### Deliverable
Responsive navigation that works cleanly from 320px to 2560px+.

---

## Phase 5: Dashboard Modernization

**Goal**: Professional, card-based dashboard with consistent styling.

### Steps

1. **Extract inline styles** — Move 200+ lines from component to external SCSS file
2. **Hero metrics card** — Redesign with token-based colors, countup animation, subtitle labels
3. **Chart cards** — Consistent card wrapper component with title, chart area, optional legend
4. **Allocation bars** — Use token colors for bar segments; add hover tooltips
5. **Tables** — Use Material table with token-based alternating row colors
6. **Skeleton loaders** — Add per-card skeleton states (use `ngx-skeleton-loader`)
7. **Responsive** — Single column on mobile, 2-col on tablet, 3-col on desktop
8. **Dark mode** — Verify all dashboard elements respect dark theme tokens

### Deliverable
Dashboard matches the new design-token system, has skeleton loading, and works responsively.

---

## Phase 6: Page-by-Page Polish

**Goal**: Apply consistent styling to all remaining pages.

Priority order:
1. FMV page
2. Entity detail page
3. Partnership detail / performance pages
4. Distributions page
5. K-1 Documents / Import pages
6. Cell mapping page
7. Accounts page
8. Portfolio pages (views, holdings, summary)
9. Analysis pages (markets, X-ray)
10. Admin pages
11. User account page
12. Reports page

For each page:
- Replace Bootstrap classes with token utilities
- Ensure cards use consistent `--card-*` tokens
- Verify dark mode
- Test responsive layout
- Extract inline styles to SCSS files where applicable

### Deliverable
All pages visually consistent with the new design system.

---

## Commit Strategy

Each phase gets a feature commit (or multiple if large):
```
feat(011): design tokens and utility classes
feat(011): migrate Angular Material M2 to M3
feat(011): remove Bootstrap dependency
feat(011): redesign responsive navigation
feat(011): modernize family dashboard
feat(011): polish FMV and partnership pages
feat(011): polish K-1 and analysis pages
feat(011): polish admin and remaining pages
```

---

## Validation Checklist

- [ ] `pnpm nx run client:build` succeeds
- [ ] `pnpm nx run client:lint` passes
- [ ] No `mat.m2-` references in any SCSS file
- [ ] `bootstrap` not in `package.json`
- [ ] All pages render correctly in light mode
- [ ] All pages render correctly in dark mode
- [ ] Mobile navigation uses drawer (tested at 375px width)
- [ ] Lighthouse accessibility ≥ 90 on dashboard
- [ ] No hardcoded hex colors in component templates/styles
