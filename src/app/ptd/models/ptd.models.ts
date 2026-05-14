export type PtdViewMode = 'month' | 'year';

/** One day on the PTD offer calendar (Part 1). */
export interface PtdDayCell {
  date: string;              // ISO yyyy-mm-dd
  dayNumber: number;
  workdayShift: string | null;
  startTime: string;
  isSelected: boolean;
  isDisabled: boolean;       // outside bid window (April current year → March next year)
}

export type PtdCalendarWeekVm = (PtdDayCell | null)[];

export interface PtdMonthVm {
  year: number;
  month: number;             // 1-12
  label: string;             // e.g. "April 2026"
  weeks: PtdCalendarWeekVm[];
}

/** A PtdShift the user has offered (or another user has offered in Part 2). */
export interface PtdShift {
  id?: number;
  shift_date: string;        // ISO yyyy-mm-dd
  shift: string;
  group?: string;
  start_time: string;
}

/** View model for one available PTD shift in the Part 2 grid. */
export interface PtdShiftVm {
  id: number;
  day: number;               // day-of-month
  shift_date: string;        // full ISO date
  shift: string;
  group: string;
  cssClass: string;
  start_time: string;
}

export interface PtdShiftDayCell {
  dayNumber: number;
  shifts: PtdShiftVm[];
}

export type PtdShiftWeekVm = (PtdShiftDayCell | null)[];

export interface PtdShiftMonthVm {
  year: number;
  month: number;
  label: string;
  weeks: PtdShiftWeekVm[];
}

/** One pick in the Part 2 ranked preference list. */
export interface PtdPick {
  id: number;
  shift_date: string;
  shift: string;
  start_time: string;
}
