import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs'

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
  editChoice = new BehaviorSubject<any>(null)
  balances = new BehaviorSubject<any>(null)

  private bids = {}
  private bal = {}


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

  setBalances(balances) {
    this.bal = balances
    this.balances.next(this.bal)
  }
}
