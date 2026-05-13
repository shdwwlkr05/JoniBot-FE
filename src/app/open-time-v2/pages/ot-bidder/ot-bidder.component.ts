import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { OpenTimeStoreService, ShiftVm, WorkdayInfo } from '../../services/open-time-store.service';

@Component({
  selector: 'app-ot-bidder',
  templateUrl: './ot-bidder.component.html',
  styleUrls: ['./ot-bidder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtBidderComponent implements OnInit {
  readonly weeks$ = this.store.shiftCalendar$;
  readonly picks$ = this.store.picks$;
  readonly canSubmit$ = this.store.canSubmit$;
  readonly workgroup$ = this.store.workgroup$;
  readonly isIntlQualified$ = this.store.isIntlQualified$;
  readonly isSptQualified$ = this.store.isSptQualified$;
  readonly selectedShiftKeys$ = this.store.selectedShiftKeys$;
  readonly workdays$ = this.store.workdays$;
  readonly params$ = this.store.params$;
  readonly response$ = this.store.response$;
  readonly openTimeRank$ = this.store.openTimeRank$;
  readonly workgroupCount$ = this.store.workgroupCount$;

  readonly emptySet = new Set<string>();
  readonly emptyWorkdays = new Map<number, WorkdayInfo>();

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

  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(readonly store: OpenTimeStoreService) {}

  ngOnInit(): void {
    this.store.init();
  }

  onShiftClicked(shiftVm: ShiftVm): void {
    this.store.addPick(shiftVm);
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

  onLimitChange(): void {
    this.store.markUnsaved();
  }

  formatMonth(startDate: string): string {
    if (!startDate) return '';
    const d = new Date(startDate + 'T06:00:00.000');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatCloseDate(closeDate: string): string {
    if (!closeDate) return '';
    const d = new Date(closeDate + 'T06:00:00.000');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

}
