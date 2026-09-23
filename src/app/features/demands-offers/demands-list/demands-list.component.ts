import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subject, Subscription, debounceTime, merge, switchMap, tap } from 'rxjs';
import Swal from 'sweetalert2';

import { DemandeAdminDto, PageDemandeAdminDto } from '../../../core/models/demande.model';
import { StatusEnum } from '../../../core/models/common.model';
import { DemandeService } from '../../../core/services/demande.service';
import {
  DEMANDE_ETAT,
  DEMANDE_STATUS,
  StatusBadge,
  statusBadge,
} from '../../../core/constants/status-badges';
import { NgbdSortableHeader, SortEvent } from '../../../core/directives/sortable.directive';
import { TableState, createTableState } from '../../../core/utils/table-state';
import { extractErrorMessage, ngbDateToParam } from '../feature.helpers';

/**
 * Demands list — searchable / sortable / paginated admin table over
 * `GET /api/get-demande` (pattern: salvaged orders pipeline, plan §3/§5.4).
 *
 * Server-side pipeline: filter changes (debounced) and reload triggers are
 * merged, then `switchMap`'d into `DemandeService.searchDemandes()`; the
 * Spring page response drives rows + totals. Component view-state lives in the
 * generic `TableState` (1-based page) and is converted to the API's 0-based
 * `page` in `buildParams()`.
 */
@Component({
  selector: 'app-demands-list',
  templateUrl: './demands-list.component.html',
  styleUrls: ['./demands-list.component.scss'],
})
export class DemandsListComponent implements OnInit, OnDestroy {
  readonly etatOptions = DEMANDE_ETAT;
  readonly breadcrumb = [{ label: 'Operations' }, { label: 'Demands', active: true }];

  filter = {
    etat: '' as StatusEnum | '',
    phone: '',
    dateFrom: null as NgbDateStruct | null,
    dateTo: null as NgbDateStruct | null,
    minPrice: '',
    maxPrice: '',
  };

  state: TableState<DemandeAdminDto> = createTableState<DemandeAdminDto>({
    pageSize: 10,
    sortColumn: 'date_depot',
    sortDirection: 'desc',
  });
  loading = false;
  error = '';

  @ViewChildren(NgbdSortableHeader) headers?: QueryList<NgbdSortableHeader>;

  private readonly reload$ = new BehaviorSubject<void>(undefined);
  private readonly filterChange$ = new Subject<void>();
  private readonly sub = new Subscription();

  constructor(private demandeService: DemandeService) {}

  ngOnInit(): void {
    this.sub.add(
      merge(this.reload$, this.filterChange$.pipe(debounceTime(300)))
        .pipe(
          tap(() => {
            this.loading = true;
            this.error = '';
          }),
          switchMap(() => this.demandeService.searchDemandes(this.buildParams()))
        )
        .subscribe({
          next: (page) => this.applyPage(page),
          error: (err) => {
            this.loading = false;
            this.error = extractErrorMessage(err);
          },
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /** Filter changes re-run the search on page 1 (debounced). */
  applyFilters(): void {
    this.state.page = 1;
    this.filterChange$.next();
  }

  resetFilters(): void {
    this.filter = {
      etat: '',
      phone: '',
      dateFrom: null,
      dateTo: null,
      minPrice: '',
      maxPrice: '',
    };
    this.applyFilters();
  }

  onPageChange(page: number): void {
    this.state.page = page;
    this.reload$.next();
  }

  onSort({ column, direction }: SortEvent): void {
    this.headers?.forEach((h) => {
      if (h.sortable !== column) {
        h.direction = '';
      }
    });
    this.state.sortColumn = column;
    this.state.sortDirection = direction;
    this.state.page = 1;
    this.reload$.next();
  }

  confirmCancel(row: DemandeAdminDto): void {
    Swal.fire({
      title: 'Cancel demand?',
      text: `Demand #${row.id} will be cancelled.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cancel demand',
      cancelButtonText: 'Keep',
    }).then((result) => {
      if (!result.isConfirmed || row.id === undefined) {
        return;
      }
      this.demandeService.cancelDemande(row.id).subscribe({
        next: () => {
          Swal.fire('Cancelled', `Demand #${row.id} was cancelled.`, 'success');
          this.reload$.next();
        },
        error: (err) => Swal.fire('Error', extractErrorMessage(err), 'error'),
      });
    });
  }

  confirmDelete(row: DemandeAdminDto): void {
    Swal.fire({
      title: 'Delete demand?',
      text: `Demand #${row.id} will be permanently deleted.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Keep',
    }).then((result) => {
      if (!result.isConfirmed || row.id === undefined) {
        return;
      }
      this.demandeService.deleteDemande(row.id).subscribe({
        next: () => {
          Swal.fire('Deleted', `Demand #${row.id} was deleted.`, 'success');
          this.reload$.next();
        },
        error: (err) => Swal.fire('Error', extractErrorMessage(err), 'error'),
      });
    });
  }

  /** Status badge via the shared scheme (plan §7). */
  badge(etat?: StatusEnum): StatusBadge {
    if (!etat) {
      return { label: 'UNKNOWN', class: 'badge-soft-secondary' };
    }
    return statusBadge(etat, DEMANDE_STATUS);
  }

  private buildParams() {
    return {
      // API page is 0-based; TableState.page is 1-based (template pattern).
      page: this.state.page - 1,
      size: this.state.pageSize,
      sort:
        this.state.sortColumn && this.state.sortDirection
          ? `${this.state.sortColumn},${this.state.sortDirection}`
          : 'date_depot,desc',
      etat: this.filter.etat || undefined,
      clientPhone: this.filter.phone.trim() || undefined,
      dateDepotFrom: ngbDateToParam(this.filter.dateFrom),
      dateDepotTo: ngbDateToParam(this.filter.dateTo),
      minEstimatedPrice:
        this.filter.minPrice !== '' && !Number.isNaN(Number(this.filter.minPrice))
          ? Number(this.filter.minPrice)
          : undefined,
      maxEstimatedPrice:
        this.filter.maxPrice !== '' && !Number.isNaN(Number(this.filter.maxPrice))
          ? Number(this.filter.maxPrice)
          : undefined,
    };
  }

  private applyPage(page: PageDemandeAdminDto): void {
    const rows = page?.content ?? [];
    this.state.rows = rows;
    this.state.filteredRows = rows;
    this.state.totalRecords = page?.totalElements ?? rows.length;
    this.state.startIndex =
      this.state.totalRecords === 0
        ? 0
        : (this.state.page - 1) * this.state.pageSize + 1;
    this.state.endIndex = Math.min(
      this.state.page * this.state.pageSize,
      this.state.totalRecords
    );
    // The server's 0-based `number` is the truth (clamps us if we paged past the end).
    if (typeof page?.number === 'number') {
      this.state.page = page.number + 1;
    }
    this.loading = false;
  }
}
