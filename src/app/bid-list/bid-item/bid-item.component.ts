import { Component, Input, OnInit } from '@angular/core';
import { BidService } from '../../bid-form/bid.service'
import { ActivatedRoute, Router } from '@angular/router'
import { DataStorageService } from '../../bid-form/data-storage.service'

@Component({
  selector: 'app-bid-item',
  templateUrl: './bid-item.component.html',
  styleUrls: ['./bid-item.component.css']
})
export class BidItemComponent implements OnInit {
  @Input() choice: any
  @Input() round: any
  lastEl: number

  constructor(private bidService: BidService,
              private router: Router,
              private route: ActivatedRoute,
              private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.lastEl = Object.keys(this.round).length
  }

  onClick() {
    this.bidService.editChoice.next(this.choice.value)
    this.router.navigate(['edit'], {relativeTo: this.route})
  }

  onMoveUp(choice) {
    const new_choice = choice.choice - 1
    this.data.updateBid(choice.round, choice.choice, new_choice)
  }

  onMoveDown(choice) {
    const new_choice = choice.choice + 1
    this.data.updateBid(choice.round, choice.choice, new_choice)
  }
}
