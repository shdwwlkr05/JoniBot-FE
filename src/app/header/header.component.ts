import { Component, OnInit, OnDestroy} from '@angular/core';
import { Subscription } from 'rxjs'
import { DataStorageService, links } from '../bid-form/data-storage.service'
import { AuthService } from '../auth/auth.service'
import { User } from '../auth/user.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  isReliefBidder = false;
  private userSub: Subscription;
  private reliefSub: Subscription;
  user: User
  links: links
  linksSub: Subscription


  constructor(
    private authService: AuthService,
    private data:DataStorageService,
  ) { }

  ngOnInit() {
    this.userSub = this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user
      this.user = user;
    })
    this.reliefSub = this.authService.isRelief$.subscribe(val => {
      this.isReliefBidder = val
    })
    this.linksSub = this.data.navBarLinks.subscribe((response:links) => {
      this.links = response
    })
    this.data.fetchNavBarLinks()
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
    this.reliefSub.unsubscribe();
    this.linksSub.unsubscribe();
  }

  onLogout() {
    this.authService.logout('Thank You for using the Flight Control Bidder. Please log in to continue.');
  }

  isTester(username) {
    return this.authService.isTester(username)
  }


  refreshPage() {
    window.location.reload()
  }

  showLinks() {
    console.log(this.links)
  }
}
