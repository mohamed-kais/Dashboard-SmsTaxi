/**
 * Shared DTOs, paging primitives and enum unions — transcribed verbatim from
 * docs/API_REFERENCE.md ("Global conventions"). Enum unions are string-literal
 * unions (no TS `enum` objects), values in exact spec order.
 */
import { TaxiDto } from './taxi.model';
import { DemandeDto, PageDemandeAdminDto } from './demande.model';
import { OffreDto, PageOffreAdminDto } from './offre.model';

// ---------------------------------------------------------------------------
// Enum unions (API_REFERENCE "Global conventions")
// ---------------------------------------------------------------------------

/** Shared state enum for Demande `etat` and Offre `etat`/`etatOffre` (8 values). */
export type StatusEnum =
  | 'TERMINATED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'STARTED'
  | 'CANCELLED'
  | 'CANCELLED_BY_CLIENT'
  | 'CANCELLED_BY_TAXI'
  | 'EXPIRED';

/** Channel `type` on Offre/Taxi/Client. */
export type ChannelType = 'GSM' | 'SMART' | 'WHATSAPP' | 'WHATSAPP_AR';

/** Taxi approval status. */
export type TaxiStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

/** `Taxi.channelPreference` (entity schema only). */
export type ChannelPreference = 'SMART_ONLY' | 'GSM_ONLY' | 'BOTH';

/** Airport pricing surcharge type. */
export type SurchargeType = 'PERCENTAGE' | 'FIXED_AMOUNT';

/** Reservation status (admin endpoints). */
export type ReservationStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'WAITING_DRIVER'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

/** `ReservationAssignmentResponse.status`. */
export type AssignmentStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'REPLACED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED';

/** Reservation assignment type. */
export type AssignmentType = 'AUTO' | 'MANUAL';

/** `ReservationRequest.source`. */
export type ReservationSource = 'WHATSAPP' | 'SMS' | 'MOBILE_APP' | 'DASHBOARD';

/** Reservation language. */
export type ReservationLanguage = 'FR' | 'AR';

/** History paging sort direction (default `DESC`). */
export type Direction = 'ASC' | 'DESC';

// ---------------------------------------------------------------------------
// Paging primitives
// ---------------------------------------------------------------------------

/**
 * `Pageable` — spec quirk: declared as a query-parameter ref on `/api/get-demande`
 * and the admin reservation endpoints; send flat `page`, `size`, `sort` instead.
 */
export interface Pageable {
  /** 0-based */
  page?: number;
  /** ≥1 */
  size?: number;
  sort?: string[];
}

/** Spring `Sort` object embedded in Page responses. */
export interface SortObject {
  sorted?: boolean;
  unsorted?: boolean;
  empty?: boolean;
}

/** Spring `Pageable` object embedded in Page responses. */
export interface PageableObject {
  sort?: SortObject;
  offset?: number;
  pageNumber?: number;
  pageSize?: number;
  paged?: boolean;
  unpaged?: boolean;
}

// ---------------------------------------------------------------------------
// Error / message / cancel envelopes
// ---------------------------------------------------------------------------

/** 400/404/409/500 error shape (Clients, Demands, Taxis…). */
export interface ErrorResponseDto {
  success?: boolean;
  code?: string;
  /** date-time */
  timestamp?: string;
  /** HTTP status */
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  requestId?: string;
  /** per-field validation messages */
  validationErrors?: { [fieldName: string]: string };
}

/** `{ "message": string }` — used by `/api/inject-sms`. */
export interface MessageResponse {
  message?: string;
}

/** Cancel envelope for `DELETE /api/cancel-offre/*` and `cancel-booking/*`. */
export interface CancelBookingResponseDto {
  success?: boolean;
  message?: string;
  cancelledCount?: number;
  /** date-time */
  timestamp?: string;
  cancelledOffers?: OffreDto[];
  cancelledBy?: string;
  previousStatus?: StatusEnum;
  newStatus?: StatusEnum;
}

/** Cancel envelope for `DELETE /api/cancel-demande/{demandeId}`. */
export interface CancelDemandeResponseDto {
  success?: boolean;
  message?: string;
  demandeId?: number;
  /** date-time */
  timestamp?: string;
  cancelledDemande?: DemandeDto;
  cancelledBy?: string;
  previousStatus?: StatusEnum;
  newStatus?: StatusEnum;
}

// ---------------------------------------------------------------------------
// ApiResponseDto wrappers
// Envelope (success, code, message, timestamp, path, requestId) + `data`, plus
// the payload fields inlined a second time at the top level (spec declares the
// payload fields twice). See API_REFERENCE "ApiResponseDto wrappers".
// ---------------------------------------------------------------------------

/** Generic envelope shared by the declared `ApiResponseDto*` variants. */
export interface ApiResponseDto<T> {
  success?: boolean;
  code?: string;
  message?: string;
  /** date-time */
  timestamp?: string;
  path?: string;
  requestId?: string;
  data?: T;
}

/** Declared for 400/409/500 of `POST /api/add-taxis`. */
export interface ApiResponseDtoTaxiDto extends ApiResponseDto<TaxiDto>, TaxiDto {}

/** Declared for 400/500 of `GET /api/get-allOffre` / `get-all-offres`. */
export interface ApiResponseDtoPageOffreAdminDto
  extends ApiResponseDto<PageOffreAdminDto>,
    PageOffreAdminDto {}

/** Declared for 400/500 of `GET /api/get-demande`. */
export interface ApiResponseDtoPageDemandeAdminDto
  extends ApiResponseDto<PageDemandeAdminDto>,
    PageDemandeAdminDto {}
