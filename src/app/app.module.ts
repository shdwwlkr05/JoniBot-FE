import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { AppComponent } from './app.component';
import { AppCalendarModule } from './calendar/calendar.module';
import { HeaderComponent } from './header/header.component';
import { BidFormModule } from './bid-form/bid-form.module'
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthComponent } from './auth/auth.component'
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BidListComponent } from './bid-list/bid-list.component';
import { BidItemComponent } from './bid-list/bid-item/bid-item.component'
import { AuthInterceptorService } from './auth/auth-interceptor.service';
import { BidEditComponent } from './bid-list/bid-edit/bid-edit.component';
import { IncrementalItemComponent } from './bid-list/incremental-item/incremental-item.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MyTimeComponent } from './my-time/my-time.component';
import { AwardListComponent } from './award-list/award-list.component';
import { OrderByPipe } from './bid-list/order-by.pipe';
import { MobileComponent } from './mobile/mobile.component';
import { OpenTimeComponent } from './open-time/open-time.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ChangePwComponent } from './auth/change-pw/change-pw.component';
import { AdminChangePwComponent } from './auth/admin-change-pw/admin-change-pw.component';
import { ReliefBidComponent } from './relief-bid/relief-bid.component';
import { MyCalendarComponent } from './my-calendar/my-calendar.component';
import { AllLinesViewComponent } from './all-lines-view/all-lines-view.component';
import { LineBidComponent } from './line-bid/line-bid.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    AuthComponent,
    HomeComponent,
    BidListComponent,
    BidItemComponent,
    BidEditComponent,
    IncrementalItemComponent,
    MyTimeComponent,
    AwardListComponent,
    OrderByPipe,
    MobileComponent,
    OpenTimeComponent,
    ChangePwComponent,
    AdminChangePwComponent,
    ReliefBidComponent,
    MyCalendarComponent,
    AllLinesViewComponent,
    LineBidComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppCalendarModule,
    BidFormModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    DragDropModule
  ],
  providers: [{provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true}],
  exports: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
