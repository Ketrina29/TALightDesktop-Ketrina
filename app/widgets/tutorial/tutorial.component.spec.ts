import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TutorialComponent } from './tutorial.component';
import { TutorialService } from '../../services/tutorial-service/tutorial.service';
import { EventEmitter } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TutorialComponent', () => {
  let component: TutorialComponent;
  let fixture: ComponentFixture<TutorialComponent>;
  let service: jasmine.SpyObj<TutorialService>;

  beforeEach(fakeAsync(async () => {
  const tutorialServiceSpy = jasmine.createSpyObj<TutorialService>(
    'TutorialService',
    ['closeTutorial', 'nextTutorial', 'previousTutorial', 'getCachedTutorial', 'getSizeTutorial']
  );

  Object.defineProperty(tutorialServiceSpy, 'onIndexTutorialChange', {
    value: new EventEmitter<number>(),
    writable: true,
  });
  Object.defineProperty(tutorialServiceSpy, 'onTutorialChange', {
    value: new EventEmitter<any>(),
    writable: true,
  });
  Object.defineProperty(tutorialServiceSpy, 'onTutorialClose', {
    value: new EventEmitter<void>(),
    writable: true,
  });

  // Default returns
  tutorialServiceSpy.getCachedTutorial.and.returnValue('false');
  tutorialServiceSpy.getSizeTutorial.and.returnValue(10);
  tutorialServiceSpy.nextTutorial.and.stub(); // Nuk bën asgjë, thjesht regjistron thirrjen
  tutorialServiceSpy.previousTutorial.and.stub();
  tutorialServiceSpy.closeTutorial.and.stub();

  await TestBed.configureTestingModule({
    declarations: [TutorialComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [
      DropdownModule,
      HttpClientTestingModule,
      FormsModule,
    ],
    providers: [{ provide: TutorialService, useValue: tutorialServiceSpy }],
  }).compileComponents();

  fixture = TestBed.createComponent(TutorialComponent);
  component = fixture.componentInstance;
  service = TestBed.inject(TutorialService) as jasmine.SpyObj<TutorialService>;

  fixture.detectChanges();
  tick(1);
}));

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should show Fine when step is End', fakeAsync(() => {
    const step = { componentName: 'End', text: 'End of tutorial' };
    component.showTutorial(step);
    fixture.detectChanges();
    tick();

    expect(component.testo).toBe('Fine');
  }));
it('should subscribe to onIndexTutorialChange and call setIndex()', () => {
  const spy = spyOn(component, 'setIndex');
  (service.onIndexTutorialChange as EventEmitter<number>).emit(3);
  expect(spy).toHaveBeenCalledWith(3);
});

it('should subscribe to onTutorialChange and call showTutorial()', () => {
  const spy = spyOn(component, 'showTutorial');
  const tutorialStep = { componentName: 'Mid', text: 'Go here' };
  (service.onTutorialChange as EventEmitter<any>).emit(tutorialStep);
  expect(spy).toHaveBeenCalledWith(tutorialStep);
});

it('should subscribe to onTutorialClose and call closeTutorial()', () => {
  const spy = spyOn(component, 'closeTutorial');
  (service.onTutorialClose as EventEmitter<void>).emit();
  expect(spy).toHaveBeenCalled();
});


it('should update indexCurrentTutorial on setIndex()', () => {
  component.setIndex(7);
  expect(component.indexCurrentTutorial).toBe(7);
});

it('should update fields correctly in showTutorial()', () => {
  const step = { componentName: 'Mid', text: 'Keep going' };
  component.showTutorial(step);
  expect(component.tutorialText).toBe('Keep going');
  expect(component.isVisible).toBeTrue();
  expect(component.testo).toBe('Avanti');
  expect(component.backButtonDisabled).toBeFalse();
});

it('should update testo and backButtonDisabled for End and Begin steps', () => {
  component.showTutorial({ componentName: 'End', text: 'Finish' });
  expect(component.testo).toBe('Fine');

  component.showTutorial({ componentName: 'Begin', text: 'Start' });
  expect(component.backButtonDisabled).toBeTrue();
});
it('should set isVisible to false on closeTutorial()', () => {
  component.isVisible = true;
  component.closeTutorial();
  expect(component.isVisible).toBeFalse();
});
it('should set testo to "Fine" when componentName is "End"', () => {
  component.showTutorial({ componentName: 'End', text: 'Done' });
  expect(component.testo).toBe('Fine');
});

it('should disable backButton when componentName is "Begin"', () => {
  component.showTutorial({ componentName: 'Begin', text: 'Start' });
  expect(component.backButtonDisabled).toBeTrue();
});

it('should call closeTutorialButton if getCachedTutorial returns "true"', fakeAsync(() => {
  service.getCachedTutorial.and.returnValue('true');
  const closeSpy = spyOn(component, 'closeTutorialButton').and.callThrough();

  component.ngAfterViewInit();
  tick(2);

  expect(closeSpy).toHaveBeenCalled();
}));

it('should call nextTutorial(-1) if getCachedTutorial is not "true"', fakeAsync(() => {
  service.getCachedTutorial.and.returnValue('false');
  component.indexCurrentTutorial = -1;

  component.ngAfterViewInit();
  tick(2);

  expect(service.nextTutorial).toHaveBeenCalledWith(-1);
}));
it('should call nextTutorial(-1) when no cached tutorial', fakeAsync(() => {
  service.getCachedTutorial.and.returnValue(null);
  component.indexCurrentTutorial = -1;

  component.ngAfterViewInit();
  tick(2);

  expect(service.nextTutorial).toHaveBeenCalledWith(-1);
}));
it('should set the current tutorial index when setIndex is called', () => {
  expect(component.indexCurrentTutorial).toBe(-1); // fillimisht
  component.setIndex(3);
  expect(component.indexCurrentTutorial).toBe(3);
});
it('should show tutorial with correct values', () => {
  const step = { componentName: 'Mid', text: 'Hello Tutorial' };
  component.showTutorial(step);

  expect(component.tutorialText).toBe('Hello Tutorial');
  expect(component.isVisible).toBeTrue();
  expect(component.testo).toBe('Avanti');
  expect(component.backButtonDisabled).toBeFalse();
});
it('should call nextTutorial if indexCurrentTutorial is less than last index', () => {
  component.indexCurrentTutorial = 3; // < 9 (getSizeTutorial = 10)
  component.nextTutorialButton();
  expect(service.nextTutorial).toHaveBeenCalledWith(3);
});
it('should call closeTutorial if indexCurrentTutorial is last index', () => {
  component.indexCurrentTutorial = 9; // getSizeTutorial = 10
  component.nextTutorialButton();
  expect(service.closeTutorial).toHaveBeenCalled();
});
it('should call previousTutorial and not disable back button if index > 0', () => {
  component.indexCurrentTutorial = 2;
  component.backButtonDisabled = true; // fillimisht true për të vërtetuar që ndryshon

  component.prevTutorialButton();

  expect(service.previousTutorial).toHaveBeenCalledWith(2);
  expect(component.backButtonDisabled).toBeFalse(); // kjo do të dështojë nëse nuk ndryshohet manualisht
});

it('should disable back button when index is 0', () => {
  component.indexCurrentTutorial = 0;
  component.prevTutorialButton();
  expect(service.previousTutorial).toHaveBeenCalledWith(0);
  expect(component.backButtonDisabled).toBeTrue();
});

});