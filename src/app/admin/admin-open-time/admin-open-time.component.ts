import {Component, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {DataStorageService} from "../../bid-form/data-storage.service";
import {DatePipe} from "@angular/common";
import {BidService} from "../../bid-form/bid.service";
import {MatSnackBar} from "@angular/material/snack-bar";

interface shift {
  id: number
  day: string
  shift: string
  group: string
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
  selector: 'app-admin-open-time',
  templateUrl: './admin-open-time.component.html',
  styleUrls: ['./admin-open-time.component.css']
})
export class AdminOpenTimeComponent implements OnInit {
  open_shifts: shift[] = []
  filtered_shifts: shift[] = []
  shiftSubscription: Subscription
  parameterSubscription: Subscription
  parameters: parameters
  selectedGroup
  selected_start_date
  formatted_start_date
  selected_close_date
  formatted_close_date
  selectedFile: File
  httpResponseSubscription: Subscription
  httpResponse
  processing: boolean = false

  constructor(private data: DataStorageService,
              private bid: BidService,
              private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.shiftSubscription = this.data.adminOpenTimeShifts.subscribe(shifts => {
      this.open_shifts = shifts
    })
    this.data.adminFetchOpenTimeShifts()
    this.parameterSubscription = this.data.openTimeParams.subscribe(params => {
      this.parameters = params
      const start_date = new Date(this.parameters.start_date + 'T06:00:00.000')
      this.selected_start_date = params.start_date
      this.formatted_start_date = new DatePipe('en-US').transform(start_date, 'MMMM yyyy')
      const close_date = new Date(this.parameters.close_date + 'T06:00:00.000')
      this.formatted_close_date = new DatePipe('en-US').transform(close_date, 'MMMM dd')
      this.selected_close_date = params.close_date
    })
    this.data.fetchOpenTimeParameters()
    this.httpResponseSubscription = this.bid.httpResponse.subscribe(response => {
      this.httpResponse = response
      this.showMessage(response)
      if (response == 'CSV file uploaded successfully') {
        this.data.adminFetchOpenTimeShifts()
        this.processing = false
      }
    })

  }

  ngOnDestroy() {
    this.shiftSubscription.unsubscribe()
    this.parameterSubscription.unsubscribe()
    this.httpResponseSubscription.unsubscribe()
  }

  getCountOfShifts(group: string) {
    const filteredShifts = this.open_shifts.filter(shift => shift.group == group)
    return filteredShifts.length
  }

  filterShifts(group: string) {
    this.filtered_shifts = this.open_shifts.filter(shift => shift.group == group)
  }

  onGroupChange(group: string) {
    this.selectedGroup = group.toUpperCase()
    this.filterShifts(group)
  }

  setDates() {
    this.parameters.start_date = this.selected_start_date
    this.parameters.close_date = this.selected_close_date
    this.data.setOpenTimeParameters(this.parameters)
  }

  resetParameters() {
    this.parameters.fs_skip = []
    this.parameters.sfsd_skip = []
    this.parameters.sfsi_skip = []
    this.parameters.som_skip = []
    this.parameters.ssom_skip = []
    this.data.setOpenTimeParameters(this.parameters)
  }

  onFileSelected(event: any) {
    this.selectedFile = event?.target?.files?.[0]
  }

  setShifts() {
    if (this.selectedFile) {
      const formData = new FormData()
      const filename = this.selectedFile.name
      formData.append('file', this.selectedFile)
      this.processing = true
      this.resetParameters()
      this.data.setOpenTimeShifts(formData, filename)
    } else {
      console.error('No file selected')
    }
  }

  toggleShift(shift: shift) {
    const workgroup = shift.group + '_skip'
    if (this.parameters[workgroup].includes(shift.id)) {
      this.parameters[workgroup].splice(this.parameters[workgroup].indexOf(shift.id), 1)
    } else {
      this.parameters[workgroup].push(shift.id)
    }
  }

  onSkipList(shift: shift) {
    const workgroup = shift.group + '_skip'
    return (this.parameters[workgroup].includes(shift.id))
  }

  showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 15000
    })
  }

}
