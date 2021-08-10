import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  workdaysChanged = new BehaviorSubject<any>(null)

  private workdays = []


  constructor() {
  }

  setWorkdays(workdays) {
    this.workdays = []
    for (let workday of workdays) {
      this.workdays.push(workday.workday)
    }
    console.log('calService', this.workdays)
    this.workdaysChanged.next(this.workdays)
  }

  getWorkdays() {
    return this.workdays.slice()

  }
}
