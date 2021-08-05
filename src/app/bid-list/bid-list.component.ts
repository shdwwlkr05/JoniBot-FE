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
  editing = false
  private bidSubscription: Subscription

  constructor(private data: DataStorageService,
              private bidService: BidService) {
  }

  ngOnInit(): void {
    this.bidSubscription = this.bidService.bidsChanged.subscribe(bids => {
      this.bids = bids
    })
    console.log('BidList - ngOnInit')
    this.data.fetchBids().subscribe()
    this.bids = this.bidService.getBids()
  }

  ngOnDestroy(): void {
    this.bidSubscription.unsubscribe()
  }

  onClick() {
    console.log(this.editing)
  }

}
