import { TestBed } from '@angular/core/testing';
import { ApiService, ApiState } from './api.service';
import { ProjectManagerService } from '../project-manager-service/project-manager.service';
import { Commands } from './api.commands';
import { EventEmitter } from '@angular/core';

describe('ApiService', () => {
  let service: ApiService;
  let projectManagerServiceMock: any;

  beforeEach(() => {
    // Creazione del mock per ProjectManagerService
    projectManagerServiceMock = {
      // Initially, the global project might have a default TAL_SERVER,
      // but the setUrl tests will override this behavior with their own mockProject.
      getCurrentProject: jasmine.createSpy('getCurrentProject').and.returnValue({
        config: { TAL_SERVER: 'wss://mock.server.com' } // Default for tests outside setUrl
      })
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectManagerService, useValue: projectManagerServiceMock }
      ]
    });

    service = TestBed.inject(ApiService);
  });

  describe('ApiService - setUrl', () => {
    let mockProject: any;

    beforeEach(() => {
      mockProject = {
        config: { TAL_SERVER: '' }, // This will be updated by setUrl
        language: 'en',
        onLoaded: new EventEmitter<void>(),
        isLoaded: true,
        files: new Map(),
        meta: {},
        projectId: 'mockProject',
        uid: 'uid-mock'
      };
      // Spy on getCurrentProject once for ALL tests within this 'setUrl' describe block
      // This redefines the behavior of getCurrentProject for these specific tests.
      projectManagerServiceMock.getCurrentProject.and.returnValue(mockProject);
    });

    it('should accept valid ws URL and update config', () => {
      // NO spyOn here, it's already done in beforeEach of this describe block
      const result = service.setUrl('ws://myserver.local:8080/');
      expect(result).toBeTrue();
      expect(mockProject.config.TAL_SERVER).toBe('ws://myserver.local:8080/');
    });

    it('should accept valid wss URL and update config', () => {
      // NO spyOn here
      const result = service.setUrl('wss://example.com/socket');
      expect(result).toBeTrue();
      expect(mockProject.config.TAL_SERVER).toBe('wss://example.com/socket');
    });

    it('should accept URL with trailing slash', () => {
      // NO spyOn here
      const result = service.setUrl('ws://localhost:3000/');
      expect(result).toBeTrue();
      expect(mockProject.config.TAL_SERVER).toBe('ws://localhost:3000/');
    });
  });


  it('should be created correctly', () => {
    expect(service).toBeTruthy();
  });

it('should return empty string if getCurrentProject does not return config', () => {
    
    projectManagerServiceMock.getCurrentProject.and.returnValue({}); // Override for this specific test
    const url = service.getCurrentServerUrl();
    expect(url).toBe('');
  });

  it('should return the current server URL', () => {
    const url = service.getCurrentServerUrl();
    expect(url).toBe('wss://mock.server.com');
  });

  it('should call onResult when problemList succeeds', () => {
    const mockMetaMap = new Map<string, any>([['problema1', {}]]);
    let mockCmd: any = {
      onRecieveProblemList: undefined,
      onError: undefined,
      run: () => {
        if (typeof mockCmd.onRecieveProblemList === 'function') {
          mockCmd.onRecieveProblemList({ meta: mockMetaMap });
        }
      }
    };

    spyOn(Commands, 'ProblemList').and.returnValue(mockCmd);
    const onResultSpy = jasmine.createSpy('onResult');
    service.problemList(onResultSpy);
    expect(onResultSpy).toHaveBeenCalledWith(mockMetaMap);
  });

it('should send message if ws is open', () => {
  const mockSocket = {
    readyState: 1, // OPEN
    send: jasmine.createSpy('send')
  };
  (service as any).ws = mockSocket;

  const msg = { type: 'TEST', data: 'hello' };
  service.sendMessage(msg);

  expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(msg));
});

it('should return empty string if getCurrentProject is undefined', () => {
  projectManagerServiceMock.getCurrentProject.and.returnValue(undefined);
  const url = service.getCurrentServerUrl();
  expect(url).toBe('');
});

  it('should call onError when problemList fails', () => {
    let mockCmd: any = {
      onRecieveProblemList: undefined,
      onError: undefined,
      run: () => {
        if (typeof mockCmd.onError === 'function') {
          mockCmd.onError("errore di connessione");
        }
      }
    };

    spyOn(Commands, 'ProblemList').and.returnValue(mockCmd);
    const onErrorSpy = jasmine.createSpy('onError');
    service.problemList(() => {}, onErrorSpy);
    expect(onErrorSpy).toHaveBeenCalledWith("errore di connessione");
  });


  it('should handle GetAttachment successfully', () => {
    const mockBinaryHeader = { name: "file.txt", size: "1024", hash: "1234" };
    const mockData = new ArrayBuffer(10);

    let mockCmd: any = {
      onReciveAttachment: undefined,
      onReciveAttachmentInfo: undefined,
      onReciveUndecodedBinary: undefined,
      onError: undefined,
      run: () => {
        if (typeof mockCmd.onReciveAttachment === 'function') {
          mockCmd.onReciveAttachment({ status: { Err: "", Ok: "✓" } });
        }
        if (typeof mockCmd.onReciveAttachmentInfo === 'function') {
          mockCmd.onReciveAttachmentInfo(mockBinaryHeader);
        }
        if (typeof mockCmd.onReciveUndecodedBinary === 'function') {
          mockCmd.onReciveUndecodedBinary(mockData);
        }
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    const onAttachment = jasmine.createSpy('onAttachment');
    const onInfo = jasmine.createSpy('onInfo');
    const onData = jasmine.createSpy('onData');

    service.GetAttachment("problema1", onAttachment, onInfo, onData);

    expect(onAttachment).toHaveBeenCalled();
    expect(onInfo).toHaveBeenCalledWith(mockBinaryHeader);
    expect(onData).toHaveBeenCalledWith(mockData);
  });

  it('should handle GetAttachment with error', () => {
    let mockCmd: any = {
      onReciveAttachment: undefined,
      onReciveAttachmentInfo: undefined,
      onReciveUndecodedBinary: undefined,
      onError: undefined,
      run: () => {
        if (typeof mockCmd.onReciveAttachment === 'function') {
          mockCmd.onReciveAttachment({ status: { Err: "errore", Ok: "" } });
        }
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    const onError = jasmine.createSpy('onError');
    service.GetAttachment("problema1", undefined, undefined, undefined, onError);

    expect(onError).toHaveBeenCalledWith("Failed to receive attachment: ");
  });

  it('should not throw error if onError is missing but message is erroneous', () => {
    let mockCmd: any = {
      onReciveAttachment: undefined,
      onReciveAttachmentInfo: undefined,
      onReciveUndecodedBinary: undefined,
      onError: undefined,
      run: () => {
        if (typeof mockCmd.onReciveAttachment === 'function') {
          mockCmd.onReciveAttachment({ status: { Err: "errore", Ok: "" } });
        }
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);
    service.GetAttachment("problema1"); // senza onError

    expect(true).toBeTrue(); // test superato se non ci sono eccezioni
  });

  it('should handle Connect successfully', () => {
    const mockHeader = { name: "data.txt", size: "2048", hash: "abcd" };
    const mockMessageData = "risposta dal server";
    const mockOkList = ["avvio completato"];

    let mockCmd: any = {
      onReciveConnectBegin: () => {},
      onReciveConnectStart: () => {},
      onReciveConnectStop: () => {},
      onReciveBinary: () => {},
      onReciveBinaryHeader: () => {},
      onError: () => {},
      run: () => {
        mockCmd.onReciveConnectBegin({ status: { Err: "", Ok: mockOkList } });
        mockCmd.onReciveConnectStart({ status: { Err: "", Ok: "" } });
        mockCmd.onReciveConnectStop({ status: { Err: "", Ok: mockOkList } });
        mockCmd.onReciveBinary(mockMessageData);
        mockCmd.onReciveBinaryHeader(mockHeader);
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    const onConnectBegin = jasmine.createSpy('onConnectBegin');
    const onConnectStart = jasmine.createSpy('onConnectStart');
    const onConnectStop = jasmine.createSpy('onConnectStop');
    const onData = jasmine.createSpy('onData');
    const onBinaryHeader = jasmine.createSpy('onBinaryHeader');

    service.Connect(
      "problema1",
      "servizio1",
      {},
      false,
      "token-test",
      new Map<string, string>(),
      onConnectBegin,
      onConnectStart,
      onConnectStop,
      onData,
      onBinaryHeader
    );

    expect(onConnectBegin).toHaveBeenCalledWith(mockOkList);
    expect(onConnectStart).toHaveBeenCalled();
    expect(onConnectStop).toHaveBeenCalledWith(mockOkList);
    expect(onData).toHaveBeenCalledWith(mockMessageData);
    expect(onBinaryHeader).toHaveBeenCalledWith(mockHeader);
  });

  it('should handle Connect with error', () => {
    // Mock del comando Connect.
    // We define properties that ApiService will assign *to*, and a 'run' method
    // that simulates the backend sending error messages.
    let mockCmd: any = {
      // These properties should be `undefined` initially. 
      onReciveConnectBegin: undefined,
      onReciveConnectStart: undefined,
      onReciveConnectStop: undefined,
      onReciveBinary: undefined,
      onReciveBinaryHeader: undefined,
      onError: undefined, // <--- THIS MUST BE `undefined` (or omitted). ApiService will assign the test's `onError` spy here.

      run: function() {
        // Simulate the backend sending messages with an 'Err' status.
        // ApiService's handlers (which are assigned to `this.onReciveConnectX` properties)
        // will then detect the error and correctly call `this.onError` (which is our spy).
        if (typeof this.onReciveConnectBegin === 'function') {
          this.onReciveConnectBegin({ status: { Err: "errore", Ok: null } });
        }
        if (typeof this.onReciveConnectStart === 'function') {
          this.onReciveConnectStart({ status: { Err: "errore", Ok: null } });
        }
        if (typeof this.onReciveConnectStop === 'function') {
          this.onReciveConnectStop({ status: { Err: "errore", Ok: null } });
        }
        // IMPORTANT: The mock's run method should *NOT* directly call 'onError'.
        // That's ApiService's responsibility, triggered by the error status in onReciveConnectX.
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    const onError = jasmine.createSpy('onError'); // This is the spy we expect to be called

    service.Connect(
      "problema1",
      "servizio1",
      {},
      false,
      "token-test",
      undefined, // files
      undefined, // onConnectBegin
      undefined, // onConnectStart
      undefined, // onConnectStop
      undefined, // onData
      undefined, // onBinaryHeader
      onError    // The onError spy from *this* test will be passed to ApiService
                 // and ApiService will assign it to mockCmd.onError
    );

    // Force the run() method on our mockCmd to trigger the simulated backend responses.
    mockCmd.run();

    // will detect the error status and correctly call the 'onError' spy.
    expect(onError).toHaveBeenCalledWith("Failed to begin connection: errore");
    expect(onError).toHaveBeenCalledWith("Failed to start connect: errore");
    expect(onError).toHaveBeenCalledWith("Failed to stop connection: errore");
  });




  it('should update state only if it changes', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    // Stato iniziale è Idle, lo chiamiamo di nuovo -> non deve emettere
    service.updateState(ApiState.Idle);
    expect(spy).not.toHaveBeenCalled();

    // Cambiamo stato -> deve emettere
    service.updateState(ApiState.Good);
    expect(spy).toHaveBeenCalledWith(ApiState.Good);
  });

  it('should transition to Maybe state', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);
    service.stateMaybe();
    expect(spy).toHaveBeenCalledWith(ApiState.Maybe);
  });

  it('should transition to Good state', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);
    service.stateGood();
    expect(spy).toHaveBeenCalledWith(ApiState.Good);
  });

  it('should transition to Bad state', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);
    service.stateBad();
    expect(spy).toHaveBeenCalledWith(ApiState.Bad);
  });

  it('should transition to Idle state', () => {
    // Prima cambia stato per poi tornare a Idle
    service.updateState(ApiState.Bad);

    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);
    service.stateIdle();
    expect(spy).toHaveBeenCalledWith(ApiState.Idle);
  });

  it('should reject an invalid URL', () => {
    const result = service.setUrl("questa-non-è-url");
    expect(result).toBeFalse();
  });

  it('should reject URL with non-ws/wss protocol', () => {
    const result = service.setUrl("http://esempio.com");
    expect(result).toBeFalse();
  });

  it('should cover all setUrl branches', () => {
    expect(service.setUrl("non-url")).toBeFalse();                         // catch block
    expect(service.setUrl("http://esempio.com")).toBeFalse();             // invalid protocol
    expect(service.setUrl("ws://valido.com")).toBeTrue();                 // valid ws
    expect(service.setUrl("wss://valido.com")).toBeTrue();                // valid wss
  });

  it('should not emit if state does not change', () => {
    service.updateState(ApiState.Maybe); // cambio in the start
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.updateState(ApiState.Maybe); // call the same again

    expect(spy).not.toHaveBeenCalled(); // not emit second time
  });

    it('should handle error when new URL fails in setUrl', () => {
    const originalURL = window.URL;
    spyOn(window as any, 'URL').and.callFake(() => { throw new Error('Invalid URL'); });
    const result = service.setUrl("%%%");
    expect(result).toBeFalse();
    window.URL = originalURL;
  });

  it('should return empty string if getCurrentProject does not return config', () => {
    projectManagerServiceMock.getCurrentProject.and.returnValue({});
    const url = service.getCurrentServerUrl();
    expect(url).toBe('');
  });

  it('should emit events for every valid state change', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.updateState(ApiState.Good);
    service.updateState(ApiState.Maybe);
    service.updateState(ApiState.Bad);

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith(ApiState.Good);
    expect(spy).toHaveBeenCalledWith(ApiState.Maybe);
    expect(spy).toHaveBeenCalledWith(ApiState.Bad);
  });

  it('should handle Connect error without onError defined', () => {
    let mockCmd: any = {
      onReciveConnectBegin: undefined,
      onReciveConnectStart: undefined,
      onReciveConnectStop: undefined,
      run: function () {
        if (typeof this.onReciveConnectBegin === 'function') {
          this.onReciveConnectBegin({ status: { Err: "errore", Ok: null } });
        }
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    service.Connect("p1", "s1", {}, false, "tok");

    expect(true).toBeTrue(); // passa se nessuna eccezione
  });

  it('should run GetAttachment without defined callbacks', () => {
    let mockCmd: any = {
      onReciveAttachment: undefined,
      onReciveAttachmentInfo: undefined,
      onReciveUndecodedBinary: undefined,
      run: function () {
        this.onReciveAttachment?.({ status: { Err: "", Ok: "✓" } });
        this.onReciveAttachmentInfo?.({ name: "file.txt" });
        this.onReciveUndecodedBinary?.(new ArrayBuffer(8));
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    service.GetAttachment("problema1");

    expect(true).toBeTrue(); // passa se non fallisce
  });

  it('should call only provided callbacks during Connect', () => {
    let mockCmd: any = {
      onReciveConnectBegin: undefined,
      run: function () {
        this.onReciveConnectBegin?.({ status: { Err: "", Ok: ["ok"] } });
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    const onConnectBegin = jasmine.createSpy('onConnectBegin');

    service.Connect("p1", "s1", {}, false, "tok", undefined, onConnectBegin);

    expect(onConnectBegin).toHaveBeenCalledWith(["ok"]);
  });


    it('should not send messages if ws is undefined', () => {
    (service as any).ws = undefined;

    expect(() => {
      service.sendMessage({ type: 'TEST' });
    }).not.toThrow();
  });

  it('should not send messages if ws is not in OPEN state', () => {
    const mockSocket = {
      readyState: 0, // CONNECTING
      send: jasmine.createSpy('send')
    };

    (service as any).ws = mockSocket;

    service.sendMessage({ type: 'TEST' });

    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it('should not throw error if ws is undefined during disconnect', () => {
    (service as any).ws = undefined;

    expect(() => {
      service.disconnect();
    }).not.toThrow();
  });

  it('should not close ws if not in OPEN state', () => {
    const mockSocket = {
      readyState: 3, // CLOSED
      close: jasmine.createSpy('close')
    };

    (service as any).ws = mockSocket;

    service.disconnect();

    expect(mockSocket.close).not.toHaveBeenCalled();
  });
  it('should handle problemList even without onResult', () => {
    let mockCmd: any = {
      onRecieveProblemList: undefined,
      onError: undefined,
      run: () => {
        if (typeof mockCmd.onRecieveProblemList === 'function') {
          mockCmd.onRecieveProblemList({ meta: new Map() });
        }
      }
    };

    spyOn(Commands, 'ProblemList').and.returnValue(mockCmd);

    expect(() => {
      service.problemList(undefined as any);
    }).not.toThrow();
  });

  it('should handle problemList error even without onError', () => {
    let mockCmd: any = {
      onRecieveProblemList: undefined,
      onError: undefined,
      run: () => {
        if (typeof mockCmd.onError === 'function') {
          mockCmd.onError("errore");
        }
      }
    };

    spyOn(Commands, 'ProblemList').and.returnValue(mockCmd);

    expect(() => {
      service.problemList(() => {});
    }).not.toThrow();
  });

  it('should ignore attachment message without valid status', () => {
    let mockCmd: any = {
      onReciveAttachment: undefined,
      run: function () {
        this.onReciveAttachment?.({ status: {} });
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    expect(() => {
      service.GetAttachment("problema1");
    }).not.toThrow();
  });

  it('should not call onConnectStop if status.Ok is undefined', () => {
    let mockCmd: any = {
      onReciveConnectStop: undefined,
      run: function () {
        this.onReciveConnectStop?.({ status: { Err: "", Ok: undefined } });
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    const onConnectStop = jasmine.createSpy('onConnectStop');

    service.Connect("p", "s", {}, false, "tok", undefined, undefined, undefined, onConnectStop);

    expect(onConnectStop).not.toHaveBeenCalled();
  });

  it('should ignore binary data if onData is undefined', () => {
    let mockCmd: any = {
      onReciveBinary: undefined,
      run: function () {
        this.onReciveBinary?.("dati di test");
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    expect(() => {
      service.Connect("p", "s", {}, false, "tok");
    }).not.toThrow();
  });
  it('should not call onConnectStart if not defined', () => {
    let mockCmd: any = {
      onReciveConnectStart: undefined,
      run: function () {
        this.onReciveConnectStart?.({ status: { Err: "", Ok: null } });
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    expect(() => {
      service.Connect("p", "s", {}, false, "tok");
    }).not.toThrow();
  });

  it('should not call onBinaryHeader if not defined', () => {
    let mockCmd: any = {
      onReciveBinaryHeader: undefined,
      run: function () {
        this.onReciveBinaryHeader?.({ name: "data.txt", size: "123", hash: "x" });
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    expect(() => {
      service.Connect("p", "s", {}, false, "tok");
    }).not.toThrow();
  });

  it('should not crash if Connect fails and onError is undefined', () => {
    let mockCmd: any = {
      onReciveConnectBegin: undefined,
      run: function () {
        this.onReciveConnectBegin?.({ status: { Err: "errore", Ok: null } });
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    expect(() => {
      service.Connect("p", "s", {}, false, "tok");
    }).not.toThrow();
  });

   it('should call only onConnectBegin if it is the only callback provided', () => {
    const mockOkList = ["tutto ok"];

    let mockCmd: any = {
      onReciveConnectBegin: undefined,
      run: function () {
        this.onReciveConnectBegin?.({ status: { Err: "", Ok: mockOkList } });
      }
    };

    spyOn(Commands, 'Connect').and.returnValue(mockCmd);

    const onConnectBegin = jasmine.createSpy('onConnectBegin');

    service.Connect("p", "s", {}, false, "tok", undefined, onConnectBegin);

    expect(onConnectBegin).toHaveBeenCalledWith(mockOkList);
  });

  it('should not crash if attachment fails and onError is missing', () => {
    let mockCmd: any = {
      onReciveAttachment: undefined,
      run: function () {
        this.onReciveAttachment?.({ status: { Err: "problema", Ok: "" } });
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    expect(() => {
      service.GetAttachment("problema1");
    }).not.toThrow();
  });

  it('should not call onAttachmentInfo if not provided', () => {
    let mockCmd: any = {
      onReciveAttachmentInfo: undefined,
      run: function () {
        this.onReciveAttachmentInfo?.({ name: "img.png", size: "10", hash: "123" });
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    expect(() => {
      service.GetAttachment("problema1");
    }).not.toThrow();
  });

  it('should not call onData if not provided', () => {
    let mockCmd: any = {
      onReciveUndecodedBinary: undefined,
      run: function () {
        this.onReciveUndecodedBinary?.(new ArrayBuffer(5));
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    expect(() => {
      service.GetAttachment("problema1");
    }).not.toThrow();
  });

  it('should call onAttachment even if Ok is an empty string', () => {
    const onAttachment = jasmine.createSpy('onAttachment');

    let mockCmd: any = {
      onReciveAttachment: undefined,
      run: function () {
        this.onReciveAttachment?.({ status: { Err: "", Ok: "" } });
      }
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    service.GetAttachment("problema1", onAttachment);

    expect(onAttachment).toHaveBeenCalled();
  });

  it('should handle empty run in GetAttachment without errors', () => {
    let mockCmd: any = {
      run: () => {}
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    expect(() => {
      service.GetAttachment("problema1");
    }).not.toThrow();
  });

  it('should not emit event if state is already set', () => {
    service.updateState(ApiState.Idle);

    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.updateState(ApiState.Idle);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit event if state changes', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.updateState(ApiState.Good);

    expect(spy).toHaveBeenCalledWith(ApiState.Good);
  });

  it('should emit only if stateIdle changes the state', () => {
    service.updateState(ApiState.Bad);

    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.stateIdle();

    expect(spy).toHaveBeenCalledWith(ApiState.Idle);
  });

  it('should not emit same state twice', () => {
    service.stateBad();

    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.stateBad();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit event for every state change via stateX()', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.stateGood();
    service.stateMaybe();
    service.stateBad();

    expect(spy).toHaveBeenCalledWith(ApiState.Good);
    expect(spy).toHaveBeenCalledWith(ApiState.Maybe);
    expect(spy).toHaveBeenCalledWith(ApiState.Bad);
    expect(spy.calls.count()).toBe(3);
  });
  it('should reject invalid URL (throws in try block)', () => {
    const result = service.setUrl("ht!tp://@@");
    expect(result).toBeFalse();
  });

  it('should reject non-ws/wss protocol', () => {
    const result = service.setUrl("http://localhost:8080");
    expect(result).toBeFalse();
  });




});
