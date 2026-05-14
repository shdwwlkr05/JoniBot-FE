import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { PtdShiftMonthVm } from '../../models/ptd.models';

@Component({
  selector: 'app-ptd-shift-mini-month',
  template: `
    <div class="mini-month">
      <app-ptd-shift-grid
        [monthVm]="monthVm"
        [workdaysMap]="workdaysMap"
        [offeredDates]="offeredDates"
        [compact]="true"
        (monthLabelClicked)="zoomToMonth.emit($event)">
      </app-ptd-shift-grid>
    </div>
  `,
  styles: [`
    .mini-month {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 6px;
      transition: box-shadow 0.15s;
    }
    .mini-month:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PtdShiftMiniMonthComponent {
  @Input() monthVm: PtdShiftMonthVm;
  @Input() workdaysMap: Map<string, string> = new Map();
  @Input() offeredDates: Set<string> = new Set();
  @Output() zoomToMonth = new EventEmitter<{ year: number; month: number }>();
}
