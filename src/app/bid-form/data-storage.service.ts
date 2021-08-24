import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'

import { Bid } from './bid.model'
import { map, tap } from 'rxjs/operators'
import { BidService } from './bid.service'
import { CalendarService } from '../calendar/calendar.service'
import { environment } from '../../environments/environment'

const bidsURL = environment.baseURL + 'api/bid/bids/'
const workdayUrl = environment.baseURL + 'api/bid/workdays'
const balanceUrl = environment.baseURL + 'api/bid/balances'

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

  fetchWorkdays() {
    return this.http.get(workdayUrl).pipe(tap(workdays => {
      this.calendarService.setWorkdays(workdays)
    }))
  }

  submitBid(bids) {
    this.http.post(bidsURL, bids)
      .subscribe(res => {
        this.fetchBids().subscribe()
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
      })
  }

  fetchBalances() {
    return this.http.get(balanceUrl).subscribe(balances => {
      this.bidService.setBalances(balances[0])
    })

  }


}
