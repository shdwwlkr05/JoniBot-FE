import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs'
import { BidService } from '../bid-form/bid.service'
import { DataStorageService } from '../bid-form/data-storage.service'

@Component({
  selector: 'app-award-list',
  templateUrl: './award-list.component.html',
  styleUrls: ['./award-list.component.css']
})
export class AwardListComponent implements OnInit, OnDestroy {

  awardSubscription: Subscription
  awards = {
    1: {'bids': []},
    2: {'bids': []},
    3: {'bids': []},
    4: {'bids': []},
    5: {'bids': []},
    6: {'bids': []},
    7: {'bids': []}
  }
  bid_rounds = [1, 2, 3, 4, 5, 6, 7]


  constructor(private bidService: BidService,
              private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.awardSubscription = this.bidService.awards.subscribe(data => {
      this.awards = data
      console.log(this.awards)
    })
    this.data.fetchUserAwards()
  }

  ngOnDestroy(): void {
    this.awardSubscription.unsubscribe()
  }

}
