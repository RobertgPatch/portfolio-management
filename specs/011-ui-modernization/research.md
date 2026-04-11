# 011 UI Modernization — Research

## Decision Log

### Decision 1: Navigation Pattern — Top Bar + Contextual Left Sidebar

**Decision**: Replace all `mat-menu` dropdown submenus with a `mat-sidenav` left sidebar that shows section-specific sub-pages.

**Rationale**: 
- Dropdown menus are a legacy pattern for multi-level navigation. Modern financial dashboards (Stripe, Linear, Addepar, GitHub, Plaid Dashboard) universally use a persistent left sidebar for sub-navigation.
- The current mobile nav dumps 25+ items into a flat `mat-menu` — unusable. A `mat-sidenav` drawer with grouped sections scales naturally.
- Sidebar navigation provides persistent context ("where am I?") — the user always sees the section's available pages without hovering.

**Alternatives considered**:
- **Keep dropdowns, improve styling**: Rejected — dropdown UX is fundamentally inferior for apps with deep navigation. User explicitly dislikes this pattern.
- **Always-visible sidebar (no top bar)**: Rejected — wastes horizontal space for single-page sections (Dashboard). The hybrid approach (top bar sections + contextual sidebar) is the best balance.
- **Vertical tabs (like VS Code activity bar)**: Rejected — too technical/IDE-like for a financial application.

---

### Decision 2: Generalized Navigation Labels

**Decision**: Rename top-level navigation labels to be broader and more professional.

| Current Label | New Label | Rationale |
|---|---|---|
| FMV | **Valuations** | "Valuations" is the standard wealth management term. Covers FMV, account values, holdings, market prices. |
| Partnerships | **Entities** | "Entities" is the legal/financial umbrella term for trusts, LLCs, LPs. Partnerships and distributions are attributes of entities. |
| K-1 Center | **Documents** | Clean catch-all. Supports future document types (tax returns, statements). Avoids US-tax-specific jargon. |
| Analysis | **Analytics** | More modern. Absorbs "Portfolio Views" which was a standalone orphan link. |
| Portfolio Views | *(merged into Analytics)* | Not significant enough for its own top-level item. |
| Dashboard | **Dashboard** | Keep as-is — universally understood. |
| Admin | **Admin** | Keep as-is — standard label. |

**Alternatives considered**:
- "Assets" instead of "Valuations": Rejected — too generic, could mean anything.
- "Tax Center" instead of "Documents": Rejected — too narrow if we add non-tax documents later.
- "Portfolio" instead of "Analytics": Rejected — overloaded term in a financial app.

---

### Decision 3: Sidebar Layout — Persistent on Desktop, Overlay on Mobile

**Decision**: Use `mat-sidenav` with `mode="side"` on desktop (≥1024px) and `mode="over"` on mobile (<1024px).

**Rationale**:
- Desktop users have screen real estate — sidebar should push content, not overlay it.
- Mobile users need the full viewport — sidebar should overlay with a backdrop.
- Angular CDK `BreakpointObserver` provides reactive breakpoint detection.

**Alternatives considered**:
- Always `mode="over"`: Rejected — on desktop, constantly opening/closing a drawer is annoying.
- Always `mode="side"`: Rejected — on mobile, a persistent 260px sidebar leaves no room for content.

---

### Decision 4: Sidebar Collapse to Icon-Only Mode

**Decision**: Collapse toggle (bottom of sidebar) shrinks from 260px to 64px (icons + tooltips). State persists in `localStorage`.

**Rationale**: Power users want maximum screen real estate for data tables and charts. Icon-only mode maintains spatial context.

**Alternatives considered**:
- No collapse option: Rejected — 260px is significant on a 1366px laptop.
- Auto-collapse on narrow windows: Rejected — should be user-controlled.

---

### Decision 5: Angular Material M3 Migration

**Decision**: Migrate from `mat.m2-define-light-theme()` to `mat.define-theme()` (M3 API).

**Rationale**: Angular 21 ships M3 as default. M2 APIs deprecated. M3 provides built-in design tokens, improved accessibility, modern visual style.

**Alternatives considered**:
- Stay on M2: Rejected — accumulates debt.
- Switch to PrimeNG/Tailwind: Rejected — too disruptive. Angular Material M3 already installed.

---

### Decision 6: Bootstrap Removal Strategy

**Decision**: Replace Bootstrap classes incrementally with custom token-based utilities, then remove the package.

**Rationale**: Bootstrap 4.6 only used for grid, display utilities, and a few text helpers — trivially replaceable.

**Alternatives considered**:
- Migrate to Bootstrap 5: Rejected — still dual frameworks.
- Replace with Tailwind CSS: Rejected — conflicts with Angular Material's component model.

---

## Technical Research

### Angular Material Sidenav Architecture

```
┌─────────────────────────────────────────────────┐
│  mat-toolbar (fixed, full width, z-index above) │
├────────┬────────────────────────────────────────┤
│ mat-   │  mat-sidenav-content                   │
│ sidenav│  (scrollable, holds <router-outlet>)   │
│ (left) │                                        │
│ 260px  │                                        │
└────────┴────────────────────────────────────────┘
```

- `mat-toolbar` OUTSIDE and ABOVE `mat-sidenav-container`
- Container height: `calc(100vh - toolbar-height)`
- `mat-sidenav-content` handles its own scrollbar

### NavigationService Design

```typescript
@Injectable({ providedIn: 'root' })
export class NavigationService {
  activeSection$: Observable<NavSection>;
  sidebarItems$: Observable<NavItem[]>;
  isSidebarVisible$: Observable<boolean>;  // false for Dashboard

  sections: NavSection[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard',
      route: '/family-office', children: [] },
    { id: 'valuations', label: 'Valuations', icon: 'account_balance',
      route: '/fmv', children: [
        { label: 'FMV Dashboard', icon: 'trending_up', route: '/fmv' },
        { label: 'Accounts', icon: 'account_balance_wallet', route: '/accounts' }
    ]},
    { id: 'entities', label: 'Entities', icon: 'business',
      route: '/entities', children: [
        { label: 'Entities', icon: 'business', route: '/entities' },
        { label: 'Partnerships', icon: 'handshake', route: '/partnerships' },
        { label: 'Distributions', icon: 'payments', route: '/distributions' }
    ]},
    { id: 'documents', label: 'Documents', icon: 'description',
      route: '/k1-import', children: [
        { label: 'K-1 Import', icon: 'upload_file', route: '/k1-import' },
        { label: 'K-1 Documents', icon: 'article', route: '/k-documents' },
        { label: 'Cell Mapping', icon: 'grid_on', route: '/cell-mapping' }
    ]},
    { id: 'analytics', label: 'Analytics', icon: 'analytics',
      route: '/home', children: [
        { label: 'Overview', icon: 'dashboard', route: '/home' },
        { label: 'Holdings', icon: 'pie_chart', route: '/home/holdings' },
        { label: 'Summary', icon: 'summarize', route: '/home/summary' },
        { label: 'Markets', icon: 'show_chart', route: '/home/markets' },
        { label: 'Watchlist', icon: 'visibility', route: '/home/watchlist' },
        { label: 'Portfolio Views', icon: 'view_module', route: '/portfolio-views' },
        { label: 'FIRE Calculator', icon: 'local_fire_department', route: '/portfolio/fire' },
        { label: 'X-Ray', icon: 'radar', route: '/portfolio/x-ray' }
    ]},
    { id: 'admin', label: 'Admin', icon: 'settings',
      route: '/admin', children: [...], visible: 'hasPermissionToAccessAdminControl' }
  ];
}
```

### Sidebar Responsive Rules

| Breakpoint | Sidebar Mode | Default State |
|---|---|---|
| ≥1280px (xl) | `mode="side"` | Expanded (260px) |
| 1024–1279px (lg) | `mode="side"` | Collapsed (64px icons) |
| <1024px | `mode="over"` | Hidden; toggle from header |

### CSS Tokens for Sidebar

```scss
:root {
  --sidebar-width-expanded: 260px;
  --sidebar-width-collapsed: 64px;
  --sidebar-transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --sidebar-bg: var(--color-surface);
  --sidebar-border: 1px solid var(--color-divider);
  --sidebar-item-height: 40px;
  --sidebar-item-active-bg: rgba(var(--color-primary-rgb), 0.12);
  --sidebar-item-hover-bg: rgba(var(--color-primary-rgb), 0.06);
}
```

### Bootstrap Class Audit

| Class Pattern | ~Count | Replacement |
|---|---|---|
| `col-*`, `row` | ~200 | CSS Grid `auto-fit minmax()` or custom grid |
| `d-flex`, `d-inline-flex` | ~150 | `.flex`, `.inline-flex` utility |
| `d-none`, `d-*-none/block/flex` | ~80 | `@media` queries or `.hidden-*` |
| `text-muted` | ~30 | `color: var(--color-text-muted)` |
| `font-weight-bold` | ~25 | `font-weight: var(--font-weight-bold)` |
| `mx-*`, `my-*`, `p-*`, `m-*` | ~100 | Token-based spacing utilities |
| `badge` | ~10 | Material chip or custom badge |
| `list-inline` | ~5 | Flexbox list |
| `align-items-center` | ~60 | `.items-center` utility |
| `justify-content-*` | ~40 | `.justify-*` utility |

### M3 Theme API Changes

| M2 API (Current) | M3 API (Target) |
|---|---|
| `mat.m2-define-light-theme()` | `mat.define-theme()` |
| `mat.m2-define-palette($palette)` | Hex seed in `mat.define-colors()` |
| `mat.m2-define-typography-config()` | `mat.define-typography()` |
| `mat.all-component-themes($theme)` | `@include mat.theme($theme)` |
| Density: `-3` | Density: `-1` or `0` |

### Files Impacted

| Area | Files | Complexity |
|---|---|---|
| App shell layout | `app.component.html/ts/scss` | High |
| Navigation service | New: `navigation.service.ts` | Medium |
| Sidebar component | New: `app-sidenav.component.ts/html/scss` | Medium |
| Header (top bar) | `header.component.html/ts` | High |
| Design tokens | 4 new SCSS in `styles/tokens/` | Medium |
| Theme migration | `styles/theme.scss`, `styles.scss` | High |
| Bootstrap removal | 30+ component template files | High (tedious) |
| Dashboard | `dashboard-page.component.ts` | Medium |
| Nav menu group | `libs/ui/src/lib/nav-menu-group/` — **DELETE** | Low |
