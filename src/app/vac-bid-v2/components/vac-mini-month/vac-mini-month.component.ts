import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { VacMonthVm } from '../../models/vac-bid-v2.models';

@Component({
  selector: 'app-vac-mini-month',
  template: `
    <div class="mini-month">
      <app-vac-calendar-grid
        [monthVm]="monthVm"
        [compact]="true"
        (dayClicked)="dayClicked.emit($event)"
        (monthLabelClicked)="zoomToMonth.emit($event)">
      </app-vac-calendar-grid>
    </div>
  `,
  styles: [`
    .mini-month {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 6px;
      cursor: pointer;
      transition: box-shadow 0.15s;
    }
    .mini-month:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VacMiniMonthComponent {
  @Input() monthVm: VacMonthVm;
  @Output() dayClicked = new EventEmitter<string>();
  @Output() zoomToMonth = new EventEmitter<{ year: number; month: number }>();
}
