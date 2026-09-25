import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ChatService } from './chat.service';
import { ContactType, ChatMessage, Conversation, MediaUrlResponse } from '../models/chat.model';
import { ChatMessageStatus, MessageDirection } from '../models/chat.model';

/** Mirrors `environment.whatsappApiUrl` (+ '/chat'). */
const BASE = '/chat-api/chat';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getConversations → GET ${base}/conversations', () => {
    const list: Conversation[] = [{ id: 'c1', contactId: 'ct1', waId: '0612', contactName: 'Ali', unreadCount: 0 }];
    service.getConversations().subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(`${BASE}/conversations`);
    expect(req.request.method).toBe('GET');
    req.flush(list);
  });

  it('getMessages → GET ${base}/conversations/{id}/messages', () => {
    const msgs: ChatMessage[] = [{
      id: 'm1',
      conversationId: 'c1',
      direction: MessageDirection.OUT,
      messageType: 'TEXT',
      content: 'bonjour',
      status: ChatMessageStatus.SENT,
      phoneNumber: '+21610000000',
      createdAt: '2026-01-01T10:00:00Z',
    }];
    service.getMessages('c1').subscribe(res => expect(res).toEqual(msgs));
    const req = httpMock.expectOne(`${BASE}/conversations/c1/messages`);
    expect(req.request.method).toBe('GET');
    req.flush(msgs);
  });

  it('sendMessage → POST ${base}/send with SendMessageRequest body', () => {
    const request = { waId: '0612', content: 'bonjour', contactType: ContactType.AUTRE as ContactType, contactName: 'Ali' };
    const sent: ChatMessage = {
      id: 'm1',
      conversationId: 'c1',
      direction: MessageDirection.OUT,
      messageType: 'TEXT',
      content: 'bonjour',
      status: ChatMessageStatus.SENT,
      phoneNumber: '0612',
      createdAt: '2026-01-01T00:00:00Z',
    };
    service.sendMessage(request).subscribe(res => expect(res).toEqual(sent));
    const req = httpMock.expectOne(`${BASE}/send`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(sent);
  });

  it('sendTemplate → POST ${base}/send-template with SendTemplateRequest body', () => {
    const request = { waId: '0612', templateName: 'greeting', languageCode: 'fr', contactType: ContactType.AUTRE };
    service.sendTemplate(request).subscribe();
    const req = httpMock.expectOne(`${BASE}/send-template`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('markConversationAsRead → PATCH ${base}/conversations/{id}/read with empty {} body', () => {
    const conv: Conversation = { id: 'c1', contactId: 'ct1', waId: '0612', unreadCount: 0 };
    service.markConversationAsRead('c1').subscribe(res => expect(res).toEqual(conv));
    const req = httpMock.expectOne(`${BASE}/conversations/c1/read`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(conv);
  });

  it('getMediaUrl → GET ${base}/media/{messageId}/url', () => {
    const media: MediaUrlResponse = { url: 'https://x/y.jpg', expiresInSeconds: 3600 };
    service.getMediaUrl('m1').subscribe(res => expect(res).toEqual(media));
    const req = httpMock.expectOne(`${BASE}/media/m1/url`);
    req.flush(media);
  });
});