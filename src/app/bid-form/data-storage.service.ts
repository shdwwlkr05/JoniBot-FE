import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'

import { Bid } from './bid.model'

const baseUrl = 'http://127.0.0.1:8000/api/bid/bids'

@Injectable({
  providedIn: 'root'
})
export class DataStorageService {

  constructor(private http: HttpClient) { }

  fetchBids() {
    return this.http.get<Bid[]>(baseUrl);
  }
}
