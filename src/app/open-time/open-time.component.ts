import { Component, OnInit } from '@angular/core';
import { faArrowCircleDown, faArrowCircleUp, faTrash } from '@fortawesome/free-solid-svg-icons'
import { DataStorageService } from '../bid-form/data-storage.service'
import { Subscription } from 'rxjs'
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop'

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
  title: string = 'Open Time for May 2022 (WIP)'
  bids = []
  numberOfBids: number = 0
  received_ids = []
  received_bids = []
  showAM = true
  showPM = true
  showMID = true
  showDOM = true
  showINTL = true
  showNine = true
  showTen = true
  showOnBid = true
  response = 'none'
  open_shifts: shift[] = []
  openDesks = []
  selectedDesks = ['All']
  shiftSubscription: Subscription
  bidSubscription: Subscription
  responseSubscription: Subscription
  limitAwards = false
  maxAward: number = 1
  awardPeriod = 'm'
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  userGroup = 'fs'

  constructor(private data: DataStorageService) {

  }

  ngOnInit(): void {
    this.data.fetchOpenTimeShifts(this.userGroup)
    this.data.fetchOpenTimeBid()
    this.responseSubscription = this.data.httpResponse.subscribe(response => {
      this.response = response
    })
    this.shiftSubscription = this.data.openTimeShifts.subscribe(shifts => {
      this.open_shifts = shifts
      this.openDesks = Array.from(new Set(shifts.map((shift) => shift.shift))).sort()
      this.mapBids()
    })
    this.bidSubscription = this.data.openTimeBid.subscribe(bid => {
      console.log('Received Bid: ', bid)
      this.received_ids = bid.bid.split(',').map(Number)
      this.mapBids()
    })
    this.check_shifts()

  }

  ngOnDestroy(): void {
    this.shiftSubscription.unsubscribe()
    this.bidSubscription.unsubscribe()
    this.responseSubscription.unsubscribe()
  }

  add_shift(shift: shift) {
    if (this.shiftOnBid(shift)) {
      return
    }
    this.bids.push(shift)
    this.response = 'unsaved'
    this.check_shifts()
  }

  check_shifts() {
    this.numberOfBids = this.bids.length
    console.log('Number of bids: ', this.numberOfBids)
    console.log('Bids: ', this.bids)
    console.log('Shifts: ', this.open_shifts)
  }

  shiftOnBid(shift: shift) {
    return this.bids.some(e => e.id === shift.id)
  }

  onSelectedDesk(shift:shift) {
    return this.selectedDesks.some(e => e === shift.shift)
  }

  onMoveUp(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.bids.splice(elIndex - 1, 0, bid)
    this.response = 'unsaved'
    this.check_shifts()
  }

  onMoveDown(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.bids.splice(elIndex + 1, 0, bid)
    this.response = 'unsaved'
    this.check_shifts()
  }

  onDelete(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.response = 'unsaved'
    this.check_shifts()
  }


  setVisibility(shift: shift) {
    if (this.selectedDesks[0] != 'All') {
      return this.onSelectedDesk(shift)
    } else if (this.shiftOnBid(shift) && !this.showOnBid) {
      return false
    } else if (isNaN(+shift.shift[2]) && !this.showINTL) {
      return false
    } else if (!isNaN(+shift.shift[2]) && !this.showDOM) {
      return false
    } else if ((shift.shift[0] == 'A' || shift.shift[0] == 'E') && !this.showAM) {
      return false
    } else if (shift.shift[0] == 'P' && !this.showPM) {
      return false
    } else if (shift.shift[0] == 'M' && !this.showMID) {
      return false
    } else if (shift.shift[3] == 'T' && !this.showTen) {
      return false
    } else if (shift.shift[3] == 'N' && !this.showNine) {
      return false
    } else {
      return true
    }
  }

  onSave() {
    console.log('onSave', this.bids)
    let bidIDs
    if (this.bids.length == 0) {
      bidIDs = ['0']
    } else {
      bidIDs = this.bids.map(function (bid) {
        return bid.id
      })
    }
    const payload = {"bid": bidIDs.join(',')}
    console.log('payload:', payload)
    this.data.submitOpenTimeBid(payload)
  }

  onRevert() {
    this.bids = this.received_bids.slice()
    this.response = 'none'
    this.check_shifts()
  }

  mapBids() {
    // console.log('Map Bids - Bid: ', this.received_ids)
    // console.log('Map Bids - Shifts: ', this.open_shifts)
    if (this.received_ids.length == 0 || this.open_shifts.length == 0) {
      // console.log('Map Bids - True')
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
        // console.log('Map Bids - Bid Shifts: ', this.received_bids)
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
    this.response = 'unsaved'
  }
}
