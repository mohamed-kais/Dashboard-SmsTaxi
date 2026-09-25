import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';

import { MessageInputComponent } from './message-input.component';
import { ChatService } from '../../../../core/services/chat.service';
import {
  ChatMessage,
  ChatMessageStatus,
  ContactType,
  Conversation,
  MessageDirection,
  SendMessageRequest,
} from '../../../../core/models/chat.model';

describe('MessageInputComponent', () => {
  let component: MessageInputComponent;
  let fixture: ComponentFixture<MessageInputComponent>;
  let chatSpy: jasmine.SpyObj<ChatService>;

  const conversationFixture: Conversation = {
    id: 'conv-1',
    contactId: 'c-1',
    waId: '21610000000',
    contactName: '  Ali Ben  ',
    unreadCount: 0,
  };

  const messageFixture = (over: Partial<ChatMessage> = {}): ChatMessage => ({
    id: 'm-1',
    conversationId: 'conv-1',
    direction: MessageDirection.OUT,
    messageType: 'TEXT',
    content: 'Bonjour',
    status: ChatMessageStatus.SENT,
    phoneNumber: '+21610000000',
    createdAt: '2026-01-01T10:00:00Z',
    ...over,
  });

  beforeEach(() => {
    chatSpy = jasmine.createSpyObj('ChatService', ['sendMessage']);
    chatSpy.sendMessage.and.returnValue(new Subject<ChatMessage>().asObservable());

    TestBed.configureTestingModule({
      imports: [MessageInputComponent],
      providers: [
        provideTranslateService(),
        { provide: ChatService, useValue: chatSpy },
      ],
    });
    fixture = TestBed.createComponent(MessageInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('is disabled without a conversation or while sending', () => {
    expect(component.disabled).toBeTrue();
    component.conversation = conversationFixture;
    expect(component.disabled).toBeFalse();
    component.sending = true;
    expect(component.disabled).toBeTrue();
  });

  it('onSubmit with no conversation → early return without calling the API', () => {
    component.content = 'Hello';
    component.onSubmit();
    expect(chatSpy.sendMessage).not.toHaveBeenCalled();
  });

  it('onSubmit with blank/whitespace content → early return', () => {
    component.conversation = conversationFixture;
    component.content = '   ';
    component.onSubmit();
    expect(chatSpy.sendMessage).not.toHaveBeenCalled();
  });

  it('onSubmit builds the request and emits `sent` with the backend message on success', () => {
    const pending = new Subject<ChatMessage>();
    chatSpy.sendMessage.and.returnValue(pending.asObservable());
    const sentSpy = spyOn(component.sent, 'emit');

    component.conversation = conversationFixture;
    component.content = '  Bonjour tout le monde  ';
    component.onSubmit();

    expect(component.sending).toBeTrue();
    const request = chatSpy.sendMessage.calls.mostRecent().args[0] as SendMessageRequest;
    expect(request.waId).toBe('21610000000');
    expect(request.content).toBe('Bonjour tout le monde'); // trimmed
    expect(request.contactType).toBe(ContactType.AUTRE);
    expect(request.contactName).toBe('  Ali Ben  '); // left as-is: backend-side contact

    const reply = messageFixture({ content: 'Bonjour tout le monde' });
    pending.next(reply);
    pending.complete();

    expect(component.sending).toBeFalse();
    expect(component.content).toBe('');
    expect(sentSpy).toHaveBeenCalledWith(reply);
  });

  it('onSubmit failure → emits sendError and keeps typed content', () => {
    const pending = new Subject<ChatMessage>();
    chatSpy.sendMessage.and.returnValue(pending.asObservable());
    const errorSpy = spyOn(component.sendError, 'emit');

    component.conversation = conversationFixture;
    component.content = 'Bonjour';
    component.onSubmit();

    pending.error(new Error('net'));

    expect(component.sending).toBeFalse();
    expect(component.content).toBe('Bonjour');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('a second onSubmit while a send is pending is a no-op (button-disabled guard)', () => {
    const pending = new Subject<ChatMessage>();
    chatSpy.sendMessage.and.returnValue(pending.asObservable());
    const sentSpy = spyOn(component.sent, 'emit');

    component.conversation = conversationFixture;
    component.content = 'First';
    component.onSubmit();
    component.content = 'Second';
    component.onSubmit();

    // `sending` disables the composer → the second call never reaches the API.
    expect(chatSpy.sendMessage).toHaveBeenCalledTimes(1);
    expect(component.sending).toBeTrue();

    const reply = messageFixture({ id: 'm-old', content: 'First' });
    pending.next(reply);
    expect(sentSpy).toHaveBeenCalledTimes(1);
    expect(sentSpy).toHaveBeenCalledWith(reply);
    expect(component.content).toBe('');
  });

  it('onKeyDown: bare Enter sends and prevents default; Shift+Enter does not', () => {
    component.conversation = conversationFixture;
    chatSpy.sendMessage.and.returnValue(new Subject<ChatMessage>().asObservable());

    const enter = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
    const preventSpy = spyOn(enter, 'preventDefault');
    component.content = 'Hi';
    component.onKeyDown(enter);
    expect(preventSpy).toHaveBeenCalled();
    expect(chatSpy.sendMessage).toHaveBeenCalledTimes(1);
    expect(component.content).toBe('Hi'); // not cleared until backend replies

    const shiftEnter = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    const shiftPrevent = spyOn(shiftEnter, 'preventDefault');
    component.onKeyDown(shiftEnter);
    expect(shiftPrevent).not.toHaveBeenCalled();
    expect(chatSpy.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('ngOnDestroy unsubscribes a pending send so late replies are ignored', () => {
    const pending = new Subject<ChatMessage>();
    chatSpy.sendMessage.and.returnValue(pending.asObservable());
    const sentSpy = spyOn(component.sent, 'emit');

    component.conversation = conversationFixture;
    component.content = 'Bonjour';
    component.onSubmit();
    expect(component.sending).toBeTrue();

    component.ngOnDestroy();
    pending.next(messageFixture());
    expect(sentSpy).not.toHaveBeenCalled();
    expect(component.sending).toBeTrue();
  });
});