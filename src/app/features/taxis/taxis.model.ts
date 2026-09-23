/**
 * Taxis feature view-models — plan §5.2 "taxis.model.ts".
 *
 * All wire DTOs live in `core/models/taxi.model.ts` / `offre.model.ts` /
 * `rating.model.ts` (feature lanes never redefine shared entities, plan §1.5);
 * this file only holds component-local view types.
 */
import { TaxiStatus } from '../../core/models/common.model';

/** Toolbar status filter of the taxis list (`''` = all statuses). */
export type TaxiStatusFilter = TaxiStatus | '';

/** Page-title breadcrumb item shape (matches the template's `app-page-title` input). */
export interface BreadcrumbItem {
  label: string;
  active?: boolean;
}