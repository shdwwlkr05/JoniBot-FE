import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { PtdShiftMonthVm, PtdShiftVm, PtdShiftDayCell } from '../../models/ptd.models';

@Component({
  selector: 'app-ptd-shift-grid',
  templateUrl: './ptd-shift-grid.component.html',
  styleUrls: ['./ptd-shift-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PtdShiftGridComponent {
  @Input() monthVm: PtdShiftMonthVm;
  @Input() selectedShiftIds: Set<number> = new Set();
  @Input() workdaysMap: Map<string, string> = new Map();
  @Input() offeredDates: Set<string> = new Set();
  @Input() compact = false;

  // Filter inputs (mirror ot-shift-grid)
  @Input() hideWorkdays = false;
  @Input() filterAm = false;
  @Input() filterPm = false;
  @Input() filterMid = false;
  @Input() filterDom = false;
  @Input() filterIntl = false;
  @Input() filterFleet = false;
  @Input() filterSpt = false;
  @Input() filterNine = false;
  @Input() filterTen = false;
  @Input() isIntlQualified = false;
  @Input() isSptQualified = false;

  @Output() shiftClicked = new EventEmitter<PtdShiftVm>();
  @Output() monthLabelClicked = new EventEmitter<{ year: number; month: number }>();

  readonly dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  isoFor(day: PtdShiftDayCell): string {
    if (!this.monthVm) {
      return '';
    }
    const mm = String(this.monthVm.month).padStart(2, '0');
    const dd = String(day.dayNumber).padStart(2, '0');
    return `${this.monthVm.year}-${mm}-${dd}`;
  }

  isWorkday(day: PtdShiftDayCell): boolean {
    return this.workdaysMap.has(this.isoFor(day));
  }

  isOffered(day: PtdShiftDayCell): boolean {
    return this.offeredDates.has(this.isoFor(day));
  }

  getWorkdayShift(day: PtdShiftDayCell): string {
    return this.workdaysMap.get(this.isoFor(day)) ?? '';
  }

  isDayHidden(day: PtdShiftDayCell): boolean {
    return this.hideWorkdays && this.isWorkday(day);
  }

  isSelected(shift: PtdShiftVm): boolean {
    return this.selectedShiftIds.has(shift.id);
  }

  visibleCount(day: PtdShiftDayCell): number {
    if (this.isDayHidden(day)) {
      return 0;
    }
    let n = 0;
    for (const s of day.shifts) {
      if (!this.isSelected(s) && this.isShiftVisible(s)) {
        n++;
      }
    }
    return n;
  }

  getShiftTooltip(shift: PtdShiftVm): string {
    if (shift.start_time) {
      return `${shift.shift} - Start: ${shift.start_time}`;
    }
    return shift.shift;
  }

  onShiftClick(shift: PtdShiftVm): void {
    this.shiftClicked.emit(shift);
  }

  onShiftsScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const cell = el.parentElement;
    if (!cell) {
      return;
    }
    const atTop = el.scrollTop < 2;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 2;
    const fadeTop = cell.querySelector('.scroll-fade-top') as HTMLElement;
    const fadeBottom = cell.querySelector('.scroll-fade-bottom') as HTMLElement;
    if (fadeTop) { fadeTop.style.opacity = atTop ? '0' : '1'; }
    if (fadeBottom) { fadeBottom.style.opacity = atBottom ? '0' : '1'; }
  }

  isShiftVisible(shift: PtdShiftVm): boolean {
    const code = shift.shift;
    if (code === 'XX' || code === 'XXX') {
      return true;
    }

    const timeActive = this.filterAm || this.filterPm || this.filterMid;
    if (timeActive) {
      const start = code.charAt(0).toUpperCase();
      const isAm = start === 'A' || start === 'E';
      const isPm = start === 'P';
      const isMid = start === 'M';
      if (!((this.filterAm && isAm) || (this.filterPm && isPm) || (this.filterMid && isMid))) {
        return false;
      }
    }

    const deskId = code.substring(1, 3);
    const isIntl = /[a-zA-Z]/.test(deskId);
    if (isIntl && !this.isIntlQualified) {
      return false;
    }

    const regionActive = this.filterDom || this.filterIntl;
    if (regionActive) {
      if (!((this.filterDom && !isIntl) || (this.filterIntl && isIntl))) {
        return false;
      }
    }

    const lengthActive = this.filterNine || this.filterTen;
    if (lengthActive) {
      const lengthChar = code.charAt(3).toUpperCase();
      const isNine = lengthChar === 'N';
      const isTen = lengthChar === 'T';
      if (!((this.filterNine && isNine) || (this.filterTen && isTen))) {
        return false;
      }
    }

    const sptDesks = new Set(['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']);
    const isSpt = code.length === 4 && sptDesks.has(code.slice(-1));
    if (isSpt && !this.isSptQualified) {
      return false;
    }

    const typeActive = this.filterFleet || this.filterSpt;
    if (typeActive) {
      if (!((this.filterSpt && isSpt) || (this.filterFleet && !isSpt))) {
        return false;
      }
    }

    return true;
  }
}
