import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { lookupBusDetails, lookupLocalBusDetails, BusLookupResult } from '../../services/mtc-bus-lookup.service';

import {
  IonContent
} from '@ionic/angular/standalone';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

@Component({

  selector: 'app-booking',

  templateUrl: './booking.page.html',

  styleUrls: [
    './booking.page.scss'
  ],

  standalone: true,

  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  imports: [
    IonContent,
    CommonModule,
    FormsModule
  ]

})

export class BookingPage implements OnInit {

  routesCache: Record<string, any> = {};
  customBusData: Record<string, any> = {};
  globalCustomStops: string[] = [];
  isLoading = false;
  isOfflineMode = false;
  editingBusInput = '';

  // MTC Bus live data (fetched silently in background)
  busLiveData: BusLookupResult | null = null;
  liveNextStop = '';
  livePrevStop = '';
  liveStatus = '';
  private liveRouteNo = ''; // route_no from live API
  userHasChangedDestination = false; // Flag to prevent overwriting user selection once user manually changes destination/source

  /** Displays clean route_no (strips suffix after space e.g. "102X AT" -> "102X", "18P Kl" -> "18P", "M70 R" -> "M70") */
  get displayRouteNo(): string {
    const raw = (this.liveRouteNo || this.busNo || '').trim();
    return raw.split(' ')[0];
  };

  showSourceSelect = true;
  showDestSelect = true;
  sourceSearchQuery = '';
  destSearchQuery = '';
  isEditingBus = false;

  busList = [
    '555S',
    '570S',
    'MAA2',
    '19',
    '102P',
    '102Xct'
  ];

  busTypes = [
    'Ordinary',
    'Delux',
    'Express',
    'AC'
  ];

  
  busType = 'Delux';

  get busImage() {
    const type = (this.busType || '').toLowerCase();
    if (type.includes('express') || type.includes('delux') || type.includes('deluxe') || type.includes('lf')) {
      return 'assets/images/mt_ic_deluxe_service.webp';  // Deluxe & Express Bus
    } else if (type.includes('ac')) {
      return 'assets/images/mt_ic_ac_service.webp';      // AC Bus
    } else if (type.includes('ordinary') || type.includes('pink')) {
      return 'assets/images/mt_ic_pink_bus.png';         // Ordinary Pink Bus
    } else {
      return 'assets/images/mt_ic_deluxe_service.webp';  // Deluxe Bus default
    }
  }
  busNo = '570S';
  source = 'M.G.R.KOYAMBEDU';
  destination = 'KELAMBAKKAM';
  showSource = false;
  showDestination = false;

  sourceStops = [
    'Navalur',
    'Kelambakkam',
    'Perungudi',
    'Sholinganallur'
  ];

  destinationStops = [
    'Siruseri I.T.Park',
    'SIPCOT',
    'Tidel Park',
    'OMR'
  ];

  constructor(
    private router: Router
  ) {

    const state = history.state;

    this.ticketCode =
      state.ticket || '';

    this.loadCustomBusData();
  }

  loadCustomBusData() {
    try {
      const stored = localStorage.getItem('custom_bus_data');
      if (stored) {
        this.customBusData = JSON.parse(stored);
      }
      const globalStops = localStorage.getItem('global_custom_stops');
      if (globalStops) {
        this.globalCustomStops = JSON.parse(globalStops);
      }
      const globalRates = localStorage.getItem('global_custom_rates');
      if (globalRates) {
        this.globalCustomRates = JSON.parse(globalRates);
      }
    } catch (e) {
      console.error('Failed to load custom bus data', e);
    }
  }

  saveCustomBusData() {
    try {
      localStorage.setItem('custom_bus_data', JSON.stringify(this.customBusData));
      localStorage.setItem('global_custom_stops', JSON.stringify(this.globalCustomStops));
      localStorage.setItem('global_custom_rates', JSON.stringify(this.globalCustomRates));
    } catch (e) {}
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  async ngOnInit() {
    // Logic moved to ionViewWillEnter to handle Ionic page caching
  }

  async ionViewWillEnter() {
    this.userHasChangedDestination = false;
    this.showSourceSelect = false;
    this.showDestSelect = true; // Destination dropdown open by default
    this.destination = ''; // Keep destination unselected by default

    const state = history.state;
    this.isOfflineMode = !!(state && state.isOffline);

    if (state && state.ticket !== undefined) {
      this.ticketCode = state.ticket || '';
    }

    const otp = this.ticketCode.trim().toUpperCase();
    let mappedBus: string | null = null;

    if (otp) {
      try {
        const otpMapStr = localStorage.getItem('otp_bus_map');
        if (otpMapStr) {
          const otpMap = JSON.parse(otpMapStr);
          if (otpMap[otp]) mappedBus = otpMap[otp];
        }
      } catch (e) {}
    }

    // Load default route data from local database (mtc_routes_db.json / mtc_database.db)
    await this.loadRoutes();

    if (this.isOfflineMode) {
      // OFFLINE MODE: Check local DB asset for bus details
      let foundInLocalDb = false;
      if (otp) {
        try {
          const localInfo = await lookupLocalBusDetails(otp);
          if (localInfo && localInfo.found_in_local_db) {
            foundInLocalDb = true;
            if (localInfo.route_no) mappedBus = localInfo.route_no;
            this.applyBusType(localInfo.bus_type || '');
            if (localInfo.source) this.source = localInfo.source;
          }
        } catch (e) {
          console.warn('Local bus lookup error:', e);
        }
      }

      if (mappedBus) {
        this.busNo = mappedBus;
      } else if (otp && foundInLocalDb) {
        this.busNo = otp;
      } else {
        // Fallback: If bus no is not present in local DB, use last travel bus
        const lastUsedBus = localStorage.getItem('last_used_bus');
        if (lastUsedBus) {
          this.busNo = lastUsedBus;
        } else {
          this.busNo = '570S';
        }
      }

      localStorage.setItem('last_used_bus', this.busNo);
      this.liveRouteNo = this.busNo.split(' ')[0];
      this.updateStopsForBus();

      // If route missing in local DB, fetch from web route URL
      const routeKey = this.busNo.trim().toUpperCase();
      const baseRoute = routeKey.split(' ')[0];
      if (!this.routesCache[routeKey] && !this.routesCache[baseRoute]) {
        this.isLoading = true;
        try {
          const webData = await this.fetchRouteFromWeb(baseRoute);
          if (webData) {
            this.routesCache[baseRoute] = webData;
            localStorage.setItem('mtc_routes', JSON.stringify(this.routesCache));
            this.updateStopsForBus();
          }
        } catch (e) {
          console.warn('Offline web route fetch fallback failed:', e);
        } finally {
          this.isLoading = false;
        }
      }
    } else {
      // ONLINE MODE
      if (mappedBus) {
        this.busNo = mappedBus;
      } else if (otp) {
        this.busNo = otp;
      } else {
        const lastUsedBus = localStorage.getItem('last_used_bus');
        if (lastUsedBus) this.busNo = lastUsedBus;
      }

      // Check if pre-fetched busData was passed in history.state from OTP page
      if (state && state.busData) {
        this.applyBusData(state.busData);
      } else if (this.busNo) {
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        try {
          const localInfo = await lookupLocalBusDetails(this.busNo);
          if (localInfo && localInfo.found_in_local_db) {
            if (localInfo.route_no) this.liveRouteNo = localInfo.route_no;
            this.applyBusType(localInfo.bus_type || '');
            if (localInfo.source) this.source = localInfo.source;
          } else if (this.routesCache[this.busNo.trim().toUpperCase()]) {
            this.liveRouteNo = this.busNo.trim().toUpperCase();
          }
        } catch (e) {
          console.warn('Local bus lookup error:', e);
        }

        this.updateStopsForBus();

        if (isOnline) {
          this.fetchLiveBusDetails(this.busNo);
        }
      }

      localStorage.setItem('last_used_bus', this.busNo);
    }
  }

  applyBusType(typeStr: string) {
    const t = (typeStr || '').toLowerCase();
    if (t.includes('delux') || t.includes('deluxe') || t.includes('express') || t.includes('lf bus') || t.includes('lf(')) {
      this.busType = 'Delux'; // Blue Deluxe Bus for Deluxe & Express
    } else if (t.includes('ac')) {
      this.busType = 'AC'; // Red Bus
    } else if (t.includes('ordinary')) {
      this.busType = 'Ordinary'; // Pink Bus
    } else {
      this.busType = 'Delux'; // Default Blue Deluxe Bus
    }
  }

  /**
   * Applies structured bus data (e.g. from lookup_K1196.json or live lookup).
   */
  applyBusData(data: BusLookupResult) {
    this.busLiveData = data;

    if (data.bus_no) {
      this.busNo = data.bus_no;
    }

    if (data.route_no) {
      this.liveRouteNo = data.route_no.trim().split(' ')[0];
    }

    if (data.bus_type) {
      this.applyBusType(data.bus_type);
    }

    this.liveStatus = data.live_status || 'Unknown';
    this.liveNextStop = data.next_stop || '';
    this.livePrevStop = data.previous_stop || '';

    // Extract stops array from route_boarding_points or route_stops
    const rawStops = (data as any).route_boarding_points || data.route_stops || [];
    const stopsList = rawStops.map((s: any) => s.stop_name || s.station_name).filter(Boolean);

    if (stopsList.length > 0) {
      const merged = Array.from(new Set([...stopsList, ...this.globalCustomStops]));
      this.sourceStops = merged;
      this.destinationStops = merged;

      // Clean parenthetical direction notes from next_stop e.g. "Tidel Park (Towards Jayanthi Theatre)" -> "Tidel Park"
      const rawNext = data.next_stop || '';
      const cleanNext = rawNext.replace(/\s*\([^)]*\)/g, '').trim();

      if (!this.userHasChangedDestination) {
        if (cleanNext && data.live_status && data.live_status.toUpperCase().includes('LIVE')) {
          const matchNext = merged.find(s => s.toLowerCase() === cleanNext.toLowerCase());
          this.source = matchNext || cleanNext;
        } else if (data.source) {
          const matchSrc = merged.find(s => s.toLowerCase() === data.source!.toLowerCase());
          this.source = matchSrc || data.source;
        }

        // Keep destination unselected by default and show destination dropdown
        this.destination = '';
        this.showDestSelect = true;
        this.showSourceSelect = false;
      }
    } else {
      this.updateStopsForBus();
    }
  }

  // ─── MTC LIVE BUS LOOKUP (background, no UI feedback) ────────────────

  /**
   * Silently fetches live bus data in the background via MTC API.
   * - Once fetched, updates route_no, bus_type, stops, and source = next_stop if live
   * - IF user has changed destination/source manually, skips overwriting their selection!
   */
  async fetchLiveBusDetails(busNo: string) {
    try {
      const data = await lookupBusDetails(busNo);
      this.busLiveData = data;

      // Update internal bus number (fuzzy match)
      if (data.bus_no) {
        this.busNo = data.bus_no;
        try {
          const m = localStorage.getItem('otp_bus_map');
          const map = m ? JSON.parse(m) : {};
          map[busNo] = data.bus_no;
          localStorage.setItem('otp_bus_map', JSON.stringify(map));
        } catch (e) {}
      }

      // Update displayed route number (cleaned before space)
      if (data.route_no) {
        this.liveRouteNo = data.route_no.trim().split(' ')[0];
      }

      // Map bus type consistently
      if (data.bus_type) {
        this.applyBusType(data.bus_type);
      }

      // Store live stop info
      this.liveStatus = data.live_status || 'Unknown';
      this.liveNextStop = data.next_stop || '';
      this.livePrevStop = data.previous_stop || '';

      // Build stops list from route_boarding_points or route_stops
      const rawStops = (data as any).route_boarding_points || data.route_stops || [];
      const apiStops = rawStops.map((s: any) => s.stop_name || s.station_name).filter(Boolean);

      if (apiStops.length > 0) {
        const merged = Array.from(new Set([...apiStops, ...this.globalCustomStops]));
        this.sourceStops = merged;
        this.destinationStops = merged;
      }

      // ★ CRITICAL: If the user has already changed/selected a destination or source,
      // DO NOT overwrite their selections with background live data!
      if (this.userHasChangedDestination) {
        console.log('User has manually selected/changed destination or source stop — keeping user selection intact.');
        return;
      }

      // Clean next_stop string: remove direction notes e.g. "Tidel Park (Towards Jayanthi Theatre)" -> "Tidel Park"
      const rawNext = data.next_stop || '';
      const cleanNext = rawNext.replace(/\s*\([^)]*\)/g, '').trim();

      if (apiStops.length > 0) {
        const merged = this.sourceStops;

        // Default: set source = route origin (from_station)
        if (data.source) {
          const matchSrc = merged.find(s => s.toLowerCase() === data.source!.toLowerCase());
          this.source = matchSrc || data.source;
        }

        // Set destination = route terminal
        if (data.destination) {
          const matchDst = merged.find(s => s.toLowerCase() === data.destination!.toLowerCase());
          this.destination = matchDst || data.destination;
        }

        // ★ Update source to cleanNext if bus is live
        if (cleanNext && data.live_status && data.live_status.toUpperCase().includes('LIVE')) {
          const matchNext = merged.find(s => s.toLowerCase() === cleanNext.toLowerCase());
          this.source = matchNext || cleanNext;
        }

      } else if (data.source || data.destination) {
        if (data.source) this.source = data.source;
        if (data.destination) this.destination = data.destination;
        if (cleanNext && data.live_status && data.live_status.toUpperCase().includes('LIVE')) {
          this.source = cleanNext;
        }
      }

    } catch (err: any) {
      // Completely silent — app works normally with DB data if live fails
      console.warn('MTC live lookup (background):', err?.message);
    }
  }

  async loadRoutes() {
    try {
      let cachedData: Record<string, any> = {};
      const cached = localStorage.getItem('mtc_routes');
      if (cached) {
        cachedData = JSON.parse(cached);
      }

      try {
        const res = await fetch('assets/mtc_routes_db.json');
        const dbRoutes = await res.json();
        this.routesCache = {
          ...dbRoutes,
          ...cachedData
        };
      } catch (err) {
        console.error('Failed to load mtc_routes_db.json, using localStorage cache only:', err);
        this.routesCache = cachedData;
      }

      localStorage.setItem('mtc_routes', JSON.stringify(this.routesCache));

      let usedBuses: string[] = [];
      try {
        const stored = localStorage.getItem('active_tickets');
        if (stored) {
          const tickets = JSON.parse(stored);
          tickets.forEach((t: any) => {
            if (t.bus) usedBuses.push(t.bus.toUpperCase());
          });
        }
      } catch (e) {
        console.error('Failed to parse active_tickets for busList:', e);
      }

      const keys = Object.keys(this.routesCache);
      if (keys.length > 0) {
        this.busList = Array.from(new Set([...this.busList, ...keys, ...usedBuses]));
      } else {
        this.busList = Array.from(new Set([...this.busList, ...usedBuses]));
      }

      this.updateStopsForBus();
    } catch (e) {
      console.error('Error in loadRoutes:', e);
    }
  }

  async onBusNoChange() {
    this.userOverridePrice = null;
    const route = this.busNo.trim().toUpperCase().split(' ')[0];
    if (!route) return;

    this.liveRouteNo = route;
    this.userHasChangedDestination = true; // Lock user modification

    this.updateStopsForBus();
    this.fetchLiveBusDetails(route);

    if (!this.routesCache[route]) {
      const baseRoute = route.split(' ')[0];
      if (this.routesCache[baseRoute]) {
        this.routesCache[route] = this.routesCache[baseRoute];
        this.updateStopsForBus();
      } else {
        this.isLoading = true;
        try {
          const data = await this.fetchRouteFromWeb(route);
          if (data) {
            this.routesCache[route] = data;
            localStorage.setItem('mtc_routes', JSON.stringify(this.routesCache));
            if (!this.busList.includes(route)) {
              this.busList.push(route);
            }
            this.updateStopsForBus();
          }
        } catch (e) {
          console.error('Failed to fetch route:', e);
        } finally {
          this.isLoading = false;
        }
      }
    }
  }

  updateStopsForBus() {
    const rawRoute = (this.displayRouteNo || this.busNo).trim().toUpperCase();
    const baseRoute = rawRoute.split(' ')[0];
    const strippedRoute = baseRoute.replace(/(S|CT\d*|X)$/i, '');

    let stops: string[] = [];
    let defaultSource = 'M.G.R.KOYAMBEDU';
    let defaultDest = 'KELAMBAKKAM';

    // Look up route in routesCache (from mtc_database.db / mtc_routes_db.json)
    const data = this.routesCache[rawRoute] ||
                 this.routesCache[this.busNo.trim().toUpperCase()] ||
                 this.routesCache[baseRoute] ||
                 this.routesCache[strippedRoute];

    if (data && data.stages && data.stages.length > 0) {
      stops = data.stages.map((s: any) => s.stage_name);
      defaultSource = data.origin || data.stages[0].stage_name || stops[0];
      defaultDest = data.destination || data.stages[data.stages.length - 1].stage_name || stops[stops.length - 1];
    }

    const customData = this.customBusData[rawRoute] || this.customBusData[this.busNo.trim().toUpperCase()] || { customStops: [] };
    const routeCustomStops = customData.customStops || [];
    
    // Merge standard stops from database with custom stops
    const allStops = Array.from(new Set([...stops, ...routeCustomStops, ...this.globalCustomStops]));
    
    if (allStops.length > 0) {
      this.sourceStops = allStops;
      this.destinationStops = allStops;
    }

    if (!this.userHasChangedDestination) {
      this.source = customData.lastSource || defaultSource;
      this.destination = '';
      this.showDestSelect = true;
      this.showSourceSelect = false;
    }
  }

  async fetchRouteFromWeb(routeNo: string): Promise<any> {
    const cleanRoute = routeNo.trim().toUpperCase();
    if (!cleanRoute) return null;

    let data = await this.doFetchAndParse(cleanRoute);
    
    // Fuzzy fallback 1: if ends with 'S' and fails, try without 'S'
    if (!data && cleanRoute.endsWith('S') && cleanRoute.length > 1) {
      const fallbackRoute = cleanRoute.slice(0, -1);
      data = await this.doFetchAndParse(fallbackRoute);
      if (data) {
        data.route_no = cleanRoute;
      }
    }

    // Fuzzy fallback 2: if ends with 'CT' and fails, try without 'CT'
    if (!data && cleanRoute.endsWith('CT') && cleanRoute.length > 2) {
      const fallbackRoute = cleanRoute.slice(0, -2);
      data = await this.doFetchAndParse(fallbackRoute);
      if (data) {
        data.route_no = cleanRoute;
      }
    }

    return data;
  }

  async doFetchAndParse(routeNo: string): Promise<any> {
    const encodedRoute = encodeURIComponent(routeNo);
    const url = `https://mtcbus.tn.gov.in/Home/routewiseinfo?selroute=${encodedRoute}&submit=`;
    
    let html = '';
    try {
      const { CapacitorHttp } = await import('@capacitor/core');
      const response = await CapacitorHttp.get({
        url: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      html = response.data;
    } catch (e) {
      console.log('CapacitorHttp failed/unavailable, trying standard fetch:', e);
      const response = await fetch(url);
      html = await response.text();
    }

    if (!html) return null;

    const routeMatch = html.match(/<ul class="route">([\s\S]*?)<\/ul>/);
    const stages: { sequence: number; stage_name: string }[] = [];
    if (routeMatch) {
      const itemRegex = /<li><span>(\d+)<\/span>\s*([\s\S]*?)\s*<\/li>/g;
      let match;
      while ((match = itemRegex.exec(routeMatch[1])) !== null) {
        stages.push({
          sequence: parseInt(match[1], 10),
          stage_name: match[2].replace(/\s+/g, ' ').trim()
        });
      }
    }

    let origin = '';
    let destination = '';
    
    const originMatch = html.match(/<span class="color-brown">Origin<\/span>\s*<h5>([\s\S]*?)<\/h5>/);
    if (originMatch) {
      origin = originMatch[1].replace(/\s+/g, ' ').trim();
    }

    const destMatch = html.match(/<span class="color-dblue">Destination<\/span>\s*<h5>([\s\S]*?)<\/h5>/);
    if (destMatch) {
      destination = destMatch[1].replace(/\s+/g, ' ').trim();
    }

    if (stages.length === 0 && !origin && !destination) {
      return null;
    }

    return {
      route_no: routeNo,
      origin: origin,
      destination: destination,
      stages_count: stages.length,
      stages: stages
    };
  }



  /* PRICE */

  private readonly deluxFares = [
    0, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29,
    31, 31, 33, 33, 35, 35, 37, 37, 39, 39,
    41, 41, 43, 43, 45, 45, 47, 47, 49, 49
  ];

  private readonly acFares = [
    0, 15, 15, 20, 20, 20, 30, 30, 30, 40, 40,
    40, 40, 40, 40, 50, 50, 50, 50, 60, 60,
    60, 60, 60, 70, 70, 70, 70, 80, 80, 80
  ];

  private readonly ordinaryFares = [
    0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 15, 16, 16, 17, 17, 18, 18, 19, 19,
    20, 20, 21, 21, 22, 22, 23, 23, 24, 24
  ];

  userOverridePrice: number | null = null;

  get calculatedFare(): number {
    const route = (this.displayRouteNo || this.busNo).trim().toUpperCase();
    const key = `${this.source}|${this.destination}`;
    
    // 1. Check global custom rates first
    if (this.globalCustomRates[key] !== undefined) {
      return this.globalCustomRates[key];
    }

    // 2. Check route-specific custom rates
    const customData = this.customBusData[route];
    if (customData && customData.customRates) {
      if (customData.customRates[key] !== undefined) {
        return customData.customRates[key];
      }
    }

    // 3. Find source and destination stage indices in sourceStops (route_boarding_points)
    let sourceIdx = -1;
    let destIdx = -1;

    if (this.sourceStops && this.sourceStops.length > 0) {
      const srcNorm = (this.source || '').trim().toLowerCase();
      const dstNorm = (this.destination || '').trim().toLowerCase();
      
      sourceIdx = this.sourceStops.findIndex(s => s.trim().toLowerCase() === srcNorm);
      destIdx = this.sourceStops.findIndex(s => s.trim().toLowerCase() === dstNorm);
    }

    // Fallback: check stages in routesCache
    if (sourceIdx === -1 || destIdx === -1) {
      const data = this.routesCache[route] || this.routesCache[this.busNo.trim().toUpperCase()];
      if (data && data.stages && data.stages.length > 0) {
        if (sourceIdx === -1) {
          sourceIdx = data.stages.findIndex((s: any) => (s.stage_name || '').trim().toLowerCase() === (this.source || '').trim().toLowerCase());
        }
        if (destIdx === -1) {
          destIdx = data.stages.findIndex((s: any) => (s.stage_name || '').trim().toLowerCase() === (this.destination || '').trim().toLowerCase());
        }
      }
    }

    const typeLower = (this.busType || '').toLowerCase();

    // Default minimum fare fallback if stage positions cannot be calculated
    if (sourceIdx === -1 || destIdx === -1 || sourceIdx === destIdx) {
      if (typeLower.includes('ac') || typeLower.includes('ev') || typeLower.includes('electric')) return 15;
      if (typeLower.includes('ordinary')) return 5;
      return 13;
    }

    const stagesCount = Math.max(1, Math.abs(sourceIdx - destIdx));
    
    let fareArray = this.deluxFares;
    if (typeLower.includes('ac') || typeLower.includes('ev') || typeLower.includes('electric')) {
      fareArray = this.acFares;
    } else if (typeLower.includes('ordinary')) {
      fareArray = this.ordinaryFares;
    }

    if (stagesCount >= fareArray.length) {
      return fareArray[fareArray.length - 1];
    }
    return fareArray[stagesCount];
  }

  get ticketPrice(): number {
    if (this.userOverridePrice !== null) {
      return this.userOverridePrice;
    }
    return this.calculatedFare;
  }

  /* PERSON */

  persons = 1;

  /* TICKET CODE */

  ticketCode = '';



  /* SELECT STOPS */

  filteredSourceStops() {
    const query = this.sourceSearchQuery.trim();
    if (!query) {
      return this.sourceStops;
    }
    const lowerQuery = query.toLowerCase();
    const matches = this.sourceStops.filter(stop => stop.toLowerCase().includes(lowerQuery));
    const exactMatch = this.sourceStops.some(stop => stop.toLowerCase() === lowerQuery);
    if (!exactMatch) {
      return [query, ...matches];
    }
    return matches;
  }

  filteredDestStops() {
    const query = this.destSearchQuery.trim();
    if (!query) {
      return this.destinationStops;
    }
    const lowerQuery = query.toLowerCase();
    const matches = this.destinationStops.filter(stop => stop.toLowerCase().includes(lowerQuery));
    const exactMatch = this.destinationStops.some(stop => stop.toLowerCase() === lowerQuery);
    if (!exactMatch) {
      return [query, ...matches];
    }
    return matches;
  }

  selectSourceStop(stop: string) {
    this.userHasChangedDestination = true;
    this.source = stop;
    this.showSourceSelect = false;
    this.sourceSearchQuery = '';
    this.userOverridePrice = null;
  }

  selectDestStop(stop: string) {
    this.userHasChangedDestination = true;
    this.destination = stop;
    this.showDestSelect = false;
    this.destSearchQuery = '';
    this.userOverridePrice = null;
  }

  toggleSourceSelect() {
    this.showSourceSelect = !this.showSourceSelect;
  }

  toggleDestSelect() {
    this.showDestSelect = !this.showDestSelect;
  }

  previousBusNo = '570S';

  clearBusInput() {
    this.previousBusNo = this.busNo;
    this.editingBusInput = '';
  }

  toggleEditingBus() {
    this.isEditingBus = !this.isEditingBus;
    if (this.isEditingBus) {
      this.editingBusInput = this.busNo;
    } else {
      if (!this.editingBusInput || !this.editingBusInput.trim()) {
        this.editingBusInput = this.previousBusNo;
      }
    }
  }

  async confirmBusNoChange() {
    const rawRoute = (this.editingBusInput || '').trim().toUpperCase();
    if (!rawRoute) {
      this.isEditingBus = false;
      return;
    }

    const cleanRoute = rawRoute.split(' ')[0];
    this.busNo = cleanRoute;
    this.liveRouteNo = cleanRoute;
    localStorage.setItem('last_used_bus', cleanRoute);
    this.userHasChangedDestination = true;
    this.isEditingBus = false;

    if (this.isOfflineMode) {
      this.updateStopsForBus();
      const baseRoute = cleanRoute.split(' ')[0];
      if (!this.routesCache[cleanRoute] && !this.routesCache[baseRoute]) {
        this.isLoading = true;
        try {
          const data = await this.fetchRouteFromWeb(cleanRoute);
          if (data) {
            this.routesCache[cleanRoute] = data;
            localStorage.setItem('mtc_routes', JSON.stringify(this.routesCache));
            if (!this.busList.includes(cleanRoute)) {
              this.busList.push(cleanRoute);
            }
            this.updateStopsForBus();
          }
        } catch (e) {
          console.error('Failed to fetch route offline:', e);
        } finally {
          this.isLoading = false;
        }
      }
    } else {
      this.onBusNoChange();
    }
  }

  selectBus(bus: string) {
    const cleanBus = bus.trim().split(' ')[0];
    this.editingBusInput = cleanBus;
    this.confirmBusNoChange();
  }

  filteredBusList() {
    const query = (this.editingBusInput || '').trim().toLowerCase();
    if (!query) return this.busList;
    return this.busList.filter(b => b.toLowerCase().includes(query));
  }

  swapRouteDirection() {
    const route = this.busNo.trim().toUpperCase();
    const data = this.routesCache[route];
    if (data && data.stages) {
      data.stages = [...data.stages].reverse();
      const oldOrigin = data.origin;
      data.origin = data.destination;
      data.destination = oldOrigin;
      data.stages.forEach((s: any, idx: number) => {
        s.sequence = idx + 1;
      });
      this.updateStopsForBus();
    }
  }

  /* PERSON */

  increase() {

    this.persons++;

  }

  decrease() {

    if (
      this.persons > 1
    ) {

      this.persons--;

    }

  }

  /* TOTAL */

  get total() {

    return (
      this.ticketPrice
      *
      this.persons
    );

  }

  /* BOOK */

  showPriceEdit = false;
  editingPrice = 13;

  /* BOOK WITH LONG PRESS TO EDIT PRICE */
  private bookPressTimer: any;
  private isLongPress = false;
  private lastTouchTime = 0;

  onBookPressStart(event: Event) {
    if (event.type === 'mousedown' && Date.now() - this.lastTouchTime < 1000) {
      return;
    }
    if (event.type === 'touchstart') {
      this.lastTouchTime = Date.now();
    }
    this.isLongPress = false;
    if (this.bookPressTimer) {
      clearTimeout(this.bookPressTimer);
    }
    this.bookPressTimer = setTimeout(() => {
      this.isLongPress = true;
      this.changeTicketPrice();
      this.bookPressTimer = null;
    }, 850);
  }

  onBookPressEnd(event: Event) {
    if (event.type === 'mouseup' && Date.now() - this.lastTouchTime < 1000) {
      return;
    }
      if (event.type === 'touchend') {
      this.lastTouchTime = Date.now();
    }
    if (this.bookPressTimer) {
      clearTimeout(this.bookPressTimer);
      this.bookPressTimer = null;
    }
  }

  // Payment Flow State
  showToPaySheet = false;
  selectedPaymentMethod: 'bhim' | 'bank' = 'bhim';
  showUpiPinModal = false;
  upiPinDigits: string[] = [];
  upiPinError = '';
  showPaymentProcessing = false;
  isPaymentSuccess = false;

  openToPaySheet() {
    this.selectedPaymentMethod = 'bhim';
    this.showToPaySheet = true;
  }

  closeToPaySheet() {
    this.showToPaySheet = false;
  }

  selectPaymentMethod(method: 'bhim' | 'bank') {
    this.selectedPaymentMethod = method;
  }

  proceedToUpiPin() {
    this.showToPaySheet = false;
    this.showUpiPinModal = true;
    this.upiPinDigits = [];
    this.upiPinError = '';
  }

  closeUpiPinModal() {
    this.showUpiPinModal = false;
    this.upiPinDigits = [];
    this.upiPinError = '';
  }

  pressUpiPin(digit: string) {
    if (this.upiPinDigits.length < 4) {
      this.upiPinDigits.push(digit);
      this.upiPinError = '';
      if (this.upiPinDigits.length === 4) {
        this.verifyUpiPin();
      }
    }
  }

  backspaceUpiPin() {
    if (this.upiPinDigits.length > 0) {
      this.upiPinDigits.pop();
      this.upiPinError = '';
    }
  }

  verifyUpiPin() {
    const pin = this.upiPinDigits.join('');
    if (pin === '9008') {
      this.showUpiPinModal = false;
      this.startPaymentProcessing();
    } else {
      this.upiPinError = 'Incorrect PIN! Enter 9008';
      setTimeout(() => {
        this.upiPinDigits = [];
      }, 900);
    }
  }

  startPaymentProcessing() {
    this.showPaymentProcessing = true;
    this.isPaymentSuccess = false;

    setTimeout(() => {
      this.isPaymentSuccess = true;

      try {
        const confetti = (window as any).confetti;
        if (confetti) {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 }
          });
        }
      } catch (e) {}

      setTimeout(() => {
        this.showPaymentProcessing = false;
        this.isPaymentSuccess = false;
        this.bookFinalTicket();
      }, 1200);
    }, 2800);
  }

  onBookClick(event: Event) {
    if (this.isLongPress) {
      event.preventDefault();
      event.stopPropagation();
      this.isLongPress = false;
      return;
    }
    this.openToPaySheet();
  }

  bookFinalTicket() {
    this.book();
  }

  changeTicketPrice() {
    this.editingPrice = this.ticketPrice;
    this.showPriceEdit = true;
  }

  savePrice() {
    const price = parseFloat(this.editingPrice.toString());
    if (!isNaN(price) && price >= 0) {
      this.userOverridePrice = price;
    }
    this.showPriceEdit = false;
  }

  cancelPriceEdit() {
    this.showPriceEdit = false;
  }

  book() {

    const route = this.busNo.trim().toUpperCase();
    localStorage.setItem('last_used_bus', route);

    const otp = this.ticketCode.trim().toUpperCase();
    if (otp) {
      try {
        const otpMapStr = localStorage.getItem('otp_bus_map');
        const otpMap = otpMapStr ? JSON.parse(otpMapStr) : {};
        otpMap[otp] = route;
        localStorage.setItem('otp_bus_map', JSON.stringify(otpMap));
      } catch(e) {}
    }

    let customData = this.customBusData[route] || { customStops: [], customRates: {} };
    customData.lastSource = this.source;
    customData.lastDestination = this.destination;
    
    if (!customData.customStops) customData.customStops = [];
    if (!customData.customRates) customData.customRates = {};

    // Save stops globally so they appear on all buses
    if (!this.sourceStops.includes(this.source) && !this.globalCustomStops.includes(this.source)) {
      this.globalCustomStops.push(this.source);
    }
    if (!this.destinationStops.includes(this.destination) && !this.globalCustomStops.includes(this.destination)) {
      this.globalCustomStops.push(this.destination);
    }

    // Save rates globally for both directions
    const key1 = `${this.source}|${this.destination}`;
    const key2 = `${this.destination}|${this.source}`;
    
    this.globalCustomRates[key1] = this.ticketPrice;
    this.globalCustomRates[key2] = this.ticketPrice;
    
    // Also save to route specific for fallback safety
    customData.customRates[key1] = this.ticketPrice;
    customData.customRates[key2] = this.ticketPrice;

    this.customBusData[route] = customData;
    this.saveCustomBusData();

    const routeNoToPass = this.displayRouteNo || this.busNo;

    this.router.navigate(
      [
        '/ticket-generation'
      ],
      {
        state: {
          bus:
            routeNoToPass, // Passes Route Number (e.g. 102PCT, M70 R) instead of bus reg no
          routeNo:
            routeNoToPass,
          busNo:
            this.busNo,
          type:
            this.busType,  
          source:
            this.source,
          destination:
            this.destination,
          price:
            this.total,
          persons:
            this.persons,
          ticket:
            this.ticketCode
        }
      }
    );
  }

}