import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'
import { catchError, tap } from 'rxjs/operators'

import { User } from './user.model';
import { BehaviorSubject, throwError } from 'rxjs'
import { Router } from '@angular/router'

export interface AuthResponseData {
  token: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = new BehaviorSubject<User>(null);

  constructor(private http: HttpClient, private router: Router) { }

  login(username:string, password:string) {
    return this.http
      .post<AuthResponseData>(
        'http://127.0.0.1:8000/api/user/token/',
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
    }
  }

  logout() {
    this.user.next(null);
    this.router.navigate(['/auth'])
    localStorage.removeItem('userData')
  }

  private handleAuthentication(
    username:string,
    token:string,
  ) {
    const user = new User(username, token);
    this.user.next(user);
    localStorage.setItem('userData', JSON.stringify(user));
  }

  private handleError(errorRes: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (!errorRes.error || !errorRes.error.error) {
      return throwError(errorMessage);
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already';
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email does not exist.';
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'This password is not correct.';
        break;
    }
    return throwError(errorMessage);
  }
}
