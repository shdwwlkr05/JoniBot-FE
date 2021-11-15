import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild, ViewEncapsulation, } from '@angular/core';
import { isSameDay, startOfDay, } from 'date-fns';
import { Subject } from 'rxjs';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarMonthViewDay,
  CalendarView,
  collapseAnimation
} from 'angular-calendar';
import { BidService } from '../bid-form/bid.service'
import { DataStorageService } from '../bid-form/data-storage.service'
import { CalendarService } from './calendar.service'
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
  green: {
    primary: '#2cb805',
    secondary: '#b0f39d',
  },
  orange: {
    primary: '#ce7e00',
    secondary: '#d2a768',
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
  events: CalendarEvent<{ incrementsBadgeTotal: boolean }>[] =
    this.getCalendarEvents(this.calService.getWorkdays());
  activeDayIsOpen: boolean = false;

  constructor(private bidService: BidService,
              private data: DataStorageService,
              private calService: CalendarService) {
  }

  beforeMonthViewRender({body}: { body: CalendarMonthViewDay[] }): void {
    body.forEach((day) => {
      day.badgeTotal = day.events.filter(
        (event) => event.meta.incrementsBadgeTotal
      ).length;
    });
  }

  dayClicked({date, events}: { date: Date; events: CalendarEvent[] }): void {

    this.activeDayIsOpen = !((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
      events.length === 0);
    this.viewDate = date;

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
  }

  onEndClick(event: CalendarEvent): void {
    this.bidService.dateEmitter.next({date: event.start, location: 'end'});
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  getCalendarEvents(workdays) {
    // console.log('getCalendarEvents', workdays)
    const eventList = []
    let formattedDate
    for (let workday_el of workdays) {
      const workday = workday_el.workday
      formattedDate = formatDate(workday, 'MMM d', 'en-us')
      eventList.push({
        start: startOfDay(new Date(workday + 'T00:00:00')),
        title: workday_el.shift,
        color: colors.blue,
        actions: [
          {
            label: `Start vacation on ${formattedDate}`,
            a11yLabel: 'Start',
            onClick: ({event}: { event: CalendarEvent }): void => {
              this.onStartClick(event);
            },
            cssClass: 'my-custom-action',
          },
          {
            label: `End vacation on ${formattedDate}`,
            a11yLabel: 'End',
            onClick: ({event}: { event: CalendarEvent }): void => {
              this.onEndClick(event);
            },
            cssClass: 'my-custom-action',
          },
        ],
        meta: {
          incrementBadgeTotal: false,
        }
      })
    }
    const max_off_per_day = 10
    const counts = {}
    const awarded = []
    const awarded_days = this.data.fetchAwards().toPromise()
    awarded_days.then(awards => {
      for (let award of awards) {
        awarded.push(award['bid_date'])
      }
      awarded.forEach(function (x) {
        counts[x] = (counts[x] || 0) + 1;
      })
      for (const [key, value] of Object.entries(counts)) {
        const percent_awarded = +value / max_off_per_day
        let set_color
        switch (true) {
          case (percent_awarded < .75):
            set_color = colors.green
            break
          case (percent_awarded < .85):
            set_color = colors.yellow
            break
          case (percent_awarded < 1):
            set_color = colors.orange
            break
          case (percent_awarded == 1):
            set_color = colors.red
            break
        }
        eventList.push({
          start: startOfDay(new Date(key + 'T00:00:00')),
          title: `${value} slot(s) awarded out of a possible ${max_off_per_day}`,
          color: set_color,
          meta: {
            incrementBadgeTotal: false,
          }
        })
      }
    })
    return eventList

  }


}
