import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VacBidderComponent } from './pages/vac-bidder/vac-bidder.component';

const routes: Routes = [
  { path: '', component: VacBidderComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VacBidV2RoutingModule {}
