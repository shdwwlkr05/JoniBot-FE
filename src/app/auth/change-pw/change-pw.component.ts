import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgForm} from "@angular/forms";
import { AuthService } from '../auth.service';
import {HttpErrorResponse} from "@angular/common/http";
import { Subscription } from 'rxjs';

export interface ResponseData {
  status: string;
  code: number;
  message: string;
  data: any;
}

@Component({
  selector: 'app-change-pw',
  templateUrl: './change-pw.component.html',
  styleUrls: ['./change-pw.component.css']
})
export class ChangePwComponent implements OnInit, OnDestroy {
  oldPW: string
  newPW: string
  confirmPW: string
  message: string
  status: string

  constructor(private auth: AuthService) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  onSubmit(changePwForm: NgForm) {
    this.message = ''
    this.status = ''
    const payload = {'old_password': this.oldPW, 'new_password': this.newPW}
    this.auth.changePassword(payload).subscribe((response:ResponseData) => {
      this.message = response.message
      this.status = response.status
      this.auth.logout(response.message)
    }, (err:HttpErrorResponse) => {
      this.message = err.error.message
      this.status = err.error.status
    })
    changePwForm.reset()
  }

  newPwMatchesConfirmPw() {
    return this.newPW == this.confirmPW
  }
}
