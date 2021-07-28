import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router'
import { AuthComponent } from './auth/auth.component'
import { HomeComponent } from './home/home.component'
import { BidListComponent } from './bid-list/bid-list.component'
import { AuthGuard } from './auth/auth.guard'

const appRoutes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full'},
  { path: 'myBids', component: BidListComponent, canActivate: [AuthGuard]},
  { path: 'auth', component: AuthComponent },
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(appRoutes),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
