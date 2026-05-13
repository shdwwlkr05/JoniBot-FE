import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ReliefDataService, reliefParams, reliefWorker, shift } from '../../services/relief-data.service';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit, OnDestroy {
  shifts: shift[] = []
  filteredShifts: shift[] = []
  bidders: reliefWorker[] = []
  filteredBidders: reliefWorker[] = []
  selectedGroup: string
  selectedBidderGroup: string
  shiftSubscription: Subscription
  paramSubscription: Subscription
  bidOrderSubscription: Subscription
  httpResponseSubscription: Subscription
  params: reliefParams
  selectedStartDate: string
  formattedStartDate: string
  selectedCloseDate: string
  formattedCloseDate: string
  selectedFile: File
  httpResponse: string
  processing = false
  exporting = false

  constructor(private reliefData: ReliefDataService) {}

  ngOnInit(): void {
    this.shiftSubscription = this.reliefData.adminReliefShifts.subscribe(shifts => {
      this.shifts = shifts
    })
    this.reliefData.adminFetchReliefShifts()

    this.paramSubscription = this.reliefData.reliefBidParams.subscribe(params => {
      this.params = params
      if (params.start_date) {
        const startDate = new Date(params.start_date + 'T06:00:00.000')
        this.selectedStartDate = params.start_date
        this.formattedStartDate = new DatePipe('en-US').transform(startDate, 'MMMM yyyy')
      }
      if (params.close_date) {
        const closeDate = new Date(params.close_date + 'T06:00:00.000')
        this.selectedCloseDate = params.close_date
        this.formattedCloseDate = new DatePipe('en-US').transform(closeDate, 'MMMM dd')
      }
    })
    this.reliefData.fetchReliefParams()

    this.bidOrderSubscription = this.reliefData.reliefBidOrder.subscribe(workers => {
      this.bidders = workers
    })
    this.reliefData.fetchReliefBidOrder()

    this.httpResponseSubscription = this.reliefData.httpResponse.subscribe(response => {
      this.httpResponse = response
      if (response === 'CSV file uploaded successfully') {
        this.reliefData.adminFetchReliefShifts()
        this.processing = false
      }
    })
  }

  ngOnDestroy(): void {
    this.shiftSubscription.unsubscribe()
    this.paramSubscription.unsubscribe()
    this.bidOrderSubscription.unsubscribe()
    this.httpResponseSubscription.unsubscribe()
  }

  getCountOfShifts(group: string): number {
    return this.shifts.filter(s => s.group === group).length
  }

  filterShifts(group: string): void {
    this.filteredShifts = this.shifts.filter(s => s.group === group)
  }

  getCountOfBidders(group: string): number {
    return this.bidders.filter(b => b.group === group).length
  }

  onBidderGroupChange(group: string): void {
    this.selectedGroup = null
    this.selectedBidderGroup = group.toUpperCase()
    this.filteredBidders = this.bidders.filter(b => b.group === group)
  }

  onGroupChange(group: string): void {
    this.selectedBidderGroup = null
    this.selectedGroup = group.toUpperCase()
    this.filterShifts(group)
  }

  setDates(): void {
    this.params.start_date = this.selectedStartDate
    this.params.close_date = this.selectedCloseDate
    this.reliefData.setReliefParams(this.params)
  }

  onFileSelected(event: any): void {
    this.selectedFile = event?.target?.files?.[0]
  }

  uploadShifts(): void {
    if (this.selectedFile) {
      const formData = new FormData()
      formData.append('file', this.selectedFile)
      this.processing = true
      this.reliefData.uploadReliefCSV(formData, this.selectedFile.name)
    }
  }

  exportBids(family: 'fs' | 'som'): void {
    this.exporting = true
    this.reliefData.downloadReliefBidExport(family).subscribe({
      next: (response) => {
        const blob = response.body
        if (!blob) return

        const disposition = response.headers.get('Content-Disposition')
        let filename = `${family.toUpperCase()} Relief Bids.xlsx`
        if (disposition) {
          const match = disposition.match(/filename="?([^"]+)"?/)
          if (match) filename = match[1]
        }

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        window.URL.revokeObjectURL(url)
        this.exporting = false
      },
      error: (err) => {
        console.error('Export failed:', err)
        this.httpResponse = 'Export failed'
        this.exporting = false
      }
    })
  }
}
