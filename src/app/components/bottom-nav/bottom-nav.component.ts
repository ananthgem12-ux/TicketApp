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

  isNavLottiePaused = false;
  private navLottieTimer: any;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.startNavLottieTimer();
  }

  ngOnDestroy() {
    if (this.navLottieTimer) {
      clearTimeout(this.navLottieTimer);
      this.navLottieTimer = null;
    }
  }

  startNavLottieTimer() {
    if (this.navLottieTimer) {
      clearTimeout(this.navLottieTimer);
      this.navLottieTimer = null;
    }
    this.isNavLottiePaused = false;

    // After 2 seconds, pause the active Lottie animation
    this.navLottieTimer = setTimeout(() => {
      this.isNavLottiePaused = true;
      try {
        this.cdr.detectChanges();
      } catch (e) {}

      const player: any = document.querySelector('.active-nav-lottie-player');
      if (player && typeof player.pause === 'function') {
        try {
          player.pause();
        } catch (e) {}
      }
    }, 2000);
  }

  onActiveLottieClick(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.navLottieTimer) {
      clearTimeout(this.navLottieTimer);
      this.navLottieTimer = null;
    }
    this.isNavLottiePaused = true;
    const player: any = document.querySelector('.active-nav-lottie-player');
    if (player && typeof player.pause === 'function') {
      try {
        player.pause();
      } catch (e) {}
    }
  }

  navTo(tab: 'home' | 'passes' | 'live' | 'ticket' | 'profile') {
    if (this.activeTab === tab) {
      return;
    }
    this.router.navigate([`/${tab}`]);
  }
}
