/**
 * Rating DTOs — transcribed verbatim from docs/API_REFERENCE.md (§8 Ratings).
 * Driver average (`GET /taxi-client/api/ratings/driver/{id}/average`) returns a
 * plain double — no schema to model.
 */
export interface Rating {
  id?: number;
  offreId?: number;
  driverId?: string;
  rating?: number;
  comment?: string;
  /** date-time */
  createdAt?: string;
}

/** Submit body of `POST /taxi-client/api/ratings`. */
export interface RatingDto {
  /** required, ≤50 */
  driverId: string;
  /** required, int64 */
  offreId: number;
  /** required, int32 1–5 */
  rating: number;
  /** ≤500 */
  comment?: string;
  id?: number;
  /** date-time */
  createdAt?: string;
}

/**
 * `TaxiRatingSummaryDto` — `GET /api/taxis/{taxiId}/rating-summary` and
 * `GET /api/taxis/by-phone/{phone}/rating-summary`.
 */
export interface TaxiRatingSummaryDto {
  taxiId?: number;
  telephone?: string;
  /** aggregate rating on Taxi (double) */
  rating?: number;
  /** average from history table (double) */
  average?: number;
  /** int64 */
  count?: number;
}
