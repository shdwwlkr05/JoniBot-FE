import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router'
import { AuthComponent } from './auth/auth.component'
import { HomeComponent } from './home/home.component'
import { BidListComponent } from './bid-list/bid-list.component'
import { AuthGuard } from './auth/auth.guard'
import { WorkdayResolverService } from './calendar/workday-resolver.service'
import { BidEditComponent } from './bid-list/bid-edit/bid-edit.component'
import { MyTimeComponent } from './my-time/my-time.component'
import { AwardListComponent } from './award-list/award-list.component'
import { MobileComponent } from './mobile/mobile.component'
import { OpenTimeComponent } from './open-time/open-time.component'
import { ChangePwComponent } from './auth/change-pw/change-pw.component';
import {AdminChangePwComponent} from "./auth/admin-change-pw/admin-change-pw.component";
import {ReliefBidComponent} from "./relief-bid/relief-bid.component";
import {AwardCountsResolverService} from "./calendar/award-count-resolver.service";
import {MyCalendarComponent} from "./my-calendar/my-calendar.component";
import {AllLinesViewComponent} from "./all-lines-view/all-lines-view.component";
import {LineBidComponent} from "./line-bid/line-bid.component";
import {LineAwardsComponent} from "./line-awards/line-awards.component";

const appRoutes: Routes = [
  {path: '', component: HomeComponent, pathMatch: 'full', canActivate: [AuthGuard],
    resolve: [WorkdayResolverService, AwardCountsResolverService]},
  {path: 'myBids', component: BidListComponent, canActivate: [AuthGuard]},
  {path: 'myBids/edit', component: BidEditComponent, canActivate: [AuthGuard]},
  {path: 'myTime', component: MyTimeComponent, canActivate: [AuthGuard]},
  {path: 'myAwards', component: AwardListComponent, canActivate: [AuthGuard]},
  // {path: 'mobile', component: MobileComponent, canActivate: [AuthGuard]},
  {path: 'openTime', component: OpenTimeComponent, canActivate: [AuthGuard]},
  {path: 'auth', component: AuthComponent},
  {path: 'changePW', component: ChangePwComponent, canActivate: [AuthGuard]},
  {path: 'adminChangePW', component: AdminChangePwComponent, canActivate: [AuthGuard]},
  {path: 'lines', component: AllLinesViewComponent, canActivate: [AuthGuard]},
  {path: 'lineBid', component: LineBidComponent, canActivate: [AuthGuard]},
  {path: 'lineAwards', component: LineAwardsComponent, canActivate: [AuthGuard]},
  {path: 'relief', component: ReliefBidComponent, canActivate: [AuthGuard],
    resolve: [WorkdayResolverService]},
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(appRoutes),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
