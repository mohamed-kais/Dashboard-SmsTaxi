/**
 * Dashboard / Overview — plan §5.1 (docs/IMPLEMENTATION_PLAN.md), lane L7.
 *
 * No new service: every value comes from other lanes' services (all
 * `providedIn: 'root'`) via their documented public methods:
 *  - TaxiService.getTaxiCount()        → GET /api/nbr-taxi
 *  - ClientService.getClientCount()    → GET /api/nbr-client
 *  - DemandeService.countWaiting()     → GET /api/nbr-DemandeEnattente
 *  - DemandeService.countInProgress()  → GET /api/nbr-NbrDemandeEncours
 *  - OffreService.countWaiting()       → GET /api/NbrOffreEnattente
 *  - OffreService.countInProgress()    → GET /api/NbrOffreEncours
 *  - SmsService.countSms()             → GET /api/nbr-sms
 *  - DemandeService.searchDemandes()   → GET /api/get-demande (recent 5)
 *  - OffreService.searchOffres()       → GET /api/get-all-offres (recent 5)
 *
 * The plan's "taxis online" and "rides today" counters have NO documented
 * endpoint and are intentionally omitted (→ ROADMAP). No charts either: there
 * is no per-day/historical activity endpoint (→ ROADMAP).
 */
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { catchError, finalize, take, takeUntil } from 'rxjs/operators';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { ClientService } from '../../core/services/client.service';
import { DemandeService } from '../../core/services/demande.service';
import { OffreService } from '../../core/services/offre.service';
import { SmsService } from '../../core/services/sms.service';
import { TaxiService } from '../../core/services/taxi.service';
import {
  DEMANDE_STATUS,
  OFFRE_STATUS,
  StatusBadge,
  statusBadge,
} from '../../core/constants/status-badges';
import { StatusEnum } from '../../core/models/common.model';
import { DemandeAdminDto } from '../../core/models/demande.model';
import { OffreAdminDto } from '../../core/models/offre.model';
import { DashboardCountKey, DashboardCounts } from './dashboard.model';
import { LoaderComponent } from '../../shared/ui/loader/loader.component';
import { PagetitleComponent } from '../../shared/ui/pagetitle/pagetitle.component';
import { StatComponent } from '../../shared/widget/stat/stat.component';
import { RouterLink } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoaderComponent, PagetitleComponent, StatComponent, RouterLink, NgClass, DatePipe, TranslatePipe]
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly title = 'Dashboard';
  readonly breadcrumbItems = [
    { label: 'SMS Taxi' },
    { label: 'Dashboard', active: true },
  ];

  /** Counts per `nbr-*` channel; empty while requests are in flight (templates show 0). */
  counts: DashboardCounts = {};

  /** Stat channels that errored (channel key → human label), drives the alert box. */
  failedCounts: Partial<Record<DashboardCountKey, string>> = {};

  /** Recent activity feeds (newest 5, from the admin search endpoints). */
  demands: DemandeAdminDto[] = [];
  demandTotal = 0;
  offres: OffreAdminDto[] = [];
  offreTotal = 0;

  /** Feeds error summary (shows an alert; tables then render empty states). */
  feedError = '';
  /** True while the first fetch cycle (counts + feeds) is in flight. */
  loading = true;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly taxiService: TaxiService,
    private readonly clientService: ClientService,
    private readonly demandeService: DemandeService,
    private readonly offreService: OffreService,
    private readonly smsService: SmsService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Failed stat-card labels for the alert box. */
  get failedCardLabels(): string[] {
    return Object.values(this.failedCounts);
  }

  /** Re-run every count and feed request (refresh button). */
  refresh(): void {
    this.loadAll();
  }

  /**
   * Formatted value for one stat card. While the observable hasn't emitted the
   * card shows `0`; after a failed request it shows `—`.
   */
  countValue(key: DashboardCountKey): string {
    const value = this.counts[key];
    if (value !== undefined && value !== null) {
      return Number(value).toLocaleString();
    }
    return this.isFailed(key) ? '\u2014' : '0';
  }

  /** True when a stat channel's request errored. */
  isFailed(key: DashboardCountKey): boolean {
    return this.failedCounts[key] !== undefined;
  }

  /** Demande `etat` → shared badge scheme (plan §7). */
  demandBadge(etat?: StatusEnum): StatusBadge {
    return etat
      ? statusBadge(etat, DEMANDE_STATUS)
      : { label: this.translate.instant('dashboard.unknown'), class: 'badge-soft-secondary' };
  }

  /** Offre `etat` → shared badge scheme (plan §7). */
  offerBadge(etat?: StatusEnum): StatusBadge {
    return etat
      ? statusBadge(etat, OFFRE_STATUS)
      : { label: this.translate.instant('dashboard.unknown'), class: 'badge-soft-secondary' };
  }

  // -------------------------------------------------------------------------
  // Data loading
  // -------------------------------------------------------------------------

  private loadAll(): void {
    this.failedCounts = {};
    this.feedError = '';
    this.loading = true;
    const whenDone = this.completionTracker(3);

    // Stat counts: one small combineLatest; per-channel failures degrade to
    // `undefined` (card shows —) instead of killing the whole group.
    combineLatest({
      taxi: this.countPipe('taxi', this.translate.instant('Taxis'), this.taxiService.getTaxiCount()),
      client: this.countPipe('client', this.translate.instant('Clients'), this.clientService.getClientCount()),
      demandeWaiting: this.countPipe(
        'demandeWaiting',
        this.translate.instant('dashboard.cards.demandsWaiting'),
        this.demandeService.countWaiting()
      ),
      demandeInProgress: this.countPipe(
        'demandeInProgress',
        this.translate.instant('dashboard.cards.demandsInProgress'),
        this.demandeService.countInProgress()
      ),
      offreWaiting: this.countPipe(
        'offreWaiting',
        this.translate.instant('dashboard.cards.offersWaiting'),
        this.offreService.countWaiting()
      ),
      offreInProgress: this.countPipe(
        'offreInProgress',
        this.translate.instant('dashboard.cards.offersInProgress'),
        this.offreService.countInProgress()
      ),
      sms: this.countPipe('sms', this.translate.instant('dashboard.cards.smsReceived'), this.smsService.countSms()),
    })
      .pipe(take(1), takeUntil(this.destroy$), finalize(whenDone))
      .subscribe({
        next: (counts) => {
          this.counts = counts;
        },
        error: () => undefined,
      });

    // Recent demands (newest first).
    this.demandeService
      .searchDemandes({ page: 0, size: 5, sort: 'date_depot,desc' })
      .pipe(take(1), takeUntil(this.destroy$), finalize(whenDone))
      .subscribe({
        next: (page) => {
          this.demands = page?.content ?? [];
          this.demandTotal = page?.totalElements ?? this.demands.length;
        },
        error: () => {
          this.feedError = this.translate.instant('dashboard.recent.demandsError');
        },
      });

    // Recent offers (newest first).
    this.offreService
      .searchOffres({ page: 0, size: 5, sort: 'date_depot,desc' })
      .pipe(take(1), takeUntil(this.destroy$), finalize(whenDone))
      .subscribe({
        next: (page) => {
          this.offres = page?.content ?? [];
          this.offreTotal = page?.totalElements ?? this.offres.length;
        },
        error: () => {
          this.feedError = this.translate.instant('dashboard.recent.offersError');
        },
      });
  }

  /**
   * Wrap one count request: on HTTP error record the failed card label and
   * degrade the value to `undefined` (`countValue` then shows `—`).
   */
  private countPipe(
    key: DashboardCountKey,
    label: string,
    source: Observable<number>
  ): Observable<number | undefined> {
    return source.pipe(
      catchError(() => {
        this.failedCounts = { ...this.failedCounts, [key]: label };
        return of(undefined);
      })
    );
  }

  /**
   * Track `total` independent request groups; flips `loading` off once all of
   * them have emitted or errored. Each `loadAll()` call gets its own tracker.
   */
  private completionTracker(total: number): () => void {
    let remaining = total;
    return () => {
      remaining -= 1;
      if (remaining <= 0) {
        this.loading = false;
      }
    };
  }
}