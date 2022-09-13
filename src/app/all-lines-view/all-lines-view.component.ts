import {Component, OnDestroy, OnInit} from '@angular/core';
import { Subscription } from 'rxjs';
import {DataStorageService} from "../bid-form/data-storage.service";
import {faPlusCircle} from "@fortawesome/free-solid-svg-icons";
import {faTrash} from "@fortawesome/free-solid-svg-icons";
import {faArrowCircleLeft} from "@fortawesome/free-solid-svg-icons";
import {faArrowCircleRight} from "@fortawesome/free-solid-svg-icons";
import {Router} from "@angular/router";

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
  faArrowCircleRight = faArrowCircleRight
  faArrowCircleLeft = faArrowCircleLeft
  faTrash = faTrash
  header1 = []
  header2 = []
  date = new Date('2022-10-1');
  lines: line[]
  linesSubscription = new Subscription()
  bid = []
  selected = []
  bidSubscription = new Subscription()
  rotations = []
  selectedRotations = ['All']
  workdays: workday[]
  workdaySubscription = new Subscription()
  userGroup = ''
  workgroupSubscription: Subscription
  response
  responseSubscription = new Subscription()
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

  constructor(private data: DataStorageService,
              private router: Router,
  ) { }

  ngOnInit(): void {
    this.workgroupSubscription = this.data.userWorkgroup.subscribe(workgroup => {
      this.userGroup = workgroup
    })
    this.linesSubscription = this.data.lines.subscribe((lines: line[]) => {
      for (let line of lines) {
        line.workdays = []
        line.allWorkdays = []
        if (this.selected) {
          line.selected = this.selected.includes(line.line_number);
        } else {
          line.selected = false;
        }
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
    this.bidSubscription = this.data.lineBid.subscribe(data => {
      this.bid = data.bid.split(',')
      this.selected = data.selected.split(',')
      if (this.lines) {
        this.lines.forEach(line => {
          line.selected = this.selected.includes(line.line_number)
        })
      }
    })
    this.responseSubscription = this.data.httpResponse.subscribe(response => {
      this.response = response
    })
    this.data.fetchLines()
    this.data.fetchLineWorkdays()
    this.data.fetchLineBid()
    this.showAM = (localStorage.getItem('showAM')==='true')
    this.showPM = (localStorage.getItem('showPM')==='true')
    this.showMID = (localStorage.getItem('showMID')==='true')
    this.showRLF = (localStorage.getItem('showRLF')==='true')
    this.showDOM = (localStorage.getItem('showDOM')==='true')
    this.showINTL = (localStorage.getItem('showINTL')==='true')
    this.showFleet = (localStorage.getItem('showFleet')==='true')
    this.showSPT = (localStorage.getItem('showSPT')==='true')
    this.showNine = (localStorage.getItem('showNine')==='true')
    this.showTen = (localStorage.getItem('showTen')==='true')
    this.h1off = (localStorage.getItem('h1off')==='true')
    this.h2off = (localStorage.getItem('h2off')==='true')
    this.h3off = (localStorage.getItem('h3off')==='true')
    this.h4off = (localStorage.getItem('h4off')==='true')
    this.h5off = (localStorage.getItem('h5off')==='true')
    this.h6off = (localStorage.getItem('h6off')==='true')
    this.h7off = (localStorage.getItem('h7off')==='true')
    this.h8off = (localStorage.getItem('h8off')==='true')
    this.h9off = (localStorage.getItem('h9off')==='true')
    this.h10off = (localStorage.getItem('h10off')==='true')
    this.selectedRotations = localStorage.getItem('selectedRotations').split(',')
    const userDates = localStorage.getItem('userDates').split(',')
    if (userDates[0] === '') {
      this.userDates = []
    } else {
      this.userDates = userDates
    }
  }

  ngOnDestroy(): void {
    this.linesSubscription.unsubscribe()
    this.workdaySubscription.unsubscribe()
    this.workgroupSubscription.unsubscribe()
    this.bidSubscription.unsubscribe()
    this.responseSubscription.unsubscribe()
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

  selectVisible() {
    for (let line of this.lines) {
      if (this.setVisibility(line)) {
        line.selected = true
      }
    }
  }

  unselectVisible() {
    for (let line of this.lines) {
      if (this.setVisibility(line)) {
        line.selected = false
      }
    }
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

  clickTest() {
    console.log('Bid: ', this.bid)
    console.log('Selected: ', this.selected)
  }

  lineClickTest(line:line) {
    console.log('Line Clicked: ', line)
  }

  dateClickTest() {
    console.log('Date Clicked: ', this.userDates)
  }

  toLineBid() {
    this.router.navigate(['lineBid'])
  }

  saveSelected() {
    const pending_selected = []
    this.lines.forEach((line) => {
      if (line.selected) {
        pending_selected.push(line.line_number)
      }
    })
    if (pending_selected.length == 0) {
      pending_selected.push(0)
    }
    const payload = {
      bid: this.bid.join(','),
      selected: pending_selected.join(',')
    }
    this.data.saveLineBid(payload, 'selected')
    localStorage.setItem('showAM', String(this.showAM))
    localStorage.setItem('showPM', String(this.showPM))
    localStorage.setItem('showMID', String(this.showMID))
    localStorage.setItem('showRLF', String(this.showRLF))
    localStorage.setItem('showDOM', String(this.showDOM))
    localStorage.setItem('showINTL', String(this.showINTL))
    localStorage.setItem('showFleet', String(this.showFleet))
    localStorage.setItem('showSPT', String(this.showSPT))
    localStorage.setItem('showNine', String(this.showNine))
    localStorage.setItem('showTen', String(this.showTen))
    localStorage.setItem('h1off', String(this.h1off))
    localStorage.setItem('h2off', String(this.h2off))
    localStorage.setItem('h3off', String(this.h3off))
    localStorage.setItem('h4off', String(this.h4off))
    localStorage.setItem('h5off', String(this.h5off))
    localStorage.setItem('h6off', String(this.h6off))
    localStorage.setItem('h7off', String(this.h7off))
    localStorage.setItem('h8off', String(this.h8off))
    localStorage.setItem('h9off', String(this.h9off))
    localStorage.setItem('h10off', String(this.h10off))
    localStorage.setItem('userDates', this.userDates.join(','))
    localStorage.setItem('selectedRotations', this.selectedRotations.join(','))
  }

  setUnsaved() {
    this.response = 'unsaved'
  }
}
