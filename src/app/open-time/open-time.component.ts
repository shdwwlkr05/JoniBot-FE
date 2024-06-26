import { Component, OnInit } from '@angular/core';
import { faArrowCircleDown, faArrowCircleUp, faTrash } from '@fortawesome/free-solid-svg-icons'
import { DataStorageService } from '../bid-form/data-storage.service'
import { Subscription } from 'rxjs'
import { moveItemInArray } from '@angular/cdk/drag-drop'
import {environment} from "../../environments/environment";
import {DatePipe} from "@angular/common";

interface shift {
  id: string
  day: string
  shift: string
}

interface parameters {
  id: number
  start_date: string
  close_date: string
  fs_skip: number[]
  sfsd_skip: number[]
  sfsi_skip: number[]
  som_skip: number[]
  ssom_skip: number[]
}

@Component({
  selector: 'app-open-time',
  templateUrl: './open-time.component.html',
  styleUrls: ['./open-time.component.css']
})
export class OpenTimeComponent implements OnInit {
  faArrowCircleUp = faArrowCircleUp
  faArrowCircleDown = faArrowCircleDown
  faTrash = faTrash
  shiftDate
  bids = []
  numberOfBids: number = 0
  received_ids = []
  received_bids = []
  showAM = true
  showPM = true
  showMID = true
  showDOM = true
  showINTL = true
  showFleet = true
  showSPT = true
  showNine = true
  showTen = true
  showOnBid = true
  dayOfWeekFilterSelected = true
  showSu = true
  showMo = true
  showTu = true
  showWe = true
  showTh = true
  showFr = true
  showSa = true
  shiftFilterWarning = false
  response = 'none'
  open_shifts: shift[] = []
  show_shifts: shift[] = []
  openDesks = []
  openDays = []
  sptDesks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']
  fleetDesks = ['N', 'O', 'Q', 'R', 'S', 'V', 'W', 'X', 'Y', 'Z']
  selectedDesks = ['All']
  selectedDays = ['All']
  shiftSubscription: Subscription
  bidSubscription: Subscription
  responseSubscription: Subscription
  workgroupSubscription: Subscription
  workgroupCountSubscription: Subscription
  openTimeRankSubscription: Subscription
  shiftTimesSubscription: Subscription
  userQualSubscription: Subscription
  limitAwards = false
  receivedLimit = false
  maxAward: number = 1
  receivedMax = 1
  awardPeriod = 'm'
  receivedPeriod = 'm'
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  userGroup = ''
  openTimeRank = ''
  totalInGroup = ''
  shiftTimes
  userQuals
  intlQual = true
  sptQual = true
  parameterSubscription: Subscription
  parameters: parameters
  selected_start_date
  formatted_start_date
  selected_close_date
  formatted_close_date

  constructor(private data: DataStorageService) {

  }

  async ngOnInit() {
    this.workgroupSubscription = this.data.userWorkgroup.subscribe(workgroup => {
      this.userGroup = workgroup
    })
    this.responseSubscription = this.data.httpResponse.subscribe(response => {
      this.response = response
    })
    this.shiftSubscription = this.data.openTimeShifts.subscribe(shifts => {
      this.open_shifts = shifts
      this.openDesks = Array.from(new Set(shifts.map((shift) => shift.shift))).sort()
      this.openDays = Array.from(new Set(shifts.map((shift) => +shift.day)))
      this.openDays.sort((a, b) => a - b)
      this.open_shifts.sort((a, b) => +a.day - +b.day)
      this.shiftsToShow()
      this.mapBids()
    })
    this.bidSubscription = this.data.openTimeBid.subscribe(bid => {
      this.received_ids = bid.bid.split(',').map(Number)
      this.limitAwards = bid.limit_award
      this.receivedLimit = bid.limit_award
      this.maxAward = bid.limit_amount
      this.receivedMax = bid.limit_amount
      this.awardPeriod = bid.limit_period
      this.receivedPeriod = bid.limit_period
      this.mapBids()
    })
    this.workgroupCountSubscription = this.data.workgroupCount.subscribe(count => {
      this.totalInGroup = count
    })
    this.openTimeRankSubscription = this.data.openTimeRank.subscribe(rank => {
      this.openTimeRank = rank
    })
    this.shiftTimesSubscription = this.data.shiftTimes.subscribe(times => {
      this.shiftTimes = times
    })
    this.check_shifts()
    this.userQualSubscription = this.data.userQuals.subscribe(quals => {
      this.userQuals = quals
      if (!quals.includes('INTL')) {
        this.showINTL = false
        this.intlQual = false
      }
      if (!quals.includes('SPT')) {
        this.showSPT = false
        this.sptQual = false
      }
    })

    this.parameterSubscription = this.data.openTimeParams.subscribe(params => {
      this.parameters = params
      const start_date = new Date(this.parameters.start_date + 'T06:00:00.000')
      this.shiftDate = new Date(this.parameters.start_date + 'T06:00:00.000')
      this.selected_start_date = params.start_date
      this.formatted_start_date = new DatePipe('en-US').transform(start_date, 'MMMM yyyy')
      const close_date = new Date(this.parameters.close_date + 'T06:00:00.000')
      this.formatted_close_date = new DatePipe('en-US').transform(close_date, 'MMMM dd')
      this.selected_close_date = params.close_date
    })
    await this.data.fetchWorkgroupCount()
    await this.data.fetchOpenTimeBid()
    await this.data.fetchOpenTimeRank()
    await this.data.fetchShiftTimes()
    await this.data.fetchUserQualifications()
    await this.data.fetchOpenTimeParameters()
    await this.data.fetchOpenTimeShifts()

  }

  ngOnDestroy(): void {
    this.shiftSubscription.unsubscribe()
    this.bidSubscription.unsubscribe()
    this.responseSubscription.unsubscribe()
    this.workgroupCountSubscription.unsubscribe()
    this.openTimeRankSubscription.unsubscribe()
    this.shiftTimesSubscription.unsubscribe()
    this.userQualSubscription.unsubscribe()
    this.parameterSubscription.unsubscribe()
  }

  add_shift(shift: shift) {
    if (this.shiftOnBid(shift)) {
      return
    }
    this.bids.push(shift)
    this.setUnsaved()
    this.check_shifts()
  }

  check_shifts() {
    this.numberOfBids = this.bids.length
    this.shiftsToShow()
  }

  shiftOnBid(shift: shift) {
    return this.bids.some(e => e.id === shift.id)
  }

  onSelectedDesk(shift: shift) {
    return this.selectedDesks.some(e => e === shift.shift)
  }

  onSelectedDay(shift: shift) {
    return this.selectedDays.some(e => e == shift.day)
  }

  onMoveUp(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.bids.splice(elIndex - 1, 0, bid)
    this.setUnsaved()
    this.check_shifts()
  }

  onMoveDown(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.bids.splice(elIndex + 1, 0, bid)
    this.setUnsaved()
    this.check_shifts()
  }

  onDelete(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.setUnsaved()
    this.check_shifts()
  }

  shiftsToShow() {
    this.show_shifts = []
    for (let shift of this.open_shifts) {
      if (this.setVisibility(shift)) {
        this.show_shifts.push(shift)
      }
    }
  }

  setVisibility(shift: shift) {
    let showMe = true
    if (this.selectedDays[0] != 'All' && this.selectedDesks[0] != 'All') {
      showMe = this.onSelectedDay(shift) && this.onSelectedDesk(shift)
    } else if (this.selectedDesks[0] != 'All') {
      showMe = this.onSelectedDesk(shift)
    } else if (this.selectedDays[0] != 'All') {
      showMe = this.onSelectedDay(shift)
    }
    if (this.shiftOnBid(shift) && !this.showOnBid) {
      showMe = false
    }
    if (isNaN(+shift.shift[2]) && !this.showINTL) {
      showMe = false
    }
    if (!isNaN(+shift.shift[2]) && !this.showDOM) {
      showMe = false
    }
    if (this.sptDesks.includes(shift.shift[3]) && !this.showSPT) {
      showMe = false
    }
    if (this.fleetDesks.includes(shift.shift[3]) && !this.showFleet) {
      showMe = false
    }
    if ((shift.shift[0] == 'A' || shift.shift[0] == 'E') && !this.showAM) {
      showMe = false
    }
    if (shift.shift[0] == 'P' && !this.showPM) {
      showMe = false
    }
    if (shift.shift[0] == 'M' && !this.showMID) {
      showMe = false
    }
    if (shift.shift[3] == 'T' && !this.showTen) {
      showMe = false
    }
    if (shift.shift[3] == 'N' && !this.showNine) {
      showMe = false
    }
    this.shiftFilterWarning = !showMe
    let showDayOfWeek = this.shiftOnDayOfWeek(shift)
    return showMe && showDayOfWeek
  }

  onSave() {
    let bidIDs
    if (this.bids.length == 0) {
      bidIDs = ['0']
    } else {
      bidIDs = this.bids.map(function (bid) {
        return bid.id
      })
    }
    const payload = {
      "bid": bidIDs.join(','),
      "limit_amount": this.maxAward,
      "limit_award": this.limitAwards,
      "limit_period": this.awardPeriod
    }
    this.data.submitOpenTimeBid(payload)
  }

  onRevert() {
    this.bids = this.received_bids.slice()
    this.limitAwards = this.receivedLimit
    this.maxAward = this.receivedMax
    this.awardPeriod = this.receivedPeriod
    this.response = 'none'
    this.check_shifts()
  }

  mapBids() {
    if (this.received_ids.length == 0 || this.open_shifts.length == 0) {
      return
    } else {
      if (this.received_ids.length == 1 && this.received_ids[0] == 0) {
        this.received_bids = []
        return
      } else {
        this.received_bids = []
        this.received_ids.forEach(bidID => {
          this.received_bids.push(this.open_shifts.find((shift) => bidID === shift.id))
        })
        this.bids = this.received_bids.slice()
        this.check_shifts()
      }
    }
  }

  test() {
    console.log(this.userQuals)
  }

  onDrop(event) {
    moveItemInArray(this.bids, event.previousIndex, event.currentIndex)
    this.setUnsaved()
  }

  setUnsaved() {
    this.response = 'unsaved'
  }

  shiftOnDayOfWeek(shift: shift) {
    this.shiftDate.setDate(+shift.day)
    switch (+this.shiftDate.getDay()) {
      case 0:
        return this.showSu
      case 1:
        return this.showMo
      case 2:
        return this.showTu
      case 3:
        return this.showWe
      case 4:
        return this.showTh
      case 5:
        return this.showFr
      case 6:
        return this.showSa
    }
  }

  isDayOfWeekFilterSelected() {
    this.shiftsToShow()
    this.dayOfWeekFilterSelected = this.showSu || this.showMo || this.showTu || this.showWe || this.showTh || this.showFr || this.showSa
  }
}
