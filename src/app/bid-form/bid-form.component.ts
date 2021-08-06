import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms'
import { BidService } from './bid.service'
import { Subscription } from 'rxjs'
import { DataStorageService } from './data-storage.service'
import { formatDate } from '@angular/common'
import { Router } from '@angular/router'

interface bidChoice {
  awardOpt: string
  bids: any
  endDate: string
  startDate: string
  useHol: boolean
  vacType: string
}

@Component({
  selector: 'app-bid-form',
  templateUrl: './bid-form.component.html',
  styleUrls: ['./bid-form.component.css']
})
export class BidFormComponent implements OnInit, OnDestroy {
  @Input() editChoice: bidChoice
  rounds = ['1', '2', '3', '4', '5', '6', '7']
  bidForm: FormGroup
  editing = false


  private dateSubscription: Subscription;
  private bidSubscription: Subscription;
  private bids: any = {}
  private defaultRound: string = '1'
  private defaultChoice: string = '1'
  private defaultStart: any = null
  private defaultEnd: any = null
  private defaultType: string = 'vac'
  private defaultOption: string = '50p'
  private defaultHol: boolean = false

  constructor(private bidService: BidService,
              private data: DataStorageService,
              private router: Router) {}


  ngOnInit() {
    this.dateSubscription = this.bidService.dateEmitter.subscribe(dateInfo => {
      if (dateInfo.location === 'start') {
        this.bidForm.patchValue({
          'start-vac': formatDate(dateInfo.date, 'yyyy-MM-dd', 'en-us')
        });
      } else {
        this.bidForm.patchValue({
          'end-vac': formatDate(dateInfo.date, 'yyyy-MM-dd', 'en-us')
        });
      }
    })

    this.bidSubscription = this.bidService.bidsChanged.subscribe(bids => {
      this.bids = bids
    })

    if (this.router.url.includes('/edit') && !!this.editChoice) {
      console.log('Edit Mode', !!this.editChoice)
      this.editing = true
      this.defaultRound = this.editChoice.bids[0]['round']
      this.defaultChoice = this.editChoice.bids[0]['choice']
      this.defaultStart = this.editChoice.startDate
      this.defaultEnd = this.editChoice.endDate
      this.defaultType = this.editChoice.vacType
      this.defaultOption = this.editChoice.awardOpt
      this.defaultHol = this.editChoice.useHol
    } else {
      this.editing = false
      // this.defaultRound = '1'
      // this.defaultChoice = '1'
      // this.defaultStart = null
      // this.defaultEnd = null
      // this.defaultType = 'vac'
      // this.defaultOption = '50p'
      // this.defaultHol = false
    }

    this.bidForm = new FormGroup({
      'bid-round': new FormControl(this.defaultRound),
      'bid-choice': new FormControl(this.defaultChoice),
      'start-vac': new FormControl(this.defaultStart),
      'end-vac': new FormControl(this.defaultEnd),
      'vac-type': new FormControl(this.defaultType),
      'award-option': new FormControl(this.defaultOption),
      'use-holiday': new FormControl(this.defaultHol),
    })
  }

  ngOnDestroy() {
    this.dateSubscription.unsubscribe()
  }

  onSubmit() {
    const start = new Date(this.bidForm.value['start-vac'] + 'T00:00:00')
    const end = new Date(this.bidForm.value['end-vac'] + 'T00:00:00')
    const bid = {
      'round': this.bidForm.value['bid-round'],
      'choice': this.bidForm.value['bid-choice'],
      'award_order': null,
      'bid_date': null,
      'vac_type': this.bidForm.value['vac-type'],
      'award_opt': this.bidForm.value['award-option'],
      'use_hol': this.bidForm.value['use-holiday']
    }
    const bidList = []
    let order = 1
    //TODO - only submit vac days that are workdays
    //TODO - only submit number of days available
    let loop = new Date(start)
    while (loop <= end) {
      console.log(loop)
      bid.award_order = order
      bid.bid_date = formatDate(loop, 'yyyy-MM-dd', 'en-us')
      // bidList.push(Object.assign({}, bid))
      this.data.submitBid(bid)
      let newDate = loop.setDate(loop.getDate() + 1)
      loop = new Date(newDate)
      order++
    }
    console.log(bidList)
    // this.data.submitBid(bidList)
  }

  onUpdate() {
    for (let bid of this.editChoice.bids) {
      this.data.deleteBid(bid.id)
    }
    this.onSubmit()
    this.router.navigate(['myBids'])
  }

  onDelete() {
    if (confirm('Are you sure you want to delete the bid?')) {
      for (let bid of this.editChoice.bids) {
        this.data.deleteBid(bid.id)
        this.router.navigate(['myBids'])
      }
    }
  }

  onBack() {
    this.router.navigate(['myBids'])
  }

  onCheck() {
    for (let bid of this.editChoice.bids) {
      console.log(bid.id)
    }
  }
}
