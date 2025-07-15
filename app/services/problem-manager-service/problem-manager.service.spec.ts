import { ProblemManagerService } from './problem-manager.service';

import { ApiService } from '../api-service/api.service';
import { ProjectManagerService } from '../project-manager-service/project-manager.service';
import { ProblemDescriptor, ServiceDescriptor, ArgDescriptor, ProblemMap } from './problem-manager.types';
import { of, throwError } from 'rxjs';
import { Packets } from '../api-service/api.packets';
import { Meta } from '../api-service/api.service';
import { Commands } from '../../services/api-service/api.commands';
import { fakeAsync, tick } from '@angular/core/testing';


class MockProblemList extends Commands.ProblemList {
  constructor() {
    super('ws://mock'); // url could be a placeholder

    this.onError = () => {};
    this.onClose = () => {};
    this.onRecive = () => {};
    this.onReciveBinary = () => {};
    this.onReciveUndecodedBinary = () => {};
  }
}

describe('ProblemManagerService', () => {
  let service: ProblemManagerService;
  let apiMock: jasmine.SpyObj<ApiService>;
  let projectMock: any;

  beforeEach(() => {
  apiMock = jasmine.createSpyObj<ApiService>('ApiService', ['problemList']);

  const saveConfigSpy = jasmine.createSpy('saveConfig');

  projectMock = {
    getCurrentProject: () => ({
      config: { TAL_PROBLEM: '', TAL_SERVICE: '', EXTRA_PACKAGES: [] },
      saveConfig: saveConfigSpy
    }),
    getCurrentDriver: () => ({})
  };

  service = new ProblemManagerService(apiMock, projectMock as any);
});
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty problem list by default', () => {
    expect(service.getProblems().length).toBe(0);
  });

 it('should emit selected problem and update config', () => {
 
  const currentProject = projectMock.getCurrentProject();
  currentProject.config.TAL_PROBLEM = '';
  currentProject.config.TAL_SERVICE = '';
  const configSpy = currentProject.saveConfig;


  const mockServices = new Map<string, Packets.Service>([
    ['mockService', {
      evaluator: ['eval.py'],
      args: new Map(),
      files: []
    }]
  ]);

  const mockMeta: Meta = {
    services: mockServices,
    public_folder: ''
  };
  const mockProblem = new ProblemDescriptor('', mockMeta);

  spyOn(service.onProblemSelected, 'emit');

  service.selectProblem(mockProblem);

  expect(service.onProblemSelected.emit).toHaveBeenCalledWith(mockProblem);
  expect(currentProject.config.TAL_PROBLEM).toBe(mockProblem.key);
  expect(currentProject.config.TAL_SERVICE).toBe('');
  expect(configSpy).toHaveBeenCalledWith(projectMock.getCurrentDriver());
});

it('should validate correct argument', () => {
  const parent = {
    getKey: () => 'mockParentKey'
  } as ServiceDescriptor;

  const arg = new ArgDescriptor('arg1', {
    default: 'test',
    regex: /test/
  } as any, parent);

  arg.value = 'test';

  const result = service.validateArg(arg);
  expect(result).toBeNull();
});

it('should detect invalid argument value', () => {
  const parent = {
    getKey: () => 'mockParentKey'
  } as ServiceDescriptor;

  const arg = new ArgDescriptor('arg2', {
    default: '123',
    regex: /^\d+$/
  } as any, parent);

  arg.value = 'abc';

  const result = service.validateArg(arg);
  expect(result).toContain('Validation error');
});

  it('should update problems successfully on API call', (done) => {
    const mockServicePacket: Packets.Service = {
      evaluator: ['eval.py'],
      args: new Map([
        ['arg1', { default: 'def1', regex: /.*/ }],
      ]),
      files: ['file1.txt']
    };
    const mockProblemPacket: Meta = {
      services: new Map([
        ['service1', mockServicePacket]
      ]),
      public_folder: 'public'
    };
    const problemMap = new Map<string, Meta>([
      ['problem-one', mockProblemPacket]
    ]);

    apiMock.problemList.and.callFake((callback) => {
      callback(problemMap);
      return { onError: (err: any) => {}, didReciveHandshake: true, didRecive: true, didReciveProblemList: true, tal: '' } as any;
    });

    spyOn(service.onProblemsChanged, 'emit');
    spyOn(service.onProblemsLoaded, 'emit');

    service.updateProblems();

    expect(service.onProblemsChanged.emit).toHaveBeenCalledWith(true);
    expect(service.problemList.length).toBe(1);
    expect(service.problems.has('problem-one')).toBeTrue();
    expect(service.services.has('problem-one_service1')).toBeTrue();
    expect(service.onProblemsChanged.emit).toHaveBeenCalledWith(false);
    expect(service.onProblemsLoaded.emit).toHaveBeenCalled();
    done();
  });

  it('should return undefined for current problem if TAL_PROBLEM is not set', () => {
    projectMock.getCurrentProject().config.TAL_PROBLEM = '';
    expect(service.getCurrentProblem()).toBeUndefined();
  });
it('should select service for the first time and update config', () => {
  const config = { TAL_SERVICE: '' };
  const saveConfigSpy = jasmine.createSpy('saveConfig');
  const currentProject = {
    config,
    saveConfig: saveConfigSpy
  };

  spyOn(projectMock, 'getCurrentProject').and.returnValue(currentProject);

  const mockProblem = new ProblemDescriptor('test-problem', { services: new Map(), public_folder: '' } as any);
  const mockService = new ServiceDescriptor('my-service', {
    evaluator: [],
    args: new Map(),
    files: []
  }, mockProblem);

  spyOn(service.onServiceSelected, 'emit');

  service.selectService(mockService);

  expect(service.savedParams.has(mockService.getKey())).toBeTrue();
  expect(currentProject.config.TAL_SERVICE).toBe(mockService.getKey());
  expect(currentProject.saveConfig).toHaveBeenCalled();
  expect(service.onServiceSelected.emit).toHaveBeenCalledWith(mockService);
});



  it('should return undefined for current service if TAL_SERVICE is not set', () => {
    projectMock.getCurrentProject().config.TAL_SERVICE = '';
    expect(service.getCurrentService()).toBeUndefined();
  });


  it('should return null if arg.regex is null', () => {
    const parentMock = {} as ServiceDescriptor;
    const arg = {
      name: 'argNullRegex',
      default: 'test',
      regex: null as any,
      value: 'any value',
      getKey: () => 'mockKeyForNullRegex',
      key: 'mockKeyForNullRegex',
      parent: parentMock
    } as ArgDescriptor;

    const result = service.validateArg(arg);
    expect(result).toBeNull();
  });

  it('should return null if arg.regex is an invalid regex pattern', () => {
    const parentMock = {} as ServiceDescriptor;
    const arg = {
      name: 'argInvalidRegex',
      default: 'test',
      regex: '[' as any,
      value: 'test',
      getKey: () => 'mockKeyForInvalidRegex',
      key: 'mockKeyForInvalidRegex',
      parent: parentMock
    } as ArgDescriptor;

    const result = service.validateArg(arg);
    expect(result).toBeNull();
  });
});