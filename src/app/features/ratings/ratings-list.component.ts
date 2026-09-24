import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { RatingService } from '../../core/services/rating.service';
import { TaxiRatingSummaryDto } from '../../core/models/rating.model';

/**
 * Ratings home — driver lookup panel.
 *
 * There is NO documented "list all drivers with ratings" endpoint
 * (docs/API_REFERENCE.md §8): ratings are only readable per driver.
 * The admin resolves a driver through a taxi rating summary (by phone or taxi
 * ID) and then opens the per-driver detail route.
 */
@Component({
  selector: 'app-ratings-list',
  templateUrl: './ratings-list.component.html',
})
export class RatingsListComponent implements OnInit, OnDestroy {
  readonly title = 'Ratings';
  readonly breadcrumbItems = [
    { label: 'Fleet' },
    { label: 'Ratings', active: true },
  ];

  lookupForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
  lookupError = '';

  /** Resolved taxi rating summary (shown as summary cards). */
  summary?: TaxiRatingSummaryDto;
  /** Resolved driver id (string, as used by the ratings endpoints). */
  driverId?: string;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly formBuilder: UntypedFormBuilder,
    private readonly ratingService: RatingService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.lookupForm = this.formBuilder.group({
      lookup: [
        '',
        [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)],
      ],
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f() {
    return this.lookupForm.controls;
  }

  /**
   * Resolve the driver id from a taxi phone or a numeric taxi/driver id,
   * via the documented rating-summary endpoints:
   *  - digits only  → GET /api/taxis/{taxiId}/rating-summary
   *  - anything else→ GET /api/taxis/by-phone/{phone}/rating-summary
   */
  lookupDriver(): void {
    this.submitted = true;
    this.lookupError = '';
    if (this.lookupForm.invalid) {
      return;
    }
    const value: string = String(this.lookupForm.value.lookup).trim();
    this.loading = true;

    // Disambiguation: an all-digit value may be a taxi/driver ID (1–6 digits;
    // observed IDs max ≈ 1218) or a Tunisian phone number (8+ digits, e.g.
    // 92569444 or 21650672974). Short-digit values → ID endpoint; longer
    // digit strings → by-phone endpoint. (A raw-digit phone used to be
    // misrouted to the ID endpoint, which 500s: "An unexpected error occurred".)
    const looksLikePhone = /^\d+$/.test(value) && value.length >= 8;
    const request$ = looksLikePhone
      ? this.ratingService.getTaxiRatingSummaryByPhone(value)
      : this.ratingService.getTaxiRatingSummary(Number(value));

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (summary) => {
        this.loading = false;
        this.summary = summary;
        this.driverId =
          summary.taxiId !== undefined ? String(summary.taxiId) : value;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.summary = undefined;
        this.driverId = undefined;
        this.lookupError =
          typeof err === 'string'
            ? err
            : this.translate.instant('ratings.list.lookupFailed');
      },
    });
  }

  /** Navigate to the per-driver detail route: /ratings/driver/:id. */
  openDriverHistory(): void {
    if (this.driverId) {
      this.router.navigate(['driver', this.driverId], { relativeTo: this.route });
    }
  }

  formatRating(value?: number): string {
    return value !== undefined && value !== null ? Number(value).toFixed(2) : '—';
  }

  formatCount(value?: number): string {
    return value !== undefined && value !== null ? String(value) : '0';
  }
}