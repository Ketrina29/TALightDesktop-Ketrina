import { TestBed } from '@angular/core/testing';

import { HotkeysService } from './hotkeys.service';
import { ProjectManagerService } from '../project-manager-service/project-manager.service';
import { mockProjectConfig } from './mockProjectConfig';
 function mockConfig(key: string, ctrl = false): any {
  return {
    config: {
      ...mockProjectConfig,
      hotkeys: { 
        HOTKEY_SAVE: { Control: ctrl, Alt: false, Shift: false, Key: key },
        HOTKEY_EXPORT: { Control: ctrl, Alt: false, Shift: false, Key: 'e' },
        HOTKEY_RUN: { Control: false, Alt: false, Shift: false, Key: 'F8' },
        HOTKEY_TEST: { Control: false, Alt: false, Shift: false, Key: 'F9' }
      }
    }
  };
}


describe('HotkeysService', () => {
  let service: HotkeysService;
  let projectManagerServiceSpy: jasmine.SpyObj<ProjectManagerService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ProjectManagerService', ['getCurrentProject']);
    TestBed.configureTestingModule({
      providers: [
        HotkeysService,
        { provide: ProjectManagerService, useValue: spy }
      ]
    });
    service = TestBed.inject(HotkeysService);
    projectManagerServiceSpy = TestBed.inject(ProjectManagerService) as jasmine.SpyObj<ProjectManagerService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('should emit "save" when CTRL+S is pressed', () => {
    projectManagerServiceSpy.getCurrentProject.and.returnValue(mockConfig('s', true));
    spyOn(service.hotkeysAction, 'emit');

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    Object.defineProperty(event, 'repeat', { get: () => false });
    service.getCorrectHotkey(event);

    expect(service.hotkeysAction.emit).toHaveBeenCalledWith('save');
  });

  it('should emit "export" when CTRL+E is pressed', () => {
    projectManagerServiceSpy.getCurrentProject.and.returnValue(mockConfig('e', true));
    spyOn(service.hotkeysAction, 'emit');

    const event = new KeyboardEvent('keydown', { key: 'e', ctrlKey: true });
    Object.defineProperty(event, 'repeat', { get: () => false });
    service.getCorrectHotkey(event);

    expect(service.hotkeysAction.emit).toHaveBeenCalledWith('export');
  });

  it('should emit "run" when F8 is pressed', () => {
    projectManagerServiceSpy.getCurrentProject.and.returnValue({ config: mockProjectConfig } as any);

    spyOn(service.hotkeysAction, 'emit');

    const event = new KeyboardEvent('keydown', { key: 'F8' });
    Object.defineProperty(event, 'repeat', { get: () => false });
    service.getCorrectHotkey(event);

    expect(service.hotkeysAction.emit).toHaveBeenCalledWith('run');
  });

  it('should emit "test" when F9 is pressed', () => {
 projectManagerServiceSpy.getCurrentProject.and.returnValue({ config: mockProjectConfig } as any);
    spyOn(service.hotkeysAction, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'F9' });
    Object.defineProperty(event, 'repeat', { get: () => false });
    service.getCorrectHotkey(event);
    expect(service.hotkeysAction.emit).toHaveBeenCalledWith('test');
  });

   it('should do nothing if config is null', () => {
    projectManagerServiceSpy.getCurrentProject.and.returnValue({ config: null } as any);
    spyOn(service.hotkeysAction, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'F9' });
    Object.defineProperty(event, 'repeat', { get: () => false });
    service.getCorrectHotkey(event);
    expect(service.hotkeysAction.emit).not.toHaveBeenCalled();
  });


it('should do nothing if event is repeated', () => {
  spyOn(service.hotkeysAction, 'emit');
  projectManagerServiceSpy.getCurrentProject.and.returnValue({ config: mockProjectConfig } as any);

  const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
  Object.defineProperty(event, 'repeat', { get: () => true });

  service.getCorrectHotkey(event);

  expect(service.hotkeysAction.emit).not.toHaveBeenCalled();
});


it('should call parseFile()', () => {
  const spy = spyOn(mockProjectConfig, 'parseFile');
  mockProjectConfig.parseFile();
  expect(spy).toHaveBeenCalled();
});



});
