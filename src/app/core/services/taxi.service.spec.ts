import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TaxiService } from './taxi.service';
import { LocationUpdateDto, PageGetAllTaxisDtoResponse, TaxiCreateDto, TaxiDto } from '../models/taxi.model';
import { OffreHistoryPageDto } from '../models/offre.model';

describe('TaxiService', () => {
  let service: TaxiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaxiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('searchTaxis → GET /api/get-all-taxis with page/size/sort params', () => {
    const page: PageGetAllTaxisDtoResponse = { content: [{ id: 1, telephone: '0612' }], totalElements: 1, totalPages: 1 };
    service.searchTaxis({ page: 2, size: 25, sort: 'id,asc' }).subscribe(res => {
      expect(res).toEqual(page);
    });
    const req = httpMock.expectOne(r => r.url === '/api/get-all-taxis' && r.method === 'GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('25');
    expect(req.request.params.get('sort')).toBe('id,asc');
    req.flush(page);
  });

  it('searchTaxis → omits params when query empty', () => {
    service.searchTaxis().subscribe(() => {});
    const req = httpMock.expectOne('/api/get-all-taxis');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });

  it('searchTaxis → surfaces HTTP error through the observable', () => {
    let error: unknown;
    service.searchTaxis({}).subscribe({ error: e => { error = e; } });
    const req = httpMock.expectOne('/api/get-all-taxis');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    expect((error as { status: number }).status).toBe(500);
  });

  it('searchTaxisCriteria → GET /api/get-all-taxis-criteria with phone+name filters', () => {
    service.searchTaxisCriteria({ page: 0, size: 10, phone: '0612345678', name: 'Ali' }).subscribe();
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/get-all-taxis-criteria');
    expect(req.request.params.get('phone')).toBe('0612345678');
    expect(req.request.params.get('name')).toBe('Ali');
    expect(req.request.params.get('page')).toBe('0');
    req.flush({ content: [] });
  });

  it('getTaxiById → GET /api/get-taxis/{id}', () => {
    const taxi: TaxiDto = { id: 42, telephone: '0622' };
    service.getTaxiById(42).subscribe(res => expect(res).toEqual(taxi));
    const req = httpMock.expectOne('/api/get-taxis/42');
    expect(req.request.method).toBe('GET');
    req.flush(taxi);
  });

  it('getTaxiByPhone → GET /api/taxi_byphone/{tel} with encoded phone', () => {
    const taxi: TaxiDto = { id: 1, telephone: '+216 25 000 000' };
    service.getTaxiByPhone('+216 25 000 000').subscribe(res => expect(res).toEqual(taxi));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/taxi_byphone/' + encodeURIComponent('+216 25 000 000'));
    req.flush(taxi);
  });

  it('checkStatus → GET /api/checkTaxiStatus/{phone} returns boolean', () => {
    service.checkStatus('0612345678').subscribe(res => expect(res).toBe(true));
    const req = httpMock.expectOne('/api/checkTaxiStatus/0612345678');
    req.flush(true);
  });

  it('existsByPhone → GET /api/existByPhone/{phone} returns boolean', () => {
    service.existsByPhone('0612345678').subscribe(res => expect(res).toBe(false));
    const req = httpMock.expectOne('/api/existByPhone/0612345678');
    req.flush(false);
  });

  it('getTaxiCount → GET /api/nbr-taxi returns number', () => {
    service.getTaxiCount().subscribe(res => expect(res).toBe(17));
    const req = httpMock.expectOne('/api/nbr-taxi');
    req.flush(17);
  });

  it('getRatingSummary → GET /api/taxis/{id}/rating-summary', () => {
    const summary = { taxiId: 3, telephone: 'x', rating: 4.5, average: 4.2, count: 10 };
    service.getRatingSummary(3).subscribe(res => expect(res).toEqual(summary));
    const req = httpMock.expectOne('/api/taxis/3/rating-summary');
    req.flush(summary);
  });

  it('getRatingSummaryByPhone → GET /api/taxis/by-phone/{phone}/rating-summary', () => {
    const summary = { taxiId: 3, telephone: 'x', rating: 4.5, average: 4.2, count: 10 };
    service.getRatingSummaryByPhone('+21690000000').subscribe(res => expect(res).toEqual(summary));
    const req = httpMock.expectOne(r => r.url === '/api/taxis/by-phone/' + encodeURIComponent('+21690000000') + '/rating-summary');
    req.flush(summary);
  });

  it('getRideHistory → GET /api/history-traffic-taxi/{phone}/page with 1-based page+limit and filters', () => {
    const history: OffreHistoryPageDto = { page: 2, limit: 10, total: 1, items: [] };
    service.getRideHistory('0612', 2, 10, { from: '2026-01-01', to: '2026-01-31', month: 1, year: 2026, status: 'TERMINATED', q: 'airport', sort: 'date_depot,asc', direction: 'ASC' })
      .subscribe(res => expect(res).toEqual(history));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/history-traffic-taxi/' + encodeURIComponent('0612') + '/page');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('from')).toBe('2026-01-01');
    expect(req.request.params.get('to')).toBe('2026-01-31');
    expect(req.request.params.get('month')).toBe('1');
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('status')).toBe('TERMINATED');
    expect(req.request.params.get('q')).toBe('airport');
    expect(req.request.params.get('sort')).toBe('date_depot,asc');
    expect(req.request.params.get('direction')).toBe('ASC');
    req.flush(history);
  });

  it('getRideHistory → defaults page=1 limit=20 with no filter params', () => {
    service.getRideHistory('0612').subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/history-traffic-taxi/0612/page');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.keys().length).toBe(2);
    req.flush({});
  });

  it('createTaxi → POST /api/add-taxi with TaxiCreateDto body', () => {
    const created: TaxiDto = { id: 9, telephone: '0600', nom: 'N' };
    const dto: TaxiCreateDto = { telephone: '0600', nom: 'N' };
    service.createTaxi(dto).subscribe(res => expect(res).toEqual(created));
    const req = httpMock.expectOne('/api/add-taxi');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);
  });

  it('updateTaxi → PATCH /api/update-taxi/{id} with body', () => {
    const updated: TaxiDto = { id: 5, taxiStatus: 'APPROVED' };
    const dto: TaxiCreateDto = { telephone: '0612', taxiStatus: 'APPROVED' };
    service.updateTaxi(5, dto).subscribe(res => expect(res).toEqual(updated));
    const req = httpMock.expectOne('/api/update-taxi/5');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(dto);
    req.flush(updated);
  });

  it('updateGps → PATCH /api/update_gps/{taxiID} with LocationUpdateDto', () => {
    const gps: LocationUpdateDto = { latitude: 36.8, longitude: 10.2, bearing: 90 };
    service.updateGps(7, gps).subscribe(res => expect(res).toEqual(gps));
    const req = httpMock.expectOne('/api/update_gps/7');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(gps);
    req.flush(gps);
  });

  it('deleteTaxi → DELETE /api/delete-taxi/{id}', () => {
    service.deleteTaxi(11).subscribe();
    const req = httpMock.expectOne('/api/delete-taxi/11');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});