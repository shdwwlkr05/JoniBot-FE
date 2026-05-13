import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftGridComponent } from './shift-grid.component';

describe('ShiftGridComponent', () => {
  let component: ShiftGridComponent;
  let fixture: ComponentFixture<ShiftGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShiftGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShiftGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
