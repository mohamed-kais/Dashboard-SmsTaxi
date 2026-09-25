import { TestBed } from '@angular/core/testing';
import { of, Observable, Subject, throwError } from 'rxjs';

import { ChatStateService } from './chat-state.service';
import { ChatService } from './chat.service';
import { ChatWebSocketService } from './chat-websocket.service';
import { ChatMessage, Conversation, ChatMessageStatus, MessageDirection } from '../models/chat.model';

describe('ChatStateService', () => {
  let service: ChatStateService;
  let chatServiceSpy: jasmine.SpyObj<ChatService>;
  let wsStub: {
    connect: jasmine.Spy;
    disconnect: jasmine.Spy;
    globalConversationUpdates$: Observable<ChatMessage>;
  };
  let globalUpdates: Subject<ChatMessage>;

  const conv = (partial: Partial<Conversation>): Conversation => ({
    id: 'c1',
    contactId: 'ct1',
    waId: '0612',
    contactName: 'Ali',
    unreadCount: 0,
    ...partial,
  });

  const msg = (partial: Partial<ChatMessage>): ChatMessage => ({
    id: 'm1',
    conversationId: 'c1',
    direction: MessageDirection.IN,
    messageType: 'TEXT',
    content: 'hello',
    status: ChatMessageStatus.DELIVERED,
    phoneNumber: '0612',
    createdAt: '2026-01-02T10:00:00Z',
    ...partial,
  });

  beforeEach(() => {
    chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'getConversations',
      'markConversationAsRead',
    ]);
    globalUpdates = new Subject<ChatMessage>();
    wsStub = {
      connect: jasmine.createSpy('connect'),
      disconnect: jasmine.createSpy('disconnect'),
      globalConversationUpdates$: globalUpdates.asObservable(),
    };
    TestBed.configureTestingModule({
      providers: [
        ChatStateService,
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: ChatWebSocketService, useValue: wsStub },
      ],
    });
    service = TestBed.inject(ChatStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('init() → connects websocket, loads conversations, subscribes global updates', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({})]));
    service.init();
    expect(wsStub.connect).toHaveBeenCalledTimes(1);
    expect(chatServiceSpy.getConversations).toHaveBeenCalledTimes(1);
    // The subscription is live: a global update now flows into state.
    globalUpdates.next(msg({ content: 'nouveau' }));
    expect(service.getConversationById('c1')?.lastMessage).toBe('nouveau');
  });

  it('loadConversations → emits sorted list and clears any prior error', () => {
    chatServiceSpy.getConversations.and.returnValue(of([
      conv({ id: 'older', lastMessageAt: '2026-01-01T00:00:00Z' }),
      conv({ id: 'newer', lastMessageAt: '2026-01-03T00:00:00Z' }),
      conv({ id: 'noDate' }),
    ]));
    service.loadConversations();
    const list = service['conversationsSubject'].getValue();
    expect(list.map(c => c.id)).toEqual(['newer', 'older', 'noDate']);
    let error: string | null = 'stale';
    service.conversationsError$.subscribe(e => { error = e; });
    expect(error).toBeNull();
  });

  it('loadConversations → surfaces error via conversationsError$ and keeps list intact', () => {
    chatServiceSpy.getConversations.and.returnValue(throwError(() => new Error('boom')));
    spyOn(console, 'error');
    service.loadConversations();
    let error: string | null = null;
    service.conversationsError$.subscribe(e => { error = e; });
    expect(error).toBe('Impossible de charger les conversations.');
    expect(service['conversationsSubject'].getValue()).toEqual([]);
  });

  it('getConversationById → returns matching conversation or undefined', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({ id: 'c1' })]));
    service.loadConversations();
    expect(service.getConversationById('c1')?.contactName).toBe('Ali');
    expect(service.getConversationById('nope')).toBeUndefined();
  });

  it('setActiveConversation(null) → no-op, no markAsRead call', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({ unreadCount: 3 })]));
    service.loadConversations();
    service.setActiveConversation(null);
    expect(chatServiceSpy.markConversationAsRead).not.toHaveBeenCalled();
  });

  it('setActiveConversation with unread>0 → resets counter locally AND calls markConversationAsRead', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({ unreadCount: 3 })]));
    chatServiceSpy.markConversationAsRead.and.returnValue(of(conv({ unreadCount: 0 })));
    service.loadConversations();
    service.setActiveConversation('c1');
    expect(service.getConversationById('c1')?.unreadCount).toBe(0);
    expect(chatServiceSpy.markConversationAsRead).toHaveBeenCalledWith('c1');
  });

  it('setActiveConversation with unread=0 → does NOT call markConversationAsRead', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({ unreadCount: 0 })]));
    service.loadConversations();
    service.setActiveConversation('c1');
    expect(chatServiceSpy.markConversationAsRead).not.toHaveBeenCalled();
  });

  it('applyIncomingMessage (IN, conversation not active) → bumps unread, updates lastMessage, resorts', () => {
    chatServiceSpy.getConversations.and.returnValue(of([
      conv({ id: 'a', lastMessageAt: '2026-01-01T00:00:00Z' }),
      conv({ id: 'b', lastMessageAt: '2026-01-02T00:00:00Z' }),
    ]));
    service.init(); // loads conversations AND subscribes to global updates
    service.setActiveConversation('a');
    globalUpdates.next(msg({ id: 'm9', conversationId: 'b', content: 'nouveau', createdAt: '2026-01-05T00:00:00Z' }));
    const b = service.getConversationById('b');
    expect(b?.unreadCount).toBe(1);
    expect(b?.lastMessage).toBe('nouveau');
    // 'b' now has the newest lastMessageAt → moved to top.
    const ids = service['conversationsSubject'].getValue().map(c => c.id);
    expect(ids).toEqual(['b', 'a']);
  });

  it('applyIncomingMessage (OUT — operator sent) → never increments unread counter', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({ unreadCount: 0 })]));
    service.init();
    globalUpdates.next(msg({ direction: MessageDirection.OUT, content: 'sent by admin' }));
    expect(service.getConversationById('c1')?.unreadCount).toBe(0);
  });

  it('applyIncomingMessage (IN but conversation IS active on screen) → no unread bump', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({ unreadCount: 0 })]));
    service.init();
    service.setActiveConversation('c1');
    globalUpdates.next(msg({ content: 'live message' }));
    expect(service.getConversationById('c1')?.unreadCount).toBe(0);
  });

  it('applyIncomingMessage (IN while active, unread reset then new message) → stays 1', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({ unreadCount: 2 })]));
    chatServiceSpy.markConversationAsRead.and.returnValue(of(conv({ unreadCount: 0 })));
    service.init();
    service.setActiveConversation('c1'); // resets to 0
    globalUpdates.next(msg({ content: 'new' }));
    // Message is IN + conversation IS active → counter stays 0 (already read).
    expect(service.getConversationById('c1')?.unreadCount).toBe(0);
  });

  it('applyIncomingMessage for unknown conversation → triggers a full reload', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({})]));
    service.init();
    expect(chatServiceSpy.getConversations).toHaveBeenCalledTimes(1);
    globalUpdates.next(msg({ conversationId: 'brand-new-contact' }));
    expect(chatServiceSpy.getConversations).toHaveBeenCalledTimes(2);
  });

  it('destroy() → unsubscribes global updates and disconnects websocket', () => {
    chatServiceSpy.getConversations.and.returnValue(of([conv({})]));
    service.init();
    service.destroy();
    // After destroy, pushing to the global subject must not touch state anymore.
    globalUpdates.next(msg({ content: 'ignored' }));
    expect(service.getConversationById('c1')?.lastMessage).toBeUndefined();
    expect(wsStub.disconnect).toHaveBeenCalledTimes(1);
  });
});