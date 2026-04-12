import { FamilyOfficeDataService } from '@ghostfolio/client/services/family-office-data.service';
import type {
  IActivityDetail,
  IFamilyOfficeDashboard,
  IPortfolioSummary
} from '@ghostfolio/common/interfaces';
import { GfK1IncomeSummaryComponent } from '@ghostfolio/ui/k1-income-summary';
import { GfPerformanceMetricsComponent } from '@ghostfolio/ui/performance-metrics';
import { AdminService } from '@ghostfolio/ui/services';

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    GfK1IncomeSummaryComponent,
    GfPerformanceMetricsComponent,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    NgxSkeletonLoaderModule,
    RouterModule
  ],
  selector: 'gf-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  public activityDetail: IActivityDetail | null = null;
  public dashboard: IFamilyOfficeDashboard | null = null;
  public distributionColumns = ['partnership', 'amount', 'date', 'type'];
  public isLoading = true;
  public isSeedingOrClearing = false;
  public k1ProgressPercent = 0;
  public portfolioSummary: IPortfolioSummary | null = null;

  public constructor(
    private readonly adminService: AdminService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef,
    private readonly familyOfficeDataService: FamilyOfficeDataService,
    private readonly snackBar: MatSnackBar
  ) {}

  public ngOnInit() {
    this.familyOfficeDataService
      .fetchDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        next: (dashboard) => {
          this.dashboard = dashboard;
          this.isLoading = false;

          if (dashboard.kDocumentStatus.total > 0) {
            this.k1ProgressPercent =
              (dashboard.kDocumentStatus.final /
                dashboard.kDocumentStatus.total) *
              100;
          }

          this.changeDetectorRef.markForCheck();
        }
      });

    this.familyOfficeDataService
      .fetchPortfolioSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.portfolioSummary = summary;
          this.changeDetectorRef.markForCheck();
        }
      });

    this.familyOfficeDataService
      .fetchActivity()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (activity) => {
          this.activityDetail = activity;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  public onPopulateDummyData() {
    if (
      !confirm(
        'This will populate the database with demo family office data (entities, partnerships, distributions, K-1 documents, and brokerage accounts with activities). Continue?'
      )
    ) {
      return;
    }

    this.isSeedingOrClearing = true;
    this.changeDetectorRef.markForCheck();

    this.adminService
      .seedFamilyOfficeData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          this.isSeedingOrClearing = false;
          this.snackBar.open(
            `Failed to populate data: ${error?.error?.message ?? 'Unknown error'}`,
            'Dismiss',
            { duration: 5000 }
          );
          this.changeDetectorRef.markForCheck();
        },
        next: (result) => {
          this.isSeedingOrClearing = false;
          const total = Object.values(result.created).reduce(
            (sum, n) => sum + n,
            0
          );
          this.snackBar.open(
            `Demo data populated (${total} records created)`,
            'OK',
            { duration: 5000 }
          );
          this.refreshDashboard();
        }
      });
  }

  public onClearDatabase() {
    if (
      !confirm(
        'This will permanently delete ALL family office data and portfolio data (entities, partnerships, accounts, activities, etc.). This cannot be undone. Continue?'
      )
    ) {
      return;
    }

    this.isSeedingOrClearing = true;
    this.changeDetectorRef.markForCheck();

    this.adminService
      .clearFamilyOfficeData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          this.isSeedingOrClearing = false;
          this.snackBar.open(
            `Failed to clear data: ${error?.error?.message ?? 'Unknown error'}`,
            'Dismiss',
            { duration: 5000 }
          );
          this.changeDetectorRef.markForCheck();
        },
        next: (result) => {
          this.isSeedingOrClearing = false;
          const total = Object.values(result.deleted).reduce(
            (sum, n) => sum + n,
            0
          );
          this.snackBar.open(
            `All data cleared (${total} records removed)`,
            'OK',
            { duration: 5000 }
          );
          this.refreshDashboard();
        }
      });
  }

  private refreshDashboard() {
    this.isLoading = true;
    this.dashboard = null;
    this.portfolioSummary = null;
    this.activityDetail = null;
    this.changeDetectorRef.markForCheck();
    this.ngOnInit();
  }
}
