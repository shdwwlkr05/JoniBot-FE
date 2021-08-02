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
import { DataStorageService } from '../bid-form/data-storage.service'
import { CalendarService } from './calendar.service'
import { HttpClient } from '@angular/common/http'
import { formatDate } from '@angular/common'

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
  events: CalendarEvent[] = this.getCalendarEvents(this.calService.getWorkdays());
  activeDayIsOpen: boolean = false;


  constructor(private bidService: BidService,
              private data: DataStorageService,
              private calService: CalendarService,
              private http: HttpClient) {
  }


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
    this.bidService.dateEmitter.next({date: event.start, location: 'start'});
    console.log('Start Event: ', event.start)
  }

  onEndClick(event: CalendarEvent): void {
    this.bidService.dateEmitter.next({date: event.start, location: 'end'});
    console.log('End Event: ', event.start)
  }


  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  getCalendarEvents(workdays) {
    // console.log('getCalendarEvents', workdays)
    const workdayList = []
    for (let workday of workdays) {
      workdayList.push({
        start: startOfDay(new Date(workday + 'T00:00:00')),
        title: formatDate(workday, 'MMM d', 'en-us'),
        color: colors.blue,
        actions: this.actions,
      })
    }
    console.log('getCalendarEvents', workdayList)
    return workdayList

  }


}
