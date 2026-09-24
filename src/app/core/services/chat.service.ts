/**
 * WhatsApp chat REST service — consumes the `/chat` API of the whatsapp
 * backend (ChatController). No business logic here: only HTTP
 * calls. The state/realtime layer lives in ChatStateService.
 *
 * Base URL: `environment.whatsappApiUrl` — a SAME-ORIGIN relative path
 * (`/chat-api` in dev), routed by the dev-server proxy (proxy.conf.js) to
 * the populated whatsapp service. Deliberately NOT under `/api/` so the
 * ApiBaseUrlInterceptor passes it through unchanged (see proxy.conf.js for
 * the verified 2026-09-24 base-URL findings: public :8085 is empty, data
 * lives behind the reference host `:5000`).
 *
 * Errors are NOT caught per-call: the app's ErrorInterceptor handles them.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ChatMessage,
  Conversation,
  MediaUrlResponse,
  SendMessageRequest,
  SendTemplateRequest,
} from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {

  private readonly baseUrl = `${environment.whatsappApiUrl}/chat`;

  constructor(private readonly http: HttpClient) {}

  /**
   * `GET ${base}/conversations` — all conversations (newest last-message
   * first; sorting is re-applied in ChatStateService).
   */
  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations`);
  }

  /**
   * `GET ${base}/conversations/{conversationId}/messages` — message history
   * of one conversation.
   */
  getMessages(conversationId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/conversations/${conversationId}/messages`);
  }

  /**
   * `POST ${base}/send` — send a plain WhatsApp message.
   */
  sendMessage(request: SendMessageRequest): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/send`, request);
  }

  /**
   * `POST ${base}/send-template` — send a WhatsApp template message.
   */
  sendTemplate(request: SendTemplateRequest): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/send-template`, request);
  }

  /**
   * `PATCH ${base}/conversations/{conversationId}/read` — mark a conversation
   * as read by the operator (empty `{}` body per backend contract).
   */
  markConversationAsRead(conversationId: string): Observable<Conversation> {
    return this.http.patch<Conversation>(`${this.baseUrl}/conversations/${conversationId}/read`, {});
  }

  /**
   * `GET ${base}/media/{messageId}/url` — signed/media URL for a message
   * attachment.
   */
  getMediaUrl(messageId: string): Observable<MediaUrlResponse> {
    return this.http.get<MediaUrlResponse>(`${this.baseUrl}/media/${messageId}/url`);
  }
}