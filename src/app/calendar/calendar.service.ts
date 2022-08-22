import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  workdaysChanged = new BehaviorSubject<any>(null)

  private workdays = []
  private awardCounts = []


  constructor() {
  }

  setWorkdays(workdays) {
    this.workdays = []
    for (let workday of workdays) {
      this.workdays.push(workday)
    }
    this.workdaysChanged.next(this.workdays)
  }

  getWorkdays() {
    return this.workdays.slice()
  }

  setAwardCounts(awardDays) {
    this.awardCounts = []
    for (let d of awardDays) {
      this.awardCounts.push({bid_date: d['bid_date'], award_count: d['award_count']})
    }
  }

  getCounts() {
    return this.awardCounts.slice()
  }
}
