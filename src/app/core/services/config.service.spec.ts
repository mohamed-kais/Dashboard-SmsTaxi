import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ConfigService } from './config.service';
import {
  AirportPricingConfigRequest,
  AirportPricingConfigResponse,
  MatchingConfigRequest,
  MatchingConfigResponse,
} from '../models/config.model';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMatchingConfig → GET /api/matching-config', () => {
    const cfg: MatchingConfigResponse = { baseDistanceMeters: 2000, maxDistanceMeters: 5000 };
    service.getMatchingConfig().subscribe(res => expect(res).toEqual(cfg));
    const req = httpMock.expectOne('/api/matching-config');
    expect(req.request.method).toBe('GET');
    req.flush(cfg);
  });

  it('updateMatchingConfig → PUT /api/matching-config with request body', () => {
    const dto: MatchingConfigRequest = { baseDistanceMeters: 3000 };
    const resp: MatchingConfigResponse = { baseDistanceMeters: 3000, maxDistanceMeters: 5000 };
    service.updateMatchingConfig(dto).subscribe(res => expect(res).toEqual(resp));
    const req = httpMock.expectOne('/api/matching-config');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(resp);
  });

  it('getAirportPricing → GET /api/airport-pricing', () => {
    const cfg: AirportPricingConfigResponse = { surchargeValue: 3, surchargeType: 'FIXED_AMOUNT', airportRadiusMeters: 8000, airports: [[36.8, 10.2]] };
    service.getAirportPricing().subscribe(res => expect(res).toEqual(cfg));
    const req = httpMock.expectOne('/api/airport-pricing');
    expect(req.request.method).toBe('GET');
    req.flush(cfg);
  });

  it('updateAirportPricing → PUT /api/airport-pricing (dashboard-compat alias) with request body', () => {
    const dto: AirportPricingConfigRequest = { surchargeValue: 5 };
    const resp: AirportPricingConfigResponse = { surchargeValue: 5 };
    service.updateAirportPricing(dto).subscribe(res => expect(res).toEqual(resp));
    const req = httpMock.expectOne('/api/airport-pricing');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(resp);
  });
});