import { Component, Input, OnInit } from '@angular/core';
import { BidService } from '../../bid-form/bid.service'
import { ActivatedRoute, Router } from '@angular/router'

@Component({
  selector: 'app-bid-item',
  templateUrl: './bid-item.component.html',
  styleUrls: ['./bid-item.component.css']
})
export class BidItemComponent implements OnInit {
  @Input() choice: any

  constructor(private bidService: BidService,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ngOnInit(): void {
  }

  onClick() {
    const lastEl = this.choice.value.bids.length - 1;
    console.log('Test click', this.choice.value)
    console.log('Start', this.choice.value.bids[0]['bid_date'])
    console.log('End', this.choice.value.bids[lastEl]['bid_date'])
    this.bidService.editChoice.next(this.choice.value)
    this.router.navigate(['edit'], {relativeTo: this.route})
  }

}
