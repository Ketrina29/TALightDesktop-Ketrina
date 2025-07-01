import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TerminalWidgetComponent } from './terminal-widget.component';
import { TerminalService } from 'primeng/terminal';
import { MessageService } from 'primeng/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Meta } from '../../../services/terminal-api-service/terminal-api.service';

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

  // NON spiare di nuovo emit se già fatto nel beforeEach
  // spyOn(component.onResponseComplete, 'emit');

  component.getListProblems('http://url');
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('getListProblems should handle setUrl error -2', fakeAsync(() => {
  spyOn(component.api, 'setUrl').and.returnValue(-2);

  // NON spiare di nuovo emit se già fatto nel beforeEach
  // spyOn(component.onResponseComplete, 'emit');

  component.getListProblems('http://url');
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));


it('didError should reset state and emit error response', fakeAsync(() => {
  const driverMock = {
    stopExecution: jasmine.createSpy('stopExecution')
  };
  (component as any).pms = {
    getCurrentDriver: () => driverMock
  };

  spyOn(component.onResponseComplete, 'emit');

  component.didError('Test error');
  tick();

  expect(driverMock.stopExecution).toHaveBeenCalled();
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

  spyOn(component.onResponseComplete, 'emit');

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
  spyOn(component.onResponseComplete, 'emit');

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
  spyOn(component.onResponseComplete, 'emit');
  spyOn(component, 'ErrorMessage02').and.callThrough();

  commandHandlerSubject.next('rtal -s');
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.ErrorMessage02).toHaveBeenCalled();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));
it('should emit HelpMessage if commandSplit length == 3', fakeAsync(() => {
  spyOn(component.onResponseComplete, 'emit');
  spyOn(component, 'HelpMessage').and.callThrough();

  commandHandlerSubject.next('rtal -s http://example.com');
  tick();

  expect(component.response).toContain('rtal 0.2.5');
  expect(component.HelpMessage).toHaveBeenCalled();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));it('should call onGetCommand if get command with correct args', fakeAsync(() => {
  spyOn(component, 'onGetCommand');

  commandHandlerSubject.next('rtal -s http://example.com get problemName');
  tick();

  expect(component.onGetCommand).toHaveBeenCalled();
}));
it('should emit ErrorMessage07 if get command has wrong args length', fakeAsync(() => {
  spyOn(component.onResponseComplete, 'emit');
  spyOn(component, 'ErrorMessage07').and.callThrough();

  commandHandlerSubject.next('rtal -s http://example.com get problemName extra');
  tick();

  expect(component.response).toContain('ERROR');
  expect(component.ErrorMessage07).toHaveBeenCalled();
  expect(component.onResponseComplete.emit).toHaveBeenCalled();
}));

it('should call getListProblems if list command', fakeAsync(() => {
  (component as any).commandSplit = ['rtal', '-s', 'http://example.com', 'list'];
  spyOn(component, 'getListProblems');

  (component as any).terminalService.commandHandler.next('rtal -s http://example.com list');
  tick();

  expect(component.getListProblems).toHaveBeenCalledWith('http://example.com');
}));

});
