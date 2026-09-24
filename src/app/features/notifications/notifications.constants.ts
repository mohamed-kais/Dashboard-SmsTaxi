/**
 * Notifications feature — shared constants/helpers (no Angular imports).
 */
import {
  NotificationChannel,
  NotificationTargetType,
  NotificationType,
} from '../../core/models/notification.model';

/** `NotificationType` options for the send-form type select. */
export const NOTIFICATION_TYPES: readonly NotificationType[] = ['INFO', 'WARNING', 'ERROR'];

/** `NotificationChannel` options for the send-form channel select. */
export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  'SMS',
  'EMAIL',
  'PUSH',
  'WHATSAPP',
];

/** `NotificationTargetType` options for the send-form target-scope select. */
export const NOTIFICATION_TARGET_TYPES: readonly NotificationTargetType[] = [
  'CLIENT',
  'TAXI',
  'ADMIN',
  'ANY_TAXI',
  'ANYONE',
];

/**
 * Best-effort error message extraction from an HTTP failure.
 *
 * The kept ErrorInterceptor rethrows `err.error.message || err.statusText` (a
 * STRING), while raw backend bodies are `ErrorResponseDto`-shaped
 * ({ message }). Handle all three shapes (mirrors sms-log/settings helpers).
 */
export function apiErrorMessage(err: unknown): string {
  if (typeof err === 'string') {
    return err;
  }
  if (err && typeof err === 'object') {
    const e = err as {
      error?: { message?: string };
      message?: string;
    };
    if (typeof e.error?.message === 'string' && e.error.message) {
      return e.error.message;
    }
    if (typeof e.message === 'string' && e.message) {
      return e.message;
    }
  }
  return '';
}