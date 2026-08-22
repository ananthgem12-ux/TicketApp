import { Component, AfterViewInit, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { NgTemplateOutlet } from '@angular/common';
import confetti from 'canvas-confetti';
import { BackNavigationService } from '../../services/back-navigation.service';

@Component({
  selector: 'app-bus-ticket',
  templateUrl: './bus-ticket.page.html',
  styleUrls: ['./bus-ticket.page.scss'],
  standalone: true,
  imports: [IonContent, NgTemplateOutlet]
})
export class BusTicketPage implements OnInit, OnDestroy, AfterViewInit {

  @Input() isOverlay = false;
  @Input() bus = '';
  @Input() source = '';
  @Input() destination = '';
  @Input() persons = 1;
  @Input() amount = 0;
  @Input() ticket = '';
  @Input() ticketNo = '';
  @Input() date = '';
  @Input() time = '';

  @Output() close = new EventEmitter<void>();

  get formattedAmount(): string {
    const num = Number(this.amount) || 0;
    return num.toFixed(2);
  }

  get totalAmount(): string {
    const num = (Number(this.amount) || 0) * (Number(this.persons) || 1);
    return num.toFixed(2);
  }

  constructor(
    private router: Router,
    private backNavService: BackNavigationService
  ) {}

  ionViewWillEnter() {
    if (!this.isOverlay) {
      this.backNavService.registerHandler('bus-ticket-page', () => {
        this.goBack();
        return true;
      }, 20);
    }
  }

  ionViewWillLeave() {
    this.backNavService.unregisterHandler('bus-ticket-page');
  }

  ngOnDestroy() {
    this.backNavService.unregisterHandler('bus-ticket-page');
  }

  ngOnInit() {
    if (!this.isOverlay) {
      const state = history.state;

      this.bus = state.bus || '570';
      this.source = state.source || 'Navalur';
      this.destination = state.destination || 'Siruseri I.T.Park';
      this.persons = state.persons || 1;
      this.amount = state.amount || 13;
      this.ticket = state.ticket || 'K0607';

      this.ticketNo = state.ticketNo || String(
        Math.floor(1000000000 + Math.random() * 9000000000)
      );

      const now = new Date();
      this.date = state.date || now.toLocaleDateString('en-IN');
      this.time = state.time || now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  }

  ngAfterViewInit() {

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

  }

  goBack() {
    if (this.isOverlay) {
      this.close.emit();
    } else {
      const state = history.state;
      this.router.navigate(['/home'], {
        replaceUrl: true,
        state: {
          activeTab: state.referrerTab || 'home'
        }
      });
    }
  }

}