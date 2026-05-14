import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PtdOfferComponent } from './pages/ptd-offer/ptd-offer.component';
import { PtdBidComponent } from './pages/ptd-bid/ptd-bid.component';
import { AuthGuard } from '../auth/auth.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'offer' },
  { path: 'offer', component: PtdOfferComponent, canActivate: [AuthGuard] },
  { path: 'bid', component: PtdBidComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PtdRoutingModule {}
