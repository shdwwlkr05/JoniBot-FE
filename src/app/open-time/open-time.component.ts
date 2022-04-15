import { Component, OnInit } from '@angular/core';
import { faArrowCircleDown, faArrowCircleUp, faTrash } from '@fortawesome/free-solid-svg-icons'
import { DataStorageService } from '../bid-form/data-storage.service'
import { Subscription } from 'rxjs'

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
  response = ''
  open_shifts: shift[] = []
  shiftSubscription: Subscription
  bidSubscription: Subscription
  responseSubscription: Subscription

  constructor(private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.data.fetchOpenTimeShifts()
    this.data.fetchOpenTimeBid()
    this.responseSubscription = this.data.httpResponse.subscribe(response => {this.response = response})
    this.shiftSubscription = this.data.openTimeShifts.subscribe(shifts => {
      this.open_shifts = shifts
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
    this.response = ''
    this.check_shifts()
  }

  check_shifts() {
    this.numberOfBids = this.bids.length
    console.log('Number of bids: ', this.numberOfBids)
  }

  shiftOnBid(shift: shift) {
    return this.bids.some(e => e.id === shift.id)
  }

  onMoveUp(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.bids.splice(elIndex - 1, 0, bid)
    this.response = ''
    this.check_shifts()
  }

  onMoveDown(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.bids.splice(elIndex + 1, 0, bid)
    this.response = ''
    this.check_shifts()
  }

  onDelete(bid: shift) {
    const elIndex = this.bids.indexOf(bid)
    this.bids.splice(elIndex, 1)
    this.response = ''
    this.check_shifts()
  }


  setVisibility(shift: shift) {
    if (isNaN(+shift.shift[2]) && !this.showINTL) {
      return false
    } else if (!isNaN(+shift.shift[2]) && !this.showDOM) {
      return false
    } else if ((shift.shift[0] == 'A' || shift.shift[0] == 'E') && !this.showAM) {
      return false
    } else if (shift.shift[0] == 'P' && !this.showPM) {
      return false
    } else if (shift.shift[0] == 'M' && !this.showMID) {
      return false
    } else {
      return true
    }
  }

  onSave() {
    let bidIDs = this.bids.map(function (bid) {
      return bid.id
    })
    const payload = {"bid": "1,2,3,4,5"}
    console.log('payload:', payload)
    this.data.submitOpenTimeBid(payload)
  //  TODO Get this to send
  }

  onRevert() {
    this.bids = this.received_bids.slice()
    this.response = ''
    this.check_shifts()
  }

  mapBids() {
    console.log('Map Bids - Bid: ', this.received_ids)
    console.log('Map Bids - Shifts: ', this.open_shifts)
    if (this.received_ids.length == 0 || this.open_shifts.length == 0) {
      console.log('Map Bids - True')
      return
    } else {
      this.received_bids = []
      this.received_ids.forEach(bidID => {
        this.received_bids.push(this.open_shifts.find((shift) => bidID === shift.id))
      })
      console.log('Map Bids - Bid Shifts: ', this.received_bids)
      this.bids = this.received_bids.slice()
      this.check_shifts()
    }
  }
}
