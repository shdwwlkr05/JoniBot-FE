import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VacBidV2RoutingModule } from './vac-bid-v2-routing.module';
import { VacBidderComponent } from './pages/vac-bidder/vac-bidder.component';
import { VacCalendarGridComponent } from './components/vac-calendar-grid/vac-calendar-grid.component';
import { VacMiniMonthComponent } from './components/vac-mini-month/vac-mini-month.component';

@NgModule({
  declarations: [
    VacBidderComponent,
    VacCalendarGridComponent,
    VacMiniMonthComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    VacBidV2RoutingModule
  ]
})
export class VacBidV2Module {}
