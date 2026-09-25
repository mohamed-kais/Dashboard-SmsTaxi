import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import {
  OFFRE_STATUS,
  StatusBadge,
  TAXI_STATUS,
  statusBadge,
} from '../../../core/constants/status-badges';
import { StatusEnum } from '../../../core/models/common.model';
import {
  GetAllTaxisCriteriaResponse,
  NotificationChannel,
  NotificationClientRow,
  NotificationTaxiRow,
  NotificationType,
  PageNotificationClientDto,
  SendNotificationRequest,
} from '../../../core/models/notification.model';
import {
  ClientsCriteriaQuery,
  NotificationService,
  TaxisCriteriaQuery,
} from '../../../core/services/notification.service';
import { apiErrorMessage } from '../notifications.constants';

/** Recipient tab — maps 1:1 to the send `targetType` (`ADMIN` has no table). */
type RecipientTab = 'TAXI' | 'CLIENT' | 'ADMIN';
/** Tabs backed by a server-side picker. */
type PickerTab = 'TAXI' | 'CLIENT';

/** Minimal selection contract shared by both pickers (template helpers). */
interface SelectionState {
  selectedIds: Set<number>;
  selectAll: boolean;
}

/** Local per-tab picker state (server-side paging + search + selection). */
interface PickerState<T> extends SelectionState {
  rows: T[];
  loading: boolean;
  error: string;
  /** 1-based page (template); the API query is 0-based. */
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  searchTerm: string;
  loaded: boolean;
}

function createPickerState<T>(pageSize = 10): PickerState<T> {
  return {
    rows: [],
    loading: false,
    error: '',
    page: 1,
    pageSize,
    totalRecords: 0,
    totalPages: 1,
    searchTerm: '',
    selectedIds: new Set<number>(),
    selectAll: false,
    loaded: false,
  };
}

/**
 * Send notification — two-step wizard (route `notifications/send`).
 *
 * Step 1 "Contenu": title / channel / type / message + a live phone preview.
 * Step 2 "Destinataires": Taxis / Clients picker tabs (server-side paging +
 * search over the NOTIFICATION domain `get-all-*-criteria` endpoints) and a
 * "Tableau de bord" tab that targets every administrator (`['ALL']`).
 *
 * Send goes through `NotificationService.send()`
 * (`POST /api/notifications/send`); "Sélectionner tout" (and always the ADMIN
 * tab) sends `targetIds: ['ALL']`, otherwise the selected row ids as strings.
 */
@Component({
    selector: 'app-notification-send',
    templateUrl: './notification-send.component.html',
    styleUrls: ['./notification-send.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NotificationSendComponent implements OnInit, OnDestroy {
  breadCrumbItems: { label: string; active: boolean }[] = [
    { label: 'Notifications', active: false },
    { label: 'Envoyer une notification', active: true },
  ];

  /** 1 = Contenu, 2 = Destinataires. */
  step: 1 | 2 = 1;
  /** Set once "Suivant" is pressed on an invalid form (drives error display). */
  step1Submitted = false;
  form!: FormGroup;

  /** Live clock for the preview phone head (`HH:mm`, refreshed every 30s). */
  now = new Date();
  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private readonly destroy$ = new Subject<void>();

  /** Channel select — value↔label mapping (backend enum uses PUSH). */
  readonly channels: { value: NotificationChannel; label: string }[] = [
    { value: 'PUSH', label: 'Diffusion APP' },
    { value: 'WHATSAPP', label: 'WHATSAPP' },
    { value: 'SMS', label: 'SMS' },
  ];
  readonly types: NotificationType[] = ['INFO', 'WARNING', 'ERROR'];

  // -------------------------------------------------------------------------
  // Step 2 — recipient pickers
  // -------------------------------------------------------------------------

  activeTab: RecipientTab = 'TAXI';
  taxis: PickerState<NotificationTaxiRow> = createPickerState<NotificationTaxiRow>();
  clients: PickerState<NotificationClientRow> = createPickerState<NotificationClientRow>();
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly pageSizes = [10, 25, 50, 100];

  sending = false;
  sendError = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly notificationService: NotificationService,
    private readonly translate: TranslateService
  ) {}

  get f(): FormGroup['controls'] {
    return this.form.controls;
  }

  /** Raw form values for the live preview (empty-safe). */
  get titleValue(): string {
    return String(this.f.title.value ?? '');
  }

  get messageValue(): string {
    return String(this.f.message.value ?? '');
  }

  get typeValue(): NotificationType {
    return this.f.type.value as NotificationType;
  }

  get channelValue(): NotificationChannel {
    return this.f.channel.value as NotificationChannel;
  }

  /** Picker state of the active non-ADMIN tab (toolbar + pagination bindings). */
  get activePicker(): PickerState<NotificationTaxiRow> | PickerState<NotificationClientRow> {
    return this.activeTab === 'CLIENT' ? this.clients : this.taxis;
  }

  /** "Envoyer" is enabled on ADMIN always, else only with a selection. */
  get canSend(): boolean {
    if (this.activeTab === 'ADMIN') {
      return true;
    }
    const st = this.activeTab === 'TAXI' ? this.taxis : this.clients;
    return st.selectAll || st.selectedIds.size > 0;
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      title: ['', [Validators.required]],
      message: ['', [Validators.required]],
      channel: ['PUSH' as NotificationChannel, [Validators.required]],
      type: ['INFO' as NotificationType, [Validators.required]],
    });

    this.clockTimer = setInterval(() => {
      this.now = new Date();
    }, 30_000);

    // One debounced search box drives the active tab's picker (digits → phone
    // param, anything else → name param; page resets to 0 server-side).
    this.searchControl.valueChanges
      .pipe(debounceTime(350), takeUntil(this.destroy$))
      .subscribe((term) => {
        const tab = this.activeTab;
        if (tab === 'ADMIN') {
          return;
        }
        const st = tab === 'TAXI' ? this.taxis : this.clients;
        st.searchTerm = term.trim();
        st.page = 1;
        this.loadPicker(tab);
      });

    // Eagerly load the default tab so step 2 opens instantly.
    this.loadPicker('TAXI');
  }

  ngOnDestroy(): void {
    if (this.clockTimer !== null) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------------------------
  // Stepper navigation
  // -------------------------------------------------------------------------

  /** "Suivant" — stay on step 1 with errors, else advance (lazy-loads tab). */
  goToStep2(): void {
    if (this.form.invalid) {
      this.step1Submitted = true;
      this.form.markAllAsTouched();
      return;
    }
    this.step = 2;
    const tab = this.activeTab;
    if (tab === 'ADMIN') {
      return;
    }
    const st = tab === 'TAXI' ? this.taxis : this.clients;
    if (!st.loaded && !st.loading) {
      this.loadPicker(tab);
    }
  }

  /** "Retour" — back to step 1, form values and selections preserved. */
  goToStep1(): void {
    this.step = 1;
    this.sendError = '';
  }

  /** Tab switch — restores that tab's search term, lazy-loads on first visit. */
  setTab(tab: RecipientTab): void {
    this.activeTab = tab;
    this.sendError = '';
    if (tab === 'ADMIN') {
      return;
    }
    const st = tab === 'TAXI' ? this.taxis : this.clients;
    this.searchControl.setValue(st.searchTerm, { emitEvent: false });
    if (!st.loaded && !st.loading) {
      this.loadPicker(tab);
    }
  }

  // -------------------------------------------------------------------------
  // Picker data pipeline (switchMap/takeUntil style, cf. taxis-list)
  // -------------------------------------------------------------------------

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  onPageChange(page: number): void {
    const tab = this.activeTab;
    if (tab === 'ADMIN') {
      return;
    }
    const st = tab === 'TAXI' ? this.taxis : this.clients;
    st.page = page;
    this.loadPicker(tab);
  }

  onPageSizeChange(raw: string): void {
    const tab = this.activeTab;
    if (tab === 'ADMIN') {
      return;
    }
    const st = tab === 'TAXI' ? this.taxis : this.clients;
    st.pageSize = Number(raw) || 10;
    st.page = 1;
    this.loadPicker(tab);
  }

  totalPagesOf(st: { totalRecords: number; pageSize: number }): number {
    return Math.max(1, Math.ceil(st.totalRecords / st.pageSize));
  }

  private loadPicker(tab: PickerTab): void {
    if (tab === 'TAXI') {
      this.loadTaxis();
    } else {
      this.loadClients();
    }
  }

  private loadTaxis(): void {
    const st = this.taxis;
    st.loading = true;
    st.error = '';
    const query: TaxisCriteriaQuery = { page: st.page - 1, size: st.pageSize };
    if (st.searchTerm) {
      if (/^\d+$/.test(st.searchTerm)) {
        query.phone = st.searchTerm;
      } else {
        query.name = st.searchTerm;
      }
    }
    this.notificationService
      .getTaxisCriteria(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: GetAllTaxisCriteriaResponse) => {
          const page = resp?.taxis;
          st.rows = page?.content ?? [];
          st.totalRecords = page?.totalElements ?? st.rows.length;
          st.totalPages = page?.totalPages ?? 1;
          st.loading = false;
          st.loaded = true;
        },
        error: (err: unknown) => {
          st.rows = [];
          st.totalRecords = 0;
          st.totalPages = 1;
          st.loading = false;
          st.error = apiErrorMessage(err) || this.translate.instant('sendNotif.step2.loadTaxisError');
        },
      });
  }

  private loadClients(): void {
    const st = this.clients;
    st.loading = true;
    st.error = '';
    const query: ClientsCriteriaQuery = { page: st.page - 1, size: st.pageSize };
    if (st.searchTerm) {
      if (/^\d+$/.test(st.searchTerm)) {
        query.phone = st.searchTerm;
      } else {
        query.name = st.searchTerm;
      }
    }
    this.notificationService
      .getClientsCriteria(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: PageNotificationClientDto) => {
          st.rows = resp?.content ?? [];
          st.totalRecords = resp?.totalElements ?? st.rows.length;
          st.totalPages = resp?.totalPages ?? 1;
          st.loading = false;
          st.loaded = true;
        },
        error: (err: unknown) => {
          st.rows = [];
          st.totalRecords = 0;
          st.totalPages = 1;
          st.loading = false;
          st.error = apiErrorMessage(err) || this.translate.instant('sendNotif.step2.loadClientsError');
        },
      });
  }

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  isSelected(st: SelectionState, id: number): boolean {
    return st.selectAll || st.selectedIds.has(id);
  }

  toggleRow(st: SelectionState, id: number): void {
    if (st.selectAll) {
      return;
    }
    if (st.selectedIds.has(id)) {
      st.selectedIds.delete(id);
    } else {
      st.selectedIds.add(id);
    }
  }

  toggleSelectAll(st: SelectionState): void {
    st.selectAll = !st.selectAll;
    st.selectedIds.clear();
  }

  /** Users-icon badge under the toolbar (exact French copy per tab). */
  selectionLabel(): string {
    if (this.activeTab === 'ADMIN') {
      return this.translate.instant('sendNotif.adminAllSelected');
    }
    if (this.activeTab === 'TAXI') {
      if (this.taxis.selectAll) {
        return this.translate.instant('sendNotif.taxisAllSelected');
      }
      const n = this.taxis.selectedIds.size;
      return n === 0
        ? this.translate.instant('sendNotif.taxisNoneSelected')
        : this.translate.instant('sendNotif.taxisCountSelected', { count: n });
    }
    if (this.clients.selectAll) {
      return this.translate.instant('sendNotif.clientsAllSelected');
    }
    const n = this.clients.selectedIds.size;
    return n === 0
      ? this.translate.instant('sendNotif.clientsNoneSelected')
      : this.translate.instant('sendNotif.clientsCountSelected', { count: n });
  }

  trackById(_index: number, row: { id: number }): number {
    return row.id;
  }

  // -------------------------------------------------------------------------
  // Display helpers (badges / icons / labels)
  // -------------------------------------------------------------------------

  /** Taxi `taxiStatus` badge via the shared TAXI_STATUS scheme. */
  taxiBadge(status?: NotificationTaxiRow['taxiStatus']): StatusBadge {
    return status
      ? statusBadge(status, TAXI_STATUS)
      : { label: '—', class: 'badge-soft-secondary' };
  }

  /** Client `etat` badge via the shared OFFRE_STATUS scheme (cf. clients-list). */
  clientBadge(row: NotificationClientRow): StatusBadge {
    if (!row.etat) {
      return { label: '—', class: 'badge-soft-secondary' };
    }
    return statusBadge(row.etat as StatusEnum, OFFRE_STATUS);
  }

  /** Backend enum value → display label (PUSH renders as "Diffusion APP"). */
  channelLabel(channel: NotificationChannel): string {
    switch (channel) {
      case 'WHATSAPP':
        return 'WHATSAPP';
      case 'SMS':
        return 'SMS';
      default:
        return this.translate.instant('sendNotif.channelApp');
    }
  }

  /** Channel glyph (FontAwesome 5 bundle — `fab` brands are included). */
  channelIcon(channel: NotificationChannel): string {
    switch (channel) {
      case 'WHATSAPP':
        return 'fab fa-whatsapp';
      case 'SMS':
        return 'fas fa-sms';
      default:
        return 'fas fa-bell';
    }
  }

  /** Severity glyph tinted by the `type-icon--*` SCSS modifiers. */
  typeIcon(type: NotificationType): string {
    switch (type) {
      case 'WARNING':
        return 'fas fa-exclamation-triangle';
      case 'ERROR':
        return 'fas fa-exclamation-circle';
      default:
        return 'fas fa-info-circle';
    }
  }

  // -------------------------------------------------------------------------
  // Send
  // -------------------------------------------------------------------------

  send(): void {
    if (!this.canSend || this.sending) {
      return;
    }
    const tab = this.activeTab;
    const st = tab === 'TAXI' ? this.taxis : tab === 'CLIENT' ? this.clients : null;
    const targetIds: string[] =
      tab === 'ADMIN' || !st
        ? ['ALL']
        : st.selectAll
          ? ['ALL']
          : [...st.selectedIds].map((id) => String(id));
    if (!targetIds.length) {
      this.sendError = this.translate.instant('sendNotif.noRecipientSelected');
      return;
    }

    const request: SendNotificationRequest = {
      title: this.titleValue.trim(),
      message: this.messageValue.trim(),
      type: this.typeValue,
      channel: this.channelValue,
      targetType: tab,
      targetIds,
    };
    this.sending = true;
    this.sendError = '';
    this.notificationService.send(request).subscribe({
      next: (res) => {
        this.sending = false;
        const detail = typeof res === 'string' ? res.trim() : '';
        Swal.fire(this.translate.instant('sendNotif.sendSuccess'), detail, 'success');
        this.resetAfterSuccess();
      },
      error: (err: unknown) => {
        this.sending = false;
        this.sendError = apiErrorMessage(err) || this.translate.instant('sendNotif.sendError');
      },
    });
  }

  /** Success reset — defaults, step 1, selections + select-all flags cleared. */
  private resetAfterSuccess(): void {
    this.form.reset({ title: '', message: '', channel: 'PUSH', type: 'INFO' });
    this.step1Submitted = false;
    this.step = 1;
    this.activeTab = 'TAXI';
    this.searchControl.setValue('', { emitEvent: false });
    this.taxis = createPickerState<NotificationTaxiRow>();
    this.clients = createPickerState<NotificationClientRow>();
    this.sendError = '';
  }
}
