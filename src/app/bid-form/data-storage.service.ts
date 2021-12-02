import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'

import { Bid } from './bid.model'
import { map, tap } from 'rxjs/operators'
import { BidService } from './bid.service'
import { CalendarService } from '../calendar/calendar.service'
import { environment } from '../../environments/environment'

const bidsURL = environment.baseURL + 'api/bid/bids/'
const bidsUpdateURL = environment.baseURL + 'api/bid/bids/update/'
const workdayUrl = environment.baseURL + 'api/bid/workdays'
const balanceUrl = environment.baseURL + 'api/bid/balances'
const awardUrl = environment.baseURL + 'api/bid/awards'
const usedHolUrl = environment.baseURL + 'api/bid/usedHol'
const round7UsageUrl = environment.baseURL + 'api/bid/round7'

@Injectable({
  providedIn: 'root'
})
export class DataStorageService {


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
    return this.http.put(url, usages).subscribe(response => {
      this.fetchRound7Usage()
      location.reload()
    })
  }


}
