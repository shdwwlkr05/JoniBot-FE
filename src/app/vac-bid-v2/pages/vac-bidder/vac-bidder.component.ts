import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { VacBidStoreService } from '../../services/vac-bid-store.service';
import { VacType, AwardOpt } from '../../models/vac-bid-v2.models';

@Component({
  selector: 'app-vac-bidder',
  templateUrl: './vac-bidder.component.html',
  styleUrls: ['./vac-bidder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VacBidderComponent implements OnInit {
  readonly viewMode$  = this.store.viewMode$;
  readonly draft$     = this.store.draft$;
  readonly month$     = this.store.monthCalendar$;
  readonly year$      = this.store.yearCalendar$;
  readonly balances$  = this.store.balances$;
  readonly response$  = this.store.response$;
  readonly isTester$  = this.store.isTester$;
  readonly canSubmit$ = this.store.canSubmit$;

  rounds = [1, 2, 3, 4, 5, 6, 7];

  constructor(readonly store: VacBidStoreService) {}

  ngOnInit(): void {
    this.store.init();
    this.isTester$.subscribe(t => {
      this.rounds = t ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7];
    });
  }

  onDayClicked(iso: string): void {
    this.store.selectDate(iso);
  }

  onRoundChange(val: string): void {
    this.store.setRound(Number(val));
  }

  onVacTypeChange(val: string): void {
    this.store.setVacType(val as VacType);
  }

  onAwardOptChange(val: string): void {
    this.store.setAwardOpt(val as AwardOpt);
  }

  onUseHolChange(val: boolean): void {
    this.store.setUseHol(val);
  }

  onClear(): void {
    this.store.clearSelection();
  }

  onSubmit(): void {
    this.store.submitBid();
  }

  onPrev(): void {
    this.store.navigateMonth(-1);
  }

  onNext(): void {
    this.store.navigateMonth(1);
  }

  onViewToggle(mode: 'month' | 'year'): void {
    this.store.setViewMode(mode);
  }

  onZoomToMonth(event: { year: number; month: number }): void {
    this.store.jumpToMonth(event.year, event.month);
  }
}
