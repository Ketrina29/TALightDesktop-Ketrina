import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { ConnectionManagerService } from '../services/connection-manager-service/connection-manager.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let connectionManagerService: jasmine.SpyObj<ConnectionManagerService>;
  let router: jasmine.SpyObj<Router>;
  let mockConnectionState: boolean;

  beforeEach(() => {
    mockConnectionState = true; // vlera default

    const connSpy = jasmine.createSpyObj('ConnectionManagerService', [], {
      get isConnected() {
        return mockConnectionState;
      }
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: ConnectionManagerService, useValue: connSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    connectionManagerService = TestBed.inject(ConnectionManagerService) as jasmine.SpyObj<ConnectionManagerService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true when connected', () => {
    mockConnectionState = true;
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should return true when not connected (current logic)', () => {
    mockConnectionState = false;
    const result = guard.canActivate({} as any, {} as any);
    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
  
});
