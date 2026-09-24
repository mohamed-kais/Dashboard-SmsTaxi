/**
 * STOMP/SockJS WebSocket service for the whatsapp backend (same-origin
 * `/chat-ws`, routed by the dev-server proxy `proxy.conf.js` — see the
 * verified 2026-09-24 base-URL findings there).
 * Handles ONLY the connection and topic subscribe/unsubscribe; no business
 * logic (unread counters, sorting, ...) — that lives in ChatStateService,
 * which consumes the Observables exposed here.
 *
 * Backend topics consumed:
 *   /topic/conversations                        -> any new message, any conversation
 *   /topic/conversation/{conversationId}         -> messages of an open conversation
 *   /topic/conversation/{conversationId}/status  -> status updates (sent/delivered/read)
 */
import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ChatMessage } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatWebSocketService {

  private client?: Client;

  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly globalUpdatesSubject = new Subject<ChatMessage>();

  private readonly conversationSubjects = new Map<string, Subject<ChatMessage>>();
  private readonly statusSubjects = new Map<string, Subject<ChatMessage>>();
  private readonly activeSubscriptions = new Map<string, StompSubscription>();

  /** Emits `true` while the STOMP connection is active, `false` otherwise. */
  get connectionStatus$(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  /** Global stream: emits a `ChatMessage` at every new message (IN or OUT),
   * across all conversations. */
  get globalConversationUpdates$(): Observable<ChatMessage> {
    return this.globalUpdatesSubject.asObservable();
  }

  /** Opens the SockJS connection and (re)subscribes the known topics. */
  connect(): void {
    if (this.client?.active) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.whatsappWsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    });

    this.client.onConnect = () => {
      this.connectedSubject.next(true);
      this.subscribeGlobalTopic();
      // Re-subscribes the conversations that were already requested before a
      // disconnect/reconnect.
      this.conversationSubjects.forEach((_, conversationId) => this.ensureConversationSubscribed(conversationId));
    };

    this.client.onWebSocketClose = () => this.connectedSubject.next(false);
    this.client.onStompError = (frame) => console.error('Erreur STOMP whatsapp-service :', frame.headers, frame.body);

    this.client.activate();
  }

  /** Closes the connection and releases every topic subscription. */
  disconnect(): void {
    this.activeSubscriptions.forEach(sub => sub.unsubscribe());
    this.activeSubscriptions.clear();
    this.conversationSubjects.clear();
    this.statusSubjects.clear();
    this.client?.deactivate();
    this.connectedSubject.next(false);
  }

  private subscribeGlobalTopic(): void {
    if (!this.client) {
      return;
    }
    const sub = this.client.subscribe('/topic/conversations', (frame: IMessage) => {
      this.globalUpdatesSubject.next(JSON.parse(frame.body) as ChatMessage);
    });
    this.activeSubscriptions.set('global', sub);
  }

  /** Returns (creating if needed) the stream of messages of one conversation. */
  subscribeToConversation(conversationId: string): Observable<ChatMessage> {
    if (!this.conversationSubjects.has(conversationId)) {
      this.conversationSubjects.set(conversationId, new Subject<ChatMessage>());
    }
    this.ensureConversationSubscribed(conversationId);
    return this.conversationSubjects.get(conversationId)!.asObservable();
  }

  /** Returns (creating if needed) the stream of status updates of one conversation. */
  subscribeToConversationStatus(conversationId: string): Observable<ChatMessage> {
    if (!this.statusSubjects.has(conversationId)) {
      this.statusSubjects.set(conversationId, new Subject<ChatMessage>());
    }
    this.ensureConversationSubscribed(conversationId);
    return this.statusSubjects.get(conversationId)!.asObservable();
  }

  private ensureConversationSubscribed(conversationId: string): void {
    if (!this.client?.connected) {
      return; // will be (re)done in onConnect as soon as the connection is active
    }

    const messagesKey = `conv:${conversationId}`;
    if (!this.activeSubscriptions.has(messagesKey)) {
      const sub = this.client.subscribe(`/topic/conversation/${conversationId}`, (frame: IMessage) => {
        this.conversationSubjects.get(conversationId)?.next(JSON.parse(frame.body) as ChatMessage);
      });
      this.activeSubscriptions.set(messagesKey, sub);
    }

    const statusKey = `status:${conversationId}`;
    if (!this.activeSubscriptions.has(statusKey)) {
      const sub = this.client.subscribe(`/topic/conversation/${conversationId}/status`, (frame: IMessage) => {
        this.statusSubjects.get(conversationId)?.next(JSON.parse(frame.body) as ChatMessage);
      });
      this.activeSubscriptions.set(statusKey, sub);
    }
  }

  /** Releases the subscriptions tied to a conversation when it is no longer
   * displayed. */
  unsubscribeFromConversation(conversationId: string): void {
    this.activeSubscriptions.get(`conv:${conversationId}`)?.unsubscribe();
    this.activeSubscriptions.get(`status:${conversationId}`)?.unsubscribe();
    this.activeSubscriptions.delete(`conv:${conversationId}`);
    this.activeSubscriptions.delete(`status:${conversationId}`);
    this.conversationSubjects.delete(conversationId);
    this.statusSubjects.delete(conversationId);
  }
}