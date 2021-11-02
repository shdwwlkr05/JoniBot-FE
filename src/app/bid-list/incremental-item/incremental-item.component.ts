import { Component, Input, OnInit } from '@angular/core';
import { BidService } from '../../bid-form/bid.service'
import { ActivatedRoute, Router } from '@angular/router'
import { DataStorageService } from '../../bid-form/data-storage.service'
import { faArrowCircleUp } from '@fortawesome/free-solid-svg-icons'
import { faArrowCircleDown } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-incremental-item',
  templateUrl: './incremental-item.component.html',
  styleUrls: ['./incremental-item.component.css']
})
export class IncrementalItemComponent implements OnInit {
  @Input() bid: any
  @Input() len: number
  faArrowCircleUp = faArrowCircleUp
  faArrowCircleDown = faArrowCircleDown

  constructor(private bidService: BidService,
              private router: Router,
              private route: ActivatedRoute,
              private data: DataStorageService) {
  }

  ngOnInit(): void {

  }

  onClick(bid) {
    this.bidService.editChoice.next(bid)
    this.router.navigate(['edit'], {relativeTo: this.route})
  }

  onMoveUp(bid) {
    const new_choice = bid.choice - 1
    this.data.updateBid(bid.round, bid.choice, new_choice)
  }

  onMoveDown(bid) {
    const new_choice = bid.choice + 1
    this.data.updateBid(bid.round, bid.choice, new_choice)
  }
  onTestClick(bid: any) {
    console.log(bid)
  }
}

