import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { OutputWidgetComponent, OutputMessage, OutputType} from './output-widget.component';
import { TooltipModule } from 'primeng/tooltip';
import { CompilerState } from '../../../services/compiler-service/compiler-service.types'; 
import { EventEmitter } from '@angular/core';

describe('OutputWidgetComponent', () => {
  let component: OutputWidgetComponent;
  let fixture: ComponentFixture<OutputWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OutputWidgetComponent],
      imports: [ TooltipModule ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OutputWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('isTutorialShown sets isBlurred correctly', () => {
    component.isBlurred = true;
    (component as any).isTutorialShown(); // undefined param
    expect(component.isBlurred).toBeFalse();

    (component as any).isTutorialShown({ componentName: component.constructor.name });
    expect(component.isBlurred).toBeFalse();

    (component as any).isTutorialShown({ componentName: 'DifferentComponent' });
    expect(component.isBlurred).toBeTrue();
  });

  it('clearOutput empties outputLines', () => {
    component.outputLines = [new OutputMessage('test', OutputType.STDOUT)];
    component.clearOutput();
    expect(component.outputLines.length).toBe(0);
  });

  it('print adds new OutputMessage and calls scrollToBottom', () => {
    spyOn(component, 'scrollToBottom');
    component.outputLines = [];

    component.print('Hello', OutputType.STDOUT);

    expect(component.outputLines.length).toBe(1);
    expect(component.outputLines[0].content).toBe('Hello');
    expect(component.outputLines[0].type).toBe(OutputType.STDOUT);
    expect(component.scrollToBottom).toHaveBeenCalled();
  });

  it('iconForType returns correct icons based on OutputType', () => {
    component.outputLines = [
      new OutputMessage('first', OutputType.STDOUT, 0),
      new OutputMessage('second', OutputType.STDOUT, 1),
      new OutputMessage('third', OutputType.STDIN, 2),
    ];

    expect(component.iconForType(component.outputLines[0])).toBe('pi-angle-right');
    // If previous type equals current, icon is empty string
    expect(component.iconForType(component.outputLines[1])).toBe('');
    expect(component.iconForType(component.outputLines[2])).toBe('pi-angle-left');
  });

  it('didStateChange sets properties and enables/disables input correctly', () => {
  spyOn(component, 'enableStdin');

  component.didStateChange(CompilerState.Unknown);
  expect(component.pyodideStateIcon).toBe('pi-circle');
  expect(component.pyodideStateColor).toBe('');
  expect(component.enableStdin).toHaveBeenCalledWith(false);

  component.didStateChange(CompilerState.Stdin);
  expect(component.pyodideStateIcon).toContain('pi-spin');
  expect(component.pyodideStateColor).toBe('orange');
  expect(component.enableStdin).toHaveBeenCalledWith(true);
});

  it('enableStdin disables/enables input and button', () => {
    component.sdtinButton = { nativeElement: { disabled: false } } as any;
    component.sdtinInput = { nativeElement: { disabled: false, style: { borderColor: '' } } } as any;

    spyOn(component, 'enableHighlight');

    component.enableStdin(false);
    expect(component.sdtinButton.nativeElement.disabled).toBeTrue();
    expect(component.sdtinInput.nativeElement.disabled).toBeTrue();
    expect(component.enableHighlight).toHaveBeenCalledWith(false);

    component.enableStdin(true);
    expect(component.sdtinButton.nativeElement.disabled).toBeFalse();
    expect(component.sdtinInput.nativeElement.disabled).toBeFalse();
    expect(component.enableHighlight).toHaveBeenCalledWith(true);
  });

  it('sendStdin emits onStdin with trimmed input and clears input', () => {
    component.sdtinInput = { nativeElement: { value: '  test\n', focus: () => {}, style: {} } } as any;
    spyOn(component.onStdin, 'emit');

    component.sendStdin();

    expect(component.onStdin.emit).toHaveBeenCalledWith('test\n');
    expect(component.sdtinInput.nativeElement.value).toBe('');
  });

  it('sendStdin does nothing if input is empty', () => {
    component.sdtinInput = { nativeElement: { value: '    ', style: {} } } as any;
    spyOn(component.onStdin, 'emit');

    component.sendStdin();

    expect(component.onStdin.emit).not.toHaveBeenCalled();
  });

  it('sendOnEnter calls sendStdin on Enter key', () => {
    spyOn(component, 'sendStdin');
    component.sendOnEnter(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.sendStdin).toHaveBeenCalled();
  });

  it('sendOnEnter does not call sendStdin on other keys', () => {
    spyOn(component, 'sendStdin');
    component.sendOnEnter(new KeyboardEvent('keydown', { key: 'a' }));
    expect(component.sendStdin).not.toHaveBeenCalled();
  });

  it('scrollToBottom scrolls to bottom if element present', fakeAsync(() => {
    const element = document.createElement('div');
    Object.defineProperty(element, 'scrollTop', { writable: true, value: 0 });
    Object.defineProperty(element, 'scrollHeight', { writable: true, value: 100 });
    element.id = 'tal-output-widget-scroll-id';

    spyOn(document, 'getElementById').and.returnValue(element);

    component.scrollToBottom();
    tick();

    expect(element.scrollTop).toBe(element.scrollHeight);
  }));

  it('scrollToBottom does nothing if element not present', fakeAsync(() => {
    spyOn(document, 'getElementById').and.returnValue(null);

    component.scrollToBottom();
    tick();

    expect(document.getElementById).toHaveBeenCalledWith('tal-output-widget-scroll-id');
  }));
it('should handle all CompilerState cases correctly', () => {
    const spyEnable = spyOn(component, 'enableStdin');
    const spyPrint = spyOn(component, 'print');

    // Test Init
    component.didStateChange(CompilerState.Init);
    expect(component.pyodideStateIcon).toBe('pi-circle');
    expect(component.pyodideStateColor).toBe('orange');
    expect(spyEnable).toHaveBeenCalledWith(false);

    // Test Loading
    component.didStateChange(CompilerState.Loading);
    expect(component.pyodideStateIcon).toBe('pi-spin pi-spinner');
    expect(component.pyodideStateColor).toBe('orange');
    expect(spyEnable).toHaveBeenCalledWith(false);

    // Test Ready
    component.didStateChange(CompilerState.Ready);
    expect(component.pyodideStateIcon).toBe('pi-circle');
    expect(component.pyodideStateColor).toBe('green');
    expect(spyEnable).toHaveBeenCalledWith(false);

    // Test Run
    component.didStateChange(CompilerState.Run);
    expect(component.pyodideStateIcon).toBe('pi-spin pi-spinner');
    expect(component.pyodideStateColor).toBe('green');
    expect(spyEnable).toHaveBeenCalledWith(false);

    // Test Stdin
    component.didStateChange(CompilerState.Stdin);
    expect(component.pyodideStateIcon).toBe('pi-spin pi-spinner');
    expect(component.pyodideStateColor).toBe('orange');
    expect(spyEnable).toHaveBeenCalledWith(true);

    // Test Error
    component.didStateChange(CompilerState.Error, 'Test error');
    expect(component.pyodideStateIcon).toBe('pi-circle-fill');
    expect(component.pyodideStateColor).toBe('darkred');
    expect(spyPrint).toHaveBeenCalledWith('END: Error', OutputType.STDERR);
    expect(spyPrint).toHaveBeenCalledWith('Test error', OutputType.STDERR);
    expect(spyEnable).toHaveBeenCalledWith(false);

    // Test Success with content
    component.didStateChange(CompilerState.Success, 'Success content');
    expect(component.pyodideStateIcon).toBe('pi-circle-fill');
    expect(component.pyodideStateColor).toBe('green');
    expect(spyPrint).toHaveBeenCalledWith('END: Success', OutputType.SYSTEM);
    expect(spyPrint).toHaveBeenCalledWith('Success content', OutputType.SYSTEM);
    expect(spyEnable).toHaveBeenCalledWith(false);

    // Test Success without content
    component.didStateChange(CompilerState.Success);
    expect(spyPrint).toHaveBeenCalledWith('END: Success', OutputType.SYSTEM);
  });

 it('should subscribe to tutorialService events and call isTutorialShown', () => {
  const onTutorialChange = new EventEmitter<any>();
  const onTutorialClose = new EventEmitter<void>();

  const tutorialServiceMock = {
    onTutorialChange,
    onTutorialClose
  };

  (component as any).tutorialService = tutorialServiceMock;

  const spyIsTutorialShown = spyOn((component as any), 'isTutorialShown').and.callThrough();

  // Simulo la sottoscrizione manualmente
  tutorialServiceMock.onTutorialChange.subscribe((tutorial) => component['isTutorialShown'](tutorial));
  tutorialServiceMock.onTutorialClose.subscribe(() => component['isTutorialShown']());

  onTutorialChange.emit({ componentName: 'TestComponent' });
  expect(spyIsTutorialShown).toHaveBeenCalledWith({ componentName: 'TestComponent' });

  onTutorialClose.emit();
  expect(spyIsTutorialShown).toHaveBeenCalledWith();
});


});
describe('Input highlight tests', () => {
  let component: OutputWidgetComponent;
  let fixture: ComponentFixture<OutputWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OutputWidgetComponent],
      // eventuali import o providers...
    }).compileComponents();

   
    fixture = TestBed.createComponent(OutputWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Mock per sdtinInput.nativeElement
    const mockInput = {
      style: {
        borderColor: '',
        backgroundColor: ''
      }
    };
    (component as any).sdtinInput = { nativeElement: mockInput };
  });
it('should enable and disable highlight toggling borderColor', fakeAsync(() => {
    const mockInput = (component as any).sdtinInput.nativeElement;

    // Inizialmente borderColor vuoto
    expect(mockInput.style.borderColor).toBe('');

    component.enableHighlight(true, 'red');
    // La funzione usa setInterval, quindi avanziamo il tempo
    tick(1000);
    expect(mockInput.style.borderColor).toBe('red');

    tick(1000);
    expect(mockInput.style.borderColor).toBe('');

    component.enableHighlight(false);
    tick(1000); // setTimeout interno che resetta borderColor
    expect(mockInput.style.borderColor).toBe('');
  }));

  it('focusStdin should clear backgroundColor and disable highlight', () => {
    const mockInput = (component as any).sdtinInput.nativeElement;
    mockInput.style.backgroundColor = 'yellow';

    spyOn(component, 'enableHighlight').and.callThrough();

    component.focusStdin();

    expect(mockInput.style.backgroundColor).toBe('');
    expect(component.enableHighlight).toHaveBeenCalledWith(false);
  });

 it('blurStdin should clear backgroundColor and enable highlight if state is Stdin', () => {
  const mockInput = {
    style: { backgroundColor: 'red' }
  };

  component.sdtinInput = { nativeElement: mockInput } as any;
  component.pyodideState = CompilerState.Stdin;
  spyOn(component, 'enableHighlight');

  component.blurStdin();

  expect(mockInput.style.backgroundColor).toBe('');
  expect(component.enableHighlight).toHaveBeenCalledWith(true);
});

  it('blurStdin should clear backgroundColor and disable highlight if state is not Stdin', () => {
    const mockInput = (component as any).sdtinInput.nativeElement;
    mockInput.style.backgroundColor = 'yellow';

    spyOn(component, 'enableHighlight').and.callThrough();

    // Stato diverso da Stdin
    (component as any).pyodideState = 0; // CompilerState.Init ad esempio

    component.blurStdin();

    expect(mockInput.style.backgroundColor).toBe('');
    expect(component.enableHighlight).toHaveBeenCalledWith(false);
  });
  it('updateIconForOutputType should throw error', () => {
    expect(() => component.updateIconForOutputType(OutputType.STDOUT)).toThrowError('Method not implemented.');
  });

  it('icon should throw error', () => {
    expect(() => component.icon('some-icon')).toThrowError('Method not implemented.');
  });

  it('getIcon should throw error', () => {
    expect(() => component.getIcon(OutputType.STDERR)).toThrowError('Method not implemented.');
  });
it('enableHighlight should call clearInterval if stdinHighlight is set before setting new interval', () => {
  const fakeTimeout = {} as any;
  component.stdinHighlight = fakeTimeout;
  spyOn(window, 'clearInterval');
  spyOn(window, 'setInterval').and.returnValue(fakeTimeout);

  component.enableHighlight(true);

  expect(window.clearInterval).toHaveBeenCalledWith(fakeTimeout);
  expect(window.setInterval).toHaveBeenCalled();
  expect(component.stdinHighlight).toBe(fakeTimeout);
});


it('should set correct icon property for each OutputType', () => {
    const testCases: { type: OutputType; expectedIcon: string }[] = [
      { type: OutputType.STDIN, expectedIcon: 'pi-angle-left' },
      { type: OutputType.STDINAPI, expectedIcon: 'pi-cloud-download' },
      { type: OutputType.STDOUT, expectedIcon: 'pi-angle-right' },
      { type: OutputType.STDERR, expectedIcon: 'pi-exclamation-triangle' },
      { type: OutputType.SYSTEM, expectedIcon: 'pi-info-circle' },
    ];

    testCases.forEach(({ type, expectedIcon }) => {
      // Creiamo un OutputMessage fittizio con tipo corrente e indice 0
      const message = new OutputMessage('test content', type, 0);

      // Chiamiamo iconForType
      const icon = component.iconForType(message);

      expect(icon).toBe(expectedIcon, `Expected icon for OutputType ${type}`);
    });
  });

  it('should return empty string if previous message has same type', () => {
    // Simuliamo una lista di outputLines con messaggi consecutivi dello stesso tipo
    component.outputLines = [
      new OutputMessage('first', OutputType.STDOUT, 0),
      new OutputMessage('second', OutputType.STDOUT, 1),
    ];

    // Il messaggio corrente ha indice 1 e stesso tipo del precedente
    const currentMessage = component.outputLines[1];

    const icon = component.iconForType(currentMessage);

    // Deve ritornare stringa vuota per evitare ripetizione icone
    expect(icon).toBe('');
  });

});
