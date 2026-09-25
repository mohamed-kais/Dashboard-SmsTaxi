import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ReservationService } from './reservation.service';
import {
  AssignTaxiRequest,
  PageReservationResponse,
  ReservationResponse,
  UpdateReservationRequest,
} from '../models/reservation.model';

describe('ReservationService', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('searchReservations → GET /api/admin/reservations with flattened page/size/sort/status', () => {
    const page: PageReservationResponse = {
      content: [{ id: 1, status: 'CREATED', telephone: '0612' }],
      totalElements: 1,
      totalPages: 1,
    };
    service.searchReservations({ page: 0, size: 10, sort: 'reservationDateTime,desc', status: 'CREATED' })
      .subscribe(res => expect(res).toEqual(page));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/admin/reservations');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.get('sort')).toBe('reservationDateTime,desc');
    expect(req.request.params.get('status')).toBe('CREATED');
    req.flush(page);
  });

  it('searchReservations → sends no params when query empty', () => {
    service.searchReservations().subscribe();
    const req = httpMock.expectOne('/api/admin/reservations');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });

  it('listByTaxi → GET /api/admin/reservations/by-taxi with taxiId/telephone/status filters', () => {
    service.listByTaxi({ taxiId: 5, status: 'ASSIGNED', page: 1, size: 15 }).subscribe();
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/admin/reservations/by-taxi');
    expect(req.request.params.get('taxiId')).toBe('5');
    expect(req.request.params.get('status')).toBe('ASSIGNED');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('15');
    expect(req.request.params.has('telephone')).toBeFalse();
    req.flush({});
  });

  it('listByTaxi → sends telephone variant when taxiId absent', () => {
    service.listByTaxi({ telephone: '+216 90 000 000' }).subscribe();
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/admin/reservations/by-taxi');
    expect(req.request.params.get('telephone')).toBe('+216 90 000 000');
    req.flush({});
  });

  it('getById → GET /api/admin/reservations/{id}', () => {
    const r: ReservationResponse = { id: 42, status: 'CONFIRMED' };
    service.getById(42).subscribe(res => expect(res).toEqual(r));
    const req = httpMock.expectOne('/api/admin/reservations/42');
    expect(req.request.method).toBe('GET');
    req.flush(r);
  });

  it('update → PUT /api/admin/reservations/{id} with UpdateReservationRequest body', () => {
    const dto: UpdateReservationRequest = { finalPrice: 25.5, commentaire: 'ok' };
    const r: ReservationResponse = { id: 42, status: 'CONFIRMED', finalPrice: 25.5 };
    service.update(42, dto).subscribe(res => expect(res).toEqual(r));
    const req = httpMock.expectOne('/api/admin/reservations/42');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(r);
  });

  it('assignTaxi → PUT /api/admin/reservations/{id}/assignment with AssignTaxiRequest', () => {
    const dto: AssignTaxiRequest = { taxiId: 9 };
    const r: ReservationResponse = { id: 42, status: 'ASSIGNED' };
    service.assignTaxi(42, dto).subscribe(res => expect(res).toEqual(r));
    const req = httpMock.expectOne('/api/admin/reservations/42/assignment');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(r);
  });

  it('unassignTaxi → DELETE /api/admin/reservations/{id}/assignment; no params when omitted', () => {
    service.unassignTaxi(42).subscribe();
    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url === '/api/admin/reservations/42/assignment');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });

  it('unassignTaxi → includes cancelledBy + reason params when provided', () => {
    service.unassignTaxi(42, 'admin', 'no show').subscribe();
    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url === '/api/admin/reservations/42/assignment');
    expect(req.request.params.get('cancelledBy')).toBe('admin');
    expect(req.request.params.get('reason')).toBe('no show');
    req.flush({});
  });

  it('createWithAssignment → POST /api/admin/reservations/with-assignment', () => {
    const dto = { reservation: { pickup: 'Ariana', destination: 'Aéroport' }, assignment: { taxiId: 9 } };
    const r: ReservationResponse = { id: 1, status: 'CREATED' };
    service.createWithAssignment(dto).subscribe(res => expect(res).toEqual(r));
    const req = httpMock.expectOne('/api/admin/reservations/with-assignment');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(r);
  });
});