import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { PtdRoutingModule } from './ptd-routing.module';
import { PtdOfferComponent } from './pages/ptd-offer/ptd-offer.component';
import { PtdBidComponent } from './pages/ptd-bid/ptd-bid.component';
import { PtdOfferCalendarGridComponent } from './components/ptd-offer-calendar-grid/ptd-offer-calendar-grid.component';
import { PtdOfferMiniMonthComponent } from './components/ptd-offer-mini-month/ptd-offer-mini-month.component';
import { PtdShiftGridComponent } from './components/ptd-shift-grid/ptd-shift-grid.component';
import { PtdShiftMiniMonthComponent } from './components/ptd-shift-mini-month/ptd-shift-mini-month.component';
import { PtdOfferStoreService } from './services/ptd-offer-store.service';
import { PtdBidStoreService } from './services/ptd-bid-store.service';

@NgModule({
  declarations: [
    PtdOfferComponent,
    PtdBidComponent,
    PtdOfferCalendarGridComponent,
    PtdOfferMiniMonthComponent,
    PtdShiftGridComponent,
    PtdShiftMiniMonthComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    PtdRoutingModule
  ],
  providers: [
    PtdOfferStoreService,
    PtdBidStoreService
  ]
})
export class PtdModule {}
