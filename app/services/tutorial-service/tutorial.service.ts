import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  // Method not implemented, but kept as per your previous code
 showTutorial() {
  console.log("TutorialService:showTutorial");
  localStorage.setItem('tutorialCached', 'false');
  this.onIndexTutorialChange.emit(-1);
  this.onTutorialChange.emit(this.tutorials[0]);
}


  public onTutorialClose = new EventEmitter<void>();
  public onTutorialChange = new EventEmitter<any>();
  public onIndexTutorialChange = new EventEmitter<number>();

  constructor() { }

  private tutorials = [
    {
      componentName: "Begin",
      text: `Benvenuto in TALight Desktop! Iniziamo con un tutorial con la spiegazione dei vari componenti.
             Nel caso volessi uscire subito, basta che schiacci il tasto 'Chiudi' in alto a destra su questa finestra.`,
    },
    {
      componentName: "TopbarWidgetComponent",
      text: `Nella topbar potrai trovare le tabs dei progetti vari, il tasto per visualizzare il tutorial nuovamente e potrai passare anche alla dark mode!`,
    },
    {
      componentName: "FileExplorerWidgetComponent",
      text: "É un file explorer",
    },
    {
      componentName: "ExecbarWidgetComponent",
      text: `Qui invece sono presenti i bottoni per avviare l'esecuzione,
              fermarla oppure per verificare la soluzione con il server`
    },
    {
      componentName: "FileEditorWidgetComponent",
      text: "Come dice il nome, questo é un semplice file editor",
    },
    {
      componentName: "ProblemWidgetComponent",
      text: "Seleziona il server, il problema ed il servizio",
    },
    {
      componentName: "OutputWidgetComponent",
      text: "OutputWidgetComponent",
    },
    {
      componentName: "LogApiWidgetComponent",
      text: "LogApiWidgetComponent",
    },
    {
      componentName: "TerminalWidgetComponent",
      text: "TerminalWidgetComponent",
    },
    {
      componentName: "End",
      text: "Grazie per aver completato il tour! Buon coding!",
    },
  ];

  public nextTutorial(indexCurrentTutorial: number) {
    console.log("TutorialService:nextTutorial");
    if (this.tutorials.length > indexCurrentTutorial) {
      this.onTutorialChange.emit(this.tutorials[indexCurrentTutorial + 1]);
      this.onIndexTutorialChange.emit(indexCurrentTutorial + 1);
    } else {
      this.closeTutorial();
    }
  }

  public previousTutorial(indexCurrentTutorial: number) {
    console.log("TutorialService:previousTutorial");
    if (indexCurrentTutorial > 0) {
      this.onTutorialChange.emit(this.tutorials[indexCurrentTutorial - 1]);
      this.onIndexTutorialChange.emit(indexCurrentTutorial - 1);
    } else {
      console.log("Impossibile andare indietro");
    }
  }

  public closeTutorial() {
    console.log("TutorialService:closeTutorial");
    // This line ensures the tutorial is marked as 'seen' in local storage
    localStorage.setItem('tutorialCached', 'true');
    this.onTutorialClose.emit();
  }

  public getCachedTutorial() {
    console.log("TutorialService:getCachedTutorial " + localStorage.getItem('tutorialCached'));
    return localStorage.getItem('tutorialCached');
  }

  public getSizeTutorial() {
    console.log("TutorialService:getSizeTutorial");
    return this.tutorials.length;
  }
}