/** Taxi DTOs — transcribed verbatim from docs/API_REFERENCE.md (§3 Taxis). */
import {
  ChannelPreference,
  ChannelType,
  PageableObject,
  SortObject,
  StatusEnum,
  TaxiStatus,
} from './common.model';
import { Offre } from './offre.model';

/** `Taxi` entity schema (snake_case field names as declared by the spec). */
export interface Taxi {
  /** required */
  telephone: string;
  id?: number;
  contenu?: string;
  traitement?: boolean;
  latitude?: number;
  longitude?: number;
  nom?: string;
  numero_matricule?: string;
  numero_cin?: string;
  constructeur?: string;
  numero_taxi?: string;
  masquerNumero?: boolean;
  email?: string;
  sms_winek?: boolean;
  date_sms_winek?: string;
  date_enregistrement?: string;
  type?: ChannelType;
  destination?: string;
  location?: string;
  lat_gps?: number;
  lng_gps?: number;
  taxiStatus?: TaxiStatus;
  channelPreference?: ChannelPreference;
  dateEnregistrement?: string;
}

/** Main taxi DTO — responses of get/add/update taxi endpoints. */
export interface TaxiDto {
  id?: number;
  contenu?: string;
  telephone?: string;
  traitement?: boolean;
  latitude?: number;
  longitude?: number;
  nom?: string;
  numeroMatricule?: string;
  numeroCin?: string;
  constructeur?: string;
  numeroTaxi?: string;
  masquerNumero?: boolean;
  email?: string;
  smsWinek?: boolean;
  dateSmsWinek?: string;
  /** date-time */
  dateEnregistrement?: string;
  etat?: StatusEnum;
  type?: ChannelType;
  destination?: string;
  location?: string;
  offres?: Offre[];
  latGps?: number;
  lngGps?: number;
  taxiStatus?: TaxiStatus;
  rating?: number;
}

/** Request body of `POST /api/add-taxi` (+ aliases) and `PATCH /api/update-taxi/{id}`. */
export interface TaxiCreateDto {
  /** required — pattern `^[0-9+\-\s()]+$` */
  telephone: string;
  /** maxLength 1000 */
  contenu?: string;
  /** maxLength 100 */
  nom?: string;
  /** maxLength 50 */
  numeroMatricule?: string;
  /** maxLength 20 */
  numeroCin?: string;
  /** maxLength 50 */
  constructeur?: string;
  /** maxLength 20 */
  numeroTaxi?: string;
  email?: string;
  type?: ChannelType;
  /** maxLength 500 */
  destination?: string;
  /** maxLength 500 */
  location?: string;
  taxiStatus?: TaxiStatus;
}

/** Request body of `PATCH /api/update_gps/{taxiID}`. */
export interface LocationUpdateDto {
  /** required, −90…90 */
  latitude: number;
  /** required, −180…180 */
  longitude: number;
  bearing?: number;
}

/** List-row DTO returned by `GET /api/get-all-taxis` (+ criteria variant). */
export interface GetAllTaxisDtoResponse {
  id?: number;
  contenu?: string;
  telephone?: string;
  traitement?: boolean;
  nom?: string;
  numeroMatricule?: string;
  numeroCin?: string;
  constructeur?: string;
  numeroTaxi?: string;
  email?: string;
  type?: ChannelType;
  taxiStatus?: TaxiStatus;
  rating?: number;
}

/** Spring Page of `GetAllTaxisDtoResponse` (0-based paging). */
export interface PageGetAllTaxisDtoResponse {
  totalElements?: number;
  totalPages?: number;
  sort?: SortObject;
  size?: number;
  content?: GetAllTaxisDtoResponse[];
  number?: number;
  first?: boolean;
  numberOfElements?: number;
  pageable?: PageableObject;
  last?: boolean;
  empty?: boolean;
}
