import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {BehaviorSubject, ReplaySubject, Subject, forkJoin} from "rxjs";

const reliefParamUrl = environment.baseURL + 'api/bid/reliefParams/'
const reliefShiftsUrl = environment.baseURL + 'api/bid/reliefShifts/'
const reliefBidUrl = environment.baseURL + 'api/bid/reliefBid/'
const reliefDaysUrl = environment.baseURL + 'api/bid/reliefDays/'

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

@Injectable({
  providedIn: 'root'
})

export class ReliefDataService {
  reliefBidParams = new ReplaySubject<reliefParams>()
  reliefDays = new ReplaySubject<string[]>()
  reliefShifts = new ReplaySubject<shift[]>()
  reliefBid = new ReplaySubject()
  reliefBidList = new ReplaySubject()
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


  submitReliefBid(payload: { bid: any; day: string }) {
    console.log(payload)
    const headers = {'Content-Type': 'application/json'}
    return this.http.post(reliefBidUrl, JSON.stringify(payload), {'headers': headers})
      .subscribe(response => {
        this.fetchReliefBid()
        this.httpResponse.next(response['status'])
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

