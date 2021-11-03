import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { catchError, tap } from 'rxjs/operators'

import { User } from './user.model';
import { BehaviorSubject, throwError } from 'rxjs'
import { Router } from '@angular/router'
import { DataStorageService } from '../bid-form/data-storage.service'
import { environment } from '../../environments/environment'
import { BidService } from '../bid-form/bid.service'

export interface AuthResponseData {
  token: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = new BehaviorSubject<User>(null);

  constructor(private http: HttpClient,
              private router: Router,
              private data: DataStorageService) {
  }

  login(username: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        environment.baseURL + 'api/user/token/',
        {
          username: username,
          password: password,
        }
      )
      .pipe(
        catchError(this.handleError),
        tap(resData => {
          this.handleAuthentication(
            resData.username,
            resData.token,
          );
        })
      );
  }

  autoLogin() {
    const userData: {
      username: string
      token: string
    } = JSON.parse(localStorage.getItem('userData'))
    if (!userData) {
      return
    }

    const loadedUser = new User(
      userData.username,
      userData.token
    )

    if (loadedUser.token) {
      this.user.next(loadedUser)
      this.data.fetchBids().subscribe()
      this.data.fetchRound7().subscribe()
      this.data.fetchBalances()
    }
  }

  logout() {
    this.user.next(null);
    this.router.navigate(['/auth'])
    localStorage.removeItem('userData')
  }

  private handleAuthentication(
    username: string,
    token: string,
  ) {
    const user = new User(username, token);
    this.user.next(user);
    localStorage.setItem('userData', JSON.stringify(user));
    this.data.fetchBids().subscribe()
    this.data.fetchBalances()
    this.router.navigate([''])
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (!errorRes.error) {
      return throwError(errorMessage);
    }
    switch (errorRes.error.non_field_errors[0]) {
      case 'Unable to log in with provided credentials.':
        errorMessage = 'Unable to log in with provided credentials.';
        break;
    }
    return throwError(errorMessage);
  }

}
