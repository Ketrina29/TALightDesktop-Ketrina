import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { MessageService } from 'primeng/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfirmationService } from 'primeng/api';
import { TerminalApiService } from '../app/services/terminal-api-service/terminal-api.service';
import { By } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TutorialComponent } from '../app/widgets/tutorial/tutorial.component';

describe('AppComponent', () => {
  let messageServiceMock: any;
  let confirmationServiceMock: any;
  let terminalApiServiceMock: any;

  beforeEach(async () => {
    // Mock dei servizi
    messageServiceMock = {
      add: jasmine.createSpy('add')
    };

    confirmationServiceMock = {
      confirm: jasmine.createSpy('confirm')
    };

    terminalApiServiceMock = {
      executeCommand: jasmine.createSpy('executeCommand')
    };

    await TestBed.configureTestingModule({
      declarations: [AppComponent, TutorialComponent], // Aggiunto TutorialComponent
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MessageService, useValue: messageServiceMock },
        { provide: ConfirmationService, useValue: confirmationServiceMock },
        { provide: TerminalApiService, useValue: terminalApiServiceMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // Mantieni per sicurezza
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the <tal-tutorial> component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    // Modifica per cercare l'elemento nel DOM nativo per i Web Components
    const tutorialElement = fixture.nativeElement.querySelector('tal-tutorial');
    expect(tutorialElement).not.toBeNull();
  });

  it('should render the <tal-topbar-widget> component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const topbarElement = fixture.debugElement.query(By.css('tal-topbar-widget'));
    expect(topbarElement).toBeTruthy();
  });

  it('should render the <router-outlet> element', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const outletElement = fixture.debugElement.query(By.css('router-outlet'));
    expect(outletElement).toBeTruthy();
  });

  it('should have the correct preload link for msal-browser.min.js', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const linkElement = fixture.debugElement.nativeElement.querySelector('link[rel="preload"][href="https://alcdn.msauth.net/browser/2.13.1/js/msal-browser.min.js"]');
    expect(linkElement).toBeTruthy();
  });

  it('ngOnInit should not throw error', () => {
  const fixture = TestBed.createComponent(AppComponent);
  const component = fixture.componentInstance;
  expect(() => component.ngOnInit()).not.toThrow();
});


  it('should change the title when changeTitle is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.changeTitle();
    expect(component.title).toBe('New Title');
  });

  it('should have TAL_SERVER set to correct value', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    expect(component.TAL_SERVER).toBe('wss://ta.di.univr.it/algo');
  });
});
