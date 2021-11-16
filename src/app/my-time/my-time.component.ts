import { Component, OnDestroy, OnInit } from '@angular/core';
import { BidService } from '../bid-form/bid.service'
import { DataStorageService } from '../bid-form/data-storage.service'
import { Subscription } from 'rxjs'
import { formatDate } from '@angular/common'

@Component({
  selector: 'app-my-time',
  templateUrl: './my-time.component.html',
  styleUrls: ['./my-time.component.css']
})
export class MyTimeComponent implements OnInit, OnDestroy {

  dataSubscription: Subscription
  balancesSubscription: Subscription
  usedHolSubscription: Subscription
  round7UsageSubscription: Subscription
  balances: any = {}
  maxVac
  maxPpt
  currYear = 2021
  nextYear = 2022
  holidays = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10']
  usedHolidaysCurrYear = []
  usedHolidaysNextYear = []
  maxUsage = {
    'vac': 0,
    'ppt': 0,
    'currH1': false,
    'currH2': false,
    'currH3': false,
    'currH4': false,
    'currH5': false,
    'currH6': false,
    'currH7': false,
    'currH8': false,
    'currH9': false,
    'currH10': false,
    'nextH1': false,
    'nextH2': false,
    'nextH3': false,
    'nextH4': false,
    'nextH5': false,
    'nextH6': false,
    'nextH7': false,
    'nextH8': false,
    'nextH9': false,
    'nextH10': false
  }

  constructor(private bidService: BidService,
              private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.dataSubscription = this.data.fetchBalances()
    this.balancesSubscription = this.bidService.balances.subscribe(balances => {
      if (!!balances) {
        console.log('balances: ', balances)
        this.balances = balances
        this.maxVac = balances['vac_remaining']
        this.maxPpt = balances['ppt_remaining']
      }
    })
    this.data.fetchUsedHolidays()
    this.data.fetchRound7Usage()
    this.usedHolSubscription = this.bidService.usedHol.subscribe(usedHol => {
      this.usedHolidaysCurrYear = []
      this.usedHolidaysNextYear = []
      for (let hol of usedHol) {
        if (hol.year == this.currYear) {
          this.usedHolidaysCurrYear.push(hol)
        } else if (hol.year == this.nextYear) {
          this.usedHolidaysNextYear.push(hol)
        }
      }
    })
    this.round7UsageSubscription = this.bidService.round7Usage.subscribe(usage => {
      this.maxUsage = usage
    })
  }

  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe()
    this.balancesSubscription.unsubscribe()
    this.usedHolSubscription.unsubscribe()
  }


  onSave() {
    console.log(this.maxUsage)
    this.data.updateRound7Usage(this.maxUsage)
  }

  onRevert() {
    location.reload()
  }

  holidayUsed(year, hol) {
    if (year == this.currYear) {
      return this.usedHolidaysCurrYear.some(holiday => holiday['hol_used'] == hol)
    } else if (year == this.nextYear) {
      return this.usedHolidaysNextYear.some(holiday => holiday['hol_used'] == hol)
    } else {
      return false
    }
  }

  holidayUsedDate(year, hol) {
    let index
    let formattedDate
    if (year == this.currYear) {
      index = this.usedHolidaysCurrYear.map(hol => hol['hol_used']).indexOf(hol)
      formattedDate = formatDate(this.usedHolidaysCurrYear[index]['date_used'], 'MM-dd-yyyy', 'en-us')
    } else if (year == this.nextYear) {
      index = this.usedHolidaysNextYear.map(hol => hol['hol_used']).indexOf(hol)
      formattedDate = formatDate(this.usedHolidaysNextYear[index]['date_used'], 'MM-dd-yyyy', 'en-us')
    } else {
      return 'An unknown error as occurred'
    }
    return `${hol} was used on ${formattedDate}`
  }


}
