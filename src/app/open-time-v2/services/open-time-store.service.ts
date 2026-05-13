import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, map, shareReplay, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DataStorageService } from '../../bid-form/data-storage.service';

/** View model for a single shift in the calendar grid */
export interface ShiftVm {
  id: number;
  day: string;
  shift: string;
  group: string;
  cssClass: string;
  start_time: string;
}

/** A single day cell in the calendar grid (null = empty slot) */
export interface CalendarDayCell {
  dayNumber: number;
  shifts: ShiftVm[];
}

/** One row (week) of the calendar grid — always 7 entries (Sun–Sat) */
export type CalendarWeekVm = (CalendarDayCell | null)[];

/** Workday info for a single day */
export interface WorkdayInfo {
  shift: string;
  start: string;
  end: string;
}

/** A single pick in the flat bid list */
export interface OtPick {
  id: number;
  day: string;
  shift: string;
  start_time: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenTimeStoreService {
  // ---- Primary state ----
  private readonly picksSubject = new BehaviorSubject<OtPick[]>([]);
  readonly picks$ = this.picksSubject.asObservable().pipe(shareReplay(1));

  private readonly workgroupSubject = new BehaviorSubject<string>('');
  readonly workgroup$ = this.workgroupSubject.asObservable().pipe(shareReplay(1));

  private readonly intlQualifiedSubject = new BehaviorSubject<boolean>(false);
  readonly isIntlQualified$ = this.intlQualifiedSubject.asObservable().pipe(shareReplay(1));

  private readonly sptQualifiedSubject = new BehaviorSubject<boolean>(false);
  readonly isSptQualified$ = this.sptQualifiedSubject.asObservable().pipe(shareReplay(1));

  private readonly responseSubject = new BehaviorSubject<string>('none');
  readonly response$ = this.responseSubject.asObservable();

  private readonly openTimeRankSubject = new BehaviorSubject<string>('');
  readonly openTimeRank$ = this.openTimeRankSubject.asObservable();

  private readonly workgroupCountSubject = new BehaviorSubject<string>('');
  readonly workgroupCount$ = this.workgroupCountSubject.asObservable();

  // ---- Data from API (via DataStorageService subjects) ----
  private readonly paramsSubject = new BehaviorSubject<any>(null);
  readonly params$ = this.paramsSubject.asObservable();

  private readonly shiftsSubject = new BehaviorSubject<any[]>([]);
  readonly shifts$ = this.shiftsSubject.asObservable();

  // Saved bid state for revert
  private savedPicks: OtPick[] = [];
  private savedLimitAward = false;
  private savedLimitAmount = 1;
  private savedLimitPeriod = 'm';

  // Award limiting state (exposed for bidder component)
  limitAward = false;
  limitAmount = 1;
  limitPeriod = 'm';

  /** Selected shift keys for highlighting in grid */
  readonly selectedShiftKeys$: Observable<Set<string>> = this.picks$.pipe(
    map(picks => new Set(picks.map(p => `${p.day}-${p.shift}`))),
    shareReplay(1)
  );

  /** Calendar grid built from API data */
  readonly shiftCalendar$: Observable<CalendarWeekVm[]> = combineLatest([
    this.paramsSubject,
    this.shiftsSubject,
    this.workgroup$
  ]).pipe(
    map(([params, shifts, workgroup]) => {
      if (!params?.start_date || !shifts?.length) return [];

      const [yStr, mStr] = params.start_date.split('-');
      const year = Number(yStr);
      const monthIndex = Number(mStr) - 1;
      if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return [];

      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      // Group shifts by day number
      const byDay = new Map<number, any[]>();
      for (const s of shifts) {
        const dayNum = Number(s.day);
        if (!dayNum || dayNum < 1 || dayNum > daysInMonth) continue;
        const list = byDay.get(dayNum) ?? [];
        list.push(s);
        byDay.set(dayNum, list);
      }

      // Build day cells with sorted shifts and CSS classes
      const dayCells = new Map<number, CalendarDayCell>();
      for (let d = 1; d <= daysInMonth; d++) {
        const fsStartOrder: Record<string, number> = { E: 0, A: 1, P: 2, M: 3 };
        const dayShifts = (byDay.get(d) ?? [])
          .slice()
          .sort((a, b) => {
            if (workgroup === 'som') {
              const hourA = parseInt(a.shift.substring(1, 3), 10) || 99;
              const hourB = parseInt(b.shift.substring(1, 3), 10) || 99;
              if (hourA !== hourB) return hourA - hourB;
            } else {
              const ordA = fsStartOrder[a.shift.charAt(0).toUpperCase()] ?? 99;
              const ordB = fsStartOrder[b.shift.charAt(0).toUpperCase()] ?? 99;
              if (ordA !== ordB) return ordA - ordB;
            }
            return a.shift.localeCompare(b.shift);
          });

        const shiftVms: ShiftVm[] = dayShifts.map(s => ({
          id: s.id,
          day: String(s.day),
          shift: s.shift,
          group: s.group ?? '',
          cssClass: OpenTimeStoreService.classifyShift(s.shift, workgroup),
          start_time: s.start_time ?? ''
        }));

        dayCells.set(d, {
          dayNumber: d,
          shifts: shiftVms
        });
      }

      // Build weekly grid (Sun=0 through Sat=6)
      const firstDow = new Date(year, monthIndex, 1).getDay();
      const weeks: CalendarWeekVm[] = [];
      let week: CalendarWeekVm = new Array(7).fill(null);

      let col = firstDow;
      for (let d = 1; d <= daysInMonth; d++) {
        week[col] = dayCells.get(d) ?? null;
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

      return weeks;
    }),
    shareReplay(1)
  );

  /** Map of day-of-month number → workday info for the user's workdays */
  readonly workdays$: Observable<Map<number, WorkdayInfo>> = combineLatest([
    this.paramsSubject,
    this.http.get<{ workday: string; shift: string; start: string; end: string }[]>(environment.baseURL + 'api/bid/workdays').pipe(
      catchError(() => of([] as { workday: string; shift: string; start: string; end: string }[]))
    )
  ]).pipe(
    map(([params, workdays]) => {
      if (!params?.start_date) return new Map<number, WorkdayInfo>();
      const monthPrefix = params.start_date.slice(0, 7);
      const days = new Map<number, WorkdayInfo>();
      for (const wd of workdays) {
        if (wd.workday.startsWith(monthPrefix)) {
          const dayNum = new Date(wd.workday + 'T00:00:00').getDate();
          days.set(dayNum, {
            shift: wd.shift,
            start: wd.start ?? '',
            end: wd.end ?? ''
          });
        }
      }
      return days;
    }),
    shareReplay(1)
  );

  readonly canSubmit$: Observable<boolean> = this.picks$.pipe(
    map(picks => picks.length > 0),
    shareReplay(1)
  );

  constructor(private readonly data: DataStorageService, private readonly http: HttpClient) {}

  /** Initialize all data fetches — call once from component */
  init(): void {
    // Fetch workgroup
    this.http.get<{ group: string }[]>(environment.baseURL + 'api/bid/workgroups/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        if (res?.length) this.workgroupSubject.next(res[0].group);
      });

    // Fetch qualifications
    this.http.get<{ qualification: string }[]>(environment.baseURL + 'api/bid/userqual/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        const quals = res?.map(q => q.qualification) ?? [];
        this.intlQualifiedSubject.next(quals.some(q => q.includes('INTL')));
        this.sptQualifiedSubject.next(quals.some(q => q.includes('SPT')));
      });

    // Fetch open time rank
    this.http.get<any[]>(environment.baseURL + 'api/bid/bidTime')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        if (res?.[0]?.opentime != null) {
          this.openTimeRankSubject.next(String(res[0].opentime));
        }
      });

    // Fetch workgroup count
    this.http.get<any>(environment.baseURL + 'api/bid/rank/')
      .pipe(catchError(() => of({})))
      .subscribe(res => {
        if (res?.user_count != null) {
          this.workgroupCountSubject.next(String(res.user_count));
        }
      });

    // Fetch open time params
    this.http.get<any>(environment.baseURL + 'api/bid/openTimeParams/')
      .pipe(catchError(() => of(null)))
      .subscribe(params => {
        if (params) this.paramsSubject.next(params);
      });

    // Fetch open time shifts
    this.http.get<any[]>(environment.baseURL + 'api/bid/openTimeShifts')
      .pipe(catchError(() => of([])))
      .subscribe(shifts => {
        this.shiftsSubject.next(shifts ?? []);
        this.loadExistingBid(shifts ?? []);
      });
  }

  private loadExistingBid(allShifts: any[]): void {
    this.http.get<any>(environment.baseURL + 'api/bid/openTimeBid/')
      .pipe(catchError(() => of(null)))
      .subscribe(bid => {
        if (!bid?.bid || bid.bid === '0') return;

        const ids = bid.bid.split(',').map(Number);
        const picks: OtPick[] = [];
        for (const id of ids) {
          const shift = allShifts.find(s => s.id === id);
          if (shift) {
            picks.push({ id: shift.id, day: String(shift.day), shift: shift.shift, start_time: shift.start_time ?? '' });
          }
        }

        this.savedPicks = picks.slice();
        this.picksSubject.next(picks);

        this.limitAward = bid.limit_award ?? false;
        this.limitAmount = bid.limit_amount ?? 1;
        this.limitPeriod = bid.limit_period ?? 'm';
        this.savedLimitAward = this.limitAward;
        this.savedLimitAmount = this.limitAmount;
        this.savedLimitPeriod = this.limitPeriod;
      });
  }

  // ---- Pick management ----
  addPick(shiftVm: ShiftVm): void {
    const current = this.picksSubject.getValue();
    if (current.some(p => p.id === shiftVm.id)) return;
    const pick: OtPick = { id: shiftVm.id, day: shiftVm.day, shift: shiftVm.shift, start_time: shiftVm.start_time };
    this.picksSubject.next([...current, pick]);
    this.responseSubject.next('unsaved');
  }

  removePick(index: number): void {
    const current = this.picksSubject.getValue();
    if (index < 0 || index >= current.length) return;
    const next = current.slice();
    next.splice(index, 1);
    this.picksSubject.next(next);
    this.responseSubject.next('unsaved');
  }

  movePick(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;
    const current = this.picksSubject.getValue();
    if (previousIndex < 0 || previousIndex >= current.length) return;
    if (currentIndex < 0 || currentIndex >= current.length) return;
    const next = current.slice();
    const [item] = next.splice(previousIndex, 1);
    next.splice(currentIndex, 0, item);
    this.picksSubject.next(next);
    this.responseSubject.next('unsaved');
  }

  // ---- Save / Revert ----
  saveBid(): void {
    const picks = this.picksSubject.getValue();
    let bidStr: string;
    if (picks.length === 0) {
      bidStr = '0';
    } else {
      bidStr = picks.map(p => p.id).join(',');
    }
    const payload = {
      bid: bidStr,
      limit_award: this.limitAward,
      limit_amount: this.limitAmount,
      limit_period: this.limitPeriod
    };

    const headers = { 'Content-Type': 'application/json' };
    this.http.post(environment.baseURL + 'api/bid/openTimeBid/', JSON.stringify(payload), { headers })
      .pipe(catchError(err => {
        this.responseSubject.next('error');
        return of(null);
      }))
      .subscribe(res => {
        if (res) {
          this.savedPicks = picks.slice();
          this.savedLimitAward = this.limitAward;
          this.savedLimitAmount = this.limitAmount;
          this.savedLimitPeriod = this.limitPeriod;
          this.responseSubject.next(res['status'] ?? 'saved');
        }
      });
  }

  revertBid(): void {
    this.picksSubject.next(this.savedPicks.slice());
    this.limitAward = this.savedLimitAward;
    this.limitAmount = this.savedLimitAmount;
    this.limitPeriod = this.savedLimitPeriod;
    this.responseSubject.next('none');
  }

  markUnsaved(): void {
    this.responseSubject.next('unsaved');
  }

  // ---- Shift classification (copied from ReliefStoreService) ----
  static classifyShift(shiftCode: string, workgroup = ''): string {
    if (shiftCode === 'XXX' || shiftCode === 'XX') return 'desk-XXX';
    if (workgroup === 'som') return OpenTimeStoreService.classifyShiftSom(shiftCode);
    return OpenTimeStoreService.classifyShiftFs(shiftCode);
  }

  private static classifyShiftSom(shiftCode: string): string {
    const hour = parseInt(shiftCode.substring(1, 3), 10);
    if (shiftCode.length === 4) {
      const deskCode = shiftCode.slice(-1);
      const deskLetters = new Set(['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']);
      if (deskLetters.has(deskCode)) return `desk-${deskCode}`;
    }
    if (hour >= 18) return 'shift-night';
    return 'shift-day';
  }

  private static classifyShiftFs(shiftCode: string): string {
    const deskId = shiftCode.substring(1, 3);
    const isIntl = /[a-zA-Z]/.test(deskId);
    if (isIntl) {
      const firstChar = deskId.charAt(0);
      if (firstChar === '0' || firstChar === '1') return 'fs-pac';
      if (firstChar === '2' || firstChar === '3' || firstChar === '4') return 'fs-nat';
      return 'fs-lat';
    }
    const startChar = shiftCode.charAt(0).toUpperCase();
    if (startChar === 'P') return 'fs-dom-pm';
    if (startChar === 'M') return 'fs-dom-mid';
    return 'fs-dom-am';
  }
}
