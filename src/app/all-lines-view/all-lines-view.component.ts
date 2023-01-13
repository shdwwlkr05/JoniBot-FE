import {Component, OnDestroy, OnInit} from '@angular/core';
import { Subscription } from 'rxjs';
import {DataStorageService, filters} from "../bid-form/data-storage.service";
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
  userGroup = ''
  workgroupSubscription: Subscription
  response
  responseSubscription = new Subscription()
  loading = true
  filters: filters
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
  userDate

  constructor(private data: DataStorageService,
              private router: Router,
  ) { }

  ngOnInit(): void {
    this.workgroupSubscription = this.data.userWorkgroup.subscribe(workgroup => {
      this.userGroup = workgroup
    })
    this.linesSubscription = this.data.lines.subscribe((lines: line[]) => {
      for (let line of lines) {
        if (this.selected) {
          line.selected = this.selected.includes(line.line_number);
        } else {
          line.selected = false;
        }
      }
      this.lines = lines
      this.rotations = Array.from(new Set(lines.map((line:line) => line.rotation))).sort()
      this.waitForInit()
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
    this.data.fetchLineBid()
    this.filters = this.data.fetchFilters()
    this.waitForInit()
  }

  ngOnDestroy(): void {
    this.linesSubscription.unsubscribe()
    this.workgroupSubscription.unsubscribe()
    this.bidSubscription.unsubscribe()
    this.responseSubscription.unsubscribe()
  }

  waitForInit() {
    if (this.lines && this.filters) {
      this.setHeader(this.date)
    } else {
      setTimeout(this.waitForInit, 250)
    }
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
        const weekday = new Intl.DateTimeFormat('en-US', {weekday: 'short'}).format(checkDate)
        const cal_day = new Intl.DateTimeFormat('en-US', {day: 'numeric'}).format(checkDate)
        this.header1.push({holiday: isHoliday, header_name: weekday})
        this.header2.push({holiday: isHoliday, header_name: cal_day})
        const isWorkday = (element) => element.workday == date_str
        for (let line of this.lines) {
          if (this.setVisibility(line)) {
            if (line.allWorkdays.some(isWorkday)) {
              const workday = line.allWorkdays.find(workday => workday.workday == date_str)
              line.workdays.push({date: new Date (checkDate), shift_id: workday.shift_id, holiday: isHoliday});
            } else {
              line.workdays.push({date: new Date(checkDate), shift_id: '--', holiday: isHoliday});
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
    return this.filters.selectedRotations.some(e => e === line.rotation)
  }

  setVisibility(line: line) {
    let showMe
    if (this.filters.selectedRotations[0] != 'All') {
      showMe = this.onSelectedRotation(line)
    }
    if (!showMe) {
      return false
    }
    if (line.length == '9' && !this.filters.showNine) {
      return false
    }
    if (line.length =='10' && !this.filters.showTen) {
      return false
    }
    if (line.theater == 'DOM' && !this.filters.showDOM) {
      return false
    }
    if ((line.theater == 'INTL' || line.theater == 'DUAL') && !this.filters.showINTL) {
      return false
    }
    if (line.time_of_day == 'AM' && !this.filters.showAM) {
      return false
    }
    if (line.time_of_day == 'PM' && !this.filters.showPM) {
      return false
    }
    if (line.time_of_day == 'MIDS' && !this.filters.showMID) {
      return false
    }
    if (line.time_of_day == 'RLF' && !this.filters.showRLF) {
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

  clickTest() {
    console.log('Bid: ', this.bid)
    console.log('Selected: ', this.selected)
  }

  lineClickTest(line:line) {
    console.log('Line Clicked: ', line)
  }

  dateClickTest() {
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
    this.data.storeFilters(this.filters)
  }

  setUnsaved() {
    this.response = 'unsaved'
  }
}
