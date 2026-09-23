/** SMS DTOs — transcribed verbatim from docs/API_REFERENCE.md (§9 SMS In, §14 Injection). */

/** `SmsReceived` — body of `POST /api/add-sms` (Kannel/receiver format). */
export interface SmsReceived {
  id?: number;
  message?: string;
  /** date-time */
  received_at?: string;
  sender?: string;
  traitement?: boolean;
}

/** `SmsIn` — body of `POST /api/ajouter-sms`; list element of `GET /api/get-all` etc. */
export interface SmsIn {
  id?: number;
  contenu?: string;
  /** date-time */
  date_reception?: string;
  telephone?: string;
  traitement?: boolean;
}

/** `SmsInDto` — body of `POST /api/inject-sms`. */
export interface SmsInDto {
  /** required, ≤1000 */
  contenu: string;
  /** required, pattern `^[0-9+\-\s()]+$` */
  telephone: string;
  /** date-time, optional */
  dateReception?: string;
  traitement?: boolean;
  id?: number;
}

/** `SmsOut` — body of `POST /api/rabbitMQSender` (queue `sms-out`). */
export interface SmsOut {
  id?: number;
  contenu?: string;
  /** date-time */
  date_envoi?: string;
  telephone?: string;
}
