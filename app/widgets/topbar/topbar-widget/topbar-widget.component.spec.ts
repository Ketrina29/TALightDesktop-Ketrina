import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopbarWidgetComponent } from './topbar-widget.component';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TabMenuModule } from 'primeng/tabmenu';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

describe('TopbarWidgetComponent', () => {
  let component: TopbarWidgetComponent;
  let fixture: ComponentFixture<TopbarWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopbarWidgetComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        DropdownModule,
        DialogModule,
        TabMenuModule,
        ButtonModule,
        InputTextModule,
        TooltipModule
      ],
      providers: [
        { provide: 'ThemeService', useValue: { currentTheme: of('light'), toggleTheme: () => {} } },
        { provide: 'ProjectManagerService', useValue: jasmine.createSpyObj('ProjectManagerService', ['getProject', 'loadProject']) },
        { provide: 'CompilerService', useValue: jasmine.createSpyObj('CompilerService', ['compile']) },
        { provide: 'TutorialService', useValue: jasmine.createSpyObj('TutorialService', ['closeTutorial']) },
        { provide: 'ApiService', useValue: jasmine.createSpyObj('ApiService', ['updateState']) },
        { provide: 'MessageService', useValue: jasmine.createSpyObj('MessageService', ['add']) },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
