import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { MessageResponse } from '../models/common.model';
import { SmsIn, SmsInDto, SmsOut, SmsReceived } from '../models/sms.model';

/**
 * SMS resource service (plan §5.7 / §8, lane L6).
 *
 * Covers the SMS In tag (docs/API_REFERENCE.md §9), the Injection tag (§14)
 * and the advanced RabbitMQ sender. All paths are relative (`/api/...`); the
 * ApiBaseUrlInterceptor prefixes `environment.apiBaseUrl`.
 *
 * The spec documents TWO "add incoming SMS" endpoints that are format aliases
 * of the same use case (both kept here):
 *   - POST /api/add-sms     → `SmsReceived` body (Kannel/receiver format)
 *   - POST /api/ajouter-sms → `SmsIn` body (taxiMate format)
 */
@Injectable({ providedIn: 'root' })
export class SmsService {
  constructor(private http: HttpClient) {}

  /**
   * GET /api/get-all — list all SMS. Returns `SmsIn[]` (no server-side paging
   * on this endpoint; the list component paginates client-side).
   */
  getSmsList(): Observable<SmsIn[]> {
    return this.http.get<SmsIn[]>('/api/get-all');
  }

  /**
   * GET /api/get-listSMSnonTraites — SMS not yet processed
   * ("non traités"). Returns `SmsIn[]`.
   */
  getUntreatedSms(): Observable<SmsIn[]> {
    return this.http.get<SmsIn[]>('/api/get-listSMSnonTraites');
  }

  /**
   * GET /api/get-listSMSnonTraitesParTelephone/{numero_telephone} — untreated
   * SMS for one phone number. Returns `SmsIn[]`.
   */
  getUntreatedByPhone(numeroTelephone: string): Observable<SmsIn[]> {
    return this.http.get<SmsIn[]>(
      `/api/get-listSMSnonTraitesParTelephone/${encodeURIComponent(numeroTelephone)}`
    );
  }

  /**
   * GET /api/nbr-sms — total number of SMS (int32).
   * Used by the dashboard KPI as well as the SMS Log count chip (plan §5.1/§5.7).
   */
  countSms(): Observable<number> {
    return this.http.get<number>('/api/nbr-sms');
  }

  /**
   * PUT /api/update-sms — update an existing SMS; body is `SmsIn` with id
   * (spec §9: "Body: SmsIn with id"). 200 → `SmsIn`.
   *
   * Typed `SmsIn` (the spec's declared body for this endpoint) rather than
   * `SmsInDto` (which is the body of POST /api/inject-sms): every `SmsIn`
   * field is optional, so `SmsInDto` arguments remain assignable here, while
   * the reverse would not hold.
   */
  updateSms(dto: SmsIn): Observable<SmsIn> {
    return this.http.put<SmsIn>('/api/update-sms', dto);
  }

  /**
   * DELETE /api/delete-sms/{smsin_id} — delete an SMS by ID (int32 path param).
   * 200 → object.
   */
  deleteSms(smsinId: number): Observable<object> {
    return this.http.delete<object>(`/api/delete-sms/${smsinId}`);
  }

  /**
   * POST /api/add-sms — add an incoming SMS in Kannel/receiver format.
   * Body `SmsReceived` ({ id, message, received_at, sender, traitement });
   * 200/400/500 all declare `SmsReceived`.
   *
   * Alias relationship: `receiveSmsAlt` below posts the taxiMate-format twin
   * of this same "incoming SMS" use case.
   */
  receiveSms(dto: SmsReceived): Observable<SmsReceived> {
    return this.http.post<SmsReceived>('/api/add-sms', dto);
  }

  /**
   * POST /api/ajouter-sms — add an SMS in taxiMate format (body `SmsIn`:
   * { id, contenu, date_reception, telephone, traitement }).
   * Alias of `receiveSms` (POST /api/add-sms) with the other documented body
   * format — both are kept because the spec declares both.
   */
  receiveSmsAlt(dto: SmsIn): Observable<SmsIn> {
    return this.http.post<SmsIn>('/api/ajouter-sms', dto);
  }

  /**
   * POST /api/inject-sms — inject an SMS into the DB (testing / external SMS
   * gateway). Body `SmsInDto` (contenu ≤1000 required, telephone required with
   * pattern `^[0-9+\-\s()]+$`, dateReception/ traitement/id optional).
   * ALL statuses (200/400/500) return `MessageResponse` ({ message }).
   * This is the endpoint the SMS injection form uses.
   */
  injectSms(dto: SmsInDto): Observable<MessageResponse> {
    return this.http.post<MessageResponse>('/api/inject-sms', dto);
  }

  /**
   * POST /api/rabbitMQSender — publish an SMS (`SmsOut`: { id, contenu,
   * date_envoi, telephone }) to the RabbitMQ queue `sms-out`. 200 → string
   * ("Message sent to RabbitMQ").
   *
   * Advanced queue endpoint: declared by the spec but not wired to any
   * dashboard UI (no form needs it yet) — service method only.
   */
  sendToRabbitMq(payload?: SmsOut): Observable<string> {
    return this.http.post<string>('/api/rabbitMQSender', payload ?? {});
  }
}
