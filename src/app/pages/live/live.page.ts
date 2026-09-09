import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { BackNavigationService } from '../../services/back-navigation.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-live',
  templateUrl: './live.page.html',
  styleUrls: ['./live.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, CommonModule, BottomNavComponent]
})
export class LivePage implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private backNavService: BackNavigationService
  ) {}

  ngOnInit() {
    this.registerBackHandler();
  }

  ionViewWillEnter() {
    this.registerBackHandler();
  }

  ionViewWillLeave() {
    this.backNavService.unregisterHandler('live-page');
  }

  ngOnDestroy() {
    this.backNavService.unregisterHandler('live-page');
  }

  private registerBackHandler() {
    this.backNavService.registerHandler('live-page', () => {
      this.router.navigate(['/home'], { replaceUrl: true });
      return true;
    }, 10);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
