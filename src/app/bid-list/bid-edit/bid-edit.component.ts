import { Component, OnDestroy, OnInit } from '@angular/core';
import { BidService } from '../../bid-form/bid.service'
import { Subscription } from 'rxjs'
import {vacBid} from "../../bid-form/data-storage.service";


@Component({
  selector: 'app-bid-edit',
  templateUrl: './bid-edit.component.html',
  styleUrls: ['./bid-edit.component.css']
})

export class BidEditComponent implements OnInit, OnDestroy {
  editChoice: vacBid
  roundEdit: vacBid[]
  choiceSubscription: Subscription
  roundSubscription: Subscription

  constructor(private bidService: BidService) {
  }

  ngOnInit(): void {
    this.choiceSubscription = this.bidService.editChoice.subscribe(editChoice => {
      this.editChoice = editChoice
    })
    this.roundSubscription = this.bidService.roundEdit.subscribe(roundEdit => {
      this.roundEdit = roundEdit
    })
  }

  ngOnDestroy(): void {
    this.choiceSubscription.unsubscribe()
    this.roundSubscription.unsubscribe()
  }

}
