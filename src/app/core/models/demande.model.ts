/** Demande (ride request) DTOs — transcribed verbatim from docs/API_REFERENCE.md (§5 Demands). */
import { PageableObject, SortObject, StatusEnum } from './common.model';
import { Client } from './client.model';

/** `Demande` entity schema (used as body of `PUT /api/update-demande` etc.). */
export interface Demande {
  /** required */
  etat: StatusEnum;
  id?: number;
  /** date-time */
  date_depot?: string;
  masquerNumero?: boolean;
  /** date-time */
  date_smsMasquerNumero?: string;
}

/** Demande DTO — `POST /api/add-demande`, `PATCH /api/update-state-demands/{phone}`. */
export interface DemandeDto {
  id?: number;
  /** date-time */
  date_depot?: string;
  etat?: StatusEnum;
  masquerNumero?: boolean;
  /** date-time */
  date_smsMasquerNumero?: string;
  client?: Client;
}

/** Admin list-row DTO returned by `GET /api/get-demande`. */
export interface DemandeAdminDto {
  id?: number;
  etat?: StatusEnum;
  /** date-time */
  dateDepot?: string;
  clientId?: number;
  clientNom?: string;
  clientPhone?: string;
  location?: string;
  destination?: string;
  /** string per spec (not a number) */
  estimatedPrice?: string;
  assignedTaxiId?: number;
  assignedTaxiNom?: string;
  assignedTaxiPhone?: string;
  /** free-form string ("from Redis state") */
  broadcastStatus?: string;
}

/** Spring Page of `DemandeAdminDto` (0-based paging). */
export interface PageDemandeAdminDto {
  totalElements?: number;
  totalPages?: number;
  sort?: SortObject;
  size?: number;
  content?: DemandeAdminDto[];
  number?: number;
  first?: boolean;
  numberOfElements?: number;
  pageable?: PageableObject;
  last?: boolean;
  empty?: boolean;
}
