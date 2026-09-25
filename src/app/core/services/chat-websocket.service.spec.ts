import { TestBed } from '@angular/core/testing';

import { ChatWebSocketService } from './chat-websocket.service';
import { ChatMessage, MessageDirection, ChatMessageStatus } from '../models/chat.model';

/**
 * NOTE: connect() is intentionally NOT exercised here — it instantiates a real
 * STOMP `Client` with a SockJS webSocketFactory (same-origin /chat-ws) which
 * would open an actual network connection in the karma browser. Only the pure
 * observable/subscription bookkeeping is tested (no transport involved).
 */
describe('ChatWebSocketService', () => {
  let service: ChatWebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatWebSocketService);
  });

  // Expose private maps for assertions.
  function maps(): { conv: Map<string, unknown>; status: Map<string, unknown>; subs: Map<string, unknown> } {
    return {
      conv: (service as unknown as { conversationSubjects: Map<string, unknown> }).conversationSubjects,
      status: (service as unknown as { statusSubjects: Map<string, unknown> }).statusSubjects,
      subs: (service as unknown as { activeSubscriptions: Map<string, unknown> }).activeSubscriptions,
    };
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('connectionStatus$ starts as false (not connected yet)', () => {
    let status: boolean | undefined;
    service.connectionStatus$.subscribe(s => { status = s; });
    expect(status).toBeFalse();
  });

  it('globalConversationUpdates$ and per-conversation streams are Observables', () => {
    expect(service.globalConversationUpdates$).toBeTruthy();
    const sub = service.subscribeToConversation('c1');
    const subStatus = service.subscribeToConversationStatus('c1');
    expect(sub).toBeTruthy();
    expect(subStatus).toBeTruthy();
    expect(maps().conv.has('c1')).toBeTrue();
    expect(maps().status.has('c1')).toBeTrue();
  });

  it('subscribeToConversation before connect → does not throw (subscription deferred to onConnect)', () => {
    expect(() => {
      const stream = service.subscribeToConversation('c1');
      stream.subscribe();
    }).not.toThrow();
    // No STOMP subscription registered yet (transport never started).
    expect(maps().subs.size).toBe(0);
  });

  it('subscribeToConversation twice for same id reuses the same stream', () => {
    const a = service.subscribeToConversation('c1');
    const b = service.subscribeToConversation('c1');
    expect(maps().conv.size).toBe(1);
    // Both deliver the same values (single underlying subject).
    const heard: ChatMessage[] = [];
    a.subscribe(m => heard.push(m));
    b.subscribe(m => heard.push(m));
    const pushed = (service as unknown as { conversationSubjects: Map<string, { next(m: ChatMessage): void }> })
      .conversationSubjects;
    pushed.get('c1')!.next({ id: 'm1', conversationId: 'c1', direction: MessageDirection.IN, messageType: 'TEXT', content: 'x', status: ChatMessageStatus.SENT, phoneNumber: '0612', createdAt: '2026-01-01T00:00:00Z' });
    expect(heard.length).toBe(2);
  });

  it('unsubscribeFromConversation → clears conversation streams and subscriptions', () => {
    service.subscribeToConversation('c1');
    service.subscribeToConversationStatus('c1');
    expect(maps().conv.has('c1')).toBeTrue();
    expect(maps().status.has('c1')).toBeTrue();
    service.unsubscribeFromConversation('c1');
    expect(maps().conv.size).toBe(0);
    expect(maps().status.size).toBe(0);
    expect(maps().subs.size).toBe(0);
  });

  it('unsubscribeFromConversation for unknown conversation is a safe no-op', () => {
    expect(() => service.unsubscribeFromConversation('ghost')).not.toThrow();
  });

  it('disconnect() without ever connecting is safe and emits false', () => {
    let status: boolean | undefined;
    service.connectionStatus$.subscribe(s => { status = s; });
    expect(() => service.disconnect()).not.toThrow();
    expect(status).toBeFalse();
    expect(maps().conv.size).toBe(0);
    expect(maps().status.size).toBe(0);
    expect(maps().subs.size).toBe(0);
  });
});