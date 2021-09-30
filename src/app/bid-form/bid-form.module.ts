import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BidFormComponent } from './bid-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component'


@NgModule({
  declarations: [
    BidFormComponent,
    LoadingSpinnerComponent,
  ],
  exports: [
    BidFormComponent,
    LoadingSpinnerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class BidFormModule {
}
