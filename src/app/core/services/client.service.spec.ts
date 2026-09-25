import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ClientService } from './client.service';
import { Client, ClientCreateDto, ClientDto, UpdateClientLocations } from '../models/client.model';
import { OffreHistoryPageDto } from '../models/offre.model';

describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getClients → GET /api/get-allClients returns ClientDto[]', () => {
    const clients: ClientDto[] = [{ id: 1, telephone: '0612' }];
    service.getClients().subscribe(res => expect(res).toEqual(clients));
    const req = httpMock.expectOne('/api/get-allClients');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(clients);
  });

  it('getClientById → GET /api/get-client/{id}', () => {
    const client: ClientDto = { id: 42, telephone: '0622' };
    service.getClientById(42).subscribe(res => expect(res).toEqual(client));
    const req = httpMock.expectOne('/api/get-client/42');
    expect(req.request.method).toBe('GET');
    req.flush(client);
  });

  it('getClientByPhone → GET /api/get-Clientby-phone/{encoded phone} single object', () => {
    const client: ClientDto = { id: 7, telephone: '+216 90 000 000' };
    service.getClientByPhone('+216 90 000 000').subscribe(res => expect(res).toEqual(client));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/get-Clientby-phone/' + encodeURIComponent('+216 90 000 000'));
    req.flush(client);
  });

  it('getClientsByPhone → GET /api/get-clientbyphone/{encoded telephone} returns array', () => {
    const list: ClientDto[] = [{ id: 1, telephone: '0612' }];
    service.getClientsByPhone('0612').subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/get-clientbyphone/' + encodeURIComponent('0612'));
    expect(Array.isArray(list)).toBeTrue();
    req.flush(list);
  });

  it('getClientCount → GET /api/nbr-client returns number', () => {
    service.getClientCount().subscribe(res => expect(res).toBe(25));
    const req = httpMock.expectOne('/api/nbr-client');
    req.flush(25);
  });

  it('createClient → POST /api/add-client with ClientCreateDto body', () => {
    const dto: ClientCreateDto = { telephone: '0612', name: 'Ali' };
    const created: ClientDto = { id: 9, telephone: '0612' };
    service.createClient(dto).subscribe(res => expect(res).toEqual(created));
    const req = httpMock.expectOne('/api/add-client');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);
  });

  it('updateClient → PUT /api/update-client/{id} with ClientDto body', () => {
    const dto: ClientDto = { id: 5, telephone: '0600' };
    service.updateClient(5, dto).subscribe(res => expect(res).toEqual(dto));
    const req = httpMock.expectOne('/api/update-client/5');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('updateClientByPhone → PATCH /api/update-client-by-phone/{encoded phone} with UpdateClientLocations', () => {
    const dto: UpdateClientLocations = { destination: 'Airport', location: 'City Center' };
    const client: ClientDto = { id: 3, telephone: '0612' };
    service.updateClientByPhone('+216 12 345 678', dto).subscribe(res => expect(res).toEqual(client));
    const req = httpMock.expectOne(r => r.method === 'PATCH' && r.url === '/api/update-client-by-phone/' + encodeURIComponent('+216 12 345 678'));
    expect(req.request.body).toEqual(dto);
    req.flush(client);
  });

  it('deleteClient → DELETE /api/delete-client/{id} returns deleted Client', () => {
    const deleted: Client = { id: 11, telephone: '0600' };
    service.deleteClient(11).subscribe(res => expect(res).toEqual(deleted));
    const req = httpMock.expectOne('/api/delete-client/11');
    expect(req.request.method).toBe('DELETE');
    req.flush(deleted);
  });

  it('getRideHistory → GET /api/history-traffic-client/{phone}/page with all filters as flat params', () => {
    const history: OffreHistoryPageDto = { page: 2, limit: 10, total: 1, items: [] };
    service.getRideHistory('0612', 2, 10, {
      from: '2026-01-01',
      to: '2026-01-31',
      month: 1,
      year: 2026,
      status: 'TERMINATED',
      q: 'airport',
      sort: 'id,desc',
      direction: 'DESC',
    }).subscribe(res => expect(res).toEqual(history));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/history-traffic-client/' + encodeURIComponent('0612') + '/page');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('from')).toBe('2026-01-01');
    expect(req.request.params.get('to')).toBe('2026-01-31');
    expect(req.request.params.get('month')).toBe('1');
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('status')).toBe('TERMINATED');
    expect(req.request.params.get('q')).toBe('airport');
    expect(req.request.params.get('sort')).toBe('id,desc');
    expect(req.request.params.get('direction')).toBe('DESC');
    req.flush(history);
  });

  it('getRideHistory → defaults page=1 limit=20 and sends only those two when no filters', () => {
    service.getRideHistory('0612').subscribe();
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/history-traffic-client/0612/page');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.keys().length).toBe(2);
    req.flush({});
  });

  it('getRideHistory → propagates HTTP error', () => {
    let error: unknown;
    service.getRideHistory('0612').subscribe({ error: e => { error = e; } });
    const req = httpMock.expectOne(r => r.url === '/api/history-traffic-client/0612/page');
    req.flush({ message: 'nope' }, { status: 404, statusText: 'Not Found' });
    expect((error as { status: number }).status).toBe(404);
  });
});