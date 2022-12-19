import { Component, OnInit, OnDestroy } from '@angular/core';
import {Subscription} from "rxjs";
import {DataStorageService} from "../bid-form/data-storage.service";

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

interface user {
  id: number;
  round1: string;
  round2: string;
  shiftbid: string;
  opentime: number;
  shiftbidrank: number;
  user: number;
}

interface award {
  id: number;
  workgroup: string;
  line_number: number;
  user: number;
}

@Component({
  selector: 'app-line-awards',
  templateUrl: './line-awards.component.html',
  styleUrls: ['./line-awards.component.css']
})
export class LineAwardsComponent implements OnInit, OnDestroy {
  c_time
  time_interval
  lines: line[] = []
  domLines: line[] = []
  domLinesRemaining = 64
  linesSubscription = new Subscription()
  userSubscription = new Subscription()
  userList: user[] = []
  namesSubscription = new Subscription()
  shortnames = {}
  bidTimeSubscription = new Subscription()
  bidTime = {'shiftbid': ''}
  lineAwardSubscription = new Subscription()
  lineAwards
  lineAwardsInterval
  bidSubscription = new Subscription()
  bid

  constructor(private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.time_interval = setInterval(() => {
      this.c_time = new Date();
    }, 1000)
    this.linesSubscription = this.data.lines.subscribe((lines: line[]) => {
      this.lines = lines
      this.domLines = this.lines.filter(line => line.theater == 'DOM')
    })
    this.userSubscription = this.data.userList.subscribe((users: user[]) => {
      this.userList = users
    })
    this.data.fetchUserList()
    this.namesSubscription = this.data.shortnames.subscribe(names => {
      this.shortnames = names
    })
    this.data.fetchShortNames()
    this.bidTimeSubscription = this.data.bidTime.subscribe(bidTime => {
      this.bidTime = bidTime[0]
    })
    this.data.fetchBidTime()
    this.lineAwardSubscription = this.data.lineAwards.subscribe((awards: award[]) => {
      this.lineAwards = awards
      const awardedLines = this.lineAwards.map(e => e.line_number)
      this.domLinesRemaining = this.domLines.filter(line => !awardedLines.includes(line.line_number)).length
      console.log('Dom Lines Remaining:', this.domLinesRemaining)
    })
    this.data.fetchLineAwards()
    this.bidSubscription = this.data.lineBid.subscribe(data => {
      this.bid = data.bid.split(',')
    })
    this.data.fetchLineBid()
    // this.lineAwardsInterval = setInterval(() =>
    //   this.data.fetchLineAwards(), 5000)
  }

  ngOnDestroy(): void {
    clearInterval(this.time_interval);
    this.linesSubscription.unsubscribe();
    this.userSubscription.unsubscribe();
    this.lineAwardSubscription.unsubscribe()
    this.bidSubscription.unsubscribe()
  }

  lineAwardedTo(line_number: string) {
    const award = this.lineAwards?.find(award => award.line_number == line_number)
    if (award) {
      return this.shortnames[award.user]
    } else {
      return null
    }
  }

  awardedLine(id: number) {
    const award = this.lineAwards?.find(award => award.user == id)
    if (award) {
      return award.line_number
    } else {
      return null
    }
  }

  onBid(line_number: string) {
    if (this.bid) {
      const index = this.bid.indexOf(line_number)
      if (index == -1) {
        return null
      } else {
        return index + 1
      }
    } else {
      return null
    }

  }

}
