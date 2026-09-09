import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { BackNavigationService } from '../../services/back-navigation.service';
import { SecureScreenService } from '../../services/secure-screen.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [IonContent, CommonModule, FormsModule, BottomNavComponent]
})
export class ProfilePage implements OnInit, OnDestroy {
  userPhone = '9724153346';
  showPhoneEdit = false;
  editingPhone = '';
  private pressTimer: any;

  // Preferences Modal state (Screenshot Protection FLAG_SECURE)
  showPreferencesModal = false;
  isScreenshotProtectionEnabled = true;

  // E/I Export Import Modal state
  showEiModal = false;
  eiActiveTab: 'otps' | 'places' | 'history' = 'otps';
  importStatusMessage = '';

  constructor(
    private router: Router,
    private backNavService: BackNavigationService,
    private secureScreenService: SecureScreenService
  ) {}

  ngOnInit() {
    this.registerBackHandler();
    this.loadUserPhone();
    this.isScreenshotProtectionEnabled = this.secureScreenService.isSecureEnabled();
  }

  ionViewWillEnter() {
    this.registerBackHandler();
    this.loadUserPhone();
    this.isScreenshotProtectionEnabled = this.secureScreenService.isSecureEnabled();
  }

  ionViewWillLeave() {
    this.backNavService.unregisterHandler('profile-page');
  }

  ngOnDestroy() {
    this.backNavService.unregisterHandler('profile-page');
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  private registerBackHandler() {
    this.backNavService.registerHandler('profile-page', () => {
      if (this.showPreferencesModal) {
        this.closePreferencesModal();
        return true;
      }
      if (this.showEiModal) {
        this.closeEiModal();
        return true;
      }
      if (this.showPhoneEdit) {
        this.cancelPhoneEdit();
        return true;
      }
      this.goToHome();
      return true;
    }, 10);
  }

  goToHome() {
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  // ================= PHONE NUMBER METHODS =================
  loadUserPhone() {
    const saved = localStorage.getItem('user_phone');
    if (saved) {
      this.userPhone = saved;
    } else {
      localStorage.setItem('user_phone', this.userPhone);
    }
  }

  editPhoneNumber() {
    this.editingPhone = this.userPhone;
    this.showPhoneEdit = true;
  }

  savePhone() {
    if (this.editingPhone.trim()) {
      this.userPhone = this.editingPhone.trim();
      localStorage.setItem('user_phone', this.userPhone);
    }
    this.showPhoneEdit = false;
  }

  cancelPhoneEdit() {
    this.showPhoneEdit = false;
  }

  onPressStart(event: any) {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
    this.pressTimer = setTimeout(() => {
      this.editPhoneNumber();
    }, 850);
  }

  onPressEnd() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  // ================= PREFERENCES (FLAG_SECURE) METHODS =================
  openPreferencesModal() {
    this.isScreenshotProtectionEnabled = this.secureScreenService.isSecureEnabled();
    this.showPreferencesModal = true;
  }

  closePreferencesModal() {
    this.showPreferencesModal = false;
  }

  async toggleScreenshotProtection(event?: Event) {
    if (event) {
      const target = event.target as HTMLInputElement;
      this.isScreenshotProtectionEnabled = target ? target.checked : !this.isScreenshotProtectionEnabled;
    } else {
      this.isScreenshotProtectionEnabled = !this.isScreenshotProtectionEnabled;
    }
    await this.secureScreenService.setSecureEnabled(this.isScreenshotProtectionEnabled);
  }

  // ================= E/I EXPORT & IMPORT METHODS =================
  openEiModal() {
    this.showEiModal = true;
    this.importStatusMessage = '';
  }

  closeEiModal() {
    this.showEiModal = false;
    this.importStatusMessage = '';
  }

  get mappedOtpsList(): { otp: string; busNo: string }[] {
    try {
      const stored = localStorage.getItem('otp_bus_map');
      if (!stored) return [];
      const map = JSON.parse(stored);
      return Object.keys(map).map(otp => ({
        otp,
        busNo: map[otp]
      }));
    } catch (e) {
      return [];
    }
  }

  get mappedBusesList(): { busNo: string; lastSource: string; lastDestination: string; stopsCount: number; stopsList: string[] }[] {
    try {
      const stored = localStorage.getItem('custom_bus_data');
      const customData = stored ? JSON.parse(stored) : {};
      const buses = Object.keys(customData);
      
      return buses.map(busNo => {
        const item = customData[busNo] || {};
        const stops = item.customStops || [];
        return {
          busNo,
          lastSource: item.lastSource || 'M.G.R.KOYAMBEDU',
          lastDestination: item.lastDestination || 'KELAMBAKKAM',
          stopsCount: stops.length,
          stopsList: stops
        };
      });
    } catch (e) {
      return [];
    }
  }

  get totalHistoryCount(): number {
    try {
      const stored = localStorage.getItem('active_tickets');
      if (!stored) return 0;
      const list = JSON.parse(stored);
      return Array.isArray(list) ? list.length : 0;
    } catch (e) {
      return 0;
    }
  }

  get activeTicketsCount(): number {
    try {
      const stored = localStorage.getItem('active_tickets');
      if (!stored) return 0;
      const list = JSON.parse(stored);
      if (!Array.isArray(list)) return 0;
      const now = Date.now();
      return list.filter((t: any) => t.expiryTime > now).length;
    } catch (e) {
      return 0;
    }
  }

  get pastTicketsCount(): number {
    try {
      const stored = localStorage.getItem('active_tickets');
      if (!stored) return 0;
      const list = JSON.parse(stored);
      if (!Array.isArray(list)) return 0;
      const now = Date.now();
      return list.filter((t: any) => t.expiryTime <= now).length;
    } catch (e) {
      return 0;
    }
  }

  async exportDataJson() {
    try {
      const dataToExport = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        active_tickets: JSON.parse(localStorage.getItem('active_tickets') || '[]'),
        otp_bus_map: JSON.parse(localStorage.getItem('otp_bus_map') || '{}'),
        custom_bus_data: JSON.parse(localStorage.getItem('custom_bus_data') || '{}'),
        global_custom_stops: JSON.parse(localStorage.getItem('global_custom_stops') || '[]'),
        global_custom_rates: JSON.parse(localStorage.getItem('global_custom_rates') || '{}'),
        mtc_routes: JSON.parse(localStorage.getItem('mtc_routes') || '{}'),
        frequently_visited_destinations: JSON.parse(localStorage.getItem('frequently_visited_destinations') || '{}'),
        last_used_bus: localStorage.getItem('last_used_bus') || '570S',
        user_phone: localStorage.getItem('user_phone') || this.userPhone
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `ChennaiOne_BusData_${dateStr}.json`;

      const { Capacitor } = await import('@capacitor/core');

      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: 'Export Chennai One Data',
          text: 'Chennai One Bus Data & Ticket History Backup',
          url: savedFile.uri,
          dialogTitle: 'Save JSON to Downloads or File Manager'
        });

        this.importStatusMessage = '✓ Export ready! Select "Save to Files" or File Manager to save your JSON backup.';
      } else {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.importStatusMessage = '✓ Data exported as JSON successfully!';
      }
    } catch (e: any) {
      console.error('Failed to export data:', e);
      this.importStatusMessage = '⚠️ Export failed: ' + (e?.message || e);
    }
  }

  triggerImportFile() {
    const fileInput = document.getElementById('ei-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  onEiFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);

        let restoredItemsCount = 0;

        if (data.active_tickets && Array.isArray(data.active_tickets)) {
          localStorage.setItem('active_tickets', JSON.stringify(data.active_tickets));
          restoredItemsCount += data.active_tickets.length;
        }
        if (data.otp_bus_map && typeof data.otp_bus_map === 'object') {
          localStorage.setItem('otp_bus_map', JSON.stringify(data.otp_bus_map));
        }
        if (data.custom_bus_data && typeof data.custom_bus_data === 'object') {
          localStorage.setItem('custom_bus_data', JSON.stringify(data.custom_bus_data));
        }
        if (data.global_custom_stops && Array.isArray(data.global_custom_stops)) {
          localStorage.setItem('global_custom_stops', JSON.stringify(data.global_custom_stops));
        }
        if (data.global_custom_rates && typeof data.global_custom_rates === 'object') {
          localStorage.setItem('global_custom_rates', JSON.stringify(data.global_custom_rates));
        }
        if (data.mtc_routes && typeof data.mtc_routes === 'object') {
          localStorage.setItem('mtc_routes', JSON.stringify(data.mtc_routes));
        }
        if (data.frequently_visited_destinations && typeof data.frequently_visited_destinations === 'object') {
          localStorage.setItem('frequently_visited_destinations', JSON.stringify(data.frequently_visited_destinations));
        }
        if (data.last_used_bus) {
          localStorage.setItem('last_used_bus', data.last_used_bus);
        }
        if (data.user_phone) {
          localStorage.setItem('user_phone', data.user_phone);
          this.userPhone = data.user_phone;
        }

        this.loadUserPhone();

        const otpCount = Object.keys(data.otp_bus_map || {}).length;
        const busCount = Object.keys(data.custom_bus_data || {}).length;
        this.importStatusMessage = `✓ Import successful! Restored ${otpCount} OTPs, ${busCount} Buses, and ${restoredItemsCount} Tickets.`;
      } catch (err: any) {
        console.error('Import failed:', err);
        this.importStatusMessage = '❌ Invalid JSON file format. ' + (err?.message || '');
      }
    };
    reader.readAsText(file);
  }
}
