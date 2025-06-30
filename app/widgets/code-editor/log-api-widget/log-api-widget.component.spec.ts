import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogApiWidgetComponent } from './log-api-widget.component';

import { ButtonModule } from 'primeng/button'; // Importo modul për p-button
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; // Për të toleruar pjesë të tjera që s’i importon tani

describe('LogApiWidgetComponent', () => {
  let component: LogApiWidgetComponent;
  let fixture: ComponentFixture<LogApiWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogApiWidgetComponent],
      imports: [ButtonModule], // shto këtu modulet që template përdor
      schemas: [CUSTOM_ELEMENTS_SCHEMA] // opsionale, për të evituar NG0304 për komponente të tjera të PrimeNG
    }).compileComponents();

    fixture = TestBed.createComponent(LogApiWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
