import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TutorialComponent } from './tutorial.component';
import { TutorialService } from '../../services/tutorial-service/tutorial.service';
import { EventEmitter } from '@angular/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TutorialComponent', () => {
  let component: TutorialComponent;
  let fixture: ComponentFixture<TutorialComponent>;
  let service: jasmine.SpyObj<TutorialService> & { onIndexTutorialChange: EventEmitter<number> };

  beforeEach(async () => {
    const tutorialServiceSpy = jasmine.createSpyObj<TutorialService>(
      'TutorialService',
      ['closeTutorial', 'nextTutorial', 'previousTutorial', 'getCachedTutorial', 'getSizeTutorial']
    );

    tutorialServiceSpy.onIndexTutorialChange = new EventEmitter<number>();
    tutorialServiceSpy.getCachedTutorial.and.returnValue('true');
    tutorialServiceSpy.getSizeTutorial.and.returnValue(10);

    await TestBed.configureTestingModule({
      declarations: [TutorialComponent],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
    DropdownModule,
    HttpClientTestingModule,
    FormsModule, // ✅ KJO E ZGJIDH NG0303
  ],
      providers: [{ provide: TutorialService, useValue: tutorialServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TutorialService) as typeof tutorialServiceSpy;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
