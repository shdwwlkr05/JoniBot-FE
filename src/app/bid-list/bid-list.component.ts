import { Component, OnDestroy, OnInit } from '@angular/core';
import { Bid } from '../bid-form/bid.model'
import { Subscription } from 'rxjs'
import { DataStorageService } from '../bid-form/data-storage.service'
import { BidService } from '../bid-form/bid.service'

@Component({
  selector: 'app-bid-list',
  templateUrl: './bid-list.component.html',
  styleUrls: ['./bid-list.component.css']
})
export class BidListComponent implements OnInit, OnDestroy{
  bids: any
  private bidSubscription: Subscription

  constructor(private data: DataStorageService,
              private bidService: BidService) { }

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
    const dt = new Date('Jul 25')
    console.log(dt.toDateString())
  }

}
