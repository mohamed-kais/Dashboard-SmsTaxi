import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { RatingService } from './rating.service';
import { Rating, RatingDto, TaxiRatingSummaryDto } from '../models/rating.model';

describe('RatingService', () => {
  let service: RatingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RatingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getDriverRatings → GET /taxi-client/api/ratings/driver/{driverId}', () => {
    const ratings: Rating[] = [{ id: 1, driverId: '0612', rating: 5, comment: 'top' }];
    service.getDriverRatings('+216 90 000 000').subscribe(res => expect(res).toEqual(ratings));
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url === '/taxi-client/api/ratings/driver/' + encodeURIComponent('+216 90 000 000'));
    req.flush(ratings);
  });

  it('getDriverAverage → GET /taxi-client/api/ratings/driver/{driverId}/average returns number', () => {
    service.getDriverAverage('0612').subscribe(res => expect(res).toBe(4.62));
    const req = httpMock.expectOne('/taxi-client/api/ratings/driver/0612/average');
    req.flush(4.62);
  });

  it('getTaxiRatingSummary → GET /api/taxis/{taxiId}/rating-summary', () => {
    const summary: TaxiRatingSummaryDto = { taxiId: 3, rating: 4.5, average: 4.2, count: 10 };
    service.getTaxiRatingSummary(3).subscribe(res => expect(res).toEqual(summary));
    const req = httpMock.expectOne('/api/taxis/3/rating-summary');
    req.flush(summary);
  });

  it('getTaxiRatingSummaryByPhone → GET /api/taxis/by-phone/{phone}/rating-summary (encoded)', () => {
    const summary: TaxiRatingSummaryDto = { taxiId: 1, telephone: '+216', rating: 5 };
    service.getTaxiRatingSummaryByPhone('+216 90 111 111').subscribe(res => expect(res).toEqual(summary));
    const req = httpMock.expectOne(r => r.url === '/api/taxis/by-phone/' + encodeURIComponent('+216 90 111 111') + '/rating-summary');
    req.flush(summary);
  });

  it('submitRating → POST /taxi-client/api/ratings with RatingDto body', () => {
    const dto: RatingDto = { driverId: '0612', offreId: 42, rating: 5, comment: 'excellent' };
    const created: Rating = { id: 7, driverId: '0612', offreId: 42, rating: 5 };
    service.submitRating(dto).subscribe(res => expect(res).toEqual(created));
    const req = httpMock.expectOne('/taxi-client/api/ratings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(created);
  });

  it('submitRating → propagates HTTP error', () => {
    let error: unknown;
    service.submitRating({ driverId: 'x', offreId: 1, rating: 6 }).subscribe({ error: e => { error = e; } });
    const req = httpMock.expectOne('/taxi-client/api/ratings');
    req.flush({ message: 'bad request' }, { status: 400, statusText: 'Bad Request' });
    expect((error as { status: number }).status).toBe(400);
  });
});