import { Component, OnInit, AfterViewInit } from '@angular/core';
import { TutorialService } from '../../services/tutorial-service/tutorial.service';

@Component({
  selector: 'app-tutorial',
  template: `<p>TutorialComponent works!</p>`,
})
export class TutorialComponent implements OnInit, AfterViewInit {
  isVisible = false;
  indexCurrentTutorial = -1;
  testo = '';
  tutorialText = '';
  backButtonDisabled = false;

  constructor(private tutorialService: TutorialService) {}

  ngOnInit(): void {
    this.tutorialService.onIndexTutorialChange.subscribe((index) => {
      this.setIndex(index);
    });

    this.tutorialService.onTutorialChange.subscribe((step: any) => {
      this.showTutorial(step);
    });

    this.tutorialService.onTutorialClose.subscribe(() => {
      this.closeTutorial();
    });
  }

  ngAfterViewInit(): void {
    if (this.tutorialService.getCachedTutorial() === 'true') {
      this.closeTutorialButton();
    } else {
      setTimeout(() => {
        this.tutorialService.nextTutorial(-1);
      }, 1);
    }
  }

  setIndex(index: number): void {
    console.log('TutorialComponent:setIndex');
    this.indexCurrentTutorial = index;
  }

  showTutorial(step: { componentName: string; text: string }): void {
    console.log('TutorialComponent:showTutorial');
    this.tutorialText = step.text;
    this.isVisible = true;
    this.testo = step.componentName === 'End' ? 'Fine' : 'Avanti';
    this.backButtonDisabled = step.componentName === 'Begin';
  }

  closeTutorial(): void {
    console.log('TutorialComponent:closeTutorial');
    this.isVisible = false;
  }

  closeTutorialButton(): void {
    console.log('TutorialComponent:closeTutorialButton');
    this.tutorialService.closeTutorial();
  }

  nextTutorialButton(): void {
    console.log('TutorialComponent:nextTutorialButton');
    if (this.indexCurrentTutorial + 1 >= this.tutorialService.getSizeTutorial()) {
      this.tutorialService.closeTutorial();
    } else {
      this.tutorialService.nextTutorial(this.indexCurrentTutorial);
    }
  }

  prevTutorialButton(): void {
    console.log('TutorialComponent:previousTutorialButton');
    this.tutorialService.previousTutorial(this.indexCurrentTutorial);
    this.backButtonDisabled = this.indexCurrentTutorial <= 0;
  }
}
