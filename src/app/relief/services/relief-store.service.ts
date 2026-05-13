import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, startWith, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Use your existing API service (already in your app)
import { ReliefDataService, reliefParams, shift, reliefBidderCountEntry } from './relief-data.service';

// ---- Minimal, local types (we can move these into /models later) ----
export type ReliefShiftType = 'Relief' | 'Primary' | 'Unknown';

export interface ReliefParams {
  id: number;
  year: number;
  bid_round?: number | null;
  [key: string]: any;
}

export interface ReliefDay {
  id: number;
  date: string; // ISO yyyy-mm-dd
  [key: string]: any;
}

export interface ReliefShift {
  id: number;
  day: number; // day id
  date?: string; // ISO yyyy-mm-dd (optional)
  start_time: string; // e.g. "07:00"
  end_time: string;   // e.g. "19:00"
  desk?: string | null;
  shift_type?: ReliefShiftType | string | null;
  required_rank?: number | null;
  [key: string]: any;
}

export interface BidPick {
  shiftId: number;
  day: string;
  shift: string;
  group: string;
}

export interface ReliefBidPayload {
  picks: { day: string; shift_id: number | null; shift_code: string; rank: number }[];
  note?: string;
}

export interface CalendarDayVm {
  date: string; // yyyy-mm-dd
  label: string; // e.g. "Mon 2"
  dayId?: number;
  shifts: ReliefShift[];
}

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
  openCount: number;   // non-XXX shifts
  reliefCount: number; // relief bidders scheduled this day
  bidderNames: string[]; // shortnames of bidders in bid order
}

/** One row (week) of the calendar grid — always 7 entries (Sun–Sat) */
export type CalendarWeekVm = (CalendarDayCell | null)[];

/** Picks grouped by day number for the bid list display */
export interface DayPickGroup {
  day: string;
  label: string; // e.g. "Apr 15"
  picks: BidPick[];
  requiredPicks: number; // user's position in bid order for this day
  totalAvailable: number; // total biddable shifts for this day
  isComplete: boolean; // true when enough picks or all shifts exhausted
}

@Injectable({
  providedIn: 'root'
})
export class ReliefStoreService {
  // ---- Primary state ----
  private readonly selectedMonthSubject = new BehaviorSubject<string | null>(null); // yyyy-mm
  readonly selectedMonth$ = this.selectedMonthSubject.asObservable().pipe(distinctUntilChanged());

  private readonly bidderNameSubject = new BehaviorSubject<string | null>(null);
  readonly bidderName$ = this.bidderNameSubject.asObservable().pipe(distinctUntilChanged());

  private readonly picksSubject = new BehaviorSubject<BidPick[]>([]);
  readonly picks$ = this.picksSubject.asObservable().pipe(shareReplay(1));

  private readonly noteSubject = new BehaviorSubject<string>('');
  readonly note$ = this.noteSubject.asObservable();

  private readonly workgroupSubject = new BehaviorSubject<string>('');
  readonly workgroup$ = this.workgroupSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));

  private readonly intlQualifiedSubject = new BehaviorSubject<boolean>(false);
  readonly isIntlQualified$ = this.intlQualifiedSubject.asObservable().pipe(distinctUntilChanged(), shareReplay(1));

  // ---- Data sources from API ----
  // The data service subscribes internally and pushes to ReplaySubjects,
  // so we trigger the fetches and then expose the subjects as our streams.
  readonly params$: Observable<ReliefParams[]> = this.reliefData.reliefBidParams.asObservable().pipe(
    map(p => (Array.isArray(p) ? p : [p]) as ReliefParams[]),
    shareReplay(1)
  );
  readonly days$: Observable<ReliefDay[]> = this.reliefData.reliefDays.asObservable().pipe(
    map(d => d as unknown as ReliefDay[]),
    shareReplay(1)
  );
  readonly shifts$: Observable<ReliefShift[]> = this.reliefData.reliefShifts.asObservable().pipe(
    map(s => s as unknown as ReliefShift[]),
    shareReplay(1)
  );
  readonly bidOrder$ = this.reliefData.reliefBidOrder.asObservable().pipe(
    shareReplay(1)
  );

  /** Raw params from the API (reliefParams shape: {id, start_date, close_date}) */
  readonly rawParams$: Observable<reliefParams> = this.reliefData.reliefBidParams.asObservable();

  /** Raw shifts from the API (shift shape: {id, day, shift, group}) */
  readonly rawShifts$: Observable<shift[]> = this.reliefData.reliefShifts.asObservable();

  // ---- Derived data ----
  readonly availableMonths$: Observable<string[]> = combineLatest([this.days$, this.shifts$]).pipe(
    map(([days, shifts]) => {
      // Prefer day.date if present, otherwise shift.date.
      const monthSet = new Set<string>();
      for (const d of days) {
        if (d?.date && d.date.length >= 7) monthSet.add(d.date.slice(0, 7));
      }
      for (const s of shifts) {
        if (s?.date && s.date.length >= 7) monthSet.add(s.date.slice(0, 7));
      }
      return Array.from(monthSet).sort();
    }),
    shareReplay(1)
  );

  readonly monthShifts$: Observable<ReliefShift[]> = combineLatest([this.shifts$, this.selectedMonth$]).pipe(
    map(([shifts, month]) => {
      if (!month) return [];
      return shifts.filter(s => (s.date ?? '').startsWith(month));
    }),
    shareReplay(1)
  );

  readonly calendarVm$: Observable<CalendarDayVm[]> = combineLatest([
    this.days$,
    this.monthShifts$,
    this.selectedMonth$
  ]).pipe(
    map(([days, monthShifts, month]) => {
      if (!month) return [];

      // Build map dayId -> date
      const dayIdToDate = new Map<number, string>();
      for (const d of days) {
        if (typeof d?.id === 'number' && typeof d?.date === 'string') {
          dayIdToDate.set(d.id, d.date);
        }
      }

      // Bucket shifts by ISO date
      const byDate = new Map<string, ReliefShift[]>();
      for (const s of monthShifts) {
        const date = s.date ?? dayIdToDate.get(s.day);
        if (!date) continue;
        const list = byDate.get(date) ?? [];
        // normalize date onto shift so templates can rely on it
        list.push({ ...s, date });
        byDate.set(date, list);
      }

      // Compute all days in the selected month
      const [yStr, mStr] = month.split('-');
      const year = Number(yStr);
      const monthIndex = Number(mStr) - 1;
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return [];

      const first = new Date(Date.UTC(year, monthIndex, 1));
      const nextMonth = new Date(Date.UTC(year, monthIndex + 1, 1));
      const out: CalendarDayVm[] = [];

      for (let d = new Date(first); d < nextMonth; d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))) {
        const iso = d.toISOString().slice(0, 10);
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
        const dayNum = d.getUTCDate();
        const shifts = (byDate.get(iso) ?? []).slice().sort((a, b) => {
          // simple sort by start_time then desk
          const at = a.start_time ?? '';
          const bt = b.start_time ?? '';
          if (at !== bt) return at.localeCompare(bt);
          return (a.desk ?? '').localeCompare(b.desk ?? '');
        });

        // Find matching dayId (if days list includes this date)
        const dayMatch = days.find(x => x?.date === iso);

        out.push({
          date: iso,
          label: `${weekday} ${dayNum}`,
          dayId: dayMatch?.id,
          shifts
        });
      }

      return out;
    }),
    shareReplay(1)
  );

  /** Relief bidder counts per day from API (starts with empty so calendar still renders) */
  readonly rawBidderCount$: Observable<reliefBidderCountEntry[]> = this.reliefData.reliefBidderCount.asObservable().pipe(
    startWith([] as reliefBidderCountEntry[]),
    catchError(() => of([] as reliefBidderCountEntry[]))
  );

  /** Weekly calendar grid built from actual API data (reliefParams + reliefShifts + reliefBidderCount) */
  readonly shiftCalendar$: Observable<CalendarWeekVm[]> = combineLatest([
    this.rawParams$,
    this.rawShifts$,
    this.rawBidderCount$,
    this.workgroup$.pipe(startWith(''))
  ]).pipe(
    map(([params, shifts, bidderCounts, workgroup]) => {
      // Extract month/year from params.start_date (e.g. "2025-04-01")
      const startDate = params?.start_date;
      if (!startDate) return [];

      const [yStr, mStr] = startDate.split('-');
      const year = Number(yStr);
      const monthIndex = Number(mStr) - 1;
      if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return [];

      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      // Build bidder data lookup by day number
      // Handles both "15" (day-of-month) and "2025-04-15" (full date) formats
      const bidderByDay = new Map<number, reliefBidderCountEntry>();
      for (const entry of bidderCounts) {
        const raw = entry.day;
        let dayNum: number;
        if (raw && raw.includes('-')) {
          // Full date string like "2025-04-15" — extract day
          dayNum = new Date(raw + 'T00:00:00').getDate();
        } else {
          dayNum = Number(raw);
        }
        if (dayNum >= 1 && dayNum <= daysInMonth) {
          bidderByDay.set(dayNum, entry);
        }
      }

      // Group shifts by day number
      const byDay = new Map<number, shift[]>();
      for (const s of shifts) {
        const dayNum = Number(s.day);
        if (!dayNum || dayNum < 1 || dayNum > daysInMonth) continue;
        const list = byDay.get(dayNum) ?? [];
        list.push(s);
        byDay.set(dayNum, list);
      }

      // Build day cells with sorted shifts, CSS classes, and counts
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

        const openCount = dayShifts.filter(s => s.shift !== 'XXX').length;
        const bidderEntry = bidderByDay.get(d);
        const reliefCount = bidderEntry?.count ?? 0;
        const extra = reliefCount - openCount;

        // Build shift VMs
        const shiftVms: ShiftVm[] = dayShifts.map(s => ({
          id: s.id,
          day: s.day,
          shift: s.shift,
          group: s.group,
          cssClass: ReliefStoreService.classifyShift(s.shift, workgroup),
          start_time: s.start_time ?? ''
        }));

        // Add a virtual XX shift if 2 or more extras
        if (extra >= 2) {
          shiftVms.push({
            id: -(d * 1000), // negative synthetic id
            day: String(d),
            shift: 'XX',
            group: '',
            cssClass: 'desk-XXX',
            start_time: ''
          });
        }

        dayCells.set(d, {
          dayNumber: d,
          openCount,
          reliefCount,
          bidderNames: bidderEntry?.shortnames ?? [],
          shifts: shiftVms
        });
      }

      // Build weekly grid (Sun=0 through Sat=6)
      const firstDow = new Date(year, monthIndex, 1).getDay(); // 0=Sun
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
      // Push final partial week if it has any days
      if (col > 0) {
        weeks.push(week);
      }

      return weeks;
    }),
    shareReplay(1)
  );

  readonly picksGrouped$: Observable<DayPickGroup[]> = combineLatest([
    this.picks$,
    this.rawParams$,
    this.bidOrder$,
    this.rawBidderCount$,
    this.shiftCalendar$
  ]).pipe(
    map(([picks, params, bidOrder, bidderCounts, weeks]) => {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const monthIdx = params?.start_date ? Number(params.start_date.split('-')[1]) - 1 : 0;
      const monthAbbr = monthNames[monthIdx] ?? '';

      // Find current user's shortname from bid order
      const currentWorker = bidOrder.find(w => w.isCurrentUser);
      const currentShortname = currentWorker?.shortname ?? '';

      // Build lookup: day number -> bidder shortnames (in bid order)
      const biddersByDay = new Map<number, string[]>();
      for (const entry of bidderCounts) {
        const raw = entry.day;
        let dayNum: number;
        if (raw && raw.includes('-')) {
          dayNum = new Date(raw + 'T00:00:00').getDate();
        } else {
          dayNum = Number(raw);
        }
        biddersByDay.set(dayNum, entry.shortnames);
      }

      // Build lookup: day number -> total available shifts from calendar
      const availableByDay = new Map<number, number>();
      for (const week of weeks) {
        for (const cell of week) {
          if (cell) {
            availableByDay.set(cell.dayNumber, cell.shifts.length);
          }
        }
      }

      const grouped = new Map<string, BidPick[]>();
      for (const p of picks) {
        const list = grouped.get(p.day) ?? [];
        list.push(p);
        grouped.set(p.day, list);
      }
      return Array.from(grouped.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([day, dayPicks]) => {
          const dayNum = Number(day);
          const dayBidders = biddersByDay.get(dayNum) ?? [];
          const userPos = dayBidders.indexOf(currentShortname) + 1; // 1-indexed, 0 if not found
          const requiredPicks = userPos > 0 ? userPos : 1;
          const totalAvailable = availableByDay.get(dayNum) ?? 0;
          const needed = Math.min(requiredPicks, totalAvailable);
          return {
            day,
            label: `${monthAbbr} ${day}`,
            picks: dayPicks,
            requiredPicks,
            totalAvailable,
            isComplete: dayPicks.length >= needed
          };
        });
    }),
    shareReplay(1)
  );

  /** Set of day-of-month numbers where the user has a RLF workday */
  readonly rlfWorkDays$: Observable<Set<number>> = combineLatest([
    this.rawParams$,
    this.http.get<{workday: string; shift: string}[]>(environment.baseURL + 'api/bid/workdays')
  ]).pipe(
    map(([params, workdays]) => {
      const startDate = params?.start_date;
      if (!startDate) return new Set<number>();
      const monthPrefix = startDate.slice(0, 7); // "2025-04"
      const rlfDays = new Set<number>();
      for (const wd of workdays) {
        if (wd.shift === 'RLF' && wd.workday.startsWith(monthPrefix)) {
          const dayNum = new Date(wd.workday + 'T00:00:00').getDate();
          rlfDays.add(dayNum);
        }
      }
      return rlfDays;
    }),
    shareReplay(1)
  );

  readonly canSubmit$: Observable<boolean> = this.picks$.pipe(
    map(picks => picks.length > 0),
    shareReplay(1)
  );

  constructor(private readonly reliefData: ReliefDataService, private readonly http: HttpClient) {
    // Trigger the HTTP fetches (data service subscribes internally and pushes to ReplaySubjects)
    this.reliefData.fetchReliefParams();
    this.reliefData.fetchReliefDays();
    this.reliefData.fetchReliefShifts();
    this.reliefData.fetchReliefBidOrder();
    this.reliefData.fetchReliefBidderCount();
    this.loadExistingBid();
    this.http.get<{group: string}[]>(environment.baseURL + 'api/bid/workgroups/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        if (res?.length) this.workgroupSubject.next(res[0].group);
      });
    this.http.get<{qualification: string}[]>(environment.baseURL + 'api/bid/userqual/')
      .pipe(catchError(() => of([])))
      .subscribe(res => {
        const quals = res?.[0]?.qualification ?? '';
        this.intlQualifiedSubject.next(quals.includes('INTL'));
      });
  }

  private loadExistingBid(): void {
    const url = environment.baseURL + 'api/bid/reliefBid/';
    this.http.get<any>(url)
      .pipe(catchError(() => of(null)))
      .subscribe(raw => {
        // Handle both array response and wrapper object with { picks, note }
        let entries: any[];
        let note = '';
        if (Array.isArray(raw)) {
          entries = raw;
        } else if (raw?.picks) {
          entries = raw.picks;
          note = raw.note ?? '';
        } else {
          return;
        }
        if (entries.length === 0) return;
        const picks: BidPick[] = entries
          .slice()
          .sort((a, b) => Number(a.day) - Number(b.day) || a.rank - b.rank)
          .map(entry => ({
            shiftId: entry.shift_id ?? -(Number(entry.day) * 1000),
            shift: entry.shift_code,
            group: entry.group ?? '',
            day: entry.day
          }));
        this.picksSubject.next(picks);
        this.noteSubject.next(note);
      });
  }

  // ---- Actions ----
  setSelectedMonth(month: string | null): void {
    this.selectedMonthSubject.next(month);
    // Clear picks when you switch months (matches typical bid UX)
    this.picksSubject.next([]);
  }

  setBidderName(name: string | null): void {
    this.bidderNameSubject.next(name ? name.trim() : null);
  }

  setNote(note: string): void {
    this.noteSubject.next(note);
  }

  clearPicks(): void {
    this.picksSubject.next([]);
  }

  addPick(shiftVm: ShiftVm): void {
    const current = this.picksSubject.getValue();
    // Prevent duplicate picks
    if (current.some(p => p.shiftId === shiftVm.id)) return;
    const pick: BidPick = {
      shiftId: shiftVm.id,
      day: shiftVm.day,
      shift: shiftVm.shift,
      group: shiftVm.group
    };
    this.picksSubject.next([...current, pick]);
  }

  removePick(index: number): void {
    const current = this.picksSubject.getValue();
    if (index < 0 || index >= current.length) return;
    const next = current.slice();
    next.splice(index, 1);
    this.picksSubject.next(next);
  }

  removePickByShiftId(shiftId: number): void {
    const current = this.picksSubject.getValue();
    this.picksSubject.next(current.filter(p => p.shiftId !== shiftId));
  }

  clearDay(day: string): void {
    const current = this.picksSubject.getValue();
    this.picksSubject.next(current.filter(p => p.day !== day));
  }

  movePick(previousIndex: number, currentIndex: number): void {
    const current = this.picksSubject.getValue();
    if (previousIndex === currentIndex) return;
    if (previousIndex < 0 || previousIndex >= current.length) return;
    if (currentIndex < 0 || currentIndex >= current.length) return;

    const next = current.slice();
    const [item] = next.splice(previousIndex, 1);
    next.splice(currentIndex, 0, item);
    this.picksSubject.next(next);
  }

  movePickInDay(day: string, previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;
    const current = this.picksSubject.getValue();
    // Collect flat indices for picks belonging to this day
    const dayIndices: number[] = [];
    for (let i = 0; i < current.length; i++) {
      if (current[i].day === day) dayIndices.push(i);
    }
    if (previousIndex < 0 || previousIndex >= dayIndices.length) return;
    if (currentIndex < 0 || currentIndex >= dayIndices.length) return;
    this.movePick(dayIndices[previousIndex], dayIndices[currentIndex]);
  }

  /**
   * Submit the bid to the backend.
   * Builds per-day ranked picks from the current picks state.
   */
  submitBid(): Observable<any> {
    const picks = this.picksSubject.getValue();

    if (picks.length === 0) {
      throw new Error('No picks selected. Click shifts in the calendar to add them to your bid.');
    }

    // Group by day and assign rank (1-indexed) within each day
    const byDay = new Map<string, BidPick[]>();
    for (const p of picks) {
      const list = byDay.get(p.day) ?? [];
      list.push(p);
      byDay.set(p.day, list);
    }

    const rankedPicks: ReliefBidPayload['picks'] = [];
    for (const [day, dayPicks] of byDay) {
      dayPicks.forEach((p, i) => {
        const isXX = p.shift === 'XX';
        rankedPicks.push({
          day,
          shift_id: isXX ? null : p.shiftId,
          shift_code: p.shift,
          rank: i + 1
        });
      });
    }

    const url = environment.baseURL + 'api/bid/reliefBid/';
    const payload: ReliefBidPayload = { picks: rankedPicks, note: this.noteSubject.getValue() };
    return this.http.post(url, payload);
  }

  /**
   * Convenience loader for components that want to show a spinner until all data is ready.
   * (Data streams are already shareReplay'd, so this only fetches once.)
   */
  preloadAll(): Observable<[ReliefParams[], ReliefDay[], ReliefShift[]]> {
    return combineLatest([this.params$, this.days$, this.shifts$]).pipe(take(1));
  }

  /** Classify a shift code into a CSS class for color-coding */
  static classifyShift(shiftCode: string, workgroup = ''): string {
    if (shiftCode === 'XXX' || shiftCode === 'XX') return 'desk-XXX';

    if (workgroup === 'som') {
      return ReliefStoreService.classifyShiftSom(shiftCode);
    }

    // FS classification (default)
    return ReliefStoreService.classifyShiftFs(shiftCode);
  }

  /** SOM workgroup shift classification */
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

  /** FS workgroup shift classification.
   *  Format: [start][deskId][length] e.g. A06F, P12N, M18T
   *  Start: E/A = AM, P = PM, M = mid
   *  DeskId (chars 1-2): digits = domestic, alphanumeric = international
   *    Intl theater by first digit: 0/1 = PAC, 2/3/4 = NAT, 5/6/7/8 = LAT
   */
  private static classifyShiftFs(shiftCode: string): string {
    const deskId = shiftCode.substring(1, 3);
    const isIntl = /[a-zA-Z]/.test(deskId);
    if (isIntl) {
      const firstChar = deskId.charAt(0);
      if (firstChar === '0' || firstChar === '1') return 'fs-pac';
      if (firstChar === '2' || firstChar === '3' || firstChar === '4') return 'fs-nat';
      return 'fs-lat';
    }
    // Domestic — classify by start time
    const startChar = shiftCode.charAt(0).toUpperCase();
    if (startChar === 'P') return 'fs-dom-pm';
    if (startChar === 'M') return 'fs-dom-mid';
    return 'fs-dom-am';
  }
}
