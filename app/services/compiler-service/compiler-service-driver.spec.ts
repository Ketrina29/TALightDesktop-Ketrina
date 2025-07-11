import { FsNodeFolder } from '../fs-service/fs.service.types';
import { CompilerDriver } from './compiler-service-driver';
import { CompilerMessageType, CompilerRequest, CompilerResponse, PromiseResolver } from './compiler-service.types';
import { CompilerState } from './compiler-service.types';

describe('CompilerDriver public methods', () => {
  let driver: CompilerDriver;
  let mockWorker: any;

  beforeEach(() => {
    mockWorker = {
      postMessage: jasmine.createSpy('postMessage'),
      onmessage: null,
      addEventListener: jasmine.createSpy('addEventListener'),
    };
    driver = new CompilerDriver(mockWorker as Worker);

    // Spia sendMessage per restituire una Promise risolta con un valore
    spyOn(driver as any, 'sendMessage').and.callFake((message: any) => {
      // Restituisci un valore diverso a seconda del tipo di messaggio
      switch (message.type) {
        case CompilerMessageType.StopExecution: return Promise.resolve(true);
        case CompilerMessageType.SubscribeNotify: return Promise.resolve(true);
        case CompilerMessageType.SubscribeState: return Promise.resolve(true);
        case CompilerMessageType.SubscribeStdout: return Promise.resolve(true);
        case CompilerMessageType.SubscribeStderr: return Promise.resolve(true);
        case CompilerMessageType.SendStdin: return Promise.resolve(true);
        case CompilerMessageType.CreateDirectory: return Promise.resolve(true);
        case CompilerMessageType.ReadFile: return Promise.resolve('file content');
        case CompilerMessageType.WriteFile: return Promise.resolve(123);
        case CompilerMessageType.ReadDirectory: return Promise.resolve({ folders: [], files: [] });
        case CompilerMessageType.ScanDirectory: return Promise.resolve({ folders: [], files: [] });
        case CompilerMessageType.RenameItem: return Promise.resolve(true);
        case CompilerMessageType.Delete: return Promise.resolve(true);
        case CompilerMessageType.Exists: return Promise.resolve(true);
        default: return Promise.resolve(null);
      }
    });
  });

  it('stopExecution sends correct message and returns a promise', async () => {
    const result = await driver.stopExecution(5);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.StopExecution,
      args: ['5']
    }));
    expect(result).toBeTrue();
  });

  it('subscribeNotify sets callback and sends message', async () => {
    const callback = jasmine.createSpy('notifyCallback');
    const result = await driver.subscribeNotify(true, callback);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.SubscribeNotify,
      args: ['true']
    }));
    expect(driver.onNotify).toBeDefined();
    expect(result).toBeTrue();
  });

  it('subscribeState sets callback and sends message', async () => {
    const callback = jasmine.createSpy('stateCallback');
    const result = await driver.subscribeState(true, callback);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.SubscribeState,
      args: ['true']
    }));
    expect(driver.onState).toBeDefined();
    expect(result).toBeTrue();
  });

  it('subscribeStdout sets callback and sends message', async () => {
    const callback = jasmine.createSpy('stdoutCallback');
    const result = await driver.subscribeStdout(true, callback);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.SubscribeStdout,
      args: ['true']
    }));
    expect(driver.onStdout).toBeDefined();
    expect(result).toBeTrue();
  });

  it('subscribeStderr sets callback and sends message', async () => {
    const callback = jasmine.createSpy('stderrCallback');
    const result = await driver.subscribeStderr(true, callback);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.SubscribeStderr,
      args: ['true']
    }));
    expect(driver.onStderr).toBeDefined();
    expect(result).toBeTrue();
  });

  it('sendStdin sends message and returns promise', async () => {
    const result = await driver.sendStdin('test message');
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.SendStdin,
      contents: ['test message']
    }));
    expect(result).toBeTrue();
  });

  it('createDirectory sends message and returns promise', async () => {
    const path = '/some/path';
    const result = await driver.createDirectory(path);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.CreateDirectory,
      args: [path]
    }));
    expect(result).toBeTrue();
  });

  it('readFile sends message and returns promise', async () => {
    const path = '/file.txt';
    const result = await driver.readFile(path);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.ReadFile,
      args: [path, 'binary']
    }));
    expect(result).toBe('file content');
  });

  it('writeFile sends message and returns promise', async () => {
    const path = '/file.txt';
    const content = 'Hello world';
    const result = await driver.writeFile(path, content);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.WriteFile,
      args: [path],
      contents: [content]
    }));
    expect(result).toBe(123);
  });

 it('readDirectory sends message and returns promise', async () => {
  const path = '/dir';
  const mockFolder: FsNodeFolder = {
    name: 'root',
    path: '/root',
    folders: [],
    files: []
  };

  (driver as any).sendMessage.and.returnValue(Promise.resolve(mockFolder));

  const result = await driver.readDirectory(path);
  expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
    type: CompilerMessageType.ReadDirectory,
    args: [path]
  }));
  expect(result).toEqual(mockFolder);
});


  it('renameItem sends message and returns promise', async () => {
    const oldPath = '/old';
    const newPath = '/new';
    const result = await driver.renameItem(oldPath, newPath);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.RenameItem,
      args: [oldPath, newPath]
    }));
    expect(result).toBeTrue();
  });

  it('delete sends message and returns promise', async () => {
    const path = '/delete/path';
    const result = await driver.delete(path);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.Delete,
      args: [path]
    }));
    expect(result).toBeTrue();
  });

  it('exists sends message and returns promise', async () => {
    const path = '/exists/path';
    const result = await driver.exists(path);
    expect((driver as any).sendMessage).toHaveBeenCalledWith(jasmine.objectContaining({
      type: CompilerMessageType.Exists,
      args: [path]
    }));
    expect(result).toBeTrue();
  });
});
describe('CompilerDriver didRecieve method coverage', () => {
  let driver: CompilerDriver;
  let mockWorker: any;

  beforeEach(() => {
    mockWorker = {
      postMessage: jasmine.createSpy('postMessage'),
      onmessage: null,
      addEventListener: jasmine.createSpy('addEventListener'),
    };
    driver = new CompilerDriver(mockWorker as Worker);
    spyOn(driver as any, 'dataToString').and.callFake((data: Uint8Array | string) => {
      if (typeof data === 'string') return data;
      if (data instanceof Uint8Array) return new TextDecoder().decode(data);
      return String(data);
    });
  });

  const createRequestHandler = (uid: string, type: CompilerMessageType) => {
    const request: CompilerRequest = {
      uid,
      timestamp: Date.now(),
      message: {
        uid,
        type,
        args: ['testArg'],
        contents: ['testContent'],
      }
    };

    const resolvePromise = jasmine.createSpy('resolvePromise');

    driver['requestIndex'].set(uid, {
      uid,
      request,
      resolvePromise,
    });

    return { uid, resolvePromise };
  };

  const createResponse = (uid: string, type: CompilerMessageType, args = ['testArg'], contents = ['testContent']): CompilerResponse => ({
    uid,
    timestamp: Date.now(),
    success: true,
    message: {
      uid,
      type,
      args,
      contents,
    },
    errors: []
  });

  it('should call didReceiveInstallPackages and resolve promise', () => {
    const { uid, resolvePromise } = createRequestHandler('uid-install', CompilerMessageType.InstallPackages);
    const response = createResponse(uid, CompilerMessageType.InstallPackages);
    (driver as any).didReceiveInstallPackages = jasmine.createSpy('didReceiveInstallPackages');
    
    driver['didRecieve'](response);
    expect((driver as any).didReceiveInstallPackages).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveExecuteCode and resolve promise', () => {
    const { uid } = createRequestHandler('uid-execCode', CompilerMessageType.ExecuteCode);
    const response = createResponse(uid, CompilerMessageType.ExecuteCode);
    spyOn(driver as any, 'didReceiveExecuteCode').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveExecuteCode']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveExecuteFile and resolve promise', () => {
    const { uid } = createRequestHandler('uid-execFile', CompilerMessageType.ExecuteFile);
    const response = createResponse(uid, CompilerMessageType.ExecuteFile);
    spyOn(driver as any, 'didReceiveExecuteFile').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveExecuteFile']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveStopExecution and resolve promise', () => {
    const { uid } = createRequestHandler('uid-stop', CompilerMessageType.StopExecution);
    const response = createResponse(uid, CompilerMessageType.StopExecution);
    spyOn(driver as any, 'didReceiveStopExecution').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveStopExecution']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveSubscribeNotify, not remove request', () => {
    const { uid } = createRequestHandler('uid-subNotify', CompilerMessageType.SubscribeNotify);
    const response = createResponse(uid, CompilerMessageType.SubscribeNotify);
    spyOn(driver as any, 'didReceiveSubscribeNotify').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveSubscribeNotify']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeTrue();  // not removed
  });

  it('should call didReceiveSubscribeState, not remove request', () => {
    const { uid } = createRequestHandler('uid-subState', CompilerMessageType.SubscribeState);
    const response = createResponse(uid, CompilerMessageType.SubscribeState);
    spyOn(driver as any, 'didReceiveSubscribeState').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveSubscribeState']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeTrue();
  });

  it('should call didReceiveSubscribeStdout, not remove request', () => {
    const { uid } = createRequestHandler('uid-subStdout', CompilerMessageType.SubscribeStdout);
    const response = createResponse(uid, CompilerMessageType.SubscribeStdout);
    spyOn(driver as any, 'didReceiveSubscribeStdout').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveSubscribeStdout']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeTrue();
  });

  it('should call didReceiveSubscribeStderr, not remove request', () => {
    const { uid } = createRequestHandler('uid-subStderr', CompilerMessageType.SubscribeStderr);
    const response = createResponse(uid, CompilerMessageType.SubscribeStderr);
    spyOn(driver as any, 'didReceiveSubscribeStderr').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveSubscribeStderr']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeTrue();
  });

  it('should call didReceiveSendStdin and remove request', () => {
    const { uid } = createRequestHandler('uid-sendStdin', CompilerMessageType.SendStdin);
    const response = createResponse(uid, CompilerMessageType.SendStdin);
    spyOn(driver as any, 'didReceiveSendStdin').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveSendStdin']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveMount and remove request', () => {
    const { uid } = createRequestHandler('uid-mount', CompilerMessageType.Mount);
    const response = createResponse(uid, CompilerMessageType.Mount);
    spyOn(driver as any, 'didReceiveMount').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveMount']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveUnmount and remove request', () => {
    const { uid } = createRequestHandler('uid-unmount', CompilerMessageType.Unmount);
    const response = createResponse(uid, CompilerMessageType.Unmount);
    spyOn(driver as any, 'didReceiveUnmount').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveUnmount']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveCreateDirectory and remove request', () => {
    const { uid } = createRequestHandler('uid-createDir', CompilerMessageType.CreateDirectory);
    const response = createResponse(uid, CompilerMessageType.CreateDirectory);
    spyOn(driver as any, 'didReceiveCreateDirectory').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveCreateDirectory']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });



  it('should call didReceiveWriteFile and remove request', () => {
    const { uid } = createRequestHandler('uid-writeFile', CompilerMessageType.WriteFile);
    const response = createResponse(uid, CompilerMessageType.WriteFile);
    spyOn(driver as any, 'didReceiveWriteFile').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveWriteFile']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveReadFile and remove request', () => {
    const { uid } = createRequestHandler('uid-readFile', CompilerMessageType.ReadFile);
    const response = createResponse(uid, CompilerMessageType.ReadFile);
    spyOn(driver as any, 'didReceiveReadFile').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveReadFile']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveRenameItem and remove request', () => {
    const { uid } = createRequestHandler('uid-rename', CompilerMessageType.RenameItem);
    const response = createResponse(uid, CompilerMessageType.RenameItem);
    spyOn(driver as any, 'didReceiveRenameItem').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveRenameItem']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveDelete and remove request', () => {
    const { uid } = createRequestHandler('uid-delete', CompilerMessageType.Delete);
    const response = createResponse(uid, CompilerMessageType.Delete);
    spyOn(driver as any, 'didReceiveDelete').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveDelete']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });

  it('should call didReceiveExists and remove request', () => {
    const { uid } = createRequestHandler('uid-exists', CompilerMessageType.Exists);
    const response = createResponse(uid, CompilerMessageType.Exists);
    spyOn(driver as any, 'didReceiveExists').and.callThrough();

    driver['didRecieve'](response);
    expect(driver['didReceiveExists']).toHaveBeenCalled();
    expect(driver['requestIndex'].has(uid)).toBeFalse();
  });
it('should call mount with correct path in mountByProjectId', async () => {
  const mockWorker = {
    postMessage: jasmine.createSpy('postMessage'),
    onmessage: null,
    addEventListener: jasmine.createSpy('addEventListener'),
  };

  const driver = new CompilerDriver(mockWorker as unknown as Worker);
  spyOn(driver, 'mount').and.returnValue(Promise.resolve(true));

  const result = await driver.mountByProjectId(5);
  expect(driver.mount).toHaveBeenCalledWith(`${driver.mountPoint}5`);
  expect(result).toBeTrue();
});

it('should handle didReceiveUnmount and emit onUnmountChanged', () => {
const worker = {
  postMessage: jasmine.createSpy('postMessage'),
  addEventListener: jasmine.createSpy('addEventListener'),
  removeEventListener: jasmine.createSpy('removeEventListener')
} as any as Worker;

  const driver = new CompilerDriver(worker);
  const spyEmit = spyOn(driver.onUnmountChanged, 'emit');

  const msgSent = { args: ['/path'], contents: [] } as Partial<CompilerRequest['message']>;
const msgRecived = { args: ['/path'], contents: [] } as Partial<CompilerRequest['message']>;


  const resolvePromise = jasmine.createSpy();
  (driver as any).didReceiveUnmount(msgSent, msgRecived, resolvePromise);

  expect(resolvePromise).toHaveBeenCalledWith(true);
  expect(spyEmit).toHaveBeenCalled();
});
it('should handle didReceiveMount and emit onMountChanged', () => {
const worker = {
  postMessage: jasmine.createSpy('postMessage'),
  addEventListener: jasmine.createSpy('addEventListener'),
  removeEventListener: jasmine.createSpy('removeEventListener')
} as any as Worker;
  const driver = new CompilerDriver(worker);
  const spyEmit = spyOn(driver.onMountChanged, 'emit');

 const msgSent = { args: ['/path'], contents: [] } as Partial<CompilerRequest['message']>;
const msgRecived = { args: ['/path'], contents: [] } as Partial<CompilerRequest['message']>;

  const resolvePromise = jasmine.createSpy();
  (driver as any).didReceiveMount(msgSent, msgRecived, resolvePromise);

  expect(resolvePromise).toHaveBeenCalledWith(true);
  expect(spyEmit).toHaveBeenCalled();
});
it('should resolve with contents length in didReceiveWriteFile', () => {
 const worker = {
  postMessage: jasmine.createSpy('postMessage'),
  addEventListener: jasmine.createSpy('addEventListener'),
  removeEventListener: jasmine.createSpy('removeEventListener')
} as any as Worker;

  const msgSent = { args: ['file.txt'], contents: ['data'] } as Partial<CompilerRequest['message']>;
  const msgRecived = { args: [], contents: ['data'] } as Partial<CompilerRequest['message']>;

  const resolvePromise = jasmine.createSpy();
  (driver as any).didReceiveWriteFile(msgSent, msgRecived, resolvePromise);

  expect(resolvePromise).toHaveBeenCalledWith(1);
});
it('should resolve true if exists response is "true"', () => {
  const worker = {
  postMessage: jasmine.createSpy('postMessage'),
  addEventListener: jasmine.createSpy('addEventListener'),
  removeEventListener: jasmine.createSpy('removeEventListener')
} as any as Worker;

  const msgSent = {} as Partial<CompilerRequest['message']>;
  const msgRecived = { args: ['true'] } as Partial<CompilerRequest['message']>;

  const resolvePromise = jasmine.createSpy();
  (driver as any).didReceiveExists(msgSent, msgRecived, resolvePromise);

  expect(resolvePromise).toHaveBeenCalledWith(true);
});


it('should generate unique request UID', () => {
  const worker = {
  postMessage: jasmine.createSpy('postMessage'),
  addEventListener: jasmine.createSpy('addEventListener'),
  removeEventListener: jasmine.createSpy('removeEventListener')
} as any as Worker;
  const uid1 = (driver as any).requestUID();
  const uid2 = (driver as any).requestUID();

  expect(uid1).toContain('uid-');
  expect(uid1).not.toBe(uid2); 
});
it('should convert Uint8Array to string in dataToString', () => {
  const worker = {
    postMessage: jasmine.createSpy('postMessage'),
    addEventListener: jasmine.createSpy('addEventListener'),
    removeEventListener: jasmine.createSpy('removeEventListener')
  } as any as Worker;

  const driver = new CompilerDriver(worker);

  const encoder = new TextEncoder();
  const uint8 = encoder.encode('hello'); // kjo është ajo që pret realisht dataToString

  const result = (driver as any).dataToString(uint8);
  expect(result).toBe('hello');
});

it('should ignore unknown message type in didRecieve()', () => {
  const worker = {
    postMessage: jasmine.createSpy('postMessage'),
    addEventListener: jasmine.createSpy('addEventListener'),
    removeEventListener: jasmine.createSpy('removeEventListener')
  } as any as Worker;

  const driver = new CompilerDriver(worker);

  const uid = 'uid-unknown';
  const response = {
    uid,
    timestamp: Date.now(),
    success: true,
    message: {
      uid,
      type: 'UnknownType', 
      args: [],
      contents: [],
    },
    errors: []
  };

  expect(() => (driver as any).didRecieve(response)).not.toThrow();
  // s'ka nevojë për më shumë: thjesht sigurohemi që nuk rrëzohet (crash)
});

it('should resolve to null for unknown message type in sendMessage()', async () => {
  const driver = new CompilerDriver(mockWorker as Worker);

  // Thirrje që niset e pret një përgjigje (por ne e japim vetë atë përgjigje)
  const promise = (driver as any).sendMessage({
    type: 'UnknownType',
    args: [],
    contents: []
  });

  const uid = Array.from((driver as any).requestIndex.keys())[0];

  const fakeResponse = {
    uid,
    timestamp: Date.now(),
    success: true,
    message: {
      uid,
      type: 'UnknownType',
      args: [],
      contents: []
    },
    errors: []
  };

  // Simulo përgjigjen që do vinte nga WebWorker
  (driver as any).didRecieve(fakeResponse);

  const result = await promise;
  expect(result).toBeNull();
});
it('should handle CompilerState message in handleWorkerMessage()', () => {
  const driver = new CompilerDriver(mockWorker as Worker);
  const cb = jasmine.createSpy('stateCb');
  driver.onState = cb;

  const message = {
    data: {
      type: 'CompilerState',
      state: 'Ready'
    }
  };

  (driver as any)['handleWorkerMessage'](message);
  expect(cb).toHaveBeenCalledWith('Ready');
});



});