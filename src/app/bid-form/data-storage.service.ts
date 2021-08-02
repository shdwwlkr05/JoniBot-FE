import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'

import { Bid } from './bid.model'
import { map, tap } from 'rxjs/operators'
import { BidService } from './bid.service'
import { CalendarService } from '../calendar/calendar.service'

const baseUrl = 'http://127.0.0.1:8000/api/bid/bids/'
const workdayUrl = 'http://127.0.0.1:8000/api/bid/workdays'

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
    return this.http.get<Bid[]>(baseUrl).pipe(
      map(bids => {
        for (let bid of bids) {
          let round = 'Round ' + bid.round
          let choice = 'Choice ' + bid.choice
          if (round in groupedBids) {
            if (!(choice in groupedBids[round])) {
              groupedBids[round][choice] = {
                'vacType': bid.vac_type,
                'awardOpt': bid.award_opt,
                'useHol': bid.use_hol,
                'startDate': bid.bid_date,
                'endDate': bid.bid_date,
                'bids': []
              }
            }
          } else {
            groupedBids[round] = {}
            groupedBids[round][choice] = {
              'vacType': bid.vac_type,
              'awardOpt': bid.award_opt,
              'useHol': bid.use_hol,
              'startDate': bid.bid_date,
              'endDate': bid.bid_date,
              'bids': []
            }
          }
          if (bid.bid_date < groupedBids[round][choice].startDate) {
            groupedBids[round][choice].startDate = bid.bid_date
          }
          if (bid.bid_date > groupedBids[round][choice].endDate) {
            groupedBids[round][choice].endDate = bid.bid_date
          }
          groupedBids[round][choice].bids.push(bid)
        }
        console.log('fetchBids', groupedBids)
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
}
