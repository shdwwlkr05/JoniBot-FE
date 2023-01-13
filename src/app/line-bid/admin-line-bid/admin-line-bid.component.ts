import {Component, OnDestroy, OnInit} from '@angular/core';
import {DataStorageService, line} from "../../bid-form/data-storage.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-admin-line-bid',
  templateUrl: './admin-line-bid.component.html',
  styleUrls: ['./admin-line-bid.component.css']
})
export class AdminLineBidComponent implements OnInit, OnDestroy {
  userID
  bid
  lines
  linesOnBid: line[] = []
  bidSubscription = new Subscription();
  linesSubscription = new Subscription();
  constructor(private data: DataStorageService) { }

  ngOnInit(): void {
    this.bidSubscription = this.data.lineBid.subscribe(data => {
      this.bid = data.bid.split(',')
      this.linesOnBid = []
      this.bid.forEach((el:string) => {
        let result = this.lines.find((line:line) => {
          return line.line_number === el
        })
        this.linesOnBid.push(result)
      })
      }
    )
    this.linesSubscription = this.data.lines.subscribe((lines:line[]) => {
      this.lines = lines
    })
    this.data.fetchLines()
  }

  ngOnDestroy(): void {
    this.bidSubscription.unsubscribe();
    this.linesSubscription.unsubscribe();
  }

  fetchUserBid() {
    this.linesOnBid = []
    this.data.adminFetchLineBid(this.userID)
  }
}
