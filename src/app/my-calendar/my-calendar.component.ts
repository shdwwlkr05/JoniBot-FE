import { Component, Output, EventEmitter } from '@angular/core';
const DAY_MS = 60 * 60 * 24 * 1000;

@Component({
  selector: 'my-calendar',
  templateUrl: './my-calendar.component.html',
  styleUrls: [ './my-calendar.component.css' ]
})
export class MyCalendarComponent {
  dates: Array<Date>;
  days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  date = new Date();
  desk1 = '1'
  desk2 = ''
  workdays = {'1':{'8/2/2022': '4A', '8/3/2022': '4A', '8/1/2022': '4A', '7/31/2022': '4A'},
    '2':{'8/2/2022': '4A', '8/3/2022': '4A', '8/4/2022': '4A', '8/5/2022': '4A'}
  }

  @Output() selected = new EventEmitter();

  constructor() {
    this.dates = this.getCalendarDays(this.date);
  }

  setMonth(inc) {
    const [year, month] = [this.date.getFullYear(), this.date.getMonth()];
    this.date = new Date(year, month + inc, 1);
    this.dates = this.getCalendarDays(this.date);
  }

  isSameMonth(date) {
    return date.getMonth() === this.date.getMonth();
  }

  private getCalendarDays(date = new Date) {
    const calendarStartTime =
      this.getCalendarStartDay(date).getTime()
      + 60 * 60 * 2 * 1000; /* add 2 hours for day light saving time adjustment */

    return this.range(0, 41)
      .map(num => new Date(calendarStartTime + DAY_MS * num));
  }

  private getCalendarStartDay(date = new Date) {
    const [year, month] = [date.getFullYear(), date.getMonth()];
    const firstDayOfMonth = new Date(year, month, 1).getTime();

    return this.range(1,7)
      .map(num => new Date(firstDayOfMonth - DAY_MS * num))
      .find(dt => dt.getDay() === 0)
  }

  private range(start, end, length = end - start + 1) {
    return Array.from({ length }, (_, i) => start + i)
  }

  onClick(date: Date) {
    console.log('onClick', this.desk1, this.desk2)

  }

  desk1working(date: Date) {
    const dateToCheck = new Intl.DateTimeFormat('en-US').format(date)
    if (!this.workdays[this.desk1])
      return false
    return (this.workdays[this.desk1][dateToCheck] ? this.workdays[this.desk1][dateToCheck] : false)
  }

  desk2working(date: Date) {
    const dateToCheck = new Intl.DateTimeFormat('en-US').format(date)
    if (!this.workdays[this.desk2])
      return false
    return (this.workdays[this.desk2][dateToCheck] ? this.workdays[this.desk2][dateToCheck] : false)
  }

  clearDesk2() {
    this.desk2 = ''
  }
}
