import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from "@angular/router";

export interface IDeactivateComponent {
  canExit: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CanDeactivateGuardService implements CanDeactivate<IDeactivateComponent> {
  canDeactivate(component: IDeactivateComponent, currentRoute: ActivatedRouteSnapshot,
                currentState: RouterStateSnapshot, nextState: RouterStateSnapshot) {
    return component.canExit();
  }
}
