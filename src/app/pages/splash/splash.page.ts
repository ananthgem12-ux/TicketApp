import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, NavController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent,
    CommonModule,
    FormsModule
  ]
})
export class SplashPage implements OnInit {

  constructor(
    private router: Router,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    const splashShown = sessionStorage.getItem('splash_shown');
    if (splashShown) {
      this.navCtrl.navigateRoot('/home', { replaceUrl: true, animated: false });
      return;
    }

    sessionStorage.setItem('splash_shown', 'true');
    setTimeout(() => {
      this.navCtrl.navigateRoot('/home', { replaceUrl: true, animated: true });
    }, 2800);
  }

}