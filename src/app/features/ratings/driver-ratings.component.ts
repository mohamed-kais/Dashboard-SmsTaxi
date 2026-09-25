import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { RatingService } from '../../core/services/rating.service';
import { Rating } from '../../core/models/rating.model';
import { PagetitleComponent } from '../../shared/ui/pagetitle/pagetitle.component';
import { StatComponent } from '../../shared/widget/stat/stat.component';
import { DatePipe } from '@angular/common';

/**
 * Per-driver ratings detail: average + rating history.
 *
 * UI-only flagging: the spec has NO low-rating flag/report endpoint
 * (docs/IMPLEMENTATION_PLAN.md §5.6 gap) — `flagDriver()` intentionally does
 * not call the backend (see ROADMAP note).
 */
@Component({
    selector: 'app-driver-ratings',
    templateUrl: './driver-ratings.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PagetitleComponent, RouterLink, StatComponent, DatePipe, TranslatePipe]
})
export class DriverRatingsComponent implements OnInit, OnDestroy {
  readonly title = 'Driver ratings';
  readonly breadcrumbItems = [
    { label: 'Fleet' },
    { label: 'Ratings' },
    { label: 'Driver', active: true },
  ];

  driverId = '';
  average = 0;
  hasAverage = false;
  ratings: Rating[] = [];
  loading = true;
  error = '';
  /** Set when the UI-only "Report low rating" action was triggered. */
  reported = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly ratingService: RatingService,
    private readonly route: ActivatedRoute,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.driverId = params.get('id') ?? '';
          this.loading = true;
          this.error = '';
          this.reported = false;
          if (!this.driverId) {
            this.loading = false;
            this.error = this.translate.instant('ratings.driver.noDriverId');
            return of({ average: NaN, ratings: [] as Rating[] });
          }
          return forkJoin({
            average: this.ratingService
              .getDriverAverage(this.driverId)
              .pipe(catchError(() => of(NaN))),
            ratings: this.ratingService
              .getDriverRatings(this.driverId)
              .pipe(catchError(() => of([] as Rating[]))),
          });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(({ average, ratings }) => {
        this.loading = false;
        this.hasAverage = !Number.isNaN(average);
        this.average = this.hasAverage ? average : 0;
        this.ratings = ratings ?? [];
        if (!this.hasAverage && this.ratings.length === 0) {
          this.error = this.translate.instant('ratings.driver.empty');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Average below 3 → show the UI-only low-average alert (no backend flag). */
  get isLowAverage(): boolean {
    return this.hasAverage && this.average < 3;
  }

  /**
   * Numeric badge mapping (feature-local, per plan §7 instructions — not added
   * to core constants): >=4 success, 3 warning, <3 danger.
   */
  ratingBadgeClass(value?: number): string {
    if (value === undefined || value === null) {
      return 'badge-soft-secondary';
    }
    if (value >= 4) {
      return 'badge-soft-success';
    }
    if (value === 3) {
      return 'badge-soft-warning';
    }
    return 'badge-soft-danger';
  }

  isLowRating(value?: number): boolean {
    return value !== undefined && value !== null && value < 3;
  }

  /** Number of rating entries below 3. */
  get lowRatingCount(): number {
    return this.ratings.filter((r) => this.isLowRating(r.rating)).length;
  }

  formatRating(value?: number): string {
    return value !== undefined && value !== null ? String(value) : '—';
  }

  /**
   * UI-ONLY flagging. No `flag low rating` endpoint exists in the OpenAPI spec
   * — this deliberately does NOT call any backend route (see ROADMAP seed
   * "Rating flag/low-rating workflow"). Wire a real endpoint here if the
   * backend team documents one.
   */
  flagDriver(): void {
    console.info(
      `[ratings] Driver "${this.driverId}" reported for low average ` +
        `(${this.average.toFixed(2)}) — UI-only; no backend endpoint exists (ROADMAP).`
    );
    this.reported = true;
  }
}