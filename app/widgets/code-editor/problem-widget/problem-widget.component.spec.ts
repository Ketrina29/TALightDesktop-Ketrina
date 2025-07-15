import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProblemWidgetComponent } from './problem-widget.component';
import { MessageService } from 'primeng/api';
import { ProjectManagerService } from '../../../services/project-manager-service/project-manager.service';
import { ApiService, ApiState } from '../../../services/api-service/api.service';
import { ProblemManagerService } from '../../../services/problem-manager-service/problem-manager.service';
import { ArgDescriptor, FileDescriptor, ProblemDescriptor, ServiceDescriptor } from '../../../services/problem-manager-service/problem-manager.types';
import { EventEmitter, ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectDriver, ProjectEnvironment, ProjectLanguage, ProjectConfig } from '../../../services/project-manager-service/project-manager.types';
import { ProblemMenuEntry, ServiceMenuEntry } from './problem-widget.component'; 
import { AutoComplete } from 'primeng/autocomplete';
const completeMockProject: Partial<ProjectEnvironment> & { config: Partial<ProjectConfig> } = {
  config: {
    TAL_PROBLEM: '',
    TAL_SERVICE: '',
    TAL_SERVER: '',
    RUN: '',
    DEBUG: false,
    PROJECT_NAME: '',
    PREFERED_LANG: '',
    TAL_SERVERS: [],
    TAL_TOKEN: '',
    DIR_PROJECT: '',
    DIR_ATTACHMENTS: '',
    DIR_RESULTS: '',
    DIR_ARGSFILE: '',
    DIR_EXAMPLES: '',
    CREATE_EXAMPLES: false,
    HOTKEY_RUN: { Control: false, Alt: false, Shift: false, Key: '' },
    HOTKEY_TEST: { Control: false, Alt: false, Shift: false, Key: '' },
    HOTKEY_SAVE: { Control: false, Alt: false, Shift: false, Key: '' },
    HOTKEY_EXPORT: { Control: false, Alt: false, Shift: false, Key: '' },
    CONFIG_NAME: '',
    CONFIG_PATH: '',
    EXTRA_PACKAGES: [],
    save: () => Promise.resolve(true),
    isDefaultProjectName: () => false,
  },
  saveConfig: jasmine.createSpy('saveConfig').and.returnValue(Promise.resolve(true)),
  language: ProjectLanguage.PY,
  onLoaded: new EventEmitter<void>(),
  isLoaded: false,
  files: [],
};
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
      saveConfig: jasmine.createSpy('saveConfig').and.returnValue(Promise.resolve(true)),
    });
    projectManagerServiceMock.getCurrentDriver.and.returnValue({} as ProjectDriver);
    projectManagerServiceMock.currentProjectChanged = new EventEmitter<void>();

   pmMock = jasmine.createSpyObj('ProblemManagerService', [
  'updateProblems',
  'selectProblem',
  'selectService',
  'getCurrentProblem',
  'getProblems',
  'validateArg' 
]);

    pmMock.onProblemsChanged = new EventEmitter<boolean>();
    pmMock.onError = new EventEmitter<void>();
    pmMock.onProblemSelected = new EventEmitter<void>();
    pmMock.onProblemsLoaded = new EventEmitter<void>();
    pmMock.problemList = [];
    pmMock.getCurrentProblem.and.returnValue(undefined);

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

  // Test base component
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

  // Tutorial events
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

  // Event subscription triggers
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

 

  it('should call changeURL and update TAL_SERVER in config on selectServerURL()', () => {
    const mockProject = projectManagerServiceMock.getCurrentProject();
    component.url = 'ws://new.server';
    
    spyOn(component as any, 'changeURL');

    component.selectServerURL();

    expect((component as any).changeURL).toHaveBeenCalled();
    expect(mockProject.config.TAL_SERVER).toBe('ws://new.server');
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

  // Menu Entry Classes tests
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

      expect(stateIdleSpy).not.toHaveBeenCalled();
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

  it('should set isBlurred false when tutorial is undefined', () => {
    (component as any).isTutorialShown(undefined);
    expect(component.isBlurred).toBeFalse();
  });

  it('should set isBlurred true when tutorial componentName differs', () => {
    (component as any).isTutorialShown({ componentName: 'OtherComponent' });
    expect(component.isBlurred).toBeTrue();
  });
it('fileDidChange sets dropdown color to green if path exists', async () => {
  const file = { key: 'key1' } as FileDescriptor;
  const event = { originalEvent: new Event('change'), value: '/valid/path' };

  const dropdown = document.createElement('div');
  spyOn(document, 'getElementById').and.returnValue(dropdown);

  const driverMock = {
    exists: jasmine.createSpy().and.resolveTo(true)
  } as unknown as ProjectDriver;

  projectManagerServiceMock.getCurrentDriver.and.returnValue(driverMock); // ✅ saktë

  await component.fileDidChange(file, event);
  expect(dropdown.style.color).toBe('green');
});

  it('fileDidChange sets dropdown color to red if path does not exist', async () => {
  const file = { key: 'key2' } as FileDescriptor;

  // ✅ event duhet të ketë originalEvent dhe value
  const event = { originalEvent: new Event('change'), value: '/invalid/path' };

  // ✅ dropdown false for DOM
  const dropdown = document.createElement('div');
  dropdown.style.color = '';

  const driverMock = {
    exists: jasmine.createSpy().and.resolveTo(false)
  } as unknown as ProjectDriver;

  // ✅ mock for DOM
  spyOn(document, 'getElementById').and.returnValue(dropdown);
  // ✅ mock for driver
  spyOn(component.pms, 'getCurrentDriver').and.returnValue(driverMock);

  await component.fileDidChange(file, event);

  expect(dropdown.style.color).toBe('red');
});


  it('clearProblems resets selectedProblem and clears problems array', () => {
    component.selectedProblem = {} as ProblemDescriptor;
    component.problems = [{}];
    component.clearProblems();
    expect(component.selectedProblem).toBeUndefined();
    expect(component.problems.length).toBe(0);
  });

  it('updateState sets statusDot color correctly', () => {
    const nativeElement = document.createElement('div');
    component.statusDot = { nativeElement } as ElementRef;

    component.updateState(ApiState.Idle);
    expect(nativeElement.style.color).toBe('');

    component.updateState(ApiState.Good);
    expect(nativeElement.style.color).toBe('green');

    component.updateState(ApiState.Maybe);
    expect(nativeElement.style.color).toBe('orange');

    component.updateState(ApiState.Bad);
    expect(nativeElement.style.color).toBe('darkred');
  });

  it('disconnect should close websocket if exists', () => {
    component.websocket = { close: jasmine.createSpy('close') } as any;
    component.disconnect();
    expect(component.websocket?.close).toHaveBeenCalled();
  });

  it('disconnect should do nothing if websocket undefined', () => {
    component.websocket = undefined;
    component.disconnect();
    expect(component.websocket).toBeUndefined();
  });
  it('should reset arg to default and validate', async () => {
  const arg = { key: 'testArg', default: '42', value: '' } as ArgDescriptor;
  const event = new Event('reset');
  spyOn(component, 'argDidChange');

  await component.argDidReset(arg, event);
  expect(arg.value).toBe('42');
  expect(component.argDidChange).toHaveBeenCalledWith(arg, event);
});it('should reset file and call refreshFilePathList', async () => {
  const file = { key: 'resetKey', value: 'some.txt' } as FileDescriptor;
  const event = new Event('reset');

  const dropdown = document.createElement('div');
  (dropdown as any).clear = jasmine.createSpy('clear');

  spyOn(document, 'getElementById').and.returnValue(dropdown);
  spyOn(component, 'refreshFilePathList');

  await component.fileDidReset(file, event);

  expect((dropdown as any).clear).toHaveBeenCalledWith(event);
  expect(file.value).toBe('');
  expect(component.refreshFilePathList).toHaveBeenCalled();
});
it('should remove slashes and anchors from regex', () => {
  const input = /^abc$/;
  const result = (component as any).clenupRegex(input);
  expect(result).toBe('abc');
});

it('should replace | with OR', () => {
  const input = /(yes|no)/;
  const result = (component as any).clenupRegex(input);
  expect(result).toBe('yes OR no');
});

it('should remove parenthesis', () => {
  const input = /(abc)/;
  const result = (component as any).clenupRegex(input);
  expect(result).toBe('abc');
});

it('should combine all cleanup operations', () => {
  const input = /^((yes|no|maybe))$/;
  const result = (component as any).clenupRegex(input);
  expect(result).toBe('yes OR no OR maybe');
});

it('should load problem and update service info when TAL_PROBLEM matches', () => {
  const matchingProblem = { name: 'MatchMe', services: new Map() } as ProblemDescriptor;
  const nonMatchingProblem = { name: 'Other', services: new Map() } as ProblemDescriptor;

  const problems = [nonMatchingProblem, matchingProblem];
  pmMock.getProblems.and.returnValue(problems);

  const project = projectManagerServiceMock.getCurrentProject();
  project.config.TAL_PROBLEM = 'MatchMe';

  const updateServiceInfoSpy = spyOn<any>(component, 'updateServiceInfo');

  // directly call private method with 'as any'
  (component as any).loadProblemServiceConfig();

  expect(component.selectedProblem).toBe(matchingProblem);
  expect(updateServiceInfoSpy).toHaveBeenCalledWith(matchingProblem);
});
it('should clear TAL_PROBLEM and TAL_SERVICE if no problem is selected', async () => {
  component.selectedProblem = undefined;
  component.selectedService = undefined;
  component.url = 'ws://test.server';

  const project = projectManagerServiceMock.getCurrentProject();
  const saveSpy = project.saveConfig;

  await (component as any).updateProjectConfigProblemServiceProblem();

  expect(project.config.TAL_PROBLEM).toBe('');
  expect(project.config.TAL_SERVICE).toBe('');
  expect(project.config.TAL_SERVER).toBe('ws://test.server');
  expect(saveSpy).toHaveBeenCalledWith(projectManagerServiceMock.getCurrentDriver());
});

it('should set TAL_PROBLEM and TAL_SERVICE if both are selected', async () => {
  component.selectedProblem = { name: 'MyProblem' } as ProblemDescriptor;
  component.selectedService = { name: 'MyService' } as ServiceDescriptor;
  component.url = 'ws://test.server';

  const project = projectManagerServiceMock.getCurrentProject();
  const saveSpy = project.saveConfig;

  await (component as any).updateProjectConfigProblemServiceProblem();

  expect(project.config.TAL_PROBLEM).toBe('MyProblem');
  expect(project.config.TAL_SERVICE).toBe('MyService');
  expect(project.config.TAL_SERVER).toBe('ws://test.server');
  expect(saveSpy).toHaveBeenCalledWith(projectManagerServiceMock.getCurrentDriver());
});

it('should select service and emit with args and files', async () => {
  const service = { name: 'test', args: {}, files: {} } as ServiceDescriptor;
  component.selectedService = service;

  spyOn(component.onServiceSelected, 'emit'); 

  await component.didSelectService();

  expect(pmMock.selectService).toHaveBeenCalledWith(service);
  expect(component.selectedArgs).toEqual(service.args);
  expect(component.selectedFiles).toEqual(service.files);
  expect(component.onServiceSelected.emit).toHaveBeenCalledWith(service);
});
it('should clean up regex string removing delimiters and formatting', () => {
  const input = /^(\d+|\w+)$/;
  const result = (component as any).clenupRegex(input);
  expect(result).toBe('\\d+ OR \\w+');
});

it('should cleanup name by replacing separators and capitalizing first letter', () => {
  const result = (component as any).cleanupName('some_test.name-value');
  expect(result).toBe('Some test name value');
});
it('should return readable regex with valid content in brackets', () => {
  const result = (component as any).readableRegex(/[abc]/);
  expect(result).toBe('valid(abc)');
});

it('should return readable regex with invalid content in brackets', () => {
  const result = (component as any).readableRegex(/[^xyz]/);
  expect(result).toBe('invalid(xyz)');
});


it('should return readable regex with ORs for grouped expressions', () => {
  const input = /(yes|no|maybe)/;
  const result = (component as any).readableRegex(input);
  expect(result).toBe('yes OR no OR maybe');
});

it('should show regex panel and set color on argDidFocus when red', async () => {
  const arg = { key: 'myArg' } as ArgDescriptor;
  const panel = document.createElement('div');
  const regex = document.createElement('div');
  regex.style.color = 'red';

  spyOn(document, 'getElementById').and.callFake((id: string) => {
    if (id === 'args-regex-panel-myArg') return panel;
    if (id === 'args-regex-myArg') return regex;
    return null;
  });

  await (component as any).argDidFocus(arg, new Event('focus'));

  expect(panel.style.display).toBe('flex');
  expect(regex.style.color).toBe('orange');
});

it('should reset color if not red in argDidFocus', async () => {
  const arg = { key: 'myArg' } as ArgDescriptor;
  const panel = document.createElement('div');
  const regex = document.createElement('div');
  regex.style.color = '';

  spyOn(document, 'getElementById').and.callFake((id: string) => {
    if (id === 'args-regex-panel-myArg') return panel;
    if (id === 'args-regex-myArg') return regex;
    return null;
  });

  await (component as any).argDidFocus(arg, new Event('focus'));

  expect(panel.style.display).toBe('flex');
  expect(regex.style.color).toBe('');
});
it('argDidChange sets regex color to red if there are validation issues', async () => {
  const arg = { key: 'arg1', value: 'invalid', default: 'default' } as ArgDescriptor;

  const panel = document.createElement('div');
  const regex = document.createElement('div');

  spyOn(document, 'getElementById').and.callFake((id: string) => {
    if (id === 'args-regex-panel-arg1') return panel;
    if (id === 'args-regex-arg1') return regex;
    return null;
  });

  pmMock.validateArg.and.returnValue(['error']);

  await (component as any).argDidChange(arg, new Event('change'));

  expect(regex.style.color).toBe('red');
  expect(panel.style.display).toBe('flex');
});
it('argDidChange sets regex color to green if value differs from default', async () => {
  const arg = { key: 'arg2', value: 'custom', default: 'default' } as ArgDescriptor;

  const panel = document.createElement('div');
  const regex = document.createElement('div');

  spyOn(document, 'getElementById').and.callFake((id: string) => {
    if (id === 'args-regex-panel-arg2') return panel;
    if (id === 'args-regex-arg2') return regex;
    return null;
  });

  pmMock.validateArg.and.returnValue(null); // no issues

  await (component as any).argDidChange(arg, new Event('change'));

  expect(regex.style.color).toBe('green');
  expect(panel.style.display).toBe('flex');
});
it('argDidChange clears color if value equals default and no issues', async () => {
  const arg = { key: 'arg3', value: 'same', default: 'same' } as ArgDescriptor;

  const panel = document.createElement('div');
  const regex = document.createElement('div');

  spyOn(document, 'getElementById').and.callFake((id: string) => {
    if (id === 'args-regex-panel-arg3') return panel;
    if (id === 'args-regex-arg3') return regex;
    return null;
  });

  pmMock.validateArg.and.returnValue(null); // no issues

  await (component as any).argDidChange(arg, new Event('change'));

  expect(regex.style.color).toBe('');
  expect(panel.style.display).toBe('none');
});

it('should set loading to true and return immediately when clear is true', async () => {
  component.loading = false;
  component.problemsMenu = [{} as any];
  component.servicesMenu = [{} as any];

  await component.problemsDidChange(true);

  expect(component.loading).toBeTrue();
  expect(component.problemsMenu.length).toBe(0);
  expect(component.servicesMenu.length).toBe(0);
});

it('should populate problemsMenu when clear is false', async () => {
  const problemA = { name: 'Alpha' } as ProblemDescriptor;
  const problemB = { name: 'Beta' } as ProblemDescriptor;

  (component as any).pm.problemList = [problemB, problemA];

  const emitSpy = spyOn(component.onProblemListChanged, 'emit');

  await component.problemsDidChange(false);

  expect(component.problemsMenu.length).toBe(2);
  expect(component.problemsMenu[0].name).toBe('Alpha'); // checks sort
  expect(component.loading).toBeFalse();
  expect(emitSpy).toHaveBeenCalled();
});
it('should log API error in onApiError', async () => {
  const consoleSpy = spyOn(console, 'log');
  const message = 'Connection failed';
  await component.onApiError(message);
  expect(consoleSpy).toHaveBeenCalledWith('API Error: ', message);
});
it('should call updateState with ApiState.Good when stateGood is called', () => {
  const spy = spyOn(component, 'updateState');
  component.stateGood();
  expect(spy).toHaveBeenCalledWith(ApiState.Good);
});

it('should call updateState with ApiState.Maybe when stateMaybe is called', () => {
  const spy = spyOn(component, 'updateState');
  component.stateMaybe();
  expect(spy).toHaveBeenCalledWith(ApiState.Maybe);
});
it('should call pm.validateArgs if selectedService exists', async () => {
  const service = { name: 'testService' } as ServiceDescriptor;
  component.selectedService = service;

  const errorMap = new Map<string, any>([['arg1', 'invalid']]);

  spyOn(component.pm, 'validateArgs').and.returnValue(await Promise.resolve(errorMap));

  const result = await component.validateArgs();
  expect(component.pm.validateArgs).toHaveBeenCalledWith(service);
  expect(result).toEqual(errorMap);
});


it('should return undefined if selectedService does not exist', async () => {
  component.selectedService = undefined;
  const result = await component.validateArgs();
  expect(result).toBeUndefined();
});


it('should return null if selectedService does not exist', () => {
  component.selectedService = undefined;
  const result = component.validateArgs();
  expect(result).toBeNull();
});
it('should switch from simple to raw format in toggleRegexFormat', () => {
  const arg = { key: 'myArg', regex: /abc/ } as ArgDescriptor;
  const div = document.createElement('div');
  div.classList.add('format-regex-simple');
  div.innerText = '';

  spyOn(document, 'getElementById').and.returnValue(div);

  (component as any).toggleRegexFormat(arg, new Event('click'));

  expect(div.classList.contains('format-regex-simple')).toBeFalse();
  expect(div.innerText).toBe(arg.regex + '');
});

it('should switch from raw to simple format in toggleRegexFormat', () => {
  const arg = { key: 'myArg', regex: /abc|def/ } as ArgDescriptor;
  const div = document.createElement('div');
  div.innerText = '';
  spyOn(document, 'getElementById').and.returnValue(div);

  (component as any).toggleRegexFormat(arg, new Event('click'));

  expect(div.classList.contains('format-regex-simple')).toBeTrue();
  expect(div.innerText).toContain(' OR ');
});
it('should emit onProblemSelected on selectProblem', () => {
  const problem = { name: 'test' } as ProblemDescriptor;
  spyOn(component.onProblemSelected, 'emit');

  component.selectProblem(problem);
  expect(component.selectedProblem).toBe(problem);
  expect(component.onProblemSelected.emit).toHaveBeenCalledWith(problem);
});

it('should log warning and add error message when selectedProblem is undefined in apiDownloadAttachment', async () => {
  component.selectedProblem = undefined;
  const logSpy = spyOn(console, 'log');
  await component.apiDownloadAttachment();
  expect(logSpy).toHaveBeenCalled();
  expect(messageServiceMock.add).toHaveBeenCalled();
});

});

