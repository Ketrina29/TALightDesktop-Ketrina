import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { FormsModule } from '@angular/forms';
import { MonacoEditorWidgetComponent } from './monaco-editor-widget.component';
import { FsNodeFile } from '../../../services/fs-service/fs.service.types';

describe('MonacoEditorWidgetComponent', () => {
  let component: MonacoEditorWidgetComponent;
  let fixture: ComponentFixture<MonacoEditorWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MonacoEditorWidgetComponent],
      imports: [
        FormsModule, MonacoEditorModule.forRoot({
    baseUrl: 'assets', 
    defaultOptions: { scrollBeyondLastLine: false },
    onMonacoLoad: () => {}
  })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MonacoEditorWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should update editor options on init', () => {
  const spy = spyOn(component, 'updateEditorOptions');
  component.ngOnInit();
  expect(spy).toHaveBeenCalled();
});
it('should update editor options on changes', () => {
  const spy = spyOn(component, 'updateEditorOptions');
  component.ngOnChanges();
  expect(spy).toHaveBeenCalled();
});

it('should load file and set value correctly', () => {
  const mockFile: FsNodeFile = {
    name: 'file.py',
    path: '/file.py',
    content: 'print("Hello")',
  };

  component.selectedFile = mockFile;
  fixture.detectChanges();

  expect(component.selectedFile).toEqual(mockFile);
});

it('should set file content when file is selected', () => {
  const mockFile: FsNodeFile = {
    name: 'file.txt',
    path: '/file.txt',
    content: 'initial'
  };

  component['\_selectedFile'] = mockFile; // ⬅️ setter does not test here
  const newText = 'updated content';

  component.setFileContent(newText);

  expect(component['\_selectedFile']?.content).toBe(newText);
});
it('should set value if text is different in writeValue', () => {
  component['value'] = 'old';
  component.writeValue('new');
  expect(component['value']).toBe('new');
});

it('should not change value if text is the same in writeValue', () => {
  component['value'] = 'same';
  component.writeValue('same');
  expect(component['value']).toBe('same');
});

it('should register onChange callback', () => {
  const callback = jasmine.createSpy('onChange');
  component.registerOnChange(callback);
  (component as any).onChangeCallback();
  expect(callback).toHaveBeenCalled();
});

it('should register onTouched callback', () => {
  const callback = jasmine.createSpy('onTouched');
  component.registerOnTouched(callback);
  (component as any).onTouchedCallback();
  expect(callback).toHaveBeenCalled();
});
it('should call callbacks and emit selectedFile in didChange', () => {
  const mockFile: FsNodeFile = {
    name: 'code.py',
    path: '/code.py',
    content: 'print("hi")'
  };

  component.selectedFile = mockFile;
  const onChangeSpy = jasmine.createSpy();
  const onTouchedSpy = jasmine.createSpy();
  component.registerOnChange(onChangeSpy);
  component.registerOnTouched(onTouchedSpy);

  spyOn(component.onChange, 'emit');

  component.didChange();

  expect(onChangeSpy).toHaveBeenCalled();
  expect(onTouchedSpy).toHaveBeenCalled();
  expect(component.onChange.emit).toHaveBeenCalledWith(mockFile);
});
it('should call callbacks but not emit if no selectedFile in didChange', () => {
  component['selectedFile'] = null;
  const onChangeSpy = jasmine.createSpy();
  const onTouchedSpy = jasmine.createSpy();
  component.registerOnChange(onChangeSpy);
  component.registerOnTouched(onTouchedSpy);

  spyOn(component.onChange, 'emit');

  component.didChange();

  expect(onChangeSpy).toHaveBeenCalled();
  expect(onTouchedSpy).toHaveBeenCalled();
  expect(component.onChange.emit).not.toHaveBeenCalled();
});

});
