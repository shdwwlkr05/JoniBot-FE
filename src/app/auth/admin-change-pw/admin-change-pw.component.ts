import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgForm} from "@angular/forms";
import {HttpErrorResponse} from "@angular/common/http";
import {AuthService} from "../auth.service";

export interface ResponseData {
  status: string;
  code: number;
  message: string;
  data: any;
}

@Component({
  selector: 'app-admin-change-pw',
  templateUrl: './admin-change-pw.component.html',
  styleUrls: ['./admin-change-pw.component.css']
})
export class AdminChangePwComponent implements OnInit, OnDestroy {
  username: string;
  usernameConfirm: string;
  password: string;
  passwordConfirm: string;
  message: string;
  status: string;

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
  }

  ngOnDestroy() {
  }

  onSubmit(adminChangePwForm: NgForm) {
    this.message = ''
    this.status = ''
    const payload = {'username': this.username, 'new_password': this.password}
    this.auth.adminChangePassword(payload).subscribe((response:ResponseData) => {
      this.message = response.message
      this.status = response.status
    }, (err:HttpErrorResponse) => {
      this.message = err.error.message
      this.status = err.error.status
    })
    adminChangePwForm.reset()
  }

  usernamesMatch() {
    return this.username == this.usernameConfirm
  }

  passwordsMatch() {
    return this.password == this.passwordConfirm
  }

}
