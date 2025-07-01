import { TestBed } from '@angular/core/testing';

import { ProjectManagerService } from './project-manager.service';
import { Subscription } from 'rxjs';
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

  it('should emit on currentProjectChanged when driver is mounted and project is loaded', (done) => {
  service.currentProjectChanged.subscribe(() => {
    expect(true).toBeTrue();
    done();
  });


  service.addProject();
  const project = service.getCurrentProject();
  project.isLoaded = false;

  const driver = service.getCurrentDriver();
  driver.onMountChanged.emit();

  project.onLoaded.emit();
});

  it('should return error if setting an unknown project ID', async () => {
    await expectAsync(service.setCurrent(999)).toBeRejectedWithError('Project not found');
  });

  it('should throw error if current project is not set', () => {
    // E fshin projektin aktual
    (service as any).currentProjectEnv = null;
    expect(() => service.getCurrentProject()).toThrowError('No project selected');
  });it('should emit currentProjectChanged when setting current project after mount', async () => {
  const emitSpy = spyOn(service.currentProjectChanged, 'emit');

  service.addProject();
  const id = service.getCurrentProjectId();
  const project = service.getCurrentProject();

  project.isLoaded = false;

  // Mock subscribe to immediately invoke callback and return valid Subscription
  spyOn(project.onLoaded, 'subscribe').and.callFake((cb: () => void): Subscription => {
    cb(); // thirr direkt callback-un për të simuluar "ngarkim"
    return new Subscription(); // kthen një objekt Subscription të vlefshëm
  });

  await service.setCurrent(id);

  expect(emitSpy).toHaveBeenCalled();
});

it('should return sorted list of project IDs', () => {
  service.addProject(); // id 0
  service.addProject(); // id 1
  service.addProject(); // id 2

  const ids = service.getProjectsId();
  expect(ids).toEqual([0, 1, 2]);
});

});
