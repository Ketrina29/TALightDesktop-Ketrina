import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CompilerService } from '../../../services/compiler-service/compiler-service.service';
import { CompilerState } from '../../../services/compiler-service/compiler-service.types';
import { OutputWidgetComponent } from '../output-widget/output-widget.component';
import { ProjectDriver, ProjectLanguage } from '../../../services/project-manager-service/project-manager.types';
import { OutputType } from '../output-widget/output-widget.component';
@Component({
  selector: 'tal-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent implements OnInit, AfterViewInit {
 
language: ProjectLanguage = ProjectLanguage.PY; // ✅ SAKTË


  @ViewChild('outputWidget') 
  public outputWidget!: OutputWidgetComponent;

  public pyodideState = CompilerState.Unknown;
  public pyodideStateContent?: string;

  constructor(
    private compiler: CompilerService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // eventuali inizializzazioni
  }

  ngAfterViewInit(): void {
  if (this.outputWidget) {
    this.outputWidget.enableStdin(false);
  }
}

  // Metodo privato modificato con controllo su outputWidget
  private didStateChange(state: CompilerState, content?: string): void {
  this.pyodideState = state;
  this.pyodideStateContent = content;

  if (this.outputWidget) {
    this.outputWidget.didStateChange(state, content);
  }
}

  // Esempio metodo che usa outputWidget con controllo
  public didNotify(data: string): void {
    if (this.outputWidget) {
      this.outputWidget.print(data);
    }
  }

  // Metodo sendStdin con controllo su outputWidget
 public async sendStdin(msg: string, fromAPI = false): Promise<void> {
  const lines = msg.split('\n').filter(line => line.length > 0);
  const driver = this.compiler.get(this.language); // ✅ FIX

  for (const line of lines) {
    await driver.sendStdin(line);
    if (this.outputWidget) {
      this.outputWidget.print(line, fromAPI ? OutputType.STDINAPI : OutputType.STDIN);
    }
  }

  if (this.outputWidget) {
    this.outputWidget.enableStdin(false);
  }
}

public async onAttachments(data: ArrayBuffer, source: string): Promise<void> {
  const files = (window as any).Tar.unpack(data);
  const basePath = '/data';

 const driver = this.compiler.get(this.language);


  await driver.createDirectory(basePath);

  for (const file of files) {
    const folderPath = `${basePath}/${file.path}`;
    await driver.createDirectory(folderPath);
    await driver.writeFile(`${basePath}/${file.path}/${file.name}`, file.content);
  }

  if ((this as any).fileExplorer?.refreshRoot) {
    (this as any).fileExplorer.refreshRoot();
  }
}
onUpdateRoot(event: any) {}
selectFile(event: any) {}
onFileDeleted(event: any) {}
onItemRenamed(event: any) {}
runProjectLocal() {}
stopAll() {}
runConnectAPI() {}
editorDidChange(event: any) {}
onProblemChanged(event: any) {}
onServiceChanged(event: any) {}
onProblemListChanged() {}
isBlurred = false;
activeWidget = 0;
OutputDisabled = false;
LogApiDisabled = false;
TerminalDisabled = false;
changeWidget(event: any) {}
selectedFile: any = null;

}
