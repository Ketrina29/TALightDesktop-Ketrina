import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProblemWidgetComponent } from './problem-widget.component';
import { MessageService } from 'primeng/api';
import { ProjectManagerService } from '../../../services/project-manager-service/project-manager.service';
import { ApiService, ApiState } from '../../../services/api-service/api.service';
import { ProblemManagerService } from '../../../services/problem-manager-service/problem-manager.service';
import { ProblemDescriptor } from '../../../services/problem-manager-service/problem-manager.types';
import { EventEmitter, ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ProblemMenuEntry, ServiceMenuEntry } from './problem-widget.component'; 
import { AutoComplete } from 'primeng/autocomplete';
describe('ProblemWidgetComponent', () => {
  let component: ProblemWidgetComponent;
  let fixture: ComponentFixture<ProblemWidgetComponent>;

  let apiServiceMock: any;
  let projectManagerServiceMock: any;
  let pmMock: any;
  let messageServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = jasmine.createSpyObj('ApiService', ['getCurrentServerUrl', 'Connect', 'setUrl', 'sendMessage']);
    apiServiceMock.getCurrentServerUrl.and.returnValue('ws://mock.server');
    apiServiceMock.onApiStateChange = new EventEmitter<ApiState>();

    projectManagerServiceMock = jasmine.createSpyObj('ProjectManagerService', ['getCurrentProject', 'getCurrentDriver']);
    projectManagerServiceMock.getCurrentProject.and.returnValue({
      config: { TAL_SERVER: 'ws://mock.server', TAL_PROBLEM: '', TAL_SERVICE: '' },
      saveConfig: jasmine.createSpy('saveConfig'),
    });
    projectManagerServiceMock.getCurrentDriver.and.returnValue({
      exists: jasmine.createSpy('exists').and.resolveTo(true)
    });
    projectManagerServiceMock.currentProjectChanged = new EventEmitter<void>();

    pmMock = jasmine.createSpyObj('ProblemManagerService', ['updateProblems', 'selectProblem']);
    pmMock.onProblemsChanged = new EventEmitter<boolean>();
    pmMock.onError = new EventEmitter<void>();
    pmMock.onProblemSelected = new EventEmitter<void>();
    pmMock.onProblemsLoaded = new EventEmitter<void>();
    pmMock.problemList = [];
    pmMock.getCurrentProblem = jasmine.createSpy().and.returnValue(undefined);

    messageServiceMock = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      declarations: [ProblemWidgetComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ProjectManagerService, useValue: projectManagerServiceMock },
        { provide: ProblemManagerService, useValue: pmMock },
        { provide: MessageService, useValue: messageServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProblemWidgetComponent);
    component = fixture.componentInstance;

    // for statusDot
    component['statusDot'] = { nativeElement: document.createElement('div') } as ElementRef;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize url and lastUrl on ngOnInit', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.url).toBe('ws://mock.server');
    expect(component.lastUrl).toBe('ws://mock.server');
    expect(component.isBlurred).toBeTrue();
  }));

  it('should handle ApiState.Bad by setting isBlurred true', fakeAsync(() => {
    component.ngOnInit();
    apiServiceMock.onApiStateChange.emit(ApiState.Bad);
    tick();
    expect(component.isBlurred).toBeTrue();
  }));

  it('should call updateProblems on reloadProblemList()', fakeAsync(() => {
    component.reloadProblemList();
    tick();
    expect(pmMock.updateProblems).toHaveBeenCalled();
  }));

  it('should set url and lastUrl from project config on updateProblemInfo()', () => {
    component.url = 'old';
    (component as any).updateProblemInfo();
    expect(component.url).toBe('ws://mock.server');
    expect(component.lastUrl).toBe('ws://mock.server');
  });

  it('should call selectProblem on didSelectProblem()', async () => {
    const problem: ProblemDescriptor = {
      name: 'TestProblem',
      key: 'tp',
      services: new Map(),
      getKey() { return this.key; }
    };

    component.selectedProblem = problem;
    await component.didSelectProblem(problem);
    expect(pmMock.selectProblem).toHaveBeenCalledWith(problem);
  });
it('should call isTutorialShown when onTutorialClose is emitted', () => {
  spyOn(component as any, 'isTutorialShown');
  (component as any).tutorialService.onTutorialClose.emit();
  expect((component as any).isTutorialShown).toHaveBeenCalled();
});
it('should call isTutorialShown with tutorial when onTutorialChange is emitted', () => {
  spyOn(component as any, 'isTutorialShown');
  const mockTutorial = { name: 'MockTutorial' };
  (component as any).tutorialService.onTutorialChange.emit(mockTutorial);
  expect((component as any).isTutorialShown).toHaveBeenCalledWith(mockTutorial);
});

it('should call problemsDidChange when onProblemsChanged is emitted', () => {
  spyOn(component, 'problemsDidChange');
  (component as any).pm.onProblemsChanged.emit(true);
  expect(component.problemsDidChange).toHaveBeenCalledWith(true);
});
it('should call updateState when onApiStateChange is emitted', () => {
  spyOn(component, 'updateState');
  (component as any).api.onApiStateChange.emit(ApiState.Bad);
  expect(component.updateState).toHaveBeenCalledWith(ApiState.Bad);
});
it('should call stateBad when onError is emitted', () => {
  spyOn(component, 'stateBad');
  (component as any).pm.onError.emit('some error');
  expect(component.stateBad).toHaveBeenCalled();
});
it('should call updateProblemInfo when currentProjectChanged is emitted', () => {
  spyOn(component as any, 'updateProblemInfo');
  (component as any).pms.currentProjectChanged.emit();
  expect((component as any).updateProblemInfo).toHaveBeenCalled();
});


it('should call updateProjectConfigProblemServiceProblem when onProblemSelected is emitted', () => {
  spyOn(component as any, 'updateProjectConfigProblemServiceProblem');
  (component as any).pm.onProblemSelected.emit();
  expect((component as any).updateProjectConfigProblemServiceProblem).toHaveBeenCalled();
});
it('should update activeWidget when changeWidget is called', () => {
  (component as any).changeWidget({ index: 3 });
  expect((component as any).activeWidget).toBe(3);
});
it('should call changeURL and update TAL_SERVER in config on selectServerURL()', () => {
  const mockProject = projectManagerServiceMock.getCurrentProject();
  component.url = 'ws://new.server';
  
  // Spiojmë funksionin changeURL
  spyOn(component as any, 'changeURL');

  // Thirr metoda që testojmë
  component.selectServerURL();

  // Verifikojmë që changeURL u thirr
  expect((component as any).changeURL).toHaveBeenCalled();

  // Verifikojmë që TAL_SERVER u përditësua në projektin aktual
  expect(mockProject.config.TAL_SERVER).toBe('ws://new.server');

  // Verifikojmë që saveConfig u thirr me driverin aktual
  expect(mockProject.saveConfig).toHaveBeenCalledWith(projectManagerServiceMock.getCurrentDriver());
});

it('should update lastUrl when changeURL is called', () => {
  component.url = 'ws://changed.server';
  component.lastUrl = 'ws://old.server';

  (component as any).changeURL();

  expect(component.lastUrl).toBe('ws://changed.server');
});



it('should call updateState with ApiState.Bad on stateBad()', () => {
  spyOn(component, 'updateState');
  component.stateBad();
  expect(component.updateState).toHaveBeenCalledWith(ApiState.Bad);
});
describe('Menu Entry Classes', () => {
  it('should create a ServiceMenuEntry with defaults', () => {
    const descriptor = { name: 'Service1' } as any;
    const entry = new ServiceMenuEntry('Service1', descriptor);
    expect(entry.name).toBe('Service1');
    expect(entry.descriptor).toBe(descriptor);
  });

  it('should create a ProblemMenuEntry with defaults', () => {
    const descriptor = { name: 'Problem1' } as any;
    const entry = new ProblemMenuEntry('Problem1', descriptor);
    expect(entry.name).toBe('Problem1');
    expect(entry.descriptor).toBe(descriptor);
  });
});
describe('changeURL', () => {
  it('should return immediately if lastUrl equals url', () => {
    component.url = 'ws://same.url';
    component.lastUrl = 'ws://same.url';

    const stateIdleSpy = spyOn(component, 'stateIdle');
    component.changeURL();

    expect(stateIdleSpy).not.toHaveBeenCalled(); // sepse nuk duhet të thirret fare
  });

  it('should call stateBad if setUrl fails', () => {
    component.url = 'ws://new.url';
    component.lastUrl = 'ws://old.url';

    const dotDiv = document.createElement('div');
    component['statusDot'] = { nativeElement: dotDiv } as ElementRef;

    apiServiceMock.setUrl.and.returnValue(false);

    const stateIdleSpy = spyOn(component, 'stateIdle');
    const stateBadSpy = spyOn(component, 'stateBad');

    component.changeURL();

    expect(stateIdleSpy).toHaveBeenCalled();
    expect(stateBadSpy).toHaveBeenCalled();
  });

  it('should call stateMaybe and updateProblems if setUrl succeeds', () => {
  component.url = 'ws://new.server';
  component.lastUrl = 'ws://old.server';
  apiServiceMock.setUrl.and.returnValue(true);
  projectManagerServiceMock.getCurrentProject().config.TAL_SERVER = 'ws://project.server';

  const stateMaybeSpy = spyOn(component as any, 'stateMaybe');
  const updateProblemsSpy = spyOn((component as any).pm, 'updateProblems');

  (component as any).changeURL();

  expect(stateMaybeSpy).toHaveBeenCalled();
  expect(updateProblemsSpy).toHaveBeenCalled();
  expect(component.url).toBe('ws://project.server');
});

});
it('should call urlInput.writeValue with url if urlInput is defined', fakeAsync(() => {
  component['urlInput'] = {
  writeValue: jasmine.createSpy('writeValue')
} as unknown as AutoComplete;
  component.ngOnInit();
  tick();

  expect(component['urlInput'].writeValue).toHaveBeenCalledWith('ws://mock.server');
}));
describe('isTutorialShown', () => {
  it('should set isBlurred to false if tutorial is undefined', () => {
    (component as any).isTutorialShown(undefined);
    expect(component.isBlurred).toBeFalse();
  });

  it('should set isBlurred to false if tutorial.componentName equals class name', () => {
    const tutorial = { componentName: 'ProblemWidgetComponent' };
    (component as any).isTutorialShown(tutorial);
    expect(component.isBlurred).toBeFalse();
  });

  it('should set isBlurred to true if tutorial.componentName is different', () => {
    const tutorial = { componentName: 'OtherComponent' };
    (component as any).isTutorialShown(tutorial);
    expect(component.isBlurred).toBeTrue();
  });
});
it('should call updateProjectConfigProblemServiceProblem when onServiceSelected is emitted', () => {
  spyOn(component as any, 'updateProjectConfigProblemServiceProblem');
  (component as any).onServiceSelected.emit({ name: 'MockService' });
  expect((component as any).updateProjectConfigProblemServiceProblem).toHaveBeenCalled();
});
it('should call stateBad if api.setUrl returns false in changeURL', () => {
  component.url = 'ws://new.server';
  component.lastUrl = 'ws://old.server';
  spyOn(component as any, 'stateBad');
  spyOn(component as any, 'stateIdle');
  apiServiceMock.setUrl.and.returnValue(false);

  (component as any).changeURL();

  expect((component as any).stateIdle).toHaveBeenCalled();
  expect(apiServiceMock.setUrl).toHaveBeenCalledWith('ws://new.server');
  expect((component as any).stateBad).toHaveBeenCalled();
});
it('should set isBlurred false when tutorial is undefined', () => {
  (component as any).isTutorialShown(undefined);
  expect(component.isBlurred).toBeFalse();
});

it('should set isBlurred true when tutorial does not match component', () => {
  (component as any).isTutorialShown({ componentName: 'AnotherComponent' });
  expect(component.isBlurred).toBeTrue();
});
it('should handle changeURL correctly when url changes and setUrl fails', () => {
  component.url = 'ws://new.server';
  component.lastUrl = 'ws://old.server';
  apiServiceMock.setUrl.and.returnValue(false);

  const stateIdleSpy = spyOn(component as any, 'stateIdle');
  const stateBadSpy = spyOn(component as any, 'stateBad');
  const stateMaybeSpy = spyOn(component as any, 'stateMaybe');
  const updateProblemsSpy = spyOn((component as any).pm, 'updateProblems');

  (component as any).changeURL();

  expect(stateIdleSpy).toHaveBeenCalled();
  expect(apiServiceMock.setUrl).toHaveBeenCalledWith('ws://new.server');
  expect(stateBadSpy).toHaveBeenCalled();
  expect(stateMaybeSpy).not.toHaveBeenCalled();
  expect(updateProblemsSpy).not.toHaveBeenCalled();
});

it('should handle changeURL correctly when setUrl succeeds', () => {
  component.url = 'ws://new.server';
  component.lastUrl = 'ws://old.server';
  apiServiceMock.setUrl.and.returnValue(true);
  projectManagerServiceMock.getCurrentProject().config.TAL_SERVER = 'ws://project.server';

  const stateMaybeSpy = spyOn(component as any, 'stateMaybe');

  (component as any).changeURL();

  expect(component.url).toBe('ws://project.server');
  expect(stateMaybeSpy).toHaveBeenCalled();
});
it('should set isBlurred to false if tutorial is undefined', () => {
  (component as any).isTutorialShown(undefined);
  expect(component.isBlurred).toBeFalse();
});

it('should set isBlurred to false if tutorial matches component name', () => {
  const tutorial = { componentName: component.constructor.name };
  (component as any).isTutorialShown(tutorial);
  expect(component.isBlurred).toBeFalse();
});

it('should set isBlurred to true if tutorial is for another component', () => {
  const tutorial = { componentName: 'AnotherComponent' };
  (component as any).isTutorialShown(tutorial);
  expect(component.isBlurred).toBeTrue();
});


});
