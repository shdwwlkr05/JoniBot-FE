import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms'
import { BidService } from './bid.service'
import { Subscription } from 'rxjs'
import { DataStorageService } from './data-storage.service'
import { formatDate } from '@angular/common'
import { Router } from '@angular/router'
import { CalendarService } from '../calendar/calendar.service'
import { HttpClient } from '@angular/common/http'

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
  daysAvailable = true
  dateSubscription: Subscription
  bidSubscription: Subscription
  workdaySubscription: Subscription
  balancesSubscription: Subscription
  bids: any = {}
  defaultRound: string = '1'
  defaultChoice: string = '1'
  defaultStart: any = null
  defaultEnd: any = null
  defaultType: string = 'vac'
  defaultOption: string = '50p'
  defaultHol: boolean = false
  workdays = []
  balances = {}

  constructor(private bidService: BidService,
              private data: DataStorageService,
              private router: Router,
              private calService: CalendarService,
              private http: HttpClient) {
  }


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

    this.workdaySubscription = this.calService.workdaysChanged.subscribe(workdays => {
      this.workdays = workdays
    })

    this.http.get('http://127.0.0.1:8000/api/bid/balances').subscribe(balances => {
      this.bidService.setBalances(balances[0])
    })

    this.balancesSubscription = this.bidService.balances.subscribe(balances => {
      this.balances = balances
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
    this.bidSubscription.unsubscribe()
    this.workdaySubscription.unsubscribe()
    this.balancesSubscription.unsubscribe()
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
    let order = 1
    let vac_remaining = this.balances['vac_remaining']
    let ppt_remaining = this.balances['ppt_remaining']
    let loop = new Date(start)
    // Loop through all days in range submitted on bid form
    while (loop <= end && this.daysAvailable) {
      let formattedDate = formatDate(loop, 'yyyy-MM-dd', 'en-us')
      // Loop through days checking to see if they are a scheduled workday
      if (this.workdays.includes(formattedDate)) {
        bid.award_order = order
        order++
        bid.bid_date = formattedDate
        // Check if vac or PPT was used and remove from remaining balance
        if (bid.vac_type == 'vac') {
          vac_remaining -= this.balances['line_hours']
        } else {
          ppt_remaining -= this.balances['line_hours']
        }
        if (vac_remaining <= 0 || ppt_remaining <= 0) {
          this.daysAvailable = false
        }
        this.data.submitBid(bid)
      }
      let newDate = loop.setDate(loop.getDate() + 1)
      loop = new Date(newDate)
    }
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

  onTest() {
    console.log(this.balances)
  }
}
