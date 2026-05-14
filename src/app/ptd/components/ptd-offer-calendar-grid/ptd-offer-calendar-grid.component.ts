import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { PtdMonthVm, PtdDayCell } from '../../models/ptd.models';

@Component({
  selector: 'app-ptd-offer-calendar-grid',
  templateUrl: './ptd-offer-calendar-grid.component.html',
  styleUrls: ['./ptd-offer-calendar-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PtdOfferCalendarGridComponent {
  @Input() monthVm: PtdMonthVm;
  @Input() compact = false;
  @Output() dayClicked = new EventEmitter<string>();
  @Output() monthLabelClicked = new EventEmitter<{ year: number; month: number }>();

  readonly dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  onDayClick(cell: PtdDayCell): void {
    if (cell.isDisabled || !cell.workdayShift) {
      return;
    }
    this.dayClicked.emit(cell.date);
  }
}
