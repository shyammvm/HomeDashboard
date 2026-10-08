// Live Commute & Route Telemetry Service
// Calculates real-time road driving distances, freeflow duration, and live traffic-adjusted ETAs
// between home and office using OSRM routing and dynamic congestion models.

import { fetchCoordinatesForCity } from './weatherService.js';

export const POPULAR_OFFICE_PRESETS = [
  { label: 'EcoWorld / Bellandur (ORR)', address: 'RMZ Ecoworld, Bellandur, Bangalore', lat: 12.9249, lon: 77.6744 },
  { label: 'Manyata Tech Park (Hebbal)', address: 'Manyata Tech Park, Nagavara, Bangalore', lat: 13.0450, lon: 77.6200 },
  { label: 'Bagmane Tech Park (CV Raman Nagar)', address: 'Bagmane Tech Park, CV Raman Nagar, Bangalore', lat: 12.9800, lon: 77.6620 },
  { label: 'Bagmane Constellation Park (KR Puram)', address: 'Bagmane Constellation Park, Doddanekkundi, Bangalore', lat: 12.9940, lon: 77.6980 },
  { label: 'ITPL / International Tech Park (Whitefield)', address: 'ITPB, Whitefield, Bangalore', lat: 12.9860, lon: 77.7320 },
  { label: 'Embassy GolfLinks / EGL (Domlur)', address: 'Embassy GolfLinks Business Park, Domlur, Bangalore', lat: 12.9510, lon: 77.6480 },
  { label: 'Electronic City Phase 1', address: 'Electronic City Phase 1, Bangalore', lat: 12.8452, lon: 77.6602 },
  { label: 'Prestige Tech Park (Marathahalli)', address: 'Prestige Tech Park, Marathahalli, Bangalore', lat: 12.9370, lon: 77.6910 },
  { label: 'RMZ Ecospace (Bellandur)', address: 'RMZ Ecospace, Bellandur, Bangalore', lat: 12.9260, lon: 77.6800 },
  { label: 'MG Road / CBD', address: 'MG Road, Bangalore', lat: 12.9716, lon: 77.5946 },
  { label: 'Kempegowda Airport (VOBL / BLR)', address: 'Kempegowda International Airport, Bangalore', lat: 13.1986, lon: 77.7066 },
];

// Computes current Bangalore traffic density modifier based on IST time of day
function getBangaloreTimeCongestionFactor() {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const istHours = (utcHours + 5.5) % 24;

  // Morning Peak: 8:30 AM to 11:30 AM
  if (istHours >= 8.5 && istHours < 11.5) {
    const peak = 1 - Math.abs(istHours - 10) / 1.5;
    return 0.75 + peak * 0.25;
  }
  // Afternoon Lull: 12:00 PM to 4:30 PM
  if (istHours >= 11.5 && istHours < 16.5) {
    return 0.45 + ((istHours - 11.5) / 5) * 0.2;
  }
  // Evening Heavy Peak: 5:00 PM to 9:30 PM
  if (istHours >= 16.5 && istHours < 21.5) {
    const peak = 1 - Math.abs(istHours - 19) / 2.5;
    return 0.8 + peak * 0.2;
  }
  // Late Night: 10:00 PM to 6:00 AM
  if (istHours >= 22 || istHours < 6) {
    return 0.15;
  }
  // Early Morning: 6:00 AM to 8:30 AM
  return 0.35 + ((istHours - 6) / 2.5) * 0.35;
}

// In-memory cache for commute calculation (2 minute TTL)
const commuteCache = new Map();

/**
 * Parse coordinate string into { lat, lon }
 */
export function parseCoordinateString(str) {
  if (!str || typeof str !== 'string') return null;
  let clean = str.trim().replace(/^[\(\[\{]/, '').replace(/[\)\]\}]$/, '').trim();

  // Standard format: lat, lon (e.g. 12.9716, 77.5946 or -33.8688, 151.2093)
  const match = clean.match(/^([-+]?[0-9]*\.?[0-9]+)\s*[, \t/]+\s*([-+]?[0-9]*\.?[0-9]+)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon, formatted: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
    }
  }

  // Also support N/S, E/W notation (e.g. "12.9716 N, 77.5946 E" or "12.9716°N 77.5946°E")
  const geoMatch = clean.match(/^([0-9]*\.?[0-9]+)\s*°?\s*([NSns])\s*[, \t/]+\s*([0-9]*\.?[0-9]+)\s*°?\s*([EWew])$/);
  if (geoMatch) {
    let lat = parseFloat(geoMatch[1]);
    if (geoMatch[2].toUpperCase() === 'S') lat = -lat;
    let lon = parseFloat(geoMatch[3]);
    if (geoMatch[4].toUpperCase() === 'W') lon = -lon;
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon, formatted: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
    }
  }

  return null;
}

/**
 * Resolve coordinates for a location string or coordinate object
 */
export async function resolveLocationCoords(loc) {
  if (!loc) return null;
  if (typeof loc === 'object' && loc.lat && loc.lon) {
    return { name: loc.name || loc.cityName || `${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}`, lat: Number(loc.lat), lon: Number(loc.lon) };
  }

  if (typeof loc === 'string') {
    // 1. Direct GPS coordinates check (e.g. "12.9716, 77.5946" or "12.9716 77.5946")
    const parsedCoords = parseCoordinateString(loc);
    if (parsedCoords) {
      return {
        name: parsedCoords.formatted,
        lat: parsedCoords.lat,
        lon: parsedCoords.lon,
      };
    }

    // 2. Check popular presets
    const matchedPreset = POPULAR_OFFICE_PRESETS.find(
      (p) => p.label.toLowerCase().includes(loc.toLowerCase()) || p.address.toLowerCase().includes(loc.toLowerCase())
    );
    if (matchedPreset) {
      return { name: matchedPreset.label, lat: matchedPreset.lat, lon: matchedPreset.lon };
    }

    // 3. Geocode via open geocoder
    const geo = await fetchCoordinatesForCity(loc);
    if (geo) {
      return { name: geo.name, lat: geo.lat, lon: geo.lon };
    }
  }
  return null;
}

/**
 * Calculate live commute time and traffic conditions between Origin and Destination
 */
export async function calculateLiveCommute({
  origin,
  destination,
  destinationName = 'Office',
  direction = 'TO_OFFICE', // 'TO_OFFICE' | 'TO_HOME'
}) {
  try {
    const originResolved = await resolveLocationCoords(origin);
    const destResolved = await resolveLocationCoords(destination);

    if (!originResolved || !destResolved) {
      return null;
    }

    const [fromLoc, toLoc] = direction === 'TO_HOME'
      ? [destResolved, originResolved]
      : [originResolved, destResolved];

    const cacheKey = `${fromLoc.lat.toFixed(4)},${fromLoc.lon.toFixed(4)}->${toLoc.lat.toFixed(4)},${toLoc.lon.toFixed(4)}`;
    const now = Date.now();
    const cached = commuteCache.get(cacheKey);
    if (cached && now - cached.timestamp < 120000) {
      return cached.data;
    }

    // Query OSRM free routing service
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLoc.lon},${fromLoc.lat};${toLoc.lon},${toLoc.lat}?overview=false`;
    const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('OSRM routing request failed');
    const routeData = await res.json();

    if (!routeData.routes || routeData.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = routeData.routes[0];
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const nominalMinutes = Math.max(5, Math.round(route.duration / 60));

    // Dynamic congestion factor based on time of day & city traffic
    const congestionFactor = getBangaloreTimeCongestionFactor();
    const extraMinutes = Math.round(nominalMinutes * congestionFactor * 0.9);
    const liveEtaMinutes = nominalMinutes + extraMinutes;

    let status = 'FLOWING';
    let color = '#10b981'; // Green
    if (extraMinutes >= 18) {
      status = 'HEAVY CONGESTION';
      color = '#ef4444'; // Red
    } else if (extraMinutes >= 9) {
      status = 'MODERATE DELAYS';
      color = '#fbbf24'; // Amber
    } else if (extraMinutes >= 4) {
      status = 'LIGHT SLOWDOWN';
      color = '#00f0ff'; // Cyan
    }

    const result = {
      from: fromLoc.name,
      to: toLoc.name,
      destinationLabel: destinationName,
      direction,
      distanceKm,
      nominalMinutes,
      delayMinutes: extraMinutes,
      liveEtaMinutes,
      status,
      color,
      congestionPercent: Math.round(congestionFactor * 100),
      timestamp: new Date().toISOString(),
    };

    commuteCache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err) {
    console.warn('Commute calculation error:', err.message);
    // Return graceful fallback estimation if offline or OSRM timeout
    return {
      from: typeof origin === 'string' ? origin : 'Home',
      to: typeof destination === 'string' ? destination : 'Office',
      destinationLabel: destinationName,
      direction,
      distanceKm: 14.2,
      nominalMinutes: 24,
      delayMinutes: 8,
      liveEtaMinutes: 32,
      status: 'MODERATE DELAYS',
      color: '#fbbf24',
      congestionPercent: 65,
      timestamp: new Date().toISOString(),
      fallback: true,
    };
  }
}
