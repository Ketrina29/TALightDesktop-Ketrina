import { ProblemManagerService } from './problem-manager.service';

import { ApiService } from '../api-service/api.service';
import { ProjectManagerService } from '../project-manager-service/project-manager.service';
import { ProblemDescriptor, ServiceDescriptor, ArgDescriptor, ProblemMap } from './problem-manager.types';
import { of, throwError } from 'rxjs';
import { Packets } from '../api-service/api.packets';
import { Meta } from '../api-service/api.service';

describe('ProblemManagerService', () => {
  let service: ProblemManagerService;
  let apiMock: jasmine.SpyObj<ApiService>;
  let projectMock: any;

  beforeEach(() => {
    apiMock = jasmine.createSpyObj<ApiService>('ApiService', ['problemList']);
    projectMock = {
      getCurrentProject: () => ({
        config: { TAL_PROBLEM: '', TAL_SERVICE: '', EXTRA_PACKAGES: [] },
        saveConfig: jasmine.createSpy('saveConfig'),
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
  const currentProject = service['pms'].getCurrentProject();
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

  const mockProblem = new ProblemDescriptor('test-problem', mockMeta);
  spyOn(service.onProblemSelected, 'emit');

  service.selectProblem(mockProblem);

  expect(service.onProblemSelected.emit).toHaveBeenCalledWith(mockProblem);
  expect(currentProject.config.TAL_PROBLEM).toBe(mockProblem.key);
  expect(currentProject.config.TAL_SERVICE).toBe('');
  expect(configSpy).toHaveBeenCalledWith(service['pms'].getCurrentDriver());
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

  it('should handle error during API call for updateProblems', () => {
  const errorMessage = 'API error occurred';

  // Simulo problemList që thërret onError
  apiMock.problemList.and.callFake((callback) => {
    const req = {
      onError: (errorCallback: (err: any) => void) => {
        // Simulo direkt errorin
        errorCallback(errorMessage);
      },
      didReciveHandshake: true,
      didRecive: true,
      didReciveProblemList: true,
      tal: ''
    };
    return req as any;
  });

  // Spione për emituesit
  spyOn(service.onProblemsChanged, 'emit');
  spyOn(service.onError, 'emit');

  // Thirr metoda
  service.updateProblems();

  // Verifikimet
  expect(service.onProblemsChanged.emit).toHaveBeenCalledWith(true);
  expect(service.problemList.length).toBe(0);
  expect(service.problems.size).toBe(0);
  expect(service.services.size).toBe(0);
  expect(service.onProblemsChanged.emit).toHaveBeenCalledWith(false);
  expect(service.onError.emit).toHaveBeenCalledWith(errorMessage);
});

  it('should return undefined for current problem if TAL_PROBLEM is not set', () => {
    projectMock.getCurrentProject().config.TAL_PROBLEM = '';
    expect(service.getCurrentProblem()).toBeUndefined();
  });

  it('should select service for the first time and update config', () => {
    const currentProject = service['pms'].getCurrentProject();
    const configSpy = currentProject.saveConfig;
    const mockProblem = new ProblemDescriptor('test-problem', { services: new Map(), public_folder: '' } as any);
    const mockService = new ServiceDescriptor('test-service', { evaluator: ['test'], args: new Map(), files: [] }, mockProblem);
    spyOn(service.onServiceSelected, 'emit');

    service.selectService(mockService);

    expect(service.savedParams.has(mockService.getKey())).toBeTrue();
    expect(service.savedParams.get(mockService.getKey())).toEqual(mockService);
    expect(currentProject.config.TAL_SERVICE).toBe(mockService.getKey());
    expect(configSpy).toHaveBeenCalledWith(service['pms'].getCurrentDriver());
    expect(service.onServiceSelected.emit).toHaveBeenCalledWith(mockService);
  });

  it('should select service already in savedParams and update config', () => {
    const currentProject = service['pms'].getCurrentProject();
    const configSpy = currentProject.saveConfig;
    const mockProblem = new ProblemDescriptor('test-problem', { services: new Map(), public_folder: '' } as any);
    const existingService = new ServiceDescriptor('existing-service', { evaluator: ['test'], args: new Map(), files: [] }, mockProblem);
    service.savedParams.set(existingService.getKey(), existingService);

    spyOn(service.onServiceSelected, 'emit');

    service.selectService(existingService);

    expect(service.savedParams.has(existingService.getKey())).toBeTrue();
    expect(currentProject.config.TAL_SERVICE).toBe(existingService.getKey());
    expect(configSpy).toHaveBeenCalledWith(service['pms'].getCurrentDriver());
    expect(service.onServiceSelected.emit).toHaveBeenCalledWith(existingService);
  });

  it('should return undefined for current service if TAL_SERVICE is not set', () => {
    projectMock.getCurrentProject().config.TAL_SERVICE = '';
    expect(service.getCurrentService()).toBeUndefined();
  });

  it('should validate multiple arguments and return issues for invalid ones', () => {
    const parent = {} as ServiceDescriptor;
    // Changed regex to RegExp literal
    const validArg = new ArgDescriptor('validArg', { default: 'test', regex: /test/ } as any, parent);
    validArg.value = 'test';

    // Changed regex to RegExp literal
    const invalidArg1 = new ArgDescriptor('invalidArg1', { default: '123', regex: /^\d+$/ } as any, parent);
    invalidArg1.value = 'abc';

    // Changed regex to RegExp literal
    const invalidArg2 = new ArgDescriptor('invalidArg2', { default: 'foo', regex: /bar/ } as any, parent);
    invalidArg2.value = 'baz';

    const mockService = {
      args: new Map([
        [validArg.name, validArg],
        [invalidArg1.name, invalidArg1],
        [invalidArg2.name, invalidArg2],
      ])
    } as ServiceDescriptor;

    const issues = service.validateArgs(mockService);
    expect(issues.size).toBe(2);
    expect(issues.has(invalidArg1.key)).toBeTrue();
    expect(issues.has(invalidArg2.key)).toBeTrue();
    expect(issues.get(invalidArg1.key)).toContain('Validation error');
    expect(issues.get(invalidArg2.key)).toContain('Validation error');
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