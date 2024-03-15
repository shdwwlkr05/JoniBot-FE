import { Component, OnInit, OnDestroy } from '@angular/core';
import {Subscription} from "rxjs";
import {award, DataStorageService, line, user} from "../bid-form/data-storage.service";


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
  intlLines: line[] = []
  domRlfLines: line[] = []
  dualRlfLines: line[] = []
  domLinesRemaining
  intlLinesRemaining
  domRlfLinesRemaining
  dualRlfLinesRemaining
  linesToBlock = 36
  domLinesNotBlocked
  linesSubscription = new Subscription()
  userSubscription = new Subscription()
  userList: user[] = []
  namesSubscription = new Subscription()
  shortnames = {}
  bidTimeSubscription = new Subscription()
  bidTime = {'shiftbid': '', 'shiftbidrank': 0}
  lineAwardSubscription = new Subscription()
  lineAwards
  lineAwardsInterval
  bidSubscription = new Subscription()
  bid
  nextBidder: user

  constructor(private data: DataStorageService) {
  }

  ngOnInit(): void {
    this.time_interval = setInterval(() => {
      this.c_time = new Date();
    }, 1000)
    this.linesSubscription = this.data.lines.subscribe((lines: line[]) => {
      this.lines = lines
      this.domLines = this.lines.filter(line => line.theater == 'DOM' && line.time_of_day != 'RLF')
      this.intlLines = this.lines.filter(line => line.theater == 'INTL')
      this.domRlfLines = this.lines.filter(line => line.theater == 'DOM' && line.time_of_day == 'RLF')
      this.dualRlfLines = this.lines.filter(line => line.theater == 'DUAL')
    })
    this.userSubscription = this.data.userList.subscribe((users: user[]) => {
      this.userList = users
      this.findNextBidder()
    })
    this.data.fetchUserList()
    this.namesSubscription = this.data.shortnames.subscribe(names => {
      this.shortnames = names
    })
    this.data.fetchShortNames()
    this.bidTimeSubscription = this.data.bidTime.subscribe(bidTime => {
      this.bidTime = bidTime[0]
      if (this.bidTime.shiftbidrank == 0) {
        this.bidTime.shiftbid = ''
      }
    })
    this.data.fetchBidTime()
    this.lineAwardSubscription = this.data.lineAwards.subscribe((awards: award[]) => {
      this.lineAwards = awards
      this.findNextBidder()
      const awardedLines = this.lineAwards.map(e => e.line_number)
      this.domLinesRemaining = this.domLines.filter(line => !awardedLines.includes(line.line_number)).length
      this.intlLinesRemaining = this.intlLines.filter(line => !awardedLines.includes(line.line_number)).length
      this.domRlfLinesRemaining = this.domRlfLines.filter(line => !awardedLines.includes(line.line_number)).length
      this.dualRlfLinesRemaining = this.dualRlfLines.filter(line => !awardedLines.includes(line.line_number)).length
      this.domLinesNotBlocked = this.domLinesRemaining + this.domRlfLinesRemaining - this.linesToBlock
      if (this.domLinesNotBlocked < 0) {
        this.domLinesNotBlocked = 0
      }
    })
    this.data.fetchLineAwards()
    this.bidSubscription = this.data.lineBid.subscribe(data => {
      this.bid = data.bid.split(',')
    })
    this.data.fetchLineBid()
    this.lineAwardsInterval = setInterval(() =>
      this.data.fetchLineAwards(), 30000)
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

  findNextBidder() {
    if (this.userList && this.lineAwards) {
      const awardedUsers = this.lineAwards.map(e => e.user)
      for (let user of this.userList) {
        if (!awardedUsers.includes(user.user) && new Date(user.shiftbid) > new Date()) {
          this.nextBidder = user
          break
        }
      }
    }
  }

}
