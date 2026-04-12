import {
  NavItem,
  NavSection,
  SidebarState
} from '@ghostfolio/common/interfaces';

import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

const SIDEBAR_STATE_KEY = 'gf-sidebar-state';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  public readonly sections: NavSection[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/family-office',
      routePrefixes: ['/family-office'],
      children: []
    },
    {
      id: 'valuations',
      label: 'Valuations',
      icon: 'account_balance',
      route: '/fmv',
      routePrefixes: ['/fmv'],
      children: [{ label: 'Overview', icon: 'list', route: '/fmv' }]
    },
    {
      id: 'entities',
      label: 'Entities',
      icon: 'domain',
      route: '/entities',
      routePrefixes: ['/entities', '/partnerships', '/distributions'],
      children: [
        { label: 'All Entities', icon: 'domain', route: '/entities' },
        { label: 'Partnerships', icon: 'group_work', route: '/partnerships' },
        { label: 'Distributions', icon: 'payments', route: '/distributions' }
      ]
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'description',
      route: '/k-documents',
      routePrefixes: ['/k-documents', '/k1-import', '/cell-mapping'],
      children: [
        { label: 'K-1 Documents', icon: 'description', route: '/k-documents' },
        { label: 'Import', icon: 'upload_file', route: '/k1-import' },
        { label: 'Cell Mapping', icon: 'grid_on', route: '/cell-mapping' }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'analytics',
      route: '/portfolio-views',
      routePrefixes: ['/portfolio-views', '/reports', '/analysis'],
      children: [
        {
          label: 'Portfolio Views',
          icon: 'pie_chart',
          route: '/portfolio-views'
        },
        { label: 'Reports', icon: 'summarize', route: '/reports' },
        { label: 'Analysis', icon: 'analytics', route: '/analysis' }
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: 'settings',
      route: '/admin',
      routePrefixes: ['/admin'],
      permission: 'accessAdminControl',
      children: [{ label: 'Admin Panel', icon: 'settings', route: '/admin' }]
    }
  ];

  public readonly activeSection$: Observable<string>;
  public readonly sidebarItems$: Observable<NavItem[]>;
  public readonly sidebarState$: BehaviorSubject<SidebarState>;

  private readonly activeSectionSubject = new BehaviorSubject<string>('');

  public constructor(private router: Router) {
    // Initialize sidebar state from localStorage
    const stored = localStorage.getItem(
      SIDEBAR_STATE_KEY
    ) as SidebarState | null;
    this.sidebarState$ = new BehaviorSubject<SidebarState>(
      stored || 'expanded'
    );

    this.activeSection$ = this.activeSectionSubject.asObservable();

    this.sidebarItems$ = this.activeSection$.pipe(
      map((sectionId) => {
        const section = this.sections.find((s) => s.id === sectionId);
        return section?.children ?? [];
      })
    );

    // Listen to router events for section detection
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.detectSection(event.urlAfterRedirects || event.url);
      });
  }

  public toggleSidebar(): void {
    const current = this.sidebarState$.value;

    if (current === 'hidden') {
      this.setSidebarState('expanded');
    } else if (current === 'expanded') {
      this.setSidebarState('collapsed');
    } else {
      this.setSidebarState('expanded');
    }
  }

  public setSidebarState(state: SidebarState): void {
    this.sidebarState$.next(state);
    localStorage.setItem(SIDEBAR_STATE_KEY, state);
  }

  /**
   * Detect active section using longest route prefix match.
   */
  private detectSection(url: string): void {
    const path = url.split('?')[0]; // Strip query params
    let bestMatch = '';
    let bestSection = '';

    for (const section of this.sections) {
      for (const prefix of section.routePrefixes) {
        if (path.startsWith(prefix) && prefix.length > bestMatch.length) {
          bestMatch = prefix;
          bestSection = section.id;
        }
      }
    }

    this.activeSectionSubject.next(bestSection);

    // If section has no children, set sidebar to hidden
    const section = this.sections.find((s) => s.id === bestSection);

    if (!section || section.children.length === 0) {
      if (this.sidebarState$.value !== 'hidden') {
        this.sidebarState$.next('hidden');
      }
    } else if (this.sidebarState$.value === 'hidden') {
      // Restore from localStorage when switching to section with children
      const stored = localStorage.getItem(
        SIDEBAR_STATE_KEY
      ) as SidebarState | null;
      this.sidebarState$.next(stored === 'collapsed' ? 'collapsed' : 'expanded');
    }
  }
}
