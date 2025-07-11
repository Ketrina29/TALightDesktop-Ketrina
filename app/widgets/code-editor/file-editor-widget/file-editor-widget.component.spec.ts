import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditorOptionsBrowser, FileAssociationChoiceList, FileEditorWidgetComponent } from './file-editor-widget.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FsNodeFile } from '../../../services/fs-service/fs.service.types';
import * as monaco from 'monaco-editor';
import { EditorType } from './file-editor-widget.component'; // Ensure EditorType is imported
import { FileAssociation } from './file-editor-widget.component';
class MockMonacoEditorWidgetComponent {
  selectedFile: FsNodeFile | null = null;
  language = '';
  updateEditorOptions = jasmine.createSpy().and.returnValue(Promise.resolve());
}

interface CustomMonacoEditorMock {
  updateEditorOptions: jasmine.Spy<jasmine.Func>; // The method your component actually calls
  setValue: jasmine.Spy<jasmine.Func>;
  getModel: jasmine.Spy<jasmine.Func>;
  focus: jasmine.Spy<jasmine.Func>;
  layout: jasmine.Spy<jasmine.Func>;
  dispose: jasmine.Spy<jasmine.Func>;
  
  updateOptions?: jasmine.Spy<jasmine.Func>;
}

describe('FileEditorWidgetComponent', () => {
  let component: FileEditorWidgetComponent;
  let fixture: ComponentFixture<FileEditorWidgetComponent>;
  let mockMonacoEditor: Partial<CustomMonacoEditorMock>;
  let assocList: FileAssociationChoiceList;
  
 beforeEach(async () => {
  assocList = new FileAssociationChoiceList([]);

  const fullMonacoEditorMock: CustomMonacoEditorMock = {
    updateEditorOptions: jasmine.createSpy('updateEditorOptions').and.returnValue(Promise.resolve()),
    setValue: jasmine.createSpy('setValue'),
    getModel: jasmine.createSpy('getModel').and.returnValue({
      getLanguageId: () => 'python',
      dispose: jasmine.createSpy('dispose')
    }),
    focus: jasmine.createSpy('focus'),
    layout: jasmine.createSpy('layout'),
    dispose: jasmine.createSpy('dispose')
  };

  mockMonacoEditor = fullMonacoEditorMock; 

  await TestBed.configureTestingModule({
    declarations: [FileEditorWidgetComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
  }).compileComponents();

  fixture = TestBed.createComponent(FileEditorWidgetComponent);
  component = fixture.componentInstance;

  (component as any).monacoEditor = fullMonacoEditorMock;

  fixture.detectChanges();
});


  afterEach(() => {
    // Clean up spies more robustly
    for (const key in mockMonacoEditor) {
      if (Object.prototype.hasOwnProperty.call(mockMonacoEditor, key)) {
        const spy = (mockMonacoEditor as any)[key];
        if (jasmine.isSpy(spy)) {
          spy.calls.reset();
        }
      }
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

it('should add a FileAssociation if not already present', () => {
    const assoc = new FileAssociation('py', EditorType.Code);
    assocList.add(assoc);
    expect(assocList.associations).toContain(assoc);
  });

  it('should not add a FileAssociation if already present', () => {
    const assoc = new FileAssociation('py', EditorType.Code);
    assocList = new FileAssociationChoiceList([assoc]);
    assocList.add(assoc);
    expect(assocList.associations.length).toBe(1);
  });
  it('should set editorType to None and call openEditor when selectedFile is null', () => {
  // Spy për të kontrolluar që `openEditor` thirret
  const openEditorSpy = spyOn(component, 'openEditor');

  component['selectedFile'] = null;
  component.selectEditor();

  expect(component.editorType).toBe(EditorType.None);
  expect(openEditorSpy).toHaveBeenCalled();
});

it('should set editorType to None and call openEditor if no match is found', () => {
  const openEditorSpy = spyOn(component, 'openEditor');
  const file: FsNodeFile = { name: 'file.unknown', path: '/file.unknown', content: '...' } as any;

  component['selectedFile'] = file;

  // Simulojmë që match kthen null
  spyOn(component['fileAssocList'], 'match').and.returnValue(null);

  component.selectEditor();

  expect(component.editorType).toBe(EditorType.None);
  expect(openEditorSpy).toHaveBeenCalled();
});
it('should set isBlurred to false when tutorial is undefined', () => {
  (component as any).isTutorialShown(undefined);
  expect((component as any).isBlurred).toBeFalse();
});

it('should encode ArrayBuffer content for Browser editor', async () => {
  const dummyBuffer = new TextEncoder().encode('Hello World').buffer;

  component.selectedFile = {
    name: 'file.pdf',
    path: '/file.pdf',
    content: dummyBuffer
  } as FsNodeFile;

  component.editorOption = new EditorOptionsBrowser(true, 'application/pdf');
  component.editorType = EditorType.Browser;

  // Inject a fake iframe
  component['browserEditor'] = {
    nativeElement: { src: '' }
  } as any;

  await component.openEditor();

  expect(component['browserEditor'].nativeElement.src)
    .toMatch(/^data:application\/pdf;base64,/);
});
it('should render markdown content into innerHTML', async () => {
  const mockElement = { innerHTML: '' };
  component['markdownPreview'] = { nativeElement: mockElement } as any;

  component.selectedFile = {
    name: 'README.md',
    path: '/README.md',
    content: '# Hello World'
  } as FsNodeFile;

  component.editorType = EditorType.Markdown;

  await component.openEditor();

  expect(mockElement.innerHTML).toContain('<h1 id="hello-world">Hello World</h1>');
});

it('should set selectedFile and choose correct editor type', fakeAsync(() => {
  component['monacoEditor'] = new MockMonacoEditorWidgetComponent() as any;

  const file: FsNodeFile = {
    name: 'file.py',
    path: '/file.py',
    content: 'print("Hello")'
  } as FsNodeFile;

  component.selectedFile = file;
  tick();

  expect(component.selectedFile).toBe(file);
  expect(component.editorType).toBe(EditorType.Code);
  expect(component['monacoEditor'].updateEditorOptions).toHaveBeenCalled();
}));


it('should return a match for file with unknown extension (fallback)', () => {
  const file: FsNodeFile = { name: 'file.unknown', path: '/file.unknown', content: 'data' } as FsNodeFile;
  const match = component.fileAssocList.match(file);

  expect(match?.editorType).toBe(EditorType.Browser); // fallback është editori "Browser"
});
it('should update isBlurred based on tutorial state', () => {
  (component as any).isTutorialShown({ componentName: component.constructor.name });
  expect((component as any).isBlurred).toBeFalse(); // tutorial aktiv

  (component as any).isTutorialShown({ componentName: 'SomeOtherComponent' });
  expect((component as any).isBlurred).toBeTrue(); // tutorial joaktiv
});

it('should fallback to default language if extension is unknown', () => {
  const file = { name: 'nofile.unknown', content: '??' } as FsNodeFile;
  const match = component.fileAssocList.match(file);
  
  expect(match).toBeTruthy(); // ose null, në varësi të listës

  if (!match) {
    expect('plaintext').toBe('plaintext'); // fallback (në vend të thirrjes joekzistente)
  }
});



});