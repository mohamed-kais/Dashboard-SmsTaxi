import { Component, OnDestroy, OnInit, QueryList, TemplateRef, ViewChildren } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

import { SmsIn } from '../../../core/models/sms.model';
import { SmsService } from '../../../core/services/sms.service';
import { NgbdSortableHeader, SortEvent } from '../../../core/directives/sortable.directive';
import {
  TableState,
  compare,
  createTableState,
  matches,
  paginate,
} from '../../../core/utils/table-state';
import { StatusBadge } from '../../../core/constants/status-badges';
import { apiErrorMessage } from '../sms-log.constants';

/** View toggle: full log vs untreated only. */
type SmsView = 'all' | 'untreated';

/**
 * SMS Log list (plan §5.7) — searchable/sortable/paginated table built from
 * the salvaged pipeline (BehaviorSubject + `_search$` + `switchMap` +
 * `TableState`; core/utils/table-state.ts + core/directives/sortable.directive).
 *
 * View toggle:
 *   All            → GET /api/get-all
 *   Untreated only → GET /api/get-listSMSnonTraites
 * Count chip      → GET /api/nbr-sms.
 * Both list endpoints return the full `SmsIn[]` (no server-side paging), so
 * filtering/sorting/paging runs client-side.
 *
 * Columns are exactly the fields `SmsIn` declares (id, telephone, contenu,
 * date_reception, traitement). There is NO `smsWinek`/`dateSmsWinek` here (those
 * belong to Taxi) and no invented processed-state column: the processed state
 * shown is `SmsIn.traitement` (boolean) — the one status field the model has.
 */
@Component({
  selector: 'app-sms-list',
  templateUrl: './sms-list.component.html',
})
export class SmsListComponent implements OnInit, OnDestroy {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;

  breadCrumbItems: { label: string; active: boolean }[] = [
    { label: 'Operations', active: false },
    { label: 'SMS Log', active: true },
  ];

  pageSizes = [8, 10, 20, 50];
  searchTerm = '';
  view: SmsView = 'all';

  /** Table pipeline state (shared with the template for row indices/`Showing x to y`). */
  state: TableState<SmsIn> = createTableState<SmsIn>({
    pageSize: 10,
    sortColumn: 'date_reception',
    sortDirection: 'desc',
  });

  rows$ = new BehaviorSubject<SmsIn[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  totalRecords$ = new BehaviorSubject<number>(0);

  /** Count chip value — GET /api/nbr-sms (total SMS, independent of the view). */
  totalCount = 0;

  errorMessage = '';
  pendingDelete: SmsIn | null = null;
  viewing: SmsIn | null = null;

  private _sms$ = new BehaviorSubject<SmsIn[]>([]);
  private _search$ = new Subject<void>();
  private _subscription: Subscription;

  constructor(
    private smsService: SmsService,
    private modalService: NgbModal,
    private translate: TranslateService
  ) {
    this._subscription = this._search$
      .pipe(
        debounceTime(200),
        switchMap(() => this._applySearch())
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.loadSms();
    this.refreshCount();
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  /** Toggle the All / Untreated-only view (re-fetches from the matching endpoint). */
  setView(view: SmsView): void {
    if (this.view === view) {
      return;
    }
    this.view = view;
    this.state.page = 1;
    this.loadSms();
  }

  loadSms(): void {
    this.loading$.next(true);
    this.errorMessage = '';

    const request$ =
      this.view === 'untreated' ? this.smsService.getUntreatedSms() : this.smsService.getSmsList();

    request$.subscribe({
      next: (sms) => {
        this._sms$.next(sms ?? []);
        this.loading$.next(false);
        this._search$.next();
      },
      error: (err) => {
        this.loading$.next(false);
        this.errorMessage = apiErrorMessage(err) || this.translate.instant('sms.list.loadFailed');
      },
    });
  }

  /** Refresh the count chip (GET /api/nbr-sms). */
  refreshCount(): void {
    this.smsService.countSms().subscribe({
      next: (count) => (this.totalCount = count ?? 0),
      error: () => (this.totalCount = 0),
    });
  }

  // ---------------------------------------------------------------------------
  // Search / sort / paginate pipeline
  // ---------------------------------------------------------------------------

  onSearchChange(): void {
    this.state.searchTerm = this.searchTerm;
    this.state.page = 1;
    this._search$.next();
  }

  onSortChange(event: SortEvent): void {
    this.headers?.forEach((header) => {
      if (header.sortable !== event.column) {
        header.direction = '';
      }
    });
    this.state.sortColumn = event.column;
    this.state.sortDirection = event.direction;
    this._search$.next();
  }

  onPageChange(page: number): void {
    this.state.page = page;
    this._search$.next();
  }

  onPageSizeChange(size: number): void {
    this.state.pageSize = size;
    this.state.page = 1;
    this._search$.next();
  }

  directionFor(column: string): '' | 'asc' | 'desc' {
    if (this.state.sortColumn !== column || !this.state.sortDirection) {
      return '';
    }
    return this.state.sortDirection;
  }

  private _applySearch(): Observable<undefined> {
    const { searchTerm, sortColumn, sortDirection, page, pageSize } = this.state;
    const all = this._sms$.value;

    // 1. filter — phone, content, id (case-insensitive)
    let filtered = all;
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();
      filtered = all.filter(
        (s) => matches(s.telephone, term) || matches(s.contenu, term) || matches(s.id, term)
      );
    }

    // 2. sort
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) =>
        compare(
          this._sortValue(a, sortColumn),
          this._sortValue(b, sortColumn),
          sortDirection === 'asc'
        )
      );
    }

    // 3. paginate + bookkeeping
    this.state.totalRecords = filtered.length;
    this.state.filteredRows = filtered;
    this.state.rows = paginate(filtered, page, pageSize);
    this.state.startIndex = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
    this.state.endIndex = Math.min(page * pageSize, filtered.length);

    this.rows$.next(this.state.rows);
    this.totalRecords$.next(this.state.totalRecords);

    return of(undefined);
  }

  private _sortValue(
    sms: SmsIn,
    column: string
  ): string | number | boolean | null | undefined {
    switch (column) {
      case 'id':
        return sms.id ?? null;
      case 'telephone':
        return sms.telephone ?? null;
      case 'contenu':
        return sms.contenu ?? null;
      case 'date_reception':
        return sms.date_reception ?? null;
      case 'traitement':
        return sms.traitement ?? null;
      default:
        return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  /**
   * Badge for `SmsIn.traitement` — the processed-state field the model
   * declares (there is no dedicated SMS badge map in core/constants, which is
   * read-only for this lane; the label/class follow the plan §7 scheme:
   * processed → success, untreated → warning).
   */
  traitementBadge(sms: SmsIn): StatusBadge {
    return sms.traitement
      ? { label: this.translate.instant('sms.list.processed'), class: 'badge-soft-success' }
      : { label: this.translate.instant('sms.list.untreated'), class: 'badge-soft-warning' };
  }

  // ---------------------------------------------------------------------------
  // View / delete
  // ---------------------------------------------------------------------------

  /** View modal with the full SMS content. */
  openView(sms: SmsIn, content: TemplateRef<unknown>): void {
    this.viewing = sms;
    this.modalService.open(content, { centered: true }).result.then(
      () => (this.viewing = null),
      () => (this.viewing = null)
    );
  }

  askDelete(sms: SmsIn, content: TemplateRef<unknown>): void {
    this.pendingDelete = sms;
    this.modalService.open(content, { centered: true }).result.then(
      (result) => {
        if (result === 'confirm' && this.pendingDelete) {
          this.confirmDelete();
        }
        this.pendingDelete = null;
      },
      () => {
        this.pendingDelete = null;
      }
    );
  }

  private confirmDelete(): void {
    const id = this.pendingDelete?.id;
    if (id === undefined || id === null) {
      return;
    }
    this.smsService.deleteSms(id).subscribe({
      next: () => {
        this.loadSms();
        this.refreshCount();
      },
      error: (err) => {
        this.errorMessage = apiErrorMessage(err) || this.translate.instant('sms.list.deleteFailed');
      },
    });
  }
}
