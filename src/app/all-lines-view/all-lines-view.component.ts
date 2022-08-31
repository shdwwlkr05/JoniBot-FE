import {Component, OnDestroy, OnInit} from '@angular/core';
import { Subscription } from 'rxjs';
import {DataStorageService} from "../bid-form/data-storage.service";
import {faPlusCircle} from "@fortawesome/free-solid-svg-icons";
import {faTrash} from "@fortawesome/free-solid-svg-icons";

interface line {
  desk: string;
  id: number;
  length: string;
  line_number: string;
  rotation: string;
  theater: string;
  time_of_day: string;
  workgroup: string;
  workdays: any[];
  allWorkdays: any[];
  workdays_str: string[];
  selected: boolean;
  start_time: string;
}

interface workday {
  id: number;
  workday: string;
  shift_id: string;
  line_id: number;
}

@Component({
  selector: 'app-all-lines-view',
  templateUrl: './all-lines-view.component.html',
  styleUrls: ['./all-lines-view.component.css']
})
export class AllLinesViewComponent implements OnInit, OnDestroy {
  faPlusCircle = faPlusCircle
  faTrash = faTrash
  header1 = []
  header2 = []
  date = new Date('2022-10-1');
  lines: line[]
  linesSubscription = new Subscription()
  rotations = []
  selectedRotations = ['All']
  workdays: workday[]
  workdaySubscription = new Subscription()
  userGroup = ''
  workgroupSubscription: Subscription
  loading = true
  showAM = true
  showPM = true
  showMID = true
  showRLF = true
  showDOM = true
  showINTL = true
  showFleet = true
  showSPT = true
  showNine = true
  showTen = true
  holidays = {
    h1: '2023-01-01',
    h2: '2023-01-16',
    h3: '2023-02-20',
    h4: '2022-04-15',
    h5: '2022-05-30',
    h6: '2022-07-04',
    h7: '2022-09-05',
    h8: '2022-11-24',
    h9: '2022-11-25',
    h10: '2022-12-25',
  }
  h1off = false
  h2off = false
  h3off = false
  h4off = false
  h5off = false
  h6off = false
  h7off = false
  h8off = false
  h9off = false
  h10off = false
  userDate
  userDates = []

  constructor(private data: DataStorageService) { }

  ngOnInit(): void {
    this.workgroupSubscription = this.data.userWorkgroup.subscribe(workgroup => {
      this.userGroup = workgroup
    })
    this.linesSubscription = this.data.lines.subscribe((lines: line[]) => {
      for (let line of lines) {
        line.workdays = []
        line.allWorkdays = []
        line.selected = false
      }
      this.lines = lines
      this.rotations = Array.from(new Set(lines.map((line:line) => line.rotation))).sort()
      if (this.workdays) {
        this.setAllWorkdays()
        this.setHeader(this.date)
      }
    })
    this.workdaySubscription = this.data.lineWorkdays.subscribe((workdays:workday[]) => {
      this.workdays = workdays
      if (this.lines) {
        this.setAllWorkdays()
        this.setHeader(this.date)
      }
    })
    this.data.fetchLines()
    this.data.fetchLineWorkdays()
  }

  ngOnDestroy(): void {
    this.linesSubscription.unsubscribe()
    this.workdaySubscription.unsubscribe()
    this.workgroupSubscription.unsubscribe()
  }

  setAllWorkdays(): void {
    this.lines.forEach((line)=>{
      line.allWorkdays = this.workdays.filter(workday => workday.line_id == line.id)
      line.workdays_str = line.allWorkdays.map(workday => workday.workday)
    })
  }

  setHeader(date: Date): void {
    this.loading = true
    this.header1 = [
      {holiday: false, header_name: ''},
      {holiday: false, header_name: 'Desk'},
      {holiday: false, header_name: 'Start'},
      {holiday: false, header_name: 'Len'},
      {holiday: false, header_name: 'Rot'},
      {holiday: false, header_name: 'AM/PM'},
      {holiday: false, header_name: 'DOM'},
      {holiday: false, header_name: 'Line'}
    ]
    this.header2 = [
      {holiday: false, header_name: ''},
      {holiday: false, header_name: ''},
      {holiday: false, header_name: 'Time'},
      {holiday: false, header_name: ''},
      {holiday: false, header_name: ''},
      {holiday: false, header_name: 'MID'},
      {holiday: false, header_name: 'INTL'},
      {holiday: false, header_name: '#'}
    ]
    this.lines.forEach((el)=>{el.workdays = []})
    let checkDate = new Date(date)
    for (let i = 0; i < 31; i++) {
      if (this.isSameMonth(checkDate)) {
        const date_str = checkDate.toISOString().split('T')[0]
        const isHoliday = Object.values(this.holidays).includes(date_str)
        const isUserDay = this.userDates.includes(date_str)
        const weekday = new Intl.DateTimeFormat('en-US', {weekday: 'short'}).format(checkDate)
        const cal_day = new Intl.DateTimeFormat('en-US', {day: 'numeric'}).format(checkDate)
        this.header1.push({userDay: isUserDay, holiday: isHoliday, header_name: weekday})
        this.header2.push({userDay: isUserDay, holiday: isHoliday, header_name: cal_day})
        const isWorkday = (element) => element.workday == date_str
        for (let line of this.lines) {
          if (this.setVisibility(line)) {
            if (line.allWorkdays.some(isWorkday)) {
              const workday = line.allWorkdays.find(workday => workday.workday == date_str)
              line.workdays.push({date: new Date (checkDate), shift_id: workday.shift_id, holiday: isHoliday, userDay: isUserDay});
            } else {
              line.workdays.push({date: new Date(checkDate), shift_id: '--', holiday: isHoliday, userDay: isUserDay});
            }
          }
        }
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    this.loading = false
  }

  isSameMonth(date) {
    return date.getMonth() === this.date.getMonth();
  }

  setMonth(inc) {
    this.loading = true;
    const [year, month] = [this.date.getFullYear(), this.date.getMonth()];
    this.date = new Date(year, month + inc, 1);
    this.setHeader(this.date)
  }

  onSelectedRotation(line:line) {
    return this.selectedRotations.some(e => e === line.rotation)
  }

  hasHolidayOff(line:line): boolean {
    if (this.h1off && line.workdays_str.some(e => e === this.holidays.h1)) {
      return false
    }
    if (this.h2off && line.workdays_str.some(e => e === this.holidays.h2)) {
      return false
    }
    if (this.h3off && line.workdays_str.some(e => e === this.holidays.h3)) {
      return false
    }
    if (this.h4off && line.workdays_str.some(e => e === this.holidays.h4)) {
      return false
    }
    if (this.h5off && line.workdays_str.some(e => e === this.holidays.h5)) {
      return false
    }
    if (this.h6off && line.workdays_str.some(e => e === this.holidays.h6)) {
      return false
    }
    if (this.h7off && line.workdays_str.some(e => e === this.holidays.h7)) {
      return false
    }
    if (this.h8off && line.workdays_str.some(e => e === this.holidays.h8)) {
      return false
    }
    if (this.h9off && line.workdays_str.some(e => e === this.holidays.h9)) {
      return false
    }
    if (this.h10off && line.workdays_str.some(e => e === this.holidays.h10)) {
      return false
    }
    return true
  }

  hasUserDayOff(line:line): boolean {
    return line.workdays_str.some(day => this.userDates.includes(day))
  }

  getLineWorkdays(line:line) {
    let workdays = []
    for (let workday of line.workdays) {
      if (workday.shift_id != '--') {
        let date_str = workday.date.toISOString().split('T')[0]
        workdays.push(date_str)
      }
    }
    return workdays
  }

  setVisibility(line: line) {
    let showMe = this.hasHolidayOff(line)
    if (!showMe) {
      return false
    }
    showMe = !this.hasUserDayOff(line)
    if (!showMe) {
      return false
    }
    if (this.selectedRotations[0] != 'All') {
      showMe = this.onSelectedRotation(line)
    }
    if (!showMe) {
      return false
    }
    if (line.length == '9' && !this.showNine) {
      return false
    }
    if (line.length =='10' && !this.showTen) {
      return false
    }
    if (line.theater == 'DOM' && !this.showDOM) {
      return false
    }
    if ((line.theater == 'INTL' || line.theater == 'DUAL') && !this.showINTL) {
      return false
    }
    if (line.time_of_day == 'AM' && !this.showAM) {
      return false
    }
    if (line.time_of_day == 'PM' && !this.showPM) {
      return false
    }
    if (line.time_of_day == 'MIDS' && !this.showMID) {
      return false
    }
    if (line.time_of_day == 'RLF' && !this.showRLF) {
        return false
    }
    return showMe
  }

  clickTest() {
    console.log('Lines: ', this.lines)
    console.log('Workdays: ', this.workdays)
  }

  lineClickTest(line:line) {
    console.log('Line Clicked: ', line)
  }

  addUserDate() {
    if (this.userDate) {
      this.userDates.push(this.userDate)
      this.userDate = null
    }
    this.setHeader(this.date)
  }

  removeUserDate(date) {
    const index = this.userDates.indexOf(date)
    if (index >= 0) {
      this.userDates.splice(index, 1)
    }
    this.setHeader(this.date)
  }


}
