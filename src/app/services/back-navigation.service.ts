import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';

export type BackActionHandler = () => boolean | void;

@Injectable({
  providedIn: 'root'
})
export class BackNavigationService {
  private handlers: { id: string; fn: BackActionHandler; priority: number }[] = [];

  constructor(
    private platform: Platform,
    private router: Router
  ) {}

  init() {
    this.platform.backButton.subscribeWithPriority(9999, () => {
      this.handleBackButton();
    });
  }

  registerHandler(id: string, fn: BackActionHandler, priority = 10) {
    this.unregisterHandler(id);
    this.handlers.push({ id, fn, priority });
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  unregisterHandler(id: string) {
    this.handlers = this.handlers.filter(h => h.id !== id);
  }

  handleBackButton() {
    // 1. Run top-priority custom handler if available (e.g. modals, bottom sheets, overlays, or non-home tabs)
    for (const handler of this.handlers) {
      try {
        const handled = handler.fn();
        if (handled === true) {
          return;
        }
      } catch (err) {
        console.error('Error running back button handler:', err);
      }
    }

    // 2. Route-based smart handling:
    // Only completely exit the app if the user is on the Home page.
    const currentUrl = (this.router.url || '').split('?')[0].split('#')[0];

    if (currentUrl === '/home' || currentUrl === '/temp-home' || currentUrl === '/') {
      App.exitApp();
      return;
    }

    // For any other page, navigate safely to Home page
    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
