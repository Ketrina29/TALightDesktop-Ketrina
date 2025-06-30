import { Component, ElementRef, NgZone, OnInit, ViewChild, HostListener } from '@angular/core';  
import { NotificationManagerService, NotificationMessage, NotificationType } from 'src/app/services/notification-mananger-service/notification-manager.service';
import { ProblemManagerService } from 'src/app/services/problem-manager-service/problem-manager.service';
import { AppTheme, ThemeService } from 'src/app/services/theme-service/theme.service';
import { ProjectConfig } from 'src/app/services/project-manager-service/project-manager.types';
import { TutorialService } from 'src/app/services/tutorial-service/tutorial.service';
import { MenuItem } from 'primeng/api';
import { FsService } from 'src/app/services/fs-service/fs.service';
import { ConfigService } from 'src/app/services/config-service/config.service';
import { ProjectManagerService } from 'src/app/services/project-manager-service/project-manager.service';

@Component({
  selector: 'tal-topbar-widget',
  templateUrl: './topbar-widget.component.html',
  styleUrls: ['./topbar-widget.component.scss']
})
export class TopbarWidgetComponent implements OnInit {
  @ViewChild('statusDot') public statusDot?: ElementRef;
  @ViewChild('messageBox') public messageBox?: ElementRef;

  items: MenuItem[] = [];
  filteredItems: MenuItem[] = [];
  activeItem: any;
  projects: any[] = [];
  addProjectDialogVisible: boolean = false;
  newProjectName: string = '';
  selectedLanguage: string = '';
  languages: any[] = [
    { label: 'TypeScript', value: 'typescript' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' }
  ];
  currentNotification?: NotificationMessage;
  isBlurred: boolean = false;
  isTutorialButtonVisible: boolean = false;
  scrollable_prop = false;
  draggedTab: any;

  constructor(
    public readonly themeService: ThemeService,
    public zone: NgZone,
    public pm: ProblemManagerService,
    public nm: NotificationManagerService,
    private fsService: FsService,
    private configService: ConfigService,
    private tutorialService: TutorialService,
    public pms: ProjectManagerService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  openAddProjectDialog() {
    console.log('Apertura del dialogo');
    this.newProjectName = '';
    this.selectedLanguage = '';
    this.addProjectDialogVisible = true;
  }
  
  cancelAddProject() {
    this.addProjectDialogVisible = false;
  }
  
  confirmAddProject() {
    if (!this.newProjectName || !this.selectedLanguage) {
      this.showNotification({
        type: NotificationType.Warning,
        title: 'Informazioni Mancanti',
        message: 'Inserisci un nome progetto e seleziona una lingua.',
        timestamp: Date.now()
      });
      return;
    }

    if (this.items.length >= 10) {
      this.showNotification({ 
        type: NotificationType.Warning, 
        title: 'Limite raggiunto', 
        message: 'Non puoi aggiungere più di 10 progetti.', 
        timestamp: Date.now()
      });
      return;
    }

    const newProject = {
      id: this.generateUniqueId(),
      label: `${this.newProjectName} (${this.selectedLanguage})`,
      language: this.selectedLanguage
    };

    this.items.push(newProject);
    this.filteredItems = [...this.items];
    this.activeItem = newProject;
    this.addProjectDialogVisible = false;
    this.saveProjects();
  }

  deleteProject(projectId: string) {
    this.items = this.items.filter(item => item.id !== projectId);
    this.filteredItems = [...this.items];
    this.activeItem = this.items.length > 0 ? this.items[0] : null;
    this.saveProjects();
  }
  confirmDeleteProject(projectId: string) {
    const confirmed = window.confirm('Sei sicuro di voler eliminare questo progetto?');
    if (confirmed) {
      this.deleteProject(projectId);  // Chiamata alla funzione che elimina il progetto
    }
  }
  showTutorial() {
    this.tutorialService.showTutorial();  // Chiamata al servizio che gestisce la logica del tutorial
  }
  

  setCurrentTab(item: any) {
    this.activeItem = item;
  }

  onDragStart(event: DragEvent, item: any) {
    this.draggedTab = item;
    event.dataTransfer?.setData('text', item.id);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, dropTargetItem: any) {
    event.preventDefault();
    const draggedItemIndex = this.items.findIndex(item => item.id === this.draggedTab.id);
    const dropTargetIndex = this.items.findIndex(item => item.id === dropTargetItem.id);

    this.items.splice(draggedItemIndex, 1);
    this.items.splice(dropTargetIndex, 0, this.draggedTab);

    this.filteredItems = [...this.items];
    this.saveProjects();
    this.draggedTab = null;
  }

  showNotification(msg: NotificationMessage, timeout = 3) {
    this.currentNotification = msg;
    setTimeout(() => this.hideNotification(), timeout * 1000);
  }

  hideNotification() {
    this.currentNotification = undefined;
  }

  generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
  }

  saveProjects() {
    localStorage.setItem('projects', JSON.stringify(this.items));
  }

  loadProjects() {
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      this.items = JSON.parse(storedProjects);
      this.filteredItems = [...this.items];
      this.activeItem = this.items.length > 0 ? this.items[0] : null;
    }
  }

  get changeThemIcon(): string {
    return this.themeService.currentTheme === AppTheme.dark ? 'pi-sun' : 'pi-moon';
  
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
