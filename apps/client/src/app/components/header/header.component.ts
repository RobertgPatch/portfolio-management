import { LayoutService } from '@ghostfolio/client/core/layout.service';
import { NavigationService } from '@ghostfolio/client/core/navigation.service';
import { ImpersonationStorageService } from '@ghostfolio/client/services/impersonation-storage.service';
import {
  KEY_STAY_SIGNED_IN,
  SettingsStorageService
} from '@ghostfolio/client/services/settings-storage.service';
import { TokenStorageService } from '@ghostfolio/client/services/token-storage.service';
import { UserService } from '@ghostfolio/client/services/user/user.service';
import { UpdateUserSettingDto } from '@ghostfolio/common/dtos';
import { Filter, InfoItem, NavSection, User } from '@ghostfolio/common/interfaces';
import { hasPermission, permissions } from '@ghostfolio/common/permissions';
import { internalRoutes, publicRoutes } from '@ghostfolio/common/routes/routes';
import { DateRange } from '@ghostfolio/common/types';
import { GfAssistantComponent } from '@ghostfolio/ui/assistant/assistant.component';
import { GfLogoComponent } from '@ghostfolio/ui/logo';
import { GfPremiumIndicatorComponent } from '@ghostfolio/ui/premium-indicator';
import { DataService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  logoGithub,
  menuOutline,
  optionsOutline,
  personCircleOutline,
  radioButtonOffOutline,
  radioButtonOnOutline
} from 'ionicons/icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    GfAssistantComponent,
    GfLogoComponent,
    GfPremiumIndicatorComponent,
    IonIcon,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'gf-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class GfHeaderComponent implements OnChanges {
  @HostListener('window:keydown', ['$event'])
  openAssistantWithHotKey(event: KeyboardEvent) {
    if (
      event.key === '/' &&
      event.target instanceof Element &&
      event.target?.nodeName?.toLowerCase() !== 'input' &&
      event.target?.nodeName?.toLowerCase() !== 'textarea' &&
      this.hasPermissionToAccessAssistant
    ) {
      this.assistantElement.setIsOpen(true);
      this.assistentMenuTriggerElement.openMenu();

      event.preventDefault();
    }
  }

  @Input() currentRoute: string;
  @Input() deviceType: string;
  @Input() hasPermissionToChangeDateRange: boolean;
  @Input() hasPermissionToChangeFilters: boolean;
  @Input() hasPromotion: boolean;
  @Input() hasTabs: boolean;
  @Input() info: InfoItem;
  @Input() pageTitle: string;
  @Input() user: User;

  @Output() signOut = new EventEmitter<void>();

  @ViewChild('assistant') assistantElement: GfAssistantComponent;
  @ViewChild('assistantTrigger') assistentMenuTriggerElement: MatMenuTrigger;

  public hasFilters: boolean;
  public hasImpersonationId: boolean;
  public hasPermissionForAuthOidc: boolean;
  public hasPermissionForSubscription: boolean;
  public hasPermissionToAccessAdminControl: boolean;
  public hasPermissionToAccessAssistant: boolean;
  public hasPermissionToAccessFearAndGreedIndex: boolean;
  public hasPermissionToCreateUser: boolean;
  public impersonationId: string;
  public internalRoutes = internalRoutes;
  public isMenuOpen: boolean;
  public routeAbout = publicRoutes.about.path;
  public routeFeatures = publicRoutes.features.path;
  public routeMarkets = publicRoutes.markets.path;
  public routePricing = publicRoutes.pricing.path;
  public routeResources = publicRoutes.resources.path;
  public routerLinkAbout = publicRoutes.about.routerLink;
  public routerLinkAccount = internalRoutes.account.routerLink;
  public routerLinkAccounts = internalRoutes.accounts.routerLink;
  public routerLinkAdminControl = internalRoutes.adminControl.routerLink;
  public routerLinkFeatures = publicRoutes.features.routerLink;
  public routerLinkMarkets = publicRoutes.markets.routerLink;
  public routerLinkPortfolio = internalRoutes.portfolio.routerLink;
  public routerLinkPricing = publicRoutes.pricing.routerLink;
  public routerLinkRegister = publicRoutes.register.routerLink;
  public routerLinkResources = publicRoutes.resources.routerLink;

  // Navigation sections from service
  public sections: NavSection[] = [];

  public constructor(
    private dataService: DataService,
    private destroyRef: DestroyRef,
    private impersonationStorageService: ImpersonationStorageService,
    private layoutService: LayoutService,
    public navigationService: NavigationService,
    private router: Router,
    private settingsStorageService: SettingsStorageService,
    private tokenStorageService: TokenStorageService,
    private userService: UserService
  ) {
    this.impersonationStorageService
      .onChangeHasImpersonation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((impersonationId) => {
        this.hasImpersonationId = !!impersonationId;
        this.impersonationId = impersonationId;
      });

    addIcons({
      closeOutline,
      logoGithub,
      menuOutline,
      optionsOutline,
      personCircleOutline,
      radioButtonOffOutline,
      radioButtonOnOutline
    });
  }

  public ngOnChanges() {
    this.hasFilters = this.userService.hasFilters();

    this.hasPermissionForAuthOidc = hasPermission(
      this.info?.globalPermissions,
      permissions.enableAuthOidc
    );

    this.hasPermissionForSubscription = hasPermission(
      this.info?.globalPermissions,
      permissions.enableSubscription
    );

    this.hasPermissionToAccessAdminControl = hasPermission(
      this.user?.permissions,
      permissions.accessAdminControl
    );

    this.hasPermissionToAccessAssistant = hasPermission(
      this.user?.permissions,
      permissions.accessAssistant
    );

    this.hasPermissionToAccessFearAndGreedIndex = hasPermission(
      this.info?.globalPermissions,
      permissions.enableFearAndGreedIndex
    );

    this.hasPermissionToCreateUser = hasPermission(
      this.info?.globalPermissions,
      permissions.createUserAccount
    );

    // Filter sections based on permissions
    this.sections = this.navigationService.sections.filter((section) => {
      if (section.permission === 'accessAdminControl') {
        return this.hasPermissionToAccessAdminControl;
      }

      return true;
    });
  }

  public onHamburgerClick() {
    this.navigationService.toggleSidebar();
  }

  public isActiveSection(sectionId: string): boolean {
    const section = this.navigationService.sections.find(
      (s) => s.id === sectionId
    );

    if (!section) {
      return false;
    }

    return section.routePrefixes.some((prefix) =>
      (`/${this.currentRoute}` ).startsWith(prefix)
    );
  }

  public closeAssistant() {
    this.assistentMenuTriggerElement?.closeMenu();
  }

  public impersonateAccount(aId: string) {
    if (aId) {
      this.impersonationStorageService.setId(aId);
    } else {
      this.impersonationStorageService.removeId();
    }

    window.location.reload();
  }

  public onDateRangeChange(dateRange: DateRange) {
    this.dataService
      .putUserSetting({ dateRange })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.userService
          .get(true)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      });
  }

  public onFiltersChanged(filters: Filter[]) {
    const userSetting: UpdateUserSettingDto = {};

    for (const filter of filters) {
      if (filter.type === 'ACCOUNT') {
        userSetting['filters.accounts'] = filter.id ? [filter.id] : null;
      } else if (filter.type === 'ASSET_CLASS') {
        userSetting['filters.assetClasses'] = filter.id ? [filter.id] : null;
      } else if (filter.type === 'DATA_SOURCE') {
        userSetting['filters.dataSource'] = filter.id ? filter.id : null;
      } else if (filter.type === 'SYMBOL') {
        userSetting['filters.symbol'] = filter.id ? filter.id : null;
      } else if (filter.type === 'TAG') {
        userSetting['filters.tags'] = filter.id ? [filter.id] : null;
      }
    }

    this.dataService
      .putUserSetting(userSetting)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.userService
          .get(true)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      });
  }

  public onLogoClick() {
    if (['home', 'zen'].includes(this.currentRoute)) {
      this.layoutService.getShouldReloadSubject().next();
    }
  }

  public onMenuClosed() {
    this.isMenuOpen = false;
  }

  public onMenuOpened() {
    this.isMenuOpen = true;
  }

  public onOpenAssistant() {
    this.assistantElement.initialize();
  }

  public onSignOut() {
    this.signOut.next();
  }

  public setToken(aToken: string) {
    this.tokenStorageService.saveToken(
      aToken,
      this.settingsStorageService.getSetting(KEY_STAY_SIGNED_IN) === 'true'
    );

    this.userService
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        const userLanguage = user?.settings?.language;

        if (userLanguage && document.documentElement.lang !== userLanguage) {
          window.location.href = `../${userLanguage}`;
        } else {
          this.router.navigate(['/']);
        }
      });
  }
}
