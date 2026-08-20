/**
 * MTC Bus Lookup Service
 * ======================
 * Pure TypeScript implementation of lookup_bus.py — no external server needed.
 * Works inside the Ionic/Capacitor APK using CapacitorHttp to call MTC live API.
 *
 * Flow:
 *  1. Load local mtc_bus_map.json asset (bundled in APK) → get vehicle_id, bus_type, route info
 *  2. Call MTC ListVehicles API → confirm vehicle_id (or find it live)
 *  3. Call MTC VehicleTripDetails_v2 → get next_stop, previous_stop, GPS, route_id
 *  4. Call MTC SearchByRouteDetails_v4 → get complete ordered route stops
 */

const MTC_API = 'https://mobilegatewayapi.mtcbusits.in/passangermobileapi/WebAPI/';

export interface BusStop {
  sequence: number;
  stop_name: string;
  lat?: number;
  lng?: number;
}

export interface BusLookupResult {
  bus_no: string;
  vehicle_id: number | null;
  found_in_local_db: boolean;
  bus_type: string;
  route_no: string | null;
  route_id: number | null;
  source: string | null;
  destination: string | null;
  previous_stop: string | null;
  next_stop: string | null;
  live_status: 'LIVE' | 'OFFLINE' | 'Unknown';
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  last_updated: string | null;
  trip_status: string | null;
  route_stops: BusStop[];
  error: string | null;
}

/**
 * POST to MTC API endpoint using CapacitorHttp (bypasses CORS on mobile).
 * Falls back to native fetch if CapacitorHttp is unavailable (browser dev).
 */
async function mtcPost(endpoint: string, body: object, timeoutMs = 12000): Promise<any> {
  const url = MTC_API + endpoint;
  const headers = { 'Content-Type': 'application/json', 'lan': 'en' };

  try {
    const { CapacitorHttp } = await import('@capacitor/core');
    const res = await CapacitorHttp.post({ url, headers, data: body });
    return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  } catch (_capErr) {
    // Fallback for browser testing
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Load the bundled asset JSON (mtc_bus_map.json) from the app's assets folder.
 * Returns the bus map object or {} on failure.
 */
let _busMapCache: Record<string, any> | null = null;
async function loadLocalBusMap(): Promise<Record<string, any>> {
  if (_busMapCache) return _busMapCache;
  try {
    const res = await fetch('assets/mtc_bus_map.json');
    _busMapCache = await res.json();
    return _busMapCache!;
  } catch (e) {
    console.warn('Could not load mtc_bus_map.json:', e);
    return {};
  }
}

/**
 * Fast synchronous/local lookup from the bundled asset JSON (mtc_bus_map.json).
 * Does not make any network requests.
 */
export async function lookupLocalBusDetails(busNo: string): Promise<Partial<BusLookupResult>> {
  const busNoClean = busNo.trim().toUpperCase();
  try {
    const busMap = await loadLocalBusMap();
    const localEntry = busMap[busNoClean];
    if (localEntry) {
      const routes: any[] = localEntry.routes || [];
      return {
        bus_no: busNoClean,
        vehicle_id: localEntry.vehicle_id ?? null,
        found_in_local_db: true,
        bus_type: localEntry.bus_type || 'Ordinary',
        route_no: routes[0]?.route_no ? String(routes[0].route_no).trim().split(' ')[0] : null,
        route_id: routes[0]?.route_id || null,
        source: routes[0]?.from_station || null,
        destination: routes[0]?.to_station || null
      };
    }
  } catch (e) {
    console.warn('Local bus lookup error:', e);
  }
  return { bus_no: busNoClean, found_in_local_db: false };
}

/**
 * Main lookup function — call this from booking.page.ts.
 * Equivalent to lookup_bus.py's lookup_bus_details().
 */
export async function lookupBusDetails(busNo: string): Promise<BusLookupResult> {
  const busNoClean = busNo.trim().toUpperCase();

  const result: BusLookupResult = {
    bus_no: busNoClean,
    vehicle_id: null,
    found_in_local_db: false,
    bus_type: 'Ordinary',
    route_no: null,
    route_id: null,
    source: null,
    destination: null,
    previous_stop: null,
    next_stop: null,
    live_status: 'Unknown',
    latitude: null,
    longitude: null,
    location: null,
    last_updated: null,
    trip_status: null,
    route_stops: [],
    error: null
  };

  // ── Step 1: Check local bundled asset (mtc_bus_map.json) ───────────────
  try {
    const busMap = await loadLocalBusMap();
    const localEntry = busMap[busNoClean];

    if (localEntry) {
      result.found_in_local_db = true;
      result.vehicle_id = localEntry.vehicle_id ?? null;
      result.bus_type = localEntry.bus_type || 'Ordinary';

      const routes: any[] = localEntry.routes || [];
      if (routes.length > 0) {
        result.route_id = routes[0].route_id ?? null;
        result.route_no = routes[0].route_no ?? null;
        result.source = routes[0].from_station ?? null;
        result.destination = routes[0].to_station ?? null;
      }
    }
  } catch (e) {
    console.warn('Local bus map lookup failed:', e);
  }

  // ── Step 2: Find vehicle_id via MTC ListVehicles API ───────────────────
  try {
    if (!result.vehicle_id) {
      const searchResp = await mtcPost('ListVehicles', { vehicleRegNo: busNoClean, deviceType: 'WEB' });
      const data: any[] = searchResp?.data || [];

      let matched: any = null;
      for (const v of data) {
        if ((v.vehicleregno || '').trim().toUpperCase() === busNoClean) {
          matched = v;
          break;
        }
      }
      if (!matched && data.length > 0) matched = data[0];

      if (matched) {
        result.vehicle_id = matched.vehicleid;
        const matchedNo = (matched.vehicleregno || '').trim().toUpperCase();
        if (matchedNo) result.bus_no = matchedNo;
      }
    }
  } catch (e: any) {
    result.error = `ListVehicles failed: ${e?.message}`;
  }

  if (!result.vehicle_id) {
    result.error = result.error || 'Vehicle not found in MTC system';
    return result;
  }

  // ── Step 3: Get live telemetry from VehicleTripDetails_v2 ──────────────
  try {
    const tripResp = await mtcPost('VehicleTripDetails_v2', { vehicleId: result.vehicle_id });
    const locList: any[] = tripResp?.LiveLocation || [];
    const routeList: any[] = tripResp?.RouteDetails || [];

    // Parse live location
    if (locList.length > 0) {
      const loc = locList[0];
      result.bus_type = loc.servicetype || result.bus_type;
      if (loc.routeno) result.route_no = String(loc.routeno).trim().split(' ')[0];
      result.location = loc.location || null;
      result.latitude = loc.latitude ?? null;
      result.longitude = loc.longitude ?? null;
      result.previous_stop = loc.previousstop || null;
      result.next_stop = loc.nextstop || null;
      result.last_updated = loc.lastrefreshon || null;

      const lastRef = String(loc.lastrefreshon || '');
      result.live_status = lastRef.toLowerCase().includes('offline') ? 'OFFLINE' : 'LIVE';
    }

    // Parse active route trip
    if (routeList.length > 0) {
      const rd = routeList[0];
      result.route_id = rd.routeid ?? rd.routeId ?? result.route_id;
      if (rd.routeno) result.route_no = String(rd.routeno).trim().split(' ')[0];
      result.source = rd.sourcestation || rd.from || result.source;
      result.destination = rd.destinationstation || rd.to || result.destination;
      result.bus_type = rd.servicetype || rd.webservicetype || result.bus_type;
      result.trip_status = rd.tripstatus || 'Running';
    }
  } catch (e: any) {
    result.error = `Trip details failed: ${e?.message}`;
  }

  // ── Step 4: Fetch complete route stops via SearchByRouteDetails_v4 ──────
  let targetRouteId = result.route_id;

  // Fallback: If route_id is missing but route_no exists, search for route_id via SearchRoute_v2
  if (!targetRouteId && result.route_no) {
    try {
      const cleanRouteNo = result.route_no.trim().toUpperCase().split(' ')[0];
      const searchRes = await mtcPost('SearchRoute_v2', { routetext: cleanRouteNo });
      const routeList: any[] = searchRes?.data || [];
      if (routeList.length > 0) {
        targetRouteId = routeList[0].routeid || routeList[0].routeId;
        result.route_id = targetRouteId;
      }
    } catch (e) {}
  }

  if (targetRouteId) {
    try {
      const routeResp = await mtcPost('SearchByRouteDetails_v4', {
        routeid: targetRouteId,
        servicetypeid: 0
      });
      
      const upData: any[] = routeResp?.up?.data || [];
      const downData: any[] = routeResp?.down?.data || [];
      const directData: any[] = routeResp?.data || [];
      
      const rawStops = upData.length > 0 ? upData : (downData.length > 0 ? downData : directData);
      const stops: BusStop[] = [];

      for (let i = 0; i < rawStops.length; i++) {
        const st = rawStops[i];
        const sname = (st.stationname || st.stop_name || '').trim();
        if (sname) {
          stops.push({
            sequence: i + 1,
            stop_name: sname,
            lat: st.centerlat ?? st.latitude ?? null,
            lng: st.centerlong ?? st.longitude ?? null
          });
        }
      }

      if (stops.length > 0) {
        result.route_stops = stops;
        (result as any).route_boarding_points = stops;
        if (!result.source) result.source = stops[0].stop_name;
        if (!result.destination) result.destination = stops[stops.length - 1].stop_name;
      }
    } catch (e: any) {
      result.error = `Route stops failed: ${e?.message}`;
    }
  }

  return result;
}
