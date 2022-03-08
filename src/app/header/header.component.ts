import { Component, OnInit, OnDestroy} from '@angular/core';
import { Subscription } from 'rxjs'
import { DataStorageService } from '../bid-form/data-storage.service'
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
  awardsVisible = false


  constructor(
    private authService: AuthService,
    private dataStorageService:DataStorageService
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user
      this.user = user;
      if (!!user) {
        const userName = +user['username'].slice(3)
        switch (true) {
          // SSOM
          case (userName > 800):
            this.awardsVisible = true
            break
          // SOM
          case (userName > 500):
            this.awardsVisible = true
            break
          // AFS
          case (userName > 300):
            this.awardsVisible = true
            break
          default:
            this.awardsVisible = true
        }
      }
    })
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  onLogout() {
    this.authService.logout();
  }

}
