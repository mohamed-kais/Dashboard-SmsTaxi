import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { OffreService } from './offre.service';
import { Offre, OffreAdminDto, OffreDto, PageOffreAdminDto } from '../models/offre.model';

describe('OffreService', () => {
  let service: OffreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OffreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('searchOffres → GET /api/get-all-offres with flattened params', () => {
    service.searchOffres({
      page: 1,
      size: 20,
      sort: 'date_depot,desc',
      etat: 'WAITING',
      taxiPhone: '0612',
      clientPhone: '0600',
      taxiNom: 'Taxi 1',
      clientNom: 'Ali',
      location: 'Ariana',
      destination: 'Aéroport',
      rating: 4,
      minTotalPrice: 10,
      maxTotalPrice: 50,
    }).subscribe();

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/get-all-offres');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('date_depot,desc');
    expect(req.request.params.get('etat')).toBe('WAITING');
    expect(req.request.params.get('taxiPhone')).toBe('0612');
    expect(req.request.params.get('clientPhone')).toBe('0600');
    expect(req.request.params.get('taxiNom')).toBe('Taxi 1');
    expect(req.request.params.get('clientNom')).toBe('Ali');
    expect(req.request.params.get('location')).toBe('Ariana');
    expect(req.request.params.get('destination')).toBe('Aéroport');
    expect(req.request.params.get('rating')).toBe('4');
    expect(req.request.params.get('minTotalPrice')).toBe('10');
    expect(req.request.params.get('maxTotalPrice')).toBe('50');
    req.flush({});
  });

  it('searchOffres → unwraps the live `{ data: Page }` envelope into the Spring page', () => {
    const page: PageOffreAdminDto = {
      content: [{ id: 1, etat: 'WAITING', clientNom: 'Ali' } as OffreAdminDto],
      totalElements: 1,
      totalPages: 1,
    };
    const envelope = { success: true, message: 'ok', data: page };
    service.searchOffres().subscribe(res => expect(res).toEqual(page));
    const req = httpMock.expectOne('/api/get-all-offres');
    req.flush(envelope);
  });

  it('searchOffres → falls back to empty page object when envelope has no data', () => {
    service.searchOffres().subscribe(res => expect(res).toEqual({}));
    const req = httpMock.expectOne('/api/get-all-offres');
    req.flush({ success: true, data: undefined });
  });

  it('getOffreById → GET /api/get-offreParId/{id} returns OffreDto', () => {
    const offre: OffreDto = { id: 3, etat: 'IN_PROGRESS' };
    service.getOffreById(3).subscribe(res => expect(res).toEqual(offre));
    const req = httpMock.expectOne('/api/get-offreParId/3');
    expect(req.request.method).toBe('GET');
    req.flush(offre);
  });

  it('getOffresByEtat → GET /api/get-listOffresParEtat/{etat} with encoded enum', () => {
    const list: OffreDto[] = [{ id: 1, etat: 'WAITING' }];
    service.getOffresByEtat('WAITING').subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne('/api/get-listOffresParEtat/WAITING');
    req.flush(list);
  });

  it('countOffresByEtat → GET /api/nombreOffreParEtat/{etat} returns number', () => {
    service.countOffresByEtat('EXPIRED').subscribe(res => expect(res).toBe(4));
    const req = httpMock.expectOne('/api/nombreOffreParEtat/EXPIRED');
    req.flush(4);
  });

  it('countWaiting → GET /api/NbrOffreEnattente', () => {
    service.countWaiting().subscribe(res => expect(res).toBe(6));
    const req = httpMock.expectOne('/api/NbrOffreEnattente');
    req.flush(6);
  });

  it('countInProgress → GET /api/NbrOffreEncours', () => {
    service.countInProgress().subscribe(res => expect(res).toBe(1));
    const req = httpMock.expectOne('/api/NbrOffreEncours');
    req.flush(1);
  });

  it('getOffreEnCoursByClient → GET /api/offreEnCoursParClient/{id} returns OffreDto or null', () => {
    const offre: OffreDto = { id: 5, etat: 'STARTED' };
    service.getOffreEnCoursByClient(5).subscribe(res => expect(res).toEqual(offre));
    const req = httpMock.expectOne('/api/offreEnCoursParClient/5');
    req.flush(offre);
  });

  it('getMatchingByClient → GET /api/offre_matching_client/{encoded phone}', () => {
    service.getMatchingByClient('+216 90 000 000').subscribe(res => expect(res).toBeNull());
    const req = httpMock.expectOne(r => r.url === '/api/offre_matching_client/' + encodeURIComponent('+216 90 000 000'));
    req.flush(null);
  });

  it('getMatchingByTaxi → GET /api/offre_matching_taxi/{encoded phone}', () => {
    service.getMatchingByTaxi('+216 90 111 111').subscribe(res => expect(res).toBeNull());
    const req = httpMock.expectOne(r => r.url === '/api/offre_matching_taxi/' + encodeURIComponent('+216 90 111 111'));
    req.flush(null);
  });

  it('createOffre → POST /api/ajouterOffre with OffreDto body', () => {
    const dto: OffreDto = { etat: 'WAITING', client: { id: 3 }, taxi: { telephone: '0612' } };
    service.createOffre(dto).subscribe();
    const req = httpMock.expectOne('/api/ajouterOffre');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('updateOffre → PUT /api/update-offre', () => {
    const dto: OffreDto = { id: 3, etat: 'IN_PROGRESS' };
    service.updateOffre(dto).subscribe(res => expect(res).toEqual(dto));
    const req = httpMock.expectOne('/api/update-offre');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('updateEtat → PUT /api/update-EtatOffre/{etat} with { id, etat } body (etat FIRST arg)', () => {
    service.updateEtat('CANCELLED', 12).subscribe();
    const req = httpMock.expectOne('/api/update-EtatOffre/CANCELLED');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ id: 12, etat: 'CANCELLED' });
    req.flush({ id: 12, etat: 'CANCELLED' });
  });

  it('updateStateById → PATCH /api/update-state-offer/{id}/{status} with null body', () => {
    service.updateStateById(3, 'TERMINATED').subscribe();
    const req = httpMock.expectOne('/api/update-state-offer/3/TERMINATED');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBeNull();
    req.flush({});
  });

  it('updateStateByPhone → PATCH /api/update_state_offre/{encoded phone} with body', () => {
    const dto: OffreDto = { id: 3, etat: 'STARTED' };
    service.updateStateByPhone('+216 12 345 678', dto).subscribe(res => expect(res).toEqual(dto));
    const req = httpMock.expectOne(r => r.method === 'PATCH' && r.url === '/api/update_state_offre/' + encodeURIComponent('+216 12 345 678'));
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('patchRouteText → PATCH /api/offers/{id}/route-text/{encoded phone} with labels body', () => {
    const body = { location: 'Gare', destination: 'Habib Bourguiba' };
    const resp: OffreDto = { id: 3, etat: 'WAITING' };
    service.patchRouteText(3, '+216 12 345 678', body).subscribe(res => expect(res).toEqual(resp));
    const req = httpMock.expectOne(r => r.method === 'PATCH' && r.url === '/api/offers/3/route-text/' + encodeURIComponent('+216 12 345 678'));
    expect(req.request.body).toEqual(body);
    req.flush(resp);
  });

  it('cancelOffre → DELETE /api/cancel-offre/{id} with cancelledByTaxi param (default false)', () => {
    service.cancelOffre(8).subscribe();
    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url === '/api/cancel-offre/8');
    expect(req.request.params.get('cancelledByTaxi')).toBe('false');
    req.flush({});
  });

  it('cancelOffre → propagates cancelledByTaxi=true', () => {
    service.cancelOffre(8, true).subscribe();
    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url === '/api/cancel-offre/8');
    expect(req.request.params.get('cancelledByTaxi')).toBe('true');
    req.flush({});
  });

  it('deleteOffre → DELETE /api/delete-Offre/{id}', () => {
    service.deleteOffre(8).subscribe();
    const req = httpMock.expectOne('/api/delete-Offre/8');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('cancelStaleOffres → PUT /api/update-annulerOffres60minutes with null body', () => {
    service.cancelStaleOffres().subscribe();
    const req = httpMock.expectOne('/api/update-annulerOffres60minutes');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeNull();
    req.flush({});
  });
});