import { Component, Input, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule]
})
export class BottomNavComponent implements OnInit, OnDestroy {
  @Input() activeTab: 'home' | 'passes' | 'live' | 'ticket' | 'profile' = 'home';

  centerMode: 'otp' | 'qr' = 'otp';
  private centerModeTimer: any;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.startCenterModeTimer();
  }

  ngOnDestroy() {
    if (this.centerModeTimer) {
      clearInterval(this.centerModeTimer);
      this.centerModeTimer = null;
    }
  }

  startCenterModeTimer() {
    if (this.centerModeTimer) {
      clearInterval(this.centerModeTimer);
      this.centerModeTimer = null;
    }
    this.centerModeTimer = setInterval(() => {
      this.centerMode = this.centerMode === 'otp' ? 'qr' : 'otp';
      try {
        this.cdr.detectChanges();
      } catch (e) {}
    }, 3500);
  }

  openBusOtp() {
    this.router.navigate(['/bus-otp']);
  }

  navTo(tab: 'home' | 'passes' | 'live' | 'ticket' | 'profile') {
    if (this.activeTab === tab) {
      return;
    }
    this.router.navigate([`/${tab}`]);
  }
}
