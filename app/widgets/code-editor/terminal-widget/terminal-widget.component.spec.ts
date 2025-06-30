import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminalWidgetComponent } from './terminal-widget.component';
import { TerminalService } from 'primeng/terminal';
import { MessageService } from 'primeng/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, Subject } from 'rxjs';


describe('TerminalWidgetComponent', () => {
  let component: TerminalWidgetComponent;
  let fixture: ComponentFixture<TerminalWidgetComponent>;

  // Mock terminalService con commandHandler Observable
  const commandHandlerSubject = new Subject<string>();
  const terminalServiceMock = {
    commandHandler: commandHandlerSubject.asObservable(),
    executeCommand: jasmine.createSpy('executeCommand'),
    sendResponse: jasmine.createSpy('sendResponse')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TerminalWidgetComponent],
      providers: [
        { provide: TerminalService, useValue: terminalServiceMock },
        MessageService
      ],
      imports: [HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should respond to commandHandler emission', () => {
    // Emuliamo comando 'rtal help'
    commandHandlerSubject.next('rtal help');
    
    expect(component.response).toContain('rtal 0.2.5'); // Risposta help contiene versione
  });

  it('should call sendResponse when onResponseComplete emits', () => {
    // Forziamo l’emissione dell’evento onResponseComplete e verifichiamo la chiamata
    component.response = 'test response';
    component.onResponseComplete.emit();

    expect(terminalServiceMock.sendResponse).toHaveBeenCalledWith('test response');
  });



  it('should update response for unknown command', () => {
    commandHandlerSubject.next('unknowncommand');
    expect(component.response).toContain("Unknown command");
  });
});
