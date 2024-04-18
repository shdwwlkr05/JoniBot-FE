import { Component, OnInit, OnDestroy} from '@angular/core';
import { Subscription } from 'rxjs'
import { DataStorageService, links } from '../bid-form/data-storage.service'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy{
  isAuthenticated = false;
  private userSub: Subscription;
  user
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
    this.linksSub = this.data.navBarLinks.subscribe((response:links) => {
      this.links = response
    })
    this.data.fetchNavBarLinks()
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
    this.linksSub.unsubscribe();
  }

  onLogout() {
    this.authService.logout('Thank You for using the Flight Control Bidder. Please log in to continue.');
  }

  isTester(username) {
    const testers = [
      'DAL110', // Corner
      'DAL105', // Hatlee
      'DAL178', // Bowne
      'DAL352', // Makings
      'DAL333', // Rinehart
    ]
    return testers.includes(username)
  }

  refreshPage() {
    window.location.reload()
  }

  showLinks() {
    console.log(this.links)
  }
}
