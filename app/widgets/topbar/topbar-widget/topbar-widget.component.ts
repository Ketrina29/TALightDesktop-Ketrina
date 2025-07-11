import { Component, ElementRef, NgZone, OnInit, ViewChild, HostListener, AfterViewInit } from '@angular/core'; // Aggiungi AfterViewInit qui
import { NotificationManagerService, NotificationMessage, NotificationType } from '../../../services/notification-mananger-service/notification-manager.service';
import { ProblemManagerService } from '../../../services/problem-manager-service/problem-manager.service';
import { AppTheme, ThemeService } from '../../../services/theme-service/theme.service';
import { ProjectConfig } from '../../../services/project-manager-service/project-manager.types';
import { TutorialService } from '../../../services/tutorial-service/tutorial.service';
import { MenuItem } from 'primeng/api';
import { FsService } from '../../../services/fs-service/fs.service';
import { ConfigService } from '../../..//services/config-service/config.service';
import { ProjectManagerService } from '../../..//services/project-manager-service/project-manager.service';

@Component({
  selector: 'tal-topbar-widget',
  templateUrl: './topbar-widget.component.html',
  styleUrls: ['./topbar-widget.component.scss']
})
export class TopbarWidgetComponent implements OnInit, AfterViewInit { // Assicurati che il componente implementi AfterViewInit
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
    console.log('Projects after load:', this.items.length);
    this.showTutorial();

   
  // questa parte per non aprire subito il dialogvi 
  // if (this.items.length === 0) {
  //   this.openAddProjectDialog();
  // }
  }
showTutorial() {
  localStorage.setItem('tutorialCached', 'false');
  this.tutorialService.nextTutorial(-1);
}

  ngAfterViewInit(): void {
    if (this.statusDot) {
      console.log('statusDot nativeElement:', this.statusDot.nativeElement);
     
      // Esempio: this.statusDot.nativeElement.style.color = 'green';
    } else {
      console.warn('statusDot is undefined in ngAfterViewInit');
    }

    if (this.messageBox) {
      console.log('messageBox nativeElement:', this.messageBox.nativeElement);
    
      // Esempio: this.messageBox.nativeElement.style.backgroundColor = 'lightblue';
    } else {
      console.warn('messageBox is undefined in ngAfterViewInit');
    }
  }

  openAddProjectDialog() {
    console.log('Apertura del dialogo');
    console.trace('openAddProjectDialog was called!');
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
      this.deleteProject(projectId);
    }
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