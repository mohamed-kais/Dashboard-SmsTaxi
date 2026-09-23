/**
 * Demande (ride request) REST service — plan §5.4 (lane L4).
 *
 * Every endpoint below is transcribed from docs/API_REFERENCE.md §5 "Demands"
 * (method + path + params + response type). Paths are RELATIVE; the
 * ApiBaseUrlInterceptor prefixes `environment.apiBaseUrl` for any path that
 * starts with `/api/`.
 *
 * Conventions: plan §8 — `providedIn: 'root'`, HttpClient injected directly,
 * query params via HttpParams, DTO types imported from `core/models`.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Demande, DemandeDto, PageDemandeAdminDto } from '../models/demande.model';
import { CancelDemandeResponseDto, StatusEnum } from '../models/common.model';

/**
 * Query params of the admin search `GET /api/get-demande` (API_REFERENCE §5).
 * The spec also declares a required `pageable` ref — spec quirk: send flat
 * `page`/`size`/`sort` instead (see API_REFERENCE "Pagination pattern").
 */
export interface DemandeSearchParams {
  /** 0-based page */
  page?: number;
  size?: number;
  /** e.g. `date_depot,desc` (the only documented sort example) */
  sort?: string;
  /** exact demand ID */
  id?: number;
  /** `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm:ss` */
  dateDepotFrom?: string;
  /** `yyyy-MM-dd` or `yyyy-MM-dd'T'HH:mm:ss` */
  dateDepotTo?: string;
  /** status enum (8 values, "Global conventions") */
  etat?: StatusEnum;
  clientPhone?: string;
  /** contains, case-insensitive */
  clientNom?: string;
  /** pickup contains (from linked offer) */
  location?: string;
  /** destination contains (from linked offer) */
  destination?: string;
  /** price ≥ (from linked offer) */
  minEstimatedPrice?: number;
  /** price ≤ (from linked offer) */
  maxEstimatedPrice?: number;
}

@Injectable({ providedIn: 'root' })
export class DemandeService {
  constructor(private http: HttpClient) {}

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  /**
   * Admin search — `GET /api/get-demande`.
   *
   * SPEC AMBIGUITY #3 (API_REFERENCE "Notes / Ambiguities"): the 200 response
   * declares a bare `DemandeAdminDto`, but the description says "Page of
   * demandes" and 400/500 declare `ApiResponseDtoPageDemandeAdminDto`. The
   * real runtime shape is the Spring page wrapper, so the return type is
   * `PageDemandeAdminDto` — NOT `DemandeAdminDto`.
   */
  searchDemandes(params: DemandeSearchParams = {}): Observable<PageDemandeAdminDto> {
    return this.http.get<PageDemandeAdminDto>('/api/get-demande', {
      params: DemandeService.buildParams(params),
    });
  }

  /**
   * `GET /api/get-demande/{id}` — responses 200/404/500 → `Demande`
   * (entity: id, date_depot, etat, masquerNumero, date_smsMasquerNumero;
   * the declared schema carries NO client relation).
   */
  getDemandeById(id: number): Observable<Demande> {
    return this.http.get<Demande>(`/api/get-demande/${id}`);
  }

  /**
   * `GET /api/get-listDemandeParEtat/{etat}` → `Demande[]`.
   * `etat` is the 8-value English enum (the description's "EN_COURS" example
   * is stale — see API_REFERENCE ambiguity #1).
   */
  getDemandesByEtat(etat: StatusEnum | string): Observable<Demande[]> {
    return this.http.get<Demande[]>(`/api/get-listDemandeParEtat/${encodeURIComponent(String(etat))}`);
  }

  /** `GET /api/get-nombreDemandesParEtat/{etat}` → int64 count. */
  countDemandesByEtat(etat: StatusEnum | string): Observable<number> {
    return this.http.get<number>(`/api/get-nombreDemandesParEtat/${encodeURIComponent(String(etat))}`);
  }

  /** `GET /api/nbr-DemandeEnattente` → int32 (waiting demandes). */
  countWaiting(): Observable<number> {
    return this.http.get<number>('/api/nbr-DemandeEnattente');
  }

  /** `GET /api/nbr-NbrDemandeEncours` → int32 (in-progress demandes; doubled "Nbr" is as-declared). */
  countInProgress(): Observable<number> {
    return this.http.get<number>('/api/nbr-NbrDemandeEncours');
  }

  // -------------------------------------------------------------------------
  // Write
  // -------------------------------------------------------------------------

  /** `POST /api/add-demande` — body `DemandeDto`, response `DemandeDto`. */
  createDemande(dto: DemandeDto): Observable<DemandeDto> {
    return this.http.post<DemandeDto>('/api/add-demande', dto);
  }

  /** `PUT /api/update-demande` — body: full `Demande` entity (`etat` required), response `Demande`. */
  updateDemande(dto: Demande): Observable<Demande> {
    return this.http.put<Demande>('/api/update-demande', dto);
  }

  /**
   * `PUT /api/update-EtatDemande/{etat}` — new state in the PATH; body is a
   * `Demande` "with id" (required per description). `Demande.etat` is required
   * by the schema, so the new etat is echoed in the body as well.
   * Response: 200 with no declared body.
   */
  updateEtat(id: number, etat: StatusEnum): Observable<void> {
    const body: Demande = { id, etat };
    return this.http.put<void>(`/api/update-EtatDemande/${encodeURIComponent(etat)}`, body);
  }

  /**
   * `PUT /api/update-modifierEtatDemandeAffectee/{etat}` — affectee variant;
   * body `Demande` with id (pass it in `body`; falls back to `{ etat }`).
   *
   * PLAN §5.4 DISCREPANCY: the plan lists this endpoint as
   * `/api/update-EtatDemandeAffectee/{etat}` — that path does NOT exist in
   * API_REFERENCE.md. The documented (and used) path is
   * `update-modifierEtatDemandeAffectee`. → ROADMAP note.
   */
  updateEtatAffectee(etat: StatusEnum, body?: Demande): Observable<void> {
    return this.http.put<void>(
      `/api/update-modifierEtatDemandeAffectee/${encodeURIComponent(etat)}`,
      body ?? { etat }
    );
  }

  /**
   * `PATCH /api/update-state-demands/{phone}` — update state for ALL demandes
   * of a client phone. Body e.g. `{ "etat": "EXPIRED" }`.
   * SPEC AMBIGUITY #8: the body schema is untyped
   * (`additionalProperties: object`); the description is the only contract —
   * send exactly the `etat` field. Response: `DemandeDto`.
   */
  updateStateByPhone(phone: string, body: { etat: StatusEnum }): Observable<DemandeDto> {
    return this.http.patch<DemandeDto>(
      `/api/update-state-demands/${encodeURIComponent(phone)}`,
      body
    );
  }

  /**
   * `DELETE /api/cancel-demande/{demandeId}` — optional `cancelledByTaxi`
   * query (default false). Response: `CancelDemandeResponseDto`
   * (200/404/500 all declare it).
   */
  cancelDemande(demandeId: number, cancelledByTaxi = false): Observable<CancelDemandeResponseDto> {
    const params = new HttpParams().set('cancelledByTaxi', String(cancelledByTaxi));
    return this.http.delete<CancelDemandeResponseDto>(`/api/cancel-demande/${demandeId}`, { params });
  }

  /** `DELETE /api/delete-demande/{demande_id}` — 200/400/500 declare a generic object. */
  deleteDemande(demandeId: number): Observable<unknown> {
    return this.http.delete<unknown>(`/api/delete-demande/${demandeId}`);
  }

  /**
   * `PUT /api/update-annulerDemandes60minutes` — batch watchdog: cancel
   * demandes older than 60 minutes ("Side effect: DB update", no params/body).
   * Admin ops action.
   */
  cancelStaleDemandes(): Observable<void> {
    return this.http.put<void>('/api/update-annulerDemandes60minutes', null);
  }

  /**
   * `PUT /api/update-traiterDemandesParSMSMasquerNumero` — batch ops action,
   * no params/body ("Process demandes for SMS 'masquer numero' flow.
   * Side effect: DB update").
   *
   * ROADMAP: the exact DB side effect is prose-only in the spec (what counts
   * as "processed" is undefined) — callable but semantics need backend
   * confirmation before surfacing prominently in the UI.
   */
  processSmsMasquer(): Observable<void> {
    return this.http.put<void>('/api/update-traiterDemandesParSMSMasquerNumero', null);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /** Drop undefined/empty values, stringify the rest (HttpParams). */
  private static buildParams(params: DemandeSearchParams): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
