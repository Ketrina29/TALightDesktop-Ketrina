import { TestBed } from '@angular/core/testing';
import { TutorialService } from './tutorial.service';

describe('TutorialService', () => {
  let service: TutorialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TutorialService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit next tutorial and index', (done: DoneFn) => {
    let stepReceived = false;
    let indexReceived = false;

    service.onTutorialChange.subscribe((step) => {
      expect(step.componentName).toBe('TopbarWidgetComponent');
      stepReceived = true;
      if (stepReceived && indexReceived) done();
    });

    service.onIndexTutorialChange.subscribe((index: number | null) => {
      expect(index).not.toBeNull();
      if (index !== null) {
        expect(index).toEqual(1);
      }
      indexReceived = true;
      if (stepReceived && indexReceived) done();
    });

    service.nextTutorial(0);
  });

  it('should emit previous tutorial and index', (done: DoneFn) => {
    let stepReceived = false;
    let indexReceived = false;

    service.onTutorialChange.subscribe((step) => {
      expect(step.componentName).toBe('Begin');
      stepReceived = true;
      if (stepReceived && indexReceived) done();
    });

    service.onIndexTutorialChange.subscribe((index: number | null) => {
      expect(index).not.toBeNull();
      if (index !== null) {
        expect(index).toEqual(0);
      }
      indexReceived = true;
      if (stepReceived && indexReceived) done();
    });

    service.previousTutorial(1);
  });

  it('should not go previous if at beginning', () => {
    spyOn(console, 'log');
    service.previousTutorial(0);
    expect(console.log).toHaveBeenCalledWith('Impossibile andare indietro');
  });

  it('should emit onTutorialClose and set localStorage', () => {
    spyOn(service.onTutorialClose, 'emit');
    service.closeTutorial();
    expect(service.onTutorialClose.emit).toHaveBeenCalled();
    expect(localStorage.getItem('tutorialCached')).toBe('true');
  });

  it('should return cached tutorial value from localStorage', () => {
    localStorage.setItem('tutorialCached', 'true');
    const result = service.getCachedTutorial();
    expect(result).toBe('true');
  });

  it('should return the size of the tutorial list', () => {
    const size = service.getSizeTutorial();
    expect(size).toBe(10);
  });

  it('should return the correct size of tutorials', () => {
    expect(service.getSizeTutorial()).toBeGreaterThan(0);
  });

  it('should emit next tutorial and index when nextTutorial is called with valid index', () => {
    let receivedTutorial: any = null;
    let receivedIndex: number | null = null;

    service.onTutorialChange.subscribe((tut) => receivedTutorial = tut);
    service.onIndexTutorialChange.subscribe((idx) => receivedIndex = idx);

    service.nextTutorial(0);

    expect(receivedTutorial).toBeTruthy();
    expect(receivedTutorial.componentName).toBe("TopbarWidgetComponent");
    expect(receivedIndex).not.toBeNull();
    if (receivedIndex !== null) {
      expect(receivedIndex).toEqual(1);
    }
  });

  it('should emit previous tutorial and index when previousTutorial is called with valid index', () => {
    let receivedTutorial: any = null;
    let receivedIndex: number | null = null;

    service.onTutorialChange.subscribe((tut) => receivedTutorial = tut);
    service.onIndexTutorialChange.subscribe((idx) => receivedIndex = idx);

    service.previousTutorial(2);

    expect(receivedTutorial).toBeTruthy();
    expect(receivedIndex).not.toBeNull();
    if (receivedIndex !== null) {
      expect(receivedIndex).toEqual(1);
    }
  });

  it('should emit close tutorial event', (done: DoneFn) => {
    localStorage.removeItem('tutorialCached');
    service.onTutorialClose.subscribe(() => {
      const cached = localStorage.getItem('tutorialCached');
      expect(cached).toBe('true');
      done();
    });
    service.closeTutorial();
  });
  it('should not emit next tutorial if index is out of bounds', () => {
  const spyTutorial = jasmine.createSpy();
  service.onTutorialChange.subscribe(spyTutorial);

  service.nextTutorial(999); // passing the list
  expect(spyTutorial).not.toHaveBeenCalled();
});
it('should close tutorial if nextTutorial is called with index out of bounds', () => {
  spyOn(service, 'closeTutorial');
  service.nextTutorial(99); // passing
  expect(service.closeTutorial).toHaveBeenCalled();
});

it('should not emit if previousTutorial is called with index 0', () => {
  const spy = jasmine.createSpy();
  service.onTutorialChange.subscribe(spy);
  service.onIndexTutorialChange.subscribe(spy);

  service.previousTutorial(0);

  expect(spy).not.toHaveBeenCalled();
});

it('should throw error if showTutorial is called', () => {
  expect(() => service.showTutorial()).toThrowError('Method not implemented.');
});

});
