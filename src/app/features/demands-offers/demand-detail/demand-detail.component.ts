import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

import { Demande, DemandeDto } from '../../../core/models/demande.model';
import { StatusEnum } from '../../../core/models/common.model';
import { DemandeService } from '../../../core/services/demande.service';
import {
  DEMANDE_ETAT,
  DEMANDE_STATUS,
  StatusBadge,
  statusBadge,
} from '../../../core/constants/status-badges';
import { extractErrorMessage } from '../feature.helpers';

/**
 * Detail view type. The spec declares `GET /api/get-demande/{id}` → `Demande`
 * (entity WITHOUT a client relation). `DemandeDto.client` belongs to the same
 * resource (create / state-by-phone patch) and is intersected in optionally so
 * the template can render it when the backend embeds it — that is what powers
 * the "View offers for this client" link. Fields absent from the runtime
 * response simply render as `-`.
 */
export type DemandeDetailView = Demande & Partial<DemandeDto>;

/**
 * Demand detail — read-only fields + documented actions only (plan §5.4):
 * cancel (`DELETE /api/cancel-demande/{id}`), state change
 * (`PUT /api/update-EtatDemande/{etat}`), delete (`DELETE /api/delete-demande/{id}`).
 *
 * There is NO per-state timestamp/history endpoint in the spec, so instead of
 * an invented timeline the page shows a single status card (current etat +
 * deposit date). "Reassign" is not a documented concept (plan §5.4) — the
 * assignment note links to the offers list filtered by client phone.
 */
@Component({
    selector: 'app-demand-detail',
    templateUrl: './demand-detail.component.html',
    styleUrls: ['./demand-detail.component.scss'],
    standalone: false
})
export class DemandDetailComponent implements OnInit, OnDestroy {
  id = 0;
  demande: DemandeDetailView | null = null;
  loading = true;
  error = '';

  readonly etatOptions = DEMANDE_ETAT;
  readonly breadcrumb = [
    { label: 'Operations' },
    { label: 'Demands' },
    { label: 'Detail', active: true },
  ];

  private readonly sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private demandeService: DemandeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.route.paramMap.subscribe((params) => {
        this.id = Number(params.get('id'));
        this.load();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get title(): string {
    return this.translate.instant('demand.detail.title', { id: this.id });
  }

  /** Client phone when the backend embeds it — drives the offers deep-link. */
  get clientPhone(): string {
    return this.demande?.client?.telephone ?? '';
  }

  changeState(etat: StatusEnum): void {
    this.demandeService.updateEtat(this.id, etat).subscribe({
      next: () => {
        Swal.fire(
          this.translate.instant('demand.detail.updated'),
          this.translate.instant('demand.detail.updatedText', { id: this.id, etat }),
          'success'
        );
        this.load();
      },
      error: (err) =>
        Swal.fire(this.translate.instant('demand.detail.error'), extractErrorMessage(err), 'error'),
    });
  }

  confirmCancel(): void {
    Swal.fire({
      title: this.translate.instant('demand.detail.cancelDemandTitle'),
      text: this.translate.instant('demand.detail.cancelDemandText', { id: this.id }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('demand.detail.cancelDemand'),
      cancelButtonText: this.translate.instant('demand.detail.keep'),
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this.demandeService.cancelDemande(this.id).subscribe({
        next: () => {
          Swal.fire(
            this.translate.instant('demand.detail.cancelled'),
            this.translate.instant('demand.detail.cancelledText', { id: this.id }),
            'success'
          );
          this.load();
        },
        error: (err) =>
          Swal.fire(this.translate.instant('demand.detail.error'), extractErrorMessage(err), 'error'),
      });
    });
  }

  confirmDelete(): void {
    Swal.fire({
      title: this.translate.instant('demand.detail.deleteDemandTitle'),
      text: this.translate.instant('demand.detail.deleteDemandText', { id: this.id }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.delete'),
      cancelButtonText: this.translate.instant('demand.detail.keep'),
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this.demandeService.deleteDemande(this.id).subscribe({
        next: () => {
          Swal.fire(
            this.translate.instant('demand.detail.deleted'),
            this.translate.instant('demand.detail.deletedText', { id: this.id }),
            'success'
          );
          this.router.navigate(['/demands']);
        },
        error: (err) =>
          Swal.fire(this.translate.instant('demand.detail.error'), extractErrorMessage(err), 'error'),
      });
    });
  }

  /** Status badge via the shared scheme (plan §7). */
  badge(etat?: StatusEnum): StatusBadge {
    if (!etat) {
      return { label: this.translate.instant('dashboard.unknown'), class: 'badge-soft-secondary' };
    }
    return statusBadge(etat, DEMANDE_STATUS);
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.demandeService.getDemandeById(this.id).subscribe({
      next: (demande) => {
        this.demande = demande;
        this.loading = false;
      },
      error: (err) => {
        this.demande = null;
        this.loading = false;
        this.error = extractErrorMessage(err);
      },
    });
  }
}
