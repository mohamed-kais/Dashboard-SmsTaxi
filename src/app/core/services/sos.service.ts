import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * SOS resource service (plan §5.8 / §8, lane L6).
 *
 * The spec (docs/API_REFERENCE.md §12 SOS) documents EXACTLY ONE endpoint —
 * there is no SOS list / live feed / acknowledge endpoint. That gap is noted
 * for ROADMAP; this service therefore exposes only the documented trigger.
 */
@Injectable({ providedIn: 'root' })
export class SosService {
  constructor(private http: HttpClient) {}

  /**
   * POST /api/sosNotification/{id} — trigger the SOS notification for the taxi
   * with the given (int32) ID; the backend sends an SMS. No request body is
   * declared in the spec. Responses: 200 → string ("SMS sent successfully"),
   * 404 → string ("Taxi not found"), 500 → string.
   */
  notifySos(id: number): Observable<string> {
    return this.http.post<string>(`/api/sosNotification/${id}`, null);
  }
}
