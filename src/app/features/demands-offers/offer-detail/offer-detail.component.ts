import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

import { OffreDto } from '../../../core/models/offre.model';
import { StatusEnum } from '../../../core/models/common.model';
import { OfferRouteTextPatchRequest, OffreService } from '../../../core/services/offre.service';
import {
  OFFRE_ETAT,
  OFFRE_STATUS,
  StatusBadge,
  statusBadge,
} from '../../../core/constants/status-badges';
import { extractErrorMessage } from '../feature.helpers';

/**
 * Offer detail — read-only fields + documented actions only (plan §5.4):
 * - state change via `PATCH /api/update-state-offer/{id}/{offerStatusEnum}`
 *   (no body — the most unambiguous of the five documented state endpoints),
 * - cancel via `DELETE /api/cancel-offer/{id}`,
 * - delete via `DELETE /api/delete-Offre/{id}`,
 * - route labels via `PATCH /api/offers/{offreId}/route-text/{clientPhone}`
 *   (needs the client phone — taken from `offre.client.telephone`).
 *
 * Only `date_depot` exists as a timestamp (no per-state history endpoint), so
 * the page shows a status card instead of an invented timeline.
 */
@Component({
    selector: 'app-offer-detail',
    templateUrl: './offer-detail.component.html',
    styleUrls: ['./offer-detail.component.scss'],
    standalone: false
})
export class OfferDetailComponent implements OnInit, OnDestroy {
  id = 0;
  offre: OffreDto | null = null;
  loading = true;
  error = '';

  routeText: OfferRouteTextPatchRequest = { location: '', destination: '' };
  savingRouteText = false;

  readonly etatOptions = OFFRE_ETAT;
  readonly breadcrumb = [
    { label: 'Operations' },
    { label: 'Offers' },
    { label: 'Detail', active: true },
  ];

  private readonly sub = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offreService: OffreService,
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
    return this.translate.instant('offer.detail.title', { id: this.id });
  }

  /** Client phone — required as a path segment of the route-text patch. */
  get clientPhone(): string {
    return this.offre?.client?.telephone ?? '';
  }

  get canPatchRouteText(): boolean {
    return this.offre !== null && this.clientPhone !== '';
  }

  /** State change — unambiguous endpoint (id + enum in path, no body). */
  changeState(etat: StatusEnum): void {
    this.offreService.updateStateById(this.id, etat).subscribe({
      next: () => {
        Swal.fire(
          this.translate.instant('offer.detail.updated'),
          this.translate.instant('offer.detail.updatedText', { id: this.id, etat }),
          'success'
        );
        this.load();
      },
      error: (err) =>
        Swal.fire(this.translate.instant('offer.detail.error'), extractErrorMessage(err), 'error'),
    });
  }

  confirmCancel(): void {
    Swal.fire({
      title: this.translate.instant('offer.detail.cancelOfferTitle'),
      text: this.translate.instant('offer.detail.cancelOfferText', { id: this.id }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('offer.detail.cancelOffer'),
      cancelButtonText: this.translate.instant('offer.detail.keep'),
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this.offreService.cancelOffre(this.id).subscribe({
        next: () => {
          Swal.fire(
            this.translate.instant('offer.detail.cancelled'),
            this.translate.instant('offer.detail.cancelledText', { id: this.id }),
            'success'
          );
          this.load();
        },
        error: (err) =>
          Swal.fire(this.translate.instant('offer.detail.error'), extractErrorMessage(err), 'error'),
      });
    });
  }

  confirmDelete(): void {
    Swal.fire({
      title: this.translate.instant('offer.detail.deleteOfferTitle'),
      text: this.translate.instant('offer.detail.deleteOfferText', { id: this.id }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('common.delete'),
      cancelButtonText: this.translate.instant('offer.detail.keep'),
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this.offreService.deleteOffre(this.id).subscribe({
        next: () => {
          Swal.fire(
            this.translate.instant('offer.detail.deleted'),
            this.translate.instant('offer.detail.deletedText', { id: this.id }),
            'success'
          );
          this.router.navigate(['/offers']);
        },
        error: (err) =>
          Swal.fire(this.translate.instant('offer.detail.error'), extractErrorMessage(err), 'error'),
      });
    });
  }

  /** Patch pickup/destination labels (`PATCH /api/offers/{id}/route-text/{phone}`). */
  saveRouteText(): void {
    if (!this.canPatchRouteText) {
      return;
    }
    this.savingRouteText = true;
    this.offreService
      .patchRouteText(this.id, this.clientPhone, {
        location: this.routeText.location,
        destination: this.routeText.destination,
      })
      .subscribe({
        next: (updated) => {
          this.savingRouteText = false;
          if (updated) {
            this.offre = updated;
            this.syncRouteText();
          }
          Swal.fire(
            this.translate.instant('offer.detail.saved'),
            this.translate.instant('offer.detail.routeTextUpdated'),
            'success'
          );
        },
        error: (err) => {
          this.savingRouteText = false;
          Swal.fire(this.translate.instant('offer.detail.error'), extractErrorMessage(err), 'error');
        },
      });
  }

  /** Status badge via the shared scheme (plan §7). */
  badge(etat?: StatusEnum): StatusBadge {
    if (!etat) {
      return { label: this.translate.instant('dashboard.unknown'), class: 'badge-soft-secondary' };
    }
    return statusBadge(etat, OFFRE_STATUS);
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.offreService.getOffreById(this.id).subscribe({
      next: (offre) => {
        this.offre = offre;
        this.syncRouteText();
        this.loading = false;
      },
      error: (err) => {
        this.offre = null;
        this.loading = false;
        this.error = extractErrorMessage(err);
      },
    });
  }

  private syncRouteText(): void {
    this.routeText = {
      location: this.offre?.locationHistory ?? '',
      destination: this.offre?.destinationHistory ?? '',
    };
  }
}
