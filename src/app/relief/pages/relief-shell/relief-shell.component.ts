import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReliefStoreService } from '../../services/relief-store.service';

@Component({
  selector: 'app-relief-shell',
  templateUrl: './relief-shell.component.html',
  styleUrls: ['./relief-shell.component.css']
})
export class ReliefShellComponent implements OnInit, OnDestroy {
  title = 'Relief Bid';
  closeDate: string | null = null;
  private paramsSub: Subscription;

  constructor(private store: ReliefStoreService) {}

  ngOnInit(): void {
    this.paramsSub = this.store.params$.subscribe(params => {
      const startDate = params?.[0]?.start_date;
      if (startDate) {
        const month = new Date(startDate + 'T00:00:00').toLocaleString('en-US', { month: 'long' });
        this.title = `${month} Relief Bid`;
      }
      const closeDate = params?.[0]?.close_date;
      if (closeDate) {
        this.closeDate = new Date(closeDate + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.paramsSub?.unsubscribe();
  }
}
