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