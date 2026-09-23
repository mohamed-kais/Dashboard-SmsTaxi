import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Rating, RatingDto, TaxiRatingSummaryDto } from '../models/rating.model';

/**
 * Rating endpoints (docs/API_REFERENCE.md §8 Ratings + §3 Taxis rating-summary).
 *
 * NOTE — path prefixes differ per endpoint:
 *  - driver history/average live under `/taxi-client/api/ratings/...`
 *  - per-taxi summaries live under `/api/taxis/...`
 * Both prefixes are handled by `ApiBaseUrlInterceptor` (plan §1.3).
 */
@Injectable({ providedIn: 'root' })
export class RatingService {
  constructor(private http: HttpClient) {}

  /** `GET /taxi-client/api/ratings/driver/{driverId}` — all ratings for a driver. */
  getDriverRatings(driverId: string): Observable<Rating[]> {
    return this.http.get<Rating[]>(
      `/taxi-client/api/ratings/driver/${encodeURIComponent(driverId)}`
    );
  }

  /** `GET /taxi-client/api/ratings/driver/{driverId}/average` — average (double). */
  getDriverAverage(driverId: string): Observable<number> {
    return this.http.get<number>(
      `/taxi-client/api/ratings/driver/${encodeURIComponent(driverId)}/average`
    );
  }

  /** `GET /api/taxis/{taxiId}/rating-summary` — aggregate + history stats. */
  getTaxiRatingSummary(taxiId: number): Observable<TaxiRatingSummaryDto> {
    return this.http.get<TaxiRatingSummaryDto>(`/api/taxis/${taxiId}/rating-summary`);
  }

  /**
   * `GET /api/taxis/by-phone/{phone}/rating-summary` — summary by phone.
   * Phone may contain `+`, spaces or parens (spec pattern `^[0-9+\-\s()]+$`).
   */
  getTaxiRatingSummaryByPhone(phone: string): Observable<TaxiRatingSummaryDto> {
    return this.http.get<TaxiRatingSummaryDto>(
      `/api/taxis/by-phone/${encodeURIComponent(phone)}/rating-summary`
    );
  }

  /**
   * `POST /taxi-client/api/ratings` — submit a driver rating.
   * Service method only: not wired to any admin UI (spec documents it for the
   * client app after ride completion). 201 → `Rating`.
   */
  submitRating(dto: RatingDto): Observable<Rating> {
    return this.http.post<Rating>('/taxi-client/api/ratings', dto);
  }
}