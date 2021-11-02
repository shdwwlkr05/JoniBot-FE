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


  constructor(
    private authService: AuthService,
    private dataStorageService:DataStorageService
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user
      this.user = user;
    })
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  onLogout() {
    this.authService.logout();
  }

}
