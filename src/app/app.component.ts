import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { BackNavigationService } from './services/back-navigation.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private backNavService: BackNavigationService
  ) {}

  ngOnInit() {
    this.backNavService.init();
  }
}

