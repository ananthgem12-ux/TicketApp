import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';

import { BrowserQRCodeReader } from '@zxing/browser';
import { lookupBusDetails } from '../../services/mtc-bus-lookup.service';
import { BackNavigationService } from '../../services/back-navigation.service';

@Component({
  selector: 'app-bus-otp',
  templateUrl: './bus-otp.page.html',
  styleUrls: ['./bus-otp.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent,
    CommonModule,
    FormsModule
  ]
})
export class BusOtpPage implements OnInit, OnDestroy {
  digitsInternal: string[] = [];

  get digits(): string[] {
    return this.digitsInternal.slice(0, 5);
  }

  set digits(val: string[]) {
    this.digitsInternal = [...val];
  }

  scanMode = false; // default to OTP manual entry view
  cameraStream: MediaStream | null = null;
  videoElement: HTMLVideoElement | null = null;
  cameraLoading = false;
  cameraPermissionDenied = false;
  showQrModal = false;
  cameraErrorMessage = '';
  isFetchingData = false;

  private canvasElement: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;
  private scanAnimationFrameId: number | null = null;
  private codeReader = new BrowserQRCodeReader();
  private zxingControls: any = null;
  
  scanOnly = false;
  originalTicket: any = null;

  constructor(
    private router: Router,
    private backNavService: BackNavigationService
  ) {
    const state = history.state;
    if (state && state.scanOnly) {
      this.scanOnly = true;
      this.scanMode = true; // force scan mode immediately
      this.originalTicket = state.originalTicket || null;
    }
  }

  async ngOnInit() {
    await this.requestCameraPermission();
    if (this.scanOnly) {
      this.startCamera();
    }
  }

  ionViewWillEnter() {
    this.backNavService.registerHandler('bus-otp-page', () => {
      if (this.showQrModal) {
        this.showQrModal = false;
        return true;
      }
      this.goBack();
      return true;
    }, 20);
  }

  ionViewWillLeave() {
    this.backNavService.unregisterHandler('bus-otp-page');
    this.stopCamera();
  }

  async requestCameraPermission() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.warn('Camera permission request on load failed/denied:', err);
    }
  }

  ngOnDestroy() {
    this.backNavService.unregisterHandler('bus-otp-page');
    this.stopCamera();
  }

  openQrModal(event: Event) {
    event.stopPropagation();
    this.showQrModal = true;
  }

  closeQrModalOnly(event: Event) {
    event.stopPropagation();
    this.showQrModal = false;
  }

  closeQrModalAndNavigate() {
    this.showQrModal = false;
    this.stopCamera();
    const ticketNumber = this.digitsInternal.length > 0 ? this.digitsInternal.join('').substring(0, 5) : 'K544';
    this.router.navigate(['/booking'], {
      state: {
        ticket: ticketNumber
      }
    });
  }

  toggleScanMode() {
    this.scanMode = !this.scanMode;
    if (this.scanMode) {
      this.startCamera();
    } else {
      this.stopCamera();
    }
  }

  setScanMode(value: boolean) {
    if (this.scanMode === value) return;
    this.scanMode = value;
    if (this.scanMode) {
      this.startCamera();
    } else {
      this.stopCamera();
    }
  }

  private touchStartY = 0;

  onTouchStart(event: TouchEvent) {
    if (event.touches && event.touches.length > 0) {
      this.touchStartY = event.touches[0].clientY;
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (this.scanOnly) return;
    if (event.changedTouches && event.changedTouches.length > 0) {
      const touchEndY = event.changedTouches[0].clientY;
      const diffY = touchEndY - this.touchStartY;
      if (diffY > 40) {
        this.setScanMode(true);
      } else if (diffY < -40) {
        this.setScanMode(false);
      }
    }
  }

  goBack() {
    this.stopCamera();
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  press(value: string) {
    const isLetter = ['J', 'K', 'I', 'S', 'L'].includes(value);
    if (this.digitsInternal.length === 0) {
      if (isLetter) {
        this.digitsInternal.push(value);
      }
    } else if (this.digitsInternal.length < 7) {
      if (!isLetter) {
        this.digitsInternal.push(value);
      }
    }
  }

  backspace() {
    const len = this.digitsInternal.length;
    if (len === 6) {
      this.digitsInternal.splice(-2);
    } else if (len === 7) {
      this.digitsInternal.splice(-3);
    } else if (len > 0) {
      this.digitsInternal.pop();
    }
  }

  clearAll() {
    this.digitsInternal = [];
  }

  get isComplete() {
    return this.digitsInternal.length >= 5;
  }

  isNumber(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  async goBooking() {
    if (this.isComplete && !this.isFetchingData) {
      const fullCode = this.digitsInternal.join('').trim().toUpperCase();
      const ticketNumber = fullCode.substring(0, 5);
      const isOffline = fullCode.length > 5 && fullCode.endsWith('08');

      if (isOffline) {
        this.stopCamera();
        this.router.navigate(['/booking'], {
          state: {
            ticket: ticketNumber,
            isOffline: true
          }
        });
        return;
      }

      this.isFetchingData = true;

      try {
        // Fetch bus details (local DB + MTC live API)
        const busData = await lookupBusDetails(ticketNumber);
        this.stopCamera();
        this.router.navigate(['/booking'], {
          state: {
            ticket: ticketNumber,
            busData: busData,
            isOffline: false
          }
        });
      } catch (e) {
        console.warn('Error pre-fetching bus details on OTP page:', e);
        this.stopCamera();
        this.router.navigate(['/booking'], {
          state: { ticket: ticketNumber, isOffline: false }
        });
      } finally {
        this.isFetchingData = false;
      }
    }
  }

  // Camera stream helpers
  async startCamera() {
    this.cameraLoading = true;
    this.cameraPermissionDenied = false;
    this.stopCamera();

    // Small delay to simulate loading camera text
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      this.videoElement = document.getElementById('camera-feed') as HTMLVideoElement;
      if (this.videoElement && this.cameraStream) {
        this.videoElement.srcObject = this.cameraStream;
        this.videoElement.setAttribute('playsinline', 'true');
        
        // Wait for video metadata to load so readystate is good
        await new Promise((resolve) => {
          if (this.videoElement) {
            this.videoElement.onloadedmetadata = () => resolve(true);
            if (this.videoElement.readyState >= 1) resolve(true);
          } else {
            resolve(true);
          }
        });

        this.videoElement.play().then(() => {
          this.startScanning();
        }).catch(err => console.log('Video play error:', err));
      }
    } catch (err: any) {
      console.warn('Camera permission denied or camera device not found. Using simulation mode.', err);
      this.cameraPermissionDenied = true;
      this.cameraErrorMessage = err?.message || String(err);
    } finally {
      this.cameraLoading = false;
    }
  }

  stopCamera() {
    if (this.zxingControls) {
      this.zxingControls.stop();
      this.zxingControls = null;
    }
    if (this.scanAnimationFrameId) {
      cancelAnimationFrame(this.scanAnimationFrameId);
      this.scanAnimationFrameId = null;
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  startScanning() {
    if (!this.videoElement) return;
    
    if (this.zxingControls) {
      this.zxingControls.stop();
      this.zxingControls = null;
    }

    this.codeReader.decodeFromVideoElement(this.videoElement, (result: any, error: any, controls: any) => {
      if (!this.zxingControls) {
        this.zxingControls = controls;
      }
      if (result) {
        console.log('Decoded QR Code:', result.getText());
        controls.stop();
        this.zxingControls = null;
        this.handleQrData(result.getText());
      }
      // We ignore the error callback because it fires continuously when no QR code is found
    }).catch((err: any) => {
      console.warn('ZXing start error:', err);
    });
  }

  handleQrData(qrData: string) {
    if (this.scanOnly && this.originalTicket) {
      let newTicketId = '';
      if (qrData.includes(',')) {
        const parts = qrData.split(',');
        if (parts.length > 1) {
          newTicketId = parts[1].trim(); // the second field is the ticket number (ID)
        }
      }
      
      if (!newTicketId) {
        newTicketId = qrData.slice(0, 10); // fallback
      }

      this.stopCamera();
      this.scanMode = false;

      const updatedTicket = {
        ...this.originalTicket,
        id: newTicketId,
        rawQrData: qrData,
        oldId: this.originalTicket.id
      };

      this.router.navigate(['/ticket-generation'], {
        state: updatedTicket
      });
      return;
    }

    // 1. Check if comma-separated CSV format
    if (qrData.includes(',')) {
      const parsedCsv = this.parseCsvQrData(qrData);
      if (parsedCsv) {
        this.stopCamera();
        this.scanMode = false;
        
        parsedCsv.rawQrData = qrData;
        if (this.originalTicket && this.originalTicket.id) {
          parsedCsv.id = this.originalTicket.id;
        }

        this.router.navigate(['/ticket-generation'], {
          state: parsedCsv
        });
        return;
      }
    }

    // 2. Check if JSON data
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.bus) {
        this.stopCamera();
        this.scanMode = false;
        
        this.router.navigate(['/ticket-generation'], {
          state: {
            bus: parsed.bus,
            type: parsed.type || 'Delux',
            vehicle: parsed.vehicle || 'Normal',
            price: parsed.price || parsed.amount || 13,
            persons: parsed.persons || 1,
            ticket: parsed.ticket || parsed.ticketCode || 'K544',
            source: parsed.source || 'Navalur',
            destination: parsed.destination || 'Siruseri I.T.Park'
          }
        });
        return;
      }
    } catch (e) {
      // Not JSON
    }

    // 3. Check if URL
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      try {
        const url = new URL(qrData);
        
        // NEW: Check for 'f' param which represents the bus OTP (e.g., K0404)
        const fParam = url.searchParams.get('f');
        if (fParam) {
          const cleanCode = fParam.trim().toUpperCase();
          this.stopCamera();
          this.scanMode = false;
          this.digits = cleanCode.slice(0, 5).split('');
          this.router.navigate(['/booking'], {
            state: {
              ticket: cleanCode
            }
          });
          return;
        }

        const bus = url.searchParams.get('bus') || url.searchParams.get('route');
        if (bus) {
          const source = url.searchParams.get('source') || url.searchParams.get('from') || 'Navalur';
          const destination = url.searchParams.get('destination') || url.searchParams.get('to') || 'Siruseri I.T.Park';
          const priceVal = url.searchParams.get('price') || url.searchParams.get('amount') || '13';
          const price = parseFloat(priceVal);
          const personsVal = url.searchParams.get('persons') || url.searchParams.get('count') || '1';
          const persons = parseInt(personsVal, 10);
          const ticket = url.searchParams.get('ticket') || url.searchParams.get('ticketCode') || url.searchParams.get('otp') || 'K544';
          const type = url.searchParams.get('type') || 'Delux';
          const vehicle = url.searchParams.get('vehicle') || 'Normal';

          this.stopCamera();
          this.scanMode = false;
          
          this.router.navigate(['/ticket-generation'], {
            state: {
              bus,
              type,
              vehicle,
              price: isNaN(price) ? 13 : price,
              persons: isNaN(persons) ? 1 : persons,
              ticket,
              source,
              destination
            }
          });
          return;
        }
      } catch (err) {
        // Ignore URL parse errors
      }
    }

    // 4. Fallback: Parse as plain ticket code/OTP
    const cleanCode = qrData.trim().toUpperCase();
    if (cleanCode.length > 0) {
      this.stopCamera();
      this.scanMode = false;

      this.digits = cleanCode.slice(0, 5).split('');

      this.router.navigate(['/booking'], {
        state: {
          ticket: cleanCode
        }
      });
    }
  }

  parseCsvQrData(qrData: string): any {
    const parts = qrData.split(',');
    if (parts.length >= 11) {
      const signature = parts[0];
      const ticketNo = parts[1];
      const sourceHash = parts[2];
      const destHash = parts[3];
      const persons = parseInt(parts[4], 10) || 1;
      const typeCode = parts[5]; 
      const prefix = parts[6]; 
      const price = parseFloat(parts[7]) || 13;
      const suffix = parts[8]; 
      const color = parts[9]; 
      const dateTimeStr = parts[10]; 

      const ticketCode = (prefix && suffix) ? `${prefix}${suffix}` : 'S4548';

      const STOP_HASH_MAP: Record<string, string> = {
        '9eefab7722': 'Navalur',
        'd97f8fa522': 'Siruseri I.T.Park'
      };

      const source = STOP_HASH_MAP[sourceHash] || 'Navalur';
      const destination = STOP_HASH_MAP[destHash] || 'Siruseri I.T.Park';

      // Guess bus based on ticket prefix
      let bus = '570S';
      if (prefix === 'J') {
        bus = '19';
      } else if (prefix === 'K') {
        bus = '555S';
      } else if (prefix === 'I') {
        bus = 'MAA2';
      }

      // Determine vehicle and bus type based on color
      let type = 'Delux';
      let vehicle = 'Normal';
      if (color === '#1B5E20' || color.toLowerCase() === '#1b5e20') {
        vehicle = 'EV';
        type = 'Delux';
      } else if (color === '#4CAF50') {
        vehicle = 'EV';
        type = 'Ordinary';
      } else if (color === '#F44336') {
        type = 'AC';
        vehicle = 'Normal';
      }

      let date = '';
      let time24 = '';
      let arrivalTime = '';
      if (dateTimeStr) {
        try {
          const dtParts = dateTimeStr.split(' ');
          if (dtParts.length >= 2) {
            const dateParts = dtParts[0].split('-');
            if (dateParts.length === 3) {
              date = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;
            }
            
            time24 = dtParts[1].slice(0, 5); 
            
            const timeParts = dtParts[1].split(':');
            if (timeParts.length >= 2) {
              let hr = parseInt(timeParts[0], 10);
              const min = timeParts[1];
              const ampm = hr >= 12 ? 'PM' : 'AM';
              hr = hr % 12;
              if (hr === 0) hr = 12;
              arrivalTime = `${String(hr).padStart(2, '0')}:${min} ${ampm}`;
            }
          }
        } catch (e) {
          console.warn('Error parsing date/time from QR:', e);
        }
      }

      let validityTime = '';
      if (dateTimeStr) {
        try {
          const dtParts = dateTimeStr.split(' ');
          const dateParts = dtParts[0].split('-');
          const timeParts = dtParts[1].split(':');
          
          const year = parseInt(dateParts[2], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[0], 10);
          const hour = parseInt(timeParts[0], 10);
          const minute = parseInt(timeParts[1], 10);
          const second = parseInt(timeParts[2], 10);
          
          const scanTime = new Date(year, month, day, hour, minute, second);
          const validityDate = new Date(scanTime.getTime() + 10800000); 
          
          validityTime = validityDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
        } catch (e) {
          // fallback
        }
      }

      return {
        bus,
        type,
        vehicle,
        price,
        persons,
        ticket: ticketCode,
        source,
        destination,
        ticketNo: ticketNo,
        date: date || new Date().toLocaleDateString('en-IN'),
        arrivalTime: arrivalTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        validityTime: validityTime,
        time24: time24 || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        expiryTime: Date.now() + 10800000 
      };
    }
    return null;
  }
}
