import { Component, OnInit, ViewChild } from '@angular/core';
import { CodeEditorComponent } from '../../widgets/code-editor/code-editor/code-editor.component';
import { ProjectManagerService } from '../../services/project-manager-service/project-manager.service';

@Component({
  selector: 'tal-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {
  @ViewChild("codeEditor") public codeEditor!: CodeEditorComponent;

  constructor(private projectManagerService: ProjectManagerService) {}

  ngOnInit(): void {
    const projects = this.projectManagerService.getProjectsId();
    if (!projects || projects.length === 0) {
      const newProject = this.projectManagerService.addProject();
      this.projectManagerService.setCurrent(newProject);
    } else {
      const current = this.projectManagerService.getCurrentProject();
      if (!current) {
        this.projectManagerService.setCurrent(projects[0]);

      }
    }
  }
}
