import { K1ImportDataService } from '@ghostfolio/client/services/k1-import-data.service';
import type {
  K1AggregationResult,
  K1ExtractedField
} from '@ghostfolio/common/interfaces';

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';

interface EditableField extends K1ExtractedField {
  editValue: string;
  editLabel: string;
  cellType: string;
  editCellType: string;
  /** Snapshot value before inline-edit focus (for Escape revert) */
  _snapshotValue: string;
  _snapshotLabel: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page' },
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  selector: 'gf-k1-verification',
  styleUrls: ['./k1-verification.scss'],
  templateUrl: './k1-verification.html'
})
export class K1VerificationComponent implements OnInit {
  public aggregations: K1AggregationResult[] = [];
  public canConfirm = false;
  public error: string | null = null;
  public fields: EditableField[] = [];
  public isLoading = true;
  public isSaving = false;
  public sessionId: string;
  public taxYear: number;
  public cellTypeOptions = [
    { value: 'number', label: 'Number ($)' },
    { value: 'string', label: 'String' },
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'boolean', label: 'Boolean' }
  ];

  public constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef,
    private readonly k1ImportDataService: K1ImportDataService,
    private readonly router: Router
  ) {}

  public ngOnInit(): void {
    this.sessionId = this.activatedRoute.snapshot.params['id'];
    this.loadSession();
  }

  /**
   * Get confidence badge CSS class.
   */
  public getConfidenceClass(level: string): string {
    switch (level) {
      case 'HIGH':
        return 'confidence-high';
      case 'MEDIUM':
        return 'confidence-medium';
      case 'LOW':
        return 'confidence-low';
      default:
        return '';
    }
  }

  // ── Inline Editing ──────────────────────────────────────────────────

  /**
   * Snapshot the current value when the user focuses an inline input.
   */
  public onFieldFocus(field: EditableField, column: 'label' | 'value'): void {
    if (column === 'value') {
      field._snapshotValue = field.rawValue;
    } else {
      field._snapshotLabel = field.customLabel || field.label;
    }
  }

  /**
   * Commit the inline edit when the input loses focus.
   */
  public onFieldBlur(
    field: EditableField,
    column: 'label' | 'value',
    event: FocusEvent
  ): void {
    const input = event.target as HTMLInputElement;
    const newVal = input.value.trim();

    if (column === 'value') {
      if (newVal !== field._snapshotValue) {
        field.rawValue = newVal;
        field.isUserEdited = true;
        field.isReviewed = true;
        this.reparse(field);
        this.recalculateAggregations();
      }
    } else {
      const original = field.label;
      if (newVal && newVal !== original) {
        field.customLabel = newVal;
      } else {
        field.customLabel = null;
        input.value = field.label;
      }
      if (newVal !== field._snapshotLabel) {
        field.isUserEdited = true;
        field.isReviewed = true;
      }
    }

    this.checkConfirmability();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Revert to snapshot on Escape key.
   */
  public onFieldEscape(
    field: EditableField,
    column: 'label' | 'value',
    event: KeyboardEvent
  ): void {
    const input = event.target as HTMLInputElement;
    if (column === 'value') {
      input.value = field._snapshotValue;
    } else {
      input.value = field._snapshotLabel;
    }
    input.blur();
  }

  /**
   * Handle cell type change via inline <select>.
   */
  public onTypeChange(field: EditableField, newType: string): void {
    field.cellType = newType;
    field.isUserEdited = true;
    field.isReviewed = true;
    this.reparse(field);
    this.recalculateAggregations();
    this.checkConfirmability();
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Toggle reviewed flag for a field.
   */
  public toggleReviewed(field: EditableField): void {
    field.isReviewed = !field.isReviewed;
    this.checkConfirmability();
    this.changeDetectorRef.markForCheck();
  }

  // ── Actions ─────────────────────────────────────────────────────────

  /**
   * Submit verified data.
   */
  public submitVerification(): void {
    if (!this.canConfirm) {
      return;
    }

    this.isSaving = true;
    this.error = null;
    this.changeDetectorRef.markForCheck();

    const data = {
      taxYear: this.taxYear,
      fields: this.fields.map((f) => ({
        boxNumber: f.boxNumber,
        label: f.label,
        customLabel: f.customLabel,
        rawValue: f.rawValue,
        numericValue: f.numericValue,
        cellType: f.cellType,
        confidence: f.confidence,
        confidenceLevel: f.confidenceLevel,
        isUserEdited: f.isUserEdited,
        isReviewed: f.isReviewed
      })),
      unmappedItems: []
    };

    this.k1ImportDataService
      .verifyImportSession(this.sessionId, data as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.router.navigate(['/k1-import', this.sessionId, 'confirm']);
        },
        error: (err) => {
          this.isSaving = false;
          this.error =
            err?.error?.message || err?.message || 'Verification failed.';
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  /**
   * Cancel and go back to import page.
   */
  public cancelImport(): void {
    this.k1ImportDataService
      .cancelImportSession(this.sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/k1-import']);
        },
        error: (err) => {
          this.error =
            err?.error?.message || err?.message || 'Cancel failed.';
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  // ── Private ─────────────────────────────────────────────────────────

  /**
   * Re-parse the numeric value from rawValue based on cellType.
   */
  private reparse(field: EditableField): void {
    if (field.cellType === 'boolean') {
      const lower = field.rawValue.toLowerCase().trim();
      field.numericValue = null;
      field.rawValue =
        lower === 'true' || lower === 'yes' || lower === '1' || lower === 'x'
          ? 'true'
          : 'false';
    } else if (field.cellType === 'string') {
      field.numericValue = null;
    } else {
      const cleaned = field.rawValue
        .replace(/[$,%]/g, '')
        .replace(/\(([^)]+)\)/, '-$1')
        .trim();
      const parsed = parseFloat(cleaned);
      field.numericValue = isNaN(parsed) ? null : parsed;
    }
  }

  /**
   * Load session data and populate fields.
   */
  private loadSession(): void {
    this.k1ImportDataService
      .fetchImportSession(this.sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session: any) => {
          if (
            session.status !== 'EXTRACTED' &&
            session.status !== 'VERIFIED'
          ) {
            this.error = `Session is in ${session.status} status. Cannot verify.`;
            this.isLoading = false;
            this.changeDetectorRef.markForCheck();
            return;
          }

          this.taxYear = session.taxYear;

          const extraction = session.rawExtraction;
          if (extraction) {
            // Dedup: filter out subtype-encoded duplicates (e.g., '20A-A' when '20A' exists)
            const rawFields: K1ExtractedField[] = extraction.fields || [];
            const boxNumbers = new Set(rawFields.map((f: any) => f.boxNumber));
            const dedupedFields = rawFields.filter((f: any) => {
              const dashIdx = f.boxNumber.indexOf('-');
              if (dashIdx < 0) return true; // no dash → keep
              const base = f.boxNumber.substring(0, dashIdx);
              // If the base box (e.g., '20A') also exists, drop this duplicate ('20A-A')
              return !boxNumbers.has(base);
            });

            this.fields = dedupedFields.map(
              (f: K1ExtractedField) => ({
                ...f,
                editValue: f.rawValue,
                editLabel: f.customLabel || f.label,
                cellType: (f as any).cellType || 'number',
                editCellType: (f as any).cellType || 'number',
                _snapshotValue: f.rawValue,
                _snapshotLabel: f.customLabel || f.label
              })
            );

            // Unmapped items are not displayed — all cells are mapped
          }

          this.recalculateAggregations();
          this.checkConfirmability();
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        },
        error: (err) => {
          this.error =
            err?.error?.message || err?.message || 'Failed to load session.';
          this.isLoading = false;
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  /**
   * Recalculate aggregation summaries from current field values.
   * FR-034: Auto-recalculate when cell values change.
   * Uses all 15 default aggregation rules to match backend behavior.
   */
  private recalculateAggregations(): void {
    const fieldMap: Record<string, number> = {};
    for (const f of this.fields) {
      if (f.numericValue !== null && f.numericValue !== undefined) {
        fieldMap[f.boxNumber] = f.numericValue;
      }
    }

    // All IRS default aggregation rules — mirrors DEFAULT_AGGREGATION_RULES on the backend
    const rules: Array<{ name: string; sourceCells: string[] }> = [
      { name: 'Total Ordinary Income', sourceCells: ['1'] },
      { name: 'Net Rental Income', sourceCells: ['2', '3'] },
      { name: 'Guaranteed Payments', sourceCells: ['4a', '4b'] },
      { name: 'Interest Income', sourceCells: ['5'] },
      { name: 'Total Dividends', sourceCells: ['6a'] },
      { name: 'Qualified Dividends', sourceCells: ['6b'] },
      { name: 'Royalties', sourceCells: ['7'] },
      { name: 'Total Capital Gains', sourceCells: ['8', '9a', '9b', '9c', '10'] },
      { name: 'Other Income', sourceCells: ['11'] },
      { name: 'Total Deductions', sourceCells: ['12', '13'] },
      { name: 'Self-Employment Earnings', sourceCells: ['14'] },
      { name: 'Alternative Minimum Tax Items', sourceCells: ['17'] },
      { name: 'Total Distributions', sourceCells: ['19a', '19b', '19'] },
      { name: 'Foreign Taxes Paid', sourceCells: ['21'] },
      { name: 'Total K-1 Income (Net)', sourceCells: ['1', '2', '3', '4b', '5', '6a', '7', '8', '9a', '9b', '9c', '10', '11', '14'] }
    ];

    this.aggregations = rules.map((rule, index) => {
      const breakdown: Record<string, number> = {};
      let computedValue = 0;
      for (const box of rule.sourceCells) {
        const val = fieldMap[box] ?? 0;
        breakdown[box] = val;
        computedValue += val;
      }
      return {
        ruleId: `client-${index + 1}`,
        name: rule.name,
        operation: 'SUM' as const,
        sourceCells: rule.sourceCells,
        computedValue,
        breakdown
      };
    });
  }

  /**
   * FR-035: Check if all medium/low-confidence fields are reviewed.
   */
  private checkConfirmability(): void {
    this.canConfirm = this.fields.every(
      (f) =>
        f.confidenceLevel === 'HIGH' ||
        f.isReviewed
    );
  }
}
