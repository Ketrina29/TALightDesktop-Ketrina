import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopbarWidgetComponent } from './topbar-widget.component';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TabMenuModule } from 'primeng/tabmenu';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('TopbarWidgetComponent', () => {
  let component: TopbarWidgetComponent;
  let fixture: ComponentFixture<TopbarWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopbarWidgetComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        DropdownModule,
        DialogModule,
        TabMenuModule,
        ButtonModule,
        InputTextModule,
        TooltipModule
      ],
      providers: [
        { provide: 'ThemeService', useValue: { currentTheme: of('light'), toggleTheme: () => {} } },
        { provide: 'ProjectManagerService', useValue: jasmine.createSpyObj('ProjectManagerService', ['getProject', 'loadProject']) },
        { provide: 'CompilerService', useValue: jasmine.createSpyObj('CompilerService', ['compile']) },
        { provide: 'TutorialService', useValue: jasmine.createSpyObj('TutorialService', ['closeTutorial']) },
        { provide: 'ApiService', useValue: jasmine.createSpyObj('ApiService', ['updateState']) },
        { provide: 'MessageService', useValue: jasmine.createSpyObj('MessageService', ['add']) },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should call toggleTheme on themeService', () => {
  const spy = spyOn(component.themeService, 'toggleTheme');
  component.toggleTheme();
  expect(spy).toHaveBeenCalled();
});
it('should open and close add project dialog', () => {
  component.openAddProjectDialog();
  expect(component.addProjectDialogVisible).toBeTrue();

  component.cancelAddProject();
  expect(component.addProjectDialogVisible).toBeFalse();
});
it('should not confirm add project if name or language is missing and show warning', () => {
  component.newProjectName = '';
  component.selectedLanguage = '';
  const spy = spyOn(component, 'showNotification');
  component.confirmAddProject();
  expect(spy).toHaveBeenCalled();
});
it('should not confirm add project if max projects reached and show warning', () => {
  component.items = Array(10).fill({ id: 'id', label: 'test', language: 'python' });
  component.newProjectName = 'Prova';
  component.selectedLanguage = 'python';
  const spy = spyOn(component, 'showNotification');
  component.confirmAddProject();
  expect(spy).toHaveBeenCalled();
});
it('should confirm add project correctly', () => {
  component.newProjectName = 'TestProject';
  component.selectedLanguage = 'python';
  component.items = [];
  component.confirmAddProject();
  expect(component.items.length).toBe(1);
  expect(component.addProjectDialogVisible).toBeFalse();
});

it('should call deleteProject if confirmation is given', () => {
  spyOn(window, 'confirm').and.returnValue(true);
  const spy = spyOn(component, 'deleteProject');
  component.confirmDeleteProject('abc');
  expect(spy).toHaveBeenCalledWith('abc');
});

it('should not delete project if confirmation is cancelled', () => {
  spyOn(window, 'confirm').and.returnValue(false);
  const spy = spyOn(component, 'deleteProject');
  component.confirmDeleteProject('abc');
  expect(spy).not.toHaveBeenCalled();
});
it('should show tutorial by calling tutorialService', () => {
  const spy = spyOn(component['tutorialService'], 'nextTutorial');
  component.showTutorial();
  expect(spy).toHaveBeenCalledWith(-1);
});
it('should generate unique id', () => {
  const id = component.generateUniqueId();
  expect(typeof id).toBe('string');
  expect(id.length).toBeGreaterThan(0);
});

it('should load projects from localStorage when loadProjects is called', () => {
  const projects = [{ id: '123', label: 'Loaded', language: 'js' }];
  spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(projects));
  component.loadProjects();
  expect(component.items.length).toBe(1);
});

it('should load projects from localStorage when loadProjects is called', () => {
  const projects = [{ id: '123', label: 'Loaded', language: 'js' }];
  spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(projects));
  component.loadProjects();
  expect(component.items.length).toBe(1);
});
it('should handle drag and drop to reorder tabs', () => {
  const item1 = { id: '1' }, item2 = { id: '2' };
  component.items = [item1, item2];
  component.draggedTab = item2;

  const event = new DragEvent('drop');
  Object.defineProperty(event, 'preventDefault', { value: () => {}, writable: true });

  component.onDrop(event, item1);

  expect(component.items[0]).toBe(item2);
});

});
