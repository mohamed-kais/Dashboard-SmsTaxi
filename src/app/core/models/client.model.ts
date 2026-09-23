/** Client DTOs — transcribed verbatim from docs/API_REFERENCE.md (§4 Clients). */
import { ChannelType, StatusEnum } from './common.model';

/**
 * `Client` entity schema (snake_case field names as declared by the spec).
 * Referenced by `DemandeDto.client` and `OffreDto.client`.
 */
export interface Client {
  id?: number;
  telephone?: string;
  date_enregistrement?: string;
  contenu?: string;
  masquerNumero?: boolean;
  latitude?: number;
  longitude?: number;
  traitement?: boolean;
  etat?: StatusEnum;
  email?: string;
  destination?: string;
  location?: string;
  dest_latitude?: number;
  dest_longitude?: number;
  name?: string;
  type?: ChannelType;
}

/** Main client DTO — responses of get/add/update client endpoints (camelCase). */
export interface ClientDto {
  id?: number;
  longitude?: number;
  latitude?: number;
  telephone?: string;
  /** date-time */
  dateEnregistrement?: string;
  contenu?: string;
  masquerNumero?: boolean;
  traitement?: boolean;
  etat?: StatusEnum;
  email?: string;
  destination?: string;
  location?: string;
  destLatitude?: number;
  destLongitude?: number;
  type?: ChannelType;
}

/**
 * Request body of `POST /api/add-client` (+ `add-clientgps` / `add_client_gps`
 * aliases — note: no GPS fields in the schema, see API_REFERENCE ambiguity #4).
 */
export interface ClientCreateDto {
  telephone?: string;
  contenu?: string;
  name?: string;
  masquerNumero?: boolean;
  email?: string;
  type?: ChannelType;
}

/** Request body of `PATCH /api/update-client-by-phone/{phone}`. */
export interface UpdateClientLocations {
  destination?: string;
  location?: string;
}
