import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private router: Router
  ) {}

  ngOnInit() {
    this.platform.backButton.subscribeWithPriority(10, (processNextHandler) => {
      const currentUrl = this.router.url;
      if (currentUrl === '/home' || currentUrl === '/splash' || currentUrl === '/' || currentUrl.startsWith('/home')) {
        App.exitApp();
      } else {
        processNextHandler();
      }
    });
  }
}

