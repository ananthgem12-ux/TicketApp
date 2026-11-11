import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
export class BottomNavComponent {
  @Input() activeTab: 'home' | 'passes' | 'live' | 'ticket' | 'profile' = 'home';

  constructor(
    private router: Router
  ) {}

  openBusOtp() {
    this.router.navigate(['/bus-otp']);
  }

  navTo(tab: 'home' | 'passes' | 'live' | 'ticket' | 'profile') {
    if (this.activeTab === tab && this.router.url === `/${tab}`) {
      return;
    }
    this.router.navigate([`/${tab}`]);
  }
}
