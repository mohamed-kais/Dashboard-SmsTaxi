import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { NotificationService } from './notification.service';
import { NotificationDto } from '../models/notification.model';

/** Mirrors `environment.notificationsBaseUrl` (the service builds ABSOLUTE URLs). */
const BASE = 'http://41.225.11.231:8444/taxi-client';
const READ_IDS_KEY = 'smsTaxi.notification.readIds';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('builds ABSOLUTE urls under notificationsBaseUrl (passes interceptor unchanged)', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(`${BASE}/api/notifications/all`);
    expect(req.request.url.startsWith('http://')).toBeTrue();
    req.flush([]);
  });

  it('getAll → GET ${base}/api/notifications/all returns NotificationDto[]', () => {
    const list: NotificationDto[] = [{ id: 1, title: 'A' }, { id: 2, title: 'B' }];
    service.getAll().subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(`${BASE}/api/notifications/all`);
    expect(req.request.method).toBe('GET');
    req.flush(list);
  });

  it('getAllFiltered → GET all/filter with page/size/sort/title/message params only when set', () => {
    const page = { content: [{ id: 1, title: 'hello' }], totalElements: 1, totalPages: 1, size: 1, number: 0, first: true, numberOfElements: 1, last: true, empty: false };
    service.getAllFiltered({ page: 2, size: 50, sort: 'createdAt,desc', title: 'hello', message: 'world' })
      .subscribe(res => expect(res).toEqual(page));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/api/notifications/all/filter`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    expect(req.request.params.get('sort')).toBe('createdAt,desc');
    expect(req.request.params.get('title')).toBe('hello');
    expect(req.request.params.get('message')).toBe('world');
    req.flush(page);
  });

  it('getAllFiltered → drops empty filters', () => {
    service.getAllFiltered({ page: 0, title: '', message: undefined }).subscribe();
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/api/notifications/all/filter`);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.keys().length).toBe(1);
    req.flush({});
  });

  it('getByClient → GET .../client/{clientId}', () => {
    const list: NotificationDto[] = [{ id: 7 }];
    service.getByClient(7).subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(`${BASE}/api/notifications/client/7`);
    req.flush(list);
  });

  it('getByTaxi → GET .../taxi/{taxiId}', () => {
    const list: NotificationDto[] = [{ id: 9 }];
    service.getByTaxi(9).subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(`${BASE}/api/notifications/taxi/9`);
    req.flush(list);
  });

  it('getByTargetType → GET .../target-notif/{encoded targetType} unpaged', () => {
    const list: NotificationDto[] = [{ id: 3 }];
    service.getByTargetType('CLIENT').subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(`${BASE}/api/notifications/target-notif/CLIENT`);
    expect(req.request.params.keys().length).toBe(0);
    req.flush(list);
  });

  it('getByTargetType → URL-encodes the target type', () => {
    const list: NotificationDto[] = [{ id: 4 }];
    service.getByTargetType('two words').subscribe(res => expect(res).toEqual(list));
    httpMock.expectOne(`${BASE}/api/notifications/target-notif/${encodeURIComponent('two words')}`).flush(list);
  });

  it('getByTargetTypeFiltered → normalizes a bare array response', () => {
    const list: NotificationDto[] = [{ id: 1 }, { id: 2 }];
    service.getByTargetTypeFiltered('TAXI', { page: 0, size: 10 }).subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/api/notifications/target/TAXI`);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(list);
  });

  it('getByTargetTypeFiltered → unwraps Spring Page wrapper { content: [...] }', () => {
    const page = { content: [{ id: 5 }, { id: 6 }], totalElements: 2, totalPages: 1 };
    service.getByTargetTypeFiltered('TAXI').subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
      expect(res).toEqual(page.content);
    });
    const req = httpMock.expectOne(`${BASE}/api/notifications/target/TAXI`);
    req.flush(page);
  });

  it('getByTargetTypeFiltered → wraps a single NotificationDto and empty on null', () => {
    let captured: NotificationDto[] | undefined;
    service.getByTargetTypeFiltered('ADMIN').subscribe(res => { captured = res; });
    const req = httpMock.expectOne(`${BASE}/api/notifications/target/ADMIN`);
    req.flush({ id: 1 });
    expect(captured).toEqual([{ id: 1 }]);

    service.getByTargetTypeFiltered('ADMIN').subscribe(res => { captured = res; });
    const req2 = httpMock.expectOne(`${BASE}/api/notifications/target/ADMIN`);
    req2.flush(null);
    expect(captured).toEqual([]);
  });

  it('getLatestByTarget → delegates to target query with createdAt,desc sort', () => {
    const list: NotificationDto[] = [{ id: 1 }];
    service.getLatestByTarget('ADMIN', 1, 5).subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/api/notifications/target/ADMIN`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.params.get('sort')).toBe('createdAt,desc');
    req.flush(list);
  });

  it('getTaxisCriteria → GET .../api/get-all-taxis-criteria with nested response', () => {
    const nested = {
      taxis: { content: [{ id: 1, nom: 'Taxi 1', telephone: '0612' }], totalElements: 1, totalPages: 1, size: 1, number: 0 },
      stats: {},
    };
    service.getTaxisCriteria({ page: 0, size: 10, name: 'Ali' }).subscribe(res => expect(res).toEqual(nested));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/api/get-all-taxis-criteria`);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('name')).toBe('Ali');
    expect(req.request.params.has('phone')).toBeFalse();
    req.flush(nested);
  });

  it('getClientsCriteria → GET .../api/get-all-clients-criteria flat page', () => {
    const page = { content: [{ id: 2, nom: 'Sami', telephone: '0600' }], totalElements: 1, totalPages: 1, size: 1, number: 0 };
    service.getClientsCriteria({ phone: '0612' }).subscribe(res => expect(res).toEqual(page));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === `${BASE}/api/get-all-clients-criteria`);
    expect(req.request.params.get('phone')).toBe('0612');
    req.flush(page);
  });

  it('send → POST .../api/notifications/send with SendNotificationRequest body', () => {
    const request = {
      message: 'bonjour',
      type: 'INFO' as const,
      channel: 'WHATSAPP' as const,
      targetType: 'ANYONE' as const,
      targetIds: ['0612'],
    };
    service.send(request).subscribe(res => expect(res).toBe('ok'));
    const req = httpMock.expectOne(`${BASE}/api/notifications/send`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush('ok');
  });

  it('sendAnyOne → POST .../api/notifications/send-any-one with body', () => {
    const request = {
      message: 'hi',
      type: 'INFO' as const,
      channel: 'SMS' as const,
      targetType: 'ANYONE' as const,
      targetIds: ['0612', '0600'],
    };
    service.sendAnyOne(request).subscribe(res => expect(res).toBe('sent'));
    const req = httpMock.expectOne(`${BASE}/api/notifications/send-any-one`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush('sent');
  });

  it('readIds$ starts empty; markAsRead persists to localStorage and emits', () => {
    expect(service.isRead(5)).toBeFalse();
    let current = new Set<number>();
    service.readIds$.subscribe(s => { current = s; });
    service.markAsRead(5);
    expect(current.has(5)).toBeTrue();
    expect(service.isRead(5)).toBeTrue();
    expect(JSON.parse(localStorage.getItem(READ_IDS_KEY) ?? '[]')).toEqual([5]);
  });

  it('markAllAsRead adds several ids', () => {
    service.markAllAsRead([1, 2, 3]);
    expect(service.isRead(1)).toBeTrue();
    expect(service.isRead(3)).toBeTrue();
    expect(service.isRead(4)).toBeFalse();
    expect(JSON.parse(localStorage.getItem(READ_IDS_KEY) ?? '[]')).toEqual([1, 2, 3]);
  });

  it('readIds$ survives a new service instance via localStorage', () => {
    service.markAsRead(42);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const reloaded = TestBed.inject(NotificationService);
    expect(reloaded.isRead(42)).toBeTrue();
  });

  it('markAsRead is idempotent (no duplicate ids persisted)', () => {
    service.markAsRead(7);
    service.markAsRead(7);
    const stored = JSON.parse(localStorage.getItem(READ_IDS_KEY) ?? '[]');
    expect(stored).toEqual([7]);
  });

  it('loadReadIds → tolerates corrupt localStorage payload', () => {
    localStorage.setItem(READ_IDS_KEY, '{not-json');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const reloaded = TestBed.inject(NotificationService);
    expect(reloaded.readIds$.value.size).toBe(0);
    expect(reloaded.isRead(1)).toBeFalse();
  });

  it('loadReadIds → tolerates non-array payload', () => {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify({ 1: true }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const reloaded = TestBed.inject(NotificationService);
    expect(reloaded.readIds$.value.size).toBe(0);
  });

  it('unreadCount counts ids NOT in the read set', () => {
    service.markAsRead(1);
    const notifications: NotificationDto[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(service.unreadCount(notifications)).toBe(2);
  });
});