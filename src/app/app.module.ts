import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { AppComponent } from './app.component';
import { AppCalendarModule } from './calendar/calendar.module';
import { HeaderComponent } from './header/header.component';
import { BidFormModule } from './bid-form/bid-form.module'
import { HttpClientModule } from '@angular/common/http';
import { AuthComponent } from './auth/auth.component'
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component'
import { FormsModule } from '@angular/forms'

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    AuthComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppCalendarModule,
    BidFormModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
