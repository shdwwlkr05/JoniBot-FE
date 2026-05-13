import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { VacMonthVm, VacDayCell } from '../../models/vac-bid-v2.models';

@Component({
  selector: 'app-vac-calendar-grid',
  templateUrl: './vac-calendar-grid.component.html',
  styleUrls: ['./vac-calendar-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VacCalendarGridComponent {
  @Input() monthVm: VacMonthVm;
  @Input() compact = false;
  @Output() dayClicked = new EventEmitter<string>();
  @Output() monthLabelClicked = new EventEmitter<{ year: number; month: number }>();

  readonly dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  onDayClick(cell: VacDayCell): void {
    if (!cell.isDisabled) {
      this.dayClicked.emit(cell.date);
    }
  }
}
