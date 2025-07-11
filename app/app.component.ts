import { Component, OnInit } from '@angular/core';
import { TutorialService } from './services/tutorial-service/tutorial.service'; // ⬅️ IMPORTANTE

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'TALightDesktop';
  TAL_SERVER: string = 'wss://ta.di.univr.it/algo';

  tutorialIsVisible = false; // ⬅️ kjo do kontrollojë nëse tutoriali është hapur
  tutorialText = '';
  constructor(private tutorialService: TutorialService) {}

indexCurrentTutorial: number = -1; // tieni traccia dell'indice corrente

ngOnInit() {
  const savedVisible = localStorage.getItem('tutorialIsVisible');
  if (savedVisible === 'true') {
    this.tutorialIsVisible = true;
    // Recupera anche testo o indice se serve
  }

  this.tutorialService.onTutorialChange.subscribe(step => {
    this.tutorialText = step.text;
    this.tutorialIsVisible = true;
    localStorage.setItem('tutorialIsVisible', 'true');
  });

  this.tutorialService.onTutorialClose.subscribe(() => {
    this.tutorialIsVisible = false;
    this.tutorialText = '';
    localStorage.setItem('tutorialIsVisible', 'false');
  });
}

nextTutorial() {
  this.tutorialService.nextTutorial(this.indexCurrentTutorial);
}

prevTutorial() {
  this.tutorialService.previousTutorial(this.indexCurrentTutorial);
}
closeTutorial() {
  this.tutorialService.closeTutorial();
}


  changeTitle() {
    this.title = 'New Title';
  }
}
