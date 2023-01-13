import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs'
import { AuthService } from '../auth/auth.service'

@Component({
  selector: 'app-vac-bid',
  templateUrl: './vac-bid.component.html',
  styleUrls: ['./vac-bid.component.css']
})
export class VacBidComponent implements OnInit, OnDestroy{
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
