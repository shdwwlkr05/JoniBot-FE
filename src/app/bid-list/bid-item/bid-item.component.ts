import { Component, Input, OnInit } from '@angular/core';
import { BidService } from '../../bid-form/bid.service'
import { ActivatedRoute, Router } from '@angular/router'
import {DataStorageService, vacBid} from '../../bid-form/data-storage.service'
import { faArrowCircleDown, faArrowCircleUp, faTrash } from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-bid-item',
  templateUrl: './bid-item.component.html',
  styleUrls: ['./bid-item.component.css']
})
export class BidItemComponent implements OnInit {
  @Input() bid: vacBid
  @Input() round: vacBid[]
  lastEl: number
  vacType: string
  awardOpt: string
  useHol: string
  faArrowCircleUp = faArrowCircleUp
  faArrowCircleDown = faArrowCircleDown
  faTrash = faTrash

  constructor(private bidService: BidService,
              private router: Router,
              private route: ActivatedRoute,
              private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.lastEl = Object.keys(this.round).length
    switch (this.bid.vac_type) {
      case 'vac':
        this.vacType = 'Vacation'
        break
      case 'ppt':
        this.vacType = 'PPT'
        break
      case 'hol':
        this.vacType = 'Holiday'
        break
      case 'adj':
        this.vacType = 'Adjustment Day'
        break
      case 'any':
        this.vacType = 'Any type remaining'
        break
    }
    switch (this.bid.award_opt) {
      case 'all':
        this.awardOpt = 'All Available'
        break
      case 'any':
        this.awardOpt = 'Any Available'
        break
      case '50p':
        this.awardOpt = '50% or Greater'
    }
    this.bid.use_hol ? this.useHol = ' / Use Holiday' : this.useHol = ''
  }

  onClick(bid) {
    this.bidService.editChoice.next(bid)
    this.bidService.roundEdit.next(this.round)
    this.router.navigate(['edit'], {relativeTo: this.route})
  }

  onMoveUp(bid) {
    const elIndex = this.round.indexOf(bid)
    this.round.splice(elIndex, 1)
    this.round.splice(elIndex - 1, 0, bid)
    this.round.forEach((bid, index) => {bid.choice = index + 1})
    this.data.updateBid(this.round)
  }

  onMoveDown(bid) {
    const elIndex = this.round.indexOf(bid)
    this.round.splice(elIndex, 1)
    this.round.splice(elIndex + 1, 0, bid)
    this.round.forEach((bid, index) => {bid.choice = index + 1})
    this.data.updateBid(this.round)
  }

  onDelete(bid: vacBid) {
    if (confirm('Are you sure you want to delete this bid?')) {
      this.round.splice(bid.choice - 1, 1)
      this.round.forEach((bid, index) => {bid.choice = index + 1})
      this.data.deleteBid([bid])
      this.data.updateBid(this.round)
    }
  }
}
