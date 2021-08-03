import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms'
import { BidService } from './bid.service'
import { Subscription } from 'rxjs'
import { DataStorageService } from './data-storage.service'
import { formatDate } from '@angular/common'

@Component({
  selector: 'app-bid-form',
  templateUrl: './bid-form.component.html',
  styleUrls: ['./bid-form.component.css']
})
export class BidFormComponent implements OnInit, OnDestroy {
  rounds = ['1', '2', '3', '4', '5', '6', '7']
  bidForm: FormGroup


  private dateSubscription: Subscription;
  private bidSubscription: Subscription;
  private bids: any = {}

  constructor(private bidService: BidService,
              private data: DataStorageService) {
  }

  ngOnInit() {
    this.dateSubscription = this.bidService.dateEmitter.subscribe(dateInfo => {
      if (dateInfo.location === 'start') {
        this.bidForm.patchValue({
          'start-vac': formatDate(dateInfo.date, 'yyyy-MM-dd', 'en-us')
        });
      } else {
        this.bidForm.patchValue({
          'end-vac': formatDate(dateInfo.date, 'yyyy-MM-dd', 'en-us')
        });
      }
    })

    this.bidSubscription = this.bidService.bidsChanged.subscribe(bids => {
      this.bids = bids
    })

    this.bidForm = new FormGroup({
      'bid-round': new FormControl('1'),
      'bid-choice': new FormControl('1'),
      'start-vac': new FormControl(null),
      'end-vac': new FormControl(null),
      'vac-type': new FormControl('vac'),
      'award-option': new FormControl('50p'),
      'use-holiday': new FormControl(false),
    })
  }

  ngOnDestroy() {
    this.dateSubscription.unsubscribe()
  }

  onSubmit() {
    const start = new Date(this.bidForm.value['start-vac'] + 'T00:00:00')
    const end = new Date(this.bidForm.value['end-vac'] + 'T00:00:00')
    const bid = {
      'round': this.bidForm.value['bid-round'],
      'choice': this.bidForm.value['bid-choice'],
      'award_order': null,
      'bid_date': null,
      'vac_type': this.bidForm.value['vac-type'],
      'award_opt': this.bidForm.value['award-option'],
      'use_hol': this.bidForm.value['use-holiday']
    }
    const bidList = []
    let order = 1

    let loop = new Date(start)
    while (loop <= end) {
      console.log(loop)
      bid.award_order = order
      bid.bid_date = formatDate(loop, 'yyyy-MM-dd', 'en-us')
      // bidList.push(Object.assign({}, bid))
      this.data.submitBid(bid)
      let newDate = loop.setDate(loop.getDate() + 1)
      loop = new Date(newDate)
      order++
    }
    console.log(bidList)
    // this.data.submitBid(bidList)
  }

  onFetchBids() {
    // this.bids = this.data.fetchBids().subscribe(bids => {
    //   console.log(bids);
    // })
    // console.log(this.bids)
    // this.bids = this.bidService.getBids()
    console.log('FetchBids', this.bids)

  }
}
