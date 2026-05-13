import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CalendarWeekVm, CalendarDayCell, ShiftVm } from '../../services/relief-store.service';

@Component({
  selector: 'app-shift-grid',
  templateUrl: './shift-grid.component.html',
  styleUrls: ['./shift-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShiftGridComponent {
  @Input() weeks: CalendarWeekVm[] = [];
  @Input() selectedShiftKeys: Set<string> = new Set();
  @Input() rlfDays: Set<number> = new Set();
  @Input() workdaysOnly = false;
  @Input() filterAm = false;
  @Input() filterPm = false;
  @Input() filterMid = false;
  @Input() filterDom = false;
  @Input() filterIntl = false;
  @Input() filterFleet = false;
  @Input() filterSpt = false;
  @Input() isIntlQualified = false;
  @Output() shiftClicked = new EventEmitter<ShiftVm>();

  readonly dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /** Track which day numbers have their bidder panel expanded */
  expandedDays = new Set<number>();

  isSelected(shift: ShiftVm): boolean {
    return this.selectedShiftKeys.has(`${shift.day}-${shift.shift}`);
  }

  isRlfDay(day: CalendarDayCell): boolean {
    return this.rlfDays.has(day.dayNumber);
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

  toggleBidders(dayNumber: number): void {
    if (this.expandedDays.has(dayNumber)) {
      this.expandedDays.delete(dayNumber);
    } else {
      this.expandedDays.add(dayNumber);
    }
  }

  isBiddersExpanded(dayNumber: number): boolean {
    return this.expandedDays.has(dayNumber);
  }

  isShiftVisible(shift: ShiftVm): boolean {
    const code = shift.shift;
    if (code === 'XX' || code === 'XXX') return true;

    // Time filter: if any are active, only show matching
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

    // Region filter (FS): if any are active, only show matching
    const regionActive = this.filterDom || this.filterIntl;
    if (regionActive) {
      if (!((this.filterDom && !isIntl) || (this.filterIntl && isIntl))) {
        return false;
      }
    }

    // Type filter (SOM): if any are active, only show matching
    const typeActive = this.filterFleet || this.filterSpt;
    if (typeActive) {
      const sptDesks = new Set(['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']);
      const isSpt = code.length === 4 && sptDesks.has(code.slice(-1));
      if (!((this.filterSpt && isSpt) || (this.filterFleet && !isSpt))) {
        return false;
      }
    }

    return true;
  }
}
