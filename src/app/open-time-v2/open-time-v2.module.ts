import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { OpenTimeV2RoutingModule } from './open-time-v2-routing.module';
import { OtBidderComponent } from './pages/ot-bidder/ot-bidder.component';
import { OtShiftGridComponent } from './components/ot-shift-grid/ot-shift-grid.component';

@NgModule({
  declarations: [
    OtBidderComponent,
    OtShiftGridComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    OpenTimeV2RoutingModule
  ]
})
export class OpenTimeV2Module {}
