import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'

import { Bid } from './bid.model'
import { map, tap } from 'rxjs/operators'
import { BidService } from './bid.service'
import { CalendarService } from '../calendar/calendar.service'
import { environment } from '../../environments/environment'
import { BehaviorSubject, Subject } from 'rxjs'


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
const bidTimeUrl = environment.baseURL + 'api/bid/bidTime/'
const userListUrl = environment.baseURL + 'api/bid/userlist/'
const shortnameUrl = environment.baseURL + 'api/bid/shortnames/'
const lineAwardsUrl = environment.baseURL + 'api/bid/lineawards/'

interface filters {
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
  selectedRotations: string[];
  selectedStartTimes: string[];
}

interface line {
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

  constructor(private http: HttpClient,
              private bidService: BidService,
              private calendarService: CalendarService) {
  }

  fetchBids() {
    const groupedBids = {}
    return this.http.get<Bid[]>(bidsURL).pipe(
      map(bids => {
        for (let bid of bids) {
          let round = 'Round ' + bid.round
          let choice = 'Choice ' + bid.choice
          if (round in groupedBids) {
            if (!(choice in groupedBids[round])) {
              groupedBids[round][choice] = {
                'round': bid.round,
                'choice': bid.choice,
                'vacType': bid.vac_type,
                'awardOpt': bid.award_opt,
                'useHol': bid.use_hol,
                'startDate': bid.bid_date,
                'endDate': bid.bid_date,
                'bids': [],
                'dates': []
              }
            }
          } else {
            groupedBids[round] = {}
            groupedBids[round][choice] = {
              'round': bid.round,
              'choice': bid.choice,
              'vacType': bid.vac_type,
              'awardOpt': bid.award_opt,
              'useHol': bid.use_hol,
              'startDate': bid.bid_date,
              'endDate': bid.bid_date,
              'bids': [],
              'dates': []
            }
          }
          if (bid.bid_date < groupedBids[round][choice].startDate) {
            groupedBids[round][choice].startDate = bid.bid_date
          }
          if (bid.bid_date > groupedBids[round][choice].endDate) {
            groupedBids[round][choice].endDate = bid.bid_date
          }
          groupedBids[round][choice].bids.push(bid)
          groupedBids[round][choice].dates.push(bid.bid_date)
        }
        return groupedBids
      }),
      tap(bids => {
        this.bidService.setBids(bids);
      })
    )
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

  fetchAwardCounts(workgroup) {
    console.log('Fetch Award Counts Group', workgroup)
    return this.http.get(awardCountUrl,
      {
        params: new HttpParams()
          .set('group', workgroup)
      }).pipe(tap(counts => {
        console.log('Fetch Award Counts', counts)
        this.calendarService.setAwardCounts(counts)
    }))
  }

  submitBid(bids) {
    this.http.post(bidsURL, bids)
      .subscribe(res => {
        this.fetchBids().subscribe()
        this.fetchRound7().subscribe()
        this.bidService.httpResponse.next(res['status'])
      })
  }

  deleteBid(round, choice) {
    this.http
      .delete(bidsURL,
        {
          params: new HttpParams()
            .set('round', round.toString())
            .set('choice', choice.toString())
        })
      .subscribe(() => {
        this.fetchBids().subscribe()
        this.fetchRound7().subscribe()
      })
  }

  updateBid(round, choice, newChoice) {
    this.http
      .get(bidsUpdateURL,
        {
          params: new HttpParams()
            .set('currentRound', round.toString())
            .set('currentChoice', choice.toString())
            .set('newChoice', newChoice.toString())
        }).subscribe(() => {
      this.fetchBids().subscribe()
      this.fetchRound7().subscribe()
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
      this.lineBid.next(response)
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
