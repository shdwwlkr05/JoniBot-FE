import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  ReliefStoreService,
  BidPick,
  ShiftVm
} from '../../services/relief-store.service';

@Component({
  selector: 'app-bidder',
  templateUrl: './bidder.component.html',
  styleUrls: ['./bidder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BidderComponent {
  readonly weeks$ = this.store.shiftCalendar$;
  readonly picks$ = this.store.picks$;
  readonly picksGrouped$ = this.store.picksGrouped$;
  readonly canSubmit$ = this.store.canSubmit$;
  readonly bidOrder$ = this.store.bidOrder$;
  readonly workgroup$ = this.store.workgroup$;
  readonly isIntlQualified$ = this.store.isIntlQualified$;
  readonly selectedShiftKeys$: Observable<Set<string>> = this.picks$.pipe(
    map(picks => new Set(picks.map(p => `${p.day}-${p.shift}`)))
  );
  readonly rlfDays$ = this.store.rlfWorkDays$;
  readonly note$ = this.store.note$;

  readonly emptySet = new Set<string>();
  readonly emptyNumSet = new Set<number>();
  showLegend = false;
  showBidOrder = false;
  showFilters = false;
  workdaysOnly = false;
  filterAm = false;
  filterPm = false;
  filterMid = false;
  filterDom = false;
  filterIntl = false;
  filterFleet = false;
  filterSpt = false;

  constructor(private readonly store: ReliefStoreService) {
    this.store.preloadAll().subscribe();
  }

  onShiftClicked(shiftVm: ShiftVm): void {
    this.store.addPick(shiftVm);
  }

  dropInDay(day: string, event: CdkDragDrop<BidPick[]>): void {
    this.store.movePickInDay(day, event.previousIndex, event.currentIndex);
  }

  removePickByShiftId(shiftId: number): void {
    this.store.removePickByShiftId(shiftId);
  }

  clearDay(day: string, label: string): void {
    if (confirm(`Clear all picks for ${label}?`)) {
      this.store.clearDay(day);
    }
  }

  onNoteChange(value: string): void {
    this.store.setNote(value);
  }

  submit(): void {
    this.store.submitBid().subscribe({
      next: () => alert('Relief bid submitted successfully'),
      error: err => alert(err?.message ?? 'Failed to submit relief bid')
    });
  }
}
