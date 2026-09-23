import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { TaxiService } from '../../core/services/taxi.service';
import {
  OFFRE_STATUS,
  StatusBadge,
  statusBadge,
  TAXI_STATUS,
} from '../../core/constants/status-badges';
import { StatusEnum, TaxiStatus } from '../../core/models/common.model';
import { OffreDto, OffreHistoryPageDto } from '../../core/models/offre.model';
import { TaxiRatingSummaryDto } from '../../core/models/rating.model';
import { LocationUpdateDto, TaxiCreateDto, TaxiDto } from '../../core/models/taxi.model';
import { BreadcrumbItem } from './taxis.model';

/**
 * Taxi detail — route `taxis/:id` (plan §5.2). Profile card (all TaxiDto fields),
 * rating summary, GPS display + update form, approve/reject, ride-history tab.
 */
@Component({
  selector: 'app-taxi-detail',
  templateUrl: './taxi-detail.component.html',
})
export class TaxiDetailComponent implements OnInit, OnDestroy {
  id = 0;
  taxi?: TaxiDto;
  ratingSummary?: TaxiRatingSummaryDto;

  loading = false;
  loadError = '';
  statusBusy = false;
  actionError = '';

  gpsForm: FormGroup;
  gpsBusy = false;
  gpsError = '';
  gpsSaved = false;

  history: OffreDto[] = [];
  historyPage = 1;
  historyLimit = 10;
  historyTotal = 0;
  historyLoading = false;
  historyError = '';

  breadcrumbItems: BreadcrumbItem[] = [];

  private routeSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly taxiService: TaxiService,
    private readonly fb: FormBuilder
  ) {
    this.gpsForm = this.fb.group({
      latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      bearing: [null, []],
    });
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.loadError = 'Invalid taxi ID.';
        return;
      }
      this.id = id;
      this.breadcrumbItems = [{ label: 'Taxi' }, { label: `Taxi #${id}`, active: true }];
      this.historyPage = 1;
      this.loadTaxi();
      this.loadRating();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  // -------------------------------------------------------------------------
  // Display helpers
  // -------------------------------------------------------------------------

  badgeForTaxiStatus(status?: TaxiStatus): StatusBadge {
    return status
      ? statusBadge(status, TAXI_STATUS)
      : { label: '—', class: 'badge-soft-secondary' };
  }

  badgeForEtat(etat?: StatusEnum): StatusBadge {
    return etat
      ? statusBadge(etat, OFFRE_STATUS)
      : { label: '—', class: 'badge-soft-secondary' };
  }

  yesNo(value?: boolean): string {
    return value === true ? 'Yes' : value === false ? 'No' : '—';
  }

  gpsLat(): number | undefined {
    return this.taxi?.latGps ?? this.taxi?.latitude;
  }

  gpsLng(): number | undefined {
    return this.taxi?.lngGps ?? this.taxi?.longitude;
  }

  ratingValue(): number | undefined {
    return this.ratingSummary?.rating ?? this.taxi?.rating;
  }

  get historyTotalPages(): number {
    return this.historyTotal > 0 ? Math.ceil(this.historyTotal / this.historyLimit) : 1;
  }

  // -------------------------------------------------------------------------
  // Loaders
  // -------------------------------------------------------------------------

  loadTaxi(): void {
    this.loading = true;
    this.loadError = '';
    this.taxiService
      .getTaxiById(this.id)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (taxi) => {
          this.taxi = taxi;
          if (taxi.latGps != null || taxi.latitude != null) {
            this.gpsForm.patchValue({ latitude: taxi.latGps ?? taxi.latitude });
          }
          if (taxi.lngGps != null || taxi.longitude != null) {
            this.gpsForm.patchValue({ longitude: taxi.lngGps ?? taxi.longitude });
          }
          if (taxi.telephone) {
            this.loadHistory(1);
          }
        },
        error: (err) => {
          this.loadError = err?.error?.message || err?.message || 'Failed to load taxi.';
        },
      });
  }

  loadRating(): void {
    this.taxiService.getRatingSummary(this.id).subscribe({
      next: (summary) => {
        this.ratingSummary = summary;
      },
      error: () => {
        // Rating summary is auxiliary — the profile still renders with the TaxiDto rating.
        this.ratingSummary = undefined;
      },
    });
  }

  loadHistory(page = this.historyPage): void {
    if (!this.taxi?.telephone) {
      return;
    }
    this.historyPage = page;
    this.historyLoading = true;
    this.historyError = '';
    this.taxiService
      .getRideHistory(this.taxi.telephone, page, this.historyLimit)
      .pipe(
        finalize(() => {
          this.historyLoading = false;
        })
      )
      .subscribe({
        next: (resp: OffreHistoryPageDto) => {
          this.history = resp.items ?? [];
          this.historyTotal = resp.total ?? 0;
          if (resp.page) {
            this.historyPage = resp.page;
          }
        },
        error: (err) => {
          this.historyError =
            err?.error?.message || err?.message || 'Failed to load ride history.';
        },
      });
  }

  onHistoryPageChange(page: number): void {
    this.loadHistory(page);
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  saveGps(): void {
    this.gpsError = '';
    this.gpsSaved = false;
    if (!this.taxi?.id) {
      this.gpsError = 'Taxi is not loaded.';
      return;
    }
    if (this.gpsForm.invalid) {
      this.gpsForm.markAllAsTouched();
      return;
    }
    const dto: LocationUpdateDto = {
      latitude: this.gpsForm.value.latitude,
      longitude: this.gpsForm.value.longitude,
      bearing: this.gpsForm.value.bearing,
    };
    this.gpsBusy = true;
    this.taxiService
      .updateGps(this.taxi.id, dto)
      .pipe(
        finalize(() => {
          this.gpsBusy = false;
        })
      )
      .subscribe({
        next: () => {
          this.gpsSaved = true;
          this.gpsForm.markAsPristine();
          this.loadTaxi(); // refresh displayed coordinates from the server
        },
        error: (err) => {
          this.gpsError = err?.error?.message || err?.message || 'Failed to update GPS.';
        },
      });
  }

  /**
   * Approve / reject. The spec's dedicated status endpoint
   * `PATCH /api/updateTaxiStatus/status` carries no taxi identifier (API_REFERENCE
   * ambiguity #2), so we write `taxiStatus` through `PATCH /api/update-taxi/{id}`
   * with the full `TaxiCreateDto` body — see ROADMAP.
   */
  setTaxiStatus(taxiStatus: TaxiStatus): void {
    this.actionError = '';
    if (!this.taxi?.id) {
      this.actionError = 'Taxi is not loaded.';
      return;
    }
    if (!this.taxi.telephone) {
      this.actionError = 'Taxi has no phone number; update-taxi requires one.';
      return;
    }
    const dto: TaxiCreateDto = {
      telephone: this.taxi.telephone,
      contenu: this.taxi.contenu,
      nom: this.taxi.nom,
      numeroMatricule: this.taxi.numeroMatricule,
      numeroCin: this.taxi.numeroCin,
      constructeur: this.taxi.constructeur,
      numeroTaxi: this.taxi.numeroTaxi,
      email: this.taxi.email,
      type: this.taxi.type,
      destination: this.taxi.destination,
      location: this.taxi.location,
      taxiStatus,
    };
    this.statusBusy = true;
    this.taxiService
      .updateTaxi(this.taxi.id, dto)
      .pipe(
        finalize(() => {
          this.statusBusy = false;
        })
      )
      .subscribe({
        next: (updated) => {
          this.taxi = { ...this.taxi, ...updated };
        },
        error: (err) => {
          this.actionError =
            err?.error?.message || err?.message || `Failed to set status to ${taxiStatus}.`;
        },
      });
  }
}