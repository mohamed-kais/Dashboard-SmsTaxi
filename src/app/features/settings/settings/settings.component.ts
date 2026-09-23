import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  AirportPricingConfigRequest,
  MatchingConfigRequest,
} from '../../../core/models/config.model';
import { SurchargeType } from '../../../core/models/common.model';
import { ConfigService } from '../../../core/services/config.service';
import { SURCHARGE_TYPES, apiErrorMessage } from '../settings.constants';

/**
 * Settings page (plan §5.9) — two NgbNav tabs backed by reactive forms:
 *
 *   1. "Matching radius" — GET/PUT /api/matching-config. The spec declares an
 *      UNTYPED response (`baseRadius`/`maxRadius` follow the doc prose — see
 *      `MatchingConfigResponse` and API_REFERENCE ambiguity #5); validators:
 *      required + numeric ≥ 0 (the server additionally caps max at 5000 m and
 *      clamps base to (0, max]).
 *   2. "Airport pricing" — GET/PUT /api/airport-pricing with
 *      `AirportPricingConfigRequest` ({ surchargeValue, surchargeType,
 *      airportRadiusMeters }); surchargeType select bound to the spec's
 *      `PERCENTAGE | FIXED_AMOUNT` union; validators: required + min 0.
 *
 * PUT is used for both saves (the airport PUT is the spec-declared alias of
 * PATCH "pour compatibilité Dashboard").
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  breadCrumbItems: { label: string; active: boolean }[] = [
    { label: 'System', active: false },
    { label: 'Settings', active: true },
  ];

  matchingForm!: FormGroup;
  airportForm!: FormGroup;

  matchingSubmitted = false;
  airportSubmitted = false;
  matchingSaving = false;
  airportSaving = false;
  matchingSuccess = '';
  matchingError = '';
  airportSuccess = '';
  airportError = '';

  /** `SurchargeType` options for the select (`PERCENTAGE | FIXED_AMOUNT`). */
  surchargeTypes: readonly SurchargeType[] = SURCHARGE_TYPES;

  /** Airport count from GET /api/airport-pricing (response-only, read-only here). */
  airportCount: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private configService: ConfigService
  ) {}

  get mf(): FormGroup['controls'] {
    return this.matchingForm.controls;
  }

  get af(): FormGroup['controls'] {
    return this.airportForm.controls;
  }

  ngOnInit(): void {
    this.matchingForm = this.formBuilder.group({
      baseRadius: [null, [Validators.required, Validators.min(0)]],
      maxRadius: [null, [Validators.required, Validators.min(0)]],
    });
    this.airportForm = this.formBuilder.group({
      surchargeValue: [null, [Validators.required, Validators.min(0)]],
      surchargeType: [null as SurchargeType | null, [Validators.required]],
      airportRadiusMeters: [null, [Validators.required, Validators.min(0)]],
    });

    this.loadMatchingConfig();
    this.loadAirportPricing();
  }

  // ---------------------------------------------------------------------------
  // Matching radius tab
  // ---------------------------------------------------------------------------

  loadMatchingConfig(): void {
    this.matchingError = '';
    this.configService.getMatchingConfig().subscribe({
      next: (config) => {
        this.matchingForm.patchValue({
          baseRadius: config?.baseDistanceMeters ?? null,
          maxRadius: config?.maxDistanceMeters ?? null,
        });
      },
      error: (err) => {
        this.matchingError = apiErrorMessage(err) || 'Failed to load the matching configuration.';
      },
    });
  }

  saveMatching(): void {
    this.matchingSubmitted = true;
    this.matchingSuccess = '';
    this.matchingError = '';
    if (this.matchingForm.invalid) {
      return;
    }

    this.matchingSaving = true;
    const dto: MatchingConfigRequest = {
      baseDistanceMeters: Number(this.mf.baseRadius.value),
      maxDistanceMeters: Number(this.mf.maxRadius.value),
    };
    this.configService.updateMatchingConfig(dto).subscribe({
      next: () => {
        this.matchingSaving = false;
        this.matchingSubmitted = false;
        this.matchingSuccess = 'Matching radius configuration saved.';
      },
      error: (err) => {
        this.matchingSaving = false;
        this.matchingError = apiErrorMessage(err) || 'Failed to save the matching configuration.';
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Airport pricing tab
  // ---------------------------------------------------------------------------

  loadAirportPricing(): void {
    this.airportError = '';
    this.configService.getAirportPricing().subscribe({
      next: (config) => {
        this.airportForm.patchValue({
          surchargeValue: config?.surchargeValue ?? null,
          surchargeType: config?.surchargeType ?? null,
          airportRadiusMeters: config?.airportRadiusMeters ?? null,
        });
        this.airportCount = Array.isArray(config?.airports) ? config.airports!.length : null;
      },
      error: (err) => {
        this.airportError = apiErrorMessage(err) || 'Failed to load the airport pricing configuration.';
      },
    });
  }

  saveAirportPricing(): void {
    this.airportSubmitted = true;
    this.airportSuccess = '';
    this.airportError = '';
    if (this.airportForm.invalid) {
      return;
    }

    this.airportSaving = true;
    const dto: AirportPricingConfigRequest = {
      surchargeValue: Number(this.af.surchargeValue.value),
      surchargeType: this.af.surchargeType.value as SurchargeType,
      airportRadiusMeters: Number(this.af.airportRadiusMeters.value),
    };
    this.configService.updateAirportPricing(dto).subscribe({
      next: () => {
        this.airportSaving = false;
        this.airportSubmitted = false;
        this.airportSuccess = 'Airport pricing configuration saved.';
      },
      error: (err) => {
        this.airportSaving = false;
        this.airportError = apiErrorMessage(err) || 'Failed to save the airport pricing configuration.';
      },
    });
  }
}
