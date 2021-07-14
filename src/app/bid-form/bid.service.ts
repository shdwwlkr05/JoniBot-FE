import { Injectable } from '@angular/core';
import { Subject } from 'rxjs'

interface dateInfo {
  date: Date;
  location: string;
}

@Injectable({
  providedIn: 'root'
})
export class BidService {
  dateEmitter = new Subject<dateInfo>();
}
