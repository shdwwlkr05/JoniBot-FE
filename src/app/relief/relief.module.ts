import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ReliefRoutingModule } from './relief-routing.module';
import { ReliefComponent } from './relief.component';
import { ReliefShellComponent } from './pages/relief-shell/relief-shell.component';
import { SchedulerComponent } from './pages/scheduler/scheduler.component';
import { BidderComponent } from './pages/bidder/bidder.component';
import { ShiftGridComponent } from './components/shift-grid/shift-grid.component';
import { BidListComponent } from './components/bid-list/bid-list.component';

@NgModule({
  declarations: [
    ReliefComponent,
    ReliefShellComponent,
    SchedulerComponent,
    BidderComponent,
    ShiftGridComponent,
    BidListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ReliefRoutingModule
  ]
})
export class ReliefModule { }
