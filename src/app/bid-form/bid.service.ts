import { Injectable } from '@angular/core';
import { Subject } from 'rxjs'

interface dateInfo {
  date: Date;
  location: string;
}

@Injectable({
  providedIn: 'root'
})
export class BidService {
  dateEmitter = new Subject<dateInfo>();
  bidsChanged = new Subject<any>();


  private bids = {}


  constructor() {
  }


  setBids(bids) {
    this.bids = bids
    this.bidsChanged.next(this.bids)
    console.log('setBids', this.bids)
  }

  getBids() {
    console.log('getBids', this.bids)
    return this.bids
  }
}
