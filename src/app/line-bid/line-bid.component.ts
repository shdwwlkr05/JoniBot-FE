import { Component, OnInit, OnDestroy } from '@angular/core';
import {DataStorageService} from "../bid-form/data-storage.service";
import {Subscription} from "rxjs";
import {moveItemInArray} from "@angular/cdk/drag-drop";
import {Router} from "@angular/router";
import {faPlusCircle} from "@fortawesome/free-solid-svg-icons";
import {faAngleUp} from "@fortawesome/free-solid-svg-icons"
import {faAngleDown} from "@fortawesome/free-solid-svg-icons"
import {faAngleDoubleUp} from "@fortawesome/free-solid-svg-icons";
import {faAngleDoubleDown} from "@fortawesome/free-solid-svg-icons";
import {faTrash} from "@fortawesome/free-solid-svg-icons";
import {faAngleRight} from "@fortawesome/free-solid-svg-icons";
import {faFilter} from "@fortawesome/free-solid-svg-icons"
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";


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

interface filters {
  showAM: boolean;
  showPM: boolean;
  showMID: boolean;
  showRLF: boolean;
  showDOM: boolean;
  showINTL: boolean;
  showFleet: boolean;
  showSPT: boolean;
  showNine: boolean;
  showTen: boolean;
  selectedRotations: string[];
  selectedStartTimes: string[];
}

interface workday {
  id: number;
  workday: string;
  shift_id: string;
  line_id: number;
}

interface award {
  id: number;
  workgroup: string;
  line_number: number;
  user: number;
}

@Component({
  selector: 'app-line-bid',
  templateUrl: './line-bid.component.html',
  styleUrls: ['./line-bid.component.css']
})
export class LineBidComponent implements OnInit, OnDestroy {
  faPlusCircle = faPlusCircle
  faAngleUp = faAngleUp
  faAngleDown = faAngleDown
  faAngleDoubleUp = faAngleDoubleUp
  faAngleDoubleDown = faAngleDoubleDown
  faAngleRight = faAngleRight
  faTrash = faTrash
  faFilter = faFilter
  bid = []
  currentBid = []
  linesOnBid: line[] = []
  selected = []
  selectedLines: line[] = []
  bidSubscription = new Subscription()
  lines: line[]
  rotations = []
  startTimes = []
  linesSubscription = new Subscription()
  response = 'none'
  responseSubscription = new Subscription()
  userAdd = ''
  selectedChanged = false
  doImport = false
  doInsert = false
  bidulatorImportInput = ''
  insertLinesInput = ''
  insertChoiceInput = ''
  filters: filters
  userGroup = ''
  workgroupSubscription: Subscription
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
  workdays: workday[]
  workdaySubscription = new Subscription()
  bidLineOccurence: {}
  bidTime
  bidTimeSubscription = new Subscription()
  lineAwards
  lineAwardSubscription = new Subscription()
  shortnames = {}
  namesSubscription = new Subscription()


  constructor(private data: DataStorageService,
              private router: Router,
              private modalService: NgbModal) { }

  ngOnInit(): void {
    this.workgroupSubscription = this.data.userWorkgroup.subscribe(workgroup => {
      this.userGroup = workgroup
    })
    this.bidSubscription = this.data.lineBid.subscribe(data => {
      this.bid = data.bid.split(',')
      this.currentBid = data.bid.split(',')
      this.selected = data.selected.split(',')
      this.waitForInit()
    })
    this.linesSubscription = this.data.lines.subscribe((lines:line[]) => {
      this.lines = lines
      this.rotations = Array.from(new Set(lines.map((line:line) => line.rotation))).sort()
      this.startTimes = Array.from(new Set(lines.map((line: line) => line.start_time))).sort()
      this.waitForInit()
    })
    this.data.fetchLineBid()
    this.responseSubscription = this.data.httpResponse.subscribe(response => {
      this.response = response
      console.log('HTTP Response:', response)
    })
    this.filters = this.data.fetchFilters()
    this.bidTimeSubscription = this.data.bidTime.subscribe(bidTime => {
      this.bidTime = bidTime
    })
    this.data.fetchBidTime()
    this.lineAwardSubscription = this.data.lineAwards.subscribe((awards: award[]) => {
      this.lineAwards = awards
    })
    this.data.fetchLineAwards()
    this.namesSubscription = this.data.shortnames.subscribe(names => {
      this.shortnames = names
    })
    this.data.fetchShortNames()
    this.waitForInit()
  }

  ngOnDestroy(): void {
    this.bidSubscription.unsubscribe()
    this.linesSubscription.unsubscribe()
    this.responseSubscription.unsubscribe()
    this.workgroupSubscription.unsubscribe()
    this.workdaySubscription.unsubscribe()
    this.bidTimeSubscription.unsubscribe()
    this.namesSubscription.unsubscribe()
  }

  waitForInit() {
    if (this.lines != null && this.bid != null && this.selected != null) {
      this.setBid()
      this.setSelected()
    } else {
      setTimeout(this.waitForInit, 250)
    }
  }


  openError(content) {
    this.modalService.open(content, { size: 'sm' });
  }

  openFilters(content) {
    const modalRef = this.modalService.open(content, { size:'md' });
    modalRef.closed.subscribe(() => {
      this.data.storeFilters(this.filters)
    })
  }

  onDrop(event) {
    moveItemInArray(this.linesOnBid, event.previousIndex, event.currentIndex)
    this.response = 'unsaved'
  }

  viewAllLines() {
    this.router.navigate(['lines'])
  }

  onSave() {
    const pending_bid = []
    const pending_selected = []
    this.linesOnBid.forEach((line:line) => {
      pending_bid.push(line.line_number)
    })
    this.selectedLines.forEach((line:line) => {
      pending_selected.push(line.line_number)
    })
    const payload = {
      bid: pending_bid.join(','),
      selected: pending_selected.join(',')
    }
    this.data.saveLineBid(payload, 'bid')
    this.bid = pending_bid
    this.currentBid = pending_bid

  }

  saveSelected() {
    const pending_selected = []
    this.selectedLines.forEach((line:line) => {
      pending_selected.push(line.line_number)
    })
    const payload = {
      bid: this.bid.join(','),
      selected: pending_selected.join(',')
    }
    this.data.saveLineBid(payload, 'selected')
    this.selectedChanged = false
  }

  onRevert() {
    this.setBid()
    this.response = 'none'
  }

  setBid() {
    this.linesOnBid = []
    this.bidLineOccurence = {}
    this.bid.forEach((el:string) => {
      let result = this.lines.find((line:line) => {
        return line.line_number === el
      })
      this.linesOnBid.push(result)
    })
    this.checkOccurences()
  }

  checkOccurences() {
    this.bidLineOccurence = {}
    this.linesOnBid.forEach((line:line) => {
      if (this.bidLineOccurence[line.line_number]) {
        this.bidLineOccurence[line.line_number] += 1
      } else {
        this.bidLineOccurence[line.line_number] = 1
      }
    })
  }

  setRowColor(line:line) {
    if (this.lineAwards) {
      const awards = this.lineAwards.map(e => e.line_number)
      if (awards.includes(line.line_number.toString())) {
        return 'lightpink'
      }
      if (this.bidLineOccurence[line.line_number] > 1) {
        return 'yellow'
      }
    }
  }

  setSelected() {
    this.selectedLines = []
    this.lines.forEach((line:line) => {
      line.selected = this.selected.includes(line.line_number)
      if (line.selected) {
        this.selectedLines.push(line)
      }
    })
  }

  addSelected(content) {
    const lineFound = this.lines.find((line:line) => {
      return line.line_number === this.userAdd.toString()
    })
    if (lineFound) {
      this.selected.push(lineFound.line_number)
      this.setSelected()
      this.selectedChanged = true
    } else {
      this.openError(content)
    }
    this.userAdd = ''
  }

  isOnBid(checkLine:line) {
    return this.linesOnBid.find((line:line) => line === checkLine)
  }

  clickTest() {
    console.log('Selected Lines: ', this.selected);
  }

  clickImport() {
    this.doImport = true;
  }

  bidulatorImport() {
    const bidulatorBid = this.bidulatorImportInput.split(',')
    this.linesOnBid = []
    bidulatorBid.forEach((el:string) => {
      let result = this.lines.find((line:line) => {
        return line.line_number === el
      })
      this.linesOnBid.push(result)
    })
    this.doImport = false
    this.response = 'unsaved'
  }

  cancelBidulatorImport() {
    this.doImport = false
  }

  clickInsert() {
    this.doInsert = true;
    this.insertChoiceInput = ''
    this.insertLinesInput = ''
  }

  insertLines() {
    this.response = 'none'
    const beforeChoice = +this.insertChoiceInput - 1
    const insertLines = this.insertLinesInput.replace(/\s+/g, '').split(',')
    let lineNumToInsert = []
    insertLines.forEach((el:string) => {
      if (el.includes('-')) {
        let range = el.split('-')
        let rangeStart = +range[0]
        let rangeEnd = +range[1]
        if (rangeStart < rangeEnd) {
          for (let start = rangeStart; start <= rangeEnd; start++) {
            lineNumToInsert.push(start.toString())
          }
        } else {
          for (let start = rangeStart; start >= rangeEnd; start--) {
            lineNumToInsert.push(start.toString())
          }
        }
      } else {
        lineNumToInsert.push(el)
      }
    })
    let linesToInsert = []
    lineNumToInsert.forEach((el:string) => {
      let result = this.lines.find((line:line) => {
        return line.line_number === el
      })
      if (result) {
        linesToInsert.push(result)
      } else {
        this.response = 'bad_line'
      }
    })
    if (this.response != 'bad_line') {
      if (beforeChoice == -1) {
        linesToInsert.forEach((line:line) => {
          this.linesOnBid.push(line)
        })
        this.response = 'unsaved'
        this.doInsert = false
      } else {
        this.linesOnBid.splice(beforeChoice, 0, ...linesToInsert)
        this.response = 'unsaved'
        this.doInsert = false
      }
    }
    this.checkOccurences()
  }

  cancelInsert() {
    this.doInsert = false
  }

  moveTop(moveLine: line) {
    const index = this.linesOnBid.indexOf(moveLine)
    this.linesOnBid.splice(index, 1)
    this.linesOnBid.splice(0, 0, moveLine)
    this.response = 'unsaved'
  }

  moveUp(moveLine: line) {
    const index = this.linesOnBid.indexOf(moveLine)
    this.linesOnBid.splice(index, 1)
    this.linesOnBid.splice(index - 1, 0, moveLine)
    this.response = 'unsaved'
  }

  moveDown(moveLine: line) {
    const index = this.linesOnBid.indexOf(moveLine)
    this.linesOnBid.splice(index, 1)
    this.linesOnBid.splice(index + 1, 0, moveLine)
    this.response = 'unsaved'
  }

  moveBottom(moveLine: line) {
    const index = this.linesOnBid.indexOf(moveLine)
    this.linesOnBid.splice(index, 1)
    this.linesOnBid.push(moveLine)
    this.response = 'unsaved'
  }

  addToBid(addLine:line) {
    if (!this.isOnBid(addLine)) {
      this.linesOnBid.push(addLine)
      this.response = 'unsaved'
    }
  }

  removeFromBid(index) {
    // const index = this.linesOnBid.indexOf(remLine)
    this.linesOnBid.splice(index, 1)
    this.response = 'unsaved'
    this.checkOccurences()
  }

  clickRemoveAwarded() {
    this.lineAwards.forEach((award:award) => {
      let index = this.linesOnBid.map(e => e.line_number).indexOf(award.line_number.toString())
      if (index != -1) {
        this.linesOnBid.splice(index, 1)
        this.response = 'unsaved'
      }
    })
    this.checkOccurences()
  }

  lineAwardedTo(line_number: string) {
    if (this.lineAwards) {
      const award = this.lineAwards.find(award => award.line_number == line_number)
      if (award) {
        return this.shortnames[award.user]
      } else {
        return null
      }
    }
  }

  removeFromSelected(remLine:line) {
    const index = this.selected.indexOf(remLine.line_number)
    this.selected.splice(index, 1)
    this.selectedChanged = true
    this.setSelected()
  }

  onSelectedRotation(line:line) {
    return this.filters.selectedRotations.some(e => e === line.rotation)
  }

  onSelectedStartTime(line:line) {
    return this.filters.selectedStartTimes.some(e => e === line.start_time)
  }

  setVisibility(line: line) {
    let showMe = !this.isOnBid(line)
    if (!showMe) {
      return false
    }
    if (this.filters.selectedRotations[0] != 'All') {
      showMe = this.onSelectedRotation(line)
    }
    if (!showMe) {
      return false
    }
    if (this.filters.selectedStartTimes[0] != 'All') {
      showMe = this.onSelectedStartTime(line)
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

}
