import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { LogApiWidgetComponent } from './log-api-widget.component';

import { ButtonModule } from 'primeng/button'; // Importo modul per p-button
import { CUSTOM_ELEMENTS_SCHEMA, EventEmitter } from '@angular/core'; 

describe('LogApiWidgetComponent', () => {
  let component: LogApiWidgetComponent;
  let fixture: ComponentFixture<LogApiWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogApiWidgetComponent],
      imports: [ButtonModule], // add modules that template uses
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // opsional
    }).compileComponents();

    fixture = TestBed.createComponent(LogApiWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('isTutorialShown should set isBlurred correctly', () => {
  (component as any).isTutorialShown(undefined);
  expect(component.isBlurred).toBeFalse();

  (component as any).isTutorialShown({ componentName: 'LogApiWidgetComponent' });
  expect(component.isBlurred).toBeFalse();

  (component as any).isTutorialShown({ componentName: 'OtherComponent' });
  expect(component.isBlurred).toBeTrue();
});

it('clearOutput should clear outputLines', () => {
  component.outputLines = [{id: 0, content: 'test'}];
  component.clearOutput();
  expect(component.outputLines.length).toBe(0);
});

it('addLine should add line and trigger animation', fakeAsync(() => {
  spyOn(document, 'getElementById').and.returnValue({
    style: { animationPlayState: '' }
  } as any);
  component.outputLines = [];
  component.addLine('New content');
  expect(component.outputLines.length).toBe(1);
  expect(component.outputLines[0].content).toBe('New content');
  tick(0);
  expect(document.getElementById).toHaveBeenCalledWith('flash-div-0');
}));

it('flashLine should pause all animations', () => {
  const mockDivs: any[] = [
    { style: { animationPlayState: '' } },
    { style: { animationPlayState: '' } }
  ];

  let callCount = 0;
  spyOn(document, 'getElementById').and.callFake(() => {
    return mockDivs[callCount++];
  });

  component.outputLines = [{ id: 0, content: 'a' }, { id: 1, content: 'b' }];

  component.flashLine();

  expect(document.getElementById).toHaveBeenCalledTimes(2);
  expect(mockDivs[0].style.animationPlayState).toBe('paused');
  expect(mockDivs[1].style.animationPlayState).toBe('paused');
});
it('copy should write to clipboard and activate tooltip', async () => {
  const tooltipMock = { activate: jasmine.createSpy('activate'), el: { nativeElement: { id: 'icon-0' } } };

  // Mock tooltips come array con find()
  Object.defineProperty(component, 'tooltips', {
    get: () => ({
      find: () => tooltipMock
    }),
    configurable: true
  });

  spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

  component.outputLines = [{ id: 0, content: 'copy this' }];

  await component.copy(0);

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy this');
  expect(tooltipMock.activate).toHaveBeenCalled();
});

it('active toggles icon, label and isActive', () => {
  spyOn(document, 'getElementById').and.returnValue({} as any);

  component.icon = 'pi-check-circle';
  component.label = 'Log Active';
  component.isActive = true;
  component.active();

  expect(component.icon).toBe('pi-ban');
  expect(component.label).toBe('Log Disabled');
  expect(component.isActive).toBeFalse();

  component.active();

  expect(component.icon).toBe('pi-check-circle');
  expect(component.label).toBe('Log Active');
  expect(component.isActive).toBeTrue();
});it('active should update icon, label, isActive and call flashLine', () => {
  spyOn(component, 'flashLine');

  component.isActive = true;
  component.icon = 'pi-check-circle'; // stato iniziale
  component.label = 'Log Active';

  component.active();

  expect(component.icon).toBe('pi-ban');
  expect(component.label).toBe('Log Disabled');
  expect(component.isActive).toBeFalse();
  expect(component.flashLine).not.toHaveBeenCalled(); // flashLine non viene chiamata

  component.active();

  expect(component.icon).toBe('pi-check-circle');
  expect(component.label).toBe('Log Active');
  expect(component.isActive).toBeTrue();
  expect(component.flashLine).not.toHaveBeenCalled();
});


it('active should toggle icon, label, isActive back when already active', () => {
  spyOn(component, 'flashLine');

  // Stato iniziale: non attivo
  component.icon = 'pi-ban';
  component.label = 'Log Disabled';
  component.isActive = false;

  component.active();

  expect(component.icon).toBe('pi-check-circle');
  expect(component.label).toBe('Log Active');
  expect(component.isActive).toBeTrue();
  expect(component.flashLine).not.toHaveBeenCalled();
});


  it('copy should not fail if tooltip not found', async () => {
    Object.defineProperty(component, 'tooltips', {
      get: () => ({
        find: () => undefined
      }),
      configurable: true
    });

    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

    component.outputLines = [{ id: 0, content: 'text to copy' }];

    await component.copy(0);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('text to copy');
  });

  it('flashLine should handle empty outputLines array gracefully', () => {
    spyOn(document, 'getElementById');

    component.outputLines = [];

    component.flashLine();

    expect(document.getElementById).not.toHaveBeenCalled();
  });

it('should subscribe to tutorialService events and call isTutorialShown', () => {
  // Spia il metodo privato isTutorialShown
  const spyIsTutorialShown = spyOn<any>(component, 'isTutorialShown').and.callThrough();

  // Emetti evento con parametro
  component['tutorialService'].onTutorialChange.emit({ componentName: 'testComponent' });
  expect(spyIsTutorialShown).toHaveBeenCalledWith({ componentName: 'testComponent' });

  // Emetti evento senza parametro
  component['tutorialService'].onTutorialClose.emit();
  expect(spyIsTutorialShown).toHaveBeenCalledWith();
});
it('findTooltipById should find tooltip by id or return undefined', () => {
  const tooltipMock1 = { el: { nativeElement: { id: 'icon-1' } } };
  const tooltipMock2 = { el: { nativeElement: { id: 'icon-2' } } };

  // Simuliamo la QueryList di tooltips
  Object.defineProperty(component, 'tooltips', {
    get: () => ({
      find: (fn: (tooltip: any) => boolean) => {
        const list = [tooltipMock1, tooltipMock2];
        return list.find(fn);
      }
    }),
    configurable: true
  });

  expect((component as any).findTooltipById('1')).toBe(tooltipMock1);
  expect((component as any).findTooltipById('2')).toBe(tooltipMock2);
  expect((component as any).findTooltipById('3')).toBeUndefined();
});


});