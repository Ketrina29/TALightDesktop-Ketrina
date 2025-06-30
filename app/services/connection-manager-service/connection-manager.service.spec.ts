import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConnectionManagerService } from './connection-manager.service';
import { ApiService } from '../api-service/api.service';

describe('ConnectionManagerService', () => {
  let service: ConnectionManagerService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['setUrl']);
    const router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        ConnectionManagerService,
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: router }
      ]
    });

    service = TestBed.inject(ConnectionManagerService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default isConnected as false', () => {
    expect(service.isConnected).toBeFalse();
  });

  it('should return default url as empty string', () => {
    expect(service.url).toBe('');
  });

  it('should set url if api.setUrl returns true', () => {
    apiServiceSpy.setUrl.and.returnValue(true);
    service.url = 'ws://localhost:1234';
    expect(service.url).toBe('ws://localhost:1234');
    expect(apiServiceSpy.setUrl).toHaveBeenCalledWith('ws://localhost:1234');
  });

  it('should not set url if api.setUrl returns false', () => {
    apiServiceSpy.setUrl.and.returnValue(false);
    service.url = 'invalid-url';
    expect(service.url).toBe('');
    expect(apiServiceSpy.setUrl).toHaveBeenCalledWith('invalid-url');
  });

  it('should disconnect and navigate to /home', () => {
    service.disconnect();
    expect(service.isConnected).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });
  it('should return the current url', () => {
  (service as any)._url = 'ws://localhost:8080';
  expect(service.url).toBe('ws://localhost:8080');
});
it('should set the url if valid', () => {
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const apiSpy = jasmine.createSpyObj('ApiService', ['setUrl']);
  apiSpy.setUrl.and.returnValue(true);

  const localService = new ConnectionManagerService(routerSpy, apiSpy);
  localService.url = 'ws://valid-url';

  expect(localService.url).toBe('ws://valid-url');
});



it('should not set the url if api.setUrl returns false', () => {
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const apiSpy = jasmine.createSpyObj('ApiService', ['setUrl']);
  apiSpy.setUrl.and.returnValue(false);

  const localService = new ConnectionManagerService(routerSpy, apiSpy);
  localService.url = 'invalid-url';

  expect(localService.url).toBe('');
});


it('should set isConnected to false and navigate to /home', () => {
  const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
  const fakeApi = jasmine.createSpyObj('ApiService', ['setUrl']);
  const localService = new ConnectionManagerService(routerSpy, fakeApi);

  (localService as any)._isConnected = true; // workaround për readonly
  localService.disconnect();

  expect(localService.isConnected).toBeFalse();
  expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
});





});
