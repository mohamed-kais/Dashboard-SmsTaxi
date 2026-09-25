import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';

import { ChatWindowComponent } from './chat-window.component';
import { ChatService } from '../../../../core/services/chat.service';
import { ChatStateService } from '../../../../core/services/chat-state.service';
import { ChatWebSocketService } from '../../../../core/services/chat-websocket.service';
import {
  ChatMessage,
  ChatMessageStatus,
  Conversation,
  MessageDirection,
} from '../../../../core/models/chat.model';

/**
 * NOTE on test strategy: `groupedMessages` is a getter returning a fresh array
 * on every evaluation, so any SECOND change-detection pass in dev mode raises
 * NG0100. Tests therefore pre-load state into BehaviorSubjects (replayed on
 * subscribe during the single initial detectChanges) or mutate state and assert
 * component fields directly without an extra detectChanges.
 */
describe('ChatWindowComponent', () => {
  let fixture: ComponentFixture<ChatWindowComponent>;
  let component: ChatWindowComponent;
  let chatSpy: jasmine.SpyObj<ChatService>;
  let ws: {
    connectionStatus$: BehaviorSubject<boolean>;
    globalConversationUpdates$: BehaviorSubject<ChatMessage | null>;
    subscribeToConversation: jasmine.Spy;
    subscribeToConversationStatus: jasmine.Spy;
    unsubscribeFromConversation: jasmine.Spy;
  };
  let stateMock: {
    conversations$: BehaviorSubject<Conversation[]>;
    getConversationById: jasmine.Spy;
    setActiveConversation: jasmine.Spy;
  };
  let convSubject: BehaviorSubject<ChatMessage | null>;
  let statusSubject: BehaviorSubject<ChatMessage | null>;
  let globalSubject: BehaviorSubject<ChatMessage | null>;
  let connSubject: BehaviorSubject<boolean>;
  let getMessagesSubject: BehaviorSubject<ChatMessage[]>;
  let convoList: Conversation[];

  const CONV_ID = 'conv-1';

  const convo = (id: string, over: Partial<Conversation> = {}): Conversation => ({
    id,
    contactId: `c-${id}`,
    waId: '21610000000',
    contactName: 'Ali Ben',
    unreadCount: 2,
    ...over,
  });

  const msg = (id: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
    id,
    conversationId: CONV_ID,
    direction: MessageDirection.IN,
    messageType: 'TEXT',
    content: `Message ${id}`,
    status: ChatMessageStatus.DELIVERED,
    phoneNumber: '+21610000000',
    createdAt: '2026-09-25T10:00:00Z',
    ...over,
  });

  beforeEach(() => {
    chatSpy = jasmine.createSpyObj('ChatService', ['getMessages']);
    getMessagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    chatSpy.getMessages.and.returnValue(getMessagesSubject.asObservable());

    convSubject = new BehaviorSubject<ChatMessage | null>(null);
    statusSubject = new BehaviorSubject<ChatMessage | null>(null);
    globalSubject = new BehaviorSubject<ChatMessage | null>(null);
    connSubject = new BehaviorSubject<boolean>(true);

    ws = {
      connectionStatus$: connSubject,
      globalConversationUpdates$: globalSubject,
      subscribeToConversation: jasmine.createSpy('subscribeToConversation')
        .and.callFake(() => convSubject.asObservable()),
      subscribeToConversationStatus: jasmine.createSpy('subscribeToConversationStatus')
        .and.callFake(() => statusSubject.asObservable()),
      unsubscribeFromConversation: jasmine.createSpy('unsubscribeFromConversation'),
    };

    convoList = [convo(CONV_ID), convo('conv-2', { contactName: 'Sami' })];
    stateMock = {
      conversations$: new BehaviorSubject(convoList),
      getConversationById: jasmine.createSpy('getConversationById')
        .and.callFake((id: string) => convoList.find((c) => c.id === id)),
      setActiveConversation: jasmine.createSpy('setActiveConversation'),
    };

    TestBed.configureTestingModule({
      imports: [ChatWindowComponent],
      providers: [
        provideTranslateService(),
        { provide: ChatService, useValue: chatSpy },
        { provide: ChatWebSocketService, useValue: ws },
        { provide: ChatStateService, useValue: stateMock },
      ],
    });
  });

  /** Boots a fresh fixture; THE only detectChanges of the test happens here,
   *  with all BehaviorSubject state already loaded. The @Input is driven via
   *  setInput so Angular tracks the binding and fires ngOnChanges on later
   *  changes (a direct property assignment would bypass the input mechanism). */
  function boot(conversationId: string = CONV_ID): void {
    fixture = TestBed.createComponent(ChatWindowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('conversationId', conversationId);
    fixture.detectChanges();
  }

  it('opens the conversation on init: marks active, loads messages, subscribes to realtime', () => {
    boot();
    expect(stateMock.setActiveConversation).toHaveBeenCalledWith(CONV_ID);
    expect(chatSpy.getMessages).toHaveBeenCalledWith(CONV_ID);
    expect(ws.subscribeToConversation).toHaveBeenCalledWith(CONV_ID);
    expect(ws.subscribeToConversationStatus).toHaveBeenCalledWith(CONV_ID);
    expect(component.conversation?.contactName).toBe('Ali Ben');
    expect(component.loading).toBeFalse(); // BehaviorSubject delivered synchronously
    expect(component.connected).toBeTrue();
  });

  it('loads messages into the list and stops loading', () => {
    getMessagesSubject.next([msg('m1'), msg('m2')]);
    boot();
    expect(component.messages.length).toBe(2);
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBeNull();
  });

  it('maps message-load failures to the translated loader error', () => {
    const broken = new Subject<ChatMessage[]>();
    chatSpy.getMessages.and.returnValue(broken.asObservable());
    boot();
    broken.error(new Error('boom'));
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('whatsapp.chat.loadFail');
  });

  it('switching conversationId re-opens the new conversation and releases the old topic', () => {
    getMessagesSubject.next([msg('m1', { content: 'Conv-1 msg' })]);
    boot();
    fixture.componentRef.setInput('conversationId', 'conv-2');
    fixture.detectChanges();
    expect(ws.unsubscribeFromConversation).toHaveBeenCalledWith(CONV_ID);
    expect(stateMock.setActiveConversation).toHaveBeenCalledWith('conv-2');
    expect(chatSpy.getMessages).toHaveBeenCalledWith('conv-2');
    expect(component.conversation?.contactName).toBe('Sami');
  });

  it('delivers a brand-new realtime message (dedupe by id)', () => {
    convSubject.next(msg('m1'));
    statusSubject.next(msg('m1', { status: ChatMessageStatus.READ }));
    boot();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].status).toBe(ChatMessageStatus.READ);
  });

  it('a realtime message for another conversation is ignored', () => {
    globalSubject.next(msg('m1', { conversationId: 'other-conv' }));
    boot();
    expect(component.messages).toEqual([]);
  });

  it('global stream delivers messages for the open conversation', () => {
    globalSubject.next(msg('m1'));
    boot();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].id).toBe('m1');
  });

  it('reflects the WebSocket connection status transitions', () => {
    boot();
    expect(component.connected).toBeTrue();
    connSubject.next(false);
    expect(component.connected).toBeFalse();
    connSubject.next(true);
    expect(component.connected).toBeTrue();
  });

  it('refreshes the header when the conversation list updates', () => {
    boot();
    const updated = convo(CONV_ID, { contactName: 'Nouveau Contact' });
    stateMock.conversations$.next([updated, convo('conv-2')]);
    expect(component.conversation?.contactName).toBe('Nouveau Contact');
  });

  it('onSent integrates the just-sent message without waiting for the WebSocket echo', () => {
    boot();
    const sent = msg('m-out', { direction: MessageDirection.OUT, content: 'Salut' });
    component.onSent(sent);
    expect(component.messages).toEqual([jasmine.objectContaining({ id: 'm-out', direction: MessageDirection.OUT })]);
    expect((component as unknown as { shouldScrollToBottom: boolean }).shouldScrollToBottom).toBeTrue();
  });

  it('onSendError surfaces the send-failure banner', () => {
    boot();
    component.onSendError();
    expect(component.errorMessage).toBe('whatsapp.chat.sendFail');
  });

  it('header getters derive name, initials and a stable avatar color', () => {
    boot();
    expect(component.headerName).toBe('Ali Ben');
    expect(component.headerInitials).toBe('AB');
    expect(typeof component.headerAvatarColor).toBe('string');
    // stable: same seed → same color
    component.conversation = convo(CONV_ID, { waId: '123456' });
    const first = component.headerAvatarColor;
    component.conversation = convo(CONV_ID, { waId: '123456' });
    expect(component.headerAvatarColor).toBe(first);
  });

  it('groups messages by day (today / yesterday / older)', () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-09-25T12:00:00'));
    getMessagesSubject.next([
      msg('a', { createdAt: '2026-09-25T09:00:00Z' }),
      msg('b', { createdAt: '2026-09-25T18:00:00Z' }),
      msg('c', { createdAt: '2026-09-24T10:00:00Z' }),
      msg('d', { createdAt: '2026-09-20T10:00:00Z' }),
    ]);
    boot();

    const groups = component.groupedMessages;
    expect(groups.length).toBe(3);
    expect(groups[0].label).toBe('whatsapp.date.today');
    expect(groups[1].label).toBe('whatsapp.date.yesterday');
    expect(groups[2].label).not.toBe('whatsapp.date.today');
    expect(groups[2].label).not.toBe('whatsapp.date.yesterday');
    expect(groups[0].messages.length).toBe(2);
    expect(groups[1].messages.length).toBe(1);
    expect(groups[2].messages.length).toBe(1);
    jasmine.clock().uninstall();
  });

  it('trackBy helpers return stable keys', () => {
    boot();
    expect(component.trackByMessageId(0, msg('m1'))).toBe('m1');
    expect(component.trackByGroup(0, { label: 'L', messages: [] })).toBe('L');
  });

  it('onBack emits the back event', () => {
    boot();
    const backSpy = spyOn(component.back, 'emit');
    component.onBack();
    expect(backSpy).toHaveBeenCalled();
  });

  it('does not reload when the same conversationId is re-assigned', () => {
    boot();
    expect(chatSpy.getMessages).toHaveBeenCalledTimes(1);
    component.conversationId = CONV_ID;
    fixture.detectChanges();
    expect(chatSpy.getMessages).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from the WS topic on destroy', () => {
    boot();
    fixture.destroy();
    expect(ws.unsubscribeFromConversation).toHaveBeenCalledWith(CONV_ID);
  });
});