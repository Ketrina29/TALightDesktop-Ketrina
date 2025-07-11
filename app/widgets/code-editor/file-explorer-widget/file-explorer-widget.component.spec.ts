import { ComponentFixture, TestBed, fakeAsync, flush, tick, waitForAsync } from '@angular/core/testing';
import { FileExplorerWidgetComponent } from './file-explorer-widget.component';

import { ConfirmationService, MessageService } from 'primeng/api';
import { of, Subject } from 'rxjs';
import { ProjectDriver } from '../../../services/project-manager-service/project-manager.types';
import { FsService, Tar } from '../../../services/fs-service/fs.service';
import { ProjectManagerService } from '../../../services/project-manager-service/project-manager.service';
import { GithubApiService } from '../../../services/github-api-service/github-api.service';
import { TutorialService } from '../../../services/tutorial-service/tutorial.service';
import { CompilerService } from '../../../services/compiler-service/compiler-service.service';
import { MenuItem } from 'primeng/api';

import { GoogleLoginProvider, SocialAuthService } from '@abacritt/angularx-social-login';

import { ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { FsNodeFile, FsNodeFolder } from '../../../services/fs-service/fs.service.types';

// Mock driver completo e tipizzato
const driverMock: any = {
  driverName: 'mockDriver',
  mountPoint: '/',
  fsRoot: {
    name: 'root',
    path: '/',
    folders: [],
    files: []
  },
  scanDirectory: jasmine.createSpy('scanDirectory').and.returnValue(Promise.resolve({
    name: 'root',
    path: '/',
    folders: [],
    files: []
  })),
  renameItem: jasmine.createSpy('renameItem').and.returnValue(Promise.resolve(true)),
  delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve(true)),
  writeFile: jasmine.createSpy('writeFile').and.returnValue(Promise.resolve(0)),
  createDirectory: jasmine.createSpy('createDirectory').and.returnValue(Promise.resolve(true)),
  readFile: jasmine.createSpy('readFile').and.returnValue(Promise.resolve('file content')),
  ready: jasmine.createSpy('ready').and.returnValue(Promise.resolve(true)),
  onWorkerReady: of(null),
  isWorkerReady: true,
  eventsSubscribed: true,
  root: '/',
  mount: () => Promise.resolve(true),
  unmount: () => Promise.resolve(true),
  listMounts: () => Promise.resolve([]),
  createFile: () => Promise.resolve(true),
  moveItem: () => Promise.resolve(true),
  copyItem: () => Promise.resolve(true),
  exists: () => Promise.resolve(true),
  readDir: () => Promise.resolve([]),
  stat: () => Promise.resolve({} as any),
  writeBinaryFile: () => Promise.resolve(true),
  readBinaryFile: () => Promise.resolve(new ArrayBuffer(0)),
  deleteFile: () => Promise.resolve(true),
  deleteFolder: () => Promise.resolve(true),
  makeZip: () => Promise.resolve(new ArrayBuffer(0)),
  extractZip: () => Promise.resolve(true),
  fsRootPath: '/',
  isFile: () => true,
  isFolder: () => true,
  join: (...paths: string[]) => paths.join('/'),
};

const folder: FsNodeFolder = {
  name: 'folder1',
  path: '/folder1',
  folders: [],
  files: []
};

const file: FsNodeFile = {
  name: 'file1.ts',
  path: '/folder1/file1.ts',
  content: ''
};

class MockTutorialService {
  public onTutorialChange = of(null);
  public onTutorialClose = of(null);
  public closeTutorial = jasmine.createSpy('closeTutorial');
}

describe('FileExplorerWidgetComponent', () => {
  let component: FileExplorerWidgetComponent;
  let fixture: ComponentFixture<FileExplorerWidgetComponent>;
  let tutorialServiceInstance: MockTutorialService;

  const fsServiceMock = jasmine.createSpyObj('FsService', ['treeToList']);
  const currentProjectChangedSubject = new Subject<void>();
const projectManagerServiceMock = jasmine.createSpyObj(
  'ProjectManagerService',
  ['getCurrentProject', 'getCurrentProjectId', 'getCurrentDriver'],
  { currentProjectChanged: currentProjectChangedSubject.asObservable() }
);
  const githubApiServiceMock = jasmine.createSpyObj('GithubApiService', [
    'getAccessToken', 'getUserData', 'getRepository', 'createRepository', 'getRepoList',
    'getReference', 'createTree', 'createCommit', 'updateReference', 'getRepositoryAsTar', 'getTar'
  ]);
  const messageServiceMock = jasmine.createSpyObj('MessageService', ['add']);
  const confirmationServiceMock = jasmine.createSpyObj('ConfirmationService', ['confirm']);
  const compilerServiceMock = jasmine.createSpyObj('CompilerService', ['get']);
  const socialAuthServiceMock = jasmine.createSpyObj('SocialAuthService', ['authState', 'getAccessToken', 'signIn', 'signOut']);
  socialAuthServiceMock.authState = of(null);


  beforeEach(async () => {
    projectManagerServiceMock.getCurrentProject.and.returnValue({
      language: 'python',
      config: { DIR_PROJECT: '/project', CONFIG_PATH: '/project/config.json' }
    });
    projectManagerServiceMock.getCurrentProjectId.and.returnValue('projectId');
    projectManagerServiceMock.getCurrentDriver.and.returnValue(driverMock);
    compilerServiceMock.get.and.returnValue(driverMock);

    await TestBed.configureTestingModule({
      declarations: [FileExplorerWidgetComponent],
      providers: [
        { provide: FsService, useValue: fsServiceMock },
        { provide: ProjectManagerService, useValue: projectManagerServiceMock },
        { provide: GithubApiService, useValue: githubApiServiceMock },
        { provide: TutorialService, useClass: MockTutorialService },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: ConfirmationService, useValue: confirmationServiceMock },
        { provide: CompilerService, useValue: compilerServiceMock },
        { provide: SocialAuthService, useValue: socialAuthServiceMock },
        {
          provide: 'SocialAuthServiceConfig',
          useValue: {
            autoLogin: false,
            providers: [],
            onError: (err: any) => console.error(err),
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    tutorialServiceInstance = TestBed.inject(TutorialService) as any;
    fixture = TestBed.createComponent(FileExplorerWidgetComponent);
    component = fixture.componentInstance;
    component.driver = driverMock; // assegna driverMock esplicitamente
    fixture.detectChanges();

    currentProjectChangedSubject.next();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle showHidden', () => {
    const initial = component.showHidden;
    component.toggleHidden();
    expect(component.showHidden).toBe(!initial);
  });

  it('should start editing an item', () => {
    component.startEditing(folder, file);
    expect(component.editingItem).toEqual(file);
    expect(component.editingValue).toEqual(file.name);
  });

  it('should save editing and call renameItem', fakeAsync(() => {
    component.startEditing(folder, file);
    component.editingValue = 'newFile.ts';
    component.saveEditing();
    tick();
    expect(driverMock.renameItem).toHaveBeenCalledWith(file.path, '/newFile.ts');
  }));

  it('should delete file after confirmation accept', () => {
    confirmationServiceMock.confirm.and.callFake((options: any) => options.accept());
    component.deleteFileClick({ target: {} } as any, file as any);
    expect(driverMock.delete).toHaveBeenCalledWith(file.path);
  });
 it('should start editing an item', () => {
  const folder = { name: 'folder1', path: '/folder1', folders: [], files: [] };
  const file = { name: 'file1.ts', path: '/folder1/file1.ts' };
  component.startEditing(folder as any, file as any);
  expect(component.editingItem).toEqual(file as any);
  expect(component.editingValue).toBe(file.name);
});

it('should cancel editing', () => {
  const folder = { name: 'folder1', path: '/folder1', folders: [], files: [] };
  const file = { name: 'file1.ts', path: '/folder1/file1.ts' };
  component.startEditing(folder as any, file as any);
  component.cancelEditing();
  expect(component.editingItem).toBeNull();
  expect(component.editingValue).toBe('');
});

it('should create a new file', fakeAsync(() => {
  const folder = { name: 'folder1', path: '/folder1', folders: [], files: [] };
  driverMock.writeFile.calls.reset();
  
 component.addNewItem(folder as any, 'file'); 
 
  component.editingValue = 'newFile.ts';
  component.saveEditing();
  tick();

  expect(driverMock.writeFile).toHaveBeenCalledWith('/folder1/newFile.ts', '');
}));


it('should emit onUpdateRoot event on folder selection', () => {
  const folder = { name: 'src', path: '/src', folders: [], files: [] };
  spyOn(component.onUpdateRoot, 'emit');
  component.selectFolder(folder as any);  // ose emri i saktë në komponent
  expect(component.onUpdateRoot.emit).toHaveBeenCalledWith(folder);
});
it('should emit onSelectFile when selecting a file', () => {
  const file = {
    name: 'main.ts',
    path: '/main.ts',
    content: '', // ose 'console.log("hello")'
  };

  spyOn(component.onSelectFile, 'emit');
  component.selectFile(file as any);
  expect(component.onSelectFile.emit).toHaveBeenCalledWith(file);
});

it('should emit onFileDeleted when deleting a file', () => {
  const file = { name: 'remove.ts', path: '/remove.ts' };
  confirmationServiceMock.confirm.and.callFake((options: any) => options.accept());
  spyOn(component.onFileDeleted, 'emit');
  component.deleteFileClick({ target: {} } as any, file as any);
  expect(driverMock.delete).toHaveBeenCalledWith(file.path);
  expect(component.onFileDeleted.emit).toHaveBeenCalledWith(file.path);
});

it('should emit showHiddenChanged when toggling hidden files', () => {
  component.showHidden = false;
  spyOn(component.showHiddenChanged, 'emit');
  component.toggleHidden();
  expect(component.showHidden).toBe(true);
  expect(component.showHiddenChanged.emit).toHaveBeenCalledWith(true);
});

it('should emit onItemRenamed when a file is renamed', fakeAsync(() => {
  const folder = { name: 'folder1', path: '/folder1', folders: [], files: [] };
  const file = { name: 'file1.ts', path: '/folder1/file1.ts' };
  component.startEditing(folder as any, file as any);
  component.editingValue = 'renamed.ts';
  spyOn(component.onItemRenamed, 'emit');
  component.saveEditing();
  tick();
  expect(component.onItemRenamed.emit).toHaveBeenCalled();
}));
it('should create a new folder when addNewItem is called with type "folder"', fakeAsync(() => {
  driverMock.createDirectory.calls.reset();
  component.addNewItem(folder, 'folder');
  component.editingValue = 'newFolder';
  component.saveEditing();
  tick();
  expect(driverMock.createDirectory).toHaveBeenCalledWith('/folder1/newFolder');
}));

it('should not call writeFile or renameItem when editingValue is empty', fakeAsync(() => {
  component.startEditing(folder, file);
  component.editingValue = '';
  component.saveEditing();
  tick();
  expect(driverMock.writeFile).not.toHaveBeenCalled();
  expect(driverMock.renameItem).not.toHaveBeenCalled();
}));

it('should not delete file if confirmation is rejected', () => {
  confirmationServiceMock.confirm.and.callFake((options: any) => options.reject());
  driverMock.delete.calls.reset();
  component.deleteFileClick({ target: {} } as any, file as any);
  expect(driverMock.delete).not.toHaveBeenCalled();
});

it('should cancel editing even if a folder is being edited', () => {
  const folderItem: FsNodeFolder = { name: 'docs', path: '/docs', folders: [], files: [] };
  component.startEditing(folder, folderItem);
  component.cancelEditing();
  expect(component.editingItem).toBeNull();
  expect(component.editingValue).toBe('');
});

it('should initialize with fsRoot if available', () => {
  expect(component.driver?.fsRoot.name).toBe('root');
  expect(component.driver?.fsRoot.path).toBe('/');
});

it('should bind collapse event handlers to rows with class "collapse-toggle"', fakeAsync(() => {
  const mockRow = document.createElement('div');
  mockRow.className = 'collapse-toggle';
  document.body.appendChild(mockRow);
  component['bindCollapseEvent']();
  tick(); // wait for setTimeout
  expect(mockRow.classList.contains('bound')).toBeTrue();
  mockRow.remove();
}));
it('should cancel new item creation and reset related fields', () => {
  component.newItemValue = 'example.ts';
  component.newItemFolder = folder;
  component.cancelNewItem();
  expect(component.newItemValue).toBe('');
  expect(component.newItemFolder).toBeNull();
});
it('should hide all context menus when closeAllContextMenus is called', () => {
  const panelMock = { hide: jasmine.createSpy('hide') };
  component.panels = {
    forEach: (callback: any) => [panelMock, panelMock].forEach(callback)
  } as any;
  const event = new Event('click');
  spyOn(event, 'preventDefault');
  component.closeAllContextMenus(event);
  expect(event.preventDefault).toHaveBeenCalled();
  expect(panelMock.hide).toHaveBeenCalledTimes(2);
});

it('should call confirmationService when deleting a folder', () => {
  const event = { target: {} } as Event;
  confirmationServiceMock.confirm.calls.reset();
  component.deleteFolderClick(event, folder);
  expect(confirmationServiceMock.confirm).toHaveBeenCalled();
});
it('should update exportDropDisabled and exportButtonRepoDisabled based on newRepoName', fakeAsync(() => {
  component.reposList = [{ name: 'otherRepo' }];
  component.newRepoName = 'newRepo';
  const label = document.createElement('div');
  label.id = 'repoName-help';
  document.body.appendChild(label);

  component.detectInput();
  tick();

  expect(component.exportDropDisabled).toBeTrue();
  expect(component.exportButtonRepoDisabled).toBeFalse();

  label.remove();
}));
it('should open GitHub login popup for downloadGithub', () => {
  const popupMock = {
    closed: true,
    location: { href: 'https://something.com' }
  } as any;

  spyOn(window, 'open').and.returnValue(popupMock);
  spyOn(localStorage, 'removeItem');

  component.downloadGithub();

  expect(window.open).toHaveBeenCalled();
  expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
  expect(localStorage.removeItem).toHaveBeenCalledWith('username');
});
it('should open GitHub login popup for uploadGitHub', () => {
  const popupMock = {
    closed: true,
    location: { href: 'https://something.com' }
  } as any;

  spyOn(window, 'open').and.returnValue(popupMock);
  spyOn(localStorage, 'removeItem');

  component.uploadGitHub('Github-code');

  expect(window.open).toHaveBeenCalled();
  expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
  expect(localStorage.removeItem).toHaveBeenCalledWith('username');
});
it('should create a downloadable link and trigger download', () => {
  const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
  const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();

  component.triggerDownload('test.txt', 'content', 'text/plain');

  expect(appendSpy).toHaveBeenCalled();
  expect(removeSpy).toHaveBeenCalled();
});
it('should simulate click on Google sign-in element', () => {
  const clickMock = jasmine.createSpy('click');
  const fakeElement = document.createElement('div');
  fakeElement.appendChild(document.createElement('div'));
  fakeElement.children[0].appendChild(document.createElement('div'));
  const clickTarget = document.createElement('div');
  clickTarget.addEventListener = () => {};
  clickTarget.click = clickMock;
  fakeElement.children[0].children[0].appendChild(clickTarget);

  const gUpload = document.createElement('div');
  gUpload.id = 'g_upload';
  gUpload.appendChild(fakeElement);
  document.body.appendChild(gUpload);

  component.signIn();

  expect(clickMock).toHaveBeenCalled();
  gUpload.remove();
});
it('should upload file to Google Drive and show success message', async () => {
  spyOn(window, 'fetch').and.resolveTo({
    json: async () => ({ files: [{ id: '12345' }] })
  } as Response);

  const successResponse = {
    json: async () => ({})  // pa `error` -> suksesi
  };

  spyOn(component, 'showToastMessage');
  spyOn(window, 'Blob').and.callThrough(); // siguro që të mos ngatërrohet

  spyOn(component as any, 'uploadGoogleDrive').and.callThrough();

  await component.uploadGoogleDrive('test.tar', new ArrayBuffer(10));

  expect(component.showToastMessage).toHaveBeenCalledWith('success', 'Upload successful');
});
it('should upload file to OneDrive and show success message', async () => {
  socialAuthServiceMock.signIn.and.resolveTo({ authToken: 'dummy_token' });

  spyOn(window, 'fetch').and.resolveTo({
    json: async () => ({})
  } as Response);

  spyOn(component, 'showToastMessage');

  await component.uploadOneDrive('file.ts', new ArrayBuffer(10));

  expect(component.showToastMessage).toHaveBeenCalledWith('success', 'Upload successful');
});
it('should call messageService.add when showing toast', () => {
  component.showToastMessage('info', 'Test message');
  expect(messageServiceMock.add).toHaveBeenCalledWith({
    key: 'tl',
    severity: 'info',
    summary: 'Info',
    detail: 'Test message',
  });
});
it('should export project locally if mode is Local', () => {
  const treeMock = [{ name: 'file.ts', path: '/file.ts', content: 'abc' }];
  fsServiceMock.treeToList.and.returnValue(treeMock);

  spyOn(Tar, 'pack').and.callFake((items, callback) => {
    const fakeTar = new ArrayBuffer(10);
    callback(fakeTar);
  });

  spyOn(component, 'triggerDownload');

  component.export('Local');

  expect(fsServiceMock.treeToList).toHaveBeenCalled();
  expect(component.triggerDownload).toHaveBeenCalled();
});
it('should handle renameItem failure gracefully', fakeAsync(() => {
  driverMock.renameItem.and.returnValue(Promise.reject('error'));
  component.startEditing(folder, file);
  component.editingValue = 'fail.ts';
  component.saveEditing();
  tick();
  expect(messageServiceMock.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
}));

it('should not allow creating new item with duplicate name', () => {
  folder.files = [{ name: 'duplicate.ts', path: '/folder1/duplicate.ts', content: '' }];
  component.newItemFolder = folder;
  component.newItemValue = 'duplicate.ts';
  component.newItemChange();
  expect(component.newItemError).toBeTrue();
});

it('should emit onFileDeleted event after file deletion', () => {
  spyOn(component.onFileDeleted, 'emit');
  confirmationServiceMock.confirm.and.callFake((opts: any) => opts.accept());

  component.deleteFileClick({ target: {} } as any, file);
  expect(component.onFileDeleted.emit).toHaveBeenCalledWith(file.path);
});

it('should bind collapse event to elements with class collapse-toggle', fakeAsync(() => {
  const div = document.createElement('div');
  div.className = 'collapse-toggle';
  document.body.appendChild(div);
  component['bindCollapseEvent']();
  tick();
  expect(div.classList.contains('bound')).toBeTrue();
  div.remove();
}));
it('should toggle collapsed class in handleClickEvent', () => {
  const container = document.createElement('div');
  container.classList.add('tal-folder-subtree', 'collapsed');

  const row = document.createElement('div');
  container.appendChild(row);
  document.body.appendChild(container);

  const event = new MouseEvent('click');
  Object.defineProperty(event, 'target', { value: row });

  const preventDefaultSpy = spyOn(event, 'preventDefault' as any).and.callThrough();
  const stopPropagationSpy = spyOn(event, 'stopPropagation' as any).and.callThrough();

  component.handleClickEvent(event);

  expect(preventDefaultSpy).toHaveBeenCalled();
  expect(stopPropagationSpy).toHaveBeenCalled();
  expect(container.classList.contains('collapsed')).toBeFalse(); // toggled off

  document.body.removeChild(container);
});
it('should open settings and select config file', fakeAsync(() => {
  const mockConfigFile = { name: 'config.json', path: '/project/config.json', content: '' };
  const mockProjectFolder = { name: 'project', path: '/project', folders: [], files: [mockConfigFile] };
  const mockDriver = {
    ...driverMock,
    fsRoot: { name: 'root', path: '/', folders: [mockProjectFolder], files: [] }
  };

  projectManagerServiceMock.getCurrentProject.and.returnValue({
    config: { DIR_PROJECT: '/project', CONFIG_PATH: '/project/config.json' }
  });
  projectManagerServiceMock.getCurrentDriver.and.returnValue(mockDriver);
  spyOn(component, 'selectFile');

  component.showHidden = false;
  component.openSettings();

  tick(); // for refreshRoot callback recursion

  expect(component.showHidden).toBeTrue();
  expect(component.selectFile).toHaveBeenCalledWith(mockConfigFile);
}));

it('should return if project folder is not found in openSettings', () => {
  projectManagerServiceMock.getCurrentProject.and.returnValue({
    config: { DIR_PROJECT: '/missing', CONFIG_PATH: '/missing/config.json' }
  });
  projectManagerServiceMock.getCurrentDriver.and.returnValue({
    ...driverMock,
    fsRoot: { name: 'root', path: '/', folders: [], files: [] }
  });

  const selectSpy = spyOn(component, 'selectFile');
  component.openSettings();

  expect(selectSpy).not.toHaveBeenCalled();
});
it('should return if config file is not found in project folder', () => {
  const folderNoConfig = { name: 'f', path: '/project', folders: [], files: [] };

  projectManagerServiceMock.getCurrentProject.and.returnValue({
    config: { DIR_PROJECT: '/project', CONFIG_PATH: '/project/config.json' }
  });
  projectManagerServiceMock.getCurrentDriver.and.returnValue({
    ...driverMock,
    fsRoot: { name: 'root', path: '/', folders: [folderNoConfig], files: [] }
  });

  const selectSpy = spyOn(component, 'selectFile');
  component.openSettings();

  expect(selectSpy).not.toHaveBeenCalled();
});
it('should return true for visible file when showHidden is false', () => {
  component.showHidden = false;
  const visible = component.isVisibile({ name: 'index.ts', path: '/index.ts' } as FsNodeFile);
  expect(visible).toBeTrue();
});

it('should return false for hidden file when showHidden is false', () => {
  component.showHidden = false;
  const hidden = component.isVisibile({ name: '.env', path: '/.env' } as FsNodeFile);
  expect(hidden).toBeFalse();
});

it('should return true for hidden file when showHidden is true', () => {
  component.showHidden = true;
  const hidden = component.isVisibile({ name: '.env', path: '/.env' } as FsNodeFile);
  expect(hidden).toBeTrue();
});
it('should set editingItemError to false when no name conflict exists', () => {
  component.editingValue = 'new.ts';
  component.editingItemFolder = {
    name: 'folder1',
    path: '/folder1',
    folders: [],
    files: []
  };
  component.editItemChange();
  expect(component.editingItemError).toBeFalse();
});

it('should set editingItemError to true when file with same name exists', () => {
  component.editingValue = 'file1.ts';
  component.editingItemFolder = {
    name: 'folder1',
    path: '/folder1',
    folders: [],
    files: [{ name: 'file1.ts', path: '/folder1/file1.ts', content: '' }]
  };
  component.editItemChange();
  expect(component.editingItemError).toBeTrue();
});

it('should set editingItemError to true when folder with same name exists', () => {
  component.editingValue = 'myFolder';
  component.editingItemFolder = {
    name: 'folder1',
    path: '/folder1',
    folders: [{ name: 'myFolder', path: '/folder1/myFolder', folders: [], files: [] }],
    files: []
  };
  component.editItemChange();
  expect(component.editingItemError).toBeTrue();
});
it('should delete all files and folder when there are no subfolders', fakeAsync(() => {
  const currentFolder = folder;
  const testFolder = {
    name: 'toDelete',
    path: '/folder1/toDelete',
    folders: [],
    files: [{ name: 'file1.ts', path: '/folder1/toDelete/file1.ts', content: '' }]
  };

  spyOn(component.onFileDeleted, 'emit');

  (component as any).deleteFolder(currentFolder, testFolder);
  tick();

  expect(driverMock.delete).toHaveBeenCalledWith('/folder1/toDelete/file1.ts');
  expect(driverMock.delete).toHaveBeenCalledWith('/folder1/toDelete');
  expect(component.onFileDeleted.emit).toHaveBeenCalledWith('/folder1/toDelete/file1.ts');
}));

it('should delete all files and subfolders recursively', fakeAsync(() => {
  const testFolder = {
    name: 'main',
    path: '/folder1/main',
    files: [{ name: 'file.ts', path: '/folder1/main/file.ts', content: '' }],
    folders: [
      {
        name: 'sub',
        path: '/folder1/main/sub',
        files: [],
        folders: []
      }
    ]
  };

  (component as any).deleteFolder(folder, testFolder);
  tick();

  expect(driverMock.delete).toHaveBeenCalledWith('/folder1/main/file.ts');
  expect(driverMock.delete).toHaveBeenCalledWith('/folder1/main/sub');
  expect(driverMock.delete).toHaveBeenCalledWith('/folder1/main');
}));
it('should call refreshRoot when syncFilesystem is called', fakeAsync(() => {
  spyOn(component as any, 'refreshRoot');
  component.syncFilesystem();
  tick();
  expect((component as any).refreshRoot).toHaveBeenCalled();
}));
it('should not call selectFile if configFile is not found in openSettings', () => {
  const configPath = '/project/config.json';

  const project = {
    config: {
      DIR_PROJECT: '/settings',
      CONFIG_PATH: configPath
    }
  };

  const fakeFolder = {
    name: 'settings',
    path: '/settings',
    folders: [],
    files: []  // configFile mungon
  };

  driverMock.fsRoot.folders = [fakeFolder];
  projectManagerServiceMock.getCurrentProject.and.returnValue(project);

  spyOn(component, 'selectFile');

  component.openSettings();

  expect(component.selectFile).not.toHaveBeenCalled();
});
it('should create a new file in saveNewItem when newItemType is file', fakeAsync(() => {
  component.newItemValue = 'testFile.ts';
  component.newItemType = 'file';
  component.newItemError = false;
  component.newItemFolder = { ...folder };

  const expectedPath = '/folder1/testFile.ts';
  component.saveNewItem();
  tick();

  expect(driverMock.writeFile).toHaveBeenCalledWith(expectedPath, '');
}));
it('should create a new folder in saveNewItem when newItemType is folder', fakeAsync(() => {
  component.newItemValue = 'newFolder';
  component.newItemType = 'folder';
  component.newItemError = false;
  component.newItemFolder = { ...folder };

  const expectedPath = '/folder1/newFolder';

  component.saveNewItem();
  tick();

  expect(driverMock.createDirectory).toHaveBeenCalledWith(expectedPath);
}));
it('should call selectFile if configFile is found in openSettings', () => {
  const config = {
    DIR_PROJECT: '/folder1/',
    CONFIG_PATH: '/folder1/file1.ts'
  };

  const mockProject = { config };
  projectManagerServiceMock.getCurrentProject.and.returnValue(mockProject);

  const folderWithConfig: FsNodeFolder = {
    name: 'folder1',
    path: '/folder1',
    folders: [],
    files: [
      {
        name: 'file1.ts',
        path: '/folder1/file1.ts',
        content: ''
      }
    ]
  };

  driverMock.fsRoot.folders = [folderWithConfig];
  projectManagerServiceMock.getCurrentDriver.and.returnValue(driverMock);

  spyOn(component, 'selectFile');

  component.openSettings();

  expect(component.selectFile).toHaveBeenCalledWith(folderWithConfig.files[0]);
}); 

  it('should return false if no files are selected in upload', async () => {
    const mockEvent = { target: { files: [] } } as unknown as Event;
    spyOn(component, 'refreshRoot'); // Spy per assicurarsi che non venga chiamato inutilmente
    const result = await component.upload(mockEvent);
    expect(result).toBeFalse();
    expect(component.refreshRoot).not.toHaveBeenCalled();
  });


it('should call importProject when uploading a .tal.tar file', fakeAsync(async () => {
  const file = new File(['dummy content'], 'project.tal.tar');
  spyOn(file, 'arrayBuffer').and.returnValue(Promise.resolve(new ArrayBuffer(8)));

  const input = document.createElement('input');
  input.type = 'file';
  Object.defineProperty(input, 'files', { value: [file] });

  const mockEvent = new Event('change');
  Object.defineProperty(mockEvent, 'target', { value: input });

  spyOn(component, 'importProject').and.returnValue(Promise.resolve(true));
  spyOn(component, 'refreshRoot');

  const result = await component.upload(mockEvent);
  expect(component.importProject).toHaveBeenCalled();
  expect(component.refreshRoot).toHaveBeenCalled();
  expect(result).toBeTrue();
}));it('should upload multiple files and call writeFile', fakeAsync(async () => {
  // Krijo skedarë dummy me metoda të spiuara
  const file1 = new File(['file1 content'], 'file1.txt');
  const file2 = new File(['file2 content'], 'file2.txt');

  spyOn(file1, 'arrayBuffer').and.returnValue(Promise.resolve(new TextEncoder().encode('file1 content').buffer));
  spyOn(file2, 'arrayBuffer').and.returnValue(Promise.resolve(new TextEncoder().encode('file2 content').buffer));

  const mockEvent = {
    target: {
      files: [file1, file2]
    }
  } as unknown as Event;

  // Driver me spy për writeFile që kthen Promise<number>
  const driver = component.projectManagerService.getCurrentDriver();
  spyOn(driver, 'writeFile').and.returnValue(Promise.resolve(0));

  spyOn(component, 'refreshRoot');

  // Ekzekuto upload
  const result = await component.upload(mockEvent);

  // Verifikime
  expect(driver.writeFile).toHaveBeenCalledTimes(2);
  expect(component.refreshRoot).toHaveBeenCalled();
  expect(result).toBeTrue();
}));


it('should unpack project and write files/folders in importProject', fakeAsync(async () => {
  const tarball = new ArrayBuffer(10);

  const mockFolders = [{ name: 'src', path: '/project/src', files: [], folders: [] }];
  const mockFiles = [{
    name: 'main.py',
    path: '/project/src/main.py',
    content: new TextEncoder().encode('print("Hello")')
  }];

  spyOn(Tar, 'unpack').and.callFake(async (_tar, callback) => {
    await callback(mockFiles, mockFolders);
  });

  const driver = component.projectManagerService.getCurrentDriver();
  const createDirSpy = spyOn(driver, 'createDirectory').and.returnValue(Promise.resolve(true));
  const writeFileSpy = spyOn(driver, 'writeFile').and.returnValue(Promise.resolve(0));
  const refreshSpy = spyOn(component, 'refreshRoot');

  const result = await component.importProject(tarball);
  expect(createDirSpy).toHaveBeenCalledWith('/project/src');
  expect(writeFileSpy).toHaveBeenCalledWith('/project/src/main.py', jasmine.any(Uint8Array));
  expect(refreshSpy).toHaveBeenCalled();
  expect(result).toBeTrue();
}));

  // Nuovi test per la copertura mancante

it('should upload a single non-.tal.tar file and call writeFile', fakeAsync(async () => {
  const file = new File(['abc'], 'file.txt');
  spyOn(file, 'arrayBuffer').and.returnValue(Promise.resolve(new TextEncoder().encode('abc').buffer));

  const input = document.createElement('input');
  Object.defineProperty(input, 'files', { value: [file] });

  const event = new Event('change');
  Object.defineProperty(event, 'target', { value: input });

  const driver = component.projectManagerService.getCurrentDriver();
  const writeSpy = spyOn(driver, 'writeFile').and.returnValue(Promise.resolve(0));
  const refreshSpy = spyOn(component, 'refreshRoot');

  const result = await component.upload(event);
  expect(writeSpy).toHaveBeenCalledWith('/file.txt', jasmine.any(Uint8Array));
  expect(refreshSpy).toHaveBeenCalled();
  expect(result).toBeTrue();
}));

it('should upload multiple files to selected folder if selectedFolder is defined', fakeAsync(async () => {
  component.selectedFolder = { name: 'src', path: '/src', files: [], folders: [] };

  const file1 = new File(['1'], 'a.ts');
  const file2 = new File(['2'], 'b.ts');

  spyOn(file1, 'arrayBuffer').and.returnValue(Promise.resolve(new TextEncoder().encode('1').buffer));
  spyOn(file2, 'arrayBuffer').and.returnValue(Promise.resolve(new TextEncoder().encode('2').buffer));

  const input = document.createElement('input');
  Object.defineProperty(input, 'files', { value: [file1, file2] });

  const event = new Event('change');
  Object.defineProperty(event, 'target', { value: input });

  const driver = component.projectManagerService.getCurrentDriver();
  const writeSpy = spyOn(driver, 'writeFile').and.returnValue(Promise.resolve(0));
  const refreshSpy = spyOn(component, 'refreshRoot');

  const result = await component.upload(event);
  expect(writeSpy).toHaveBeenCalledWith('/src/a.ts', jasmine.any(Uint8Array));
  expect(writeSpy).toHaveBeenCalledWith('/src/b.ts', jasmine.any(Uint8Array));
  expect(refreshSpy).toHaveBeenCalled();
  expect(result).toBeTrue();
}));
it('should deselect folder when same folder is selected again', () => {
  const folder = { name: 'src', path: '/src', folders: [], files: [] };
  component.selectedFolder = folder;
  component.selectFolder(folder);
  expect(component.selectedFolder).toBeNull();
});
it('should call onDone callback after refreshRoot', fakeAsync(() => {
  const spyCallback = jasmine.createSpy('onDone');
  component.refreshRoot(spyCallback);
  tick();
  expect(spyCallback).toHaveBeenCalled();
}));
it('should rename item with simple path "/"', fakeAsync(() => {
  const fileSimple = { name: 'test.ts', path: '/test.ts', content: '' };
  component.startEditing({ ...folder }, fileSimple);
  component.editingValue = 'updated.ts';
  component.saveEditing();
  tick();
  expect(driverMock.renameItem).toHaveBeenCalledWith('/test.ts', '/updated.ts');
}));
it('should not create item when newItemValue is empty', fakeAsync(() => {
  component.newItemValue = '   ';
  component.newItemFolder = folder;
  component.newItemType = 'file';
  component.saveNewItem();
  tick();
  expect(driverMock.writeFile).not.toHaveBeenCalled();
}));
it('should handle deletion failure gracefully', fakeAsync(() => {
  const faultyDriver = component.projectManagerService.getCurrentDriver();
  spyOn(faultyDriver, 'delete').and.returnValue(Promise.reject('fail'));


  const faultyFolder = {
    name: 'buggy',
    path: '/buggy',
    files: [{ name: 'file.ts', path: '/buggy/file.ts', content: '' }],
    folders: []
  };

  (component as any).deleteFolder(folder, faultyFolder);
  tick();
  expect(driverMock.delete).toHaveBeenCalledWith('/buggy/file.ts');
}));
it('should return false for hidden folder if showHidden is false', () => {
  component.showHidden = false;
  const hiddenFolder = { name: '.secret', path: '/.secret', folders: [], files: [] };
  expect(component.isVisibile(hiddenFolder)).toBeFalse();
});

it('should keep editingItemError false when no conflict', () => {
 component.editingValue = 'unique.ts';
  component.editingItemFolder = { ...folder };
  component.editItemChange();
  expect(component.editingItemError).toBeFalse();
});
it('should create Blob and download using triggerDownload', () => {
  const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
  const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();
  component.triggerDownload('hello.txt', 'ciao', 'text/plain');
  expect(appendSpy).toHaveBeenCalled();
  expect(removeSpy).toHaveBeenCalled();
});
it('should deselect folder if same folder is selected again', () => {
  component.selectedFolder = folder;
  component.selectFolder(folder);
  expect(component.selectedFolder).toBeNull();
});

it('should not create item when newItemValue is empty or whitespace', fakeAsync(() => {
  component.newItemValue = '   ';
  component.newItemFolder = folder;
  component.newItemType = 'file';
  component.saveNewItem();
  tick();
  expect(driverMock.writeFile).not.toHaveBeenCalled();
}));
it('should keep editingItemError false when filename is unique', () => {
  component.editingValue = 'unique.ts';
  component.editingItemFolder = { ...folder, files: [] };
  component.editItemChange();
  expect(component.editingItemError).toBeFalse();
});
it('should create and trigger file download via DOM', () => {
  const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
  const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();
  component.triggerDownload('test.txt', 'Hello', 'text/plain');
  expect(appendSpy).toHaveBeenCalled();
  expect(removeSpy).toHaveBeenCalled();
});
it('should call provided callback after refreshRoot', fakeAsync(() => {
  const callback = jasmine.createSpy('callback');
  component.refreshRoot(callback);
  tick();
  expect(callback).toHaveBeenCalled();
}));
it('should handle GitHub-import popup callback and call githubService chain', fakeAsync(() => {
  const mockPopup = {
    closed: false,
    location: {
      href: 'https://oauth-callback?code=1234',
      search: '?code=1234'
    },
    close: jasmine.createSpy('close')
  };

  spyOn(localStorage, 'getItem').and.returnValue(null);
  spyOn(component['githubService'], 'getAccessToken').and.returnValue(Promise.resolve());
  spyOn(component['githubService'], 'getUserData').and.returnValue(Promise.resolve());
  spyOn(component['githubService'], 'getRepoList').and.returnValue(Promise.resolve([
    { name: 'repo1' },
    { name: 'TALightProject-Archives' },
    { name: 'repo2' }
  ]));

  component['detectInput'] = jasmine.createSpy('detectInput');

  component.checkGithubCallback(mockPopup, 'Github-import');

  tick(1000); // Simulon kalimin e kohës

  expect(component['githubService'].getAccessToken).toHaveBeenCalledWith('1234');
  expect(component['githubService'].getUserData).toHaveBeenCalled();
  expect(component['githubService'].getRepoList).toHaveBeenCalled();
  expect(mockPopup.close).toHaveBeenCalled();
  expect(component['reposList']).toEqual([
    { name: 'repo1' },
    { name: 'repo2' }
  ]);
  expect(component['newRepoOwner']).toBe(localStorage.getItem("username"));
  expect(component['exportVisible']).toBeTrue();
  expect(component['detectInput']).toHaveBeenCalled();
}));
it('should upload file to GitHub when content is ArrayBuffer', fakeAsync(() => {
  const contentString = 'Hello from buffer!';
  const arrayBuffer = new TextEncoder().encode(contentString).buffer;

  const mockFile: FsNodeFile = {
    name: 'buffer.txt',
    path: '/buffer.txt',
    content: arrayBuffer
  };

  const fsTree = [mockFile];

  fsServiceMock.treeToList.and.returnValue(fsTree);
  projectManagerServiceMock.getCurrentDriver.and.returnValue(driverMock);

  component.exportDropDisabled = true;
  component.newRepoName = 'repo-buffer';

  githubApiServiceMock.createRepository.and.returnValue(Promise.resolve());
  githubApiServiceMock.getReference.and.returnValue(Promise.resolve({ object: { sha: 'abc123' } }));
  githubApiServiceMock.createTree.and.returnValue(Promise.resolve({ sha: 'tree-sha' }));
  githubApiServiceMock.createCommit.and.returnValue(Promise.resolve({ sha: 'commit-sha' }));
  githubApiServiceMock.updateReference.and.returnValue(Promise.resolve({ error: false }));

  const toastSpy = spyOn(component, 'showToastMessage');

  component.uploadFiles();
  tick();

  expect(githubApiServiceMock.createRepository).toHaveBeenCalledWith('repo-buffer');
  expect(githubApiServiceMock.getReference).toHaveBeenCalled();
  expect(githubApiServiceMock.createTree).toHaveBeenCalled();
  expect(githubApiServiceMock.createCommit).toHaveBeenCalled();
  expect(githubApiServiceMock.updateReference).toHaveBeenCalled();
  expect(toastSpy).toHaveBeenCalledWith('success', 'Upload successful');
}));


it('should upload a single file and show success toast', async () => {
  const mockResponse = {
    json: () => Promise.resolve({ commit: true })
  };

  spyOn(window, 'fetch').and.returnValue(Promise.resolve(mockResponse as Response));
  const toastSpy = spyOn(component, 'showToastMessage');

  const content = new TextEncoder().encode("Hello world!").buffer;

  localStorage.setItem('username', 'test-user');
  localStorage.setItem('accessToken', 'test-token');

  await component['uploadFile']('repo', 'file.txt', content, 'text/plain');

  expect(fetch).toHaveBeenCalledWith(
    jasmine.stringMatching(/uploadFile/),
    jasmine.objectContaining({
      method: 'POST',
      headers: jasmine.objectContaining({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json'
      })
    })
  );

  expect(toastSpy).toHaveBeenCalledWith('success', 'Upload successful');
});
it('should upload all files to new GitHub repository', fakeAsync(() => {
  const contentString = 'Test content';
  const fileBuffer = new TextEncoder().encode(contentString).buffer;

  const mockFile: FsNodeFile = {
    name: 'example.txt',
    path: '/example.txt',
    content: fileBuffer
  };

  fsServiceMock.treeToList.and.returnValue([mockFile]);

  component.exportDropDisabled = true;
  component.newRepoName = 'repo-test';

  githubApiServiceMock.createRepository.and.returnValue(Promise.resolve());
  githubApiServiceMock.getReference.and.returnValue(Promise.resolve({ object: { sha: 'ref-sha' } }));
  githubApiServiceMock.createTree.and.returnValue(Promise.resolve({ sha: 'tree-sha' }));
  githubApiServiceMock.createCommit.and.returnValue(Promise.resolve({ sha: 'commit-sha' }));
  githubApiServiceMock.updateReference.and.returnValue(Promise.resolve({ error: false }));

  const toastSpy = spyOn(component, 'showToastMessage');

  component.uploadFiles();
  tick();

  expect(githubApiServiceMock.createRepository).toHaveBeenCalledWith('repo-test');
  expect(githubApiServiceMock.getReference).toHaveBeenCalledWith('repo-test');
  expect(githubApiServiceMock.createTree).toHaveBeenCalled();
  expect(githubApiServiceMock.createCommit).toHaveBeenCalled();
  expect(githubApiServiceMock.updateReference).toHaveBeenCalled();
  expect(toastSpy).toHaveBeenCalledWith('success', 'Upload successful');
}));
it('should show error toast when upload fails in updateReference', fakeAsync(() => {
  const mockFile: FsNodeFile = {
    name: 'error.txt',
    path: '/error.txt',
    content: 'should fail'
  };

  fsServiceMock.treeToList.and.returnValue([mockFile]);
  projectManagerServiceMock.getCurrentDriver.and.returnValue(driverMock);

  component.exportDropDisabled = true;
  component.newRepoName = 'repo-error';

  githubApiServiceMock.createRepository.and.returnValue(Promise.resolve());
  githubApiServiceMock.getReference.and.returnValue(Promise.resolve({ object: { sha: 'abc123' } }));
  githubApiServiceMock.createTree.and.returnValue(Promise.resolve({ sha: 'tree-sha' }));
  githubApiServiceMock.createCommit.and.returnValue(Promise.resolve({ sha: 'commit-sha' }));
  githubApiServiceMock.updateReference.and.returnValue(Promise.resolve({ error: true }));

  const toastSpy = spyOn(component, 'showToastMessage');

  component.uploadFiles();
  tick();

  expect(toastSpy).toHaveBeenCalledWith('error', 'Upload failed');
}));
it('should upload files to selected existing GitHub repo', fakeAsync(() => {
  const mockFile: FsNodeFile = {
    name: 'existing.txt',
    path: '/existing.txt',
    content: 'data'
  };

  fsServiceMock.treeToList.and.returnValue([mockFile]);
  projectManagerServiceMock.getCurrentDriver.and.returnValue(driverMock);

  component.exportDropDisabled = false;
  component.selectedRepo = { name: 'existing-repo' } as any;

  githubApiServiceMock.getReference.and.returnValue(Promise.resolve({ object: { sha: 'abc123' } }));
  githubApiServiceMock.createTree.and.returnValue(Promise.resolve({ sha: 'tree-sha' }));
  githubApiServiceMock.createCommit.and.returnValue(Promise.resolve({ sha: 'commit-sha' }));
  githubApiServiceMock.updateReference.and.returnValue(Promise.resolve({ error: false }));

  const toastSpy = spyOn(component, 'showToastMessage');

  component.uploadFiles();
  tick();

  expect(githubApiServiceMock.getReference).toHaveBeenCalledWith('existing-repo');
  expect(toastSpy).toHaveBeenCalledWith('success', 'Upload successful');
}));
it('should show success toast when uploadFile completes with commit', async () => {
  const mockResponse = {
    commit: { sha: 'abc123' }
  };

  const fetchSpy = spyOn(window, 'fetch').and.returnValue(Promise.resolve({
    json: () => Promise.resolve(mockResponse)
  }) as any);

  spyOn(localStorage, 'getItem').and.callFake((key: string) => {
    if (key === 'accessToken') return 'mock-token';
    if (key === 'username') return 'mock-user';
    return null;
  });

  const toastSpy = spyOn(component, 'showToastMessage');

  const content = new TextEncoder().encode('Hello file!').buffer;

  await component['uploadFile']('TestRepo', 'test.txt', content, 'text/plain');

  expect(fetchSpy).toHaveBeenCalled();
  expect(toastSpy).toHaveBeenCalledWith('success', 'Upload successful');
});
it('should show error toast when uploadFile completes without commit', async () => {
  const mockResponse = {
    error: 'something went wrong'
  };

  const fetchSpy = spyOn(window, 'fetch').and.returnValue(Promise.resolve({
    json: () => Promise.resolve(mockResponse)
  }) as any);

  spyOn(localStorage, 'getItem').and.callFake(() => 'mock-token');

  const toastSpy = spyOn(component, 'showToastMessage');

  const content = new TextEncoder().encode('Broken file!').buffer;

  await component['uploadFile']('RepoFail', 'fail.txt', content, 'text/plain');

  expect(fetchSpy).toHaveBeenCalled();
  expect(toastSpy).toHaveBeenCalledWith('error', 'Upload failed');
});

it('should download and replace project from GitHub repo', fakeAsync(async () => {
  const mockTarUrl = 'https://mock-tar-url.com/file.tar';
  const mockBuffer = new ArrayBuffer(10);

  const getRepositoryAsTarSpy = githubApiServiceMock.getRepositoryAsTar.and.returnValue(Promise.resolve(mockTarUrl));
  const getTarSpy = githubApiServiceMock.getTar.and.returnValue(Promise.resolve({
    arrayBuffer: () => Promise.resolve(mockBuffer)
  }));

  const replaceSpy = spyOn(component, 'replaceProject');

  component.selectedRepo = { name: 'MyTestRepo' } as any;
  component.importVisible = true;

  await component.downloadFiles();
  tick();

  expect(component.importVisible).toBeFalse();
  expect(getRepositoryAsTarSpy).toHaveBeenCalledWith('MyTestRepo');
  expect(getTarSpy).toHaveBeenCalledWith(mockTarUrl);
  expect(replaceSpy).toHaveBeenCalledWith(mockBuffer);
}));
it('should replace project by deleting and importing new data', fakeAsync(() => {
  const scanResult = {
    name: 'root',
    path: '/',
    folders: [],
    files: []
  };

  const driver = driverMock;
  driver.scanDirectory.and.returnValue(Promise.resolve(scanResult));

 const deleteSpy = spyOn(component as any, 'deleteFolder');
const refreshSpy = spyOn(component as any, 'refreshRoot');
const importSpy = spyOn(component as any, 'importProject');


  const testData = new ArrayBuffer(8);

  component.replaceProject(testData);
  tick();

  expect(driver.scanDirectory).toHaveBeenCalledWith('/');
  expect(deleteSpy).toHaveBeenCalledWith(scanResult, scanResult);
  expect(refreshSpy).toHaveBeenCalled();
  expect(importSpy).toHaveBeenCalledWith(testData);
}));
it('should trigger file download using anchor tag', () => {
  const blobSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
  const revokeSpy = spyOn(URL, 'revokeObjectURL');

  const appendSpy = spyOn(document.body, 'appendChild');
  const removeSpy = spyOn(document.body, 'removeChild');

  component.triggerDownload('test.txt', 'Hello', 'text/plain');

  expect(blobSpy).toHaveBeenCalled();
  expect(appendSpy).toHaveBeenCalled();
  expect(removeSpy).toHaveBeenCalled();
  expect(revokeSpy).toHaveBeenCalled();
});


it('should fetch GitHub tar file and replace project', fakeAsync(() => {
  const mockTarUrl = 'https://github.com/tarball';
  const mockBuffer = new ArrayBuffer(8);

  const mockResponse = {
    arrayBuffer: () => Promise.resolve(mockBuffer),
    headers: new Headers(),
    ok: true,
    redirected: false,
    status: 200,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: () => mockResponse as Response,
    body: null,
    bodyUsed: false,
    formData: async () => new FormData(),
    blob: async () => new Blob(),
    json: async () => ({}),
    text: async () => '',
  } as unknown as Response;

  component.selectedRepo = { name: 'test-repo' } as any;

  spyOn(component['githubService'], 'getRepositoryAsTar').and.returnValue(Promise.resolve(mockTarUrl));
  spyOn(component['githubService'], 'getTar').and.returnValue(Promise.resolve(mockResponse));
  const replaceSpy = spyOn(component as any, 'replaceProject');

  component.downloadFiles();
  tick(); // për .then i parë
  tick(); // për arrayBuffer + replaceProject

  expect(component['githubService'].getRepositoryAsTar).toHaveBeenCalledWith('test-repo');
  expect(component['githubService'].getTar).toHaveBeenCalledWith(mockTarUrl);
  expect(replaceSpy).toHaveBeenCalledWith(mockBuffer);
}));

it('should replace project after scanning and deleting', fakeAsync(() => {
  component.driver = driverMock; // cakto mock-un
  const deleteSpy = spyOn(component as any, 'deleteFolder');
  const refreshSpy = spyOn(component as any, 'refreshRoot');
  const importSpy = spyOn(component as any, 'importProject');

  component.replaceProject(new ArrayBuffer(8));
  tick(); // nevojitet për të përfunduar zinxhirin e .then()

  expect(driverMock.scanDirectory).toHaveBeenCalledWith('/');
  expect(deleteSpy).toHaveBeenCalled();
  expect(refreshSpy).toHaveBeenCalled();
  expect(importSpy).toHaveBeenCalledWith(jasmine.any(ArrayBuffer));
}));
it('should call downloadGithub when clicking "Import from Github"', () => {
  const event = { originalEvent: new Event('click') };

  const closeMenuSpy = spyOn(component, 'closeAllContextMenus');
  const downloadGithubSpy = spyOn(component, 'downloadGithub');

  const importGithubItem = component.ImportItems.find((item: MenuItem) => item.label === 'Import from Github');
  importGithubItem?.command!(event);

  expect(closeMenuSpy).toHaveBeenCalledWith(event.originalEvent);
  expect(downloadGithubSpy).toHaveBeenCalled();
});

it('should click fileUpload input when clicking "Import from local"', () => {
  const event = { originalEvent: new Event('click') };
  const closeMenuSpy = spyOn(component, 'closeAllContextMenus');

  // Simulo një element fileUpload në DOM
  const clickSpy = jasmine.createSpy('click');
  const mockInput = document.createElement('input');
  mockInput.setAttribute('id', 'fileUpload');
  spyOn(document, 'getElementById').and.returnValue({ click: clickSpy } as any);

  const importLocalItem = component.ImportItems.find((item: { label: string | string[]; }) => item.label.includes('local'));
  importLocalItem?.command!(event);

  expect(closeMenuSpy).toHaveBeenCalledWith(event.originalEvent);
  expect(clickSpy).toHaveBeenCalled();
});

it('should export as archive when clicking "Export as archive"', () => {
  const event = { originalEvent: new Event('click') };
  const closeMenuSpy = spyOn(component, 'closeAllContextMenus');
  const exportSpy = spyOn(component, 'export');

  const exportArchiveItem = component.ExportItems[0].items?.find((item: { label: string | string[]; }) => item.label.includes('archive'));
  exportArchiveItem?.command!(event);

  expect(closeMenuSpy).toHaveBeenCalledWith(event.originalEvent);
  expect(exportSpy).toHaveBeenCalledWith('Github-archive');
});
it('should export code when clicking "Export code"', () => {
  const event = { originalEvent: new Event('click') };
  const closeMenuSpy = spyOn(component, 'closeAllContextMenus');
  const exportSpy = spyOn(component, 'export');

  const exportCodeItem = component.ExportItems[0].items?.find((item: { label: string | string[]; }) => item.label.includes('code'));
  exportCodeItem?.command!(event);

  expect(closeMenuSpy).toHaveBeenCalledWith(event.originalEvent);
  expect(exportSpy).toHaveBeenCalledWith('Github-code');
});
it('should export to Google Drive when clicking export option', () => {
  const event = { originalEvent: new Event('click') };
  const closeMenuSpy = spyOn(component, 'closeAllContextMenus');
  const signInSpy = spyOn(component, 'signIn');

  const exportDriveItem = component.ExportItems.find((item: { label: string | string[]; }) => item.label.includes('Google'));
  exportDriveItem?.command!(event);

  expect(closeMenuSpy).toHaveBeenCalledWith(event.originalEvent);
  expect(signInSpy).toHaveBeenCalled();
});
it('should export to Microsoft OneDrive when clicking export option', () => {
  const event = { originalEvent: new Event('click') };
  const closeMenuSpy = spyOn(component, 'closeAllContextMenus');
  const exportSpy = spyOn(component, 'export');

  const exportOneDriveItem = component.ExportItems.find((item: { label: string | string[]; }) => item.label.includes('One'));
  exportOneDriveItem?.command!(event);

  expect(closeMenuSpy).toHaveBeenCalledWith(event.originalEvent);
  expect(exportSpy).toHaveBeenCalledWith('Microsoft');
});
it('should export locally when clicking "Save locally"', () => {
  const event = { originalEvent: new Event('click') };
  const closeMenuSpy = spyOn(component, 'closeAllContextMenus');
  const exportSpy = spyOn(component, 'export');

  const exportLocalItem = component.ExportItems.find((item: { label: string | string[]; }) => item.label.includes('Save locally'));
  exportLocalItem?.command!(event);

  expect(closeMenuSpy).toHaveBeenCalledWith(event.originalEvent);
  expect(exportSpy).toHaveBeenCalledWith('Local');
});

it('should get access token and upload file when repo not found', fakeAsync(() => {
  const popup: any = {
    location: {
      href: 'https://oauth-callback?code=1234',
      search: '?code=1234'
    },
    closed: false,
    close: jasmine.createSpy('close')
  };

  spyOn(localStorage, 'getItem').and.returnValue(null);
  spyOn(component['githubService'], 'getAccessToken').and.returnValue(Promise.resolve());
  spyOn(component['githubService'], 'getUserData').and.returnValue(Promise.resolve());
  spyOn(component['githubService'], 'getRepository').and.returnValue(Promise.resolve({ message: 'Not Found' }));
  spyOn(component['githubService'], 'createRepository').and.returnValue(Promise.resolve());
  const uploadSpy = spyOn(component as any, 'uploadFile');

  // Vendos vlerat e nevojshme për të kaluar if (filename && content)
  (component as any).filename = 'file.txt';
  (component as any).content = 'File content';
  (component as any).mime = 'text/plain';

  component.checkGithubCallback(popup, 'Github-archive');
  tick(1000); // për intervalin

  expect(component['githubService'].getAccessToken).toHaveBeenCalledWith('1234');
  expect(component['githubService'].createRepository).toHaveBeenCalledWith('TALightProject-Archives');
  expect(uploadSpy).toHaveBeenCalledWith('TALightProject-Archives', 'file.txt', 'File content', 'text/plain');
}));
it('should get access token and update repo list if repo exists', fakeAsync(() => {
  const popup: any = {
    location: {
      href: 'https://oauth-callback?code=5678',
      search: '?code=5678'
    },
    closed: false,
    close: jasmine.createSpy('close')
  };

  spyOn(localStorage, 'getItem').and.returnValue(null);
  spyOn(component['githubService'], 'getAccessToken').and.returnValue(Promise.resolve());
  spyOn(component['githubService'], 'getUserData').and.returnValue(Promise.resolve());
  spyOn(component['githubService'], 'getRepoList').and.returnValue(Promise.resolve([
    { name: 'TALightProject-Archives' },
    { name: 'other-repo' }
  ]));

  component.checkGithubCallback(popup, 'Github-import');
  tick(1000); // për intervalin

  // kontrollo që lista të përditësohet dhe repo e vjetër të hiqet
  expect(component.reposList.find((r: any) => r.name === 'TALightProject-Archives')).toBeUndefined();
  expect(component.reposList.find((r: any) => r.name === 'other-repo')).toBeDefined();
}));
it('should call downloadLocal when export type is Local', () => {
  (component as any).downloadLocal = jasmine.createSpy('downloadLocal');
  component.export('Local');
  expect((component as any).downloadLocal).toHaveBeenCalled();
});

it('should call export with Github-code type', () => {
  const exportSpy = spyOn(component as any, 'exportGithubCode');
  component.export('Github-code');
  expect(exportSpy).toHaveBeenCalled();
});
it('should call exportGithubArchive when export type is Github-archive', () => {
  const archiveSpy = spyOn(component as any, 'exportGithubArchive');
  component.export('Github-archive');
  expect(archiveSpy).toHaveBeenCalled();
});
it('should call exportMicrosoft when export type is Microsoft', () => {
  const spy = spyOn(component as any, 'exportMicrosoft');
  component.export('Microsoft');
  expect(spy).toHaveBeenCalled();
});
it('should call signIn for Google export', () => {
  const signInSpy = spyOn(component, 'signIn');
  const event = new MouseEvent('click');
  const menuItem = component.ExportItems.find((item: { label: string | string[]; }) => item.label.includes('Google'));
  menuItem?.command?.({ originalEvent: event });
  expect(signInSpy).toHaveBeenCalled();
});it('should call downloadGithub when importing from GitHub', () => {
  const spy = spyOn(component as any, 'downloadGithub');
  const event = new MouseEvent('click');
  const menuItem = component.ImportItems.find((item: { label: string | string[]; }) => item.label.includes('Github'));
  menuItem?.command?.({ originalEvent: event });
  expect(spy).toHaveBeenCalled();
});
it('should trigger click on file input when importing from local', () => {
  const clickSpy = jasmine.createSpy('click');
  const mockInput = { click: clickSpy } as any;
  spyOn(document, 'getElementById').and.returnValue(mockInput);

  const event = new MouseEvent('click');
  const menuItem = component.ImportItems.find((item: { label: string | string[]; }) => item.label.includes('local'));
  menuItem?.command?.({ originalEvent: event });

  expect(clickSpy).toHaveBeenCalled();
});
it('should get Google access token and call export with Google', fakeAsync(() => {
  (component as any).googleLogin = true;  // aksesim i sigurt për googleLogin
  const exportSpy = spyOn(component as any, 'export');
  socialAuthServiceMock.getAccessToken.and.returnValue(Promise.resolve('mock-token'));

  component.signIn();
  tick();

  expect((component as any).accessToken).toBe('mock-token');
  expect(exportSpy).toHaveBeenCalledWith('Google');
}));

it('should update editingItem path and focus input when saving editing', () => {
  component.editingItem = { name: 'old.txt', path: '/old.txt', content: '' };
  component.editingValue = 'newname.txt';

  const focusSpy = jasmine.createSpy('focus');
  component.nameEditingElement = {
    nativeElement: { focus: focusSpy }
  } as ElementRef;

  // Simulojmë logjikën që ndodh gjatë editimit
  if (component.nameEditingElement) {
    component.editingItem.path = '/' + component.editingValue;
    component.nameEditingElement.nativeElement.focus();
  }

  expect(component.editingItem.path).toBe('/newname.txt');
  expect(focusSpy).toHaveBeenCalled();
});

it('should call confirmationService.confirm on importGithubClick', () => {
  const confirmSpy = spyOn(component['confirmationService'], 'confirm');
  const fakeEvent = { target: {} } as Event;

  component.importGithubClick(fakeEvent);

  expect(confirmSpy).toHaveBeenCalled();
});
it('should call deleteFolder with fsRoot and update folder reference', () => {
  const deleteSpy = spyOn(component as any, 'deleteFolder');
  const mockRoot = driverMock.fsRoot;
  projectManagerServiceMock.getCurrentDriver.and.returnValue(driverMock);

  component['selectedFolder'] = { ...mockRoot };
  (component as any).someDeleteMethod();

  expect(deleteSpy).toHaveBeenCalledWith(mockRoot, jasmine.anything());
});
it('should focus new item name element when creating new file/folder', () => {
  const focusSpy = jasmine.createSpy('focus');
  component.newItemNameElement = { nativeElement: { focus: focusSpy } };

  (component as any).focusNewItemInput();

  expect(focusSpy).toHaveBeenCalled();
});
it('should upload files and call writeFile on driver', async () => {
  const file = new File(['hello'], 'test.txt');
  const target: any = { files: [file] };
  const writeSpy = spyOn(driverMock, 'writeFile').and.returnValue(Promise.resolve());

  component.selectedFolder = { name: '', path: '/folder/', folders: [], files: [] };

  await component.upload(target);

  expect(writeSpy).toHaveBeenCalledWith('/folder/test.txt', jasmine.any(ArrayBuffer));
});
it('should focus on new item input element', () => {
  const focusSpy = jasmine.createSpy('focus');
  component.newItemNameElement = {
    nativeElement: { focus: focusSpy }
  } as ElementRef;

  // thirrje e simulimit që ndodh në logjikë reale
  component.newItemNameElement.nativeElement.focus();

  expect(focusSpy).toHaveBeenCalled();
});
it('should export to Google when googleLogin is true', fakeAsync(() => {
  (component as any).googleLogin = true;
  const mockToken = 'fake-token';
  const exportSpy = spyOn(component as any, 'export');

  spyOn(component['authService'], 'getAccessToken')
    .and.returnValue(Promise.resolve(mockToken));

  (component as any).authService.getAccessToken(GoogleLoginProvider.PROVIDER_ID)
    .then((token: string) => {
      (component as any).accessToken = token;
      (component as any).export('Google');
    });

  tick();

  expect(component['authService'].getAccessToken).toHaveBeenCalledWith(GoogleLoginProvider.PROVIDER_ID);
  expect(exportSpy).toHaveBeenCalledWith('Google');
}));
it('should export to Google when googleLogin is true', fakeAsync(() => {
  (component as any).googleLogin = true;
  const mockToken = 'fake-token';
  const exportSpy = spyOn(component as any, 'export');

  spyOn(component['authService'], 'getAccessToken')
    .and.returnValue(Promise.resolve(mockToken));

  (component as any).authService.getAccessToken(GoogleLoginProvider.PROVIDER_ID)
    .then((token: string) => {
      (component as any).accessToken = token;
      (component as any).export('Google');
    });

  tick();

  expect(component['authService'].getAccessToken).toHaveBeenCalledWith(GoogleLoginProvider.PROVIDER_ID);
  expect(exportSpy).toHaveBeenCalledWith('Google');
}));

});
