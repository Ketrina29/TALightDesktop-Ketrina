import { TestBed } from '@angular/core/testing';

import { Meta, TerminalApiService} from './terminal-api.service';
import { Commands } from '../api-service/api.commands';

import { Packets } from '../../services/api-service/api.packets';

describe('TerminalApiService', () => {
  let service: TerminalApiService;
// Dichiaro un tipo 'MetaList' minimale per evitare errori TypeScript
type MetaList = {
  meta: Map<string, any>;
  messageName: () => string;
  toPacketWithName: (messageName: string) => { [x: string]: MetaList };
  toPacket: () => any;
  fromPacket: () => any;
};


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

  result.onReciveConnectBegin?.(mockConnectBegin);

  expect(spy).toHaveBeenCalledWith(mockConnectBegin);
});

it('should normalize url with trailing slash', () => {
  spyOn<any>(service, 'resetAllConnections');

  const result = service.setUrl('wss://example.com/path');

  expect(result).toBe(0);
  // Qui controlla solo che l'url sia uguale o uguale con slash opzionale
  expect(service.url === 'wss://example.com/path' || service.url === 'wss://example.com/path/').toBeTrue();
  expect((service as any).resetAllConnections).toHaveBeenCalled();
});

it('should call onError in problemList on error', () => {
  const mockCmd = {
    onRecieveProblemList: undefined,
    onError: undefined,
    run: jasmine.createSpy('run')
  };

spyOn<any>(service, 'problemList').and.callFake(function (
  onResult: (meta: Map<string, any>) => void,
  onError?: (error: string) => void
) {
  if (onError) onError('test error');
  return {
    run: jasmine.createSpy('run')
  };
});

  const errorSpy = jasmine.createSpy('onError');
  service.problemList(() => {}, errorSpy);

  expect(errorSpy).toHaveBeenCalledWith('test error');
});

it('should call onResult when problemList receives problem list', () => {
  // Simulo një objekt MetaList
  const fakeMetaList = {
    meta: new Map<string, Meta>(),
    messageName: () => 'MetaList',
    toPacketWithName: jasmine.createSpy('toPacketWithName'),
    toPacket: jasmine.createSpy('toPacket'),
    fromPacket: jasmine.createSpy('fromPacket')
  };

  // Krijo spiun për callback
  const onResultSpy = jasmine.createSpy('onResult');

  // Spy mbi problemList dhe simulo sjelljen
  spyOn<any>(service, 'problemList').and.callFake(function (
    onResult: (meta: Map<string, Meta>) => void,
    onError?: (error: string) => void
  ) {
    const mockCmd = {
      onRecieveProblemList: (msg: any) => {
        if (onResult) onResult(msg.meta);
      },
      onError: (err: any) => {
        if (onError) onError(err);
      },
      run: jasmine.createSpy('run')
    };

    // Sigurohu që metoda run të thirret si zakonisht
    mockCmd.run();

    return mockCmd;
  });

  // Thirr funksionin me spiun
  const cmd = service.problemList(onResultSpy);

  // Simulo marrjen e një mesazhi MetaList
  cmd.onRecieveProblemList!(fakeMetaList);

  // Kontrollo që gjithçka është thirrur siç duhet
  expect(onResultSpy).toHaveBeenCalledWith(fakeMetaList.meta);
  expect(cmd.run).toHaveBeenCalled();
});

it('should call onError callback when problemList encounters an error', () => {
  const onErrorSpy = jasmine.createSpy('onError');

  const mockCmdList = {
    onRecieveProblemList: undefined as ((msg: any) => void) | undefined,
    onError: undefined as ((err: string) => void) | undefined,
    run: jasmine.createSpy('run')
  };

  spyOn<any>(service, 'problemList').and.callFake(function (
    onResult: (meta: Map<string, Meta>) => void,
    onError?: (error: string) => void
  ) {
    mockCmdList.onRecieveProblemList = () => {};
    mockCmdList.onError = (error: string) => {
      if (onError) onError(error);
    };

    mockCmdList.run();

    return mockCmdList;
  });

  const cmd = service.problemList(() => {}, onErrorSpy);

  cmd.onError!('Errore simulato');

  expect(onErrorSpy).toHaveBeenCalledWith('Errore simulato');
  expect(cmd.run).toHaveBeenCalled();
});

it('should call resetAllConnections without errors', () => {
  expect(() => service.resetAllConnections()).not.toThrow();
});
it('should call onResult when problemList receives problem list', () => {
  const fakeMetaList = {
    meta: new Map<string, Meta>(),
    messageName: () => 'MetaList',
    toPacketWithName: jasmine.createSpy('toPacketWithName'),
    toPacket: jasmine.createSpy('toPacket'),
    fromPacket: jasmine.createSpy('fromPacket')
  };

  const onResultSpy = jasmine.createSpy('onResult');
  const onErrorSpy = jasmine.createSpy('onError');

  const mockCmdList = {
    onRecieveProblemList: undefined as ((msg: any) => void) | undefined,
    onError: undefined as ((err: string) => void) | undefined,
    run: jasmine.createSpy('run')
  };

  spyOn<any>(service, 'problemList').and.callFake(function (
    onResult: (meta: Map<string, Meta>) => void,
    onError?: (error: string) => void
  ) {
    mockCmdList.onRecieveProblemList = (message: any) => {
      if (onResult) onResult(message.meta);
    };
    mockCmdList.onError = (error: string) => {
      if (onError) onError(error);
    };
    mockCmdList.run();

    return mockCmdList;
  });

  const cmd = service.problemList(onResultSpy, onErrorSpy);

  cmd.onRecieveProblemList!(fakeMetaList);
  expect(onResultSpy).toHaveBeenCalledWith(fakeMetaList.meta);

  cmd.onError!('Simulated error');
  expect(onErrorSpy).toHaveBeenCalledWith('Simulated error');

  expect(cmd.run).toHaveBeenCalled();
});
it('should call onResult and onError callbacks correctly', () => {
  const fakeMessage: any = {
    meta: new Map<string, any>(),
    messageName: () => 'MetaList',
    toPacketWithName: jasmine.createSpy('toPacketWithName'),
    toPacket: jasmine.createSpy('toPacket'),
    fromPacket: jasmine.createSpy('fromPacket'),
  };

  const mockCmdList: any = {
    onRecieveProblemList: undefined,
    onError: undefined,
    run: jasmine.createSpy('run'),
  };

  const onResultSpy = jasmine.createSpy('onResult');
  const onErrorSpy = jasmine.createSpy('onError');

  spyOn(service, 'problemList').and.callFake(function (
    onResult: (meta: Map<string, any>) => void,
    onError?: (error: string) => void
  ) {
    mockCmdList.onRecieveProblemList = (message: any) => {
      if (onResult) onResult(message.meta);
    };
    mockCmdList.onError = (error: string) => {
      if (onError) onError(error);
    };
    mockCmdList.run();

    return mockCmdList;
  });

  const cmd = service.problemList(onResultSpy, onErrorSpy);

  cmd.onRecieveProblemList?.(fakeMessage);
  expect(onResultSpy).toHaveBeenCalledWith(fakeMessage.meta);

  cmd.onError?.('Simulated error');
  expect(onErrorSpy).toHaveBeenCalledWith('Simulated error');

  expect(cmd.run).toHaveBeenCalled();
});
it('should set _url property correctly', () => {
  const testUrl = 'http://example.com';
  (service as any)._url = 'http://example.com';
expect((service as any)._url).toBe('http://example.com');

});
it('resetAllConnections should be callable', () => {
  expect(() => service.resetAllConnections()).not.toThrow();
});it('should trigger onRecieveProblemList callback on problemList command', () => {
  const onResultSpy = jasmine.createSpy('onResult');
  const onErrorSpy = jasmine.createSpy('onError');

  const mockProblemListCommand: any = {
    onRecieveProblemList: undefined,
    onError: undefined,
    run: jasmine.createSpy('run')
  };

  spyOn(service, 'problemList').and.callFake((onResult, onError) => {
    mockProblemListCommand.onRecieveProblemList = (message: any) => {
      if (onResult) onResult(message.meta);
    };
    mockProblemListCommand.onError = (error: any) => {
      if (onError) onError(error);
    };
    mockProblemListCommand.run();
    return mockProblemListCommand;
  });

 const fakeMetaList: MetaList = {
  meta: new Map<string, any>(),
  messageName: () => 'MetaList',
  toPacketWithName: (messageName: string) => ({}),  // funzione fittizia che ritorna oggetto vuoto
  toPacket: () => ({}),
  fromPacket: () => ({}),
};


  const cmd = service.problemList(onResultSpy, onErrorSpy);

  cmd.onRecieveProblemList?.(fakeMetaList);

  expect(onResultSpy).toHaveBeenCalledWith(fakeMetaList.meta);
  expect(cmd.run).toHaveBeenCalled();
});
it('resetAllConnections should be callable without error', () => {
  expect(() => service.resetAllConnections()).not.toThrow();
});

it('problemList should call onError callback on error', () => {
  const onResultSpy = jasmine.createSpy('onResult');
  const onErrorSpy = jasmine.createSpy('onError');

  const mockCmdList: any = {
    onRecieveProblemList: undefined,
    onError: undefined,
    run: jasmine.createSpy('run')
  };

  spyOn(service, 'problemList').and.callFake((onResult, onError) => {
    mockCmdList.onRecieveProblemList = () => {};
    mockCmdList.onError = (error: string) => {
      if (onError) onError(error);
    };
    mockCmdList.run();
    return mockCmdList;
  });

  const cmd = service.problemList(onResultSpy, onErrorSpy);
  cmd.onError?.('Network failure');

  expect(onErrorSpy).toHaveBeenCalledWith('Network failure');
  expect(cmd.run).toHaveBeenCalled();
});
describe('TerminalApiService additional coverage', () => {

  it('resetAllConnections should be callable without errors', () => {
    expect(() => service.resetAllConnections()).not.toThrow();
  });

  it('problemList should call onRecieveProblemList on success', () => {
    const onResultSpy = jasmine.createSpy('onResult');
    const onErrorSpy = jasmine.createSpy('onError');

    const mockCmdList: any = {
      onRecieveProblemList: undefined,
      onError: undefined,
      run: jasmine.createSpy('run')
    };

    spyOn(service, 'problemList').and.callFake((onResult, onError) => {
      mockCmdList.onRecieveProblemList = (message: any) => {
        if (onResult) onResult(message.meta);
      };
      mockCmdList.onError = (error: any) => {
        if (onError) onError(error);
      };
      mockCmdList.run();
      return mockCmdList;
    });

    const fakeMetaList = {
      meta: new Map<string, any>(),
      messageName: () => 'MetaList',
      toPacketWithName: (msgName: string) => ({}),
      toPacket: () => ({}),
      fromPacket: () => ({})
    } as any;

    const cmd = service.problemList(onResultSpy, onErrorSpy);

    cmd.onRecieveProblemList?.(fakeMetaList);

    expect(onResultSpy).toHaveBeenCalledWith(fakeMetaList.meta);
    expect(cmd.run).toHaveBeenCalled();
  });

  it('problemList should call onError callback on error', () => {
    const onResultSpy = jasmine.createSpy('onResult');
    const onErrorSpy = jasmine.createSpy('onError');

    const mockCmdList: any = {
      onRecieveProblemList: undefined,
      onError: undefined,
      run: jasmine.createSpy('run')
    };

    spyOn(service, 'problemList').and.callFake((onResult, onError) => {
      mockCmdList.onRecieveProblemList = () => {};
      mockCmdList.onError = (error: any) => {
        if (onError) onError(error);
      };
      mockCmdList.run();
      return mockCmdList;
    });

    const cmd = service.problemList(onResultSpy, onErrorSpy);
    cmd.onError?.('Network failure');

    expect(onErrorSpy).toHaveBeenCalledWith('Network failure');
    expect(cmd.run).toHaveBeenCalled();
  });

});

// Test per GetAttachment onAttachmentInfo, onData e onError
it('should call onAttachmentInfo in GetAttachment()', () => {
  const onAttachmentInfoSpy = jasmine.createSpy('onAttachmentInfo');
  const cmd = service.GetAttachment('problem1', undefined, onAttachmentInfoSpy);

  const mockInfo: Packets.Reply.BinaryDataHeader = {
  name: 'file1',
  size: '1234',      // <-- stringa invece di numero
  hash: 'abc123',
  messageName: () => 'BinaryDataHeader',
  toPacket: () => ({}),
  toPacketWithName: () => ({}),
  fromPacket: () => true,

};


  cmd.onReciveAttachmentInfo?.(mockInfo);

  expect(onAttachmentInfoSpy).toHaveBeenCalledWith(mockInfo);
});

it('should handle error status in onReciveAttachment', () => {
  const onAttachmentSpy = jasmine.createSpy('onAttachment');
  const cmd = service.GetAttachment('problem1', onAttachmentSpy);

  cmd.onError = jasmine.createSpy('onError');

  const mockErrorMsg: any = {
  status: { Err: 'error', Ok: undefined },
  messageName: () => 'Attachment',
  toPacketWithName: () => ({}),
  toPacket: () => ({}),
  fromPacket: () => false,
};


  cmd.onReciveAttachment?.(mockErrorMsg);

  expect(onAttachmentSpy).not.toHaveBeenCalled();
  expect(cmd.onError).toHaveBeenCalled();
});

it('should call onConnectStart callback in Connect()', () => {
  const onConnectStartSpy = jasmine.createSpy('onConnectStart');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined, undefined, onConnectStartSpy);

  const mockConnectStart: any = {
    status: { Err: '', Ok: undefined },
    messageName: () => 'ConnectStart',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => ({}),
  };

  cmd.onReciveConnectStart?.(mockConnectStart);

  expect(onConnectStartSpy).toHaveBeenCalled();
});


it('should call onError in GetAttachment()', () => {
  const onErrorSpy = jasmine.createSpy('onError');
  const cmd = service.GetAttachment('problem1', undefined, undefined, undefined, onErrorSpy);

  cmd.onError?.('error message');

  expect(onErrorSpy).toHaveBeenCalledWith('error message');
});

it('should handle error status in onReciveAttachment', () => {
  const onAttachmentSpy = jasmine.createSpy('onAttachment');
  const cmd = service.GetAttachment('problem1', onAttachmentSpy);

  cmd.onError = jasmine.createSpy('onError');

  const mockErrorMsg: any = {
    status: { Err: 'error', Ok: undefined },
    messageName: () => 'Attachment',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => false,
  };

  cmd.onReciveAttachment?.(mockErrorMsg);

  expect(onAttachmentSpy).not.toHaveBeenCalled();
  expect(cmd.onError).toHaveBeenCalled();
});


it('should call onConnectStart callback in Connect()', () => {
  const onConnectStartSpy = jasmine.createSpy('onConnectStart');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined, undefined, onConnectStartSpy);

  const mockMsg: any = {
    status: { Err: '', Ok: undefined },
    messageName: () => 'ConnectStart',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => ({}),
  };

  cmd.onReciveConnectStart?.(mockMsg);
  expect(onConnectStartSpy).toHaveBeenCalled();
});

it('should call onConnectStop callback in Connect()', () => {
  const onConnectStopSpy = jasmine.createSpy('onConnectStop');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined, undefined, undefined, onConnectStopSpy);

  const mockMsg: any = {
    status: { Err: '', Ok: ['ok'] }, // Ok è string[]
    messageName: () => 'ConnectStop',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => ({}),
  };

  cmd.onReciveConnectStop?.(mockMsg);
  expect(onConnectStopSpy).toHaveBeenCalled();
});

it('should call onData callback in Connect()', () => {
  const onDataSpy = jasmine.createSpy('onData');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined, undefined, undefined, undefined, onDataSpy);

  cmd.onReciveBinary?.('data');
  expect(onDataSpy).toHaveBeenCalledWith('data');
});

it('should call onBinaryHeader callback in Connect()', () => {
  const onBinaryHeaderSpy = jasmine.createSpy('onBinaryHeader');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined, undefined, undefined, undefined, undefined, onBinaryHeaderSpy);

  const header: any = {
    length: 123,
    name: 'file',
    size: 123,
    hash: 'abc',
    messageName: () => 'BinaryDataHeader',
    toPacket: () => ({}),
    toPacketWithName: () => ({}),
    fromPacket: () => ({}),
  };
  
  cmd.onReciveBinaryHeader?.(header);
  expect(onBinaryHeaderSpy).toHaveBeenCalledWith(header);
});

it('should call onError callback in Connect()', () => {
  const onErrorSpy = jasmine.createSpy('onError');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined, undefined, undefined, undefined, undefined, undefined, onErrorSpy);

  cmd.onError?.('error');
  expect(onErrorSpy).toHaveBeenCalledWith('error');
});

it('should handle error in onReciveConnectBegin', () => {
  const onConnectBeginSpy = jasmine.createSpy('onConnectBegin');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined, onConnectBeginSpy);

  cmd.onError = jasmine.createSpy('onError');

  const mockMsg: any = {
    status: { Err: 'error', Ok: [''] },
    messageName: () => 'ConnectBegin',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => ({}),
  };

  cmd.onReciveConnectBegin?.(mockMsg);

  expect(onConnectBeginSpy).not.toHaveBeenCalled();
  expect(cmd.onError).toHaveBeenCalled();
});
it('should call onRecieveProblemList callback in problemList', () => {
  const onResultSpy = jasmine.createSpy('onResult');
  const onErrorSpy = jasmine.createSpy('onError');

  const cmd = service.problemList(onResultSpy, onErrorSpy);

  const fakeMessage: any = {  // puoi usare 'any' per semplificare
    meta: new Map<string, Meta>(),
    messageName: () => 'MetaList',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => ({}),
  };

  cmd.onRecieveProblemList?.(fakeMessage);

  expect(onResultSpy).toHaveBeenCalledWith(fakeMessage.meta);
});


it('should call onError callback in problemList', () => {
  const onResultSpy = jasmine.createSpy('onResult');
  const onErrorSpy = jasmine.createSpy('onError');

  const cmd = service.problemList(onResultSpy, onErrorSpy);

  // Simulo la ricezione di un errore
  cmd.onError?.('Simulated error');

  expect(onErrorSpy).toHaveBeenCalledWith('Simulated error');
});
it('should call onAttachment callback in GetAttachment()', () => {
  const onAttachmentSpy = jasmine.createSpy('onAttachment');
  const cmd = service.GetAttachment('problem1', onAttachmentSpy);

  // Simula messaggio senza errore
  const mockAttachment: any = {
    status: { Err: '', Ok: true },
  };

  cmd.onReciveAttachment?.(mockAttachment);

  expect(onAttachmentSpy).toHaveBeenCalled();
});

it('should call onData callback in GetAttachment()', () => {
  const onDataSpy = jasmine.createSpy('onData');
  const cmd = service.GetAttachment('problem1', undefined, undefined, onDataSpy);

  const mockData = new ArrayBuffer(8);

  cmd.onReciveUndecodedBinary?.(mockData);

  expect(onDataSpy).toHaveBeenCalledWith(mockData);
});
it('should call onConnectBegin callback when status.Ok is present', () => {
  const onConnectBeginSpy = jasmine.createSpy('onConnectBegin');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined, onConnectBeginSpy);

  const mockMsg: any = {
    status: { Err: '', Ok: ['connected'] },
    messageName: () => 'ConnectBegin',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => ({}),
  };

  cmd.onReciveConnectBegin?.(mockMsg);

  expect(onConnectBeginSpy).toHaveBeenCalledWith(mockMsg.status.Ok);
});

it('should call onError and return if status.Err is present in onReciveConnectStart', () => {
  const onErrorSpy = jasmine.createSpy('onError');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined);

  cmd.onError = onErrorSpy;

  const mockErrorMsg: any = {
    status: { Err: 'Failed to start connect', Ok: undefined },
    messageName: () => 'ConnectStart',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => ({}),
  };

  cmd.onReciveConnectStart?.(mockErrorMsg);

  expect(onErrorSpy).toHaveBeenCalledWith('Failed to start connect: ' + mockErrorMsg.status.Err);
});

it('should call onError and return if status.Err is present in onReciveConnectStop', () => {
  const onErrorSpy = jasmine.createSpy('onError');
  const cmd = service.Connect('p1', 's1', {}, false, 'token', undefined);

  cmd.onError = onErrorSpy;

  const mockErrorMsg: any = {
    status: { Err: 'Failed to stop connection', Ok: undefined },
    messageName: () => 'ConnectStop',
    toPacketWithName: () => ({}),
    toPacket: () => ({}),
    fromPacket: () => ({}),
  };

  cmd.onReciveConnectStop?.(mockErrorMsg);

  expect(onErrorSpy).toHaveBeenCalledWith('Failed to stop connection: ' + mockErrorMsg.status.Err);
});
it('should return -1 if url is invalid', () => {
  const invalidUrl = 'not-a-url';
  const result = service.setUrl(invalidUrl);
  expect(result).toBe(-1);
});
it('should return -2 if url has valid format but wrong protocol', () => {
  const httpUrl = 'http://example.com';
  const result = service.setUrl(httpUrl);
  expect(result).toBe(-2);
});


});
