/**
 * Reservation admin DTOs — transcribed verbatim from docs/API_REFERENCE.md
 * (§15 reservation-admin-controller).
 */
import {
  AssignmentStatus,
  AssignmentType,
  PageableObject,
  ReservationLanguage,
  ReservationSource,
  ReservationStatus,
  SortObject,
} from './common.model';

/** Reservation response returned by the admin reservation endpoints. */
export interface ReservationResponse {
  id?: number;
  clientId?: number;
  telephone?: string;
  pickup?: string;
  destination?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  /** date-time */
  reservationDateTime?: string;
  status?: ReservationStatus;
  source?: ReservationSource;
  language?: ReservationLanguage;
  commentaire?: string;
  estimatedPrice?: number;
  finalPrice?: number;
  estimatedDistance?: string;
  estimatedDuration?: string;
  reminderSent?: boolean;
  convertedToDemande?: boolean;
  /** date-time */
  createdAt?: string;
  /** date-time */
  updatedAt?: string;
  /** date-time */
  cancelledAt?: string;
  /** date-time */
  completedAt?: string;
  cancelledBy?: string;
  assignment?: ReservationAssignmentResponse;
}

/** Taxi assignment attached to a reservation. */
export interface ReservationAssignmentResponse {
  id?: number;
  taxiId?: number;
  taxiNumero?: string;
  taxiNom?: string;
  taxiMatricule?: string;
  taxiTelephone?: string;
  assignmentType?: AssignmentType;
  status?: AssignmentStatus;
  assignedBy?: string;
  /** date-time */
  assignedAt?: string;
  /** date-time */
  acceptedAt?: string;
  /** date-time */
  cancelledAt?: string;
  /** date-time */
  completedAt?: string;
  comment?: string;
}

/** Spring Page of `ReservationResponse` (0-based paging). */
export interface PageReservationResponse {
  totalElements?: number;
  totalPages?: number;
  sort?: SortObject;
  size?: number;
  content?: ReservationResponse[];
  number?: number;
  first?: boolean;
  numberOfElements?: number;
  pageable?: PageableObject;
  last?: boolean;
  empty?: boolean;
}

/** Reservation payload of `POST /api/admin/reservations/with-assignment`. */
export interface ReservationRequest {
  telephone?: string;
  pickup?: string;
  destination?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  /** date-time */
  reservationDateTime?: string;
  source?: ReservationSource;
  language?: ReservationLanguage;
  commentaire?: string;
}

/** Body of `PUT /api/admin/reservations/{id}`. */
export interface UpdateReservationRequest {
  telephone?: string;
  pickup?: string;
  destination?: string;
  /** date-time */
  reservationDateTime?: string;
  commentaire?: string;
  finalPrice?: number;
}

/** Body of `PUT /api/admin/reservations/{id}/assignment`. */
export interface AssignTaxiRequest {
  /** required */
  taxiId: number;
  assignmentType?: AssignmentType;
  assignedBy?: string;
  comment?: string;
}

/** Body of `POST /api/admin/reservations/with-assignment`. */
export interface ReservationWithAssignmentRequest {
  /** required */
  reservation: ReservationRequest;
  assignment?: AssignTaxiRequest;
}
