import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CalendarWeekVm, CalendarDayCell, ShiftVm, WorkdayInfo } from '../../services/open-time-store.service';

@Component({
  selector: 'app-ot-shift-grid',
  templateUrl: './ot-shift-grid.component.html',
  styleUrls: ['./ot-shift-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtShiftGridComponent {
  @Input() weeks: CalendarWeekVm[] = [];
  @Input() selectedShiftKeys: Set<string> = new Set();
  @Input() workdays: Map<number, WorkdayInfo> = new Map();
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
  @Output() shiftClicked = new EventEmitter<ShiftVm>();

  readonly dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  isSelected(shift: ShiftVm): boolean {
    return this.selectedShiftKeys.has(`${shift.day}-${shift.shift}`);
  }

  isWorkday(day: CalendarDayCell): boolean {
    return this.workdays.has(day.dayNumber);
  }

  getWorkdayShift(day: CalendarDayCell): string {
    return this.workdays.get(day.dayNumber)?.shift ?? '';
  }

  getWorkdayTimes(day: CalendarDayCell): string {
    const info = this.workdays.get(day.dayNumber);
    if (!info?.start || !info.shift?.includes('SAS')) return '';
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    };
    return `${fmt(info.start)} - ${fmt(info.end)}`;
  }

  isDayHidden(day: CalendarDayCell): boolean {
    return this.hideWorkdays && this.isWorkday(day);
  }

  getShiftTooltip(shift: ShiftVm): string {
    if (shift.start_time) {
      return `${shift.shift} - Start: ${shift.start_time}`;
    }
    return shift.shift;
  }

  onShiftClick(shift: ShiftVm): void {
    this.shiftClicked.emit(shift);
  }

  onShiftsScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const cell = el.parentElement;
    if (!cell) return;
    const atTop = el.scrollTop < 2;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 2;
    const fadeTop = cell.querySelector('.scroll-fade-top') as HTMLElement;
    const fadeBottom = cell.querySelector('.scroll-fade-bottom') as HTMLElement;
    if (fadeTop) fadeTop.style.opacity = atTop ? '0' : '1';
    if (fadeBottom) fadeBottom.style.opacity = atBottom ? '0' : '1';
  }

  isShiftVisible(shift: ShiftVm): boolean {
    const code = shift.shift;
    if (code === 'XX' || code === 'XXX') return true;

    // Time filter
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

    // Hide international shifts for non-qualified FS users
    const deskId = code.substring(1, 3);
    const isIntl = /[a-zA-Z]/.test(deskId);
    if (isIntl && !this.isIntlQualified) {
      return false;
    }

    // Region filter (FS)
    const regionActive = this.filterDom || this.filterIntl;
    if (regionActive) {
      if (!((this.filterDom && !isIntl) || (this.filterIntl && isIntl))) {
        return false;
      }
    }

    // Length filter (FS): 4th char N = 9hr, T = 10hr
    const lengthActive = this.filterNine || this.filterTen;
    if (lengthActive) {
      const lengthChar = code.charAt(3).toUpperCase();
      const isNine = lengthChar === 'N';
      const isTen = lengthChar === 'T';
      if (!((this.filterNine && isNine) || (this.filterTen && isTen))) {
        return false;
      }
    }

    // SOM: hide SPT shifts for non-qualified users (only applies to standard 4-char codes like M18C)
    const sptDesks = new Set(['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']);
    const isSpt = code.length === 4 && sptDesks.has(code.slice(-1));
    if (isSpt && !this.isSptQualified) {
      return false;
    }

    // Type filter (SOM)
    const typeActive = this.filterFleet || this.filterSpt;
    if (typeActive) {
      if (!((this.filterSpt && isSpt) || (this.filterFleet && !isSpt))) {
        return false;
      }
    }

    return true;
  }
}
