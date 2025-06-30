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

    it('dovrebbe accettare URL ws valido e aggiornare config', () => {
      // NO spyOn here, it's already done in beforeEach of this describe block
      const result = service.setUrl('ws://myserver.local:8080/');
      expect(result).toBeTrue();
      expect(mockProject.config.TAL_SERVER).toBe('ws://myserver.local:8080/');
    });

    it('dovrebbe accettare URL wss valido e aggiornare config', () => {
      // NO spyOn here
      const result = service.setUrl('wss://example.com/socket');
      expect(result).toBeTrue();
      expect(mockProject.config.TAL_SERVER).toBe('wss://example.com/socket');
    });

    it('dovrebbe accettare URL con slash finale', () => {
      // NO spyOn here
      const result = service.setUrl('ws://localhost:3000/');
      expect(result).toBeTrue();
      expect(mockProject.config.TAL_SERVER).toBe('ws://localhost:3000/');
    });
  });


  it('dovrebbe essere creato correttamente', () => {
    expect(service).toBeTruthy();
  });
it('dovrebbe restituire stringa vuota se getCurrentProject non restituisce config', () => {
    
    projectManagerServiceMock.getCurrentProject.and.returnValue({}); // Override for this specific test
    const url = service.getCurrentServerUrl();
    expect(url).toBe('');
  });
  it('dovrebbe restituire l\'URL corrente del server', () => {
    const url = service.getCurrentServerUrl();
    expect(url).toBe('wss://mock.server.com');
  });

  it('dovrebbe chiamare onResult quando problemList ha successo', () => {
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
it('dovrebbe inviare il messaggio se ws è aperto', () => {
  const mockSocket = {
    readyState: 1, // OPEN
    send: jasmine.createSpy('send')
  };
  (service as any).ws = mockSocket;

  const msg = { type: 'TEST', data: 'hello' };
  service.sendMessage(msg);

  expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify(msg));
});
it('dovrebbe restituire "" se getCurrentProject è undefined', () => {
  projectManagerServiceMock.getCurrentProject.and.returnValue(undefined);
  const url = service.getCurrentServerUrl();
  expect(url).toBe('');
});

  it('dovrebbe chiamare onError quando problemList fallisce', () => {
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

  it('dovrebbe gestire correttamente GetAttachment con successo', () => {
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

  it('dovrebbe gestire correttamente GetAttachment in caso di errore', () => {
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

  it('non dovrebbe lanciare errore se onError è assente ma il messaggio è errato', () => {
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

  it('dovrebbe gestire correttamente Connect con successo', () => {
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
// --- This is what the 'mockCmd' part should look like in api.service.spec.ts ---

// src/app/services/api-service/api.service.spec.ts

// ... (keep all the code *before* this test, including the 'dovrebbe gestire correttamente Connect con successo' test) ...

  it('dovrebbe gestire correttamente Connect in caso di errore', () => {
    // Mock del comando Connect.
    // We define properties that ApiService will assign *to*, and a 'run' method
    // that simulates the backend sending error messages.
    let mockCmd: any = {
      // These properties should be `undefined` initially. ApiService will assign
      // its own callback functions (which will then call the 'onError' spy from our test)
      // to these properties.
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

    // Now, these expectations should pass because ApiService's handlers for
    // onReciveConnectBegin, onReciveConnectStart, and onReciveConnectStop
    // will detect the error status and correctly call the 'onError' spy.
    expect(onError).toHaveBeenCalledWith("Failed to begin connection: errore");
    expect(onError).toHaveBeenCalledWith("Failed to start connect: errore");
    expect(onError).toHaveBeenCalledWith("Failed to stop connection: errore");
  });




  it('dovrebbe aggiornare lo stato solo se cambia', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    // Stato iniziale è Idle, lo chiamiamo di nuovo -> non deve emettere
    service.updateState(ApiState.Idle);
    expect(spy).not.toHaveBeenCalled();

    // Cambiamo stato -> deve emettere
    service.updateState(ApiState.Good);
    expect(spy).toHaveBeenCalledWith(ApiState.Good);
  });

  it('dovrebbe passare a stato Maybe', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);
    service.stateMaybe();
    expect(spy).toHaveBeenCalledWith(ApiState.Maybe);
  });

  it('dovrebbe passare a stato Good', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);
    service.stateGood();
    expect(spy).toHaveBeenCalledWith(ApiState.Good);
  });

  it('dovrebbe passare a stato Bad', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);
    service.stateBad();
    expect(spy).toHaveBeenCalledWith(ApiState.Bad);
  });

  it('dovrebbe passare a stato Idle', () => {
    // Prima cambia stato per poi tornare a Idle
    service.updateState(ApiState.Bad);

    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);
    service.stateIdle();
    expect(spy).toHaveBeenCalledWith(ApiState.Idle);
  });

  it('dovrebbe rifiutare una URL non valida', () => {
    const result = service.setUrl("questa-non-è-url");
    expect(result).toBeFalse();
  });

  it('dovrebbe rifiutare URL con protocollo non ws/wss', () => {
    const result = service.setUrl("http://esempio.com");
    expect(result).toBeFalse();
  });

  it('copertura diretta per setUrl con tutti i rami', () => {
    expect(service.setUrl("non-url")).toBeFalse();                         // catch block
    expect(service.setUrl("http://esempio.com")).toBeFalse();             // invalid protocol
    expect(service.setUrl("ws://valido.com")).toBeTrue();                 // valid ws
    expect(service.setUrl("wss://valido.com")).toBeTrue();                // valid wss
  });

  it('non dovrebbe emettere se lo stato non cambia', () => {
    service.updateState(ApiState.Maybe); // ndryshojmë fillimisht
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.updateState(ApiState.Maybe); // thirrim të njëjtin prapë

    expect(spy).not.toHaveBeenCalled(); // nuk duhet të emetojë dy herë
  });

    it('dovrebbe gestire un errore quando new URL fallisce in setUrl', () => {
    const originalURL = window.URL;
    spyOn(window as any, 'URL').and.callFake(() => { throw new Error('Invalid URL'); });
    const result = service.setUrl("%%%");
    expect(result).toBeFalse();
    window.URL = originalURL;
  });

  it('dovrebbe restituire stringa vuota se getCurrentProject non restituisce config', () => {
    projectManagerServiceMock.getCurrentProject.and.returnValue({});
    const url = service.getCurrentServerUrl();
    expect(url).toBe('');
  });

  it('dovrebbe emettere eventi per ogni cambiamento di stato valido', () => {
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

  it('dovrebbe gestire Connect error senza onError definito', () => {
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

  it('dovrebbe eseguire GetAttachment senza callback definiti', () => {
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

  it('dovrebbe chiamare solo i callback forniti durante Connect', () => {
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
    it('non dovrebbe inviare messaggi se ws è undefined', () => {
    (service as any).ws = undefined;

    expect(() => {
      service.sendMessage({ type: 'TEST' });
    }).not.toThrow();
  });

  it('non dovrebbe inviare messaggi se ws non è in stato OPEN', () => {
    const mockSocket = {
      readyState: 0, // CONNECTING
      send: jasmine.createSpy('send')
    };

    (service as any).ws = mockSocket;

    service.sendMessage({ type: 'TEST' });

    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it('non dovrebbe lanciare errori se ws è undefined durante disconnect', () => {
    (service as any).ws = undefined;

    expect(() => {
      service.disconnect();
    }).not.toThrow();
  });

  it('non dovrebbe chiudere ws se non è in stato OPEN', () => {
    const mockSocket = {
      readyState: 3, // CLOSED
      close: jasmine.createSpy('close')
    };

    (service as any).ws = mockSocket;

    service.disconnect();

    expect(mockSocket.close).not.toHaveBeenCalled();
  });
  it('dovrebbe gestire problemList anche senza onResult', () => {
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

  it('dovrebbe gestire problemList error anche senza onError', () => {
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

  it('dovrebbe ignorare messaggio attachment senza status valido', () => {
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

  it('non dovrebbe chiamare onConnectStop se status.Ok è undefined', () => {
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

  it('dovrebbe ignorare dati binari se onData è undefined', () => {
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
  it('non dovrebbe chiamare onConnectStart se non è definito', () => {
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

  it('non dovrebbe chiamare onBinaryHeader se non è definito', () => {
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

  it('non dovrebbe crashare se Connect fallisce ma onError è undefined', () => {
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

   it('dovrebbe chiamare solo onConnectBegin se è l\'unico callback fornito', () => {
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
  it('non dovrebbe crashare se attachment fallisce ma onError è assente', () => {
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

  it('non dovrebbe chiamare onAttachmentInfo se non è fornito', () => {
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

  it('non dovrebbe chiamare onData se non è fornito', () => {
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

  it('dovrebbe chiamare onAttachment anche se Ok è stringa vuota', () => {
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

  it('dovrebbe gestire run vuoto in GetAttachment senza errori', () => {
    let mockCmd: any = {
      run: () => {}
    };

    spyOn(Commands, 'Attchment').and.returnValue(mockCmd);

    expect(() => {
      service.GetAttachment("problema1");
    }).not.toThrow();
  });
  it('non dovrebbe emettere evento se lo stato è già impostato', () => {
    service.updateState(ApiState.Idle);

    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.updateState(ApiState.Idle);

    expect(spy).not.toHaveBeenCalled();
  });

  it('dovrebbe emettere evento se lo stato cambia', () => {
    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.updateState(ApiState.Good);

    expect(spy).toHaveBeenCalledWith(ApiState.Good);
  });

  it('dovrebbe emettere solo se stateIdle cambia stato', () => {
    service.updateState(ApiState.Bad);

    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.stateIdle();

    expect(spy).toHaveBeenCalledWith(ApiState.Idle);
  });

  it('non dovrebbe emettere due volte lo stesso stato', () => {
    service.stateBad();

    const spy = jasmine.createSpy('onApiStateChange');
    service.onApiStateChange.subscribe(spy);

    service.stateBad();

    expect(spy).not.toHaveBeenCalled();
  });

  it('dovrebbe emettere evento per ogni cambio stato tramite stateX()', () => {
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
  it('dovrebbe rifiutare URL non valido (throws in try)', () => {
    const result = service.setUrl("ht!tp://@@");
    expect(result).toBeFalse();
  });

  it('dovrebbe rifiutare protocollo non ws/wss', () => {
    const result = service.setUrl("http://localhost:8080");
    expect(result).toBeFalse();
  });




});
