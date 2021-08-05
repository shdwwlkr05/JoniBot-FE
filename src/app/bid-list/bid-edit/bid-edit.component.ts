import { Component, OnDestroy, OnInit } from '@angular/core';
import { BidService } from '../../bid-form/bid.service'
import { Subscription } from 'rxjs'

interface bidChoice {
  awardOpt: string
  bids: any
  endDate: string
  startDate: string
  useHol: boolean
  vacType: string
}

@Component({
  selector: 'app-bid-edit',
  templateUrl: './bid-edit.component.html',
  styleUrls: ['./bid-edit.component.css']
})

export class BidEditComponent implements OnInit, OnDestroy {
  editChoice: bidChoice
  choiceSubscription: Subscription

  constructor(private bidService: BidService) {
  }

  ngOnInit(): void {
    this.choiceSubscription = this.bidService.editChoice.subscribe(editChoice => {
      this.editChoice = editChoice
    })
  }

  ngOnDestroy(): void {
    this.choiceSubscription.unsubscribe()
  }

}
