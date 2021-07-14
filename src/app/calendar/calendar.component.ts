import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild, ViewEncapsulation, } from '@angular/core';
import { isSameDay, isSameMonth, startOfDay, } from 'date-fns';
import { Subject } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
  collapseAnimation
} from 'angular-calendar';
import { BidService } from '../bid-form/bid.service'

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF',
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA',
  },
};

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [collapseAnimation]
})
export class CalendarComponent {
  @ViewChild('modalContent', {static: true}) modalContent: TemplateRef<any>;

  view: CalendarView = CalendarView.Month;

  CalendarView = CalendarView;

  viewDate: Date = new Date();

  constructor(private bidService: BidService) {}

  refresh: Subject<any> = new Subject();
  actions: CalendarEventAction[] = [
    {
      label: 'Start Vacation Here',
      a11yLabel: 'Start',
      onClick: ({event}: { event: CalendarEvent }): void => {
        this.onStartClick(event);
      },
      cssClass: 'my-custom-action',
    },
    {
      label: 'End Vacation Here',
      a11yLabel: 'End',
      onClick: ({event}: { event: CalendarEvent }): void => {
        this.onEndClick(event);
      },
      cssClass: 'my-custom-action',
    },
  ];
  events: CalendarEvent[] = [
    {
      start: startOfDay(new Date('6/21/21')),
      title: 'Jun 21',
      color: colors.blue,
      actions: this.actions,
    },
    {
      start: startOfDay(new Date('6/22/21')),
      title: 'Jun 22',
      color: colors.blue,
      actions: this.actions,
    },
    {
      start: startOfDay(new Date('6/23/21')),
      title: 'Jun 23',
      color: colors.blue,
      actions: this.actions,
    },
    {
      start: startOfDay(new Date('6/24/21')),
      title: 'Jun 24',
      color: colors.blue,
      actions: this.actions,
    }
  ];
  activeDayIsOpen: boolean = false;

  dayClicked({date, events}: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      this.activeDayIsOpen = !((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0);
      this.viewDate = date;
    }
    // console.log(date);
  }

  eventTimesChanged({
                      event,
                      newStart,
                      newEnd,
                    }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });
  }


  onStartClick(event: CalendarEvent): void {
    this.bidService.dateEmitter.next({date:event.start, location:'start'});
    console.log('Start Event: ', event.start)
  }

  onEndClick(event: CalendarEvent): void {
    this.bidService.dateEmitter.next({date:event.start, location:'end'});
    console.log('End Event: ', event.start)
  }


  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }
}
