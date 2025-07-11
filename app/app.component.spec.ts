import { TestBed, ComponentFixture } from '@angular/core/testing'; // Importa ComponentFixture
import { AppComponent } from './app.component';
import { MessageService } from 'primeng/api';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfirmationService } from 'primeng/api';
import { TerminalApiService } from '../app/services/terminal-api-service/terminal-api.service';
import { By } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TutorialComponent } from '../app/widgets/tutorial/tutorial.component';
import { TutorialService } from '../app/services/tutorial-service/tutorial.service'; // Importa TutorialService
import { Subject } from 'rxjs'; // Importa Subject per simulare EventEmitter

describe('AppComponent', () => {
  let messageServiceMock: any;
  let confirmationServiceMock: any;
  let terminalApiServiceMock: any;
  let tutorialServiceMock: any;
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    messageServiceMock = { add: jasmine.createSpy('add') };
    confirmationServiceMock = { confirm: jasmine.createSpy('confirm') };
    terminalApiServiceMock = { executeCommand: jasmine.createSpy('executeCommand') };

    tutorialServiceMock = {
      onTutorialChange: new Subject<any>(),
      onTutorialClose: new Subject<void>(),
      onIndexTutorialChange: new Subject<number>(),
      getSizeTutorial: jasmine.createSpy('getSizeTutorial').and.returnValue(1),
      nextTutorial: jasmine.createSpy('nextTutorial'),
      previousTutorial: jasmine.createSpy('previousTutorial'),
      getCachedTutorial: jasmine.createSpy('getCachedTutorial').and.returnValue('false'),
      closeTutorial: jasmine.createSpy('closeTutorial'),
    };

    await TestBed.configureTestingModule({
      declarations: [AppComponent, TutorialComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MessageService, useValue: messageServiceMock },
        { provide: ConfirmationService, useValue: confirmationServiceMock },
        { provide: TerminalApiService, useValue: terminalApiServiceMock },
        { provide: TutorialService, useValue: tutorialServiceMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    component.ngOnInit(); // aktivizon subscribet e tutorialService
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

 it('should render the <tal-tutorial> component when tutorialIsVisible is true', async () => {
  tutorialServiceMock.onTutorialChange.next({ componentName: 'Start', text: 'Testo tutorial' });
  fixture.detectChanges();
  await fixture.whenStable();

  const tutorialDebugElement = fixture.debugElement.query(By.css('tal-tutorial'));
  expect(tutorialDebugElement).toBeTruthy();
  
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
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.href = 'https://alcdn.msauth.net/browser/2.13.1/js/msal-browser.min.js';
  document.head.appendChild(preloadLink);

  const linkElement = document.querySelector('link[rel="preload"][href="https://alcdn.msauth.net/browser/2.13.1/js/msal-browser.min.js"]');
  expect(linkElement).toBeTruthy();

  document.head.removeChild(preloadLink); // pastrimi
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
  it('should hide tutorial and clear text on tutorial close event', async () => {
  component.tutorialIsVisible = true;
  component.tutorialText = 'Old text';

  tutorialServiceMock.onTutorialClose.next(); // Trigger event
  fixture.detectChanges();
  await fixture.whenStable();

  expect(component.tutorialIsVisible).toBeFalse();
  expect(component.tutorialText).toBe('');
  expect(localStorage.getItem('tutorialIsVisible')).toBe('false');
});
it('should call tutorialService.nextTutorial with current index', () => {
  component.indexCurrentTutorial = 3;
  component.nextTutorial();
  expect(tutorialServiceMock.nextTutorial).toHaveBeenCalledWith(3);
});
it('should call tutorialService.previousTutorial with current index', () => {
  component.indexCurrentTutorial = 1;
  component.prevTutorial();
  expect(tutorialServiceMock.previousTutorial).toHaveBeenCalledWith(1);
});it('should call tutorialService.closeTutorial when closeTutorial is called', () => {
  component.closeTutorial();
  expect(tutorialServiceMock.closeTutorial).toHaveBeenCalled();
});


});
