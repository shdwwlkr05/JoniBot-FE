import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PtdShift, PtdShiftVm, PtdShiftDayCell, PtdShiftMonthVm,
  PtdShiftWeekVm, PtdPick, PtdViewMode
} from '../models/ptd.models';

const BASE = environment.baseURL + 'api/bid/';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Injectable()
export class PtdBidStoreService {
  // ---- Primary state ----
  private readonly viewModeSubject = new BehaviorSubject<PtdViewMode>('month');
  readonly viewMode$ = this.viewModeSubject.asObservable();

  private readonly currentMonthSubject = new BehaviorSubject<{ year: number; month: number }>({
    year: environment.currYear, month: 4
  });
  readonly currentMonth$ = this.currentMonthSubject.asObservable();

  private readonly picksSubject = new BehaviorSubject<PtdPick[]>([]);
  readonly picks$ = this.picksSubject.asObservable().pipe(shareReplay(1));

  private readonly responseSubject = new BehaviorSubject<string>('none');
  readonly response$ = this.responseSubject.asObservable();

  // ---- API-backed state ----
  private readonly availableShiftsSubject = new BehaviorSubject<PtdShift[]>([]);
  readonly availableShifts$ = this.availableShiftsSubject.asObservable().pipe(shareReplay(1));

  private readonly workgroupSubject = new BehaviorSubject<string>('');
  readonly workgroup$ = this.workgroupSubject.asObservable().pipe(shareReplay(1));

  private readonly intlQualifiedSubject = new BehaviorSubject<boolean>(false);
  readonly isIntlQualified$ = this.intlQualifiedSubject.asObservable().pipe(shareReplay(1));

  private readonly sptQualifiedSubject = new BehaviorSubject<boolean>(false);
  readonly isSptQualified$ = this.sptQualifiedSubject.asObservable().pipe(shareReplay(1));

  private readonly workdaysMapSubject = new BehaviorSubject<Map<string, string>>(new Map());
  readonly workdaysMap$ = this.workdaysMapSubject.asObservable().pipe(shareReplay(1));

  private readonly offeredDatesSubject = new BehaviorSubject<Set<string>>(new Set());
  readonly offeredDates$ = this.offeredDatesSubject.asObservable().pipe(shareReplay(1));

  /** Last-saved CSV — used by revert(). */
  private savedBidString = '0';
  private savedPicks: PtdPick[] = [];

  // ---- Derived ----
  readonly selectedShiftIds$: Observable<Set<number>> = this.picks$.pipe(
    map(picks => new Set(picks.map(p => p.id))),
    shareReplay(1)
  );

  readonly canSubmit$: Observable<boolean> = this.picks$.pipe(
    map(picks => picks.length > 0),
    shareReplay(1)
  );

  /** Shifts grouped by date, with VMs (sorted, classified). */
  readonly shiftsByDate$: Observable<Map<string, PtdShiftVm[]>> = combineLatest([
    this.availableShifts$, this.workgroup$
  ]).pipe(
    map(([shifts, workgroup]) => {
      const byDate = new Map<string, PtdShiftVm[]>();
      for (const s of shifts) {
        if (!s.id || !s.shift_date) {
          continue;
        }
        const list = byDate.get(s.shift_date) ?? [];
        const dayNum = new Date(s.shift_date + 'T00:00:00').getDate();
        list.push({
          id: s.id,
          day: dayNum,
          shift_date: s.shift_date,
          shift: s.shift,
          group: s.group ?? '',
          cssClass: PtdBidStoreService.classifyShift(s.shift, workgroup),
          start_time: s.start_time ?? ''
        });
        byDate.set(s.shift_date, list);
      }
      // Sort each day's shifts.
      const fsStartOrder: Record<string, number> = { E: 0, A: 1, P: 2, M: 3 };
      for (const [, list] of byDate) {
        list.sort((a, b) => {
          if (workgroup === 'som') {
            const hourA = parseInt(a.shift.substring(1, 3), 10) || 99;
            const hourB = parseInt(b.shift.substring(1, 3), 10) || 99;
            if (hourA !== hourB) {
              return hourA - hourB;
            }
          } else {
            const ordA = fsStartOrder[a.shift.charAt(0).toUpperCase()] ?? 99;
            const ordB = fsStartOrder[b.shift.charAt(0).toUpperCase()] ?? 99;
            if (ordA !== ordB) {
              return ordA - ordB;
            }
          }
          return a.shift.localeCompare(b.shift);
        });
      }
      return byDate;
    }),
    shareReplay(1)
  );

  readonly monthShiftCalendar$: Observable<PtdShiftMonthVm> = combineLatest([
    this.currentMonth$, this.shiftsByDate$
  ]).pipe(
    map(([cm, byDate]) => this.buildShiftMonthVm(cm.year, cm.month, byDate)),
    shareReplay(1)
  );

  readonly yearShiftCalendar$: Observable<PtdShiftMonthVm[]> = this.shiftsByDate$.pipe(
    map(byDate => {
      const months: PtdShiftMonthVm[] = [];
      for (let i = 0; i < 12; i++) {
        const m = ((4 + i - 1) % 12) + 1;
        const y = m >= 4 ? environment.currYear : environment.nextYear;
        months.push(this.buildShiftMonthVm(y, m, byDate));
      }
      return months;
    }),
    shareReplay(1)
  );

  constructor(private readonly http: HttpClient) {}

  init(): void {
    // Workgroup
    this.http.get<{ group: string }[]>(BASE + 'workgroups/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        if (res?.length) {
          this.workgroupSubject.next(res[0].group);
        }
      });

    // Qualifications
    this.http.get<{ qualification: string }[]>(BASE + 'userqual/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        const quals = (res ?? []).map(q => q.qualification);
        this.intlQualifiedSubject.next(quals.some(q => q.includes('INTL')));
        this.sptQualifiedSubject.next(quals.some(q => q.includes('SPT')));
      });

    // Workdays (for the "Hide my workdays" filter + workday cell highlighting)
    this.http.get<{ workday: string; shift: string }[]>(BASE + 'workdays')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        const m = new Map<string, string>();
        for (const w of res ?? []) {
          m.set(w.workday, w.shift);
        }
        this.workdaysMapSubject.next(m);
      });

    // User's own offered PTD shifts (rendered red on the bid grid).
    this.http.get<PtdShift[]>(BASE + 'ptdMyShifts/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        const set = new Set<string>();
        for (const s of res ?? []) {
          if (s.shift_date) {
            set.add(s.shift_date);
          }
        }
        this.offeredDatesSubject.next(set);
      });

    // Available PTD shifts, then existing bid (depends on shifts to reconstruct picks)
    this.http.get<PtdShift[]>(BASE + 'ptdShifts/')
      .pipe(catchError(() => of([])))
      .subscribe(shifts => {
        this.availableShiftsSubject.next(shifts ?? []);
        this.loadExistingBid(shifts ?? []);
      });
  }

  private loadExistingBid(allShifts: PtdShift[]): void {
    this.http.get<{ bid: string }>(BASE + 'ptdBid/')
      .pipe(catchError(() => of({ bid: '0' })))
      .subscribe(bid => {
        const bidStr = bid?.bid || '0';
        this.savedBidString = bidStr;
        if (bidStr === '0' || !bidStr) {
          this.savedPicks = [];
          this.picksSubject.next([]);
          return;
        }
        const ids = bidStr.split(',').map(Number).filter(n => Number.isFinite(n));
        const picks: PtdPick[] = [];
        for (const id of ids) {
          const found = allShifts.find(s => s.id === id);
          if (found) {
            picks.push({
              id: found.id!,
              shift_date: found.shift_date,
              shift: found.shift,
              start_time: found.start_time
            });
          }
        }
        this.savedPicks = picks.slice();
        this.picksSubject.next(picks);
      });
  }

  // ---- Pick management ----
  addPick(vm: PtdShiftVm): void {
    const current = this.picksSubject.getValue();
    if (current.some(p => p.id === vm.id)) {
      return;
    }
    this.picksSubject.next([
      ...current,
      { id: vm.id, shift_date: vm.shift_date, shift: vm.shift, start_time: vm.start_time }
    ]);
    this.responseSubject.next('unsaved');
  }

  removePick(index: number): void {
    const current = this.picksSubject.getValue();
    if (index < 0 || index >= current.length) {
      return;
    }
    const next = current.slice();
    next.splice(index, 1);
    this.picksSubject.next(next);
    this.responseSubject.next('unsaved');
  }

  movePick(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) {
      return;
    }
    const current = this.picksSubject.getValue();
    if (previousIndex < 0 || previousIndex >= current.length) {
      return;
    }
    if (currentIndex < 0 || currentIndex >= current.length) {
      return;
    }
    const next = current.slice();
    const [item] = next.splice(previousIndex, 1);
    next.splice(currentIndex, 0, item);
    this.picksSubject.next(next);
    this.responseSubject.next('unsaved');
  }

  // ---- Save / revert ----
  saveBid(): void {
    const picks = this.picksSubject.getValue();
    const bidStr = picks.length === 0 ? '0' : picks.map(p => p.id).join(',');
    const payload = { bid: bidStr };
    const headers = { 'Content-Type': 'application/json' };
    this.http.post(BASE + 'ptdBid/', JSON.stringify(payload), { headers })
      .pipe(catchError(() => {
        this.responseSubject.next('error');
        return of(null);
      }))
      .subscribe(res => {
        if (!res) {
          return;
        }
        this.savedBidString = bidStr;
        this.savedPicks = picks.slice();
        this.responseSubject.next('saved');
      });
  }

  revertBid(): void {
    this.picksSubject.next(this.savedPicks.slice());
    this.responseSubject.next('none');
  }

  // ---- Navigation ----
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
  private buildShiftMonthVm(
    year: number, month: number,
    byDate: Map<string, PtdShiftVm[]>
  ): PtdShiftMonthVm {
    const label = `${MONTH_NAMES[month - 1]} ${year}`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDow = new Date(year, month - 1, 1).getDay();

    const weeks: PtdShiftWeekVm[] = [];
    let week: PtdShiftWeekVm = new Array(7).fill(null);
    let col = firstDow;

    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const iso = `${year}-${mm}-${dd}`;
      const cell: PtdShiftDayCell = {
        dayNumber: d,
        shifts: byDate.get(iso) ?? []
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

  // ---- Shift classification (copied from OpenTimeStoreService) ----
  static classifyShift(shiftCode: string, workgroup = ''): string {
    if (shiftCode === 'XXX' || shiftCode === 'XX') {
      return 'desk-XXX';
    }
    if (workgroup === 'som') {
      return PtdBidStoreService.classifyShiftSom(shiftCode);
    }
    return PtdBidStoreService.classifyShiftFs(shiftCode);
  }

  private static classifyShiftSom(shiftCode: string): string {
    const hour = parseInt(shiftCode.substring(1, 3), 10);
    if (shiftCode.length === 4) {
      const deskCode = shiftCode.slice(-1);
      const deskLetters = new Set(['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']);
      if (deskLetters.has(deskCode)) {
        return `desk-${deskCode}`;
      }
    }
    if (hour >= 18) {
      return 'shift-night';
    }
    return 'shift-day';
  }

  private static classifyShiftFs(shiftCode: string): string {
    const deskId = shiftCode.substring(1, 3);
    const isIntl = /[a-zA-Z]/.test(deskId);
    if (isIntl) {
      const firstChar = deskId.charAt(0);
      if (firstChar === '0' || firstChar === '1') {
        return 'fs-pac';
      }
      if (firstChar === '2' || firstChar === '3' || firstChar === '4') {
        return 'fs-nat';
      }
      return 'fs-lat';
    }
    const startChar = shiftCode.charAt(0).toUpperCase();
    if (startChar === 'P') {
      return 'fs-dom-pm';
    }
    if (startChar === 'M') {
      return 'fs-dom-mid';
    }
    return 'fs-dom-am';
  }
}
