import { Component, OnDestroy, OnInit } from '@angular/core';
import { BidService } from '../bid-form/bid.service'
import { DataStorageService } from '../bid-form/data-storage.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-my-time',
  templateUrl: './my-time.component.html',
  styleUrls: ['./my-time.component.css']
})
export class MyTimeComponent implements OnInit, OnDestroy {

  dataSubscription: Subscription
  balancesSubscription: Subscription
  balances: any = {}
  maxVac
  maxPpt

  constructor(private bidService: BidService,
              private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.dataSubscription = this.data.fetchBalances()
    this.balancesSubscription = this.bidService.balances.subscribe(balances => {
      if (!!balances) {
        this.balances = balances
        this.maxVac = balances['vac_remaining']
        this.maxPpt = balances['ppt_remaining']
      }
    })
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe()
    this.balancesSubscription.unsubscribe()
  }


  onClick() {
    location.reload()
  //  TODO: Save changes to DB
  }
}
