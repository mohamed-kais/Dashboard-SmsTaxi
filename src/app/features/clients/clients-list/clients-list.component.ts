import { Component, OnDestroy, OnInit, QueryList, TemplateRef, ViewChildren } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, Observable, Subject, Subscription, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

import { ClientDto } from '../../../core/models/client.model';
import { ClientService } from '../../../core/services/client.service';
import { NgbdSortableHeader, SortEvent } from '../../../core/directives/sortable.directive';
import {
  TableState,
  compare,
  createTableState,
  matches,
  paginate,
} from '../../../core/utils/table-state';
import { OFFRE_STATUS, StatusBadge, statusBadge } from '../../../core/constants/status-badges';
import { apiErrorMessage } from '../clients.constants';
import { ClientFormComponent } from '../client-form/client-form.component';

/**
 * Clients list (plan §5.3) — searchable/sortable/paginated table built from the
 * salvaged pipeline (BehaviorSubject + `_search$` + `switchMap` + `TableState`,
 * core/utils/table-state.ts + core/directives/sortable.directive.ts).
 *
 * Data: GET /api/get-allClients returns the full `ClientDto[]` (no server-side
 * paging on this endpoint), so filtering/sorting/paging runs client-side.
 */
@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit, OnDestroy {
  @ViewChildren(NgbdSortableHeader) headers!: QueryList<NgbdSortableHeader>;

  breadCrumbItems: { label: string; active: boolean }[] = [
    { label: 'Fleet', active: false },
    { label: 'Clients', active: true },
  ];

  pageSizes = [8, 10, 20, 50];
  searchTerm = '';

  /** Table pipeline state (shared with the template for row/`Showing x to y`). */
  state: TableState<ClientDto> = createTableState<ClientDto>({
    pageSize: 10,
    sortColumn: 'id',
    sortDirection: 'desc',
  });

  rows$ = new BehaviorSubject<ClientDto[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  totalRecords$ = new BehaviorSubject<number>(0);
  pageSize$ = new BehaviorSubject<number>(this.state.pageSize);

  errorMessage = '';
  pendingDelete: ClientDto | null = null;

  private _clients$ = new BehaviorSubject<ClientDto[]>([]);
  private _search$ = new Subject<void>();
  private _subscription: Subscription;

  constructor(
    private clientService: ClientService,
    private modalService: NgbModal
  ) {
    this._subscription = this._search$
      .pipe(
        debounceTime(200),
        switchMap(() => this._applySearch())
      )
      .subscribe();
  }

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  loadClients(): void {
    this.loading$.next(true);
    this.errorMessage = '';
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this._clients$.next(clients ?? []);
        this.loading$.next(false);
        this._search$.next();
      },
      error: (err) => {
        this.loading$.next(false);
        this.errorMessage = apiErrorMessage(err) || 'Failed to load clients.';
      },
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
    this.pageSize$.next(size);
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
    const all = this._clients$.value;

    // 1. filter — phone, email, id, display name (case-insensitive)
    let filtered = all;
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();
      filtered = all.filter(
        (c) =>
          matches(c.telephone, term) ||
          matches(c.email, term) ||
          matches(c.id, term) ||
          matches(this.displayName(c), term)
      );
    }

    // 2. sort
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) =>
        compare(this._sortValue(a, sortColumn), this._sortValue(b, sortColumn), sortDirection === 'asc')
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
    c: ClientDto,
    column: string
  ): string | number | boolean | null | undefined {
    switch (column) {
      case 'id':
        return c.id ?? null;
      case 'telephone':
        return c.telephone ?? null;
      case 'email':
        return c.email ?? null;
      case 'type':
        return c.type ?? null;
      case 'etat':
        return c.etat ?? null;
      case 'dateEnregistrement':
        return c.dateEnregistrement ?? null;
      default:
        return (c as Record<string, unknown>)[column] as
          | string
          | number
          | boolean
          | null
          | undefined;
    }
  }

  /**
   * Display name for a client row. `ClientDto` (transcribed spec fields) has no
   * `name`, but `POST /api/add-client` accepts one and the `Client` entity has it
   * — read it defensively, fall back to email/telephone. (Spec gap → ROADMAP.)
   */
  displayName(c: ClientDto): string {
    const raw = (c as Record<string, unknown>).name;
    const name = typeof raw === 'string' && raw ? raw : '';
    return name || c.email || c.telephone || '—';
  }

  /**
   * Badge for `ClientDto.etat` using the shared etat scheme (OFFRE_STATUS).
   * Client `etat` semantics are not further documented (spec gap → ROADMAP).
   */
  clientBadge(c: ClientDto): StatusBadge {
    if (!c.etat) {
      return { label: '—', class: 'badge-soft-secondary' };
    }
    return statusBadge(c.etat, OFFRE_STATUS);
  }

  // ---------------------------------------------------------------------------
  // Add / edit / delete
  // ---------------------------------------------------------------------------

  openAddModal(): void {
    const modalRef = this.modalService.open(ClientFormComponent, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.title = 'Add client';
    modalRef.result.then(
      () => this.loadClients(),
      () => undefined
    );
  }

  openEditModal(client: ClientDto): void {
    const modalRef = this.modalService.open(ClientFormComponent, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.client = client;
    modalRef.componentInstance.title = 'Edit client';
    modalRef.result.then(
      () => this.loadClients(),
      () => undefined
    );
  }

  askDelete(client: ClientDto, content: TemplateRef<unknown>): void {
    this.pendingDelete = client;
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
    this.clientService.deleteClient(id).subscribe({
      next: () => this.loadClients(),
      error: (err) => {
        this.errorMessage = apiErrorMessage(err) || 'Failed to delete client.';
      },
    });
  }
}