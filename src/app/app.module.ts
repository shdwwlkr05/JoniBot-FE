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
import { BidEditComponent } from './bid-list/bid-edit/bid-edit.component'

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    AuthComponent,
    HomeComponent,
    BidListComponent,
    BidItemComponent,
    BidEditComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppCalendarModule,
    BidFormModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [{provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true}],
  bootstrap: [AppComponent]
})
export class AppModule {
}
