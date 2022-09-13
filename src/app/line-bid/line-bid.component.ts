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
  bid = []
  linesOnBid: line[] = []
  selected = []
  selectedLines: line[] = []
  bidSubscription = new Subscription()
  lines: line[]
  linesSubscription = new Subscription()
  response = 'none'
  responseSubscription = new Subscription()
  userAdd = ''
  selectedChanged = false
  doImport = false
  bidulatorImportInput = ''

  constructor(private data: DataStorageService,
              private router: Router,
              private modalService: NgbModal) { }

  ngOnInit(): void {
    this.bidSubscription = this.data.lineBid.subscribe(data => {
      this.bid = data.bid.split(',')
      this.selected = data.selected.split(',')
    })
    this.linesSubscription = this.data.lines.subscribe((lines:line[]) => {
      this.lines = lines
      if (this.bid && this.selected) {
        this.setBid()
        this.setSelected()
      }
    })
    this.data.fetchLineBid()
    this.data.fetchLines()
    this.responseSubscription = this.data.httpResponse.subscribe(response => {
      this.response = response
      console.log('HTTP Response: ', response)
    })
  }

  ngOnDestroy(): void {
    this.bidSubscription.unsubscribe()
    this.linesSubscription.unsubscribe()
    this.responseSubscription.unsubscribe()
  }

  openError(content) {
    this.modalService.open(content, { size: 'sm' });
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
    this.bid.forEach((el:string) => {
      let result = this.lines.find((line:line) => {
        return line.line_number === el
      })
      this.linesOnBid.push(result)
    })
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

  removeFromBid(remLine:line) {
    const index = this.linesOnBid.indexOf(remLine)
    this.linesOnBid.splice(index, 1)
  }

  removeFromSelected(remLine:line) {
    const index = this.selected.indexOf(remLine.line_number)
    this.selected.splice(index, 1)
    this.selectedChanged = true
    this.setSelected()
  }
}
