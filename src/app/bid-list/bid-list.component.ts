import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs'
import { DataStorageService } from '../bid-form/data-storage.service'
import { BidService } from '../bid-form/bid.service'
@Component({
  selector: 'app-bid-list',
  templateUrl: './bid-list.component.html',
  styleUrls: ['./bid-list.component.css']
})
export class BidListComponent implements OnInit, OnDestroy {
  bids: any
  incrementalBids = {'vac': [], 'ppt': [], 'hol': [], 'adj': [], 'any': []}
  vacLen: number
  pptLen: number
  holLen: number
  adjLen: number
  anyLen: number
  loading = false
  round7bids: boolean = false
  private bidSubscription: Subscription
  private incrementalSubscription: Subscription

  constructor(private data: DataStorageService,
              private bidService: BidService) {
  }

  ngOnInit(): void {
    this.data.fetchBids().subscribe()
    this.data.fetchRound7().subscribe()
    this.bidSubscription = this.bidService.bidsChanged.subscribe(bids => {
      console.log('Bid List: ', bids)
      this.bids = bids
    })
    this.incrementalSubscription = this.bidService.round7Bids.subscribe(bids => {
      if (!!bids) {
        this.incrementalBids = bids
      }
      this.vacLen = this.incrementalBids['vac'].length
      this.pptLen = this.incrementalBids['ppt'].length
      this.holLen = this.incrementalBids['hol'].length
      this.adjLen = this.incrementalBids['adj'].length
      this.anyLen = this.incrementalBids['any'].length
      this.round7bids = !(this.vacLen == 0 && this.pptLen == 0 && this.holLen == 0 && this.adjLen == 0 && this.anyLen == 0)
    })
  }

  ngOnDestroy(): void {
    this.bidSubscription.unsubscribe()
    this.incrementalSubscription.unsubscribe()
  }

  returnZero() {
    return 0
}


}
