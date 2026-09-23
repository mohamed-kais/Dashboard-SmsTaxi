/**
 * Offre (ride offer) REST service — plan §5.4 (lane L4).
 *
 * Every endpoint below is transcribed from docs/API_REFERENCE.md §6 "Offers"
 * (method + path + params + response type). Paths are RELATIVE; the
 * ApiBaseUrlInterceptor prefixes `environment.apiBaseUrl` for any path that
 * starts with `/api/`.
 *
 * Conventions: plan §8 — `providedIn: 'root'`, HttpClient injected directly,
 * query params via HttpParams, DTO types imported from `core/models`.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Offre, OffreDto, PageOffreAdminDto } from '../models/offre.model';
import {
  ApiResponseDtoPageOffreAdminDto,
  CancelBookingResponseDto,
  StatusEnum,
} from '../models/common.model';

/**
 * Query params of the admin search `GET /api/get-all-offres`
 * (alias `GET /api/get-allOffre` — identical; we use the canonical
 * `get-all-offres` path). API_REFERENCE §6.
 */
export interface OffreSearchParams {
  /** 0-based page */
  page?: number;
  size?: number;
  /** e.g. `date_depot,desc` (the only documented sort example) */
  sort?: string;
  /** status enum (8 values, "Global conventions") */
  etat?: StatusEnum;
  taxiPhone?: string;
  clientPhone?: string;
  /** contains, case-insensitive */
  taxiNom?: string;
  /** contains, case-insensitive */
  clientNom?: string;
  /** exact offer ID */
  id?: number;
  /** pickup contains (from `location_history`) */
  location?: string;
  /** destination contains (from `destination_history`) */
  destination?: string;
  /** `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm:ss` */
  dateDepotFrom?: string;
  /** `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm:ss` */
  dateDepotTo?: string;
  /** exact rating filter */
  rating?: number;
  /** real price range ≥ */
  minTotalPrice?: number;
  /** real price range ≤ */
  maxTotalPrice?: number;
}

/** Body of `PATCH /api/offers/{offreId}/route-text/{clientPhone}` (both fields required). */
export interface OfferRouteTextPatchRequest {
  /** new pickup label */
  location: string;
  /** new destination label */
  destination: string;
}

@Injectable({ providedIn: 'root' })
export class OffreService {
  constructor(private http: HttpClient) {}

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  /**
   * Admin search — `GET /api/get-all-offres`
   * (alias `GET /api/get-allOffre` — identical duplicate per spec).
   *
   * SPEC AMBIGUITY #3 (API_REFERENCE "Notes / Ambiguities"): the 200 response
   * declares a bare `OffreAdminDto`, but the description says "Page of offers"
   * and 400/500 declare `ApiResponseDtoPageOffreAdminDto`. The real runtime
   * shape is the Spring page wrapper, so the return type is
   * `PageOffreAdminDto` — NOT `OffreAdminDto`.
   */
  searchOffres(params: OffreSearchParams = {}): Observable<PageOffreAdminDto> {
    // LIVE ENVELOPE: the deployed backend wraps the Spring page in
    // `{ success, message, data: Page }` (observed via curl — verified on
    // 2026-09-22 against http://41.225.11.231:8577). Unwrap `data` so
    // callers get `page.content` / `page.totalElements`.
    return this.http
      .get<ApiResponseDtoPageOffreAdminDto>('/api/get-all-offres', {
        params: OffreService.buildParams(params),
      })
      .pipe(map((envelope) => envelope?.data ?? {}));
  }

  /**
   * Canonical offer-by-ID — `GET /api/get-offreParId/{id}` → `OffreDto`
   * (200/404/500). Alias (not called here, documented in the spec):
   * `GET /api/getOffresById/{id}` — same purpose; prefer `get-offreParId`.
   */
  getOffreById(id: number): Observable<OffreDto> {
    return this.http.get<OffreDto>(`/api/get-offreParId/${id}`);
  }

  /** `GET /api/get-listOffresParEtat/{etat}` → `OffreDto[]`. */
  getOffresByEtat(etat: StatusEnum | string): Observable<OffreDto[]> {
    return this.http.get<OffreDto[]>(`/api/get-listOffresParEtat/${encodeURIComponent(String(etat))}`);
  }

  /** `GET /api/nombreOffreParEtat/{etat}` → int64 count. */
  countOffresByEtat(etat: StatusEnum | string): Observable<number> {
    return this.http.get<number>(`/api/nombreOffreParEtat/${encodeURIComponent(String(etat))}`);
  }

  /** `GET /api/NbrOffreEnattente` → int32 (waiting offers). */
  countWaiting(): Observable<number> {
    return this.http.get<number>('/api/NbrOffreEnattente');
  }

  /** `GET /api/NbrOffreEncours` → int32 (in-progress offers). */
  countInProgress(): Observable<number> {
    return this.http.get<number>('/api/NbrOffreEncours');
  }

  /** `GET /api/offreEnCoursParClient/{id_client}` → current `OffreDto` or null. */
  getOffreEnCoursByClient(clientId: number): Observable<OffreDto | null> {
    return this.http.get<OffreDto | null>(`/api/offreEnCoursParClient/${clientId}`);
  }

  /**
   * `GET /api/offre_matching_client/{phone}` — current matched offer for a
   * CLIENT phone. 204 = no offer (empty body → null at runtime).
   */
  getMatchingByClient(phone: string): Observable<OffreDto | null> {
    return this.http.get<OffreDto | null>(`/api/offre_matching_client/${encodeURIComponent(phone)}`);
  }

  /**
   * `GET /api/offre_matching_taxi/{phone}` — current matched offer for a
   * TAXI phone. 204 = no offer (empty body → null at runtime).
   */
  getMatchingByTaxi(phone: string): Observable<OffreDto | null> {
    return this.http.get<OffreDto | null>(`/api/offre_matching_taxi/${encodeURIComponent(phone)}`);
  }

  // -------------------------------------------------------------------------
  // Write
  // -------------------------------------------------------------------------

  /** `POST /api/ajouterOffre` — body `OffreDto`, response `OffreDto` (created). */
  createOffre(dto: OffreDto): Observable<OffreDto> {
    return this.http.post<OffreDto>('/api/ajouterOffre', dto);
  }

  /** `PUT /api/update-offre` — body: full `OffreDto`, response `OffreDto`. */
  updateOffre(dto: OffreDto): Observable<OffreDto> {
    return this.http.put<OffreDto>('/api/update-offre', dto);
  }

  /**
   * `PUT /api/update-EtatOffre/{etat}` — PATH variant: new state in the path;
   * body is an `Offre` "with id" (required; `Offre.etat` is required by the
   * schema so it is echoed in the body too). Response: `Offre`.
   *
   * (A body-only sibling `PUT /api/update-EtatOffre` also exists in the spec
   * but is not used by this feature — the path variant is unambiguous.)
   */
  updateEtat(etat: StatusEnum, id: number): Observable<Offre> {
    const body: Offre = { id, etat };
    return this.http.put<Offre>(`/api/update-EtatOffre/${encodeURIComponent(etat)}`, body);
  }

  /**
   * `PATCH /api/update-state-offer/{id}/{offerStatusEnum}` — offer ID + enum
   * in the path, NO body. Response: generic object (200/404/500).
   * The most unambiguous state-change endpoint of the five documented.
   */
  updateStateById(id: number, offerStatusEnum: StatusEnum): Observable<unknown> {
    return this.http.patch<unknown>(
      `/api/update-state-offer/${id}/${encodeURIComponent(offerStatusEnum)}`,
      null
    );
  }

  /**
   * `PATCH /api/update_state_offre/{phone}` — state update for a client
   * phone. Body is REQUIRED and declared as `OffreDto`
   * (described only as "state payload" — spec gives no narrower shape, so the
   * full DTO type is used; include at least `etat`). Response: `OffreDto`.
   */
  updateStateByPhone(phone: string, body: OffreDto): Observable<OffreDto> {
    return this.http.patch<OffreDto>(
      `/api/update_state_offre/${encodeURIComponent(phone)}`,
      body
    );
  }

  /**
   * `PATCH /api/offers/{offreId}/route-text/{clientPhone}` — patch pickup /
   * destination human-readable labels (TGPS flow, no geocoding).
   * Response: `OffreDto`.
   */
  patchRouteText(
    offreId: number,
    clientPhone: string,
    body: OfferRouteTextPatchRequest
  ): Observable<OffreDto> {
    return this.http.patch<OffreDto>(
      `/api/offers/${offreId}/route-text/${encodeURIComponent(clientPhone)}`,
      body
    );
  }

  /**
   * `DELETE /api/cancel-offre/{offreId}` — optional `cancelledByTaxi` query
   * (default false). Response: `CancelBookingResponseDto`
   * (200/404/500 all declare it).
   */
  cancelOffre(offreId: number, cancelledByTaxi = false): Observable<CancelBookingResponseDto> {
    const params = new HttpParams().set('cancelledByTaxi', String(cancelledByTaxi));
    return this.http.delete<CancelBookingResponseDto>(`/api/cancel-offre/${offreId}`, { params });
  }

  /**
   * `DELETE /api/delete-Offre/{id}` — 200/400/500 declare `Offre`
   * (treated as unknown: delete responses are often empty in practice).
   */
  deleteOffre(id: number): Observable<unknown> {
    return this.http.delete<unknown>(`/api/delete-Offre/${id}`);
  }

  /**
   * `PUT /api/update-annulerOffres60minutes` — batch watchdog: cancel offers
   * older than 60 minutes ("Side effect: DB update", no params/body).
   * Admin ops action. (Spec oddly declares `Offre` as the 200 response.)
   */
  cancelStaleOffres(): Observable<unknown> {
    return this.http.put<unknown>('/api/update-annulerOffres60minutes', null);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Drop undefined/empty values, stringify the rest (HttpParams). */
  private static buildParams(search: OffreSearchParams): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
