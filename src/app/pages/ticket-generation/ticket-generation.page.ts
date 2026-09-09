import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import confetti from 'canvas-confetti';
import { BusTicketPage } from '../bus-ticket/bus-ticket.page';
import { QRCodeComponent } from 'angularx-qrcode';
import { BackNavigationService } from '../../services/back-navigation.service';
import { SecureScreenService } from '../../services/secure-screen.service';

@Component({
  selector: 'app-ticket-generation',
  templateUrl: './ticket-generation.page.html',
  styleUrls: ['./ticket-generation.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, BusTicketPage, QRCodeComponent]
})
export class TicketGenerationPage implements OnInit, OnDestroy {

  rawQrData = '';

  today = '';

  bus = '';

  type = 'Delux';

  vehicle = 'Normal';

  busImage = 'assets/bus_blue.png';

  amount = 0;

  persons = 1;

  ticket = '';

  source = '';

  destination = '';

  ticketId = '';

  get displayTicketId(): string {
    return this.ticketId ? this.ticketId.slice(0, 5) : '';
  }

  arrivalTime = '';

  validityTime = '';

  time = '03:00:00';

  seconds = 10800;

  expiryTime = 0;

  referrer = '/home';

  showBusTicket = false;

  ticketNo = '';

  time24 = '';

  // Active Nav Lottie 3s pause and recolor state
  isNavLottiePaused = false;
  private navLottieTimer: any;

  constructor(
    private router: Router,
    private backNavService: BackNavigationService,
    private cdr: ChangeDetectorRef,
    private secureScreenService: SecureScreenService
  ) {

    const state = history.state || {};

    console.log('State:', state);

    // Guard: Do not open expired tickets on ticket generation page
    if (state.isExpired || (state.expiryTime && Number(state.expiryTime) <= Date.now())) {
      console.warn('Expired tickets cannot be opened on ticket generation page.');
      this.router.navigate(['/ticket'], { replaceUrl: true });
      return;
    }

    this.rawQrData = state.rawQrData || '';
    this.referrer = state.referrer || '/home';

    const rawBus = String(state.bus || state.routeNo || 'Ordinary').trim();
    this.bus = rawBus.split(' ')[0];

    this.type =
      state.type || 'Delux';

    this.vehicle =
      state.vehicle || 'Normal';

    /* CHANGE BUS IMAGE */

    const typeLower = (this.type || '').toLowerCase();
    if (typeLower.includes('express') || typeLower.includes('delux') || typeLower.includes('deluxe') || typeLower.includes('lf')) {
      this.busImage = 'assets/images/mt_ic_deluxe_service.webp'; // Deluxe & Express Bus
    } else if (typeLower.includes('ac')) {
      this.busImage = 'assets/images/mt_ic_ac_service.webp';     // AC Bus
    } else if (typeLower.includes('ordinary') || typeLower.includes('pink')) {
      this.busImage = 'assets/images/mt_ic_pink_bus.png';        // Ordinary Pink Bus
    } else {
      this.busImage = 'assets/images/mt_ic_deluxe_service.webp'; // Deluxe Bus default
    }

    this.amount =
      state.price || state.amount || 13;

    this.persons =
      state.persons || 1;

    this.ticket =
      state.ticket || state.ticketCode || '';

    this.source =
      state.source || 'Navalur';

    this.destination =
      state.destination || 'Siruseri I.T.Park';

    this.ticketId =
      state.id || String(
        Math.floor(
          10000 + Math.random() * 90000
        )
      );

    this.today =
      state.date || new Date().toLocaleDateString(
        'en-IN'
      );

    const now = new Date();

    this.arrivalTime =
      state.arrivalTime || now.toLocaleTimeString(
        'en-IN',
        {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }
      );

    const validity =
      new Date(
        now.getTime() + 10800000
      );

    this.validityTime =
      state.validityTime || validity.toLocaleTimeString(
        'en-IN',
        {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }
      );

    this.expiryTime = state.expiryTime || (now.getTime() + 10800000);
    this.seconds = Math.max(0, Math.floor((this.expiryTime - now.getTime()) / 1000));

    this.ticketNo = state.ticketNo || String(
      Math.floor(
        1000000000 + Math.random() * 9000000000
      )
    );

    this.time24 = state.time24 || now.toLocaleTimeString(
      'en-GB',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    );

    if (state.oldId) {
      this.updateTicketInLocalDb(state.oldId);
    } else if (!state.id) {
      this.saveTicketToLocalDb();
    }
  }

  ngOnInit() {
    if (this.expiryTime > 0 && this.expiryTime <= Date.now()) {
      this.router.navigate(['/ticket'], { replaceUrl: true });
      return;
    }
    this.registerBackHandler();
    this.startNavLottieTimer();
    this.startTimer();
    this.secureScreenService.enableSecure();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('focus', this.onVisibilityChange);
  }

  ionViewWillEnter() {
    if (this.expiryTime > 0 && this.expiryTime <= Date.now()) {
      this.router.navigate(['/ticket'], { replaceUrl: true });
      return;
    }
    this.registerBackHandler();
    this.startNavLottieTimer();
    this.updateTimer();
    this.secureScreenService.enableSecure();
  }

  ionViewWillLeave() {
    this.backNavService.unregisterHandler('ticket-generation-page');
    this.secureScreenService.disableSecure();
    if (this.navLottieTimer) {
      clearTimeout(this.navLottieTimer);
      this.navLottieTimer = null;
    }
  }

  ngOnDestroy() {
    this.backNavService.unregisterHandler('ticket-generation-page');
    this.secureScreenService.disableSecure();
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.ticketPressTimer) clearTimeout(this.ticketPressTimer);
    if (this.navLottieTimer) clearTimeout(this.navLottieTimer);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('focus', this.onVisibilityChange);
  }

  startNavLottieTimer() {
    if (this.navLottieTimer) {
      clearTimeout(this.navLottieTimer);
      this.navLottieTimer = null;
    }
    this.isNavLottiePaused = false;
    this.cdr.detectChanges();

    // After 2 seconds, pause the active ticket Lottie animation (keeps staying red)
    this.navLottieTimer = setTimeout(() => {
      this.isNavLottiePaused = true;
      this.cdr.detectChanges();

      const player: any = document.querySelector('.active-nav-lottie-player');
      if (player && typeof player.pause === 'function') {
        try {
          player.pause();
        } catch (e) { }
      }
    }, 2000);
  }

  onTicketNavClick(event?: Event) {
    if (!this.isNavLottiePaused) {
      this.pauseNavLottieImmediately(event);
    } else {
      this.navTab('ticket');
    }
  }

  pauseNavLottieImmediately(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.navLottieTimer) {
      clearTimeout(this.navLottieTimer);
      this.navLottieTimer = null;
    }
    this.isNavLottiePaused = true;
    this.cdr.detectChanges();

    const player: any = document.querySelector('.active-nav-lottie-player');
    if (player && typeof player.pause === 'function') {
      try {
        player.pause();
      } catch (e) { }
    }
  }

  private registerBackHandler() {
    this.backNavService.registerHandler('ticket-generation-page', () => {
      if (this.showBusTicket) {
        this.showBusTicket = false;
        return true;
      }
      this.goBackFromPage();
      return true;
    }, 20);
  }

  private timerInterval: any;
  private ticketPressTimer: any;

  private onVisibilityChange = () => {
    this.updateTimer();
  };

  onTicketPressStart(event: Event) {
    if (this.ticketPressTimer) clearTimeout(this.ticketPressTimer);
    
    this.ticketPressTimer = setTimeout(() => {
      this.router.navigate(['/bus-otp'], {
        state: { 
          scanOnly: true, 
          originalTicket: {
            id: this.ticketId,
            bus: this.bus,
            type: this.type,
            vehicle: this.vehicle,
            amount: this.amount,
            persons: this.persons,
            ticket: this.ticket,
            source: this.source,
            destination: this.destination,
            date: this.today,
            arrivalTime: this.arrivalTime,
            validityTime: this.validityTime,
            ticketNo: this.ticketNo,
            time24: this.time24,
            rawQrData: this.rawQrData
          }
        }
      });
    }, 800);
  }

  onTicketPressEnd() {
    if (this.ticketPressTimer) {
      clearTimeout(this.ticketPressTimer);
      this.ticketPressTimer = null;
    }
  }

  saveTicketToLocalDb() {
    try {
      const newTicket = {
        id: this.ticketId,
        bus: this.bus,
        type: this.type,
        vehicle: this.vehicle,
        amount: this.amount,
        persons: this.persons,
        ticketCode: this.ticket || 'K0607',
        source: this.source,
        destination: this.destination,
        date: this.today,
        arrivalTime: this.arrivalTime,
        validityTime: this.validityTime,
        expiryTime: Date.now() + 10800000,
        ticketNo: this.ticketNo,
        time24: this.time24,
        rawQrData: this.rawQrData
      };

      let activeTickets = [];
      const stored = localStorage.getItem('active_tickets');
      if (stored) {
        activeTickets = JSON.parse(stored);
      }
      activeTickets.unshift(newTicket);
      localStorage.setItem('active_tickets', JSON.stringify(activeTickets));
    } catch (e) {
      console.error('Failed to save active ticket to localStorage:', e);
    }
  }

  updateTicketInLocalDb(oldId: string) {
    try {
      const stored = localStorage.getItem('active_tickets');
      if (stored) {
        let activeTickets = JSON.parse(stored);
        const index = activeTickets.findIndex((t: any) => t.id === oldId);
        if (index !== -1) {
          activeTickets[index].id = this.ticketId;
          activeTickets[index].rawQrData = this.rawQrData;
          localStorage.setItem('active_tickets', JSON.stringify(activeTickets));
        }
      }
    } catch (e) {
      console.error('Failed to update ticket in localStorage:', e);
    }
  }

  updateTimer() {
    if (this.expiryTime > 0) {
      this.seconds = Math.max(0, Math.floor((this.expiryTime - Date.now()) / 1000));
    }
    const h = Math.floor(this.seconds / 3600);
    const m = Math.floor((this.seconds % 3600) / 60);
    const s = this.seconds % 60;
    this.time =
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    try {
      this.cdr.detectChanges();
    } catch (e) {}

    if (this.seconds <= 0 && this.timerInterval) {
      clearInterval(this.timerInterval);
      this.time = '00:00:00';
    }
  }

  startTimer() {
    if (!this.expiryTime) {
      this.expiryTime = Date.now() + (this.seconds * 1000);
    }
    this.updateTimer();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  showTicket() {

    setTimeout(() => {

      this.showBusTicket = true;

      /* BIG CONFETTI BLAST */
      confetti({
        particleCount: 500,
        spread: 220,
        startVelocity: 70,
        scalar: 2,
        ticks: 100,
        origin: {
          x: 0.5,
          y: 0.8
        }
      });

      /* EXTRA LEFT SIDE */
      confetti({
        particleCount: 250,
        spread: 180,
        startVelocity: 60,
        scalar: 1.5,
        ticks: 100,
        origin: {
          x: 0,
          y: 0.8
        }
      });

      /* EXTRA RIGHT SIDE */
      confetti({
        particleCount: 250,
        spread: 180,
        startVelocity: 60,
        scalar: 1.5,
        ticks: 100,
        origin: {
          x: 1,
          y: 0.8
        }
      });

    }, 1000);

  }

  closeOverlay() {
    this.showBusTicket = false;
  }

  goBackFromPage() {
    const state = history.state;
    if (state && state.referrerTab) {
      this.router.navigate(['/' + state.referrerTab], { replaceUrl: true });
    } else {
      this.router.navigate([this.referrer || '/home'], { replaceUrl: true });
    }
  }

  goBackToReferrer() {
    this.goBackFromPage();
  }

  goToHistory() {
    this.router.navigate(['/ticket'], {
      replaceUrl: true
    });
  }

  navTab(tab: 'home' | 'passes' | 'live' | 'ticket' | 'profile') {
    this.router.navigate(['/' + tab], {
      replaceUrl: true
    });
  }

  copyId() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.ticketId).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = this.ticketId;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback: Unable to copy', err);
      }
      document.body.removeChild(textarea);
    }
  }

}