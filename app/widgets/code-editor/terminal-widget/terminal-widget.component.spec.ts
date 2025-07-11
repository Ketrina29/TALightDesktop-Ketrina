import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TerminalWidgetComponent } from './terminal-widget.component';
import { TerminalService } from 'primeng/terminal';
import { MessageService } from 'primeng/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta } from '../../../services/terminal-api-service/terminal-api.service';
import { ProblemDescriptor } from '../../../services/problem-manager-service/problem-manager.types';

describe('TerminalWidgetComponent professional tests', () => {
  let component: TerminalWidgetComponent;
  let fixture: ComponentFixture<TerminalWidgetComponent>;
  let commandHandlerSubject: Subject<string>;

  beforeEach(async () => {
    commandHandlerSubject = new Subject<string>();
 
    const terminalServiceMock = {
      commandHandler: commandHandlerSubject.asObservable(),
      sendResponse: jasmine.createSpy('sendResponse')
    };

    const messageServiceMock = {
      // eventuali metodi mockati se servono
    };

    await TestBed.configureTestingModule({
      declarations: [TerminalWidgetComponent],
      providers: [
        { provide: TerminalService, useValue: terminalServiceMock },
        { provide: MessageService, useValue: messageServiceMock }
      ],
      imports: [HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalWidgetComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
    component.ngOnInit();

    spyOn(component.onResponseComplete, 'emit');
  });

  it('should clear terminal content on "clear" command', fakeAsync(() => {
    const terminalContent = document.createElement('div');
    terminalContent.classList.add('p-terminal-content');
    terminalContent.innerHTML = '<p>Test content</p>';
    document.body.appendChild(terminalContent);

    spyOn(document, 'getElementsByClassName').and.returnValue({
      length: 1,
      0: terminalContent,
      item: (i: number) => (i === 0 ? terminalContent : null),
      namedItem: () => null,
      [Symbol.iterator]: function* () {
        yield terminalContent;
      }
    } as unknown as HTMLCollectionOf<Element>);

    commandHandlerSubject.next('clear');
    tick(20);

    expect(terminalContent.innerHTML).toBe('');
    expect(component.response).toBe('');
    expect(component.onResponseComplete.emit).toHaveBeenCalled();

    document.body.removeChild(terminalContent);
  }));

  it('sendStdin should append input and enable commandConnectState', () => {
    component.response = '';

    component.sendStdin('Hello Input', true);

    expect(component.response).toContain('Hello Input');
    expect(component.commandConnectState).toBeTrue();
    expect(component.onResponseComplete.emit).toHaveBeenCalled();
  });

  it('pressedCtrlC should reset prompt, disable connect state and call sendConnectStop', () => {
    component.prompt = 'Some prompt';
    component.commandConnectState = true;
    component.cmdConnect = {
      sendConnectStop: jasmine.createSpy('sendConnectStop')
    } as any;

    component.pressedCtrlC();

    expect(component.prompt).toBe('TALight> ');
    expect(component.commandConnectState).toBeFalse();
    expect(component.cmdConnect?.sendConnectStop).toHaveBeenCalled();

  });

  it('didConnectClose should update output_files and reset state accordingly', fakeAsync(async () => {
    (component as any).cmdConnect = {};

    await component.didConnectClose(['file1', 'file2']);
    expect((component as any).output_files).toEqual(['file1', 'file2']);
    expect(component.prompt).toBe('TALight> ');
    expect(component.commandConnectState).toBeFalse();

    await component.didConnectClose(['']);
    expect((component as any).cmdConnect).toBeUndefined();
  }));

  it('isTutorialShown should toggle isBlurred correctly', () => {
    component.isBlurred = true;

    (component as any).isTutorialShown(undefined);
    expect(component.isBlurred).toBeFalse();

    (component as any).isTutorialShown({ componentName: 'TerminalWidgetComponent' });
    expect(component.isBlurred).toBeFalse();

    (component as any).isTutorialShown({ componentName: 'OtherComponent' });
    expect(component.isBlurred).toBeTrue();
  });

  it('apiDownloadAttachment should emit attachments on success', fakeAsync(async () => {
    spyOn(component.api, 'setUrl').and.returnValue(0);
    spyOn(component.api, 'GetAttachment').and.callFake((problemSearch, onAttachment, onAttachmentInfo, onData) => {
      if (onData) onData(new ArrayBuffer(8));
      return {
        onError: null,
        msg: null,
        didReciveHandshake: () => {},
        didRecive: () => {},
        didRecieveAttachment: () => {}
      } as any;
    });
    spyOn(component.onAttachments, 'emit');

    (component as any).problemSearch = 'testProblem';

    await component.apiDownloadAttachment();
    tick();

    expect(component.onAttachments.emit).toHaveBeenCalled();
    expect(component.response).toContain('Attachment downloaded successfully');
    expect(component.onResponseComplete.emit).toHaveBeenCalled();
  }));

  it('apiDownloadAttachment should handle setUrl error cases', fakeAsync(async () => {
    spyOn(component.api, 'setUrl').and.returnValues(-1, -2);

    await component.apiDownloadAttachment();
    tick();
    expect(component.response).toContain('ERROR');
    expect(component.onResponseComplete.emit).toHaveBeenCalled();

    await component.apiDownloadAttachment();
    tick();
    expect(component.response).toContain('ERROR');
    expect(component.onResponseComplete.emit).toHaveBeenCalled();
  }));

it('onConnectCommand should handle success case and call runConnectAPI', fakeAsync(async () => {
  spyOn(component, 'runConnectAPI').and.returnValue(Promise.resolve());
  (component as any).commandSplit = ['rtal', '-s', 'http://url', 'connect', 'problem', 'service'];
  (component as any).url = 'http://url';

  spyOn(component.api, 'setUrl').and.returnValue(0);

  component.onConnectCommand();
  tick();   // fa avanzare microtask

  await Promise.resolve();  // per assicurarsi che tutte le promise siano risolte

  expect(component.runConnectAPI).toHaveBeenCalled();
}));


it('onConnectCommand should handle setUrl error -1', fakeAsync(() => {
  spyOn(component.api, 'setUrl').and.returnValue(-1);
  spyOn(component, 'ErrorMessage04').and.callThrough();

  component.onConnectCommand();
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('onConnectCommand should handle setUrl error -2', fakeAsync(() => {
  spyOn(component.api, 'setUrl').and.returnValue(-2);
  spyOn(component, 'ErrorMessage05').and.callThrough();

  component.onConnectCommand();
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));

it('getListProblems should process problem list and call onListCommand', fakeAsync(() => {
  const mockProblemList = {
    didReciveHandshake: () => {},
    didRecive: () => {},
    didReciveProblemList: () => {},
    tal: null,
    onError: null,
  } as any;

  spyOn(component, 'onListCommand');
  spyOn(component.api, 'setUrl').and.returnValue(0);
  spyOn(component.api, 'problemList').and.callFake((
    onResult: (problemList: Map<string, Meta>) => void,
    onError?: (error: string) => void
  ) => {
    onResult(new Map());
    return mockProblemList;
  });

  (component as any).url = 'http://url';

  component.getListProblems('http://url');
  tick();

  expect(component.onListCommand).toHaveBeenCalled();
}));


it('getListProblems should handle setUrl error -1', fakeAsync(() => {
  spyOn(component.api, 'setUrl').and.returnValue(-1);


  component.getListProblems('http://url');
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('getListProblems should handle setUrl error -2', fakeAsync(() => {
  spyOn(component.api, 'setUrl').and.returnValue(-2);

  component.getListProblems('http://url');
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('didError should reset state and emit error response', fakeAsync(() => {
  const stopExecutionSpy = jasmine.createSpy('stopExecution');

  (component as any).pms = {
    getCurrentDriver: () => ({
      stopExecution: stopExecutionSpy
    })
  };

  component.response = 'Previous response';
  component.prompt = 'Old prompt';
  component.commandConnectState = true;

  component.didError('Test error');
  tick();

  expect(stopExecutionSpy).toHaveBeenCalled();
  expect(component.response).toContain('ERROR');
  expect(component.prompt).toBe('TALight> ');
  expect(component.commandConnectState).toBeFalse();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));

it('didConnectData should write file and emit response when output_files present', fakeAsync(() => {
  const driverMock = {
    writeFile: jasmine.createSpy('writeFile')
  };
  (component as any).pms = {
    getCurrentDriver: () => driverMock
  };

  // Skenari: ka një file për të shkruar
  (component as any).output_files = ['file1'];
  (component as any).current_output_file = 'file1';

  component.didConnectData('data string');
  tick();

  expect(driverMock.writeFile).toHaveBeenCalledWith('/file1', 'data string');
  expect(component.response).toContain('RESULTS');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('didConnectData should call sendStdin when no output_files', fakeAsync(() => {
  spyOn(component, 'sendStdin');

  (component as any).output_files = undefined;

  component.didConnectData('data string');
  tick();

  expect(component.sendStdin).toHaveBeenCalledWith('data string', true);
}));
it('onGetCommand should clear response and emit selected problem', () => {
  spyOn(component.onProblemSelected, 'emit');

  (component as any).problemSearch = 'testProblem';
  component.response = 'old response';

  component.onGetCommand();

  expect(component.response).toBe('');
  expect(component.onProblemSelected.emit).toHaveBeenCalled();
  expect(component.selectedProblem?.name).toBe('testProblem');
});

it('didConnectData should skip writing file if current_output_file is not in output_files', fakeAsync(() => {
  const driverMock = {
    writeFile: jasmine.createSpy('writeFile')
  };
  (component as any).pms = {
    getCurrentDriver: () => driverMock
  };

  (component as any).output_files = ['file1'];
  (component as any).current_output_file = 'nonexistent.txt';

  component.didConnectData('data');
  tick();

  // not write the file
  expect(driverMock.writeFile).not.toHaveBeenCalled();
  expect(component.response).toContain('RESULTS');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));

it('UndoHistory should set input value to previous command', () => {
  const input = document.createElement('input');
  input.classList.add('p-terminal-input');
  document.body.appendChild(input);

  component.terminalHistory = ['cmd1', 'cmd2', 'cmd3'];
  component.terminalHistoryIndex = -1;

  component.UndoHistory();

  expect(input.value).toBe('cmd3');

  document.body.removeChild(input);
});

it('RedoHistory should set input value to next command', () => {
  const input = document.createElement('input');
  input.classList.add('p-terminal-input');
  document.body.appendChild(input);

  component.terminalHistory = ['cmd1', 'cmd2', 'cmd3'];
  component.terminalHistoryIndex = 1;

  component.RedoHistory();

  expect(input.value).toBe('cmd3');

  document.body.removeChild(input);
});

it('onConnectCommand should handle syntax error when wrong -a arguments', fakeAsync(() => {
  (component as any).commandSplit = [
    'rtal', '-s', 'url', 'connect', '-a', 'paramwithoutvalue'
  ];

  component.onConnectCommand();
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));

it('HelpMessage returns string containing usage info', () => {
  const help = component.HelpMessage();
  expect(help).toContain('rtal 0.2.5');
  expect(help).toContain('USAGE');
  expect(help).toContain('SUBCOMMANDS');
});


it('ErrorMessage08 should return proper error message', () => {
  const msg = component.ErrorMessage08();
  expect(msg).toContain('ERROR');
  expect(msg).toContain('--service-arg');
});
it('should respond with help message for "rtal help"', fakeAsync(() => {
  commandHandlerSubject.next('rtal help');
  tick();
  expect(component.response).toContain('rtal 0.2.5');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));
it('should respond with error on unknown command', fakeAsync(() => {
  commandHandlerSubject.next('unknowncommand');
  tick();
  expect(component.response).toContain('Unknown command');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));
it('didConnectStart should log message', () => {
  spyOn(console, 'log');
  component.didConnectStart();
  expect(console.log).toHaveBeenCalledWith('apiConnect:didConnectStart');
});

it('didConnectBegin should log message with content', () => {
  spyOn(console, 'log');
  const msg = ['start', 'message'];
  component.didConnectBegin(msg);
  expect(console.log).toHaveBeenCalledWith('apiConnect:didConnectBegin:', msg);
});
it('didRecieveBinaryHeader should update current_output_file and write empty file', () => {
  const driverMock = { writeFile: jasmine.createSpy('writeFile') };
  (component as any).pms = { getCurrentDriver: () => driverMock };

  const msg = { name: 'output.txt' };
  component.didRecieveBinaryHeader(msg);

  expect((component as any).current_output_file).toBe('output.txt');
  expect(driverMock.writeFile).toHaveBeenCalledWith('/output.txt', '');
});
it('should respond with help message on "rtal" only command', fakeAsync(() => {
  commandHandlerSubject.next('rtal');
  tick();
  expect(component.response).toContain('rtal 0.2.5');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));
it('should clear response and terminal content on "clear" command', fakeAsync(() => {
  const terminalContent = document.createElement('div');
  terminalContent.classList.add('p-terminal-content');
  terminalContent.innerHTML = '<p>to be cleared</p>';
  document.body.appendChild(terminalContent);

  spyOn(document, 'getElementsByClassName').and.returnValue({
    length: 1,
    0: terminalContent,
    item: (i: number) => (i === 0 ? terminalContent : null),
    namedItem: () => null,
    [Symbol.iterator]: function* () {
      yield terminalContent;
    }
  } as unknown as HTMLCollectionOf<Element>);

  commandHandlerSubject.next('clear');
  tick(20);

  expect(terminalContent.innerHTML).toBe('');
  expect(component.response).toBe('');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();

  document.body.removeChild(terminalContent);
}));
it('should respond with version info on "rtal --version"', fakeAsync(() => {
  commandHandlerSubject.next('rtal --version');
  tick();
  expect(component.response).toContain('rtal 0.2.5');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));
it('runConnectAPI should set apiRun true during apiConnect and false after', fakeAsync(async () => {
  spyOn(component, 'apiConnect').and.returnValue(Promise.resolve(true));

  const promise = component.runConnectAPI();

  expect(component.apiRun).toBeTrue();
  await promise;
  expect(component.apiRun).toBeFalse();
}));

it('should emit ErrorMessage02 if commandSplit length == 2', fakeAsync(() => {
  component['commandSplit'] = ['rtal', '-s'];
  spyOn(component, 'ErrorMessage02').and.callThrough();

  component.handleCommand('rtal -s');
  tick();

  expect(component.ErrorMessage02).toHaveBeenCalled();
  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));

it('should emit HelpMessage if commandSplit length == 3', fakeAsync(() => {
  component['commandSplit'] = ['rtal', '-s', 'http://example.com'];

  if (!jasmine.isSpy(component.onResponseComplete.emit)) {
    spyOn(component.onResponseComplete, 'emit');
  } else {
    (component.onResponseComplete.emit as jasmine.Spy).calls.reset();
  }

  if (!jasmine.isSpy(component.HelpMessage)) {
    spyOn(component, 'HelpMessage').and.callThrough();
  } else {
    (component.HelpMessage as jasmine.Spy).calls.reset();
  }

  component.handleCommand('rtal -s http://example.com');
  tick();

  expect(component.HelpMessage).toHaveBeenCalled();
  expect(component.response).toContain('rtal 0.2.5');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('should call onGetCommand if get command with correct args', fakeAsync(() => {
  spyOn(component, 'onGetCommand');

  commandHandlerSubject.next('rtal -s http://example.com get problemName');
  tick();

  expect(component.onGetCommand).toHaveBeenCalled();
}));


it('should emit ErrorMessage07 if get command has wrong args length', fakeAsync(() => {
  component['commandSplit'] = ['rtal', '-s', 'http://url', 'get', 'arg1', 'arg2', 'extra'];
  spyOn(component, 'ErrorMessage07').and.callThrough();

  component.handleCommand('rtal -s http://url get arg1 arg2 extra');
  tick();

  expect(component.ErrorMessage07).toHaveBeenCalledWith('arg2');
  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('should call getListProblems if list command', fakeAsync(() => {
  component['commandSplit'] = ['rtal', '-s', 'http://example.com', 'list'];
  spyOn(component, 'getListProblems').and.callThrough();

  component.handleCommand('rtal -s http://example.com list');
  tick();

  expect(component.getListProblems).toHaveBeenCalledWith('http://example.com');
}));

it('apiConnect should return false if selectedService is undefined', async () => {
  component.selectedService = undefined;
  const result = await component.apiConnect();
  expect(result).toBeFalse();
});
it('sendStdin should append msg to response, emit event and set commandConnectState true', () => {

  component.response = '';

  component.sendStdin('test message');

  expect(component.response).toContain('test message');
  expect(component.commandConnectState).toBeTrue();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
});

it('didConnectClose should call apiConnectReset when message is empty', fakeAsync(() => {
  spyOn(component, 'apiConnectReset').and.callThrough();

  component.didConnectClose(['']);
  tick();

  expect(component.apiConnectReset).toHaveBeenCalled();
  expect(component.prompt).toBe('TALight> ');
  expect(component.commandConnectState).toBeFalse();
}));

it('sendStdin should handle empty input gracefully', () => {
  component.response = 'old response';
  component.sendStdin('');
  expect(component.response).toBe('old response');  // non aggiunge stringa vuota
  expect(component.commandConnectState).toBeTrue();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
});

it('pressedCtrlC should do nothing if cmdConnect is undefined', () => {
  component.prompt = 'Old prompt';
  component.commandConnectState = true;
  (component as any).cmdConnect = undefined;

  component.pressedCtrlC();

  expect(component.prompt).toBe('TALight> ');
  expect(component.commandConnectState).toBeFalse();
  
});

it('runConnectAPI should handle rejected Promise gracefully', fakeAsync(() => {
  spyOn(component, 'apiConnect').and.returnValue(Promise.reject('fail'));

  const promise = component.runConnectAPI(); 
  expect(component.apiRun).toBeTrue();      

  tick(); 

  expect(component.apiRun).toBeFalse(); 
  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));

it('apiDownloadAttachment should handle GetAttachment onError callback', fakeAsync(() => {
  component.response = '';
  spyOn(component.api, 'setUrl').and.returnValue(0);
  spyOn(component.onResponseComplete, 'emit');

  spyOn(component.api, 'GetAttachment').and.callFake((_, __, ___, ____, onError) => {
    if (onError) {
      onError('Download failed');
    }
    return {} as any;
  });

  (component as any).problemSearch = 'testProblem';

  component.apiDownloadAttachment(); // nuk ka më `await`
  tick(); // përpunon onError async nëse ka nevojë

  expect(component.response).toContain('ERROR');
  expect(component.response).toContain('Download failed');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('didError should stop execution when pms and driver exist', fakeAsync(() => {
  const stopExecutionSpy = jasmine.createSpy('stopExecution');
  const mockDriver = { stopExecution: stopExecutionSpy };
  (component as any).pms = {
    getCurrentDriver: () => mockDriver
  };

  component.didError('Runtime failure');
  tick();

  expect(stopExecutionSpy).toHaveBeenCalled();
  expect(component.response).toContain('ERROR');
  expect(component.prompt).toBe('TALight> ');
  expect(component.commandConnectState).toBeFalse();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));

it('didError should handle absence of pms gracefully', fakeAsync(() => {
  (component as any).pms = undefined;
  // Non rispieghiamo emit

  component.didError('Error without pms');
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.prompt).toBe('TALight> ');
  expect(component.commandConnectState).toBeFalse();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));it('UndoHistory and RedoHistory should do nothing if no terminal input found', () => {
  spyOn(document.body, 'querySelector').and.returnValue({ value: '' } as any);

  component.terminalHistory = ['cmd1', 'cmd2'];
  component.terminalHistoryIndex = 0;

  component.UndoHistory();
  component.RedoHistory();
});

it('should return early if cmdConnect is undefined', () => {
  (component as any).cmdConnect = undefined;
  component.response = 'old response';

  component.sendStdin('test command');

  expect(component.response).toBe('old response');
});

it('should call sendBinary on cmdConnect and clear response', () => {
  const sendBinarySpy = jasmine.createSpy('sendBinary');
  (component as any).cmdConnect = { sendBinary: sendBinarySpy };
  component.response = 'old response';

  component.sendStdin('test command');

  expect(sendBinarySpy).toHaveBeenCalledWith('test command\n');
  expect(component.response).toBe('');
});

it('should call apiDownloadAttachment and emit onProblemSelected in onGetCommand', () => {
  // Mockojmë apiDownloadAttachment
  const apiDownloadSpy = spyOn(component, 'apiDownloadAttachment');
  const emitSpy = spyOn(component.onProblemSelected, 'emit');

  // Vendosim disa vlera të nevojshme
  (component as any).problemSearch = 'dummy-problem';

  component.onGetCommand();

  expect(apiDownloadSpy).toHaveBeenCalled();
  expect(emitSpy).toHaveBeenCalledWith(jasmine.any(ProblemDescriptor));
  expect(component.selectedProblem?.name).toBe('dummy-problem');
});
it('should reset prompt, set commandConnectState to false and call sendConnectStop if cmdConnect exists', () => {
  const sendConnectStopSpy = jasmine.createSpy();
  component.cmdConnect = { sendConnectStop: sendConnectStopSpy } as any;

  component.pressedCtrlC();

  expect(component.prompt).toBe('TALight> ');
  expect(component.commandConnectState).toBeFalse();
  expect(sendConnectStopSpy).toHaveBeenCalled();
});

it('should not throw if cmdConnect is undefined', () => {
  component.cmdConnect = undefined;

  expect(() => component.pressedCtrlC()).not.toThrow();
  expect(component.prompt).toBe('TALight> ');
  expect(component.commandConnectState).toBeFalse();
});
it('should handle "--server-url list" command properly', () => {
  const mockUrl = 'http://example.com';
  const command = `rtal --server-url ${mockUrl} list`;

  const getListSpy = spyOn<any>(component, 'getListProblems');

  // Dërgo komandën përmes Subject-it të simuluar
  commandHandlerSubject.next(command);

  expect(getListSpy).toHaveBeenCalledWith(mockUrl);
});

  it('should emit ErrorMessage02 if commandSplit length == 2', fakeAsync(() => {
    component['commandSplit'] = ['rtal', '--server-url'];
    component['response'] = '';
    component['handleCommand']('rtal --server-url');
    tick();
    expect(component.response).toContain('ERROR');
    expect(component.onResponseComplete.emit).toHaveBeenCalled();
  }));

  it('should emit HelpMessage if commandSplit length == 3', fakeAsync(() => {
    component['commandSplit'] = ['rtal', '--server-url', 'http://example.com'];
    component['response'] = '';
    component['handleCommand']('rtal --server-url http://example.com');
    tick();
    expect(component.response).toContain('rtal 0.2.5');
    expect(component.onResponseComplete.emit).toHaveBeenCalled();
  }));

  it('should call onGetCommand if command is get with correct length', fakeAsync(() => {
    component['commandSplit'] = ['rtal', '--server-url', 'http://example.com', 'get', 'problem1'];
    spyOn(component, 'onGetCommand').and.callThrough();
    component['handleCommand']('rtal --server-url http://example.com get problem1');
    tick();
    expect(component.onGetCommand).toHaveBeenCalled();
  }));

  it('should emit ErrorMessage07 if get is missing keyword', fakeAsync(() => {
    component['commandSplit'] = ['rtal', '--server-url', 'http://example.com', 'get'];
    component['handleCommand']('rtal --server-url http://example.com get');
    tick();
    expect(component.response).toContain('ERROR');
    expect(component.onResponseComplete.emit).toHaveBeenCalled();
  }));

  it('should call getListProblems if command is list', fakeAsync(() => {
    component['commandSplit'] = ['rtal', '--server-url', 'http://example.com', 'list'];
    spyOn(component, 'getListProblems');
    component['handleCommand']('rtal --server-url http://example.com list');
    tick();
    expect(component.getListProblems).toHaveBeenCalledWith('http://example.com');
  }));

  it('should call onConnectCommand if command is connect', fakeAsync(() => {
    component['commandSplit'] = ['rtal', '--server-url', 'http://example.com', 'connect'];
    spyOn(component, 'onConnectCommand');
    component['handleCommand']('rtal --server-url http://example.com connect');
    tick();
    expect(component.onConnectCommand).toHaveBeenCalled();
  }));

  it('should emit ErrorMessage03 if command is unknown', fakeAsync(() => {
    component['commandSplit'] = ['rtal', '--server-url', 'http://example.com', 'unknown'];
    component['handleCommand']('rtal --server-url http://example.com unknown');
    tick();
    expect(component.response).toContain('ERROR');
    expect(component.onResponseComplete.emit).toHaveBeenCalled();
  }));

it('should emit ErrorMessage08 if -a is not followed by key=value', () => {
  spyOn(component, 'ErrorMessage08').and.callThrough();

  component.handleCommand('rtal -s ws://server connect -a invalidformat problem service');

  expect(component.ErrorMessage08).toHaveBeenCalled();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
});

it('should parse problem/service correctly when -a is at position 4', () => {
  (component as any).problems = new Map<string, any>([
    ['myProblem', {
      name: 'myProblem',
      services: [
        { name: 'myService', args: [], lang: 'py' }
      ]
    }]
  ]);

  component.handleCommand('rtal -s ws://server connect -a lang=py myProblem myService');
  expect((component as any).connectParams['lang']).toBe('py');
});

it('should parse problem/service correctly when -a is at position 5', () => {
  component.handleCommand('rtal -s ws://server connect param0 -a lang=cpp myProblem myService');
  expect((component as any).connectParams['lang']).toBe('cpp');
});

it('should parse problem/service correctly when -a is at position 6', () => {
  component.handleCommand('rtal -s ws://server connect param0 param1 -a lang=java myProblem myService');
  expect((component as any).connectParams['lang']).toBe('java');
});

it('should emit syntax error when isPresentArg is unrecognized', () => {
  spyOn(component, 'ErrorMessage08').and.callThrough();
  component.handleCommand('rtal -s ws://server connect a b c -a invalid');
  expect(component.response).toContain('ERROR');
  expect(component.ErrorMessage08).toHaveBeenCalled();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
});

it('should assign selectedService and connectParams in onConnectCommand when problem and service are defined', fakeAsync(() => {
  (component as any).selectedService = { name: '', parent: { name: '' } };
  (component as any).commandSplit = [
    'rtal', '-s', 'ws://server', 'connect', '-a', 'lang=py', 'myProblem', 'myService'
  ];
  spyOn(component.api, 'setUrl').and.returnValue(0);
  spyOn(component, 'runConnectAPI').and.returnValue(Promise.resolve());
  (component as any).url = 'ws://server';

  (component as any).onConnectCommand();
  tick();

  expect((component as any).selectedService.name).toBe('myService');
  expect((component as any).selectedService.parent.name).toBe('myProblem');
  expect((component as any).connectParams).toEqual({ lang: 'py' });
}));


it('should respond with unknown command message for unrecognized commands', () => {
  component.commandConnectState = false;
  component.handleCommand('unknowncommand');
  expect(component.response).toContain("Unknown command");
});


it('should reset prompt and disable state on pressedCtrlC when cmdConnect is undefined', () => {
  component.cmdConnect = undefined;
  component.commandConnectState = true;
  component.pressedCtrlC();
  expect(component.prompt).toBe('TALight> ');
  expect(component.commandConnectState).toBeFalse();
});
it('should send binary command and reset response when commandConnectState is true and cmdConnect exists', () => {
  const mockCmdConnect = jasmine.createSpyObj('cmdConnect', ['sendBinary']);
  component.commandConnectState = true;
  component.cmdConnect = mockCmdConnect;
  component.response = 'old';

  const command = 'run something';
  component.handleCommand(command);

  expect(mockCmdConnect.sendBinary).toHaveBeenCalledWith('run something\n');
  expect(component.response).toBe('');
});
it('should return early when commandConnectState is true but cmdConnect is undefined', () => {
  component.commandConnectState = true;
  component.cmdConnect = undefined;
  component.response = 'unchanged';

  const command = 'do nothing';
  component.handleCommand(command);

 
  expect(component.response).toBe('unchanged');
});
it('should call api.Connect with correct parameters when selectedService is defined', fakeAsync(async () => {
  const mockService = {
    name: 'serviceName',
    parent: { name: 'problemName' },
  };

  component.selectedService = mockService as any;

  // Anashkalim i fushave private me Object.assign
  Object.assign(component, {
    connectParams: { key: 'value' },
    pms: {
      getCurrentProject: () => ({
        config: {
          TAL_TOKEN: 'token123',
        }
      })
    },
    api: {
      Connect: jasmine.createSpy().and.returnValue(Promise.resolve({
        sendBinary: jasmine.createSpy('sendBinary')
      }))
    }
  });

  const connectSpy = component.api.Connect as jasmine.Spy;

  const didConnectStartSpy = spyOn(component as any, 'didConnectStart');
  const didConnectBeginSpy = spyOn(component as any, 'didConnectBegin');
  const didConnectCloseSpy = spyOn(component as any, 'didConnectClose');
  const didConnectDataSpy = spyOn(component as any, 'didConnectData');
  const didRecieveBinaryHeaderSpy = spyOn(component as any, 'didRecieveBinaryHeader');
  const didErrorSpy = spyOn(component as any, 'didError');

  await component.apiConnect();
  tick();

  expect(connectSpy).toHaveBeenCalledWith(
    'problemName',
    'serviceName',
    { key: 'value' },
    false,
    'token123',
    jasmine.any(Map),
    jasmine.any(Function),
    jasmine.any(Function),
    jasmine.any(Function),
    jasmine.any(Function),
    jasmine.any(Function),
    jasmine.any(Function),
  );

  // Kontroll që cmdConnect të jetë inicializuar
  expect((component as any).cmdConnect).toBeDefined();
}));
describe('onListCommand', () => {
  beforeEach(() => {
    component.commandSplit = [];
    component.problemList = [
      {
        name: 'problem1',
        services: [
          {
            name: 'service1',
            args: [{ name: 'arg1', default: 'val1', regex: '.*' }],
            files: [{ name: 'file1.txt' }]
          }
        ]
      }
    ] as any[];
  });

  it('should list problems when length is 4', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list'];
    component.onListCommand();
    expect(component.response).toContain('- problem1');
  });

  it('should list problems with services and args when -v is passed (length 5)', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list', '-v'];
    component.onListCommand();
    expect(component.response).toContain('* service1');
    expect(component.response).toContain('# arg1 [val1]');
    expect(component.response).toContain('§ file1.txt');
  });

  it('should list services for a known problem name (length 5)', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list', 'problem1'];
    component.onListCommand();
    expect(component.response).toContain('* service1');
  });

  it('should show error for unknown problem name (length 5)', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list', 'unknown'];
    component.onListCommand();
    expect(component.response).toContain("ERROR: Problem 'unknown' does not exists");
  });

  it('should handle -v problem_name (length 6)', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list', '-v', 'problem1'];
    component.onListCommand();
    expect(component.response).toContain('* service1');
    expect(component.response).toContain('# arg1 [val1] .*');
  });

  it('should handle problem_name -v (length 6)', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list', 'problem1', '-v'];
    component.onListCommand();
    expect(component.response).toContain('* service1');
  });

  it('should show syntax error for unknown flags (length 6)', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list', '--bad', 'problem1'];
    component.onListCommand();
    expect(component.response).toContain("ERROR: Found argument '--bad'");
  });

  it('should call ErrorMessage06 for unknown format (length 6)', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list', 'problem1', 'weird'];
    spyOn(component, 'ErrorMessage06').and.returnValue('ERR');
    component.onListCommand();
    expect(component.response).toBe('ERR');
  });
it('should call all callbacks passed to api.Connect', fakeAsync(async () => {
  const mockService = {
    name: 'myService',
    parent: { name: 'myProblem' }
  };

  component.selectedService = mockService as any;
  (component as any).connectParams = {};  // nëse private
  (component as any).pms = {
    getCurrentProject: () => ({
      config: {
        TAL_TOKEN: 'tokenABC'
      }
    })
  };

  const callbackMap: Record<string, Function> = {};

  const connectSpy = jasmine.createSpy().and.callFake((
    problem, service, args, tty, token, files,
    onConnectionStart, onConnectionBegin, onConnectionClose,
    onData, onBinaryHeader, onError
  ) => {
    callbackMap['onConnectionStart'] = onConnectionStart;
callbackMap['onConnectionBegin'] = onConnectionBegin;
callbackMap['onConnectionClose'] = onConnectionClose;
callbackMap['onData'] = onData;
callbackMap['onBinaryHeader'] = onBinaryHeader;
callbackMap['onError'] = onError;

    return Promise.resolve({ sendBinary: jasmine.createSpy() });
  });

  component.api = {
    Connect: connectSpy,
  } as any;

  const spyStart = spyOn(component as any, 'didConnectStart');
  const spyBegin = spyOn(component as any, 'didConnectBegin');
  const spyClose = spyOn(component as any, 'didConnectClose');
  const spyData = spyOn(component as any, 'didConnectData');
  const spyHeader = spyOn(component as any, 'didRecieveBinaryHeader');
  const spyError = spyOn(component as any, 'didError');

  await component.apiConnect();
  tick();

  // Trigger each callback manually to test if they're wired correctly
 callbackMap['onConnectionStart']?.();
callbackMap['onConnectionBegin']?.(['hello']);
callbackMap['onConnectionClose']?.(['bye']);
callbackMap['onData']?.('some data');
callbackMap['onBinaryHeader']?.({ type: 'header' });
callbackMap['onError']?.({ message: 'fail' });

  expect(spyStart).toHaveBeenCalled();
  expect(spyBegin).toHaveBeenCalledWith(['hello']);
  expect(spyClose).toHaveBeenCalledWith(['bye']);
  expect(spyData).toHaveBeenCalledWith('some data');
  expect(spyHeader).toHaveBeenCalledWith({ type: 'header' });
  expect(spyError).toHaveBeenCalledWith({ message: 'fail' });
}));

  it('should handle totally wrong format (length 7)', () => {
    component.commandSplit = ['rtal', '-s', 'url', 'list', 'a', 'b', 'c'];
    spyOn(component, 'ErrorMessage06').and.returnValue('BAD');
    component.onListCommand();
    expect(component.response).toBe('BAD');
  });
});

});


