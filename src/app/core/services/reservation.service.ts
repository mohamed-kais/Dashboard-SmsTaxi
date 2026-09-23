import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AssignTaxiRequest,
  PageReservationResponse,
  ReservationResponse,
  ReservationWithAssignmentRequest,
  UpdateReservationRequest,
} from '../models/reservation.model';
import { ReservationStatus } from '../models/common.model';

/**
 * Query parameters of `GET /api/admin/reservations` (docs/API_REFERENCE.md §15).
 * `pageable` is declared as a Pageable ref — flattened to `page`/`size`/`sort`.
 */
export interface ReservationSearchParams {
  /** 0-based page (Spring Page style). */
  page?: number;
  /** items per page (>=1). */
  size?: number;
  /** e.g. `id,asc`, `reservationDateTime,desc`. */
  sort?: string;
  /** status enum filter (CREATED, CONFIRMED, …). */
  status?: ReservationStatus;
}

/**
 * Query parameters of `GET /api/admin/reservations/by-taxi`.
 * Lookup is by `taxiId` OR `telephone` (either one), plus optional status + paging.
 */
export interface ReservationByTaxiParams {
  taxiId?: number;
  telephone?: string;
  status?: ReservationStatus;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Reservation admin endpoints — `reservation-admin-controller`
 * (docs/API_REFERENCE.md §15). Paths are relative; `ApiBaseUrlInterceptor`
 * prepends `environment.apiBaseUrl`.
 */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(private http: HttpClient) {}

  /** `GET /api/admin/reservations` — list reservations (status filter + paging). */
  searchReservations(
    params: ReservationSearchParams = {}
  ): Observable<PageReservationResponse> {
    return this.http.get<PageReservationResponse>('/api/admin/reservations', {
      params: this.toHttpParams(params),
    });
  }

  /** `GET /api/admin/reservations/by-taxi` — list reservations for a taxi. */
  listByTaxi(
    params: ReservationByTaxiParams = {}
  ): Observable<PageReservationResponse> {
    return this.http.get<PageReservationResponse>(
      '/api/admin/reservations/by-taxi',
      { params: this.toHttpParams(params) }
    );
  }

  /** `GET /api/admin/reservations/{id}` — reservation by ID. */
  getById(id: number): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`/api/admin/reservations/${id}`);
  }

  /** `PUT /api/admin/reservations/{id}` — update reservation fields. */
  update(
    id: number,
    dto: UpdateReservationRequest
  ): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(
      `/api/admin/reservations/${id}`,
      dto
    );
  }

  /**
   * `PUT /api/admin/reservations/{id}/assignment` — assign a taxi.
   * Spec (API_REFERENCE §15) declares 200 → `ReservationResponse`
   * (the full reservation, with `assignment` refreshed).
   */
  assignTaxi(
    id: number,
    dto: AssignTaxiRequest
  ): Observable<ReservationResponse> {
    return this.http.put<ReservationResponse>(
      `/api/admin/reservations/${id}/assignment`,
      dto
    );
  }

  /** `DELETE /api/admin/reservations/{id}/assignment` — unassign taxi. */
  unassignTaxi(
    id: number,
    cancelledBy?: string,
    reason?: string
  ): Observable<ReservationResponse> {
    let params = new HttpParams();
    if (cancelledBy) {
      params = params.set('cancelledBy', cancelledBy);
    }
    if (reason) {
      params = params.set('reason', reason);
    }
    return this.http.delete<ReservationResponse>(
      `/api/admin/reservations/${id}/assignment`,
      { params }
    );
  }

  /** `POST /api/admin/reservations/with-assignment` — create + assign. */
  createWithAssignment(
    dto: ReservationWithAssignmentRequest
  ): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(
      '/api/admin/reservations/with-assignment',
      dto
    );
  }

  private toHttpParams(
    params: ReservationSearchParams | ReservationByTaxiParams
  ): HttpParams {
    let httpParams = new HttpParams();
    (Object.keys(params) as Array<keyof typeof params>).forEach((key) => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(String(key), String(value));
      }
    });
    return httpParams;
  }
}