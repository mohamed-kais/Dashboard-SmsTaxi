/** Settings config DTOs — transcribed verbatim from docs/API_REFERENCE.md (§10–11). */
import { SurchargeType } from './common.model';

/** `AirportPricingConfigResponse` — `GET /api/airport-pricing`. */
export interface AirportPricingConfigResponse {
  surchargeValue?: number;
  surchargeType?: SurchargeType;
  airportRadiusMeters?: number;
  /** list of [latitude, longitude] pairs */
  airports?: number[][];
}

/** `AirportPricingConfigRequest` — body of `PUT`/`PATCH /api/airport-pricing` (only provided fields updated). */
export interface AirportPricingConfigRequest {
  surchargeValue?: number;
  surchargeType?: SurchargeType;
  airportRadiusMeters?: number;
}

/**
 * `GET /api/matching-config` response — the spec declares an untyped object
 * (`additionalProperties: object`); the LIVE backend (verified 2026-09-22)
 * returns `baseDistanceMeters` / `maxDistanceMeters` / `hardMaxMeters`, so those
 * names win over the doc's prose (`baseRadius`/`maxRadius` — API_REFERENCE
 * ambiguity #5, resolved in favour of the running server).
 */
export interface MatchingConfigResponse {
  baseDistanceMeters?: number;
  maxDistanceMeters?: number;
  hardMaxMeters?: number;
  [key: string]: unknown;
}

/**
 * `PUT /api/matching-config` body — also untyped in the spec; only provided
 * fields are updated, max capped to 5000m, base clamped to `[>0, max]`.
 * Live backend accepts `baseDistanceMeters` / `maxDistanceMeters` (200, verified).
 */
export interface MatchingConfigRequest {
  baseDistanceMeters?: number;
  maxDistanceMeters?: number;
  [key: string]: unknown;
}
