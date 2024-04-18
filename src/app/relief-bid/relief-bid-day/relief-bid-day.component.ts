import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {reliefBid, ReliefDataService, reliefParams, shift} from "../relief-data.service";
import {DatePipe} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {faArrowCircleDown, faArrowCircleUp, faTrash} from "@fortawesome/free-solid-svg-icons";
import {moveItemInArray} from "@angular/cdk/drag-drop";
import {DataStorageService} from "../../bid-form/data-storage.service";



@Component({
  selector: 'app-relief-bid-day',
  templateUrl: './relief-bid-day.component.html',
  styleUrls: ['./relief-bid-day.component.css']
})
export class ReliefBidDayComponent implements OnInit, OnDestroy {
  protected readonly faArrowCircleUp = faArrowCircleUp;
  protected readonly faTrash = faTrash;
  protected readonly faArrowCircleDown = faArrowCircleDown;

  parameterSubscription: Subscription
  parameters: reliefParams
  formattedStartDate: string
  day: string
  bids
  unsaved = false
  workgroupSubscription: Subscription
  userGroup: string
  shiftTimesSubscription: Subscription
  shiftTimes
  reliefShiftsSubscription: Subscription
  reliefShifts: shift[]
  numberOfBids: number = 0
  open_shifts: shift[] = []
  show_shifts: shift[] = []
  reliefBidSubscription: Subscription
  reliefBid: reliefBid = {}
  reliefDayBid: shift[] = []
  currentReliefDayBid: shift[] = []
  httpResponseSubscription: Subscription
  httpResponse: string
  isFlashing: boolean = false
  backButtonText = 'Back'

  constructor(private data: ReliefDataService,
              private otData: DataStorageService,
              private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit(): void {
    this.parameterSubscription = this.data.reliefBidParams.subscribe(params => {
      this.parameters = params
      const start_date = new Date(this.parameters.start_date + 'T06:00:00.000')
      this.formattedStartDate = new DatePipe('en-US').transform(start_date, 'MMMM')
    })

    this.route.params.subscribe(params => {
      this.day = params['day']
    })

    this.workgroupSubscription = this.otData.userWorkgroup.subscribe(workgroup => {
      this.userGroup = workgroup
    })

    this.shiftTimesSubscription = this.otData.shiftTimes.subscribe(times => {
      this.shiftTimes = times
    })

    this.reliefShiftsSubscription = this.data.reliefShifts.subscribe(shifts => {
      this.reliefShifts = shifts
    })

    this.reliefBidSubscription = this.data.reliefBid.subscribe((bid: reliefBid) => {
      this.reliefBid = bid
      if (!bid[this.day]) {
        this.reliefDayBid = []
        this.currentReliefDayBid = []
      } else{
        this.reliefDayBid = bid[this.day]
        this.numberOfBids = this.reliefDayBid.length
        this.currentReliefDayBid = this.reliefDayBid.slice()
      }
    })

    this.httpResponseSubscription = this.data.httpResponse.subscribe(response => {
      this.httpResponse = response
      if (response == 'success') {
        this.setSaved()
      }
    })
  }

  ngOnDestroy() {
    this.parameterSubscription.unsubscribe()
    this.workgroupSubscription.unsubscribe()
    this.shiftTimesSubscription.unsubscribe()
    this.reliefShiftsSubscription.unsubscribe()
    this.reliefBidSubscription.unsubscribe()
    this.httpResponseSubscription.unsubscribe()
  }

  onDrop(event) {
    moveItemInArray(this.reliefDayBid, event.previousIndex, event.currentIndex)
    this.setUnsaved()
  }

  setUnsaved() {
    this.unsaved = true
  }

  setSaved() {
    this.unsaved = false
    this.isFlashing = false
    this.backButtonText = 'Back'
  }

  onMoveUp(bid: shift) {
    const elIndex = this.reliefDayBid.indexOf(bid)
    this.reliefDayBid.splice(elIndex, 1)
    this.reliefDayBid.splice(elIndex - 1, 0, bid)
    this.setUnsaved()
  }

  onMoveDown(bid: shift) {
    const elIndex = this.reliefDayBid.indexOf(bid)
    this.reliefDayBid.splice(elIndex, 1)
    this.reliefDayBid.splice(elIndex + 1, 0, bid)
    this.setUnsaved()
  }

  onDelete(bid: shift) {
    const elIndex = this.reliefDayBid.indexOf(bid)
    this.reliefDayBid.splice(elIndex, 1)
    this.numberOfBids = this.reliefDayBid.length
    this.setUnsaved()
  }

  add_shift(shift: shift) {
    this.reliefDayBid.push(shift)
    this.numberOfBids = this.reliefDayBid.length
    this.setUnsaved()
  }

  shiftVisibility(shift: shift) {
    return shift.day === this.day && !this.reliefDayBid.some(bid => bid.id === shift.id)
  }

  goBack() {
    if (this.unsaved && !this.isFlashing) {
      this.isFlashing = true
      this.backButtonText = 'Are you sure?'
    } else {
      this.router.navigate(['/relief'])
    }
  }

  onSave() {
    let bidIDs
    if (this.reliefDayBid.length == 0) {
      bidIDs = ['0']
    } else {
      bidIDs = this.reliefDayBid.map(function (bid) {
        return bid.id
      })
    }
    const payload = {
      "day": this.day,
      "bid": bidIDs.join(',')
    }
    this.data.submitReliefBid(payload)
  }

  onRevert() {
    this.reliefDayBid = this.currentReliefDayBid.slice()
    this.setSaved()
  }
}
