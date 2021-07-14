import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms'
import { AuthService } from './auth.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  constructor(private authService: AuthService) {
  }

  ngOnInit(): void {
  }

  onSubmit(authForm: NgForm) {
    if (!authForm.valid) {
      return;
    }
    const username = authForm.value.username;
    const password = authForm.value.password;
    console.log(authForm.value, username, password)
    this.authService.login(username, password).subscribe(
      resData => {
        console.log(resData)
      },
      error => {
        console.log(error)
      }
    )
    authForm.reset()
  }
}
