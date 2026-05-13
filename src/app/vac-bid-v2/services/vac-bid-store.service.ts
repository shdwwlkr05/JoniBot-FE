import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { catchError, map, shareReplay, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { vacBid } from '../../bid-form/data-storage.service';
import {
  VacType, AwardOpt, ViewMode, VacDayCell,
  VacCalendarWeekVm, VacMonthVm, BidDraft
} from '../models/vac-bid-v2.models';

const BASE = environment.baseURL + 'api/bid/';

@Injectable({ providedIn: 'root' })
export class VacBidStoreService {

  // ---- Primary state ----
  private readonly viewModeSubject = new BehaviorSubject<ViewMode>('month');
  readonly viewMode$ = this.viewModeSubject.asObservable();

  private readonly currentMonthSubject = new BehaviorSubject<{ year: number; month: number }>({
    year: environment.currYear, month: 4  // April (bid start)
  });
  readonly currentMonth$ = this.currentMonthSubject.asObservable();

  private readonly draftSubject = new BehaviorSubject<BidDraft>({
    round: 1, choice: 1, startDate: null, endDate: null,
    vacType: 'vac', awardOpt: '50p', useHol: false
  });
  readonly draft$ = this.draftSubject.asObservable();

  private readonly responseSubject = new BehaviorSubject<string | null>(null);
  readonly response$ = this.responseSubject.asObservable();

  // ---- Data from API ----
  private readonly awardCountsSubject = new BehaviorSubject<{ bid_date: string; award_count: number }[]>([]);
  readonly awardCounts$ = this.awardCountsSubject.asObservable();

  private readonly workdaysSubject = new BehaviorSubject<{ workday: string; shift: string }[]>([]);
  readonly workdays$ = this.workdaysSubject.asObservable();

  private readonly workgroupSubject = new BehaviorSubject<string>('');
  readonly workgroup$ = this.workgroupSubject.asObservable();

  private readonly existingBidsSubject = new BehaviorSubject<vacBid[]>([]);
  readonly existingBids$ = this.existingBidsSubject.asObservable();

  private readonly balancesSubject = new BehaviorSubject<Record<string, any>>({});
  readonly balances$ = this.balancesSubject.asObservable();

  private readonly isTesterSubject = new BehaviorSubject<boolean>(false);
  readonly isTester$ = this.isTesterSubject.asObservable();

  // ---- Derived: maxOff per day (from workgroup) ----
  readonly maxOff$: Observable<number> = this.workgroup$.pipe(
    map(wg => {
      switch (wg) {
        case 'ssom': return 2;
        case 'som':  return 7;
        case 'sfsd': return 1;
        case 'sfsi': return 1;
        default:     return 30;
      }
    }),
    shareReplay(1)
  );

  // ---- Derived: award count map (date -> count) ----
  readonly awardCountMap$: Observable<Map<string, number>> = this.awardCounts$.pipe(
    map(counts => {
      const m = new Map<string, number>();
      for (const c of counts) {
        m.set(c.bid_date, c.award_count);
      }
      return m;
    }),
    shareReplay(1)
  );

  // ---- Derived: workday map (date -> shift) ----
  readonly workdayMap$: Observable<Map<string, string>> = this.workdays$.pipe(
    map(wds => {
      const m = new Map<string, string>();
      for (const w of wds) {
        m.set(w.workday, w.shift);
      }
      return m;
    }),
    shareReplay(1)
  );

  // ---- Derived: single-month calendar ----
  readonly monthCalendar$: Observable<VacMonthVm> = combineLatest([
    this.currentMonth$, this.awardCountMap$, this.maxOff$,
    this.workdayMap$, this.draft$
  ]).pipe(
    map(([cm, awards, maxOff, workdays, draft]) =>
      this.buildMonthVm(cm.year, cm.month, awards, maxOff, workdays, draft)
    ),
    shareReplay(1)
  );

  // ---- Derived: year calendar (12 months) ----
  readonly yearCalendar$: Observable<VacMonthVm[]> = combineLatest([
    this.awardCountMap$, this.maxOff$, this.workdayMap$, this.draft$
  ]).pipe(
    map(([awards, maxOff, workdays, draft]) => {
      const months: VacMonthVm[] = [];
      // April current year through March next year
      for (let i = 0; i < 12; i++) {
        const m = ((4 + i - 1) % 12) + 1; // 4,5,6...12,1,2,3
        const y = m >= 4 ? environment.currYear : environment.nextYear;
        months.push(this.buildMonthVm(y, m, awards, maxOff, workdays, draft));
      }
      return months;
    }),
    shareReplay(1)
  );

  // ---- Derived: next choice number ----
  readonly nextChoice$: Observable<number> = combineLatest([this.existingBids$, this.draft$]).pipe(
    map(([bids, draft]) => {
      const roundBids = bids.filter(b => b.round === draft.round);
      return roundBids.length + 1;
    }),
    shareReplay(1)
  );

  // ---- Derived: can submit ----
  readonly canSubmit$: Observable<boolean> = this.draft$.pipe(
    map(d => !!d.startDate),
    shareReplay(1)
  );

  constructor(private readonly http: HttpClient, private readonly authService: AuthService) {}

  // ---- Initialization ----
  init(): void {
    const user = this.authService.user.getValue();
    this.isTesterSubject.next(!!user && this.authService.isTester(user.username));

    this.http.get<{ bid_date: string; award_count: number }[]>(BASE + 'awardCount/')
      .pipe(catchError(() => of([])))
      .subscribe(res => this.awardCountsSubject.next(res));

    this.http.get<{ workday: string; shift: string }[]>(BASE + 'workdays')
      .pipe(catchError(() => of([])))
      .subscribe(res => this.workdaysSubject.next(res));

    this.http.get<{ group: string }[]>(BASE + 'workgroups/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        if (res?.length) this.workgroupSubject.next(res[0].group);
      });

    this.http.get<vacBid[]>(BASE + 'bids/')
      .pipe(catchError(() => of([])))
      .subscribe(res => this.existingBidsSubject.next(res));

    this.http.get<any[]>(BASE + 'balances')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        if (res?.length) this.balancesSubject.next(res[0]);
      });

    // Set initial choice based on existing bids
    this.existingBids$.pipe(take(1)).subscribe(bids => {
      const draft = this.draftSubject.getValue();
      const roundBids = bids.filter(b => b.round === draft.round);
      this.draftSubject.next({ ...draft, choice: roundBids.length + 1 });
    });
  }

  // ---- Actions ----
  selectDate(iso: string): void {
    const draft = this.draftSubject.getValue();
    this.responseSubject.next(null);

    if (!draft.startDate) {
      // No start yet → set start
      this.draftSubject.next({ ...draft, startDate: iso, endDate: null });
    } else if (!draft.endDate) {
      // Have start, no end → set end (swap if needed)
      if (iso < draft.startDate) {
        this.draftSubject.next({ ...draft, startDate: iso, endDate: draft.startDate });
      } else if (iso === draft.startDate) {
        // Same day → single-day range
        this.draftSubject.next({ ...draft, endDate: iso });
      } else {
        this.draftSubject.next({ ...draft, endDate: iso });
      }
    } else {
      // Both set → restart with new start
      this.draftSubject.next({ ...draft, startDate: iso, endDate: null });
    }
  }

  clearSelection(): void {
    const draft = this.draftSubject.getValue();
    this.draftSubject.next({ ...draft, startDate: null, endDate: null });
    this.responseSubject.next(null);
  }

  setRound(round: number): void {
    const draft = this.draftSubject.getValue();
    const bids = this.existingBidsSubject.getValue();
    const roundBids = bids.filter(b => b.round === round);
    let vacType: VacType;
    if (round === 8) {
      vacType = 'ptd';
    } else if (round === 7) {
      vacType = 'any';
    } else if (round <= 6 && draft.vacType !== 'vac' && draft.vacType !== 'ppt') {
      vacType = 'vac';
    } else {
      vacType = draft.vacType;
    }
    this.draftSubject.next({
      ...draft, round, choice: roundBids.length + 1, vacType
    });
  }

  setVacType(vacType: VacType): void {
    const draft = this.draftSubject.getValue();
    this.draftSubject.next({ ...draft, vacType });
  }

  setAwardOpt(awardOpt: AwardOpt): void {
    const draft = this.draftSubject.getValue();
    this.draftSubject.next({ ...draft, awardOpt });
  }

  setUseHol(useHol: boolean): void {
    const draft = this.draftSubject.getValue();
    this.draftSubject.next({ ...draft, useHol });
  }

  navigateMonth(delta: number): void {
    const cm = this.currentMonthSubject.getValue();
    let m = cm.month + delta;
    let y = cm.year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    this.currentMonthSubject.next({ year: y, month: m });
  }

  jumpToMonth(year: number, month: number): void {
    this.currentMonthSubject.next({ year, month });
    this.viewModeSubject.next('month');
  }

  setViewMode(mode: ViewMode): void {
    this.viewModeSubject.next(mode);
  }

  submitBid(): void {
    const draft = this.draftSubject.getValue();
    if (!draft.startDate) {
      this.responseSubject.next('Please select at least one day.');
      return;
    }

    const payload = [{
      round: draft.round,
      choice: draft.choice,
      bid_start_date: draft.startDate,
      bid_end_date: draft.endDate || draft.startDate,
      vac_type: draft.vacType,
      award_opt: draft.awardOpt,
      use_hol: draft.useHol
    }];

    const headers = { 'Content-Type': 'application/json' };
    this.http.post(BASE + 'bids/', JSON.stringify(payload), { headers })
      .pipe(catchError(err => of({ status: 'error: ' + (err.error?.detail || err.message) })))
      .subscribe((res: any) => {
        this.responseSubject.next(res?.status || 'Bid submitted');
        // Refresh bids list
        this.http.get<vacBid[]>(BASE + 'bids/')
          .pipe(catchError(() => of([])))
          .subscribe(bids => {
            this.existingBidsSubject.next(bids);
            // Auto-advance choice
            const d = this.draftSubject.getValue();
            const roundBids = bids.filter(b => b.round === d.round);
            this.draftSubject.next({
              ...d, choice: roundBids.length + 1, startDate: null, endDate: null
            });
          });
      });
  }

  // ---- Calendar builder ----
  private buildMonthVm(
    year: number, month: number,
    awards: Map<string, number>, maxOff: number,
    workdays: Map<string, string>, draft: BidDraft
  ): VacMonthVm {
    const monthNames = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];
    const label = `${monthNames[month - 1]} ${year}`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun

    const bidStart = new Date(environment.currYear, 3, 1); // April 1
    const bidEnd = new Date(environment.nextYear, 2, 31);  // March 31

    // Determine range
    const rangeStart = draft.startDate || '';
    const rangeEnd = draft.endDate || draft.startDate || '';

    const weeks: VacCalendarWeekVm[] = [];
    let week: VacCalendarWeekVm = new Array(7).fill(null);
    let col = firstDow;

    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const iso = `${year}-${mm}-${dd}`;
      const dateObj = new Date(year, month - 1, d);

      const count = awards.get(iso) || 0;
      const pct = maxOff > 0 ? count / maxOff : 0;

      let colorClass = '';
      if (count > 0) {
        if (pct < 0.75)      colorClass = 'award-green';
        else if (pct < 0.85) colorClass = 'award-yellow';
        else if (pct < 1)    colorClass = 'award-orange';
        else                 colorClass = 'award-red';
      }

      const shift = workdays.get(iso) || null;
      const isDisabled = dateObj < bidStart || dateObj > bidEnd;

      let isInRange = false;
      let isRangeStart = false;
      let isRangeEnd = false;
      if (rangeStart && rangeEnd) {
        const lo = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
        const hi = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
        isInRange = iso >= lo && iso <= hi;
        isRangeStart = iso === lo;
        isRangeEnd = iso === hi;
      } else if (rangeStart) {
        isRangeStart = iso === rangeStart;
        isRangeEnd = iso === rangeStart;
        isInRange = iso === rangeStart;
      }

      const cell: VacDayCell = {
        date: iso, dayNumber: d, awardCount: count, maxOff,
        colorClass, workdayShift: shift,
        isInRange, isRangeStart, isRangeEnd, isDisabled
      };

      week[col] = cell;
      col++;
      if (col === 7) {
        weeks.push(week);
        week = new Array(7).fill(null);
        col = 0;
      }
    }
    if (col > 0) weeks.push(week);

    return { year, month, label, weeks };
  }
}
