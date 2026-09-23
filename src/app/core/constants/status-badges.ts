/**
 * Status badge scheme — plan §7 (docs/IMPLEMENTATION_PLAN.md), ONE scheme app-wide.
 *
 * Classes are `badge-soft-*`, generated in `src/assets/scss/custom/components/_badge.scss`
 * for every `$theme-colors` entry (primary/secondary/success/info/warning/danger/pink/light/dark)
 * and used throughout the template (e.g. `<span class="badge badge-soft-success">`).
 */
import {
  AssignmentStatus,
  ReservationSource,
  ReservationStatus,
  StatusEnum,
  TaxiStatus,
} from '../models/common.model';

// ---------------------------------------------------------------------------
// Map types (single shared shape per union)
// ---------------------------------------------------------------------------

/** Value → `badge-soft-*` class map for a status union. */
export type StatusBadgeMap<K extends string> = Readonly<Record<K, string>>;

/** Demande/Offre `etat` (8-value union) badge map. */
export type EtatStatusBadgeMap = StatusBadgeMap<StatusEnum>;
/** `taxiStatus` (3-value union) badge map. */
export type TaxiStatusBadgeMap = StatusBadgeMap<TaxiStatus>;
/** Reservation `status` (9-value union) badge map. */
export type ReservationStatusBadgeMap = StatusBadgeMap<ReservationStatus>;
/** Assignment `status` (6-value union) badge map. */
export type AssignmentStatusBadgeMap = StatusBadgeMap<AssignmentStatus>;
/** Reservation `source` → human label (label-only text badges, plan §7). */
export type SourceLabelMap = Readonly<Record<ReservationSource, string>>;

/** Result of {@link statusBadge}. */
export interface StatusBadge {
  label: string;
  class: string;
}

// ---------------------------------------------------------------------------
// Badge maps (plan §7 table)
// ---------------------------------------------------------------------------

/** Demande `etat` → badge class. */
export const DEMANDE_STATUS: EtatStatusBadgeMap = {
  WAITING: 'badge-soft-warning',
  STARTED: 'badge-soft-info',
  IN_PROGRESS: 'badge-soft-info',
  TERMINATED: 'badge-soft-success',
  CANCELLED: 'badge-soft-danger',
  CANCELLED_BY_CLIENT: 'badge-soft-danger',
  CANCELLED_BY_TAXI: 'badge-soft-danger',
  EXPIRED: 'badge-soft-secondary',
};

/** Offre `etat`/`etatOffre` → badge class (same scheme as DEMANDE_STATUS). */
export const OFFRE_STATUS: EtatStatusBadgeMap = {
  WAITING: 'badge-soft-warning',
  STARTED: 'badge-soft-info',
  IN_PROGRESS: 'badge-soft-info',
  TERMINATED: 'badge-soft-success',
  CANCELLED: 'badge-soft-danger',
  CANCELLED_BY_CLIENT: 'badge-soft-danger',
  CANCELLED_BY_TAXI: 'badge-soft-danger',
  EXPIRED: 'badge-soft-secondary',
};

/** `taxiStatus` → badge class. */
export const TAXI_STATUS: TaxiStatusBadgeMap = {
  APPROVED: 'badge-soft-success',
  PENDING: 'badge-soft-warning',
  REJECTED: 'badge-soft-danger',
};

/** Reservation `status` → badge class. */
export const RESERVATION_STATUS: ReservationStatusBadgeMap = {
  CREATED: 'badge-soft-secondary',
  CONFIRMED: 'badge-soft-info',
  WAITING_DRIVER: 'badge-soft-warning',
  ASSIGNED: 'badge-soft-info',
  ACCEPTED: 'badge-soft-success',
  IN_PROGRESS: 'badge-soft-info',
  COMPLETED: 'badge-soft-success',
  CANCELLED: 'badge-soft-danger',
  EXPIRED: 'badge-soft-secondary',
};

/** Assignment `status` → badge class. */
export const ASSIGNMENT_STATUS: AssignmentStatusBadgeMap = {
  PENDING: 'badge-soft-warning',
  ACTIVE: 'badge-soft-success',
  REPLACED: 'badge-soft-info',
  CANCELLED: 'badge-soft-danger',
  COMPLETED: 'badge-soft-success',
  EXPIRED: 'badge-soft-secondary',
};

/** Reservation `source` → display label (label-only; no color scheme per plan §7). */
export const SOURCE_LABEL: SourceLabelMap = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  MOBILE_APP: 'Mobile App',
  DASHBOARD: 'Dashboard',
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Resolve `{ label, class }` for a status value.
 * `label` is the raw enum value; unknown values fall back to `badge-soft-secondary`.
 */
export function statusBadge<K extends string>(
  key: K,
  map: Readonly<Record<K, string>>
): StatusBadge {
  return { label: key, class: map[key] ?? 'badge-soft-secondary' };
}

// ---------------------------------------------------------------------------
// Union value arrays (for dropdown filters)
// ---------------------------------------------------------------------------

/** All Demande `etat` values. */
export const DEMANDE_ETAT: readonly StatusEnum[] = [
  'TERMINATED',
  'WAITING',
  'IN_PROGRESS',
  'STARTED',
  'CANCELLED',
  'CANCELLED_BY_CLIENT',
  'CANCELLED_BY_TAXI',
  'EXPIRED',
];

/** All Offre `etat` values (same set as DEMANDE_ETAT). */
export const OFFRE_ETAT: readonly StatusEnum[] = [
  'TERMINATED',
  'WAITING',
  'IN_PROGRESS',
  'STARTED',
  'CANCELLED',
  'CANCELLED_BY_CLIENT',
  'CANCELLED_BY_TAXI',
  'EXPIRED',
];

/**
 * All `taxiStatus` values.
 * Named `TAXI_STATUS_VALUES` (not `TAXI_STATUS`) because `TAXI_STATUS` is taken
 * by the plan §7 badge map above.
 */
export const TAXI_STATUS_VALUES: readonly TaxiStatus[] = [
  'APPROVED',
  'PENDING',
  'REJECTED',
];
