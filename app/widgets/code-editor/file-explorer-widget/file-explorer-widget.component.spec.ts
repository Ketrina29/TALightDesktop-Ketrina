import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TopbarWidgetComponent } from '../../topbar/topbar-widget/topbar-widget.component'; // Ensure correct relative path
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MenuItem } from 'primeng/api'; // Import MenuItem
import { FormsModule } from '@angular/forms'; // REQUIRED for ngModel
import { DropdownModule } from 'primeng/dropdown'; // Already there, good.
import { ButtonModule } from 'primeng/button'; // Likely REQUIRED for 'icon' property on buttons
import { ThemeService, AppTheme } from '../../../services/theme-service/theme.service';
import { ProblemManagerService } from '../../../services/problem-manager-service/problem-manager.service';
import { NotificationManagerService, NotificationMessage, NotificationType } from '../../../services/notification-mananger-service/notification-manager.service';
import { FsService } from '../../../services/fs-service/fs.service'; // Corrected path
import { ConfigService } from '../../../services/config-service/config.service';
import { TutorialService } from '../../../services/tutorial-service/tutorial.service';
import { ProjectManagerService } from '../../../services/project-manager-service/project-manager.service';
import { ApiService } from '../../../services/api-service/api.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';

import { BehaviorSubject, of } from 'rxjs'; // For mocking observables

// Define a custom interface that extends MenuItem to include the 'language' property
interface ProjectMenuItem extends MenuItem {
  language?: string; // Make language optional if it's not always present, or required if it always is
  id?: string; // Ensure id is also included as it's used
}

// Mock SocialAuthService as its full implementation is not provided
class MockSocialAuthService {
  authState = new BehaviorSubject(null);
  signIn() { return Promise.resolve({}); }
  signOut() { return Promise.resolve({}); }
}

describe('TopbarWidgetComponent', () => {
  let component: TopbarWidgetComponent;
  let fixture: ComponentFixture<TopbarWidgetComponent>;

  // Spies for services to isolate the component logic
  let themeServiceSpy: jasmine.SpyObj<ThemeService>;
  let problemManagerServiceSpy: jasmine.SpyObj<ProblemManagerService>;
  let notificationManagerServiceSpy: jasmine.SpyObj<NotificationManagerService>;
  let fsServiceSpy: jasmine.SpyObj<FsService>;
  let configServiceSpy: jasmine.SpyObj<ConfigService>;
  let tutorialServiceSpy: jasmine.SpyObj<TutorialService>;
  let projectManagerServiceSpy: jasmine.SpyObj<ProjectManagerService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;
  let socialAuthServiceSpy: jasmine.SpyObj<MockSocialAuthService>;

  beforeEach(async () => {
    // Initialize all spies with their methods and properties before configuring the testing module
    themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], { currentTheme: new BehaviorSubject<AppTheme>(AppTheme.light) });
    problemManagerServiceSpy = jasmine.createSpyObj('ProblemManagerService', ['someMethod']); // Replace with actual methods used
    notificationManagerServiceSpy = jasmine.createSpyObj('NotificationManagerService', ['showNotification']);
    fsServiceSpy = jasmine.createSpyObj('FsService', ['someMethod']); // Replace with actual methods used
    configServiceSpy = jasmine.createSpyObj('ConfigService', ['someMethod']); // Replace with actual methods used
    tutorialServiceSpy = jasmine.createSpyObj('TutorialService', ['showTutorial', 'closeTutorial']);
    projectManagerServiceSpy = jasmine.createSpyObj('ProjectManagerService', ['getProject', 'loadProject', 'someMethod']); // Replace with actual methods used
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['updateState']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    // Correctly mock socialAuthServiceSpy to have a BehaviorSubject property for authState
    socialAuthServiceSpy = jasmine.createSpyObj('MockSocialAuthService', ['signIn', 'signOut']);
    (socialAuthServiceSpy as any).authState = new BehaviorSubject(null); // Assign the BehaviorSubject directly

    await TestBed.configureTestingModule({
      declarations: [TopbarWidgetComponent],
      imports: [
        HttpClientTestingModule, // For testing components that inject HttpClient
        FormsModule, // Required for components using ngModel (two-way data binding)
        DropdownModule, // PrimeNG Dropdown component
        ButtonModule // PrimeNG Button component (if used with 'icon' property)
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA], // Allows for unknown elements in the template without compilation errors
      providers: [
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: ProblemManagerService, useValue: problemManagerServiceSpy },
        { provide: NotificationManagerService, useValue: notificationManagerServiceSpy },
        { provide: FsService, useValue: fsServiceSpy },
        { provide: ConfigService, useValue: configServiceSpy },
        { provide: TutorialService, useValue: tutorialServiceSpy },
        { provide: ProjectManagerService, useValue: projectManagerServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }, // Mock ActivatedRoute for queryParams
        { provide: MockSocialAuthService, useValue: socialAuthServiceSpy }, // Provide the mock SocialAuthService
      ]
    }).compileComponents(); // Compile the component and its template

    fixture = TestBed.createComponent(TopbarWidgetComponent);
    component = fixture.componentInstance;

    // Spy on localStorage methods to control their behavior and verify interactions
    spyOn(localStorage, 'setItem').and.callThrough();
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'projects') {
        return JSON.stringify([]); // Default to empty array for initial load to prevent side effects
      }
      return null; // Return null for other keys
    });

    fixture.detectChanges(); // Trigger initial change detection to bind data and run ngOnInit
  });

  afterEach(() => {
    localStorage.clear(); // Clear localStorage after each test to prevent test interference
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close add project dialog', () => {
    component.openAddProjectDialog();
    expect(component.addProjectDialogVisible).toBeTrue();
    expect(component.newProjectName).toBe('');
    expect(component.selectedLanguage).toBe('');

    component.cancelAddProject();
    expect(component.addProjectDialogVisible).toBeFalse();
  });

  it('should not confirm add project if name or language is missing and show warning', () => {
    spyOn(component, 'showNotification').and.callThrough(); // Spy on local method

    component.newProjectName = ''; // Simulate missing name
    component.selectedLanguage = ''; // Simulate missing language
    component.addProjectDialogVisible = true; // Ensure dialog is open initially

    component.confirmAddProject();

    // Expect a warning notification for missing information
    expect(component.showNotification).toHaveBeenCalledWith(jasmine.objectContaining({
      type: NotificationType.Warning,
      title: 'Informazioni Mancanti',
      message: 'Inserisci un nome progetto e seleziona una lingua.'
    }));
    expect(component.addProjectDialogVisible).toBeTrue(); // Dialog should remain open
    expect(component.items.length).toBe(0); // No project should be added
    expect(localStorage.setItem).not.toHaveBeenCalled(); // No save to localStorage as validation failed
  });

  it('should not confirm add project if max projects reached and show warning', () => {
    spyOn(component, 'showNotification').and.callThrough();
    // Pre-fill items to reach the maximum limit (e.g., 10 projects)
    component.items = Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, label: `Project${i}`, language: 'typescript' })) as ProjectMenuItem[];
    component.filteredItems = [...component.items]; // Keep filteredItems in sync

    component.newProjectName = 'New Project';
    component.selectedLanguage = 'java';
    component.addProjectDialogVisible = true;

    component.confirmAddProject();

    // Expect a warning notification for reaching the limit
    expect(component.showNotification).toHaveBeenCalledWith(jasmine.objectContaining({
      type: NotificationType.Warning,
      title: 'Limite raggiunto',
      message: 'Non puoi aggiungere più di 10 progetti.'
    }));
    expect(component.addProjectDialogVisible).toBeTrue(); // Dialog should remain open
    expect(component.items.length).toBe(10); // Number of projects should remain at the limit
    expect(localStorage.setItem).not.toHaveBeenCalled(); // No save to localStorage as validation failed
  });

  it('should confirm add project correctly', () => {
    component.newProjectName = 'Test Project';
    component.selectedLanguage = 'typescript';
    component.items = []; // Ensure the project list is empty to start

    component.confirmAddProject();

    expect(component.items.length).toBe(1); // One project should be added
    expect(component.items[0].label).toContain('Test Project (typescript)');
    expect((component.items[0] as ProjectMenuItem).language).toBe('typescript'); // Verify language property
    expect(component.activeItem).toEqual(component.items[0]); // New project should be active
    expect(component.addProjectDialogVisible).toBeFalse(); // Dialog should close
    expect(localStorage.setItem).toHaveBeenCalledWith('projects', JSON.stringify(component.items)); // Projects should be saved
  });

  it('should delete a project and update activeItem', () => {
    // Initialize with multiple projects
    component.items = [
      { id: '1', label: 'Project1', language: 'javascript' },
      { id: '2', label: 'Project2', language: 'typescript' },
      { id: '3', label: 'Project3', language: 'python' }
    ] as ProjectMenuItem[];
    component.filteredItems = [...component.items];
    component.activeItem = component.items[1]; // Set activeItem to Project2 (id: '2')

    component.deleteProject('2'); // Delete Project2

    expect(component.items.length).toBe(2); // Verify length after deletion
    expect(component.filteredItems.length).toBe(2);
    expect(component.items.some(item => item.id === '2')).toBeFalse(); // Verify Project2 is removed
    expect(component.activeItem).toEqual(component.items[0]); // Expect the first remaining item to become active
    expect(localStorage.setItem).toHaveBeenCalledWith('projects', JSON.stringify(component.items)); // Projects should be saved
  });

  it('should set activeItem to null if all projects are deleted', () => {
    component.items = [{ id: '1', label: 'Single Project', language: 'typescript' }] as ProjectMenuItem[];
    component.filteredItems = [...component.items];
    component.activeItem = component.items[0]; // Set the single project as active

    component.deleteProject('1'); // Delete the only project

    expect(component.items.length).toBe(0); // Projects list should be empty
    expect(component.filteredItems.length).toBe(0);
    expect(component.activeItem).toBeNull(); // Active item should be null
    expect(localStorage.setItem).toHaveBeenCalledWith('projects', '[]'); // localStorage should reflect empty array
  });

  it('should call deleteProject if confirmation is given', () => {
    // Spy on window.confirm and make it return true (user confirms)
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component, 'deleteProject'); // Spy on the component's internal method

    component.confirmDeleteProject('1');

    expect(component.deleteProject).toHaveBeenCalledWith('1'); // Verify deleteProject was called
    expect(window.confirm).toHaveBeenCalled(); // Verify the confirmation dialog was shown
  });

  it('should not delete project if confirmation is cancelled', () => {
    // Spy on window.confirm and make it return false (user cancels)
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(component, 'deleteProject');

    component.confirmDeleteProject('1');

    expect(component.deleteProject).not.toHaveBeenCalled(); // Verify deleteProject was NOT called
    expect(window.confirm).toHaveBeenCalled(); // Verify the confirmation dialog was shown
  });

  it('should show tutorial by calling tutorialService', () => {
    component.showTutorial();
    expect(tutorialServiceSpy.showTutorial).toHaveBeenCalled(); // Verify tutorialService.showTutorial was called
  });

  it('should generate unique id', () => {
    const id1 = component.generateUniqueId();
    const id2 = component.generateUniqueId();
    expect(id1).not.toEqual(id2); // IDs should be unique
    expect(typeof id1).toBe('string'); // Should be a string
    expect(id1.length).toBeGreaterThan(0); // Should not be empty
  });

  it('should save projects to localStorage when saveProjects is called', () => {
    component.items = [{ id: 'test1', label: 'Test1 (js)', language: 'javascript' }] as ProjectMenuItem[];
    component.saveProjects();
    expect(localStorage.setItem).toHaveBeenCalledWith('projects', JSON.stringify(component.items)); // Verify data saved to localStorage
  });

  it('should load projects from localStorage when loadProjects is called', () => {
    const storedItems = [{ id: 'loaded1', label: 'Loaded Project (py)', language: 'python' }] as ProjectMenuItem[];
    // Mock localStorage to return predefined items
    localStorage.setItem('projects', JSON.stringify(storedItems));

    component.loadProjects(); // Call the method to load projects

    expect(localStorage.getItem).toHaveBeenCalledWith('projects'); // Verify localStorage was accessed
    expect(component.items).toEqual(storedItems); // Component's items should match stored items
    expect(component.filteredItems).toEqual(storedItems); // Filtered items should also match
    expect(component.activeItem).toEqual(storedItems[0]); // First loaded item should be active
  });

  it('should initialize with empty projects if localStorage is empty', () => {
    localStorage.clear(); // Ensure localStorage is truly empty for this test
    component.loadProjects(); // Call loadProjects

    expect(localStorage.getItem).toHaveBeenCalledWith('projects');
    expect(component.items).toEqual([]); // Should be an empty array
    expect(component.filteredItems).toEqual([]); // Should be an empty array
    expect(component.activeItem).toBeNull(); // No active item
  });

  it('should set current tab', () => {
    const mockItem = { id: 'someId', label: 'Some Project', language: 'typescript' } as ProjectMenuItem;
    component.setCurrentTab(mockItem);
    expect(component.activeItem).toEqual(mockItem); // Verify the active item is set
  });

  it('should handle drag and drop to reorder tabs', fakeAsync(() => {
    // Initialize with items in a specific order
    component.items = [
      { id: '1', label: 'Project 1' },
      { id: '2', label: 'Project 2' },
      { id: '3', label: 'Project 3' },
    ] as ProjectMenuItem[];
    component.filteredItems = [...component.items];

    // Simulate drag start for 'Project 1' (index 0)
    const dragEvent = { dataTransfer: { setData: (format: string, data: string) => { } } } as DragEvent;
    component.onDragStart(dragEvent, component.items[0]); // Set draggedTab to Project 1

    // Simulate drag over 'Project 3'
    const dragOverEvent = { preventDefault: () => { } } as DragEvent;
    spyOn(dragOverEvent, 'preventDefault');
    component.onDragOver(dragOverEvent);
    expect(dragOverEvent.preventDefault).toHaveBeenCalled(); // Verify preventDefault was called

    // Simulate drop on 'Project 3' (original index 2)
    const dropEvent = { preventDefault: () => { } } as DragEvent;
    spyOn(dropEvent, 'preventDefault');
    component.onDrop(dropEvent, component.items[2]); // Drop Project 1 onto Project 3

    expect(dropEvent.preventDefault).toHaveBeenCalled();
    // Verify the new order: Project 2, Project 3, Project 1
    expect(component.items[0].id).toBe('2');
    expect(component.items[1].id).toBe('3');
    expect(component.items[2].id).toBe('1');
    expect(component.filteredItems).toEqual(component.items); // Filtered items should reflect the new order
    expect(component.draggedTab).toBeNull(); // draggedTab should be reset
    expect(localStorage.setItem).toHaveBeenCalled(); // localStorage should have been updated
    tick(); // Ensure any asynchronous operations (e.g., from saveProjects) are completed
  }));

  it('should show notification and hide it after timeout', fakeAsync(() => {
    const mockNotification: NotificationMessage = {
      type: NotificationType.Info,
      title: 'Test Title',
      message: 'Test Message',
      timestamp: Date.now()
    };
    const timeout = 0.1; // 100 milliseconds for the notification to be visible

    component.showNotification(mockNotification, timeout);
    expect(component.currentNotification).toEqual(mockNotification); // Notification should be visible

    tick(timeout * 1000); // Advance time by the specified timeout
    expect(component.currentNotification).toBeUndefined(); // Notification should be hidden
  }));

  it('should hide notification when hideNotification is called', () => {
    // Set a current notification to be active
    component.currentNotification = { type: NotificationType.Info, title: 'Active', message: 'Active', timestamp: Date.now() };
    component.hideNotification(); // Call the method to hide it
    expect(component.currentNotification).toBeUndefined(); // Notification should be undefined
  });
});
