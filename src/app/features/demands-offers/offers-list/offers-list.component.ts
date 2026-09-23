import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Subject, Subscription, debounceTime, merge, switchMap, tap } from 'rxjs';
import Swal from 'sweetalert2';

import { OffreAdminDto, PageOffreAdminDto } from '../../../core/models/offre.model';
import { StatusEnum } from '../../../core/models/common.model';
import { OffreService } from '../../../core/services/offre.service';
import {
  OFFRE_ETAT,
  OFFRE_STATUS,
  StatusBadge,
  statusBadge,
} from '../../../core/constants/status-badges';
import { NgbdSortableHeader, SortEvent } from '../../../core/directives/sortable.directive';
import { TableState, createTableState } from '../../../core/utils/table-state';
import { extractErrorMessage, ngbDateToParam } from '../feature.helpers';

/**
 * Offers list — searchable / sortable / paginated admin table over
 * `GET /api/get-all-offres` (pattern: salvaged orders pipeline, plan §3/§5.4).
 *
 * Same server-side pipeline as the demands list: debounced filter changes +
 * reload triggers merged into `switchMap` → `OffreService.searchOffres()`.
 * Supports deep-links used by other screens: `/offers?clientPhone=…` (from the
 * demand detail) and `?etat=…`.
 */
@Component({
  selector: 'app-offers-list',
  templateUrl: './offers-list.component.html',
  styleUrls: ['./offers-list.component.scss'],
})
export class OffersListComponent implements OnInit, OnDestroy {
  readonly etatOptions = OFFRE_ETAT;
  readonly breadcrumb = [{ label: 'Operations' }, { label: 'Offers', active: true }];

  filter = {
    etat: '' as StatusEnum | '',
    clientPhone: '',
    taxiPhone: '',
    dateFrom: null as NgbDateStruct | null,
    dateTo: null as NgbDateStruct | null,
    minPrice: '',
    maxPrice: '',
  };

  state: TableState<OffreAdminDto> = createTableState<OffreAdminDto>({
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

  constructor(private offreService: OffreService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Deep-links (e.g. demand detail → offers by client phone / status).
    const qp = this.route.snapshot.queryParamMap;
    const clientPhone = qp.get('clientPhone');
    const taxiPhone = qp.get('taxiPhone');
    const etat = qp.get('etat');
    if (clientPhone) {
      this.filter.clientPhone = clientPhone;
    }
    if (taxiPhone) {
      this.filter.taxiPhone = taxiPhone;
    }
    if (etat && (OFFRE_ETAT as readonly string[]).includes(etat)) {
      this.filter.etat = etat as StatusEnum;
    }

    this.sub.add(
      merge(this.reload$, this.filterChange$.pipe(debounceTime(300)))
        .pipe(
          tap(() => {
            this.loading = true;
            this.error = '';
          }),
          switchMap(() => this.offreService.searchOffres(this.buildParams()))
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
      clientPhone: '',
      taxiPhone: '',
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

  confirmCancel(row: OffreAdminDto): void {
    Swal.fire({
      title: 'Cancel offer?',
      text: `Offer #${row.id} will be cancelled.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Cancel offer',
      cancelButtonText: 'Keep',
    }).then((result) => {
      if (!result.isConfirmed || row.id === undefined) {
        return;
      }
      this.offreService.cancelOffre(row.id).subscribe({
        next: () => {
          Swal.fire('Cancelled', `Offer #${row.id} was cancelled.`, 'success');
          this.reload$.next();
        },
        error: (err) => Swal.fire('Error', extractErrorMessage(err), 'error'),
      });
    });
  }

  confirmDelete(row: OffreAdminDto): void {
    Swal.fire({
      title: 'Delete offer?',
      text: `Offer #${row.id} will be permanently deleted.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Keep',
    }).then((result) => {
      if (!result.isConfirmed || row.id === undefined) {
        return;
      }
      this.offreService.deleteOffre(row.id).subscribe({
        next: () => {
          Swal.fire('Deleted', `Offer #${row.id} was deleted.`, 'success');
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
    return statusBadge(etat, OFFRE_STATUS);
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
      clientPhone: this.filter.clientPhone.trim() || undefined,
      taxiPhone: this.filter.taxiPhone.trim() || undefined,
      dateDepotFrom: ngbDateToParam(this.filter.dateFrom),
      dateDepotTo: ngbDateToParam(this.filter.dateTo),
      minTotalPrice:
        this.filter.minPrice !== '' && !Number.isNaN(Number(this.filter.minPrice))
          ? Number(this.filter.minPrice)
          : undefined,
      maxTotalPrice:
        this.filter.maxPrice !== '' && !Number.isNaN(Number(this.filter.maxPrice))
          ? Number(this.filter.maxPrice)
          : undefined,
    };
  }

  private applyPage(page: PageOffreAdminDto): void {
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
