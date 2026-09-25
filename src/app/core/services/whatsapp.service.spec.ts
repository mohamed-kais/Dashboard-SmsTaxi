import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { WhatsappService } from './whatsapp.service';
import { NotificationService } from './notification.service';
import { SendNotificationRequest } from '../models/notification.model';

describe('WhatsappService', () => {
  let service: WhatsappService;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'send',
      'sendAnyOne',
    ]);
    TestBed.configureTestingModule({
      providers: [
        WhatsappService,
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });
    service = TestBed.inject(WhatsappService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sendToPhones → forwards a WHATSAPP/ANYONE request to NotificationService.sendAnyOne', () => {
    notificationServiceSpy.sendAnyOne.and.returnValue(of('ok'));
    let received!: SendNotificationRequest;
    notificationServiceSpy.sendAnyOne.and.callFake((req: SendNotificationRequest) => {
      received = req;
      return of('ok');
    });

    service.sendToPhones(['0612', '0600'], 'bonjour', 'Hi').subscribe(res => {
      expect(res).toBe('ok');
    });

    expect(received).toEqual({
      title: 'Hi',
      message: 'bonjour',
      type: 'INFO',
      channel: 'WHATSAPP',
      targetType: 'ANYONE',
      targetIds: ['0612', '0600'],
    });
    expect(notificationServiceSpy.send).not.toHaveBeenCalled();
  });

  it('sendToPhones → throws synchronously on empty phones WITHOUT calling the API', () => {
    expect(() => service.sendToPhones([], 'bonjour')).toThrowError('WhatsappService.sendToPhones: phones must not be empty');
    expect(notificationServiceSpy.sendAnyOne).not.toHaveBeenCalled();
  });

  it('sendToPhones → uses default type INFO when omitted', () => {
    notificationServiceSpy.sendAnyOne.and.returnValue(of('ok'));
    let captured: SendNotificationRequest | undefined;
    notificationServiceSpy.sendAnyOne.and.callFake((req: SendNotificationRequest) => {
      captured = req;
      return of('ok');
    });
    service.sendToPhones(['0612'], 'hey').subscribe();
    expect(captured?.type).toBe('INFO');
    expect(captured?.title).toBeUndefined();
  });

  it('sendWhatsApp → passes a request with channel already WHATSAPP to send() unchanged', () => {
    notificationServiceSpy.send.and.returnValue(of('sent'));
    const request: SendNotificationRequest = {
      message: 'x',
      type: 'WARNING',
      channel: 'WHATSAPP',
      targetType: 'ADMIN',
      targetIds: ['ADMIN'],
    };
    service.sendWhatsApp(request).subscribe(res => expect(res).toBe('sent'));
    expect(notificationServiceSpy.send).toHaveBeenCalledWith(request);
  });

  it('sendWhatsApp → forces channel WHATSAPP when the request lacks it', () => {
    notificationServiceSpy.send.and.returnValue(of('sent'));
    let captured: SendNotificationRequest | undefined;
    notificationServiceSpy.send.and.callFake((req: SendNotificationRequest) => {
      captured = req;
      return of('sent');
    });
    service.sendWhatsApp({
      message: 'x',
      type: 'ERROR',
      targetType: 'CLIENT',
      targetIds: ['1'],
    } as unknown as SendNotificationRequest).subscribe();
    expect(captured).toEqual({
      message: 'x',
      type: 'ERROR',
      channel: 'WHATSAPP',
      targetType: 'CLIENT',
      targetIds: ['1'],
    });
  });

  it('sendWhatsApp → rejects/forwards errors from NotificationService.send', () => {
    notificationServiceSpy.send.and.throwError(new Error('backend down'));
    expect(() => {
      service.sendWhatsApp({
        message: 'x',
        type: 'INFO',
        channel: 'WHATSAPP',
        targetType: 'ADMIN',
        targetIds: ['ADMIN'],
      }).subscribe();
    }).toThrowError('backend down');
  });
});