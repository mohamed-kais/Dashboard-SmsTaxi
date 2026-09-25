import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DemandeService } from './demande.service';
import { Demande, DemandeDto, DemandeAdminDto, PageDemandeAdminDto } from '../models/demande.model';

describe('DemandeService', () => {
  let service: DemandeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DemandeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('searchDemandes → GET /api/get-demande with flattened non-empty params only', () => {
    const page: PageDemandeAdminDto = {
      content: [{ id: 1, etat: 'WAITING', clientNom: 'Ali', clientPhone: '0612' } as DemandeAdminDto],
      totalElements: 1,
      totalPages: 1,
    };
    service.searchDemandes({
      page: 1,
      size: 20,
      sort: 'date_depot,desc',
      etat: 'WAITING',
      clientPhone: '0612',
      clientNom: 'Ali',
      location: 'Ariana',
      destination: 'Aéroport',
      minEstimatedPrice: 10,
      maxEstimatedPrice: 50,
    }).subscribe(res => expect(res).toEqual(page));

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/get-demande');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.get('sort')).toBe('date_depot,desc');
    expect(req.request.params.get('etat')).toBe('WAITING');
    expect(req.request.params.get('clientPhone')).toBe('0612');
    expect(req.request.params.get('clientNom')).toBe('Ali');
    expect(req.request.params.get('location')).toBe('Ariana');
    expect(req.request.params.get('destination')).toBe('Aéroport');
    expect(req.request.params.get('minEstimatedPrice')).toBe('10');
    expect(req.request.params.get('maxEstimatedPrice')).toBe('50');
    req.flush(page);
  });

  it('searchDemandes → omits undefined/empty params', () => {
    service.searchDemandes({ page: 0, clientPhone: '', etat: undefined, id: undefined }).subscribe();
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/api/get-demande');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.keys().length).toBe(1);
    req.flush({});
  });

  it('searchDemandes → no params when called with empty query', () => {
    service.searchDemandes().subscribe();
    const req = httpMock.expectOne('/api/get-demande');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({});
  });

  it('getDemandeById → GET /api/get-demande/{id} returns Demande entity', () => {
    const d: Demande = { id: 42, etat: 'WAITING', date_depot: '2026-01-01T10:00:00' };
    service.getDemandeById(42).subscribe(res => expect(res).toEqual(d));
    const req = httpMock.expectOne('/api/get-demande/42');
    expect(req.request.method).toBe('GET');
    req.flush(d);
  });

  it('getDemandesByEtat → GET /api/get-listDemandeParEtat/{etat} with encoded enum', () => {
    const list: Demande[] = [{ id: 1, etat: 'WAITING' }];
    service.getDemandesByEtat('WAITING').subscribe(res => expect(res).toEqual(list));
    const req = httpMock.expectOne('/api/get-listDemandeParEtat/WAITING');
    req.flush(list);
  });

  it('getDemandesByEtat → URL-encodes the etat value', () => {
    const list: Demande[] = [{ id: 1, etat: 'WAITING' }];
    service.getDemandesByEtat('with space').subscribe(res => expect(res).toEqual(list));
    httpMock.expectOne('/api/get-listDemandeParEtat/' + encodeURIComponent('with space')).flush(list);
  });

  it('countDemandesByEtat → GET /api/get-nombreDemandesParEtat/{etat} returns number', () => {
    service.countDemandesByEtat('EXPIRED').subscribe(res => expect(res).toBe(3));
    const req = httpMock.expectOne('/api/get-nombreDemandesParEtat/EXPIRED');
    req.flush(3);
  });

  it('countWaiting → GET /api/nbr-DemandeEnattente', () => {
    service.countWaiting().subscribe(res => expect(res).toBe(5));
    const req = httpMock.expectOne('/api/nbr-DemandeEnattente');
    req.flush(5);
  });

  it('countInProgress → GET /api/nbr-NbrDemandeEncours (doubled Nbr as-declared)', () => {
    service.countInProgress().subscribe(res => expect(res).toBe(2));
    const req = httpMock.expectOne('/api/nbr-NbrDemandeEncours');
    req.flush(2);
  });

  it('createDemande → POST /api/add-demande with DemandeDto body', () => {
    const dto: DemandeDto = { etat: 'WAITING', client: { id: 3 } };
    const created: DemandeDto = { id: 12, etat: 'WAITING' };
    service.createDemande(dto).subscribe(res => expect(res).toEqual(created));
    const req = httpMock.expectOne('/api/add-demande');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);
  });

  it('updateDemande → PUT /api/update-demande with full Demande body', () => {
    const dto: Demande = { id: 12, etat: 'IN_PROGRESS' };
    service.updateDemande(dto).subscribe(res => expect(res).toEqual(dto));
    const req = httpMock.expectOne('/api/update-demande');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(dto);
  });

  it('updateEtat → PUT /api/update-EtatDemande/{etat} with { id, etat } body', () => {
    service.updateEtat(12, 'CANCELLED').subscribe();
    const req = httpMock.expectOne('/api/update-EtatDemande/CANCELLED');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ id: 12, etat: 'CANCELLED' });
    req.flush(null);
  });

  it('updateEtatAffectee → PUT /api/update-modifierEtatDemandeAffectee/{etat} with given body or fallback', () => {
    service.updateEtatAffectee('STARTED').subscribe();
    let req = httpMock.expectOne('/api/update-modifierEtatDemandeAffectee/STARTED');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ etat: 'STARTED' });
    req.flush(null);

    service.updateEtatAffectee('EXPIRED', { id: 7, etat: 'EXPIRED' }).subscribe();
    req = httpMock.expectOne('/api/update-modifierEtatDemandeAffectee/EXPIRED');
    expect(req.request.body).toEqual({ id: 7, etat: 'EXPIRED' });
    req.flush(null);
  });

  it('updateStateByPhone → PATCH /api/update-state-demands/{phone} with { etat } body (encoded phone)', () => {
    const resp: DemandeDto = { id: 1, etat: 'EXPIRED' };
    service.updateStateByPhone('+216 12 345 678', { etat: 'EXPIRED' }).subscribe(res => expect(res).toEqual(resp));
    const req = httpMock.expectOne(r => r.method === 'PATCH' && r.url === '/api/update-state-demands/' + encodeURIComponent('+216 12 345 678'));
    expect(req.request.body).toEqual({ etat: 'EXPIRED' });
    req.flush(resp);
  });

  it('cancelDemande → DELETE /api/cancel-demande/{id} with cancelledByTaxi=true param', () => {
    const resp = { success: true, message: 'done', demandeId: 9, cancelledByTaxi: true };
    service.cancelDemande(9, true).subscribe(res => expect(res).toEqual(resp));
    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url === '/api/cancel-demande/9');
    expect(req.request.params.get('cancelledByTaxi')).toBe('true');
    req.flush(resp);
  });

  it('cancelDemande → defaults cancelledByTaxi=false when omitted', () => {
    service.cancelDemande(9).subscribe();
    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url === '/api/cancel-demande/9');
    expect(req.request.params.get('cancelledByTaxi')).toBe('false');
    req.flush({});
  });

  it('deleteDemande → DELETE /api/delete-demande/{id}', () => {
    service.deleteDemande(9).subscribe();
    const req = httpMock.expectOne('/api/delete-demande/9');
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('cancelStaleDemandes → PUT /api/update-annulerDemandes60minutes with null body', () => {
    service.cancelStaleDemandes().subscribe();
    const req = httpMock.expectOne('/api/update-annulerDemandes60minutes');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeNull();
    req.flush(null);
  });

  it('processSmsMasquer → PUT /api/update-traiterDemandesParSMSMasquerNumero with null body', () => {
    service.processSmsMasquer().subscribe();
    const req = httpMock.expectOne('/api/update-traiterDemandesParSMSMasquerNumero');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBeNull();
    req.flush(null);
  });
});