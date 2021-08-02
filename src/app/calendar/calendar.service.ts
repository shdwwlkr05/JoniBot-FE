import { Injectable } from '@angular/core';
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  workdaysChanged = new Subject<any>()

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
