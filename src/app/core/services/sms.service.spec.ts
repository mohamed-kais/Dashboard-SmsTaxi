import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SmsService } from './sms.service';
import { SmsIn, SmsInDto, SmsOut, SmsReceived } from '../models/sms.model';

describe('SmsService', () => {
  let service: SmsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SmsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getSmsList → GET /api/get-all returns SmsIn[]', () => {
    const list: SmsIn[] = [{ id: 1, telephone: '0612', contenu: 'hello' }];
    service.getSmsList().subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne('/api/get-all');
    expect(req.request.method).toBe('GET');
    req.flush(list);
  });

  it('getUntreatedSms → GET /api/get-listSMSnonTraites', () => {
    const list: SmsIn[] = [{ id: 2, traitement: false }];
    service.getUntreatedSms().subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne('/api/get-listSMSnonTraites');
    req.flush(list);
  });

  it('getUntreatedByPhone → GET /api/get-listSMSnonTraitesParTelephone/{encoded}', () => {
    const list: SmsIn[] = [{ id: 3, telephone: '0612' }];
    service.getUntreatedByPhone('+216 90 000 000').subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/get-listSMSnonTraitesParTelephone/' + encodeURIComponent('+216 90 000 000'));
    req.flush(list);
  });

  it('countSms → GET /api/nbr-sms returns number', () => {
    service.countSms().subscribe(res => expect(res).toBe(128));
    const req = httpMock.expectOne('/api/nbr-sms');
    req.flush(128);
  });

  it('updateSms → PUT /api/update-sms with SmsIn body', () => {
    const dto: SmsIn = { id: 1, traitement: true };
    service.updateSms(dto).subscribe(res => expect(res).toEqual(dto));
    const req = httpMock.expectOne('/api/update-sms');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('deleteSms → DELETE /api/delete-sms/{id}', () => {
    service.deleteSms(5).subscribe();
    const req = httpMock.expectOne('/api/delete-sms/5');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('receiveSms → POST /api/add-sms (Kannel format) with SmsReceived body', () => {
    const dto: SmsReceived = { id: 1, sender: '0612', message: 'bonjour', received_at: '2026-01-01T10:00:00' };
    service.receiveSms(dto).subscribe(res => expect(res).toEqual(dto));
    const req = httpMock.expectOne('/api/add-sms');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('receiveSmsAlt → POST /api/ajouter-sms (taxiMate format) with SmsIn body', () => {
    const dto: SmsIn = { id: 1, telephone: '0612', contenu: 'bonjour' };
    service.receiveSmsAlt(dto).subscribe(res => expect(res).toEqual(dto));
    const req = httpMock.expectOne('/api/ajouter-sms');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('injectSms → POST /api/inject-sms with SmsInDto body, returns MessageResponse', () => {
    const dto: SmsInDto = { contenu: 'hello', telephone: '0612' };
    service.injectSms(dto).subscribe(res => expect(res).toEqual({ message: 'injected' }));
    const req = httpMock.expectOne('/api/inject-sms');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ message: 'injected' });
  });

  it('sendToRabbitMq → POST /api/rabbitMQSender with SmsOut payload', () => {
    const payload: SmsOut = { id: 1, contenu: 'x', telephone: '0612', date_envoi: '2026-01-01' };
    service.sendToRabbitMq(payload).subscribe(res => expect(res).toBe('ok'));
    const req = httpMock.expectOne('/api/rabbitMQSender');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush('ok');
  });

  it('sendToRabbitMq → sends empty object when payload omitted', () => {
    service.sendToRabbitMq().subscribe();
    const req = httpMock.expectOne('/api/rabbitMQSender');
    expect(req.request.body).toEqual({});
    req.flush('');
  });
});