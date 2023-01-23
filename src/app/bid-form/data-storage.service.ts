import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'

import { Bid } from './bid.model'
import { map, tap } from 'rxjs/operators'
import { BidService } from './bid.service'
import { CalendarService } from '../calendar/calendar.service'
import { environment } from '../../environments/environment'
import { BehaviorSubject, Subject } from 'rxjs'
import {Router} from "@angular/router";


const bidsURL = environment.baseURL + 'api/bid/bids/'
const bidsUpdateURL = environment.baseURL + 'api/bid/bids/update/'
const workdayUrl = environment.baseURL + 'api/bid/workdays'
const balanceUrl = environment.baseURL + 'api/bid/balances'
const awardUrl = environment.baseURL + 'api/bid/awards'
const awardCountUrl = environment.baseURL + 'api/bid/awardCount/'
const usedHolUrl = environment.baseURL + 'api/bid/usedHol'
const round7UsageUrl = environment.baseURL + 'api/bid/round7'
const openTimeShiftsUrl = environment.baseURL + 'api/bid/openTimeShifts'
const openTimeBidUrl = environment.baseURL + 'api/bid/openTimeBid/'
const workgroupUrl = environment.baseURL + 'api/bid/workgroups/'
const totalUrl = environment.baseURL + 'api/bid/rank/'
const rankUrl = environment.baseURL + 'api/bid/bidTime'
const shiftTimesUrl = environment.baseURL + 'api/bid/shifttimes/'
const linesUrl = environment.baseURL + 'api/bid/lines/'
const linesWorkdaysUrl = environment.baseURL + 'api/bid/lineworkdays/'
const lineBidUrl = environment.baseURL + 'api/bid/linebid/'
const adminLineBidUrl = environment.baseURL + 'api/bid/adminlinebid/'
const bidTimeUrl = environment.baseURL + 'api/bid/bidTime/'
const userListUrl = environment.baseURL + 'api/bid/userlist/'
const shortnameUrl = environment.baseURL + 'api/bid/shortnames/'
const lineAwardsUrl = environment.baseURL + 'api/bid/lineawards/'


export interface filters {
  showAM: boolean;
  showPM: boolean;
  showMID: boolean;
  showRLF: boolean;
  showDOM: boolean;
  showINTL: boolean;
  showFleet: boolean;
  showSPT: boolean;
  showNine: boolean;
  showTen: boolean;
  showAwarded: boolean;
  selectedRotations: string[];
  selectedStartTimes: string[];
}

export interface line {
  desk: string;
  id: number;
  length: string;
  line_number: string;
  rotation: string;
  theater: string;
  time_of_day: string;
  workgroup: string;
  workdays: any[];
  allWorkdays: any[];
  workdays_str: string[];
  selected: boolean;
  start_time: string;
}

export interface award {
  id: number;
  workgroup: string;
  line_number: number;
  user: number;
}

export interface workday {
  id: number;
  workday: string;
  shift_id: string;
  line_id: number;
}

export interface user {
  id: number;
  round1: string;
  round2: string;
  shiftbid: string;
  opentime: number;
  shiftbidrank: number;
  user: number;
}

export interface vacBid {
  id: number;
  round: number;
  choice: number;
  bid_start_date: string;
  bid_end_date: string;
  vac_type: string;
  award_opt: string;
  use_hol: boolean;
  user: number;
}


@Injectable({
  providedIn: 'root'
})
export class DataStorageService {
  openTimeShifts = new Subject<any>();
  openTimeBid = new Subject<any>();
  httpResponse = new Subject<any>();
  userWorkgroup = new BehaviorSubject<any>('fs');
  workgroupCount = new Subject<any>();
  openTimeRank = new Subject<any>();
  shiftTimes = new Subject<any>();
  lines = new BehaviorSubject<any>([]);
  userList = new BehaviorSubject<any>([]);
  shortnames = new BehaviorSubject<any>([]);
  // lines = new Subject<any>();
  lineWorkdays = new Subject<any>();
  lineBid = new Subject<any>();
  lineAwards = new Subject<any>();
  bidTime = new Subject<any>();
  allLines
  allWorkdays
  vacBid = new Subject<any>()

  constructor(private http: HttpClient,
              private bidService: BidService,
              private calendarService: CalendarService) {
  }

  fetchBids() {
    return this.http.get(bidsURL).subscribe((response:vacBid[]) => {
      this.vacBid.next(response)
    })
  }

  fetchRound7() {
    const groupedBids = {'vac': [], 'ppt': [], 'hol': [], 'adj': [], 'any': []}
    return this.http.get<Bid[]>(bidsURL,
      {
        params: new HttpParams()
          .set('round', '7')
      }).pipe(
      map(bids => {
        for (let bid of bids) {
          groupedBids[bid['vac_type']].push(bid)
        }
        groupedBids['vac'].sort((a, b) => (a.choice > b.choice) ? 1 : ((b.choice > a.choice) ? -1 : 0))
        groupedBids['ppt'].sort((a, b) => (a.choice > b.choice) ? 1 : ((b.choice > a.choice) ? -1 : 0))
        groupedBids['hol'].sort((a, b) => (a.choice > b.choice) ? 1 : ((b.choice > a.choice) ? -1 : 0))
        groupedBids['adj'].sort((a, b) => (a.choice > b.choice) ? 1 : ((b.choice > a.choice) ? -1 : 0))
        groupedBids['any'].sort((a, b) => (a.choice > b.choice) ? 1 : ((b.choice > a.choice) ? -1 : 0))
        return groupedBids
      }),
      tap(bids => {
        this.bidService.setRound7(bids)
      })
    )
  }

  fetchWorkdays() {
    return this.http.get(workdayUrl).pipe(tap(workdays => {
      this.calendarService.setWorkdays(workdays)
    }))
  }

  fetchAwardCounts() {
    return this.http.get(awardCountUrl).pipe(tap(counts => {
        this.calendarService.setAwardCounts(counts)
    }))
  }

  submitBid(bid: vacBid[]) {
    const headers = {'Content-Type': 'application/json',
      'access-control-allow-origin': 'https://flightcontrolbidder.web.app'}
    this.http.post(bidsURL, JSON.stringify(bid), {'headers': headers})
      .subscribe(res => {
        this.fetchBids()
        this.bidService.httpResponse.next(res['status'])
      })
  }

  deleteBid(bid:vacBid[]) {
    const bid_ids = bid.map(bid => bid.id)
    const options = {
      headers: {'Content-Type': 'application/json',
        'access-control-allow-origin': 'https://flightcontrolbidder.web.app'
      },
      body: {id: bid_ids}
    }
    this.http.delete(bidsURL, options).subscribe(() => this.fetchBids())
  }

  updateBid(bid) {
    const headers = {'Content-Type': 'application/json',
      'access-control-allow-origin': 'https://flightcontrolbidder.web.app'}
    this.http
      .put(bidsURL, JSON.stringify(bid), {'headers': headers}).subscribe(res => {
      this.fetchBids()
      this.bidService.httpResponse.next(res['status'])
    })
  }


  fetchBalances() {
    return this.http.get(balanceUrl).subscribe(balances => {
      this.bidService.setBalances(balances[0])
    })

  }


  fetchAwards() {
    return this.http.get<[]>(awardUrl)
  }


  fetchUserAwards() {
    return this.http.get<[]>(awardUrl + '/user').subscribe(awards => {
      this.bidService.setAwards(awards)
    })
  }


  fetchUsedHolidays() {
    return this.http.get<[]>(usedHolUrl).subscribe(holidays => {
      if (!!holidays) {
        this.bidService.setUsedHol(holidays)
      }
    })
  }


  fetchRound7Usage() {
    return this.http.get(round7UsageUrl).subscribe(usage => {
      if (!!usage) {
        this.bidService.setRound7Usage(usage[0])
      }
    })
  }


  updateRound7Usage(usages) {
    const url = round7UsageUrl + '/' + usages.id + '/'
    return this.http.put(url, usages).subscribe(() => {
      this.fetchRound7Usage()
      location.reload()
    })
  }


  fetchOpenTimeShifts() {
    return this.http.get(openTimeShiftsUrl).subscribe(shifts => {
      this.openTimeShifts.next(shifts)
    })
  }


  fetchWorkgroupCount() {
    return this.http.get(totalUrl).subscribe(count => {
      this.workgroupCount.next(count['user_count'])
    })
  }


  fetchOpenTimeBid() {
    return this.http.get(openTimeBidUrl).subscribe(bid => {
      this.openTimeBid.next(bid)
    })
  }

  fetchUserList() {
    return this.http.get(userListUrl).subscribe(users => {
      this.userList.next(users)
    })
  }

  fetchShortNames() {
    return this.http.get(shortnameUrl).subscribe(names => {
      this.shortnames.next(names)
    })
  }


  fetchOpenTimeRank() {
    return this.http.get(rankUrl).subscribe(rank => {
      this.openTimeRank.next(rank[0]['opentime'])
    })
  }


  fetchWorkgroup() {
    return this.http.get(workgroupUrl).subscribe(workgroup => {
      this.userWorkgroup.next(workgroup[0].group)
    })
  }


  submitOpenTimeBid(payload) {
    const headers = {'Content-Type': 'application/json'}
    return this.http.post(openTimeBidUrl, JSON.stringify(payload), {'headers': headers})
      .subscribe(response => {
        this.fetchOpenTimeBid()
        this.httpResponse.next(response['status'])
      })
  }

  fetchShiftTimes() {
    return this.http.get(shiftTimesUrl).subscribe(times => {
      this.shiftTimes.next(times)
    })
  }

  // TODO: Create a service for this
  fetchLines() {
    return this.http.get(linesUrl).subscribe(lines => {
      this.allLines = lines
      this.lines.next(lines)
    })
  }

  fetchLineAwards() {
    return this.http.get(lineAwardsUrl).subscribe(awards => {
      this.lineAwards.next(awards)
    })
  }

  fetchLineWorkdays() {
    return this.http.get(linesWorkdaysUrl).subscribe(workdays => {
      this.allWorkdays = workdays
      if (this.allLines) {
        this.setLineWorkdays()
      }
      // this.lineWorkdays.next(workdays)
    })
  }

  setLineWorkdays() {
    this.allLines.forEach((line:line) => {
      line.allWorkdays = this.allWorkdays.filter(workday => workday.line_id == line.id)
      line.workdays_str = line.allWorkdays.map(workday => workday.workday)
    })
    this.lines.next(this.allLines)
  }

  saveLineBid(payload, saveType) {
    const headers = {'Content-Type': 'application/json'}
    return this.http.post(lineBidUrl, JSON.stringify(payload), {'headers': headers})
      .subscribe(response => {
        this.fetchLineBid()
        this.httpResponse.next(`${saveType} ${response['status']}`)
      })
  }

  fetchLineBid() {
    return this.http.get(lineBidUrl).subscribe(response => {
      if (response['bid'] == '0') {
        this.lineBid.next({'bid': null})
      } else {
        this.lineBid.next(response)
      }
    })
  }

  adminFetchLineBid(userID) {
    const headers = {'Content-Type': 'application/json'}
    const payload = {'user': userID}
    return this.http.post(adminLineBidUrl, JSON.stringify(payload), {'headers': headers})
      .subscribe(response => {
        if (response['bid'] == '0') {
          this.lineBid.next({'bid': null})
        } else {
          this.lineBid.next(response)
        }
      })
  }

  fetchBidTime() {
    return this.http.get(bidTimeUrl).subscribe(response => {
      this.bidTime.next(response)
    })
  }

  storeFilters(filters:filters) {
    localStorage.setItem('showAM', String(filters.showAM))
    localStorage.setItem('showPM', String(filters.showPM))
    localStorage.setItem('showMID', String(filters.showMID))
    localStorage.setItem('showRLF', String(filters.showRLF))
    localStorage.setItem('showDOM', String(filters.showDOM))
    localStorage.setItem('showINTL', String(filters.showINTL))
    localStorage.setItem('showFleet', String(filters.showFleet))
    localStorage.setItem('showSPT', String(filters.showSPT))
    localStorage.setItem('showNine', String(filters.showNine))
    localStorage.setItem('showTen', String(filters.showTen))
    localStorage.setItem('showAwarded', String(filters.showAwarded))
    localStorage.setItem('selectedRotations', filters.selectedRotations.join(','))
    localStorage.setItem('selectedStartTimes', filters.selectedStartTimes.join(','))
  }

  fetchFilters() {
    let filters = <filters>{}
    if (localStorage.getItem('showAM') === null) {
      filters.showAM = true
    } else {
      filters.showAM = (localStorage.getItem('showAM')==='true')
    }
    if (localStorage.getItem('showPM') === null) {
      filters.showPM = true
    } else {
      filters.showPM = (localStorage.getItem('showPM')==='true')
    }
    if (localStorage.getItem('showMID') === null) {
      filters.showMID = true
    } else {
      filters.showMID = (localStorage.getItem('showMID')==='true')
    }
    if (localStorage.getItem('showRLF') === null) {
      filters.showRLF = true
    } else {
      filters.showRLF = (localStorage.getItem('showRLF')==='true')
    }
    if (localStorage.getItem('showDOM') === null) {
      filters.showDOM = true
    } else {
      filters.showDOM = (localStorage.getItem('showDOM')==='true')
    }
    if (localStorage.getItem('showINTL') === null) {
      filters.showINTL = true
    } else {
      filters.showINTL = (localStorage.getItem('showINTL')==='true')
    }
    if (localStorage.getItem('showFleet') === null) {
      filters.showFleet = true
    } else {
      filters.showFleet = (localStorage.getItem('showFleet')==='true')
    }
    if (localStorage.getItem('showSPT') === null) {
      filters.showSPT = true
    } else {
      filters.showSPT = (localStorage.getItem('showSPT')==='true')
    }
    if (localStorage.getItem('showNine') === null) {
      filters.showNine = true
    } else {
      filters.showNine = (localStorage.getItem('showNine')==='true')
    }
    if (localStorage.getItem('showTen') === null) {
      filters.showTen = true
    } else {
      filters.showTen = (localStorage.getItem('showTen')==='true')
    }
    if (localStorage.getItem('showAwarded') === null) {
      filters.showAwarded = true
    } else {
      filters.showAwarded = (localStorage.getItem('showAwarded')==='true')
    }
    if (localStorage.getItem('selectedRotations') === null) {
      filters.selectedRotations = ['All']
    } else {
      filters.selectedRotations = localStorage.getItem('selectedRotations').split(',')
    }
    if (localStorage.getItem('selectedStartTimes') === null) {
      filters.selectedStartTimes = ['All']
    } else {
      filters.selectedStartTimes = localStorage.getItem('selectedStartTimes').split(',')
    }
    return filters
  }




}
