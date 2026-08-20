import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import '@dotlottie/player-component';
import '@lottiefiles/dotlottie-wc';
import '@lottiefiles/lottie-player';

// Neutralize system font scale overrides (e.g. high text sizes on Xiaomi/Samsung)
(function () {
  try {
    const docEl = document.documentElement;
    const dummy = document.createElement('span');
    dummy.style.fontSize = '16px';
    dummy.style.position = 'absolute';
    dummy.style.visibility = 'hidden';
    document.body.appendChild(dummy);
    const actualSize = parseFloat(window.getComputedStyle(dummy).fontSize);
    document.body.removeChild(dummy);
    
    if (actualSize && Math.abs(actualSize - 16) > 0.01) {
      const scaleFactor = actualSize / 16;
      docEl.style.setProperty('font-size', (16 / scaleFactor) + 'px', 'important');
    }
  } catch (e) {
    console.error('Error neutralizing font scale:', e);
  }
})();

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
