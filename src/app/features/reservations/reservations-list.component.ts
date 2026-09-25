import {
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChildren,
  ChangeDetectionStrategy
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';

import { ReservationService } from '../../core/services/reservation.service';
import {
  ReservationResponse,
  PageReservationResponse,
} from '../../core/models/reservation.model';
import {
  AssignmentStatus,
  ReservationSource,
  ReservationStatus,
} from '../../core/models/common.model';
import {
  ASSIGNMENT_STATUS,
  RESERVATION_STATUS,
  SOURCE_LABEL,
  statusBadge,
} from '../../core/constants/status-badges';
import {
  NgbdSortableHeader,
  SortDirection,
  SortEvent,
} from '../../core/directives/sortable.directive';
import { matches } from '../../core/utils/table-state';

/** Table pipeline state (salvaged pattern: BehaviorSubject + switchMap + State). */
interface ReservationsListState {
  /** '' = all statuses */
  status?: ReservationStatus;
  /** Client-side free-text term, applied to the loaded server page. */
  searchTerm: string;
  /** 1-based (UI/pagination); converted to 0-based for the API. */
  page: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: SortDirection;
}

const DEFAULT_STATE: ReservationsListState = {
  status: undefined,
  searchTerm: '',
  page: 1,
  pageSize: 10,
  sortColumn: '',
  sortDirection: '',
};

@Component({
    selector: 'app-reservations-list',
    templateUrl: './reservations-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ReservationsListComponent implements OnInit, OnDestroy {
  readonly title = 'Reservations';
  readonly breadcrumbItems = [
    { label: 'Operations' },
    { label: 'Reservations', active: true },
  ];

  /** All reservation status values for the filter select (keys of the badge map). */
  readonly statuses: ReservationStatus[] = Object.keys(
    RESERVATION_STATUS
  ) as ReservationStatus[];

  statusFilter = '';
  searchTerm = '';
  page = 1;
  pageSize = 10;
  collectionSize = 0;
  reservations: ReservationResponse[] = [];
  loading = false;
  error = '';

  /** Row currently targeted by the assign/unassign modals. */
  selectedReservation?: ReservationResponse;

  assignForm!: UntypedFormGroup;
  assignSubmitted = false;
  assigning = false;

  unassignForm!: UntypedFormGroup;
  unassignSubmitted = false;
  unassigning = false;

  @ViewChildren(NgbdSortableHeader) headers?: QueryList<NgbdSortableHeader>;

  private readonly state$ = new BehaviorSubject<ReservationsListState>(
    DEFAULT_STATE
  );
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly reservationService: ReservationService,
    private readonly modalService: NgbModal,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly formBuilder: UntypedFormBuilder,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.state$
      .pipe(
        debounceTime(200),
        switchMap((state) => this.fetchPage(state)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (page) => this.applyPage(page),
        error: () => {
          this.loading = false;
          this.error = this.translate.instant('reservations.list.loadFailed');
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------------------------
  // Table pipeline
  // -------------------------------------------------------------------------

  private fetchPage(
    state: ReservationsListState
  ): Observable<PageReservationResponse> {
    this.loading = true;
    this.error = '';
    return this.reservationService.searchReservations({
      status: state.status,
      page: state.page - 1,
      size: state.pageSize,
      sort:
        state.sortColumn && state.sortDirection
          ? `${state.sortColumn},${state.sortDirection}`
          : undefined,
    });
  }

  private applyPage(page: PageReservationResponse): void {
    const content = page.content ?? [];
    const term = this.state$.value.searchTerm.trim().toLowerCase();
    // Free-text search is applied client-side to the current server page: the
    // list endpoint documents no search query param (ROADMAP: server-side q).
    this.reservations = term
      ? content.filter((row) => this.matchesSearch(row, term))
      : content;
    this.collectionSize = page.totalElements ?? 0;
    this.loading = false;
  }

  private matchesSearch(row: ReservationResponse, term: string): boolean {
    return (
      matches(row.id, term) ||
      matches(row.telephone, term) ||
      matches(row.pickup, term) ||
      matches(row.destination, term) ||
      matches(row.commentaire, term) ||
      matches(row.status, term) ||
      matches(row.source, term) ||
      matches(row.assignment?.taxiNom, term) ||
      matches(row.assignment?.taxiTelephone, term) ||
      matches(row.assignment?.taxiNumero, term) ||
      matches(row.assignment?.taxiMatricule, term)
    );
  }

  private patchState(patch: Partial<ReservationsListState>): void {
    this.state$.next({ ...this.state$.value, ...patch });
  }

  /** Re-issue the current search state (used by the Refresh button). */
  refresh(): void {
    this.state$.next({ ...this.state$.value });
  }

  // -------------------------------------------------------------------------
  // Filter / sort / paginate handlers
  // -------------------------------------------------------------------------

  onStatusChange(status: string): void {
    this.patchState({ status: (status as ReservationStatus) || undefined, page: 1 });
  }

  onSearchChange(term: string): void {
    this.patchState({ searchTerm: term });
  }

  onPageChange(newPage: number): void {
    this.patchState({ page: newPage });
  }

  onSortChange(event: SortEvent): void {
    const { column, direction } = event;
    this.headers?.forEach((header) => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });
    this.patchState({
      page: 1,
      sortColumn: column,
      sortDirection: direction,
    });
  }

  // -------------------------------------------------------------------------
  // Badge / label helpers
  // -------------------------------------------------------------------------

  statusBadgeClass(status?: ReservationStatus): string {
    return status ? statusBadge(status, RESERVATION_STATUS).class : 'badge-soft-secondary';
  }

  assignmentBadgeClass(status?: AssignmentStatus): string {
    return status ? statusBadge(status, ASSIGNMENT_STATUS).class : 'badge-soft-secondary';
  }

  sourceLabel(source?: ReservationSource): string {
    return source ? (SOURCE_LABEL[source] ?? source) : '—';
  }

  canUnassign(reservation: ReservationResponse): boolean {
    const status = reservation.assignment?.status;
    return (
      !!status && status !== 'CANCELLED' && status !== 'COMPLETED' && status !== 'EXPIRED'
    );
  }

  // -------------------------------------------------------------------------
  // Row actions
  // -------------------------------------------------------------------------

  viewReservation(reservation: ReservationResponse): void {
    this.router.navigate([reservation.id], { relativeTo: this.route });
  }

  // --- Assign modal --------------------------------------------------------

  openAssignModal(content: TemplateRef<unknown>, reservation: ReservationResponse): void {
    this.selectedReservation = reservation;
    this.assignSubmitted = false;
    this.assignForm = this.formBuilder.group({
      taxiId: ['', [Validators.required, Validators.min(1)]],
      assignmentType: ['MANUAL', [Validators.required]],
      assignedBy: [''],
      comment: [''],
    });
    this.modalService.open(content, { centered: true, backdrop: 'static' });
  }

  get af() {
    return this.assignForm.controls;
  }

  submitAssign(modal: { close: () => void }): void {
    this.assignSubmitted = true;
    if (this.assignForm.invalid || !this.selectedReservation?.id) {
      return;
    }
    this.assigning = true;
    const value = this.assignForm.value;
    this.reservationService
      .assignTaxi(this.selectedReservation.id, {
        taxiId: Number(value.taxiId),
        assignmentType: value.assignmentType,
        assignedBy: value.assignedBy?.trim() || undefined,
        comment: value.comment?.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.assigning = false;
          modal.close();
          this.refresh();
        },
        error: () => {
          this.assigning = false;
          this.error = this.translate.instant('reservations.list.assignFailed');
        },
      });
  }

  // --- Unassign modal ------------------------------------------------------

  openUnassignModal(content: TemplateRef<unknown>, reservation: ReservationResponse): void {
    this.selectedReservation = reservation;
    this.unassignSubmitted = false;
    this.unassignForm = this.formBuilder.group({
      cancelledBy: [''],
      reason: [''],
    });
    this.modalService.open(content, { centered: true, backdrop: 'static' });
  }

  get uf() {
    return this.unassignForm.controls;
  }

  confirmUnassign(modal: { close: () => void }): void {
    this.unassignSubmitted = true;
    if (!this.selectedReservation?.id) {
      return;
    }
    this.unassigning = true;
    const value = this.unassignForm.value;
    this.reservationService
      .unassignTaxi(
        this.selectedReservation.id,
        value.cancelledBy?.trim() || undefined,
        value.reason?.trim() || undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.unassigning = false;
          modal.close();
          this.refresh();
        },
        error: () => {
          this.unassigning = false;
          this.error = this.translate.instant('reservations.list.unassignFailed');
        },
      });
  }
}