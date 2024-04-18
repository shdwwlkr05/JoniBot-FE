import {Component, OnDestroy, OnInit} from '@angular/core';
import {reliefBid, ReliefDataService, reliefParams, shift} from "./relief-data.service";
import {Subscription} from "rxjs";
import {DatePipe} from "@angular/common";
import {Router} from "@angular/router";
import {DataStorageService} from "../bid-form/data-storage.service";

@Component({
  selector: 'app-relief-bid',
  templateUrl: './relief-bid.component.html',
  styleUrls: ['./relief-bid.component.css']
})
export class ReliefBidComponent implements OnInit, OnDestroy {
  parameterSubscription: Subscription
  parameters: reliefParams
  formattedStartDate: string
  reliefDaysSubscription: Subscription
  reliefDays: string[]
  reliefShiftsSubscription: Subscription
  reliefShifts: shift[]
  reliefBidSubscription: Subscription
  reliefBid: reliefBid
  reliefBidListSubscription: Subscription
  reliefBidList = {}
  userWorkgroupSubscription: Subscription
  userWorkgroup: string


  constructor(private data: ReliefDataService,
              private router: Router,
              private otData: DataStorageService) { }

  ngOnInit(): void {
    this.parameterSubscription = this.data.reliefBidParams.subscribe(params => {
      this.parameters = params
      const start_date = new Date(this.parameters.start_date + 'T06:00:00.000')
      this.formattedStartDate = new DatePipe('en-US').transform(start_date, 'MMMM')
    })
    if (!this.parameters) {
      this.data.fetchReliefParams()
    }

    this.reliefDaysSubscription = this.data.reliefDays.subscribe(days => {
      this.reliefDays = days
    })
    if (!this.reliefDays) {
      this.data.fetchReliefDays()
    }

    this.reliefShiftsSubscription = this.data.reliefShifts.subscribe(shifts => {
      this.reliefShifts = shifts
    })
    if (!this.reliefShifts) {
      this.data.fetchReliefShifts()
    }

    this.reliefBidSubscription = this.data.reliefBid.subscribe((bid: reliefBid) => {
      this.reliefBid = bid
    })
    this.reliefBidListSubscription = this.data.reliefBidList.subscribe(bidList => {
      this.reliefBidList = bidList
    })
    if (!this.reliefBid) {
      this.data.fetchReliefBid()
    }

    this.userWorkgroupSubscription = this.otData.userWorkgroup.subscribe(workgroup => {
      this.userWorkgroup = workgroup
    })
    if (!this.userWorkgroup) {
      this.otData.fetchWorkgroup()
    }


  }

  ngOnDestroy() {
    this.parameterSubscription.unsubscribe()
    this.reliefDaysSubscription.unsubscribe()
    this.reliefShiftsSubscription.unsubscribe()
    this.reliefBidSubscription.unsubscribe()
    this.reliefBidListSubscription.unsubscribe()
    this.userWorkgroupSubscription.unsubscribe()
  }

  dayBidClick(day: string) {
    this.router.navigate(['/relief', day])
  }

}
