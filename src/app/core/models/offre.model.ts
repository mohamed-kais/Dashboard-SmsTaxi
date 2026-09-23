/** Offre (ride offer) DTOs — transcribed verbatim from docs/API_REFERENCE.md (§6 Offers). */
import { ChannelType, PageableObject, SortObject, StatusEnum } from './common.model';
import { Client } from './client.model';
import { Taxi } from './taxi.model';

/** `Offre` entity schema (body of `PUT /api/update-offre` / state updates). */
export interface Offre {
  /** required */
  etat: StatusEnum;
  id?: number;
  type?: ChannelType;
  /** date-time */
  date_depot?: string;
  annulee_auto?: boolean;
  latitude?: number;
  longitude?: number;
  duration?: string;
  distance?: string;
  /** string per spec (not a number) */
  total_price?: string;
  info?: string;
  location_history?: string;
  destination_history?: string;
  rating?: number;
  comments?: string;
  realPrice?: number;
  variance?: number;
}

/** Offer DTO — `POST /api/ajouterOffre`, get/match/state endpoints. */
export interface OffreDto {
  id?: number;
  etat?: StatusEnum;
  taxi?: Taxi;
  client?: Client;
  taxiId?: number;
  clientId?: number;
  /** date-time */
  date_depot?: string;
  annulee_auto?: boolean;
  latitude?: number;
  longitude?: number;
  duration?: string;
  distance?: string;
  /** string per spec (not a number) */
  total_price?: string;
  info?: string;
  type?: ChannelType;
  locationHistory?: string;
  destinationHistory?: string;
  rating?: number;
  comments?: string;
  realPrice?: number;
  variance?: number;
}

/** Admin list-row DTO returned by `GET /api/get-allOffre` / `get-all-offres`. */
export interface OffreAdminDto {
  id?: number;
  etat?: StatusEnum;
  /** date-time */
  dateDepot?: string;
  /** string per spec (not a number) */
  totalPrice?: string;
  rating?: number;
  clientId?: number;
  clientNom?: string;
  clientPhone?: string;
  taxiId?: number;
  taxiNom?: string;
  taxiPhone?: string;
  location?: string;
  destination?: string;
}

/** 1-based history page returned by `GET /api/history-traffic-{taxi|client}/{phone}/page`. */
export interface OffreHistoryPageDto {
  /** 1-based */
  page?: number;
  limit?: number;
  total?: number;
  items?: OffreDto[];
}

/** Spring Page of `OffreAdminDto` (0-based paging). */
export interface PageOffreAdminDto {
  totalElements?: number;
  totalPages?: number;
  sort?: SortObject;
  size?: number;
  content?: OffreAdminDto[];
  number?: number;
  first?: boolean;
  numberOfElements?: number;
  pageable?: PageableObject;
  last?: boolean;
  empty?: boolean;
}
