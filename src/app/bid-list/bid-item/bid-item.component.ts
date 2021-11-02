import { Component, Input, OnInit } from '@angular/core';
import { BidService } from '../../bid-form/bid.service'
import { ActivatedRoute, Router } from '@angular/router'
import { DataStorageService } from '../../bid-form/data-storage.service'
import { faArrowCircleUp } from '@fortawesome/free-solid-svg-icons'
import { faArrowCircleDown } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-bid-item',
  templateUrl: './bid-item.component.html',
  styleUrls: ['./bid-item.component.css']
})
export class BidItemComponent implements OnInit {
  @Input() choice: any
  @Input() round: any
  lastEl: number
  vacType: string
  awardOpt: string
  useHol: string
  faArrowCircleUp = faArrowCircleUp
  faArrowCircleDown = faArrowCircleDown

  constructor(private bidService: BidService,
              private router: Router,
              private route: ActivatedRoute,
              private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.lastEl = Object.keys(this.round).length
    switch (this.choice.value.vacType) {
      case 'vac':
        this.vacType = 'Vacation'
        break
      case 'ppt':
        this.vacType = 'PPT'
    }
    switch (this.choice.value.awardOpt) {
      case 'all':
        this.awardOpt = 'All Available'
        break
      case 'any':
        this.awardOpt = 'Any Available'
        break
      case '50p':
        this.awardOpt = '50% or Greater'
    }
    this.choice.value.useHol ? this.useHol = ' / Use Holiday' : this.useHol = ''
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
