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

    tutorialServiceSpy.getCachedTutorial.and.returnValue('false');
    tutorialServiceSpy.getSizeTutorial.and.returnValue(10);
    tutorialServiceSpy.nextTutorial.and.callFake((index) => {
      tutorialServiceSpy.onIndexTutorialChange.emit(index + 1);
      tutorialServiceSpy.onTutorialChange.emit({ componentName: 'Begin', text: 'Initial tutorial text' });
    });

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
    component['tutorialService'] = service; 

    fixture.detectChanges();
    tick(1);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the current tutorial index when setIndex is called', fakeAsync(() => {
    // The component's index should already be initialized from beforeEach due to nextTutorial(-1)
    // If nextTutorial(-1) resulted in index 0, then we can verify that first.
    // If the mock nextTutorial.and.callFake above emits index+1, then it would be 0.
    expect(component.indexCurrentTutorial).toBe(0); // Assuming nextTutorial(-1) leads to index 0

    component.setIndex(2); // Now test setting it to a new value
    fixture.detectChanges();
    tick();

    expect(component.indexCurrentTutorial).toBe(2);
  }));

  it('should show tutorial with correct values', fakeAsync(() => {
    // Initial state from beforeEach/nextTutorial(-1) should be "Begin"
    expect(component.tutorialText).toBe('Initial tutorial text');
    expect(component.isVisible).toBeTrue();
    expect(component.testo).toBe('Avanti');
    expect(component.backButtonDisabled).toBeTrue(); // 'Begin' means back button disabled

    const step = { componentName: 'SomeStep', text: 'Some custom tutorial text' };
    component.showTutorial(step);
    fixture.detectChanges();
    tick();

    expect(component.tutorialText).toBe('Some custom tutorial text');
    expect(component.isVisible).toBeTrue();
    expect(component.testo).toBe('Avanti');
    expect(component.backButtonDisabled).toBeFalse(); // Not 'Begin'
  }));

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


it('should call closeTutorialButton if getCachedTutorial returns "true"', fakeAsync(() => {
  spyOn(service, 'getCachedTutorial').and.returnValue('true');
  const spy = spyOn(component, 'closeTutorialButton');

  component.ngAfterViewInit();
  tick(); // simulo timeout

  expect(spy).toHaveBeenCalled();
}));

it('should call nextTutorial(-1) if getCachedTutorial is not "true"', fakeAsync(() => {
  spyOn(service, 'getCachedTutorial').and.returnValue(null);
  const spy = spyOn(service, 'nextTutorial');

  component.ngAfterViewInit();
  tick(); // simulo timeout

  expect(spy).toHaveBeenCalledWith(-1);
}));
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
it('should call closeTutorialButton when cached tutorial is true', fakeAsync(() => {
  spyOn(service, 'getCachedTutorial').and.returnValue('true');
  const closeSpy = spyOn(component, 'closeTutorialButton');
  component.ngAfterViewInit();
  tick(2); // prite 1ms timeout
  expect(closeSpy).toHaveBeenCalled();
}));


it('should call nextTutorial(-1) when no cached tutorial', fakeAsync(() => {
  spyOn(service, 'getCachedTutorial').and.returnValue(null); // ose 'false'
  const nextSpy = spyOn(service, 'nextTutorial');
  component.ngAfterViewInit();
  tick(2); // simulo setTimeout
  expect(nextSpy).toHaveBeenCalledWith(-1);
}));

it('should set backButtonDisabled to true when index is 0', () => {
  component.indexCurrentTutorial = 0;
  spyOn(service, 'previousTutorial');
  component.prevTutorialButton();
  expect(service.previousTutorial).toHaveBeenCalledWith(0);
  expect(component.backButtonDisabled).toBeTrue(); // kjo është degë më vete
});


});