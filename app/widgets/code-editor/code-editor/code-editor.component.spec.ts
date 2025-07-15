import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodeEditorComponent } from './code-editor.component';
import { NO_ERRORS_SCHEMA, EventEmitter, ElementRef } from '@angular/core';
import { of } from 'rxjs';
import { CompilerService } from '../../../services/compiler-service/compiler-service.service';
import { CompilerState } from '../../../services/compiler-service/compiler-service.types';
import { OutputWidgetComponent, OutputType } from '../output-widget/output-widget.component';
import { ProjectDriver } from '../../../services/project-manager-service/project-manager.types';
import { FsService } from '../../../services/fs-service/fs.service';
import { ProjectManagerService } from '../../../services/project-manager-service/project-manager.service';


describe('CodeEditorComponent', () => {
  let component: CodeEditorComponent;
  let fixture: ComponentFixture<CodeEditorComponent>;
  let outputWidgetSpy: jasmine.SpyObj<OutputWidgetComponent>;
  let mockProjectDriver: jasmine.SpyObj<ProjectDriver>;

  beforeEach(async () => {
    mockProjectDriver = jasmine.createSpyObj('ProjectDriver', [
      'subscribeNotify', 'subscribeState', 'subscribeStdout', 'subscribeStderr',
      'stopExecution', 'writeFile', 'createDirectory', 'sendStdin'
    ]);
    mockProjectDriver.eventsSubscribed = false;
    mockProjectDriver.onWorkerReady = new EventEmitter();
    mockProjectDriver.isWorkerReady = false;
    mockProjectDriver.createDirectory.and.returnValue(Promise.resolve(true));
    mockProjectDriver.writeFile.and.returnValue(Promise.resolve(0));
    mockProjectDriver.sendStdin.and.returnValue(Promise.resolve(true));
    mockProjectDriver.stopExecution.and.returnValue(Promise.resolve(true));
    mockProjectDriver.subscribeState.and.callFake(() => Promise.resolve(true));

    const compilerServiceSpy = jasmine.createSpyObj('CompilerService', ['get', 'getCompilerState']);
    compilerServiceSpy.get.and.returnValue(mockProjectDriver);
    compilerServiceSpy.getCompilerState.and.returnValue(of(CompilerState.Unknown));

    outputWidgetSpy = jasmine.createSpyObj('OutputWidgetComponent', [
      'enableStdin', 'print', 'didStateChange'
    ], {
      onInput: new EventEmitter<any>(),
      onStdin: new EventEmitter<string>(),
      output: { nativeElement: document.createElement('div') } as ElementRef
    });

    const fsServiceSpy = jasmine.createSpyObj('FsService', ['treeToList']);
    fsServiceSpy.treeToList.and.returnValue([]);

    const projectManagerServiceSpy = jasmine.createSpyObj('ProjectManagerService', [
      'getCurrentProjectId', 'getCurrentProject', 'runProject', 'stopExecution', 'getCurrentDriver'
    ]);
    projectManagerServiceSpy.getCurrentDriver.and.returnValue(mockProjectDriver);
    projectManagerServiceSpy.currentProjectChanged = new EventEmitter<any>();
    projectManagerServiceSpy.getCurrentProject.and.returnValue({
      config: { RUN: '/path/to/main.py', TAL_SERVER: 'mock-server', TAL_TOKEN: 'mock-token' },
      files: []
    } as any);
    projectManagerServiceSpy.runProject.and.returnValue(Promise.resolve('project_run_success'));

    await TestBed.configureTestingModule({
      declarations: [CodeEditorComponent],
      providers: [
        { provide: CompilerService, useValue: compilerServiceSpy },
        { provide: FsService, useValue: fsServiceSpy },
        { provide: ProjectManagerService, useValue: projectManagerServiceSpy },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CodeEditorComponent);
    component = fixture.componentInstance;
    component.outputWidget = outputWidgetSpy;

    fixture.detectChanges();
    mockProjectDriver.onWorkerReady.emit();
  });



it('should create the component and call enableStdin', () => {
  component.outputWidget = outputWidgetSpy;
  component.ngAfterViewInit(); 
  expect(component).toBeTruthy();
  expect(outputWidgetSpy.enableStdin).toHaveBeenCalledWith(false);
});


  it('should update pyodideState and call didStateChange', () => {
    component.outputWidget = outputWidgetSpy;
    (component as any).didStateChange(CompilerState.Ready, 'Test Content');
    expect(component.pyodideState).toBe(CompilerState.Ready);
    expect(component.pyodideStateContent).toBe('Test Content');
    expect(outputWidgetSpy.didStateChange).toHaveBeenCalledWith(CompilerState.Ready, 'Test Content');
  });

 it('should send stdin lines and disable input after sendStdin', async () => {
 
  component.pyodideState = CompilerState.Ready;

  component.outputWidget = outputWidgetSpy;

  outputWidgetSpy.print.and.stub();
  outputWidgetSpy.enableStdin.and.stub();

  const input = 'line1\nline2\n';

  await component.sendStdin(input, false);


  expect(mockProjectDriver.sendStdin).toHaveBeenCalledWith('line1');
  expect(mockProjectDriver.sendStdin).toHaveBeenCalledWith('line2');


  expect(outputWidgetSpy.print).toHaveBeenCalledWith('line1', OutputType.STDIN);
  expect(outputWidgetSpy.print).toHaveBeenCalledWith('line2', OutputType.STDIN);

  expect(outputWidgetSpy.enableStdin).toHaveBeenCalledWith(false);
});


  it('should send stdin from API and call print with OutputType.STDINAPI', async () => {
  component.outputWidget = outputWidgetSpy;
  
  await component.sendStdin('apiLine1\napiLine2', true); // <-- `await` 
  
  expect(outputWidgetSpy.print).toHaveBeenCalledWith('apiLine1', OutputType.STDINAPI);
  expect(outputWidgetSpy.print).toHaveBeenCalledWith('apiLine2', OutputType.STDINAPI);
  expect(outputWidgetSpy.enableStdin).toHaveBeenCalledWith(false);
});


  it('should not call print or disableStdin when msg is empty in sendStdin', async () => {
    component.outputWidget = outputWidgetSpy;
    await component.sendStdin('', false);
    expect(outputWidgetSpy.print).not.toHaveBeenCalled();
    expect(outputWidgetSpy.enableStdin).toHaveBeenCalled();
  });

  it('should not fail if outputWidget is undefined in sendStdin', () => {
    component.outputWidget = undefined as any;
    expect(() => component.sendStdin('input')).not.toThrow();
  });

  it('should not fail if outputWidget is undefined in didStateChange', () => {
    component.outputWidget = undefined as any;
    (component as any).didStateChange(CompilerState.Unknown, 'Message');
    expect(component.pyodideState).toBe(CompilerState.Unknown);
    expect(component.pyodideStateContent).toBe('Message');
  });

  it('should not fail if outputWidget is undefined in didNotify', () => {
    component.outputWidget = undefined as any;
    expect(() => component.didNotify('Test message')).not.toThrow();
  });

  it('should not fail in ngAfterViewInit if outputWidget is undefined', () => {
    component.outputWidget = undefined as any;
    expect(() => component.ngAfterViewInit()).not.toThrow();
  });
  
  it('should handle onAttachments correctly and call refreshRoot', async () => {
  // Mock for window.Tar.unpack
  const unpackSpy = jasmine.createSpy('unpack').and.returnValue([
    {
      name: 'file1.py',
      content: new ArrayBuffer(8),
      path: 'folder1'
    }
  ]);
  (window as any).Tar = { unpack: unpackSpy };

  // Mock for fileExplorer and selectedProblem
  (component as any).fileExplorer = {
    refreshRoot: jasmine.createSpy('refreshRoot')
  };
  (component as any).selectedProblem = { name: 'problem1' };


  await (component as any).onAttachments(new ArrayBuffer(8), 'problemWidget');

expect(mockProjectDriver.writeFile).toHaveBeenCalledWith(
  '/data/folder1/file1.py',
  jasmine.any(ArrayBuffer)
);

  expect(mockProjectDriver.createDirectory).toHaveBeenCalledWith('/data');
expect(mockProjectDriver.createDirectory).toHaveBeenCalledWith('/data/folder1');
expect(mockProjectDriver.writeFile).toHaveBeenCalledWith('/data/folder1/file1.py', jasmine.any(ArrayBuffer));

  expect((component as any).fileExplorer.refreshRoot).toHaveBeenCalled();
});
it('should call outputWidget.print in didNotify', () => {
  component.outputWidget = outputWidgetSpy;
  component.didNotify('Hello World');

  expect(outputWidgetSpy.print).toHaveBeenCalledWith('Hello World');
});

it('should call onUpdateRoot without error', () => {
  expect(() => component.onUpdateRoot({})).not.toThrow();
});

it('should call selectFile without error', () => {
  expect(() => component.selectFile({})).not.toThrow();
});

it('should call onFileDeleted without error', () => {
  expect(() => component.onFileDeleted({})).not.toThrow();
});

it('should call onItemRenamed without error', () => {
  expect(() => component.onItemRenamed({})).not.toThrow();
});

it('should call runProjectLocal without error', () => {
  expect(() => component.runProjectLocal()).not.toThrow();
});

it('should call stopAll without error', () => {
  expect(() => component.stopAll()).not.toThrow();
});

it('should call runConnectAPI without error', () => {
  expect(() => component.runConnectAPI()).not.toThrow();
});

it('should call editorDidChange without error', () => {
  expect(() => component.editorDidChange({})).not.toThrow();
});

it('should call onProblemChanged without error', () => {
  expect(() => component.onProblemChanged({})).not.toThrow();
});

it('should call onServiceChanged without error', () => {
  expect(() => component.onServiceChanged({})).not.toThrow();
});

it('should call onProblemListChanged without error', () => {
  expect(() => component.onProblemListChanged()).not.toThrow();
});

it('should call changeWidget without error', () => {
  expect(() => component.changeWidget(1)).not.toThrow();
});

});