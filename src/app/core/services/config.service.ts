import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AirportPricingConfigRequest,
  AirportPricingConfigResponse,
  MatchingConfigRequest,
  MatchingConfigResponse,
} from '../models/config.model';

/**
 * Settings / runtime-configuration service (plan §5.9 / §8, lane L6).
 *
 * Settings config ONLY — the demo `ConfigService` that loaded
 * `assets/dashboard.json` died with the demo pages.
 * Endpoints and DTOs are exactly as declared in docs/API_REFERENCE.md
 * §10 Matching Config and §11 Airport Pricing Config — nothing invented.
 *
 * NOTE: a `ConfigService` name is free again (the old dashboard.json one was
 * removed with `pages/`); no conflict exists.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  constructor(private http: HttpClient) {}

  /**
   * GET /api/matching-config — current base/max matching radius (meters);
   * max is capped to 5000 m server-side. The spec declares an UNTYPED response
   * (`additionalProperties: object`) — `baseRadius`/`maxRadius` follow the
   * doc's prose (see `MatchingConfigResponse` and API_REFERENCE ambiguity #5).
   */
  getMatchingConfig(): Observable<MatchingConfigResponse> {
    return this.http.get<MatchingConfigResponse>('/api/matching-config');
  }

  /**
   * PUT /api/matching-config — update base/max radius (meters); only provided
   * fields are updated; max capped to 5000 m, base clamped to `[>0, max]`.
   * (Plan §5.9 also mentions a PATCH alias for this path; API_REFERENCE §10
   * declares GET + PUT only — PUT is used here, per the dashboard-facing brief.)
   */
  updateMatchingConfig(dto: MatchingConfigRequest): Observable<MatchingConfigResponse> {
    return this.http.put<MatchingConfigResponse>('/api/matching-config', dto);
  }

  /**
   * GET /api/airport-pricing — current surcharge value/type, airport detection
   * radius (meters) and airport list. Returns `AirportPricingConfigResponse`.
   */
  getAirportPricing(): Observable<AirportPricingConfigResponse> {
    return this.http.get<AirportPricingConfigResponse>('/api/airport-pricing');
  }

  /**
   * PUT /api/airport-pricing — update surcharge value/type and/or detection
   * radius; only provided fields are updated. Body `AirportPricingConfigRequest`.
   *
   * Verb note: PATCH /api/airport-pricing is the canonical endpoint; PUT is
   * the spec-declared alias ("Alias de PATCH pour compatibilité Dashboard").
   * We call PUT (dashboard compatibility, plan §5.9); PATCH behaves identically.
   */
  updateAirportPricing(dto: AirportPricingConfigRequest): Observable<AirportPricingConfigResponse> {
    return this.http.put<AirportPricingConfigResponse>('/api/airport-pricing', dto);
  }
}
