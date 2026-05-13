import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs'
import {DataStorageService, user, vacBid, vacBidDates} from '../bid-form/data-storage.service'
import { BidService } from '../bid-form/bid.service'
import { KeyValue } from '@angular/common'


@Component({
  selector: 'app-bid-list',
  templateUrl: './bid-list.component.html',
  styleUrls: ['./bid-list.component.css']
})
export class BidListComponent implements OnInit, OnDestroy {
  bids = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: []}
  roundsWithBid = []
  incrementalBids = {'vac': [], 'ppt': [], 'hol': [], 'adj': [], 'any': []}
  vacLen: number
  pptLen: number
  holLen: number
  adjLen: number
  anyLen: number
  loading = false
  round7bids: boolean = false
  round8bids: boolean = false
  bidTimes: user
  private bidSubscription: Subscription
  private timeSubscription: Subscription
  vacBidDates: vacBidDates
  vacBidDatesSubscription = new Subscription()

  constructor(private data: DataStorageService,
              private bidService: BidService) {
  }

  ngOnInit(): void {
    this.bidSubscription = this.data.vacBid.subscribe((bids:vacBid[]) => {
      this.roundsWithBid = Array.from(new Set(bids.map((bid) => bid.round)))
      for (let round of this.roundsWithBid) {
        this.bids[round] = bids.filter((bid:vacBid) => bid.round == round)
      }
      this.round7bids = !(this.bids[7].length == 0)
      this.round8bids = !(this.bids[8].length == 0)
    })
    this.data.fetchBids()
    this.timeSubscription = this.data.bidTime.subscribe((times:user[]) => {
      this.bidTimes = times[0]
      // console.log(this.bidTimes)
    })
    this.data.fetchBidTime()
    this.data.vacBidDates.subscribe((dates: vacBidDates) => {
      this.vacBidDates = dates
      // console.log(this.vacBidDates)
    })
    this.data.fetchVacBidDates()
  }

  ngOnDestroy(): void {
    this.bidSubscription.unsubscribe()
    this.timeSubscription.unsubscribe()
    this.vacBidDatesSubscription.unsubscribe()
  }

  returnZero() {
    return 0
  }

  onCopy(source_round: vacBid[], destination_round: vacBid[]) {
    const destination_round_number = source_round[0].round + 1
    if (confirm(`This will delete all bids in Round ${destination_round_number}. Continue?`)) {
      const copied_bid = source_round.map(el => ({...el}))
      copied_bid.forEach(bid => {
        bid.round = destination_round_number
        delete bid.id
      })

      this.data.deleteBid(destination_round)
      this.data.submitBid(copied_bid)

    }
  }

  onClear(round: vacBid[]) {
    const round_number = round[0].round
    if (confirm(`This will clear all bids from Round ${round_number}. Continue?`)) {
      this.data.deleteBid(round)
      this.data.fetchBids()
    }
  }
}
