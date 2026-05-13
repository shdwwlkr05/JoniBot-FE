import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  DataStorageService,
  holidayUsed,
  lineBidParams,
  links,
  userQuals,
  vacBidDates
} from "../../bid-form/data-storage.service";
import {Subscription} from "rxjs";
import {faTrash, faPlusCircle} from "@fortawesome/free-solid-svg-icons";
import {environment} from "../../../environments/environment";


@Component({
  selector: 'app-app-config',
  templateUrl: './app-config.component.html',
  styleUrls: ['./app-config.component.css']
})
export class AppConfigComponent implements OnInit, OnDestroy {
  faTrash = faTrash;
  faPlusCircle = faPlusCircle;
  lineBid
  vacBid
  openTime
  reliefBid
  linksSub: Subscription;
  links: links
  dbID: string
  dbIDhol: string
  domBlock: number
  editLine: number
  userQuals
  intlQual = false
  sptQual = false
  message = ''
  messageHols = ''
  httpResponseSubscription = new Subscription()
  httpResponse = ''
  vacBidDates: vacBidDates
  vacBidDatesSubscription = new Subscription()
  start_of_bid: string
  end_of_bid: string
  round1_display: boolean
  round2_display: boolean
  round3_display: boolean
  round3_due_local: string
  round4_display: boolean
  round4_due_local: string
  round5_display: boolean
  round5_due_local: string
  round6_display: boolean
  round6_due_local: string
  round7_display: boolean
  round7_due_local: string
  round8_display: boolean
  round8_due_local: string
  currYear = environment.currYear
  nextYear = environment.nextYear
  updatedVacBidDates: vacBidDates
  usedHolidays: holidayUsed[]
  usedHolidaysSubscription = new Subscription()
  holidays: string[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', '']
  addHolYear: number = environment.currYear
  selectedHolYear: number = environment.currYear
  addHolID: string = this.holidays[0]
  addHolDate: string
  lineBidParamsSubscription = new Subscription()
  lineBidParams: lineBidParams

  private readonly holidayIds: string[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10']
  holidaysByYear: Record<number, string[]> = {
    [environment.currYear]: [...this.holidayIds],
    [environment.nextYear]: [...this.holidayIds]
  }



  constructor(private data: DataStorageService) { }

  ngOnInit(): void {
    this.linksSub = this.data.navBarLinks.subscribe((response: links) => {
      this.links = response
      this.lineBid = this.links.line_bid
      this.vacBid = this.links.vac_bid
      this.openTime = this.links.open_time
      this.reliefBid = this.links.relief_bid
    })
    this.data.fetchNavBarLinks()
    this.httpResponseSubscription = this.data.httpResponse.subscribe((response: string) => {
      this.httpResponse = response
    })
    this.vacBidDatesSubscription = this.data.vacBidDates.subscribe((response: vacBidDates) => {
      this.vacBidDates = response
      this.start_of_bid = this.vacBidDates.start_of_bid
      this.end_of_bid = this.vacBidDates.end_of_bid
      this.round1_display = this.vacBidDates.round1_display
      this.round2_display = this.vacBidDates.round2_display
      this.round3_display = this.vacBidDates.round3_display
      this.round3_due_local = this.utcToLocal(this.vacBidDates.round3_due_date)
      this.round4_display = this.vacBidDates.round4_display
      this.round4_due_local = this.utcToLocal(this.vacBidDates.round4_due_date)
      this.round5_display = this.vacBidDates.round5_display
      this.round5_due_local = this.utcToLocal(this.vacBidDates.round5_due_date)
      this.round6_display = this.vacBidDates.round6_display
      this.round6_due_local = this.utcToLocal(this.vacBidDates.round6_due_date)
      this.round7_display = this.vacBidDates.round7_display
      this.round7_due_local = this.utcToLocal(this.vacBidDates.round7_due_date)
      this.round8_display = this.vacBidDates.round8_display
      this.round8_due_local = this.utcToLocal(this.vacBidDates.round8_due_date)
    })
    this.data.fetchVacBidDates()
    this.usedHolidaysSubscription = this.data.adminUsedHolidays.subscribe((response) => {
      this.usedHolidays = response
      this.refreshAvailableHolidaysForYear(this.addHolYear)
      this.messageHols = ''
    })
    this.lineBidParamsSubscription = this.data.lineBidParams.subscribe((response: lineBidParams) => {
      this.lineBidParams = response
      this.domBlock = response.domBlock
    })
    this.data.fetchLineBidParams()

  }

  ngOnDestroy(): void {
    this.linksSub.unsubscribe()
    this.httpResponseSubscription.unsubscribe()
    this.vacBidDatesSubscription.unsubscribe()
    this.usedHolidaysSubscription.unsubscribe()
    this.lineBidParamsSubscription.unsubscribe()

  }

  private localToUTC(dateString:string): string {
    if (!dateString) return ''
    const localDate = new Date(dateString)
    return localDate.toISOString().slice(0, 19) + 'Z'
  }

  private utcToLocal(dateString: string): string {
    if (!dateString) return ''
    const utcDate = new Date(dateString)
    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  setLinks() {
    this.links.line_bid = this.lineBid
    this.links.vac_bid = this.vacBid
    this.links.open_time = this.openTime
    this.links.relief_bid = this.reliefBid
    this.data.setNavBarLinks(this.links)
  }

  getQuals() {
    const request = {"user": this.dbID}
    this.message = ''
    this.httpResponse = ''
    this.intlQual = false
    this.sptQual = false
    this.data.fetchAdminUserQuals(request).subscribe((quals:userQuals) => {
      this.userQuals = quals[0]
      if (quals[0]) {
        if (quals[0].qualification.includes('INTL')) {
          this.intlQual = true
        }
        if (quals[0].qualification.includes('SPT')) {
          this.sptQual = true
        }
        this.message = `Found user ${this.dbID}`
      } else {
        this.message = `No quals found for user ${this.dbID}`
      }
    })
  }

  setQuals() {
    let quals = '0'
    this.httpResponse = ''
    if (this.userQuals) {
      if (this.intlQual && this.sptQual) {
        quals = 'INTL,SPT'
      } else if (this.sptQual) {
        quals = 'SPT'
      } else if (this.intlQual) {
        quals = 'INTL'
      }
      this.userQuals.qualification = quals
      this.data.updateAdminUserQuals(this.userQuals)
    } else {
      if (this.intlQual && this.sptQual) {
        quals = 'INTL,SPT'
      } else if (this.sptQual) {
        quals = 'SPT'
      } else if (this.intlQual) {
        quals = 'INTL'
      }
      const request = {"user": +this.dbID, "qualification": quals}
      this.data.setAdminUserQuals(request)
    }
  }

  setBidDates() {
    this.updatedVacBidDates = {
      id: this.vacBidDates.id,
      start_of_bid: this.start_of_bid,
      end_of_bid: this.end_of_bid,
      round1_display: this.round1_display,
      round2_display: this.round2_display,
      round3_display: this.round3_display,
      round3_due_date: this.localToUTC(this.round3_due_local),
      round4_display: this.round4_display,
      round4_due_date: this.localToUTC(this.round4_due_local),
      round5_display: this.round5_display,
      round5_due_date: this.localToUTC(this.round5_due_local),
      round6_display: this.round6_display,
      round6_due_date: this.localToUTC(this.round6_due_local),
      round7_display: this.round7_display,
      round7_due_date: this.localToUTC(this.round7_due_local),
      round8_display: this.round8_display,
      round8_due_date: this.localToUTC(this.round8_due_local)
    }
    this.httpResponse = ''
    this.data.setVacBidDates(this.updatedVacBidDates)
  }

  getUsedHols() {
    const request = {"user": this.dbIDhol}
    this.messageHols = ''
    this.httpResponse = ''
    // this.holidays = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', '']
    this.data.fetchAdminUsedHolidays(request).subscribe((hols: holidayUsed[]) => {
      this.messageHols = `Found user ${this.dbIDhol}`
      this.usedHolidays = hols
      this.refreshAvailableHolidaysForYear(this.addHolYear)
      // keep currently selected year
      this.addHolYear = this.addHolYear ?? environment.currYear
      this.addHolID = this.holidays[0]
      this.addHolDate = new Date().toISOString().split('T')[0];
      console.log(hols)
    })
  }

  onDelete(hol: holidayUsed) {
    const request = {"id": hol.id, "user": this.dbIDhol}
    this.messageHols = ''
    this.httpResponse = ''
    this.data.removeUsedHoliday(request)
    setTimeout(() => {
      this.getUsedHols()
    }, 2000)
  }

  onAdd() {
    this.messageHols = ''
    this.httpResponse = ''
    const usedHoliday = {
      year: +this.addHolYear,
      hol_used: this.addHolID,
      date_used: this.addHolDate,
      user: +this.dbIDhol
    }
    this.data.addUsedHoliday(usedHoliday)
    setTimeout(() => {
      this.getUsedHols()
    }, 2000)
  }


  setBlockLines() {
    this.lineBidParams.domBlock = this.domBlock
    this.domBlock = 0
    this.data.setLineBidParams(this.lineBidParams)
  }

  protected readonly environment = environment;

  onHolYearChange() {
    this.refreshAvailableHolidaysForYear(this.addHolYear)
  }

  private refreshAvailableHolidaysForYear(year: number) {
    const base = this.holidaysByYear[year] ?? []
    const usedForYear = (this.usedHolidays ?? []).filter(h => +h.year === +year).map(h => h.hol_used)
    this.holidays = base.filter(h => !usedForYear.includes(h))
    this.addHolID = this.holidays[0] ?? ''
  }


}
