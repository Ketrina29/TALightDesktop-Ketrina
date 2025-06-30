import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectViewComponent } from './connect-view.component';
import { fakeAsync, tick } from '@angular/core/testing';

describe('ConnectViewComponent', () => {
  let component: ConnectViewComponent;
  let fixture: ComponentFixture<ConnectViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConnectViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  tick(10);;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
});
