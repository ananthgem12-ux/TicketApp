import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { BackNavigationService } from '../../services/back-navigation.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-passes',
  templateUrl: './passes.page.html',
  styleUrls: ['./passes.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, CommonModule, BottomNavComponent]
})
export class PassesPage implements OnInit, OnDestroy {
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
    this.backNavService.unregisterHandler('passes-page');
  }

  ngOnDestroy() {
    this.backNavService.unregisterHandler('passes-page');
  }

  private registerBackHandler() {
    this.backNavService.registerHandler('passes-page', () => {
      this.router.navigate(['/home'], { replaceUrl: true });
      return true;
    }, 10);
  }
}
