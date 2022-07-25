import {Component, OnDestroy, OnInit} from '@angular/core';
import { NgForm } from '@angular/forms'
import { Subscription } from 'rxjs';
import { AuthService } from './auth.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit, OnDestroy {
  error: string = ''
  authMessage: string = ''
  authMessageSubscription: Subscription

  constructor(private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authMessageSubscription = this.authService.authMessage.subscribe(authMessage => {
      this.authMessage = authMessage;
    })
  }

  ngOnDestroy() {
    this.authMessageSubscription.unsubscribe();
  }

  onSubmit(authForm: NgForm) {
    if (!authForm.valid) {
      return;
    }
    const username = authForm.value.username.toUpperCase();
    const password = authForm.value.password;
    // console.log(authForm.value, username, password)
    this.error = ''
    this.authService.login(username, password).subscribe(
      resData => {
        // console.log(resData)
      },
      error => {
        this.error = error;
        // console.log(this.error)
      }
    )
    authForm.reset()
  }
}
