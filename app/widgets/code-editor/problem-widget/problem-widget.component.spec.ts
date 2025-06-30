import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProblemWidgetComponent } from './problem-widget.component';
import { MessageService } from 'primeng/api';
import { ProjectManagerService } from '../../../services/project-manager-service/project-manager.service';
import { ApiService, ApiState } from '../../../services/api-service/api.service';
import { ProblemManagerService } from '../../../services/problem-manager-service/problem-manager.service';
import { ProblemDescriptor } from '../../../services/problem-manager-service/problem-manager.types';
import { EventEmitter, ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

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




});
