import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PtdCalendarWeekVm, PtdDayCell, PtdMonthVm, PtdShift, PtdViewMode
} from '../models/ptd.models';

const BASE = environment.baseURL + 'api/bid/';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function isDisallowedShift(code: string): boolean {
  if (!code) {
    return true;
  }
  const upper = code.toUpperCase();
  return upper.startsWith('XX') || upper === 'RLF';
}

@Injectable()
export class PtdOfferStoreService {
  // ---- Primary state ----
  private readonly viewModeSubject = new BehaviorSubject<PtdViewMode>('month');
  readonly viewMode$ = this.viewModeSubject.asObservable();

  private readonly currentMonthSubject = new BehaviorSubject<{ year: number; month: number }>({
    year: environment.currYear, month: 4   // April (bid window start)
  });
  readonly currentMonth$ = this.currentMonthSubject.asObservable();

  private readonly responseSubject = new BehaviorSubject<string>('none');
  readonly response$ = this.responseSubject.asObservable();

  // ---- API-backed state ----
  private readonly workdaysSubject = new BehaviorSubject<{ workday: string; shift: string; start?: string }[]>([]);
  readonly workdays$ = this.workdaysSubject.asObservable();

  private readonly workgroupSubject = new BehaviorSubject<string>('');
  readonly workgroup$ = this.workgroupSubject.asObservable().pipe(shareReplay(1));

  private readonly ptdLimitSubject = new BehaviorSubject<number>(10);
  readonly ptdLimit$ = this.ptdLimitSubject.asObservable().pipe(shareReplay(1));

  private readonly selectedShiftsSubject = new BehaviorSubject<PtdShift[]>([]);
  readonly selectedShifts$ = this.selectedShiftsSubject.asObservable().pipe(shareReplay(1));

  /** Last-saved snapshot — used by revert(). */
  private savedShifts: PtdShift[] = [];

  // ---- Derived ----
  readonly workdayMap$: Observable<Map<string, { shift: string; startTime: string }>> = this.workdays$.pipe(
    map(wds => {
      const m = new Map<string, { shift: string; startTime: string }>();
      for (const w of wds) {
        // start may be an ISO datetime; pull HH:MM for display.
        let startTime = '';
        if (w.start) {
          const dt = new Date(w.start);
          if (!isNaN(dt.getTime())) {
            startTime = dt.toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
            });
          }
        }
        m.set(w.workday, { shift: w.shift, startTime });
      }
      return m;
    }),
    shareReplay(1)
  );

  readonly selectedDateSet$: Observable<Set<string>> = this.selectedShifts$.pipe(
    map(shifts => new Set(shifts.map(s => s.shift_date))),
    shareReplay(1)
  );

  readonly monthCalendar$: Observable<PtdMonthVm> = combineLatest([
    this.currentMonth$, this.workdayMap$, this.selectedDateSet$
  ]).pipe(
    map(([cm, workdays, selected]) =>
      this.buildMonthVm(cm.year, cm.month, workdays, selected)
    ),
    shareReplay(1)
  );

  readonly yearCalendar$: Observable<PtdMonthVm[]> = combineLatest([
    this.workdayMap$, this.selectedDateSet$
  ]).pipe(
    map(([workdays, selected]) => {
      const months: PtdMonthVm[] = [];
      for (let i = 0; i < 12; i++) {
        const m = ((4 + i - 1) % 12) + 1;       // 4,5,...,12,1,2,3
        const y = m >= 4 ? environment.currYear : environment.nextYear;
        months.push(this.buildMonthVm(y, m, workdays, selected));
      }
      return months;
    }),
    shareReplay(1)
  );

  readonly canSubmit$: Observable<boolean> = this.selectedShifts$.pipe(
    map(shifts => shifts.length > 0),
    shareReplay(1)
  );

  constructor(private readonly http: HttpClient) {}

  init(): void {
    this.http.get<{ workday: string; shift: string; start?: string }[]>(BASE + 'workdays')
      .pipe(catchError(() => of([])))
      .subscribe(res => this.workdaysSubject.next(res ?? []));

    this.http.get<{ group: string }[]>(BASE + 'workgroups/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        if (res?.length) {
          this.workgroupSubject.next(res[0].group);
        }
      });

    this.http.get<any[]>(BASE + 'balances')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        if (res?.length && res[0]?.ptd_limit != null) {
          this.ptdLimitSubject.next(res[0].ptd_limit);
        }
      });

    this.http.get<PtdShift[]>(BASE + 'ptdMyShifts/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        const shifts = (res ?? []).slice().sort((a, b) =>
          a.shift_date.localeCompare(b.shift_date));
        this.savedShifts = shifts.slice();
        this.selectedShiftsSubject.next(shifts);
      });
  }

  // ---- Actions ----
  toggleDay(iso: string): void {
    const current = this.selectedShiftsSubject.getValue();
    const idx = current.findIndex(s => s.shift_date === iso);
    if (idx >= 0) {
      // Already selected → remove.
      const next = current.slice();
      next.splice(idx, 1);
      this.selectedShiftsSubject.next(next);
      this.responseSubject.next('unsaved');
      return;
    }

    const workdays = this.workdaysSubject.getValue();
    const workday = workdays.find(w => w.workday === iso);
    if (!workday) {
      // Not a workday — ignore (defensive; the calendar disables clicks on non-workdays).
      return;
    }

    if (isDisallowedShift(workday.shift)) {
      this.responseSubject.next(`'${workday.shift}' shifts cannot be offered as PTD.`);
      return;
    }

    const limit = this.ptdLimitSubject.getValue();
    if (current.length >= limit) {
      this.responseSubject.next(`PTD offer limit reached (${limit}).`);
      return;
    }

    let startTime = '';
    if (workday.start) {
      const dt = new Date(workday.start);
      if (!isNaN(dt.getTime())) {
        startTime = dt.toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
        });
      }
    }

    const next = current.concat({
      shift_date: iso,
      shift: workday.shift,
      start_time: startTime
    }).sort((a, b) => a.shift_date.localeCompare(b.shift_date));

    this.selectedShiftsSubject.next(next);
    this.responseSubject.next('unsaved');
  }

  removeShift(iso: string): void {
    const current = this.selectedShiftsSubject.getValue();
    const next = current.filter(s => s.shift_date !== iso);
    if (next.length === current.length) {
      return;
    }
    this.selectedShiftsSubject.next(next);
    this.responseSubject.next('unsaved');
  }

  clearAll(): void {
    this.selectedShiftsSubject.next([]);
    this.responseSubject.next('unsaved');
  }

  revert(): void {
    this.selectedShiftsSubject.next(this.savedShifts.slice());
    this.responseSubject.next('none');
  }

  submitOffer(): void {
    const shifts = this.selectedShiftsSubject.getValue();
    const payload = {
      shifts: shifts.map(s => ({
        shift_date: s.shift_date,
        shift: s.shift,
        start_time: s.start_time || ''
      }))
    };
    const headers = { 'Content-Type': 'application/json' };
    this.http.post(BASE + 'ptdMyShifts/', JSON.stringify(payload), { headers })
      .pipe(catchError(err => {
        const msg = err?.error?.error || err?.message || 'Save failed';
        this.responseSubject.next(`error: ${msg}`);
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          return;
        }
        this.savedShifts = shifts.slice();
        this.responseSubject.next('saved');
        // Re-pull from server to pick up assigned ids.
        this.http.get<PtdShift[]>(BASE + 'ptdMyShifts/')
          .pipe(catchError(() => of([])))
          .subscribe(updated => {
            const sorted = (updated ?? []).slice().sort((a, b) =>
              a.shift_date.localeCompare(b.shift_date));
            this.savedShifts = sorted.slice();
            this.selectedShiftsSubject.next(sorted);
          });
      });
  }

  navigateMonth(delta: number): void {
    const cm = this.currentMonthSubject.getValue();
    let m = cm.month + delta;
    let y = cm.year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    this.currentMonthSubject.next({ year: y, month: m });
  }

  jumpToMonth(year: number, month: number): void {
    this.currentMonthSubject.next({ year, month });
    this.viewModeSubject.next('month');
  }

  setViewMode(mode: PtdViewMode): void {
    this.viewModeSubject.next(mode);
  }

  // ---- Calendar builder ----
  private buildMonthVm(
    year: number, month: number,
    workdays: Map<string, { shift: string; startTime: string }>,
    selected: Set<string>
  ): PtdMonthVm {
    const label = `${MONTH_NAMES[month - 1]} ${year}`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDow = new Date(year, month - 1, 1).getDay();   // 0=Sun

    const bidStart = new Date(environment.currYear, 3, 1);    // April 1
    const bidEnd = new Date(environment.nextYear, 2, 31);     // March 31

    const weeks: PtdCalendarWeekVm[] = [];
    let week: PtdCalendarWeekVm = new Array(7).fill(null);
    let col = firstDow;

    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const iso = `${year}-${mm}-${dd}`;
      const dateObj = new Date(year, month - 1, d);

      const workdayInfo = workdays.get(iso) || null;
      const cell: PtdDayCell = {
        date: iso,
        dayNumber: d,
        workdayShift: workdayInfo?.shift ?? null,
        startTime: workdayInfo?.startTime ?? '',
        isSelected: selected.has(iso),
        isDisabled: dateObj < bidStart || dateObj > bidEnd
      };

      week[col] = cell;
      col++;
      if (col === 7) {
        weeks.push(week);
        week = new Array(7).fill(null);
        col = 0;
      }
    }
    if (col > 0) {
      weeks.push(week);
    }
    return { year, month, label, weeks };
  }
}
