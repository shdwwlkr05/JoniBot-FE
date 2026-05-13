import {Injectable} from "@angular/core";
import {HttpClient, HttpHeaders, HttpResponse} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {BehaviorSubject, Observable, ReplaySubject, Subject, forkJoin, of} from "rxjs";
import {catchError} from "rxjs/operators";

const reliefParamUrl = environment.baseURL + 'api/bid/reliefParams/'
const reliefShiftsUrl = environment.baseURL + 'api/bid/reliefShifts/'
const reliefBidUrl = environment.baseURL + 'api/bid/reliefBid/'
const reliefDaysUrl = environment.baseURL + 'api/bid/reliefDays/'
const reliefBidOrderUrl = environment.baseURL + 'api/bid/reliefBidOrder/'
const reliefBidderCountUrl = environment.baseURL + 'api/bid/reliefBidderCount/'
const reliefCSVUrl = environment.baseURL + 'api/bid/reliefCSV/'
const adminReliefShiftsUrl = environment.baseURL + 'api/bid/reliefShifts/admin/'
const shortnamesUrl = environment.baseURL + 'api/bid/shortnames/'
const reliefBidExportUrl = environment.baseURL + 'api/bid/reliefBidExport/'

export interface reliefParams {
  id: number,
  start_date: string,
  close_date: string,
}

export interface shift {
  id: number
  day: string
  shift: string
  group: string
  start_time: string
}

export interface reliefWorker {
  bid_order: number,
  shortname: string,
  isCurrentUser: boolean,
  group: string,
}

export interface reliefBid {
  [key: string]: shift[]
}

interface dbBid {
  id: number
  day: string
  bid: string
  timestamp: string
  user: number
}

export interface reliefBidderCountEntry {
  day: string
  count: number
  shortnames: string[]
}

@Injectable({
  providedIn: 'root'
})
export class ReliefDataService {
  reliefBidParams = new ReplaySubject<reliefParams>()
  reliefDays = new ReplaySubject<string[]>()
  reliefShifts = new ReplaySubject<shift[]>()
  reliefBidOrder = new ReplaySubject<reliefWorker[]>()
  reliefBidderCount = new ReplaySubject<reliefBidderCountEntry[]>()
  reliefBid = new ReplaySubject()
  reliefBidList = new ReplaySubject()
  adminReliefShifts = new Subject<shift[]>()
  httpResponse = new Subject<any>()
  userBid
  shifts

  constructor(private http: HttpClient) { }

  fetchReliefParams() {
    this.http.get<reliefParams>(reliefParamUrl).subscribe(reliefParams => {
      this.reliefBidParams.next(reliefParams)
    })
  }

  fetchReliefDays() {
    this.http.get<string[]>(reliefDaysUrl).subscribe(reliefDays => {
      this.reliefDays.next(reliefDays)
    })
  }

  fetchReliefShifts() {
    this.http.get<shift[]>(reliefShiftsUrl).subscribe(reliefShifts => {
      this.reliefShifts.next(reliefShifts)
    })
  }

  fetchReliefBidOrder() {
    forkJoin({
      bidOrder: this.http.get<any>(reliefBidOrderUrl),
      shortnames: this.http.get<{ [userId: string]: string }>(shortnamesUrl).pipe(catchError(() => of({})))
    }).subscribe(({ bidOrder, shortnames }) => {
      const bidOrderArr = Array.isArray(bidOrder) ? bidOrder : [];
      const currentUser = shortnames['current_user'];
      const workers: reliefWorker[] = bidOrderArr
        .sort((a, b) => a.bid_order - b.bid_order)
        .map(entry => ({
          bid_order: entry.bid_order,
          shortname: entry.shortname || shortnames[entry.user] || `User ${entry.user}`,
          isCurrentUser: entry.user === currentUser,
          group: entry.group ?? '',
        }));
      this.reliefBidOrder.next(workers);
    })
  }

  fetchReliefBidderCount() {
    forkJoin({
      raw: this.http.get<{ [date: string]: number[] }>(reliefBidderCountUrl),
      shortnames: this.http.get<{ [userId: string]: string }>(shortnamesUrl).pipe(catchError(() => of({}))),
      bidOrder: this.http.get<any>(reliefBidOrderUrl).pipe(catchError(() => of([])))
    }).subscribe(
      ({ raw, shortnames, bidOrder }) => {
        const bidOrderArr = Array.isArray(bidOrder) ? bidOrder : [];
        // Build userId -> bid_order lookup for sorting
        const orderMap = new Map<number, number>();
        for (const entry of bidOrderArr) {
          orderMap.set(entry.user, entry.bid_order);
        }
        const entries: reliefBidderCountEntry[] = Object.entries(raw).map(([date, userIds]) => ({
          day: date,
          count: userIds.length,
          shortnames: userIds
            .slice()
            .sort((a, b) => (orderMap.get(a) ?? Infinity) - (orderMap.get(b) ?? Infinity))
            .map(id => shortnames[id] || `User ${id}`)
        }));
        this.reliefBidderCount.next(entries);
      },
      error => {
        console.error('reliefBidderCount error:', error);
      }
    );
  }

  fetchReliefBid() {
    if (this.reliefShifts) {
      forkJoin({
        bidData: this.http.get(reliefBidUrl),
        shiftsData: this.http.get(reliefShiftsUrl)
      }).subscribe(
        ({bidData, shiftsData}) => {
          this.userBid = bidData;
          this.shifts = shiftsData;
          this.processData();
        },
        error => {
          console.error('Error fetching data:', error);
        }
      );

    } else {
      this.http.get(reliefBidUrl).subscribe(reliefBid => {
        this.userBid = reliefBid
        this.processData()
      },
        error => {
          console.error('Error fetching data:', error);
        }
      )
    }

  }


  submitReliefBid(payload: { picks: { day: string; shift_id: number; rank: number }[] }) {
    const headers = {'Content-Type': 'application/json'}
    return this.http.post(reliefBidUrl, JSON.stringify(payload), {'headers': headers})
      .subscribe(response => {
        this.fetchReliefBid()
        this.httpResponse.next(response['status'])
      })
  }

  adminFetchReliefShifts() {
    this.http.get<shift[]>(adminReliefShiftsUrl).subscribe(shifts => {
      this.adminReliefShifts.next(shifts)
    })
  }

  setReliefParams(params: reliefParams) {
    return this.http.put(reliefParamUrl, params).subscribe(res => {
      this.fetchReliefParams()
      this.httpResponse.next(res['status'])
    })
  }

  uploadReliefCSV(formData: FormData, filename: string) {
    const headers = new HttpHeaders({
      'Content-Disposition': `attachment; filename="${filename}"`,
    })
    this.http.post(reliefCSVUrl, formData, {headers}).subscribe(
      (response) => {
        this.httpResponse.next(response['status'])
      },
      (error) => {
        console.error('Relief CSV upload error:', error?.error || error)
        this.httpResponse.next('Error uploading file')
      }
    )
  }

  downloadReliefBidExport(family: 'fs' | 'som'): Observable<HttpResponse<Blob>> {
    return this.http.get(reliefBidExportUrl, {
      params: { family },
      responseType: 'blob',
      observe: 'response',
    })
  }

  processData() {
    console.log('User Bid:', this.userBid)
    console.log('Shifts:', this.shifts)
    const processedBid: reliefBid = {}
    const processedBidList = {}
    this.userBid.forEach((bid: dbBid) => {
      let bidIds = bid.bid.split(',').map(id => parseInt(id))
      this.shifts.forEach(shift => {
        if (bidIds.includes(shift.id)) {
          if (!processedBid[shift.day]) {
            processedBid[shift.day] = []
            processedBidList[shift.day] = []
          }
          processedBid[shift.day].push(shift)
          processedBidList[shift.day].push(shift.shift)
        }
      })
    })
    console.log('Processed Bid:', processedBid)
    console.log('Processed Bid List:', processedBidList)
    for (let day in processedBidList) {
      if (processedBidList[day].length <= 5) {
        processedBidList[day] = processedBidList[day].join(', ')
      } else {
        processedBidList[day] = processedBidList[day].slice(0, 5).join(', ') + ', ...'
      }
    }
    this.reliefBid.next(processedBid)
    this.reliefBidList.next(processedBidList)
  }
}

