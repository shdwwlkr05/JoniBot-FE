import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms'
import { BidService } from './bid.service'
import { Subscription } from 'rxjs'
import {DataStorageService, vacBid} from './data-storage.service'
import { formatDate } from '@angular/common'
import { Router } from '@angular/router'
import { CalendarService } from '../calendar/calendar.service'
import {environment} from "../../environments/environment";


@Component({
  selector: 'app-bid-form',
  templateUrl: './bid-form.component.html',
  styleUrls: ['./bid-form.component.css']
})
export class BidFormComponent implements OnInit, OnDestroy {
  @Input() editChoice: vacBid
  @Input() roundEdit: vacBid[]
  rounds = [1, 2, 3, 4, 5, 6, 7]
  bidForm: FormGroup
  editing = false
  updating = false
  daysAvailable = true
  dateSubscription: Subscription
  bidSubscription: Subscription
  bids = {1: [], 2: [], 3: [], 4: [], 5: [], 6: []}
  roundsWithBid = []
  roundChoicePairs = []
  incrementalSubscription: Subscription
  workdaySubscription: Subscription
  balancesSubscription: Subscription
  httpResponse: Subscription
  response: string
  error: string
  existingBids: any = {}
  incrementalBids: any = {}
  defaultRound: number = 1
  defaultChoice: number = 1
  defaultStart: any = null
  defaultEnd: any = null
  defaultType: string = 'vac'
  defaultOption: string = '50p'
  defaultHol: boolean = false
  workdays = []
  balances = {}
  awards
  round7 = true
  bidStart = new Date(environment.currYear, 3, 1) // Zero indexed month
  bidEnd = new Date(environment.nextYear, 2, 31) // Zero indexed month

  constructor(private bidService: BidService,
              private data: DataStorageService,
              private router: Router,
              private calService: CalendarService) {
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

    if (this.router.url.includes('/edit') && !!this.editChoice) {
      this.editing = true
      this.defaultRound = this.editChoice.round
      this.round7 = (this.editChoice.round == 7)
      this.defaultChoice = this.editChoice.choice
      this.defaultStart = this.editChoice.bid_start_date
      this.defaultEnd = this.editChoice.bid_end_date
      this.defaultType = this.editChoice.vac_type
      this.defaultOption = this.editChoice.award_opt
      this.defaultHol = this.editChoice.use_hol
    } else {
      this.editing = false
    }

    this.bidSubscription = this.data.vacBid.subscribe((bids:vacBid[]) => {
      this.roundsWithBid = Array.from(new Set(bids.map((bid) => bid.round)))
      for (let round of this.roundsWithBid) {
        this.bids[round] = bids.filter((bid:vacBid) => bid.round == round)
      }
      this.roundChoicePairs = []
      bids.forEach((bid: vacBid) => {
        this.roundChoicePairs.push(`${bid.round}${bid.choice}`)
      })
      if (!this.editing) {
        this.roundChange(this.bidForm.value['bid-round'])
      }
    })
    this.data.fetchBids()

    this.incrementalSubscription = this.bidService.round7Bids.subscribe(bids => {
      this.incrementalBids = bids
    })

    this.workdaySubscription = this.calService.workdaysChanged.subscribe(workdays => {
      this.workdays = workdays
    })

    this.balancesSubscription = this.bidService.balances.subscribe(balances => {
      this.balances = balances
    })

    this.data.fetchBalances()

    this.httpResponse = this.bidService.httpResponse.subscribe(response => {
      this.response = response
      if (response == 'update-success') {
        this.updating = false
        this.router.navigate(['myBids'])
      }

    })

    this.bidForm = new FormGroup({
      'bid-round': new FormControl({value: this.defaultRound, disabled: this.editing}),
      'bid-choice': new FormControl({value: this.defaultChoice, disabled: this.editing}),
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
    this.incrementalSubscription.unsubscribe()
  }

  buildBid() {
    const start = new Date(this.bidForm.value['start-vac'] + 'T00:00:00')
    let end
    if (!this.bidForm.value['end-vac']) {
      end = start
    } else {
      end = new Date(this.bidForm.value['end-vac'] + 'T00:00:00')
    }

    const bid = {
      'round': null,
      'choice': null,
      'bid_start_date': start.toISOString().split('T')[0],
      'bid_end_date': end.toISOString().split('T')[0],
      'vac_type': this.bidForm.value['vac-type'],
      'award_opt': this.bidForm.value['award-option'],
      'use_hol': this.bidForm.value['use-holiday']
    }
    this.editChoice ? bid.round = this.editChoice['round'] : bid.round = this.bidForm.value['bid-round']
    this.editChoice ? bid.choice = this.editChoice['choice'] : bid.choice = this.bidForm.value['bid-choice']

    return [bid, start, end]
  }

  validBid(bid, start, end) {
    this.error = null
    if (end < start) {
      this.error = `Start date is after end date.
      Please check your dates and try again.`
    }
    if (start < this.bidStart) {
      this.error = `Check start date. Date is before bid begins.
      Date must be between ${this.bidStart.toLocaleDateString("en-US")} and ${this.bidEnd.toLocaleDateString("en-US")}.`
    } else if (start > this.bidEnd) {
      this.error = `Check start date. Date is after bid ends
      Date must be between ${this.bidStart.toLocaleDateString("en-US")} and ${this.bidEnd.toLocaleDateString("en-US")}.`
    } else if (end < this.bidStart) {
      this.error = `Check end date. Date is before bid begins.
      Date must be between ${this.bidStart.toLocaleDateString("en-US")} and ${this.bidEnd.toLocaleDateString("en-US")}.`
    } else if (end > this.bidEnd) {
      this.error = `Check end date. Date is after bid ends
      Date must be between ${this.bidStart.toLocaleDateString("en-US")} and ${this.bidEnd.toLocaleDateString("en-US")}.`
    }
    if (bid.choice < 0) {
      this.error = `Choice must be greater than 0.`
    }
    if (!this.bidForm.value['start-vac']) {
      this.error = `You must request at least one day to submit a bid`
    }
  }

  onSubmit() {
    this.response = null

    const [bid, start, end] = this.buildBid()

    this.validBid(bid, start, end)

    // Check to see if day has already been bid for Round and Choice
    let round = 'Round ' + bid.round
    let choice = 'Choice ' + bid.choice

    const roundChoicePair = `${bid.round}${bid.choice}`
    if (this.roundChoicePairs.includes(roundChoicePair)) {
      this.error = `Bid for ${round} - ${choice} already exists.
        Please select different choice option or edit the existing one.`
    }
    // TODO: If choice exists insert into list and shift other choices down

    if (!this.error) {
      console.log('Submitted bid: ', bid)
      this.data.submitBid([bid])
    }
  }


  onUpdate() {
    const [bid, start, end] = this.buildBid()
    this.validBid(bid, start, end)
    bid.id = this.editChoice.id
    if (!this.error) {
      this.data.updateBid([bid])
    }
  }

  onDelete() {
    if (confirm('Are you sure you want to delete the bid?')) {
      const [bid, start, end] = this.buildBid()
      bid.id = this.editChoice.id
      this.roundEdit.splice(bid.choice - 1, 1)
      this.roundEdit.forEach((bid, index) => {bid.choice = index + 1})
      this.data.deleteBid([bid])
      this.data.updateBid(this.roundEdit)
    }
  }

  onBackToBids() {
    this.router.navigate(['myBids'])
  }

  onTest() {
    console.log('Edited Round:', this.roundEdit)
  }

  roundChange(event) {
    let numChoices
    this.round7 = (event == 7)
    const roundObject = this.bids[event]
    if (roundObject) {
      numChoices = Object.keys(roundObject).length + 1
    } else {
      numChoices = 1
    }
    this.bidForm.controls['bid-choice'].setValue(numChoices)

  }

  vacTypeChange(vacType: string) {
    let numChoices
    if (this.bidForm.controls['bid-round'].value == 7) {
      numChoices = this.incrementalBids[vacType].length + 1
      this.bidForm.controls['bid-choice'].setValue(numChoices)
    }
  }

  getShiftHours(formattedDate: String) {
    const index = this.workdays.map(workday => workday.workday).indexOf(formattedDate)
    if (this.workdays[index].shift.slice(-1) == 'T') {
      return 10
    } else if (this.workdays[index].shift.slice(-1) == 'W') {
      return 12
    } else {
      return 9
    }
  }
}
