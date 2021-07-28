import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms'
import { BidService } from './bid.service'
import { Subscription } from 'rxjs'
import { DataStorageService } from './data-storage.service'

interface dateInfo {
  date: Date;
  location: string;
}

@Component({
  selector: 'app-bid-form',
  templateUrl: './bid-form.component.html',
  styleUrls: ['./bid-form.component.css']
})
export class BidFormComponent implements OnInit, OnDestroy {
  @ViewChild('form', {static: false}) bidForm: NgForm;
  defaultRound = '1'
  rounds = ['1', '2', '3', '4', '5', '6', '7']
  defaultVacType = 'vac'
  defaultAwardOption = '50p'
  useHolidayOption = false
  vacStart: Date
  vacEnd: Date


  private dateSubscription: Subscription;
  private bidSubscription: Subscription;
  private bids: any = {}

  constructor(private bidService: BidService,
              private data: DataStorageService) {
  }

  ngOnInit() {
    this.dateSubscription = this.bidService.dateEmitter.subscribe(dateInfo => {
      if (dateInfo.location === 'start') {
        this.vacStart = dateInfo.date;
      } else {
        this.vacEnd = dateInfo.date;
      }
    })
    this.bidSubscription = this.bidService.bidsChanged.subscribe(bids => {
      this.bids = bids
    })
    // console.log('ngOnInit')
    // this.data.fetchBids().subscribe()
    // this.bids = this.bidService.getBids()
  }

  ngOnDestroy() {
    this.dateSubscription.unsubscribe()
  }

  onSubmit() {
    console.log(this.bidForm.value)
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
