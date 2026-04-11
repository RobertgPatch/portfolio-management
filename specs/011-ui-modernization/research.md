# 011 UI Modernization — Research

## Current Technology Stack

| Component | Version | Notes |
|---|---|---|
| Angular | 21.1.1 | Latest; M3 available |
| Angular Material | 21.1.1 | Using **M2 API** (legacy) |
| Bootstrap | 4.6.2 | Grid + utilities only (no components) |
| Chart.js | 4.5.1 | + treemap, annotation, datalabels plugins |
| Ionic | 8.8.1 | Icons only (ionicons 8.0.13) |
| open-color | 1.9.1 | Color palette (may be replaced by tokens) |
| ngx-skeleton-loader | 12.0.0 | Skeleton loading |
| countup.js | 2.9.0 | Animated number counts |

## Current SCSS Architecture

### File Map

```
apps/client/src/
  styles.scss              → 650+ lines, master entry point
  styles/
    bootstrap.scss         → Cherry-picked BS4 imports (grid, utilities, badges, breadcrumbs)
    variables.scss         → 2 Sass variables ($dark-primary-text, $light-primary-text)
    theme.scss             → Angular Material M2 theme definition
```

### Key Patterns

1. **CSS Custom Properties** — ~120 properties on `:root` for light mode, overridden by `.theme-dark`
2. **M2 Theme** — Uses `mat.m2-define-light-theme` with `mat.m2-define-palette` for primary/secondary/warn
3. **Density** — Set to `-3` (very compact)
4. **Bootstrap Usage** — Grid (`row`, `col-*`), display (`d-flex`, `d-none`, `d-sm-block`), text (`text-muted`, `font-weight-bold`), spacing (`mx-1`, `p-2`), list (`list-inline`), badges (`badge`)

### Bootstrap Class Audit

Grep results for Bootstrap usage patterns:

| Class Pattern | Approx Usage | Replacement Strategy |
|---|---|---|
| `col-*`, `row` | ~200 instances | CSS Grid `auto-fit minmax()` or custom grid utils |
| `d-flex`, `d-block`, `d-none` | ~150 instances | Flexbox utils or `@media` queries |
| `d-*-none/block/flex` (responsive) | ~80 instances | `@media` breakpoint queries |
| `text-muted` | ~30 instances | `color: var(--color-text-secondary)` |
| `font-weight-bold` | ~25 instances | `font-weight: var(--font-weight-bold)` |
| `mx-*`, `my-*`, `p-*`, `m-*` | ~100 instances | Token-based spacing utils |
| `badge` | ~10 instances | Custom badge component or token-styled |
| `list-inline` | ~5 instances | Flexbox list |

## Angular Material M3 Migration

### API Changes (M2 → M3)

| M2 API | M3 API | Notes |
|---|---|---|
| `mat.m2-define-light-theme()` | `mat.define-theme()` | Single function for light/dark |
| `mat.m2-define-palette($palette)` | Hex color in `mat.define-colors()` | No more palette maps |
| `mat.m2-define-typography-config()` | `mat.define-typography()` | Uses M3 type scale |
| `mat.all-component-themes($theme)` | `@include mat.theme($theme)` | Simplified inclusion |
| `mat.all-component-typographies($theme)` | Included in `mat.theme()` | Merged |
| Density: `-3` | `mat.define-density()` | M3 density is 0 (default) or -1 |

### M3 Theme Definition (Target)

```scss
@use '@angular/material' as mat;

$theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$cyan-palette,     // closest to #36CFCC
    tertiary: mat.$blue-palette,    // closest to #3686CF
  ),
  typography: (
    brand-family: 'Inter',
    plain-family: 'Inter',
  ),
  density: (
    scale: -1,  // slightly compact
  ),
));

// Dark variant
$dark-theme: mat.define-theme((
  color: (
    theme-type: dark,
    primary: mat.$cyan-palette,
    tertiary: mat.$blue-palette,
  ),
  typography: (
    brand-family: 'Inter',
    plain-family: 'Inter',
  ),
  density: (
    scale: -1,
  ),
));
```

### Custom Palette Approach

Since `#36CFCC` doesn't exactly match any Material palette, we may need a custom palette:

```scss
$gf-primary: mat.define-colors((
  // M3 uses a single seed color; Material will generate tonal palette
  theme-type: light,
  primary: #36CFCC,
  tertiary: #3686CF,
));
```

## Navigation Research

### Current Structure

**Desktop** (7 top-level items + assistant + user menu):
- Dashboard → `/family-office`
- FMV → dropdown [Dashboard, Accounts]
- Partnerships → dropdown [Entities, Partnerships, Distributions, Accounts]
- Portfolio Views → `/portfolio-views`
- K-1 Center → dropdown [Import, Documents, Cell Mapping]
- Analysis → dropdown [Overview, Holdings, Summary, Markets, Watchlist, FIRE Calculator, X-Ray]
- Admin → dropdown [Control, Accounts, Resources, Pricing]

**Mobile**: All items flattened into single mat-menu. No grouping, no hierarchy.

### Issues

1. **"Accounts" duplicated** in FMV and Partnerships dropdowns
2. **Analysis dropdown too large** — 7 items mixing legacy and FO features
3. **No icons** on dropdown items (text-only)
4. **Active state** uses font-weight + underline — weak visual signal
5. **Mobile nav** is unusable at scale

### Proposed Navigation (Simplified)

Desktop top bar with icon+label; mobile sidebar drawer:

| Group | Icon | Items |
|---|---|---|
| **Dashboard** | `dashboard` | — (direct link to `/family-office`) |
| **FMV** | `account_balance` | Overview (`/fmv`), Accounts (`/accounts`) |
| **Partnerships** | `handshake` | Entities, Partnerships, Distributions |
| **K-1 Center** | `description` | Import, Documents, Cell Mapping |
| **Portfolio** | `pie_chart` | Views, Holdings, Summary |
| **Analysis** | `analytics` | Overview, Markets, X-Ray, FIRE |
| **Admin** | `settings` | Control, Accounts, Resources |

## Component Audit — Inline Styles

| Component | Inline CSS Lines | Action |
|---|---|---|
| `dashboard-page.component.ts` | ~200+ | Extract to `.scss` file |
| `header.component.ts` | ~50 | Extract to `.scss` file |
| Various UI lib components | 10-50 each | Extract where > 20 lines |

## Design Inspiration

Modern financial dashboard patterns:
- **Card-based layouts** with subtle shadows and rounded corners (12-16px radius)
- **Tonal surface hierarchy** — primary surface, elevated surfaces with shadow
- **Data-dense but clean** — compact tables with alternating row tints
- **Chart consistency** — shared color palette across all charts (primary teal, secondary blue, accent warm colors)
- **Skeleton loading** — Card-shaped skeletons during data fetch
- **Micro-interactions** — Hover elevation on cards, smooth transitions

## Files To Modify (Estimated)

| Area | Files | Complexity |
|---|---|---|
| Design tokens | 3-4 new SCSS files | Medium |
| Theme (M3 migration) | `theme.scss`, `styles.scss` | High |
| Bootstrap removal | 30+ component files | High (tedious) |
| Navigation | `header.component.ts/html` | High |
| Dashboard | `dashboard-page.component.ts` | Medium |
| FMV page | `fmv-page.component.*` | Medium |
| Entity/Partnership pages | 4-5 files | Medium |
| K-1 pages | 2-3 files | Low |
| UI lib components | 5-8 files | Medium |
