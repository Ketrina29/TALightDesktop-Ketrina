import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConfigService]
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

  it('should get config via GET', () => {
    const mockConfig = { theme: 'dark' };

    service.getConfig().subscribe(config => {
      expect(config).toEqual(mockConfig);
    });

    const req = httpMock.expectOne('src/app/services/config-service/config.service.ts');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);
  });

  it('should update config via PUT', () => {
    const newConfig = { theme: 'light' };

    service.updateConfig(newConfig).subscribe(response => {
      expect(response).toEqual(newConfig);
    });

    const req = httpMock.expectOne('src/app/services/config-service/config.service.ts');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(newConfig);
    req.flush(newConfig);
  });
});
