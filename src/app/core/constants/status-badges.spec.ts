import {
  ASSIGNMENT_STATUS,
  DEMANDE_STATUS,
  DEMANDE_ETAT,
  NOTIFICATION_TYPE,
  OFFRE_ETAT,
  OFFRE_STATUS,
  RESERVATION_STATUS,
  SOURCE_LABEL,
  statusBadge,
  TAXI_STATUS,
  TAXI_STATUS_VALUES,
} from './status-badges';
import { StatusEnum } from '../models/common.model';

/**
 * Pure-function spec for the single app-wide status-badge scheme (plan §7).
 * No TestBed / no DOM: verifies the map completeness and the fallback behavior
 * of `statusBadge()`.
 */
describe('statusBadge (core/constants/status-badges)', () => {
  it('returns the raw value as label and the mapped class', () => {
    expect(statusBadge('WAITING', DEMANDE_STATUS)).toEqual({
      label: 'WAITING',
      class: 'badge-soft-warning',
    });
    expect(statusBadge('APPROVED', TAXI_STATUS)).toEqual({
      label: 'APPROVED',
      class: 'badge-soft-success',
    });
  });

  it('falls back to badge-soft-secondary for unknown keys', () => {
    expect(statusBadge('UNKNOWN' as StatusEnum, DEMANDE_STATUS).class).toBe('badge-soft-secondary');
    expect(statusBadge('UNKNOWN' as StatusEnum, DEMANDE_STATUS).label).toBe('UNKNOWN');
  });

  it('covers every StatusEnum value in DEMANDE_STATUS and OFFRE_STATUS', () => {
    const check = (map: typeof DEMANDE_STATUS): void => {
      for (const etat of DEMANDE_ETAT) {
        expect(map[etat]).toBeDefined();
        expect(map[etat]).toMatch(/^badge-soft-/);
      }
    };
    check(DEMANDE_STATUS);
    check(OFFRE_STATUS);
    expect(OFFRE_ETAT).toEqual(DEMANDE_ETAT);
  });

  it('covers every TaxiStatus value in TAXI_STATUS', () => {
    expect(Object.keys(TAXI_STATUS).sort()).toEqual(TAXI_STATUS_VALUES.slice().sort());
    for (const value of TAXI_STATUS_VALUES) {
      expect(TAXI_STATUS[value]).toMatch(/^badge-soft-/);
    }
  });

  it('covers the full reservation status and assignment status unions', () => {
    expect(Object.keys(RESERVATION_STATUS).sort()).toEqual([
      'ACCEPTED', 'ASSIGNED', 'CANCELLED', 'COMPLETED', 'CONFIRMED',
      'CREATED', 'EXPIRED', 'IN_PROGRESS', 'WAITING_DRIVER',
    ].sort());
    expect(Object.keys(ASSIGNMENT_STATUS).sort()).toEqual([
      'ACTIVE', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'PENDING', 'REPLACED',
    ].sort());
  });

  it('maps every NotificationType value with a distinct class', () => {
    expect(NOTIFICATION_TYPE).toEqual({
      INFO: 'badge-soft-info',
      WARNING: 'badge-soft-warning',
      ERROR: 'badge-soft-danger',
    });
  });

  it('provides human labels for every reservation source', () => {
    expect(SOURCE_LABEL).toEqual({
      WHATSAPP: 'WhatsApp',
      SMS: 'SMS',
      MOBILE_APP: 'Mobile App',
      DASHBOARD: 'Dashboard',
    });
  });

  it('status classes are all valid badge-soft-* values', () => {
    const allClasses = [
      ...Object.values(DEMANDE_STATUS),
      ...Object.values(OFFRE_STATUS),
      ...Object.values(TAXI_STATUS),
      ...Object.values(RESERVATION_STATUS),
      ...Object.values(ASSIGNMENT_STATUS),
      ...Object.values(NOTIFICATION_TYPE),
    ];
    for (const cls of allClasses) {
      expect(cls).toMatch(/^badge-soft-(primary|secondary|success|info|warning|danger|pink|light|dark)$/);
    }
  });
});