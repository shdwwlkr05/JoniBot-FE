import { Component, OnInit } from '@angular/core';
import { faArrowCircleDown, faArrowCircleUp, faTrash } from '@fortawesome/free-solid-svg-icons'
import { DataStorageService } from '../bid-form/data-storage.service'
import { Subscription } from 'rxjs'
import { moveItemInArray } from '@angular/cdk/drag-drop'

interface shift {
  id: string
  day: string
  shift: string
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
  title: string = 'Open Time for June 2022'
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
  shiftFilterWarning = false
  response = 'none'
  open_shifts: shift[] = []
  show_shifts: shift[] = []
  openDesks = []
  openDays = []
  sptDesks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K']
  fleetDesks = ['Q', 'R', 'S', 'V', 'W', 'X', 'Y', 'Z']
  selectedDesks = ['All']
  selectedDays = ['All']
  shiftSubscription: Subscription
  bidSubscription: Subscription
  responseSubscription: Subscription
  workgroupSubscription: Subscription
  workgroupCountSubscription: Subscription
  openTimeRankSubscription: Subscription
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
  shift_times = {
    'A61T': '06:00',
    'P52T': '14:00',
    'P63T': '14:45',
    'P50N': '12:00',
    'M38N': '21:30',
    'P48T': '14:00',
    'A4ET': '06:00',
    'M36N': '21:30',
    'M3DN': '21:15',
    'P56T': '14:00',
    'A4DT': '06:00',
    'M4DN': '21:15',
    'P22T': '14:45',
    'E07N': '05:30',
    'E23T': '05:00',
    'M3EN': '21:15',
    'E8AN': '05:00',
    'P4BT': '12:00',
    'P2AN': '13:00',
    'P16N': '15:15',
    'M37N': '21:30',
    'E08N': '05:30',
    'A3ET': '06:00',
    'E18N': '05:00',
    'E16T': '05:30',
    'P15T': '12:00',
    'M6DN': '21:15',
    'M40N': '21:30',
    'P29T': '14:45',
    'P21N': '15:15',
    'A7CT': '10:00',
    'E7AT': '05:00',
    'A40T': '06:00',
    'A1ET': '06:00',
    'A39T': '06:00',
    'P10N': '14:15',
    'P30N': '15:15',
    'P8DN': '13:00',
    'E21T': '05:30',
    'E7BT': '05:00',
    'M6CN': '21:15',
    'E24N': '05:00',
    'P14T': '12:00',
    'E28T': '05:00',
    'P45T': '13:00',
    'A43T': '06:00',
    'E6AT': '05:00',
    'P61T': '15:45',
    'P4CN': '14:00',
    'E26T': '05:30',
    'P09N': '14:15',
    'P2BT': '12:00',
    'P44T': '13:00',
    'P3BN': '13:00',
    'M3CN': '21:15',
    'A53T': '06:00',
    'E8BT': '05:00',
    'A37T': '06:00',
    'A38T': '06:00',
    'E60T': '05:30',
    'E62T': '05:00',
    'E12T': '05:00',
    'E17T': '05:00',
    'M42N': '21:30',
    'M4EN': '21:15',
    'M43N': '21:30',
    'P1AT': '13:00',
    'P7DT': '12:00',
    'M1CN': '21:15',
    'P07N': '14:15',
    'A42T': '06:00',
    'E10N': '05:30',
    'E22T': '05:00',
    'P3AT': '12:00',
    'E69T': '05:00',
    'A36T': '06:00',
    'P55T': '15:15',
    'E34T': '05:00',
    'P57T': '14:00',
    'P13N': '15:15',
    'M2CN': '21:15',
    'E55T': '05:30',
    'E25T': '05:00',
    'P46T': '13:00',
    'P49T': '14:00',
    'P11T': '13:45',
    'P31T': '12:00',
    'A59T': '06:00',
    'M41N': '21:30',
    'A58T': '06:00',
    'P4AT': '12:00',
    'P18T': '13:45',
    'P32T': '12:00',
    'E33T': '05:30',
    'P68T': '14:45',
    'P27T': '12:00',
    'P69T': '14:45',
    'E68T': '05:00',
    'A6CT': '08:00',
    'P20T': '12:00',
    'P62T': '14:45',
    'E11N': '05:00',
    'A2ET': '06:00',
    'E54N': '05:00',
    'P08N': '14:15',
    'P51T': '14:00',
    'P60T': '15:15',
    'P33N': '15:15',
    'P24T': '13:45',
    'P26N': '15:15',
    'E09N': '05:30',
    'A19N': '06:00',
    'E13T': '05:30',
    'P8CT': '13:00',
    'E30T': '05:30',
    'A41T': '06:00',
    'M39N': '21:30',
    'P53T': '15:45',
    'E29T': '05:00',
    'A2DT': '06:00',
    'P19N': '18:00',
    'E63T': '05:00',
    'P47T': '13:00',
    'M1BN': '21:15',
    'P5CN': '12:30',
    'M5EN': '21:15',
    'E35N': '05:00',
    'P35T': '13:45',
  }
  constructor(private data: DataStorageService) {

  }

  ngOnInit(): void {
    this.workgroupSubscription = this.data.userWorkgroup.subscribe(workgroup => {
      this.userGroup = workgroup
      this.data.fetchOpenTimeShifts(workgroup)
      this.data.fetchWorkgroupCount(workgroup)
    })
    this.data.fetchOpenTimeBid()
    this.data.fetchOpenTimeRank()
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
    this.check_shifts()

  }

  ngOnDestroy(): void {
    this.shiftSubscription.unsubscribe()
    this.bidSubscription.unsubscribe()
    this.responseSubscription.unsubscribe()
    this.workgroupCountSubscription.unsubscribe()
    this.openTimeRankSubscription.unsubscribe()
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
    return showMe
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
    console.log('maxAward: ', this.maxAward)
    console.log('awardPeriod: ', this.awardPeriod)
  }

  onDrop(event) {
    moveItemInArray(this.bids, event.previousIndex, event.currentIndex)
    this.setUnsaved()
  }

  setUnsaved() {
    this.response = 'unsaved'
  }
}
