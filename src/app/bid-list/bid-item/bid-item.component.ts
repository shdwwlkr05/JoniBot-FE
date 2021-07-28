import { Component, Input, OnInit } from '@angular/core';
import { Bid } from '../../bid-form/bid.model'

@Component({
  selector: 'app-bid-item',
  templateUrl: './bid-item.component.html',
  styleUrls: ['./bid-item.component.css']
})
export class BidItemComponent implements OnInit {
  @Input() choice: any

  constructor() { }

  ngOnInit(): void {
  }

  onClick() {
    console.log('Test click', this.choice.value.bids)
  }

}
