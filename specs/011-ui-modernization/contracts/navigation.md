# Navigation Contract

## 1. Top Bar Sections

The top bar renders a flat list of section links (no dropdowns). Each section label acts as a `routerLink` to the section's default route and highlights via `routerLinkActive`.

| Section | Label | Default Route | Route Prefixes | Icon | Permission |
|---|---|---|---|---|---|
| dashboard | Dashboard | `/family-office` | `/family-office` | `dashboard` | — |
| valuations | Valuations | `/fmv` | `/fmv` | `account_balance` | — |
| entities | Entities | `/entities` | `/entities`, `/partnerships`, `/distributions` | `domain` | — |
| documents | Documents | `/k-documents` | `/k-documents`, `/k1-import`, `/cell-mapping` | `description` | — |
| analytics | Analytics | `/portfolio-views` | `/portfolio-views`, `/reports`, `/analysis` | `analytics` | — |
| admin | Admin | `/admin` | `/admin` | `settings` | `accessAdminControl` |

### Mobile Behavior

On viewports < 768px, the section list is hidden. A hamburger button (`mat-icon-button`) opens the sidebar in `mode="over"` with a backdrop. The sidebar shows sections as expandable groups.

---

## 2. Sidebar Items per Section

### Dashboard
No sidebar. The dashboard is a single-page view.

### Valuations
| Label | Route | Icon |
|---|---|---|
| Overview | `/fmv` | `list` |

### Entities
| Label | Route | Icon |
|---|---|---|
| All Entities | `/entities` | `domain` |
| Partnerships | `/partnerships` | `group_work` |
| Distributions | `/distributions` | `payments` |

### Documents
| Label | Route | Icon |
|---|---|---|
| K-1 Documents | `/k-documents` | `description` |
| Import | `/k1-import` | `upload_file` |
| Cell Mapping | `/cell-mapping` | `grid_on` |

### Analytics
| Label | Route | Icon |
|---|---|---|
| Portfolio Views | `/portfolio-views` | `pie_chart` |
| Reports | `/reports` | `summarize` |
| Analysis | `/analysis` | `analytics` |

### Admin
| Label | Route | Icon |
|---|---|---|
| Admin Panel | `/admin` | `settings` |

---

## 3. Responsive Rules

| Breakpoint | Sidebar Mode | Default State | Behavior |
|---|---|---|---|
| ≥ 1200px | `side` | Expanded (260px) | Persistent, toggle to collapsed (64px) |
| 768–1199px | `side` | Collapsed (64px) | Persistent, toggle to expanded |
| < 768px | `over` | Hidden | Hamburger opens overlay, backdrop closes |

### Collapse Behavior
- **Expanded** (260px): Shows icon + label
- **Collapsed** (64px): Shows icon only, label hidden via CSS
- **Hidden**: Sidebar not rendered in DOM (mobile baseline)

---

## 4. NavigationService API

```typescript
@Injectable({ providedIn: 'root' })
export class NavigationService {
  /** Currently active section ID derived from URL */
  activeSection$: Observable<string>;

  /** Sidebar items for the active section */
  sidebarItems$: Observable<NavItem[]>;

  /** Current sidebar display state */
  sidebarState$: BehaviorSubject<SidebarState>;

  /** Section definitions (immutable) */
  readonly sections: NavSection[];

  /** Toggle between expanded/collapsed */
  toggleSidebar(): void;

  /** Set sidebar state explicitly */
  setSidebarState(state: SidebarState): void;
}
```

### Section Detection Logic
1. Subscribe to `Router.events` → `NavigationEnd`
2. Match URL against each section's `routePrefixes` (longest prefix wins)
3. Emit matched section ID on `activeSection$`
4. Emit that section's `children` on `sidebarItems$`
5. If section has no children (e.g., Dashboard), emit `[]` and set sidebar to `hidden`

---

## 5. AppSidenavComponent Contract

```typescript
@Component({ selector: 'gf-sidenav' })
export class GfSidenavComponent {
  @Input() items: NavItem[];
  @Input() state: SidebarState;
  @Input() activeRoute: string;
  @Output() itemClick = new EventEmitter<NavItem>();
  @Output() toggle = new EventEmitter<void>();
}
```

### Template Structure
```html
<mat-nav-list>
  @for (item of items; track item.route) {
    <a mat-list-item
       [routerLink]="item.route"
       routerLinkActive="active"
       (click)="itemClick.emit(item)">
      <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
      @if (state === 'expanded') {
        <span matListItemTitle>{{ item.label }}</span>
      }
    </a>
  }
</mat-nav-list>
```

---

## 6. App Shell Layout

```html
<!-- app.component.html -->
<gf-header />

<mat-sidenav-container>
  <mat-sidenav
    [mode]="sidebarMode()"
    [opened]="sidebarOpened()"
    [style.width]="sidebarWidth()">
    <gf-sidenav
      [items]="sidebarItems()"
      [state]="sidebarState()"
      [activeRoute]="currentRoute()"
      (toggle)="navigationService.toggleSidebar()" />
  </mat-sidenav>

  <mat-sidenav-content>
    <main>
      <router-outlet />
    </main>
    <gf-footer />
  </mat-sidenav-content>
</mat-sidenav-container>
```

---

## 7. URL → Section Mapping Examples

| URL | Matched Section | Sidebar Shows |
|---|---|---|
| `/family-office` | dashboard | (none) |
| `/fmv` | valuations | Valuations sidebar |
| `/fmv?view=details` | valuations | Valuations sidebar |
| `/entities` | entities | Entities sidebar |
| `/partnerships` | entities | Entities sidebar |
| `/distributions` | entities | Entities sidebar |
| `/k-documents` | documents | Documents sidebar |
| `/k1-import` | documents | Documents sidebar |
| `/cell-mapping` | documents | Documents sidebar |
| `/portfolio-views` | analytics | Analytics sidebar |
| `/reports` | analytics | Analytics sidebar |
| `/analysis` | analytics | Analytics sidebar |
| `/admin` | admin | Admin sidebar |
| `/account` | (none) | (no sidebar) |
| `/about` | (none) | (no sidebar) |
