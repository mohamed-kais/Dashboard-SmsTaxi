import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { ReservationService } from '../../core/services/reservation.service';
import { ReservationResponse } from '../../core/models/reservation.model';
import {
  AssignmentStatus,
  AssignmentType,
  ReservationSource,
  ReservationStatus,
} from '../../core/models/common.model';
import {
  ASSIGNMENT_STATUS,
  RESERVATION_STATUS,
  SOURCE_LABEL,
  statusBadge,
} from '../../core/constants/status-badges';

@Component({
    selector: 'app-reservation-detail',
    templateUrl: './reservation-detail.component.html',
    standalone: false
})
export class ReservationDetailComponent implements OnInit, OnDestroy {
  readonly title = 'Reservation detail';
  readonly breadcrumbItems = [
    { label: 'Operations' },
    { label: 'Reservations', active: true },
  ];

  reservation?: ReservationResponse;
  loading = true;
  error = '';
  notFound = false;

  assignForm!: UntypedFormGroup;
  assignSubmitted = false;
  assigning = false;

  unassignForm!: UntypedFormGroup;
  unassigning = false;

  updateForm!: UntypedFormGroup;
  updateSubmitted = false;
  updating = false;

  private readonly id$ = new Subject<number>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly reservationService: ReservationService,
    private readonly modalService: NgbModal,
    private readonly formBuilder: UntypedFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Subscribe to the load pipeline FIRST: route.paramMap replays its current
    // value synchronously on subscribe, so the initial id must have a consumer.
    this.id$
      .pipe(
        switchMap((id) => {
          this.loading = true;
          this.error = '';
          this.notFound = false;
          return this.reservationService.getById(id);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (reservation) => {
          this.loading = false;
          this.reservation = reservation;
        },
        error: (err: unknown) => {
          this.loading = false;
          this.notFound = true;
          this.error =
            typeof err === 'string' ? err : this.translate.instant('reservation.detail.loadFailed');
        },
      });

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = Number(params.get('id'));
        if (Number.isFinite(id)) {
          this.id$.next(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------------------------
  // Badge / label helpers
  // -------------------------------------------------------------------------

  statusBadgeClass(status?: ReservationStatus): string {
    return status ? statusBadge(status, RESERVATION_STATUS).class : 'badge-soft-secondary';
  }

  assignmentBadgeClass(status?: AssignmentStatus): string {
    // mapped via the assignment badge scheme (ASSIGNMENT_STATUS)
    return status ? statusBadge(status, ASSIGNMENT_STATUS).class : 'badge-soft-secondary';
  }

  sourceLabel(source?: ReservationSource): string {
    return source ? (SOURCE_LABEL[source] ?? source) : '—';
  }

  hasActiveAssignment(): boolean {
    const status = this.reservation?.assignment?.status;
    return !!status && status !== 'CANCELLED' && status !== 'COMPLETED' && status !== 'EXPIRED';
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  // -------------------------------------------------------------------------
  // Assign taxi
  // -------------------------------------------------------------------------

  openAssignModal(content: TemplateRef<unknown>): void {
    this.assignSubmitted = false;
    this.assignForm = this.formBuilder.group({
      taxiId: ['', [Validators.required, Validators.min(1)]],
      assignmentType: ['MANUAL' as AssignmentType, [Validators.required]],
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
    if (this.assignForm.invalid || !this.reservation?.id) {
      return;
    }
    this.assigning = true;
    const value = this.assignForm.value;
    this.reservationService
      .assignTaxi(this.reservation.id, {
        taxiId: Number(value.taxiId),
        assignmentType: value.assignmentType,
        assignedBy: value.assignedBy?.trim() || undefined,
        comment: value.comment?.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.assigning = false;
          this.reservation = reservation;
          modal.close();
        },
        error: (err: unknown) => {
          this.assigning = false;
          this.error = typeof err === 'string' ? err : this.translate.instant('reservation.detail.assignFailed');
        },
      });
  }

  // -------------------------------------------------------------------------
  // Unassign taxi
  // -------------------------------------------------------------------------

  openUnassignModal(content: TemplateRef<unknown>): void {
    this.unassignForm = this.formBuilder.group({
      cancelledBy: [''],
      reason: [''],
    });
    this.modalService.open(content, { centered: true, backdrop: 'static' });
  }

  confirmUnassign(modal: { close: () => void }): void {
    if (!this.reservation?.id) {
      return;
    }
    this.unassigning = true;
    const value = this.unassignForm.value;
    this.reservationService
      .unassignTaxi(
        this.reservation.id,
        value.cancelledBy?.trim() || undefined,
        value.reason?.trim() || undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.unassigning = false;
          this.reservation = reservation;
          modal.close();
        },
        error: (err: unknown) => {
          this.unassigning = false;
          this.error = typeof err === 'string' ? err : this.translate.instant('reservation.detail.unassignFailed');
        },
      });
  }

  // -------------------------------------------------------------------------
  // Update reservation (UpdateReservationRequest fields)
  // -------------------------------------------------------------------------

  openUpdateModal(content: TemplateRef<unknown>): void {
    const r = this.reservation;
    this.updateSubmitted = false;
    this.updateForm = this.formBuilder.group({
      telephone: [r?.telephone ?? '', []],
      pickup: [r?.pickup ?? '', []],
      destination: [r?.destination ?? '', []],
      reservationDateTime: [this.toLocalInput(r?.reservationDateTime), []],
      commentaire: [r?.commentaire ?? '', []],
      finalPrice: [r?.finalPrice ?? '', []],
    });
    this.modalService.open(content, { centered: true, size: 'lg', backdrop: 'static' });
  }

  get uf() {
    return this.updateForm.controls;
  }

  submitUpdate(modal: { close: () => void }): void {
    this.updateSubmitted = true;
    if (this.updateForm.invalid || !this.reservation?.id) {
      return;
    }
    this.updating = true;
    const value = this.updateForm.value;
    const dto = {
      telephone: value.telephone?.trim() || undefined,
      pickup: value.pickup?.trim() || undefined,
      destination: value.destination?.trim() || undefined,
      reservationDateTime: value.reservationDateTime
        ? this.toIso(value.reservationDateTime)
        : undefined,
      commentaire: value.commentaire?.trim() || undefined,
      finalPrice:
        value.finalPrice !== '' && value.finalPrice !== null && value.finalPrice !== undefined
          ? Number(value.finalPrice)
          : undefined,
    };
    this.reservationService
      .update(this.reservation.id, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.updating = false;
          this.reservation = reservation;
          modal.close();
        },
        error: (err: unknown) => {
          this.updating = false;
          this.error = typeof err === 'string' ? err : this.translate.instant('reservation.detail.updateFailed');
        },
      });
  }

  // -------------------------------------------------------------------------
  // Helpers: datetime-local <-> ISO
  // -------------------------------------------------------------------------

  private toLocalInput(value?: string): string {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }

  private toIso(local: string): string {
    return local ? new Date(local).toISOString() : '';
  }
}