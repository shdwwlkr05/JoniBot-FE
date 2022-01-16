import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-mobile',
  templateUrl: './mobile.component.html',
  styleUrls: ['./mobile.component.css']
})
export class MobileComponent implements OnInit, OnDestroy {
  isAuthenticated = false
  private userSub:Subscription

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.userSub = this.authService.user.subscribe(user => {
      this.isAuthenticated = !!user
    })
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe()
  }

}
