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
  bidsChanged = new BehaviorSubject<any>(null)
  round7Bids = new BehaviorSubject<any>(null)
  editChoice = new BehaviorSubject<any>(null)
  balances = new BehaviorSubject<any>(null)
  httpResponse = new Subject<string>();

  private bids = {}
  private bal = {}
  private inc = {}


  constructor() {
  }


  setBids(bids) {
    this.bids = bids
    this.bidsChanged.next(this.bids)
  }

  setRound7(bids) {
    this.inc = bids
    this.round7Bids.next(bids)
  }

  setBalances(balances) {
    this.bal = balances
    this.balances.next(this.bal)
  }
}
