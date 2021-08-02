import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router'
import { DataStorageService } from '../bid-form/data-storage.service'
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class WorkdayResolverService implements Resolve<any>{

  constructor(private data: DataStorageService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    return this.data.fetchWorkdays()
  }
}
