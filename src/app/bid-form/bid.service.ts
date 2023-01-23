import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs'
import {vacBid} from "./data-storage.service";

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
  editChoice = new BehaviorSubject<vacBid>(null)
  roundEdit = new BehaviorSubject<vacBid[]>(null)
  balances = new BehaviorSubject<any>(null)
  httpResponse = new Subject<string>();
  usedHol = new Subject<any>()
  round7Usage = new Subject<any>()
  awards = new Subject<any>()

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

  setUsedHol(usedHol) {
    this.usedHol.next(usedHol)
  }

  setRound7Usage(usage) {
    this.round7Usage.next(usage)
  }

  setAwards(awards) {
    console.log('From set awards', awards)
    const grouped_awards = {}
    for (let award of awards) {
      if (award['bid_round'] in grouped_awards) {
        grouped_awards[award['bid_round']]['bids'].push(award)
      } else {
        grouped_awards[award['bid_round']] = {'bids': [award], 'hols': []}
      }
    }
    for (let round in grouped_awards) {
      grouped_awards[round]['min'] = grouped_awards[round]['bids'].reduce(
        (prev, curr) => prev['bid_date'] < curr['bid_date'] ? prev : curr)['bid_date']
      grouped_awards[round]['max'] = grouped_awards[round]['bids'].reduce(
        (prev, curr) => prev['bid_date'] > curr['bid_date'] ? prev : curr)['bid_date']
      for (let bid of grouped_awards[round]['bids']) {
        if (bid['vac_type'] == 'vac') {
          grouped_awards[round]['type'] = 'vac'
        } else if (bid['vac_type'] == 'ppt') {
          grouped_awards[round]['type'] = 'ppt'
        } else if (bid['vac_type'] == 'hol') {
          grouped_awards[round]['hols'].push(bid['bid_date'])
        }
      }
    }
    console.log('Grouped Awards', grouped_awards)
    this.awards.next(grouped_awards)
  }
}
