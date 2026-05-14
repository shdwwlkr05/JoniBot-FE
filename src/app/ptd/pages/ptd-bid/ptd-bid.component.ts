import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { PtdBidStoreService } from '../../services/ptd-bid-store.service';
import { PtdShiftVm, PtdViewMode } from '../../models/ptd.models';

@Component({
  selector: 'app-ptd-bid',
  templateUrl: './ptd-bid.component.html',
  styleUrls: ['./ptd-bid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PtdBidComponent implements OnInit {
  readonly viewMode$ = this.store.viewMode$;
  readonly month$ = this.store.monthShiftCalendar$;
  readonly year$ = this.store.yearShiftCalendar$;
  readonly picks$ = this.store.picks$;
  readonly selectedShiftIds$ = this.store.selectedShiftIds$;
  readonly workgroup$ = this.store.workgroup$;
  readonly isIntlQualified$ = this.store.isIntlQualified$;
  readonly isSptQualified$ = this.store.isSptQualified$;
  readonly workdaysMap$ = this.store.workdaysMap$;
  readonly offeredDates$ = this.store.offeredDates$;
  readonly response$ = this.store.response$;

  readonly emptyIds = new Set<number>();
  readonly emptyMap = new Map<string, string>();
  readonly emptyDates = new Set<string>();

  // Local filter state (mirrors ot-bidder)
  showLegend = false;
  showFilters = false;
  hideWorkdays = false;
  filterAm = false;
  filterPm = false;
  filterMid = false;
  filterDom = false;
  filterIntl = false;
  filterFleet = false;
  filterSpt = false;
  filterNine = false;
  filterTen = false;

  constructor(readonly store: PtdBidStoreService) {}

  ngOnInit(): void {
    this.store.init();
  }

  onShiftClicked(shift: PtdShiftVm): void {
    this.store.addPick(shift);
  }

  onDrop(event: CdkDragDrop<any>): void {
    this.store.movePick(event.previousIndex, event.currentIndex);
  }

  removePick(index: number): void {
    this.store.removePick(index);
  }

  save(): void {
    this.store.saveBid();
  }

  revert(): void {
    this.store.revertBid();
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
