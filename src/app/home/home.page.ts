import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BackNavigationService } from '../services/back-navigation.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    IonContent,
    CommonModule,
    FormsModule
  ]
})
export class HomePage implements OnInit, OnDestroy {
  currentTab: 'home' | 'passes' | 'live' | 'ticket' | 'profile' = 'home';

  // Profile phone number state
  userPhone = '9724153346';
  showPhoneEdit = false;
  editingPhone = '';

  // E/I Export Import Modal state
  showEiModal = false;
  eiActiveTab: 'otps' | 'places' | 'history' = 'otps';
  importStatusMessage = '';

  // QR code modal state
  showQrModal = false;

  // Active tickets state
  activeTickets: any[] = [];
  allTickets: any[] = [];
  formattedActiveTickets: any[] = [];

  // Fullscreen search page state
  showSearch = false;
  searchQuery = '';
  filteredRecentSearches: any[] = [];

  recentSearches = [
    {
      title: 'Navalur Ags Complex',
      subtitle: 'Ags Navalur, Navalur, Chennai',
      type: 'stop'
    },
    {
      title: 'MAA2',
      subtitle: 'Tirusulam Airport ⇄ Siruseri IT Park',
      type: 'route'
    },
    {
      title: 'MAA2',
      subtitle: 'Siruseri IT Park ⇄ Chennai Airport',
      type: 'route'
    },
    {
      title: 'Chennai One It Sez',
      subtitle: 'Chennai One, Pallikaranai Marshland, P...',
      type: 'stop'
    },
    {
      title: 'Navalur',
      subtitle: 'Thazambur Rd, Navalur, Chennai',
      type: 'stop'
    },
    {
      title: 'Thirusoolam National Airport',
      subtitle: 'Tirusulam - Airport Subway, Arumalai C...',
      type: 'stop'
    },
    {
      title: 'Koyambedu Market',
      subtitle: 'Koyambedu Market A Rd, Sector 1, Bru...',
      type: 'stop'
    }
  ];

  mockPastTickets = [
    {
      source: 'CHENNAI ONE IT SEZ',
      destination: 'NAVALUR',
      amount: 23,
      dateStr: '14 Jul 2026 • 12:30 pm',
      isExpired: true,
      bus: '102P',
      type: 'Delux'
    },
    {
      source: 'SHOLINGANALLUR KUMARAN NAGAR',
      destination: 'CHENNAI ONE IT SEZ',
      amount: 19,
      dateStr: '14 Jul 2026 • 11:35 am',
      isExpired: true,
      bus: '570S',
      type: 'Ordinary'
    },
    {
      source: 'CHENNAI ONE IT SEZ',
      destination: 'NAVALUR',
      amount: 23,
      dateStr: '13 Jul 2026 • 12:57 pm',
      isExpired: true,
      bus: '102P',
      type: 'Delux'
    },
    {
      source: 'NAVALUR',
      destination: 'CHENNAI ONE IT SEZ',
      amount: 23,
      dateStr: '13 Jul 2026 • 11:56 am',
      isExpired: true,
      bus: '102',
      type: 'Delux'
    },
    {
      source: 'CHENNAI ONE IT SEZ',
      destination: 'NAVALUR',
      amount: 30,
      dateStr: '13 Jul 2026 • 09:15 am',
      isExpired: true,
      bus: '102P',
      type: 'AC'
    }
  ];



  // New home page state
  activeBannerIndex = 0;
  selectedExploreCategory: 'heritage' | 'museum' | 'park' | 'beach' = 'heritage';
  mapTrackingActive = false;

  // Zoomable Map Image properties
  mapZoomScale = 1.0;
  mapPanX = 0;
  mapPanY = 0;
  private isMapDragging = false;
  private mapDragStartX = 0;
  private mapDragStartY = 0;
  private mapPanStartX = 0;
  private mapPanStartY = 0;
  private initialTouchDistance = 0;
  private initialTouchScale = 1.0;

  searchQuerySuggestion = 'Where are you going?';
  imageErrors: { [key: string]: boolean } = {
    'refer_friend': true,
    'safety': true,
    'live_tracking': true,
    'passes': true
  };

  private bannerTimer: any;
  private suggestionTimer: any;
  private suggestionIndex = 0;
  private suggestions = ['Where are you going?', 'Bus Route', 'Suburban', 'Velachery', 'Thiruvanmiyur'];

  // Map reference
  mapInstance: any = null;
  userMarker: any = null;
  isGoogleMap = true;

  // Live bus simulation properties
  busPaths = [
    // Bus 1: OMR (Rajiv Gandhi Salai)
    [
      [12.9865, 80.2524],
      [12.9880, 80.2530],
      [12.9900, 80.2540],
      [12.9920, 80.2550],
      [12.9940, 80.2560],
      [12.9920, 80.2550],
      [12.9900, 80.2540],
      [12.9880, 80.2530]
    ],
    // Bus 2: CSIR Road
    [
      [12.9812, 80.2480],
      [12.9825, 80.2490],
      [12.9840, 80.2505],
      [12.9855, 80.2515],
      [12.9840, 80.2505],
      [12.9825, 80.2490]
    ],
    // Bus 3: Velachery / Taramani Link Road
    [
      [12.9930, 80.2495],
      [12.9915, 80.2475],
      [12.9900, 80.2450],
      [12.9885, 80.2430],
      [12.9900, 80.2450],
      [12.9915, 80.2475]
    ]
  ];
  busIndices = [0, 0, 0];
  busMarkers: any[] = [];
  liveBusInterval: any = null;
  routePolylines: any[] = [];
  stopMarkersList: any[] = [];

  // Explore categories
  exploreCategories = [
    { id: 'heritage', label: 'Heritage', icon: '🏛️' },
    { id: 'museum', label: 'Museum', icon: '🎨' },
    { id: 'park', label: 'Park', icon: '🌳' },
    { id: 'beach', label: 'Beach', icon: '🏖️' }
  ];

  exploreItems = [
    {
      category: 'heritage',
      name: 'Sri Vadapalani Andavar Temple',
      type: 'Temple',
      image: 'assets/images/206_Vadapazh_d9e660.png'
    },
    {
      category: 'heritage',
      name: 'Kapaleeswarar Temple',
      type: 'Temple',
      image: 'assets/images/182_Kapalees_b1daaa.png'
    },
    {
      category: 'heritage',
      name: 'Santhome Church',
      type: 'Church',
      image: 'assets/images/200_Santhome_8839ac.png'
    },
    {
      category: 'heritage',
      name: 'Thousand Lights Mosque',
      type: 'Mosque',
      image: 'assets/images/203_Thousand_fb4300.png'
    },
    {
      category: 'beach',
      name: 'Marina Beach',
      type: 'Beach',
      image: 'assets/images/190_MarinaBe_d29518.png'
    },
    {
      category: 'beach',
      name: 'Besant Nagar Beach',
      type: 'Beach',
      image: 'assets/images/162_BesantNa_d360e6.png'
    },
    {
      category: 'heritage',
      name: 'Chennai Central Station',
      type: 'Heritage Station',
      image: 'assets/images/164_Central__225271.png'
    },
    {
      category: 'park',
      name: 'Marina Lighthouse',
      type: 'Landmark',
      image: 'assets/images/185_Lighthou_f5bdae.png'
    }
  ];

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private backNavService: BackNavigationService
  ) {
    const state = history.state;
    if (state && state.activeTab) {
      this.currentTab = state.activeTab;
    }
  }

  ionViewWillEnter() {
    this.registerBackHandler();
  }

  ionViewWillLeave() {
    this.backNavService.unregisterHandler('home-page');
  }

  private registerBackHandler() {
    this.backNavService.registerHandler('home-page', () => {
      if (this.showEiModal) {
        this.showEiModal = false;
        return true;
      }
      if (this.showPhoneEdit) {
        this.showPhoneEdit = false;
        return true;
      }
      if (this.currentTab !== 'home') {
        this.currentTab = 'home';
        return true;
      }
      // If on main 'home' tab, let backNavService exit the app
      return false;
    }, 10);
  }

  ngOnInit() {
    this.registerBackHandler();
    this.loadUserPhone();
    this.loadActiveTickets();
    this.startCountdownTimer();
    this.startBannerSlider();
    this.startSearchSuggestionSlider();

    const hasChecked = sessionStorage.getItem('has_checked_active_ticket_on_boot');
    if (!hasChecked) {
      sessionStorage.setItem('has_checked_active_ticket_on_boot', 'true');
      if (this.activeTickets && this.activeTickets.length > 0) {
        this.viewTicketDetails(this.activeTickets[0]);
      }
    }

    // Lazy load Google Map after page rendering completes
    setTimeout(() => {
      this.initGoogleMap();
    }, 400);
  }

  ngOnDestroy() {
    this.backNavService.unregisterHandler('home-page');
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.pressTimer) clearTimeout(this.pressTimer);
    if (this.bannerTimer) clearInterval(this.bannerTimer);
    if (this.suggestionTimer) clearInterval(this.suggestionTimer);
    if (this.liveBusInterval) clearInterval(this.liveBusInterval);
    this.clearBusMarkers();
    this.clearRouteGraphics();
    if (this.mapInstance) {
      try {
        this.mapInstance.remove();
      } catch (e) { }
      this.mapInstance = null;
    }
  }

  openBusOtp() {
    this.router.navigate(['/bus-otp']);
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
  }

  private touchStartX = 0;

  onTouchStart(event: any) {
    if (event && event.touches && event.touches.length > 0) {
      this.touchStartX = event.touches[0].clientX;
    }
  }

  onTouchEnd(event: any) {
    if (event && event.changedTouches && event.changedTouches.length > 0) {
      const touchEndX = event.changedTouches[0].clientX;
      const diff = this.touchStartX - touchEndX;

      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          this.setBannerIndex((this.activeBannerIndex + 1) % 2);
        } else {
          this.setBannerIndex((this.activeBannerIndex - 1 + 2) % 2);
        }
      }
    }
  }



  private intervalId: any;
  private pressTimer: any;

  setTab(tab: 'home' | 'passes' | 'live' | 'ticket' | 'profile') {
    this.currentTab = tab;
    if (tab === 'ticket') {
      this.loadActiveTickets();
    }
    // Auto trigger map resize if tab switches back to home
    if (tab === 'home') {
      setTimeout(() => {
        if (this.mapInstance) {
          const google = (window as any).google;
          if (google && google.maps) {
            google.maps.event.trigger(this.mapInstance, 'resize');
          }
        } else {
          this.initGoogleMap();
        }
      }, 300);
    }
  }

  // Search suggestions transition timer
  startSearchSuggestionSlider() {
    this.suggestionTimer = setInterval(() => {
      this.suggestionIndex = (this.suggestionIndex + 1) % this.suggestions.length;
      this.searchQuerySuggestion = this.suggestions[this.suggestionIndex];
    }, 3800);
  }

  // Automatic Banner slider timers
  startBannerSlider() {
    this.bannerTimer = setInterval(() => {
      this.activeBannerIndex = (this.activeBannerIndex + 1) % 2;
    }, 5000);
  }

  setBannerIndex(index: number) {
    this.activeBannerIndex = index;
    if (this.bannerTimer) {
      clearInterval(this.bannerTimer);
    }
    this.startBannerSlider();
  }

  // Category Filtering
  get filteredExploreItems() {
    return this.exploreItems.filter(item => item.category === this.selectedExploreCategory);
  }

  selectExploreCategory(catId: any) {
    this.selectedExploreCategory = catId;
  }

  // Dynamic Google Map setup
  initGoogleMap() {
    if (this.mapInstance) return;

    // Set up auth failure callback for fallback
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps authentication failed (RefererNotAllowedMapError). Falling back to Leaflet Map.');
      this.fallbackToLeafletMap();
    };

    // Register global callback for async script loading
    (window as any).initGoogleMapsCallback = () => {
      this.setupGoogleMap();
    };

    if ((window as any).google && (window as any).google.maps) {
      this.setupGoogleMap();
      return;
    }

    // Load Google Maps Script with loading=async and callback parameter
    const js = document.createElement('script');
    js.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDG0PcCR4V0Nz0Vwf4TD_iCQlCCGZzsUug&loading=async&callback=initGoogleMapsCallback';
    js.async = true;
    js.defer = true;
    js.onerror = () => {
      console.log('Google Maps failed to load, utilizing Leaflet fallback.');
      this.fallbackToLeafletMap();
    };
    document.body.appendChild(js);
  }

  fallbackToLeafletMap() {
    this.isGoogleMap = false;
    this.mapInstance = null;
    const container = document.getElementById('home-map');
    if (container) {
      container.innerHTML = ''; // clear Google Map error layout
    }
    this.initLeafletMap();
  }

  initLeafletMap() {
    if (this.mapInstance) return;

    if ((window as any).L) {
      this.setupLeafletMap();
      return;
    }

    // Load Leaflet CSS
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    // Load Leaflet Script
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => {
      this.setupLeafletMap();
    };
    js.onerror = () => {
      console.log('Leaflet stylesheet failed to load, utilizing CSS fallback grid.');
    };
    document.body.appendChild(js);
  }

  setupLeafletMap() {
    const L = (window as any).L;
    if (!L) return;

    try {
      const container = document.getElementById('home-map');
      if (!container) return;

      this.mapInstance = L.map('home-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([12.9865, 80.2524], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 12
      }).addTo(this.mapInstance);

      // Custom user icon to show active user position
      const userIcon = L.divIcon({
        className: 'custom-leaflet-user-icon',
        html: `<div style="background-color: #ff3b30; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 6px rgba(255, 59, 48, 0.25); border: 2.5px solid white;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      // Place user marker
      L.marker([12.9865, 80.2524], { icon: userIcon }).addTo(this.mapInstance);

      // Draw initial bus markers if tracking is active
      this.updateBusMarkers();
    } catch (e) {
      console.error('Error starting Leaflet Map fallback:', e);
    }
  }

  setupGoogleMap() {
    const google = (window as any).google;
    if (!google || !google.maps) return;

    try {
      const container = document.getElementById('home-map');
      if (!container) return;

      const mapOptions = {
        center: { lat: 12.9865, lng: 80.2524 },
        zoom: 14,
        disableDefaultUI: true,
        styles: [
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#7c7c82' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#c9e5ff' }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }]
          }
        ]
      };

      this.mapInstance = new google.maps.Map(container, mapOptions);

      // Custom user marker
      this.userMarker = new google.maps.Marker({
        position: { lat: 12.9865, lng: 80.2524 },
        map: this.mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#ff3b30',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5
        }
      });

      // Draw initial bus markers if tracking is active
      this.updateBusMarkers();
      this.startLiveBusTimer();
    } catch (e) {
      console.error('Error starting Google Map:', e);
    }
  }

  updateBusMarkers() {
    if (!this.mapInstance) return;

    if (!this.mapTrackingActive) {
      this.clearBusMarkers();
      return;
    }

    if (this.isGoogleMap) {
      const google = (window as any).google;
      if (!google || !google.maps) return;

      // Draw/update bus markers
      if (this.busMarkers.length === 0) {
        this.busPaths.forEach((path, idx) => {
          const coords = path[this.busIndices[idx]];
          const marker = new google.maps.Marker({
            position: { lat: coords[0], lng: coords[1] },
            map: this.mapInstance,
            icon: {
              url: 'assets/bus_history.png', // Scaled bus history icon
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16)
            }
          });
          this.busMarkers.push(marker);
        });
      } else {
        this.busMarkers.forEach((marker, idx) => {
          const path = this.busPaths[idx];
          const coords = path[this.busIndices[idx]];
          marker.setPosition({ lat: coords[0], lng: coords[1] });
        });
      }
    } else {
      // Leaflet Map fallback bus markers setup
      const L = (window as any).L;
      if (!L) return;

      const busIcon = L.divIcon({
        className: 'custom-leaflet-bus-icon',
        html: `<div style="background-color: #005ae6; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,90,230,0.4); border: 2px solid white; transform: translate(-2px, -2px);">
                 <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                   <path d="M18.8 4H5.2C4 4 3 5 3 6.2v10.6c0 1.2 1 2.2 2.2 2.2l-.8 1v1c0 .5.4 1 1 1h13.2c.6 0 1-.5 1-1v-1l-.8-1c1.2 0 2.2-1 2.2-2.2V6.2c0-1.2-1-2.2-2.2-2.2zM9 16c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm6 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4-5H5V7h14v4z"/>
                 </svg>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (this.busMarkers.length === 0) {
        this.busPaths.forEach((path, idx) => {
          const coords = path[this.busIndices[idx]];
          const marker = L.marker(coords, { icon: busIcon }).addTo(this.mapInstance);
          this.busMarkers.push(marker);
        });
      } else {
        this.busMarkers.forEach((marker, idx) => {
          const path = this.busPaths[idx];
          const coords = path[this.busIndices[idx]];
          marker.setLatLng(coords);
        });
      }
    }
  }

  clearBusMarkers() {
    this.busMarkers.forEach(marker => {
      try {
        if (this.isGoogleMap) {
          marker.setMap(null);
        } else {
          marker.remove();
        }
      } catch (e) {}
    });
    this.busMarkers = [];
  }

  clearRouteGraphics() {
    // Graphics are managed natively by dynamic map configurations
  }

  startLiveBusTimer() {
    if (this.liveBusInterval) clearInterval(this.liveBusInterval);
    this.liveBusInterval = setInterval(() => {
      if (this.mapTrackingActive) {
        // Advance indices
        this.busIndices = this.busIndices.map((val, idx) => {
          return (val + 1) % this.busPaths[idx].length;
        });
        this.updateBusMarkers();
      }
    }, 2500); // Update positions every 2.5 seconds
  }

  toggleMapTracking() {
    this.mapTrackingActive = !this.mapTrackingActive;
    this.resetMapZoom();
  }

  // Profile phone number methods
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

  // Long press detection helper methods
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

  // QR Modal methods
  openQrModal(event: Event) {
    event.stopPropagation();
    this.showQrModal = true;
  }

  closeQrModalAndNavigate() {
    this.showQrModal = false;
    this.router.navigate(['/booking']);
  }

  closeQrModalOnly(event: Event) {
    event.stopPropagation();
    this.showQrModal = false;
  }

  // Active tickets methods
  loadActiveTickets() {
    const stored = localStorage.getItem('active_tickets');
    let list: any[] = [];
    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch (e) {
        list = [];
      }
    }

    const now = Date.now();
    // Sort all tickets by expiryTime descending (newest first)
    list.sort((a: any, b: any) => b.expiryTime - a.expiryTime);

    this.activeTickets = list.filter((t: any) => t.expiryTime > now);
    this.updateCountdownStrings();

    // 1. Format Active Tickets (Grayscale / not dull B/W style)
    this.formattedActiveTickets = this.activeTickets.map((t: any) => {
      let dateStr = '';
      if (t.date) {
        const cleanDate = t.date.replace(',', '');
        const cleanTime = (t.arrivalTime || '').toLowerCase();
        dateStr = `${cleanDate} • ${cleanTime}`;
      } else {
        dateStr = '14 Jul 2026 • 12:30 pm';
      }

      // Format countdown string
      const diff = t.expiryTime - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const countdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      return {
        id: t.id,
        source: t.source ? t.source.toUpperCase() : 'CHENNAI ONE IT SEZ',
        destination: t.destination ? t.destination.toUpperCase() : 'NAVALUR',
        amount: t.amount || 23,
        dateStr: dateStr,
        isExpired: false,
        bus: t.bus,
        type: t.type,
        persons: t.persons,
        ticketCode: t.ticketCode,
        vehicle: t.vehicle,
        ticketNo: t.ticketNo,
        expiryTime: t.expiryTime,
        date: t.date,
        arrivalTime: t.arrivalTime,
        validityTime: t.validityTime,
        time24: t.time24,
        countdownStr: countdown
      };
    });

    // 2. Format Expired (Past) Tickets
    const expiredRealTickets = list.filter((t: any) => t.expiryTime <= now);
    const formattedExpired = expiredRealTickets.map((t: any) => {
      let dateStr = '';
      if (t.date) {
        const cleanDate = t.date.replace(',', '');
        const cleanTime = (t.arrivalTime || '').toLowerCase();
        dateStr = `${cleanDate} • ${cleanTime}`;
      } else {
        dateStr = '14 Jul 2026 • 12:30 pm';
      }

      return {
        id: t.id,
        source: t.source ? t.source.toUpperCase() : 'CHENNAI ONE IT SEZ',
        destination: t.destination ? t.destination.toUpperCase() : 'NAVALUR',
        amount: t.amount || 23,
        dateStr: dateStr,
        isExpired: true,
        bus: t.bus,
        type: t.type,
        persons: t.persons,
        ticketCode: t.ticketCode,
        vehicle: t.vehicle,
        ticketNo: t.ticketNo,
        expiryTime: t.expiryTime,
        date: t.date,
        arrivalTime: t.arrivalTime,
        validityTime: t.validityTime,
        time24: t.time24,
        countdownStr: t.countdownStr
      };
    });

    if (formattedExpired.length > 0) {
      this.allTickets = formattedExpired;
    } else {
      this.allTickets = this.mockPastTickets;
    }
  }

  startCountdownTimer() {
    this.intervalId = setInterval(() => {
      this.loadActiveTickets();
    }, 1000);
  }

  updateCountdownStrings() {
    const now = Date.now();
    this.activeTickets.forEach((t: any) => {
      const diff = t.expiryTime - now;
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        t.countdownStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      } else {
        t.countdownStr = '00:00:00';
      }
    });
  }

  viewTicketDetails(ticket: any) {
    if (!ticket.id) return; // Prevent navigation for mock/placeholder tickets
    this.router.navigate(['/ticket-generation'], {
      state: {
        id: ticket.id,
        bus: ticket.bus,
        type: ticket.type,
        vehicle: ticket.vehicle,
        amount: ticket.amount,
        persons: ticket.persons,
        ticket: ticket.ticketCode,
        source: ticket.source,
        destination: ticket.destination,
        date: ticket.date,
        arrivalTime: ticket.arrivalTime,
        validityTime: ticket.validityTime,
        expiryTime: ticket.expiryTime,
        ticketNo: ticket.ticketNo,
        time24: ticket.time24,
        referrerTab: 'ticket',
        referrer: '/home'
      }
    });
  }

  openSearch() {
    this.showSearch = true;
    this.searchQuery = '';
    this.filteredRecentSearches = [...this.recentSearches];
  }

  closeSearch() {
    this.showSearch = false;
  }

  selectSearchItem(item: any) {
    this.showSearch = false;
    if (item.type === 'route') {
      this.router.navigate(['/booking'], {
        state: { busNo: item.title }
      });
    } else {
      this.router.navigate(['/booking'], {
        state: { destination: item.title }
      });
    }
  }

  onSearchQueryChange() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredRecentSearches = [...this.recentSearches];
      return;
    }
    this.filteredRecentSearches = this.recentSearches.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.subtitle.toLowerCase().includes(query)
    );
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

        // Write file to Cache directory
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        // Trigger native Android share/save dialog so user can select File Manager / Downloads
        await Share.share({
          title: 'Export Chennai One Data',
          text: 'Chennai One Bus Data & Ticket History Backup',
          url: savedFile.uri,
          dialogTitle: 'Save JSON to Downloads or File Manager'
        });

        this.importStatusMessage = '✓ Export ready! Select "Save to Files" or File Manager to save your JSON backup.';
      } else {
        // Standard Browser download
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
        if (data.last_used_bus) {
          localStorage.setItem('last_used_bus', data.last_used_bus);
        }
        if (data.user_phone) {
          localStorage.setItem('user_phone', data.user_phone);
          this.userPhone = data.user_phone;
        }

        // Refresh UI state
        this.loadActiveTickets();
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

  // ================= MAP ZOOM & PAN INTERACTIVE METHODS =================
  zoomInMap() {
    this.mapZoomScale = Math.min(3.5, Number((this.mapZoomScale + 0.3).toFixed(2)));
  }

  zoomOutMap() {
    this.mapZoomScale = Math.max(1.0, Number((this.mapZoomScale - 0.3).toFixed(2)));
    if (this.mapZoomScale === 1.0) {
      this.mapPanX = 0;
      this.mapPanY = 0;
    } else {
      this.clampMapPan();
    }
  }

  resetMapZoom() {
    this.mapZoomScale = 1.0;
    this.mapPanX = 0;
    this.mapPanY = 0;
  }

  recenterMap() {
    this.resetMapZoom();
  }

  onMapWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.15 : -0.15;
    this.mapZoomScale = Math.min(3.5, Math.max(1.0, Number((this.mapZoomScale + delta).toFixed(2))));
    if (this.mapZoomScale === 1.0) {
      this.mapPanX = 0;
      this.mapPanY = 0;
    } else {
      this.clampMapPan();
    }
  }

  onMapMouseDown(event: MouseEvent) {
    if (this.mapZoomScale <= 1.0) return;
    this.isMapDragging = true;
    this.mapDragStartX = event.clientX;
    this.mapDragStartY = event.clientY;
    this.mapPanStartX = this.mapPanX;
    this.mapPanStartY = this.mapPanY;
  }

  onMapMouseMove(event: MouseEvent) {
    if (!this.isMapDragging || this.mapZoomScale <= 1.0) return;
    const dx = event.clientX - this.mapDragStartX;
    const dy = event.clientY - this.mapDragStartY;
    this.mapPanX = this.mapPanStartX + dx;
    this.mapPanY = this.mapPanStartY + dy;
    this.clampMapPan();
  }

  onMapMouseUp() {
    this.isMapDragging = false;
  }

  onMapTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
      this.initialTouchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
      this.initialTouchScale = this.mapZoomScale;
      this.isMapDragging = false;
    } else if (event.touches.length === 1 && this.mapZoomScale > 1.0) {
      this.isMapDragging = true;
      this.mapDragStartX = event.touches[0].clientX;
      this.mapDragStartY = event.touches[0].clientY;
      this.mapPanStartX = this.mapPanX;
      this.mapPanStartY = this.mapPanY;
    }
  }

  onMapTouchMove(event: TouchEvent) {
    if (event.touches.length === 2 && this.initialTouchDistance > 0) {
      const currentDist = this.getTouchDistance(event.touches[0], event.touches[1]);
      const scaleFactor = currentDist / this.initialTouchDistance;
      const newScale = Math.min(3.5, Math.max(1.0, Number((this.initialTouchScale * scaleFactor).toFixed(2))));
      this.mapZoomScale = newScale;
      if (this.mapZoomScale === 1.0) {
        this.mapPanX = 0;
        this.mapPanY = 0;
      } else {
        this.clampMapPan();
      }
    } else if (event.touches.length === 1 && this.isMapDragging && this.mapZoomScale > 1.0) {
      const dx = event.touches[0].clientX - this.mapDragStartX;
      const dy = event.touches[0].clientY - this.mapDragStartY;
      this.mapPanX = this.mapPanStartX + dx;
      this.mapPanY = this.mapPanStartY + dy;
      this.clampMapPan();
    }
  }

  onMapTouchEnd(event: TouchEvent) {
    if (event.touches.length < 2) {
      this.initialTouchDistance = 0;
    }
    if (event.touches.length === 0) {
      this.isMapDragging = false;
    }
  }

  private getTouchDistance(t1: Touch, t2: Touch): number {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private clampMapPan() {
    const maxPan = (this.mapZoomScale - 1) * 160;
    this.mapPanX = Math.max(-maxPan, Math.min(maxPan, this.mapPanX));
    this.mapPanY = Math.max(-maxPan, Math.min(maxPan, this.mapPanY));
  }
}