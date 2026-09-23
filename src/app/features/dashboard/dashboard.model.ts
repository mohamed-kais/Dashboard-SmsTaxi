/**
 * Dashboard view model — plan §5.1 (docs/IMPLEMENTATION_PLAN.md).
 *
 * Lane L7 has no service of its own: every value comes from other lanes'
 * services (Taxi/Client/Demande/Offre/Sms, all `providedIn: 'root'`). These
 * interfaces only shape the dashboard's local view state.
 */

/**
 * Count channels — one field per documented `nbr-*` count endpoint
 * (docs/API_REFERENCE.md §2 Quick Reference).
 */
export interface DashboardCounts {
  /** `GET /api/nbr-taxi` — total taxis. */
  taxi?: number;
  /** `GET /api/nbr-client` — total clients. */
  client?: number;
  /** `GET /api/nbr-DemandeEnattente` — demands waiting. */
  demandeWaiting?: number;
  /** `GET /api/nbr-NbrDemandeEncours` — demands in progress. */
  demandeInProgress?: number;
  /** `GET /api/NbrOffreEnattente` — offers waiting. */
  offreWaiting?: number;
  /** `GET /api/NbrOffreEncours` — offers in progress. */
  offreInProgress?: number;
  /** `GET /api/nbr-sms` — total SMS received. */
  sms?: number;
}

/** Keys of {@link DashboardCounts} (used as the per-card value channel). */
export type DashboardCountKey = keyof DashboardCounts;