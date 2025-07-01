import { EventEmitter, Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { ProjectManagerService } from '../project-manager-service/project-manager.service';

@Injectable({
  providedIn: 'root'
})
export class HotkeysService {

  private hotkeysSubject = new Subject<KeyboardEvent>();

  public hotkeysAction = new EventEmitter<'save' | 'export' | 'run' | 'test'>();
  public onHotkeysReceived = new EventEmitter<KeyboardEvent>();
  public configModified = false;

  constructor(private pms: ProjectManagerService) {
    this.registerHotkeysEvents();
  }

  // Emiton eventin e tastierës për ata që janë të regjistruar
  public emitHotkeysEvent(event: KeyboardEvent): void {
    this.hotkeysSubject.next(event);
    this.getCorrectHotkey(event); // Opsional: direkt trigger për veprime
  }

  // Jep Observable për t’u abonuar nga komponentët
  public registerHotkeysEvents(): Observable<KeyboardEvent> {
    return this.hotkeysSubject.asObservable();
  }

  // Analizon tastin dhe emit veprimin përkatës
  public getCorrectHotkey(event: KeyboardEvent): void {
    const project = this.pms.getCurrentProject();
    if (!project || !project.config || event.repeat) return;

    const cfg = project.config;

    const matchesCombo = (combo: any): boolean => {
      return (
        event.ctrlKey === combo.Control &&
        event.altKey === combo.Alt &&
        event.shiftKey === combo.Shift &&
        event.key === combo.Key
      );
    };

    if (matchesCombo(cfg.HOTKEY_SAVE)) {
      event.preventDefault();
      this.hotkeysAction.emit('save');
    } else if (matchesCombo(cfg.HOTKEY_EXPORT)) {
      event.preventDefault();
      this.hotkeysAction.emit('export');
    } else if (matchesCombo(cfg.HOTKEY_RUN)) {
      event.preventDefault();
      this.hotkeysAction.emit('run');
    } else if (matchesCombo(cfg.HOTKEY_TEST)) {
      event.preventDefault();
      this.hotkeysAction.emit('test');
    }
  }
}
