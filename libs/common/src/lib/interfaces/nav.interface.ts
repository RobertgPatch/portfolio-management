export interface NavSection {
  id: string;
  label: string;
  icon: string;
  route: string;
  children: NavItem[];
  routePrefixes: string[];
  permission?: string;
}

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export type SidebarState = 'expanded' | 'collapsed' | 'hidden';
