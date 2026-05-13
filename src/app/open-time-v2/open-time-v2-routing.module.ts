import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OtBidderComponent } from './pages/ot-bidder/ot-bidder.component';

const routes: Routes = [
  { path: '', component: OtBidderComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OpenTimeV2RoutingModule {}
