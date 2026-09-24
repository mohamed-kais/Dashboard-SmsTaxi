/**
 * WhatsApp chat resource models — transcribed verbatim from the reference
 * implementation (whatsapp-chat/models/ of the NBA branch), flattened into a
 * single file (this project does not use barrels).
 *
 * Wire formats consumed by ChatService / ChatWebSocketService:
 *   REST  `{whatsappApiUrl}/chat/...`        (see ChatService)
 *   STOMP /topic/conversations, /topic/conversation/{id},
 *         /topic/conversation/{id}/status    (frames are JSON `ChatMessage`)
 *
 * The whatsapp backend listens on port 8085 (absolute URLs in environment.ts);
 * it is a DIFFERENT backend than `apiBaseUrl`/`notificationsBaseUrl`.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** WhatsApp contact kind. */
export enum ContactType {
  TAXI = 'TAXI',
  CLIENT = 'CLIENT',
  GESTIONNAIRE = 'GESTIONNAIRE',
  AUTRE = 'AUTRE'
}

/** Message direction relative to the platform (operator side). */
export enum MessageDirection {
  IN = 'IN',
  OUT = 'OUT'
}

/** Delivery lifecycle status of a WhatsApp message. */
export enum ChatMessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  DELETED = 'DELETED'
}

/** Media-payload kind of a WhatsApp message. */
export enum WhatsAppMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  STICKER = 'STICKER',
  LOCATION = 'LOCATION',
  CONTACTS = 'CONTACTS'
}

// ---------------------------------------------------------------------------
// Response DTOs (read-only wire shapes)
// ---------------------------------------------------------------------------

/** Media payload attached to a chat message (only set for media messages). */
export interface WhatsAppMedia {
  mediaId?: string;
  mimeType?: string;
  objectKey?: string;
  fileName?: string;
  /** int64 */
  size?: number;
  sha256?: string;
  caption?: string;
  /** int32 (seconds). */
  duration?: number;
  /** int32 */
  width?: number;
  /** int32 */
  height?: number;
  voice?: boolean;
  animated?: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
}

/** `GET {base}/chat/media/{messageId}/url` response. */
export interface MediaUrlResponse {
  url: string;
  /** int32 */
  expiresInSeconds: number;
}

/**
 * `ChatMessage` — single frame format used on every STOMP topic AND as the
 * request/response body of the REST send endpoints.
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  whatsappMessageId?: string;
  direction: MessageDirection;
  /** payload kind — see `WhatsAppMessageType` (kept as string, non-exhaustive). */
  messageType: string;
  content: string;
  status: ChatMessageStatus;
  phoneNumber: string;
  /** date-time */
  createdAt: string;
  /** date-time */
  updatedAt?: string;
  media?: WhatsAppMedia;
}

/** WhatsApp contact backing a conversation. */
export interface Contact {
  id: string;
  waId: string;
  name: string;
  userId?: string;
  type: ContactType;
  /** date-time */
  createdAt?: string;
}

/** Conversation summary — item of `GET {base}/chat/conversations`. */
export interface Conversation {
  id: string;
  contactId: string;
  waId: string;
  contactName?: string;
  lastMessage?: string;
  /** payload kind of the last message — see `WhatsAppMessageType`. */
  lastMessageType?: string;
  /** date-time */
  lastMessageAt?: string;
  unreadCount: number;
}

// ---------------------------------------------------------------------------
// Request DTOs (REST send bodies)
// ---------------------------------------------------------------------------

/** Body of `POST {base}/chat/send`. */
export interface SendMessageRequest {
  waId: string;
  content: string;
  contactType: ContactType;
  contactName?: string;
}

/** Body of `POST {base}/chat/send-template`. */
export interface SendTemplateRequest {
  waId: string;
  templateName: string;
  languageCode: string;
  contactType: ContactType;
  bodyParams?: string[];
}