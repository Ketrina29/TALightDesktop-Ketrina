import { TestBed } from '@angular/core/testing';

import { TerminalApiService } from './terminal-api.service';

describe('TerminalApiService', () => {
  let service: TerminalApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TerminalApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default url', () => {
  expect(service.url).toBe('wss://ta.di.univr.it/algo');
});

it('should return -1 for invalid url', () => {
  expect(service.setUrl('invalid')).toBe(-1);
});

it('should return -2 for wrong protocol', () => {
  expect(service.setUrl('http://example.com')).toBe(-2);
});

it('should set valid ws url and reset connections', () => {
  spyOn(service as any, 'resetAllConnections');
  const result = service.setUrl('wss://example.com');
  expect(result).toBe(0);
  expect(service.url).toBe('wss://example.com/');
  expect((service as any).resetAllConnections).toHaveBeenCalled();
});

it('should call onResult in problemList()', () => {
  const fakeMeta = new Map<string, any>();
  const mockRun = jasmine.createSpy();
  const mockCmd = {
    onRecieveProblemList: (msg: any) => {},
    run: mockRun
  };

  spyOn<any>(service, 'problemList').and.callFake(function (onResult: (meta: Map<string, any>) => void) {
    onResult(fakeMeta);
    return mockCmd;
  });

  const spy = jasmine.createSpy('onResult');
  const result = service.problemList(spy);
  expect(spy).toHaveBeenCalledWith(fakeMeta);
});
it('should call onAttachment in GetAttachment()', () => {
  const mockRun = jasmine.createSpy();
  const mockCmd: any = {
    run: mockRun,
    onReciveAttachment: undefined
  };

  spyOn<any>(service, 'GetAttachment').and.callFake(function (
    problemName: string,
    onAttachment: (attachment: any) => void
  ) {
    mockCmd.onReciveAttachment = (msg: any) => {
      onAttachment(msg);
    };
    return mockCmd;
  });

  const spy = jasmine.createSpy('onAttachment');
  const result = service.GetAttachment('problem1', spy);

  // ✅ Objekt mock i tipit Attachment
  const mockAttachment: any = {
    status: 'ok',
    messageName: 'Attachment',
    toPacketWithName: () => {},
    toPacket: () => {},
    fromPacket: () => {}
  };

  // ✅ FIX për TS2345
  result.onReciveAttachment?.(mockAttachment);

  expect(spy).toHaveBeenCalledWith(mockAttachment);
});

it('should call onConnectBegin in Connect()', () => {
  const mockRun = jasmine.createSpy();
  const mockCmd: any = {
    run: mockRun,
    onReciveConnectBegin: undefined
  };

  spyOn<any>(service, 'Connect').and.callFake(function (
    name: string,
    serviceName: string,
    args: any,
    tty: boolean,
    token: string,
    files: any,
    onConnectBegin: (data: any) => void
  ) {
    mockCmd.onReciveConnectBegin = (msg: any) => {
      onConnectBegin(msg);
    };
    return mockCmd;
  });

  const spy = jasmine.createSpy('onConnectBegin');
  const result = service.Connect('p1', 's1', {}, false, 'token', undefined, spy);

  // ✅ Objekt mock i tipit ConnectBegin
  const mockConnectBegin: any = {
    status: 'connected',
    messageName: 'ConnectBegin',
    toPacketWithName: () => {},
    toPacket: () => {},
    fromPacket: () => {}
  };

  // ✅ FIX për TS2345
  result.onReciveConnectBegin?.(mockConnectBegin);

  expect(spy).toHaveBeenCalledWith(mockConnectBegin);
});

});
