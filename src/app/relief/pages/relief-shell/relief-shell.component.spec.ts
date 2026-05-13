import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReliefShellComponent } from './relief-shell.component';

describe('ReliefShellComponent', () => {
  let component: ReliefShellComponent;
  let fixture: ComponentFixture<ReliefShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReliefShellComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReliefShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
