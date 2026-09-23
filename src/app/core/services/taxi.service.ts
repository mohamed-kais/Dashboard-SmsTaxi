/**
 * Taxi resource service — plan §8 (docs/IMPLEMENTATION_PLAN.md §5.2 Taxis).
 *
 * Endpoints & DTOs are the Taxis tag of docs/API_REFERENCE.md (source of truth).
 * All paths are relative; the ApiBaseUrlInterceptor prefixes `environment.apiBaseUrl`.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  LocationUpdateDto,
  PageGetAllTaxisDtoResponse,
  TaxiCreateDto,
  TaxiDto,
} from '../models/taxi.model';
import { Direction, StatusEnum } from '../models/common.model';
import { OffreHistoryPageDto } from '../models/offre.model';
import { TaxiRatingSummaryDto } from '../models/rating.model';

// ---------------------------------------------------------------------------
// Query param structs (exported so feature lanes / the dashboard can call with
// plain object literals)
// ---------------------------------------------------------------------------

/** Query of `GET /api/get-all-taxis` (Spring paging, 0-based). */
export interface TaxiListQuery {
  /** 0-based page (spec default 0). */
  page?: number;
  /** page size (spec default 10). */
  size?: number;
  /** sort, e.g. `id,asc` (spec default `["id","asc"]`). */
  sort?: string;
}

/**
 * Query of `GET /api/get-all-taxis-criteria` (Spring paging + phone/name filters).
 * `sort` is a JSON string per the spec default `[{"field":"phone","direction":"desc"}]`,
 * e.g. `JSON.stringify([{ field: 'rating', direction: 'desc' }])`.
 */
export interface TaxiCriteriaQuery {
  page?: number;
  size?: number;
  sort?: string;
  /** phone filter. */
  phone?: string;
  /** name filter. */
  name?: string;
}

/** Optional filters of `GET /api/history-traffic-taxi/{phone}/page`. */
export interface RideHistoryQuery {
  /** date-time filter. */
  from?: string;
  /** date-time filter. */
  to?: string;
  month?: number;
  year?: number;
  /** status enum filter. */
  status?: StatusEnum;
  /** free-text search. */
  q?: string;
  sort?: string;
  /** `ASC`/`DESC`, default `DESC`. */
  direction?: Direction;
}

/**
 * One service per resource (plan §8) — `providedIn: 'root'`, HttpClient injected
 * directly, query params via HttpParams, typed Observable returns.
 */
@Injectable({ providedIn: 'root' })
export class TaxiService {
  constructor(private readonly http: HttpClient) {}

  // -------------------------------------------------------------------------
  // Get / list
  // -------------------------------------------------------------------------

  /**
   * `GET /api/get-all-taxis` — paginated list, 0-based paging.
   */
  searchTaxis(query: TaxiListQuery = {}): Observable<PageGetAllTaxisDtoResponse> {
    let params = new HttpParams();
    if (query.page != null) {
      params = params.set('page', query.page);
    }
    if (query.size != null) {
      params = params.set('size', query.size);
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }
    return this.http.get<PageGetAllTaxisDtoResponse>('/api/get-all-taxis', { params });
  }

  /**
   * `GET /api/get-all-taxis-criteria` — paginated list with phone/name filters.
   */
  searchTaxisCriteria(query: TaxiCriteriaQuery = {}): Observable<PageGetAllTaxisDtoResponse> {
    let params = new HttpParams();
    if (query.page != null) {
      params = params.set('page', query.page);
    }
    if (query.size != null) {
      params = params.set('size', query.size);
    }
    if (query.sort) {
      params = params.set('sort', query.sort);
    }
    if (query.phone) {
      params = params.set('phone', query.phone);
    }
    if (query.name) {
      params = params.set('name', query.name);
    }
    return this.http.get<PageGetAllTaxisDtoResponse>('/api/get-all-taxis-criteria', { params });
  }

  /**
   * `GET /api/get-taxis/{id}` — single taxi by ID.
   */
  getTaxiById(id: number): Observable<TaxiDto> {
    return this.http.get<TaxiDto>(`/api/get-taxis/${id}`);
  }

  /**
   * `GET /api/taxi_byphone/{tel}` — single taxi by phone (returns ONE object,
   * unlike the `get-taxi/{tel}` list aliases).
   */
  getTaxiByPhone(tel: string): Observable<TaxiDto> {
    return this.http.get<TaxiDto>(`/api/taxi_byphone/${encodeURIComponent(tel)}`);
  }

  /**
   * `GET /api/checkTaxiStatus/{phone}` — `true` if the taxi is APPROVED.
   */
  checkStatus(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`/api/checkTaxiStatus/${encodeURIComponent(phone)}`);
  }

  /**
   * `GET /api/existByPhone/{phone}` — `true` if a taxi exists for the phone.
   */
  existsByPhone(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`/api/existByPhone/${encodeURIComponent(phone)}`);
  }

  /**
   * `GET /api/nbr-taxi` — total taxi count (used by the dashboard lane, plan §5.1;
   * the dashboard has no service of its own and reuses this one).
   */
  getTaxiCount(): Observable<number> {
    return this.http.get<number>('/api/nbr-taxi');
  }

  // -------------------------------------------------------------------------
  // Rating summaries
  // -------------------------------------------------------------------------

  /**
   * `GET /api/taxis/{taxiId}/rating-summary` — aggregate rating + history stats.
   */
  getRatingSummary(taxiId: number): Observable<TaxiRatingSummaryDto> {
    return this.http.get<TaxiRatingSummaryDto>(`/api/taxis/${taxiId}/rating-summary`);
  }

  /**
   * `GET /api/taxis/by-phone/{phone}/rating-summary` — rating summary by phone.
   */
  getRatingSummaryByPhone(phone: string): Observable<TaxiRatingSummaryDto> {
    return this.http.get<TaxiRatingSummaryDto>(
      `/api/taxis/by-phone/${encodeURIComponent(phone)}/rating-summary`
    );
  }

  // -------------------------------------------------------------------------
  // Ride / traffic history
  // -------------------------------------------------------------------------

  /**
   * `GET /api/history-traffic-taxi/{phone}/page` — paginated taxi history.
   * NOTE: this endpoint uses 1-based `page` + `limit` (not the Spring style).
   */
  getRideHistory(
    phone: string,
    page = 1,
    limit = 20,
    filters: RideHistoryQuery = {}
  ): Observable<OffreHistoryPageDto> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    if (filters.month != null) {
      params = params.set('month', filters.month);
    }
    if (filters.year != null) {
      params = params.set('year', filters.year);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.q) {
      params = params.set('q', filters.q);
    }
    if (filters.sort) {
      params = params.set('sort', filters.sort);
    }
    if (filters.direction) {
      params = params.set('direction', filters.direction);
    }
    return this.http.get<OffreHistoryPageDto>(
      `/api/history-traffic-taxi/${encodeURIComponent(phone)}/page`,
      { params }
    );
  }

  // -------------------------------------------------------------------------
  // Write operations
  // -------------------------------------------------------------------------

  /**
   * `POST /api/add-taxi` — register a new taxi (canonical create endpoint; the
   * `/api/add-taxi-admin`, `/api/add-taxigps`, `/api/add-taxis` aliases exist in
   * the spec, `add-taxi` is the admin default).
   */
  createTaxi(dto: TaxiCreateDto): Observable<TaxiDto> {
    return this.http.post<TaxiDto>('/api/add-taxi', dto);
  }

  /**
   * `PATCH /api/update-taxi/{id}` — update the taxi profile (body `TaxiCreateDto`).
   * Also the vehicle for approve/reject: `taxiStatus` is part of the body.
   */
  updateTaxi(id: number, dto: TaxiCreateDto): Observable<TaxiDto> {
    return this.http.patch<TaxiDto>(`/api/update-taxi/${id}`, dto);
  }

  /**
   * `PATCH /api/update_gps/{taxiID}` — update taxi location (lat, lng, bearing).
   */
  updateGps(taxiID: number, dto: LocationUpdateDto): Observable<LocationUpdateDto> {
    return this.http.patch<LocationUpdateDto>(`/api/update_gps/${taxiID}`, dto);
  }

  /**
   * `DELETE /api/delete-taxi/{id}` — delete taxi by ID (spec: 200 → object).
   */
  deleteTaxi(id: number): Observable<unknown> {
    return this.http.delete(`/api/delete-taxi/${id}`);
  }
}