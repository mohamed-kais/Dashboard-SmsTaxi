/**
 * Clients feature — small shared constants/helpers (no Angular imports).
 *
 * Phone pattern: the spec documents `^[0-9+\-\s()]+$` for telephone fields
 * (TaxiCreateDto, SmsInDto). ClientCreateDto declares no pattern specifically
 * (API_REFERENCE gap — see report), so the documented shared pattern is reused.
 */
import { ChannelType } from '../../core/models/common.model';

/** Regex used for the `telephone` form control (matches the spec's phone pattern). */
export const CLIENT_PHONE_PATTERN = '^[0-9+\\-\\s()]+$';

/** `type` enum options for the add/edit form (`ChannelType` from common.model). */
export const CLIENT_TYPE_OPTIONS: readonly ChannelType[] = [
  'GSM',
  'SMART',
  'WHATSAPP',
  'WHATSAPP_AR',
];

/**
 * Best-effort error message extraction from an HTTP failure.
 * The kept ErrorInterceptor rethrows `err.error.message`; the backend's error
 * shape is `ErrorResponseDto` (message field) — handle both.
 */
export function apiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as {
      error?: { message?: string };
      message?: string;
    };
    if (e.error && typeof e.error.message === 'string' && e.error.message) {
      return e.error.message;
    }
    if (typeof e.message === 'string' && e.message) {
      return e.message;
    }
  }
  return '';
}