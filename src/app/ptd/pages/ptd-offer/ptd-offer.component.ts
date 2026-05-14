import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { PtdOfferStoreService } from '../../services/ptd-offer-store.service';
import { PtdViewMode } from '../../models/ptd.models';

@Component({
  selector: 'app-ptd-offer',
  templateUrl: './ptd-offer.component.html',
  styleUrls: ['./ptd-offer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PtdOfferComponent implements OnInit {
  readonly viewMode$ = this.store.viewMode$;
  readonly month$ = this.store.monthCalendar$;
  readonly year$ = this.store.yearCalendar$;
  readonly selectedShifts$ = this.store.selectedShifts$;
  readonly ptdLimit$ = this.store.ptdLimit$;
  readonly response$ = this.store.response$;
  readonly canSubmit$ = this.store.canSubmit$;

  constructor(readonly store: PtdOfferStoreService) {}

  ngOnInit(): void {
    this.store.init();
  }

  onDayClicked(iso: string): void {
    this.store.toggleDay(iso);
  }

  onRemove(iso: string): void {
    this.store.removeShift(iso);
  }

  onClear(): void {
    this.store.clearAll();
  }

  onSave(): void {
    this.store.submitOffer();
  }

  onRevert(): void {
    this.store.revert();
  }

  onPrev(): void {
    this.store.navigateMonth(-1);
  }

  onNext(): void {
    this.store.navigateMonth(1);
  }

  onViewToggle(mode: PtdViewMode): void {
    this.store.setViewMode(mode);
  }

  onZoomToMonth(event: { year: number; month: number }): void {
    this.store.jumpToMonth(event.year, event.month);
  }
}
