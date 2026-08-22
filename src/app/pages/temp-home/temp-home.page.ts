import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { BackNavigationService } from '../../services/back-navigation.service';

@Component({
  selector: 'app-temp-home',
  templateUrl: './temp-home.page.html',
  styleUrls: ['./temp-home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule
  ]
})
export class TempHomePage implements OnInit, OnDestroy {
  currentTab: 'home' | 'passes' | 'live' | 'ticket' | 'profile' = 'home';
  
  // Profile phone number state
  userPhone = '9724153346';
  showPhoneEdit = false;
  editingPhone = '';
  
  // QR code modal state
  showQrModal = false;
  
  // Active tickets state
  activeTickets: any[] = [];
  
  // Custom stops for suggestions
  customStops: any[] = [];
  
  // Bus Sugesstions
  busSuggestions = [
    '555G',
    '570S',
    'MAA2',
    '19',
    '102P',
    '102Xct'
  ];

  // Digits keypad entry state
  digits: string[] = [];
  showOtpInput = false;

  get isComplete() {
    return this.digits.length === 5;
  }
  
  private intervalId: any;
  private pressTimer: any;

  constructor(
    private router: Router,
    private backNavService: BackNavigationService
  ) {
    const state = history.state;
    if (state && state.activeTab) {
      this.currentTab = state.activeTab;
    }
  }

  ionViewWillEnter() {
    this.registerBackHandler();
  }

  ionViewWillLeave() {
    this.backNavService.unregisterHandler('temp-home-page');
  }

  private registerBackHandler() {
    this.backNavService.registerHandler('temp-home-page', () => {
      if (this.showOtpInput) {
        this.showOtpInput = false;
        return true;
      }
      if (this.showQrModal) {
        this.showQrModal = false;
        return true;
      }
      if (this.showPhoneEdit) {
        this.showPhoneEdit = false;
        return true;
      }
      if (this.currentTab !== 'home') {
        this.currentTab = 'home';
        return true;
      }
      return false;
    }, 10);
  }

  openBusOtp() {
    this.digits = [];
    this.showOtpInput = true;
  }

  closeBusOtp() {
    this.showOtpInput = false;
  }

  press(value: string) {
    const isLetter = ['J', 'K', 'I', 'S'].includes(value);
    if (this.digits.length === 0) {
      // First character must be a letter (J, K, I, S)
      if (isLetter) {
        this.digits.push(value);
      }
    } else if (this.digits.length < 5) {
      // Subsequent characters must be digits (0-9)
      if (!isLetter) {
        this.digits.push(value);
      }
    }
  }

  backspace() {
    if (this.digits.length > 0) {
      this.digits.pop();
    }
  }

  goBooking() {
    if (this.digits.length === 5) {
      const ticketNumber = this.digits.join('');
      this.showOtpInput = false;
      this.router.navigate(
        ['/booking'],
        {
          state: {
            ticket: ticketNumber
          }
        }
      );
    }
  }

  ngOnInit() {
    this.registerBackHandler();
    this.loadUserPhone();
    this.loadActiveTickets();
    this.startCountdownTimer();

    const hasChecked = sessionStorage.getItem('has_checked_active_ticket_on_boot');
    if (!hasChecked) {
      sessionStorage.setItem('has_checked_active_ticket_on_boot', 'true');
      if (this.activeTickets && this.activeTickets.length > 0) {
        this.viewTicketDetails(this.activeTickets[0]);
      }
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
  }

  setTab(tab: 'home' | 'passes' | 'live' | 'ticket' | 'profile') {
    this.currentTab = tab;
    if (tab === 'ticket') {
      this.loadActiveTickets();
    }
  }

  // Phone number methods
  loadUserPhone() {
    const saved = localStorage.getItem('user_phone');
    if (saved) {
      this.userPhone = saved;
    } else {
      localStorage.setItem('user_phone', this.userPhone);
    }
  }

  editPhoneNumber() {
    this.editingPhone = this.userPhone;
    this.showPhoneEdit = true;
  }

  savePhone() {
    if (this.editingPhone.trim()) {
      this.userPhone = this.editingPhone.trim();
      localStorage.setItem('user_phone', this.userPhone);
    }
    this.showPhoneEdit = false;
  }

  cancelPhoneEdit() {
    this.showPhoneEdit = false;
  }

  // Long press detection helper methods
  onPressStart(event: any) {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
    this.pressTimer = setTimeout(() => {
      this.editPhoneNumber();
    }, 850);
  }

  onPressEnd() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  private ticketPressTimer: any;
  private isTicketLongPressed = false;

  onTicketPressStart(ticket: any, event: Event) {
    this.isTicketLongPressed = false;
    if (this.ticketPressTimer) clearTimeout(this.ticketPressTimer);
    
    this.ticketPressTimer = setTimeout(() => {
      this.isTicketLongPressed = true;
      this.router.navigate(['/bus-otp'], {
        state: { 
          scanOnly: true, 
          originalTicket: {
            id: ticket.id,
            bus: ticket.bus,
            type: ticket.type,
            vehicle: ticket.vehicle,
            amount: ticket.amount,
            persons: ticket.persons,
            ticket: ticket.ticketCode,
            source: ticket.source,
            destination: ticket.destination,
            date: ticket.date,
            arrivalTime: ticket.arrivalTime,
            validityTime: ticket.validityTime,
            ticketNo: ticket.ticketNo,
            time24: ticket.time24
          }
        }
      });
    }, 800);
  }

  onTicketPressEnd(event: Event) {
    if (this.ticketPressTimer) {
      clearTimeout(this.ticketPressTimer);
      this.ticketPressTimer = null;
    }
  }

  // QR Modal methods
  openQrModal(event: Event) {
    event.stopPropagation();
    this.showQrModal = true;
  }

  closeQrModalAndNavigate() {
    this.showQrModal = false;
    this.router.navigate(['/booking']);
  }

  closeQrModalOnly(event: Event) {
    event.stopPropagation();
    this.showQrModal = false;
  }

  // Active tickets methods
  loadActiveTickets() {
    const stored = localStorage.getItem('active_tickets');
    if (stored) {
      try {
        const list = JSON.parse(stored);
        const now = Date.now();
        this.activeTickets = list.filter((t: any) => t.expiryTime > now);
        this.updateCountdownStrings();
      } catch (e) {
        this.activeTickets = [];
      }
    } else {
      this.activeTickets = [];
    }
  }

  startCountdownTimer() {
    this.intervalId = setInterval(() => {
      this.loadActiveTickets();
    }, 1000);
  }

  updateCountdownStrings() {
    const now = Date.now();
    this.activeTickets.forEach((t: any) => {
      const diff = t.expiryTime - now;
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        t.countdownStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      } else {
        t.countdownStr = '00:00:00';
      }
    });
  }

  viewTicketDetails(ticket: any) {
    if (this.isTicketLongPressed) {
      this.isTicketLongPressed = false;
      return;
    }
    this.router.navigate(['/ticket-generation'], {
      state: {
        id: ticket.id,
        bus: ticket.bus,
        type: ticket.type,
        vehicle: ticket.vehicle,
        amount: ticket.amount,
        persons: ticket.persons,
        ticket: ticket.ticketCode,
        source: ticket.source,
        destination: ticket.destination,
        date: ticket.date,
        arrivalTime: ticket.arrivalTime,
        validityTime: ticket.validityTime,
        expiryTime: ticket.expiryTime,
        ticketNo: ticket.ticketNo,
        time24: ticket.time24,
        referrerTab: 'ticket',
        referrer: '/temp-home'
      }
    });
  }
}
