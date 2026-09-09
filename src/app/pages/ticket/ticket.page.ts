import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { BackNavigationService } from '../../services/back-navigation.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.page.html',
  styleUrls: ['./ticket.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, CommonModule, BottomNavComponent]
})
export class TicketPage implements OnInit, OnDestroy {
  activeTickets: any[] = [];
  allTickets: any[] = [];
  formattedActiveTickets: any[] = [];
  private intervalId: any;

  mockPastTickets = [
    {
      source: 'NAVALUR',
      destination: 'PERUNGUDI I G P',
      amount: 25,
      dateStr: '2 Sept 2026 • 9:42 am',
      isExpired: true,
      bus: '102P',
      type: 'Ordinary'
    },
    {
      source: 'SHOLINGANALLUR KUMARAN NAGAR',
      destination: 'NAVALUR',
      amount: 13,
      dateStr: '23 Aug 2026 • 4:59 pm',
      isExpired: true,
      bus: '102P',
      type: 'Ordinary'
    },
    {
      source: 'NAVALUR',
      destination: 'THIRUVANMIYUR',
      amount: 13,
      dateStr: '21 Aug 2026 • 9:33 am',
      isExpired: true,
      bus: '102P',
      type: 'Ordinary'
    },
    {
      source: 'P U OFFICE SHOLINGANALLUR',
      destination: 'VANDALUR ZOO',
      amount: 31,
      dateStr: '16 Aug 2026 • 11:14 am',
      isExpired: true,
      bus: '102P',
      type: 'Ordinary'
    }
  ];

  constructor(
    private router: Router,
    private backNavService: BackNavigationService
  ) {}

  ngOnInit() {
    this.registerBackHandler();
    this.loadActiveTickets();
    this.startCountdownTimer();
  }

  ionViewWillEnter() {
    this.registerBackHandler();
    this.loadActiveTickets();
  }

  ionViewWillLeave() {
    this.backNavService.unregisterHandler('ticket-page');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy() {
    this.backNavService.unregisterHandler('ticket-page');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private registerBackHandler() {
    this.backNavService.registerHandler('ticket-page', () => {
      this.router.navigate(['/home'], { replaceUrl: true });
      return true;
    }, 10);
  }

  loadActiveTickets() {
    try {
      const stored = localStorage.getItem('active_tickets');
      if (stored) {
        this.activeTickets = JSON.parse(stored);
      } else {
        this.activeTickets = [];
      }
    } catch (e) {
      this.activeTickets = [];
    }

    const now = Date.now();
    const list = this.activeTickets || [];

    // 1. Format Active Tickets (not expired)
    const validRealTickets = list.filter((t: any) => t.expiryTime > now);
    this.formattedActiveTickets = validRealTickets.map((t: any) => {
      const diff = Math.max(0, t.expiryTime - now);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const countdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      const dateStr = this.formatTicketDateStr(t);

      return {
        id: t.id,
        source: t.source ? t.source.toUpperCase() : 'CHENNAI ONE IT SEZ',
        destination: t.destination ? t.destination.toUpperCase() : 'NAVALUR',
        amount: t.amount || 23,
        dateStr: dateStr,
        isExpired: false,
        bus: t.bus,
        type: t.type,
        persons: t.persons,
        ticketCode: t.ticketCode,
        vehicle: t.vehicle,
        ticketNo: t.ticketNo,
        expiryTime: t.expiryTime,
        date: t.date,
        arrivalTime: t.arrivalTime,
        validityTime: t.validityTime,
        time24: t.time24,
        countdownStr: countdown
      };
    });

    // 2. Format Expired (Past) Tickets
    const expiredRealTickets = list.filter((t: any) => t.expiryTime <= now);
    const formattedExpired = expiredRealTickets.map((t: any) => {
      const dateStr = this.formatTicketDateStr(t);

      return {
        id: t.id,
        source: t.source ? t.source.toUpperCase() : 'CHENNAI ONE IT SEZ',
        destination: t.destination ? t.destination.toUpperCase() : 'NAVALUR',
        amount: t.amount || 23,
        dateStr: dateStr,
        isExpired: true,
        bus: t.bus,
        type: t.type,
        persons: t.persons,
        ticketCode: t.ticketCode,
        vehicle: t.vehicle,
        ticketNo: t.ticketNo,
        expiryTime: t.expiryTime,
        date: t.date,
        arrivalTime: t.arrivalTime,
        validityTime: t.validityTime,
        time24: t.time24,
        countdownStr: t.countdownStr
      };
    });

    if (formattedExpired.length > 0) {
      this.allTickets = formattedExpired;
    } else {
      this.allTickets = this.mockPastTickets;
    }
  }

  formatTicketDateStr(ticket: any): string {
    if (ticket.dateStr) return ticket.dateStr;
    const d = ticket.date ? new Date(ticket.date) : new Date();
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const time = ticket.arrivalTime || '9:42 am';
    return `${day} ${month} ${year} • ${time}`;
  }

  startCountdownTimer() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.loadActiveTickets();
    }, 1000);
  }

  viewTicketDetails(ticket: any) {
    if (!ticket || ticket.isExpired || (ticket.expiryTime && Number(ticket.expiryTime) <= Date.now())) {
      return;
    }
    this.router.navigate(['/ticket-generation'], {
      state: {
        id: ticket.id || 'mock_' + (ticket.amount || 25),
        bus: ticket.bus || '102P',
        type: ticket.type || 'Ordinary',
        vehicle: ticket.vehicle || 'TN01N9999',
        amount: ticket.amount,
        persons: ticket.persons || 1,
        ticket: ticket.ticketCode || 'TCKT' + ticket.amount,
        source: ticket.source,
        destination: ticket.destination,
        date: ticket.date || '02/09/2026',
        arrivalTime: ticket.arrivalTime || '09:42 am',
        validityTime: ticket.validityTime || '11:42 am',
        expiryTime: ticket.expiryTime || Date.now() - 3600000,
        ticketNo: ticket.ticketNo || 'T987654321',
        time24: ticket.time24 || '09:42',
        referrerTab: 'ticket',
        referrer: '/ticket'
      }
    });
  }
}
