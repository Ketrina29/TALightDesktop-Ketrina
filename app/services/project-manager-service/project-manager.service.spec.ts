import { TestBed } from '@angular/core/testing';

import { ProjectManagerService } from './project-manager.service';
import { Subscription } from 'rxjs';
import { ProjectConfig, ProjectLanguage, ProjectEnvironment } from './project-manager.types';
import { EventEmitter } from '@angular/core';
import { CompilerService } from '../compiler-service/compiler-service.service';

describe('ProjectManagerService', () => {
  let service: ProjectManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should add a project and set it as current', () => {
    service.addProject();
    const ids = service.getProjectsId();
    expect(ids.length).toBe(1);
    expect(service.getCurrentProjectId()).toBe(ids[0]);
  });


  it('should return error if setting an unknown project ID', async () => {
    await expectAsync(service.setCurrent(999)).toBeRejectedWithError('Project not found');
  });

  it('should throw error if current project is not set', () => {
    // E fshin projektin aktual
    (service as any).currentProjectEnv = null;
    expect(() => service.getCurrentProject()).toThrowError('No project selected');
  });
it('should return sorted list of project IDs', () => {
  service.addProject(); // id 0
  service.addProject(); // id 1
  service.addProject(); // id 2

  const ids = service.getProjectsId();
  expect(ids).toEqual([0, 1, 2]);
});
it('should create and store a new project environment when loading from storage if not existing', async () => {
  const service = TestBed.inject(ProjectManagerService);

  // Simulojmë që kemi një ID në storage
  const fakeId = 99;
  (service as any).projectsEnvironment.set(fakeId, null);

  // Shtojmë një spy për createProject për të kontrolluar nëse thirret
  const createSpy = spyOn<any>(service, 'createProject').and.callThrough();

  // Thirrja që duhet të krijojë një projekt të ri nëse është null
  await service.setCurrent(fakeId);

  // Kontrollojmë që createProject është thirrur
  expect(createSpy).toHaveBeenCalled();

  // Kontrollojmë që projekti është ruajtur
  const envMap = (service as any).projectsEnvironment;
  expect(envMap.get(fakeId)).toBeDefined();
});
it('should throw if current project is not set', () => {
  (service as any).currentProjectEnv = null;
  expect(() => service.getCurrentProject()).toThrowError('No project selected');
});




it('should emit currentProjectChanged if project is already loaded on mountChanged', async () => {
  service.addProject();
  const env = service.getCurrentProject();

  env.isLoaded = true;

  const driver = service.getCurrentDriver();
  const emitSpy = spyOn(service.currentProjectChanged, 'emit');


  driver.onMountChanged.emit();

  expect(emitSpy).toHaveBeenCalled();
});

it('should emit currentProjectChanged when project becomes loaded after mountChanged', async () => {
  service.addProject();
  const env = service.getCurrentProject();

  // Fillimisht i panjohur
  env.isLoaded = false;

  const driver = service.getCurrentDriver();
  const emitSpy = spyOn(service.currentProjectChanged, 'emit');

  // Simulo ngarkimin pas `onLoaded.emit`
  driver.onMountChanged.emit();
  env.onLoaded.emit();  // kjo do të thërrasë again emit nga subscribe

  expect(emitSpy).toHaveBeenCalled();
});

});



// Test për ProjectConfig
describe('ProjectConfig', () => {
  it('should create default config and check default name', () => {
    const config = new ProjectConfig();
    expect(config.PROJECT_NAME).toBe('Project');
    expect(config.isDefaultProjectName()).toBeTrue();
  });
});

// Test për ProjectEnvironment
class MockDriver {
  exists = jasmine.createSpy().and.returnValue(Promise.resolve(true));
  readFile = jasmine.createSpy().and.returnValue(Promise.resolve(JSON.stringify(ProjectConfig.defaultConfig)));
  writeFile = jasmine.createSpy().and.returnValue(Promise.resolve(true));
}

class DummyEnv extends ProjectEnvironment {
  constructor() {
    super(ProjectLanguage.PY);
  }

  protected async createExample() {
    return true;
  }
}

describe('ProjectEnvironment', () => {
  let env: DummyEnv;
  let driver: any;

  beforeEach(() => {
    env = new DummyEnv();
    driver = new MockDriver();
  });

  it('should load config and call createExample if needed', async () => {
    const result = await env.load(driver);
    expect(result).toBeTrue();
    expect(driver.writeFile).toHaveBeenCalled();
  });

  it('should load config successfully', async () => {
    const success = await env.loadConfig(driver);
    expect(success).toBeTrue();
    expect(env.config.PROJECT_NAME).toBe('Project');
  });

  it('should save config successfully', async () => {
    const success = await env.saveConfig(driver);
    expect(success).toBeTrue();
    expect(driver.writeFile).toHaveBeenCalled();
  });
});
describe('ProjectManagerService – compiler integration', () => {
  let service: ProjectManagerService;
  let fakeDriver: any;
  let fakeEnv: any;

  beforeEach(() => {
    fakeDriver = {
      onWorkerReady: new EventEmitter<void>(),
      onMountChanged: new EventEmitter<void>(),
      onUnmountChanged: new EventEmitter<void>(),
      installPackages: jasmine.createSpy('installPackages').and.returnValue(Promise.resolve()),
      executeFile: jasmine.createSpy('executeFile').and.returnValue(Promise.resolve('output')),
      stopExecution: jasmine.createSpy('stopExecution').and.returnValue(Promise.resolve()),
      mountByProjectId: jasmine.createSpy(),
      unmountByProjectId: jasmine.createSpy()
    };

    fakeEnv = {
      language: ProjectLanguage.PY,
      config: {
        EXTRA_PACKAGES: ['numpy'],
        RUN: '/main.py',
      },
      isLoaded: true,
      load: jasmine.createSpy('load'),
      onLoaded: new EventEmitter<void>()
    };

    TestBed.configureTestingModule({
      providers: [
        ProjectManagerService,
        {
          provide: CompilerService,
          useValue: {
            get: () => fakeDriver
          }
        }
      ]
    });

    service = TestBed.inject(ProjectManagerService);

    // Simulo që një projekt është aktualisht aktiv
    (service as any).currentProjectEnv = fakeEnv;
    (service as any).currentProjectEnvId = 1;

    // Simulo aktivizimin e ngjarjeve
    fakeDriver.onWorkerReady.emit();
  });

  it('should install packages and run project', async () => {
    const result = await service.runProject();

    expect(fakeDriver.installPackages).toHaveBeenCalledWith(['numpy']);
    expect(fakeDriver.executeFile).toHaveBeenCalledWith('/main.py');
    expect(result).toBe('output');
  });

  it('should install packages correctly', async () => {
    await (service as any).installPackages(['express']);
    expect(fakeDriver.installPackages).toHaveBeenCalledWith(['express']);
  });

  it('should stop execution', async () => {
    await service.stopExecution();
    expect(fakeDriver.stopExecution).toHaveBeenCalled();
  });
});