export type VacType = 'vac' | 'ppt' | 'hol' | 'any' | 'ptd';
export type AwardOpt = '50p' | 'all' | 'any';
export type ViewMode = 'month' | 'year';

export interface VacDayCell {
  date: string;        // ISO yyyy-mm-dd
  dayNumber: number;
  awardCount: number;
  maxOff: number;
  colorClass: string;  // 'award-green' | 'award-yellow' | 'award-orange' | 'award-red' | ''
  workdayShift: string | null;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
}

export type VacCalendarWeekVm = (VacDayCell | null)[];

export interface VacMonthVm {
  year: number;
  month: number;       // 1-12
  label: string;       // e.g. "April 2026"
  weeks: VacCalendarWeekVm[];
}

export interface BidDraft {
  round: number;
  choice: number;
  startDate: string | null;  // ISO yyyy-mm-dd
  endDate: string | null;
  vacType: VacType;
  awardOpt: AwardOpt;
  useHol: boolean;
}
