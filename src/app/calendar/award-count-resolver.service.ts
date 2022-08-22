import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router'
import { DataStorageService } from '../bid-form/data-storage.service'
import { Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class AwardCountsResolverService implements Resolve<any>{
  workgroup
  constructor(private data: DataStorageService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    this.data.userWorkgroup.subscribe(workgroup => {
      console.log('ac resolver:', workgroup)
      this.workgroup = workgroup
    })
    return this.data.fetchAwardCounts(this.workgroup)
  }
}
