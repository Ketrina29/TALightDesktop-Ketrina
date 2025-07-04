import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FsNodeFile } from '../../../services/fs-service/fs.service.types';
import { TutorialService } from '../../../services/tutorial-service/tutorial.service';

@Component({
  selector: 'tal-execbar-widget',
  templateUrl: './execbar-widget.component.html',
  styleUrls: ['./execbar-widget.component.scss']
})
export class ExecbarWidgetComponent implements OnInit {
  @Input('selectedFile') selectedFile?: FsNodeFile

  @Output('onStop') public onStop = new EventEmitter<void>();
  @Output('onRun') public onRun = new EventEmitter<FsNodeFile>();
  @Output('onConnect') public onConnect = new EventEmitter<FsNodeFile>();

  constructor(
    private tutorialService: TutorialService,
  ) {
    this.tutorialService.onTutorialChange.subscribe((tutorial) => { this.isTutorialShown(tutorial) })
    this.tutorialService.onTutorialClose.subscribe(() => { this.isTutorialShown() })
  }


  ngOnInit() {
    // this.isBlurred = true;
  }

  protected isBlurred = true;

  private isTutorialShown(tutorial?: any) {
    console.log("ExecbarWidgetComponent:isTutorialShown")
    if (typeof tutorial === 'undefined' || tutorial.componentName === this.constructor.name) {
      this.isBlurred = false
    }
    else {
      this.isBlurred = true
    }
  }

  public onStopClick() {
    this.onStop.emit()
  }

  public onRunClick() {
    this.onRun.emit(this.selectedFile)
  }

  public onConnectClick() {
    this.onConnect.emit(this.selectedFile)
  }

}
