import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, finalize, map, switchMap } from 'rxjs/operators';

import {
  TaxiCriteriaQuery,
  TaxiListQuery,
  TaxiService,
} from '../../core/services/taxi.service';
import {
  StatusBadge,
  statusBadge,
  TAXI_STATUS,
  TAXI_STATUS_VALUES,
} from '../../core/constants/status-badges';
import {
  NgbdSortableHeader,
  SortEvent,
} from '../../core/directives/sortable.directive';
import {
  createTableState,
  TableState,
} from '../../core/utils/table-state';
import { TaxiStatus } from '../../core/models/common.model';
import {
  GetAllTaxisDtoResponse,
  PageGetAllTaxisDtoResponse,
  TaxiCreateDto,
} from '../../core/models/taxi.model';
import { TaxiStatusFilter } from './taxis.model';
import { TaxiFormModalComponent } from './taxi-form-modal.component';

/** Phone-like check used to route a toolbar search into the criteria phone/name filter. */
const PHONE_LIKE = /^[0-9+\-\s()]+$/;

/**
 * Taxis list — searchable / sortable / paginated admin grid (plan §5.2, pattern:
 * TEMPLATE_GUIDE §6 item 1).
 *
 * Data source: `GET /api/get-all-taxis` (server-side paging + sorting); when a
 * search term is present it switches to `GET /api/get-all-taxis-criteria`
 * (server-side phone/name filter). `taxiStatus` has no server-side filter on the
 * paginated endpoints, so the status dropdown filters the loaded page client-side
 * (see ROADMAP note in applyRows()).
 */
@Component({
  selector: 'app-taxis-list',
  templateUrl: './taxis-list.component.html',
})
export class TaxisListComponent implements OnInit {
  readonly state: TableState<GetAllTaxisDtoResponse> = createTableState<GetAllTaxisDtoResponse>({
    pageSize: 10,
  });
  readonly rows$ = new BehaviorSubject<GetAllTaxisDtoResponse[]>([]);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusFilterControl = new FormControl<TaxiStatusFilter>('', { nonNullable: true });
  readonly statuses = TAXI_STATUS_VALUES;

  statusFilter: TaxiStatusFilter = '';
  loading = false;
  loadError = '';
  actionError = '';
  readonly breadcrumbItems = [{ label: 'Fleet' }, { label: 'Taxis', active: true }];

  /** Page content as returned by the API (before client-side status filtering). */
  private _pageContent: GetAllTaxisDtoResponse[] = [];
  private readonly _search$ = new Subject<void>();

  @ViewChildren(NgbdSortableHeader) headers?: QueryList<NgbdSortableHeader>;

  constructor(
    private readonly taxiService: TaxiService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe((term) => {
      this.state.searchTerm = term.trim();
      this.state.page = 1;
      this._search$.next();
    });
    this.statusFilterControl.valueChanges.subscribe((value) => {
      this.statusFilter = value;
      this.applyRows();
    });
    this._search$
      .pipe(debounceTime(200), switchMap(() => this.fetchPage()))
      .subscribe();
    this._search$.next();
  }

  badgeFor(status?: TaxiStatus): StatusBadge {
    return status
      ? statusBadge(status, TAXI_STATUS)
      : { label: '—', class: 'badge-soft-secondary' };
  }

  onSortChange({ column, direction }: SortEvent): void {
    this.headers?.forEach((header) => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });
    this.state.sortColumn = direction ? column : '';
    this.state.sortDirection = direction;
    this.state.page = 1;
    this._search$.next();
  }

  onPageChange(page: number): void {
    this.state.page = page;
    this._search$.next();
  }

  openAddModal(): void {
    this.openFormModal();
  }

  openEditModal(taxi: GetAllTaxisDtoResponse): void {
    this.openFormModal(taxi);
  }

  deleteTaxi(taxi: GetAllTaxisDtoResponse): void {
    if (!taxi.id) {
      return;
    }
    const label = taxi.telephone || `#${taxi.id}`;
    if (!window.confirm(`Delete taxi ${label}? This cannot be undone.`)) {
      return;
    }
    this.actionError = '';
    this.taxiService.deleteTaxi(taxi.id).subscribe({
      next: () => {
        // Deleting the last row of a page steps back one page.
        if (this.state.rows.length === 1 && this.state.page > 1) {
          this.state.page -= 1;
        }
        this.refresh();
      },
      error: (err) => {
        this.actionError = err?.error?.message || err?.message || 'Failed to delete taxi.';
      },
    });
  }

  /**
   * Approve / reject quick action. The spec declares `PATCH /api/updateTaxiStatus/status`
   * WITHOUT any taxi identifier in its path/query (API_REFERENCE ambiguity #2), so the
   * status is written through `PATCH /api/update-taxi/{id}` with `taxiStatus` inside the
   * TaxiCreateDto body → ROADMAP.
   */
  setStatus(taxi: GetAllTaxisDtoResponse, taxiStatus: TaxiStatus): void {
    if (!taxi.id) {
      return;
    }
    this.actionError = '';
    this.taxiService.updateTaxi(taxi.id, this.toCreateDto(taxi, taxiStatus)).subscribe({
      next: () => this.refresh(),
      error: (err) => {
        this.actionError =
          err?.error?.message || err?.message || `Failed to set status to ${taxiStatus}.`;
      },
    });
  }

  private refresh(): void {
    this._search$.next();
  }

  private openFormModal(taxi?: GetAllTaxisDtoResponse): void {
    const modalRef = this.modalService.open(TaxiFormModalComponent, { size: 'lg', centered: true });
    if (taxi) {
      modalRef.componentInstance.taxiId = taxi.id;
      modalRef.componentInstance.initial = taxi;
    }
    modalRef.result.then(
      () => this.refresh(),
      () => undefined
    );
  }

  /** Map a list row back to the `TaxiCreateDto` body used by `PATCH /api/update-taxi/{id}`. */
  private toCreateDto(taxi: GetAllTaxisDtoResponse, taxiStatus?: TaxiStatus): TaxiCreateDto {
    return {
      telephone: taxi.telephone ?? '',
      contenu: taxi.contenu,
      nom: taxi.nom,
      numeroMatricule: taxi.numeroMatricule,
      numeroCin: taxi.numeroCin,
      constructeur: taxi.constructeur,
      numeroTaxi: taxi.numeroTaxi,
      email: taxi.email,
      type: taxi.type,
      taxiStatus: taxiStatus ?? taxi.taxiStatus,
    };
  }

  private fetchPage(): Observable<void> {
    const term = this.state.searchTerm;
    this.loading = true;
    this.loadError = '';
    return this.buildQuery(term).pipe(
      map((resp) => this.applyPage(resp)),
      catchError((err) => {
        this.loadError = err?.error?.message || err?.message || 'Failed to load taxis.';
        this._pageContent = [];
        this.applyRows();
        return of(undefined);
      }),
      finalize(() => {
        this.loading = false;
      })
    );
  }

  private buildQuery(term: string): Observable<PageGetAllTaxisDtoResponse> {
    const page = this.state.page - 1; // API paging is 0-based; TableState is 1-based
    const size = this.state.pageSize;
    if (term) {
      const criteria: TaxiCriteriaQuery = { page, size };
      if (PHONE_LIKE.test(term) && /\d/.test(term)) {
        criteria.phone = term;
      } else {
        criteria.name = term;
      }
      if (this.state.sortColumn && this.state.sortDirection) {
        criteria.sort = JSON.stringify([
          { field: this.state.sortColumn, direction: this.state.sortDirection },
        ]);
      }
      return this.taxiService.searchTaxisCriteria(criteria);
    }
    const list: TaxiListQuery = {
      page,
      size,
      sort: this.state.sortColumn
        ? `${this.state.sortColumn},${this.state.sortDirection || 'asc'}`
        : 'id,asc',
    };
    return this.taxiService.searchTaxis(list);
  }

  private applyPage(resp: PageGetAllTaxisDtoResponse): void {
    this._pageContent = resp.content ?? [];
    this.state.totalRecords = resp.totalElements ?? this._pageContent.length;
    this.applyRows();
  }

  /**
   * Re-render after client-side status filtering.
   * ROADMAP: `GET /api/get-all-taxis` / `get-all-taxis-criteria` expose no
   * server-side `taxiStatus` filter, so the status dropdown only filters the
   * currently loaded page — cross-page status filtering needs a backend filter
   * param (or a large-page workaround).
   */
  private applyRows(): void {
    const rows = this.statusFilter
      ? this._pageContent.filter((row) => row.taxiStatus === this.statusFilter)
      : this._pageContent.slice();
    this.state.filteredRows = rows;
    this.state.rows = rows;
    const base = (this.state.page - 1) * this.state.pageSize;
    this.state.startIndex = rows.length ? base + 1 : 0;
    this.state.endIndex = base + rows.length;
    this.rows$.next(rows);
  }
}