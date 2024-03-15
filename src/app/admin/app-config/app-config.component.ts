import {Component, OnDestroy, OnInit} from '@angular/core';
import {DataStorageService, links, userQuals} from "../../bid-form/data-storage.service";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-app-config',
  templateUrl: './app-config.component.html',
  styleUrls: ['./app-config.component.css']
})
export class AppConfigComponent implements OnInit, OnDestroy {
  lineBid
  vacBid
  openTime
  linksSub: Subscription;
  links: links
  dbID
  userQuals
  intlQual = false
  sptQual = false
  message = ''
  httpResponseSubscription = new Subscription()
  httpResponse = ''

  constructor(private data: DataStorageService) { }

  ngOnInit(): void {
    this.linksSub = this.data.navBarLinks.subscribe((response: links) => {
      this.links = response
      this.lineBid = this.links.line_bid
      this.vacBid = this.links.vac_bid
      this.openTime = this.links.open_time
    })
    this.data.fetchNavBarLinks()
    this.httpResponseSubscription = this.data.httpResponse.subscribe((response: string) => {
      this.httpResponse = response
    })
  }

  ngOnDestroy(): void {
    this.linksSub.unsubscribe()
  }

  setLinks() {
    this.links.line_bid = this.lineBid
    this.links.vac_bid = this.vacBid
    this.links.open_time = this.openTime
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
}
