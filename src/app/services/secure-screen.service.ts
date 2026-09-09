import { Injectable } from '@angular/core';
import { registerPlugin, Capacitor } from '@capacitor/core';

export interface SecureScreenPluginInterface {
  enable(): Promise<void>;
  disable(): Promise<void>;
}

const NativeSecureScreen = registerPlugin<SecureScreenPluginInterface>('SecureScreen');

@Injectable({
  providedIn: 'root'
})
export class SecureScreenService {
  private readonly STORAGE_KEY = 'flag_secure_ticket_enabled';

  /**
   * Check if FLAG_SECURE screenshot protection is enabled.
   * Defaults to true (enabled).
   */
  isSecureEnabled(): boolean {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  }

  /**
   * Toggle FLAG_SECURE preference.
   */
  async setSecureEnabled(enabled: boolean): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, String(enabled));
    if (!enabled) {
      await this.disableSecure();
    }
  }

  /**
   * Enable FLAG_SECURE on the native Android window if preference is active.
   */
  async enableSecure(): Promise<void> {
    if (Capacitor.isNativePlatform() && this.isSecureEnabled()) {
      try {
        await NativeSecureScreen.enable();
      } catch (err) {
        console.warn('SecureScreen.enable failed:', err);
      }
    }
  }

  /**
   * Remove FLAG_SECURE from the native Android window.
   */
  async disableSecure(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await NativeSecureScreen.disable();
      } catch (err) {
        console.warn('SecureScreen.disable failed:', err);
      }
    }
  }
}
