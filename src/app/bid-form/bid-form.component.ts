import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms'
import { BidService } from './bid.service'
import { Subscription } from 'rxjs'
import { DataStorageService } from './data-storage.service'
import { formatDate } from '@angular/common'
import { Router } from '@angular/router'
import { CalendarService } from '../calendar/calendar.service'

interface bidChoice {
  awardOpt: string
  bids: any
  endDate: string
  startDate: string
  useHol: boolean
  vacType: string
  round: string
  choice: string
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
  updating = false
  daysAvailable = true
  dateSubscription: Subscription
  bidSubscription: Subscription
  incrementalSubscription: Subscription
  workdaySubscription: Subscription
  balancesSubscription: Subscription
  httpResponse: Subscription
  response: string
  error: string
  existingBids: any = {}
  incrementalBids: any = {}
  defaultRound: string = '1'
  defaultChoice: string = '1'
  defaultStart: any = null
  defaultEnd: any = null
  defaultType: string = 'vac'
  defaultOption: string = '50p'
  defaultHol: boolean = false
  workdays = []
  balances = {}
  awards
  round7

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

    this.bidSubscription = this.bidService.bidsChanged.subscribe(bids => {
      this.existingBids = bids
    })

    this.incrementalSubscription = this.bidService.round7Bids.subscribe(bids => {
      this.incrementalBids = bids
    })

    this.workdaySubscription = this.calService.workdaysChanged.subscribe(workdays => {
      this.workdays = workdays
    })

    this.data.fetchBalances()

    this.balancesSubscription = this.bidService.balances.subscribe(balances => {
      this.balances = balances
    })

    this.httpResponse = this.bidService.httpResponse.subscribe(response => {
      this.response = response
    })


    if (this.router.url.includes('/edit') && !!this.editChoice) {
      console.log('Edit Choice:', this.editChoice)
      console.log('Vac Type:', this.editChoice['vac_type'])
      this.editing = true
      if (this.editChoice.round >= '7') {
        this.round7 = true
        this.defaultRound = '7'
        this.defaultChoice = this.editChoice.choice
        this.defaultStart = this.editChoice['bid_date']
        this.defaultType = this.editChoice['vac_type']
      } else {
        this.defaultRound = this.editChoice.round
        this.defaultChoice = this.editChoice.choice
        this.defaultStart = this.editChoice.startDate
        this.defaultEnd = this.editChoice.endDate
        this.defaultType = this.editChoice.vacType
        this.defaultOption = this.editChoice.awardOpt
        this.defaultHol = this.editChoice.useHol
      }
    } else {
      this.editing = false
    }

    console.log('Default Type:', this.defaultType)
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

  onSubmit() {
    this.response = null
    this.error = null
    this.daysAvailable = true
    console.log(this.editChoice)
    const start = new Date(this.bidForm.value['start-vac'] + 'T00:00:00')
    let end
    if (!this.bidForm.value['end-vac']) {
      end = start
    } else {
      end = new Date(this.bidForm.value['end-vac'] + 'T00:00:00')
    }
    if (end < start) {
      this.error = `Start date is after end date.
      Please check your dates and try again.`
    }
    const bid = {
      'round': null,
      'choice': null,
      'award_order': null,
      'bid_date': null,
      'vac_type': this.bidForm.value['vac-type'],
      'award_opt': this.bidForm.value['award-option'],
      'use_hol': this.bidForm.value['use-holiday']
    }
    this.editChoice ? bid.round = this.editChoice['round'] : bid.round = this.bidForm.value['bid-round']
    this.editChoice ? bid.choice = this.editChoice['choice'] : bid.choice = this.bidForm.value['bid-choice']
    if (bid.choice < 0) {
      this.error = `Choice must be greater than 0.`
    }
    if (!this.bidForm.value['start-vac']) {
      this.error = `You must request at least one day to submit a bid`
    }
    const bids = []
    let order = 1
    let vac_remaining = this.balances['vac_remaining']
    let ppt_remaining = this.balances['ppt_remaining']
    let prior_to_incremental_remaining = this.balances['prior-to-incremental_allowance']
    let loop = new Date(start)
    // Loop through all days in range submitted on bid form
    while (loop <= end && this.daysAvailable && !this.error) {
      let formattedDate = formatDate(loop, 'yyyy-MM-dd', 'en-us')

      // Check to see if day has already been bid for Round and Choice
      let round
      let vacType
      if (bid.round >= 7) {
        switch (bid['vac_type']) {
          case 'vac':
            bid.round = 7
            vacType = 'Vacation'
            break
          case 'ppt':
            bid.round = 8
            vacType = 'PPT'
            break
          case 'hol':
            bid.round = 9
            vacType = 'Holiday'
            break
        }
      } else {
        round = 'Round ' + bid.round
      }
      let choice = 'Choice ' + bid.choice
      console.log('Round? ', bid.round)
      console.log('Incremental Bids: ', this.incrementalBids)
      console.log('Vacation Type: ',bid['vac_type'])
      if (+bid.round >= 7) {
        const found = this.incrementalBids[bid['vac_type']].some(
          el => el.choice == bid.choice
        )
        if (found) {
          this.error = `Bid for ${vacType} - ${choice} already exists.
              Please select different choice option or edit the existing one.`
          break
        }
      } else {
        if (round in this.existingBids) {
          if (choice in this.existingBids[round]) {
            this.error = `Bid for ${round} - ${choice} already exists.
              Please select different choice option or edit the existing one.`
            break
          }
        }
      }

      // Loop through days checking to see if they are a scheduled workday
      console.log('Formatted Date:', formattedDate)
      if (this.workdays.includes(formattedDate)) {
        bid.award_order = order
        order++
        bid.bid_date = formattedDate
        // Check if vac or PPT was used and remove from remaining balance
        if (bid.round < 7) {
          prior_to_incremental_remaining -= this.balances['line_hours']
          if (prior_to_incremental_remaining <= 0) {
            this.daysAvailable = false
          }
        }
        if (bid.vac_type == 'vac') {
          vac_remaining -= this.balances['line_hours']
          if (vac_remaining < 0) {
            ppt_remaining += vac_remaining
            vac_remaining = 0
          }
        } else {
          ppt_remaining -= this.balances['line_hours']
          if (ppt_remaining < 0) {
            vac_remaining += ppt_remaining
            ppt_remaining = 0
          }
        }
        if (vac_remaining + ppt_remaining < this.balances['line_hours']) {
          this.daysAvailable = false
        }
        bids.push(Object.assign({}, bid))
      }
      let newDate = loop.setDate(loop.getDate() + 1)
      loop = new Date(newDate)
    }
    if (!this.error) {
      this.data.submitBid(bids)
    }
  }


  onUpdate() {
    this.updating = true
    this.data.deleteBid(this.editChoice.round, this.editChoice.choice)
    setTimeout(() => {
      this.onSubmit()
      this.updating = false
      this.router.navigate(['myBids'])
    }, 1000)

  }

  onDelete() {
    if (confirm('Are you sure you want to delete the bid?')) {
      this.data.deleteBid(this.editChoice.round, this.editChoice.choice)
      this.router.navigate(['myBids'])
    }
  }

  onBackToBids() {
    this.router.navigate(['myBids'])
  }

  onTest() {
    const counts = {}
    const awarded = []
    const awarded_days = this.data.fetchAwards().toPromise()
    awarded_days.then(awards => {
      for (let award of awards) {
        awarded.push(award['bid_date'])
      }
      awarded.forEach(function (x) {
        counts[x] = (counts[x] || 0) + 1;
      })
      for (const [key, value] of Object.entries(counts)) {
        console.log(`${key} has been awarded ${value} time(s)`)
      }
    })
  }

  roundChange(event) {
    event == 7 ? this.round7 = true : this.round7 = false
  }
}
