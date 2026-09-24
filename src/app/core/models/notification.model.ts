/**
 * Notification resource models — transcribed verbatim from the notifications
 * backend OpenAPI spec (swagger "Notifications" tag, dev server
 * `http://41.225.11.231:8444/taxi-client`).
 *
 * NOTE — spec quirk: the request schema declares `targetIds` as an ARRAY of
 * strings, while the response schema declares a single `targetIds` string.
 * Both are kept verbatim (no normalization of that field).
 */
import { PageableObject, SortObject } from './common.model';

// ---------------------------------------------------------------------------
// Enum unions
// ---------------------------------------------------------------------------

/** Notification severity/kind. */
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR';

/** Delivery channel. */
export type NotificationChannel = 'SMS' | 'EMAIL' | 'PUSH' | 'WHATSAPP';

/** Recipient scope. */
export type NotificationTargetType =
  | 'CLIENT'
  | 'TAXI'
  | 'ADMIN'
  | 'ANY_TAXI'
  | 'ANYONE';

// ---------------------------------------------------------------------------
// Response DTO (read-only)
// ---------------------------------------------------------------------------

/**
 * `NotificationDto` — response schema. Read-only: the backend exposes no
 * update/mark-as-read endpoints (see NotificationService read state).
 */
export interface NotificationDto {
  /** int64 */
  id: number;
  title?: string;
  message?: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  targetType?: NotificationTargetType;
  /** single string (per spec response schema). */
  targetIds?: string;
  /** date-time */
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Request DTO (POST body)
// ---------------------------------------------------------------------------

/** `SendNotificationRequest` — body of `POST /api/notifications/send*`. */
export interface SendNotificationRequest {
  /** optional per spec `required[]`. */
  title?: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  targetType: NotificationTargetType;
  /** string[] (array) — per spec request schema. */
  targetIds: string[];
}

// ---------------------------------------------------------------------------
// Page wrapper (Spring Page shape over NotificationDto)
// ---------------------------------------------------------------------------

/** Spring `Page<NotificationDto>` — shape returned by the filter endpoints. */
export interface PageNotificationDto {
  /** int64 */
  totalElements: number;
  /** int32 */
  totalPages: number;
  sort?: SortObject;
  /** int32 */
  size: number;
  content: NotificationDto[];
  /** int32 */
  number: number;
  first: boolean;
  /** int32 */
  numberOfElements: number;
  pageable?: PageableObject;
  last: boolean;
  empty: boolean;
}

// ---------------------------------------------------------------------------
// Recipient picker rows (notification-domain criteria endpoints, base URL
// `environment.notificationsBaseUrl` — a DIFFERENT taxi database than the
// main `apiBaseUrl`, so picker ids must come from here)
// ---------------------------------------------------------------------------

/** Minimal taxi row of the `GET /api/get-all-taxis-criteria` page content. */
export interface NotificationTaxiRow {
  id: number;
  nom: string;
  telephone: string;
  numeroMatricule?: string;
  numeroTaxi?: string;
  taxiStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
}

/** Minimal client row of the `GET /api/get-all-clients-criteria` page content. */
export interface NotificationClientRow {
  id: number;
  nom: string;
  telephone: string;
  email?: string;
  etat?: string;
  type?: string;
}

/** Spring page slice over `NotificationTaxiRow` (only the fields we consume). */
export interface PageNotificationTaxi {
  content: NotificationTaxiRow[];
  /** int64 */
  totalElements: number;
  /** int32 */
  totalPages: number;
  /** int32 */
  size: number;
  /** int32 */
  number: number;
}

/**
 * `GET /api/get-all-taxis-criteria` response wrapper — NESTED: the Spring page
 * lives under `taxis`; `stats` carries aggregate counters we do not consume.
 */
export interface GetAllTaxisCriteriaResponse {
  taxis: PageNotificationTaxi;
  stats?: Record<string, unknown>;
}

/**
 * `GET /api/get-all-clients-criteria` response — FLAT Spring page over
 * `NotificationClientRow` (only the fields we consume).
 */
export interface PageNotificationClientDto {
  content: NotificationClientRow[];
  /** int64 */
  totalElements: number;
  /** int32 */
  totalPages: number;
  /** int32 */
  size: number;
  /** int32 */
  number: number;
}