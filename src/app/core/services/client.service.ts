import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Client, ClientCreateDto, ClientDto, UpdateClientLocations } from '../models/client.model';
import { OffreHistoryPageDto } from '../models/offre.model';
import { Direction, StatusEnum } from '../models/common.model';

/**
 * Client resource service (plan §5.3 / §8).
 *
 * All paths are relative (`/api/...`); the ApiBaseUrlInterceptor prefixes
 * `environment.apiBaseUrl`. Endpoints and DTOs are exactly as declared in
 * docs/API_REFERENCE.md §4 Clients — nothing invented.
 */
@Injectable({ providedIn: 'root' })
export class ClientService {
  constructor(private http: HttpClient) {}

  /**
   * GET /api/get-allClients — all clients (admin/bulk). Returns `ClientDto[]`.
   */
  getClients(): Observable<ClientDto[]> {
    return this.http.get<ClientDto[]>('/api/get-allClients');
  }

  /**
   * GET /api/get-client/{client-id} — single client by (int32) ID.
   */
  getClientById(id: number): Observable<ClientDto> {
    return this.http.get<ClientDto>(`/api/get-client/${id}`);
  }

  /**
   * GET /api/get-Clientby-phone/{phone} — SINGLE client by phone
   * (login/session lookup). Returns one object, not a list.
   */
  getClientByPhone(phone: string): Observable<ClientDto> {
    return this.http.get<ClientDto>(
      `/api/get-Clientby-phone/${encodeURIComponent(phone)}`
    );
  }

  /**
   * Canonical list-by-phone lookup.
   * GET /api/get-clientbyphone/{telephone} — all clients matching a telephone
   * (`ClientDto[]`, possibly empty).
   *
   * Alias: GET /api/get-Clientnumero_telephone/{numero_telephone} (identical
   * list lookup, declared "Same as get-Clientnumero_telephone" in the spec).
   */
  getClientsByPhone(telephone: string): Observable<ClientDto[]> {
    return this.http.get<ClientDto[]>(
      `/api/get-clientbyphone/${encodeURIComponent(telephone)}`
    );
  }

  /**
   * GET /api/nbr-client — total number of clients (int32; admin stats).
   */
  getClientCount(): Observable<number> {
    return this.http.get<number>('/api/nbr-client');
  }

  /**
   * POST /api/add-client — register a new client.
   *
   * The GPS aliases POST /api/add-clientgps and POST /api/add_client_gps share
   * the same `ClientCreateDto` body; per API_REFERENCE ambiguity #4 they declare
   * NO latitude/longitude fields — do not send GPS fields on any of the three.
   */
  createClient(dto: ClientCreateDto): Observable<ClientDto> {
    return this.http.post<ClientDto>('/api/add-client', dto);
  }

  /**
   * PUT /api/update-client/{client_id} — update a client profile by ID.
   * Body is `ClientDto` per spec ("Use after user edits profile in app").
   */
  updateClient(id: number, dto: ClientDto): Observable<ClientDto> {
    return this.http.put<ClientDto>(`/api/update-client/${id}`, dto);
  }

  /**
   * PATCH /api/update-client-by-phone/{phone} — update current location and/or
   * destination by phone. Body is `UpdateClientLocations` ({ destination, location }).
   */
  updateClientByPhone(phone: string, dto: UpdateClientLocations): Observable<ClientDto> {
    return this.http.patch<ClientDto>(
      `/api/update-client-by-phone/${encodeURIComponent(phone)}`,
      dto
    );
  }

  /**
   * DELETE /api/delete-client/{client_id} — delete by ID; returns the deleted
   * `Client` entity per spec (200 → `Client`).
   */
  deleteClient(id: number): Observable<Client> {
    return this.http.delete<Client>(`/api/delete-client/${id}`);
  }

  /**
   * GET /api/history-traffic-client/{phone}/page — paginated client ride history.
   * `page` is 1-based (default 1), `limit` default 20. Optional filters from the
   * taxi/client history spec (§6): from/to, month, year, status, q, sort, direction
   * (ASC/DESC, default DESC). Only provided filters are sent as query params.
   */
  getRideHistory(
    phone: string,
    page = 1,
    limit = 20,
    filters: {
      from?: string;
      to?: string;
      month?: number;
      year?: number;
      status?: StatusEnum;
      q?: string;
      sort?: string;
      direction?: Direction;
    } = {}
  ): Observable<OffreHistoryPageDto> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    const f = filters;
    if (f.from) {
      params = params.set('from', f.from);
    }
    if (f.to) {
      params = params.set('to', f.to);
    }
    if (f.month !== undefined && f.month !== null) {
      params = params.set('month', String(f.month));
    }
    if (f.year !== undefined && f.year !== null) {
      params = params.set('year', String(f.year));
    }
    if (f.status) {
      params = params.set('status', f.status);
    }
    if (f.q) {
      params = params.set('q', f.q);
    }
    if (f.sort) {
      params = params.set('sort', f.sort);
    }
    if (f.direction) {
      params = params.set('direction', f.direction);
    }

    return this.http.get<OffreHistoryPageDto>(
      `/api/history-traffic-client/${encodeURIComponent(phone)}/page`,
      { params }
    );
  }
}