import { NavItem, SidebarState } from '@ghostfolio/common/interfaces';

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, MatListModule, RouterModule],
  selector: 'gf-sidenav',
  standalone: true,
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class GfSidenavComponent {
  @Input() public items: NavItem[] = [];
  @Input() public state: SidebarState = 'expanded';
  @Input() public activeRoute: string = '';
  @Output() public itemClick = new EventEmitter<NavItem>();
  @Output() public toggle = new EventEmitter<void>();
}
