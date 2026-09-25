import { Component, OnInit, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgbModal, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

import { ClientDto } from '../../../core/models/client.model';
import { OffreDto, OffreHistoryPageDto } from '../../../core/models/offre.model';
import { ClientService } from '../../../core/services/client.service';
import { OFFRE_STATUS, StatusBadge, statusBadge } from '../../../core/constants/status-badges';
import { apiErrorMessage } from '../clients.constants';
import { ClientFormComponent } from '../client-form/client-form.component';
import { PagetitleComponent } from '../../../shared/ui/pagetitle/pagetitle.component';
import { NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Client detail (plan §5.3) — route `clients/:id`, mounted under the lazy
 * `clients` route (see clients-routing.module.ts).
 *
 * Profile card (ClientDto) + edit modal (PUT /api/update-client/{id}) + delete;
 * ride-history tab backed by GET /api/history-traffic-client/{phone}/page
 * (`OffreHistoryPageDto`, 1-based `page`/`limit` paging).
 */
@Component({
    selector: 'app-client-detail',
    templateUrl: './client-detail.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PagetitleComponent, RouterLink, NgClass, FormsModule, NgbPagination, DatePipe, TranslatePipe]
})
export class ClientDetailComponent implements OnInit {
  clientId: number | null = null;
  client: ClientDto | null = null;
  loading = true;
  loadError = '';
  deleting = false;

  pageTitle = 'Client';
  breadcrumbItems: { label: string; active: boolean }[] = [
    { label: 'Clients', active: false },
    { label: '#', active: true },
  ];

  activeTab = 'overview';

  // Ride history (items are `OffreDto`s; etat badge via OFFRE_STATUS)
  history: OffreDto[] = [];
  historyTotal = 0;
  historyPage = 1;
  historyLimit = 10;
  historyLoading = false;
  historyError = '';
  historyLimits = [10, 20, 50];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private clientService: ClientService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.clientId = Number(id);
    this.pageTitle = this.translate.instant('client.detail.pageTitle', { id });
    this.breadcrumbItems = [
      { label: 'Clients', active: false },
      { label: this.translate.instant('client.detail.breadcrumbHash', { id }), active: true },
    ];
    this.loadClient();
  }

  // --------------------------------------------------------------------------
  // Profile
  // --------------------------------------------------------------------------

  private loadClient(): void {
    if (this.clientId === null || Number.isNaN(this.clientId)) {
      this.loadError = this.translate.instant('client.detail.invalidId');
      this.loading = false;
      return;
    }
    this.loading = true;
    this.loadError = '';
    this.clientService.getClientById(this.clientId).subscribe({
      next: (client) => {
        this.client = client ?? null;
        this.loading = false;
        if (client?.telephone) {
          this.loadHistory();
        }
      },
      error: (err) => {
        this.loading = false;
        this.loadError = apiErrorMessage(err) || this.translate.instant('client.detail.loadFailed', { id: this.clientId });
      },
    });
  }

  /** Display name — see note in clients-list.component.ts (ClientDto has no `name`). */
  clientName(): string {
    if (!this.client) {
      return '—';
    }
    const raw = (this.client as Record<string, unknown>).name;
    const name = typeof raw === 'string' && raw ? raw : '';
    return name || this.client.email || this.client.telephone || '—';
  }

  clientBadge(): StatusBadge {
    if (!this.client?.etat) {
      return { label: '—', class: 'badge-soft-secondary' };
    }
    return statusBadge(this.client.etat, OFFRE_STATUS);
  }

  /** "lat, lng" for the current GPS position, or '—'. */
  coordinatesLabel(): string {
    const lat = this.client?.latitude;
    const lng = this.client?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `${lat}, ${lng}`;
    }
    return typeof lat === 'number' ? `${lat}` : '—';
  }

  /** "lat, lng" for the destination position, or '—'. */
  destinationCoordinatesLabel(): string {
    const lat = this.client?.destLatitude;
    const lng = this.client?.destLongitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `${lat}, ${lng}`;
    }
    return typeof lat === 'number' ? `${lat}` : '—';
  }

  openEditModal(): void {
    if (!this.client) {
      return;
    }
    const modalRef = this.modalService.open(ClientFormComponent, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.client = this.client;
    modalRef.componentInstance.title = this.translate.instant('clients.form.titleEdit');
    modalRef.result.then(
      () => this.loadClient(),
      () => undefined
    );
  }

  askDelete(content: TemplateRef<unknown>): void {
    this.modalService.open(content, { centered: true }).result.then(
      (result) => {
        if (result === 'confirm') {
          this.deleteClient();
        }
      },
      () => undefined
    );
  }

  private deleteClient(): void {
    if (this.clientId === null || Number.isNaN(this.clientId)) {
      return;
    }
    this.deleting = true;
    this.clientService.deleteClient(this.clientId).subscribe({
      next: () => {
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.deleting = false;
        this.loadError = apiErrorMessage(err) || this.translate.instant('client.detail.deleteFailed');
      },
    });
  }

  // --------------------------------------------------------------------------
  // Ride history
  // --------------------------------------------------------------------------

  loadHistory(): void {
    if (!this.client?.telephone) {
      return;
    }
    this.historyLoading = true;
    this.historyError = '';
    this.clientService
      .getRideHistory(this.client.telephone, this.historyPage, this.historyLimit)
      .subscribe({
        next: (page: OffreHistoryPageDto) => {
          this.history = page?.items ?? [];
          this.historyTotal = page?.total ?? 0;
          this.historyLoading = false;
        },
        error: (err) => {
          this.historyLoading = false;
          this.historyError = apiErrorMessage(err) || this.translate.instant('client.detail.historyLoadFailed');
        },
      });
  }

  historyPageChange(page: number): void {
    this.historyPage = page;
    this.loadHistory();
  }

  historyLimitChange(limit: number): void {
    this.historyLimit = limit;
    this.historyPage = 1;
    this.loadHistory();
  }

  offerBadge(etat: OffreDto['etat']): StatusBadge {
    if (!etat) {
      return { label: '—', class: 'badge-soft-secondary' };
    }
    return statusBadge(etat, OFFRE_STATUS);
  }

  /** `total_price` is a string per spec; fall back to `realPrice` (double). */
  offerPrice(item: OffreDto): string {
    if (item.total_price) {
      return item.total_price;
    }
    return item.realPrice !== undefined && item.realPrice !== null
      ? String(item.realPrice)
      : '—';
  }
}