// Radar, Flight Intelligence & Weather Radar Service — Bangalore (BLR / VOBL)
// Fetches live ADS-B flight vectors, aircraft type classification, Open-Meteo precipitation/clouds, and RainViewer Doppler radar

import { DASHBOARD_CONFIG } from '../config.js';

export const RADAR_CENTERS = {
  VOBL: {
    id: 'VOBL',
    name: 'Kempegowda Int. Airport (VOBL)',
    shortName: 'VOBL AIRPORT',
    lat: 13.1986,
    lon: 77.7066,
    elevationM: 915,
    runways: [
      { id: '09L/27R', heading: 92, lengthM: 4000 },
      { id: '09R/27L', heading: 92, lengthM: 4000 },
    ],
  },
  CITY: {
    id: 'CITY',
    name: 'Local City Sector',
    shortName: 'LOCAL SECTOR',
    lat: 12.9716,
    lon: 77.7473,
    elevationM: 920,
    runways: [],
  },
};

// Comprehensive Airline & Operator Registry operating in the Bangalore FIR
export const AIRLINE_REGISTRY = {
  // Commercial Domestic & Regional
  IGO: { name: 'IndiGo', iata: '6E', color: '#0080ff', bg: 'rgba(0, 128, 255, 0.16)', type: 'COMMERCIAL', model: 'Airbus A320neo' },
  AIC: { name: 'Air India', iata: 'AI', color: '#e52424', bg: 'rgba(229, 36, 36, 0.16)', type: 'COMMERCIAL', model: 'Airbus A320neo' },
  AXB: { name: 'Air India Express', iata: 'IX', color: '#f97316', bg: 'rgba(249, 115, 22, 0.16)', type: 'COMMERCIAL', model: 'Boeing 737 MAX 8' },
  AKJ: { name: 'Akasa Air', iata: 'QP', color: '#ff6200', bg: 'rgba(255, 98, 0, 0.16)', type: 'COMMERCIAL', model: 'Boeing 737 MAX 8' },
  SEJ: { name: 'SpiceJet', iata: 'SG', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.16)', type: 'COMMERCIAL', model: 'Boeing 737-800' },
  VTI: { name: 'Vistara', iata: 'UK', color: '#9333ea', bg: 'rgba(147, 51, 234, 0.16)', type: 'COMMERCIAL', model: 'Airbus A321neo' },
  LLR: { name: 'Alliance Air', iata: '9I', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.16)', type: 'REGIONAL', model: 'ATR 72-600' },
  FLG: { name: 'Fly91', iata: 'IC', color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)', type: 'REGIONAL', model: 'ATR 72-600' },
  STR: { name: 'Star Air', iata: 'S5', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.16)', type: 'REGIONAL', model: 'Embraer E175' },

  // Commercial International (Widebody Long-Haul)
  UAE: { name: 'Emirates', iata: 'EK', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.16)', type: 'COMMERCIAL', model: 'Boeing 777-300ER', widebody: true },
  SIA: { name: 'Singapore Airlines', iata: 'SQ', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.16)', type: 'COMMERCIAL', model: 'Airbus A350-900', widebody: true },
  QTR: { name: 'Qatar Airways', iata: 'QR', color: '#9d174d', bg: 'rgba(157, 23, 77, 0.16)', type: 'COMMERCIAL', model: 'Airbus A350-900', widebody: true },
  ETD: { name: 'Etihad Airways', iata: 'EY', color: '#eab308', bg: 'rgba(234, 179, 8, 0.16)', type: 'COMMERCIAL', model: 'Boeing 787-9 Dreamliner', widebody: true },
  BAW: { name: 'British Airways', iata: 'BA', color: '#1d4ed8', bg: 'rgba(29, 78, 216, 0.16)', type: 'COMMERCIAL', model: 'Boeing 787-9 Dreamliner', widebody: true },
  LHA: { name: 'Lufthansa', iata: 'LH', color: '#1e3a8a', bg: 'rgba(30, 58, 138, 0.16)', type: 'COMMERCIAL', model: 'Airbus A350-900', widebody: true },
  AFR: { name: 'Air France', iata: 'AF', color: '#1e40af', bg: 'rgba(30, 64, 175, 0.16)', type: 'COMMERCIAL', model: 'Airbus A350-900', widebody: true },
  KLM: { name: 'KLM Royal Dutch', iata: 'KL', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.16)', type: 'COMMERCIAL', model: 'Boeing 777-200ER', widebody: true },
  CXA: { name: 'Cathay Pacific', iata: 'CX', color: '#0d9488', bg: 'rgba(13, 148, 136, 0.16)', type: 'COMMERCIAL', model: 'Airbus A350-900', widebody: true },
  MAS: { name: 'Malaysia Airlines', iata: 'MH', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.16)', type: 'COMMERCIAL', model: 'Airbus A330-300', widebody: true },
  THA: { name: 'Thai Airways', iata: 'TG', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.16)', type: 'COMMERCIAL', model: 'Boeing 777-200ER', widebody: true },

  // Air Cargo & Freight
  BPA: { name: 'Blue Dart Aviation', iata: 'BZ', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.16)', type: 'CARGO', model: 'Boeing 757-200F Freighter' },
  QNZ: { name: 'Quikjet Cargo', iata: 'QO', color: '#f97316', bg: 'rgba(249, 115, 22, 0.16)', type: 'CARGO', model: 'Boeing 737-800F Freighter' },
  FDX: { name: 'FedEx Express', iata: 'FX', color: '#9333ea', bg: 'rgba(147, 51, 234, 0.16)', type: 'CARGO', model: 'Boeing 777F Freighter' },
  UPS: { name: 'UPS Airlines', iata: '5X', color: '#b45309', bg: 'rgba(180, 83, 9, 0.16)', type: 'CARGO', model: 'Boeing 767-300F Freighter' },
  BOX: { name: 'AeroLogic Cargo', iata: '3S', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)', type: 'CARGO', model: 'Boeing 777F Freighter' },
  ETH: { name: 'Ethiopian Cargo', iata: 'ET', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.16)', type: 'CARGO', model: 'Boeing 777F Freighter' },

  // Defense & Military (Bangalore Yelahanka VOJK / HAL VOBG FIR)
  IFC: { name: 'Indian Air Force', iata: 'IAF', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.16)', type: 'MILITARY', model: 'Su-30MKI / Tejas LCA' },
  IAF: { name: 'Indian Air Force', iata: 'IAF', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.16)', type: 'MILITARY', model: 'C-17 Globemaster III' },
  HAL: { name: 'HAL Flight Test', iata: 'HAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)', type: 'MILITARY', model: 'HAL Tejas Mk1A (Test Flight)' },

  // Helicopter & Rotary
  PAW: { name: 'Pawan Hans', iata: 'PH', color: '#eab308', bg: 'rgba(234, 179, 8, 0.16)', type: 'HELICOPTER', model: 'HAL Dhruv / Bell 412' },
  HLG: { name: 'Heligo Charters', iata: 'HG', color: '#eab308', bg: 'rgba(234, 179, 8, 0.16)', type: 'HELICOPTER', model: 'Airbus H145 Rotary' },
};

/**
 * Great-circle distance between two GPS coordinates in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Initial compass bearing from (lat1, lon1) to (lat2, lon2) in degrees (0..359)
 */
export function calculateBearingDeg(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (Math.round((theta * 180) / Math.PI) + 360) % 360;
}

/**
 * 16-wind compass direction string from bearing degrees
 */
export function getCompassDirection(deg) {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx];
}

/**
 * Classify aircraft type and operational role based on callsign, flight dynamics, and registry
 */
export function classifyAircraft({ callsign, country, altFt, speedKts, vRateFpm, distanceKm, modelCode = '' }) {
  const cs = (callsign || '').trim().toUpperCase();
  const mc = (modelCode || '').trim().toUpperCase();
  const prefix3 = cs.slice(0, 3);
  const prefix2 = cs.slice(0, 2);

  // Check known registry entry
  const regEntry = AIRLINE_REGISTRY[prefix3] || AIRLINE_REGISTRY[prefix2];

  // Map known ICAO model codes
  let explicitModel = null;
  if (mc === 'A20N') explicitModel = 'Airbus A320neo';
  else if (mc === 'A21N') explicitModel = 'Airbus A321neo';
  else if (mc === 'A320') explicitModel = 'Airbus A320-200';
  else if (mc === 'A321') explicitModel = 'Airbus A321-200';
  else if (mc === 'B38M') explicitModel = 'Boeing 737 MAX 8';
  else if (mc === 'B738') explicitModel = 'Boeing 737-800';
  else if (mc === 'B748') explicitModel = 'Boeing 747-8 Freighter';
  else if (mc === 'B77W') explicitModel = 'Boeing 777-300ER';
  else if (mc === 'AT76' || mc === 'AT72') explicitModel = 'ATR 72-600';
  else if (mc === 'D228') explicitModel = 'Dornier Do 228';
  else if (mc === 'PRM1') explicitModel = 'Beechcraft Premier I';
  else if (mc === 'E35L') explicitModel = 'Embraer Legacy 500';
  else if (mc === 'C56X') explicitModel = 'Cessna Citation XLS';
  else if (mc === 'GL5T' || mc === 'GLEX') explicitModel = 'Bombardier Global 5000';

  // 1. Military detection
  if (
    prefix3 === 'IFC' ||
    prefix3 === 'IAF' ||
    prefix3 === 'HAL' ||
    cs.startsWith('RAFI') ||
    cs.startsWith('INDIA') ||
    cs.startsWith('DEF')
  ) {
    const isFighter = speedKts > 360 || altFt > 28000;
    return {
      category: 'MILITARY',
      categoryLabel: 'Military Tactical',
      categoryBadge: 'MIL',
      categoryColor: '#22c55e',
      categoryBg: 'rgba(34, 197, 94, 0.16)',
      aircraftType: explicitModel || (isFighter ? 'Su-30MKI / Tejas LCA' : 'IAF C-17 Globemaster'),
      aircraftClass: isFighter ? 'Tactical Fighter' : 'Military Strategic Transport',
      wakeCategory: isFighter ? 'Medium' : 'Heavy',
      mission: 'National Defense / Tactical Airspace',
    };
  }

  // 2. Helicopter / Rotary detection (slow speed, low alt or specific prefixes)
  if (
    prefix3 === 'PAW' ||
    prefix3 === 'HLG' ||
    cs.startsWith('HELI') ||
    (speedKts > 30 && speedKts < 135 && altFt < 3500)
  ) {
    return {
      category: 'HELICOPTER',
      categoryLabel: 'Rotary / Helicopter',
      categoryBadge: 'HELI',
      categoryColor: '#eab308',
      categoryBg: 'rgba(234, 179, 8, 0.16)',
      aircraftType: explicitModel || 'HAL ALH Dhruv / Bell 412',
      aircraftClass: 'Twin-Engine Rotorcraft',
      wakeCategory: 'Light',
      mission: 'VIP Air Shuttle / Emergency Medevac',
    };
  }

  // 3. Air Cargo / Freight detection
  if (
    regEntry?.type === 'CARGO' ||
    prefix3 === 'BPA' ||
    prefix3 === 'QNZ' ||
    prefix3 === 'FDX' ||
    prefix3 === 'UPS' ||
    prefix3 === 'BOX' ||
    prefix3 === 'ETH' ||
    mc === 'B748' ||
    cs.includes('CARGO')
  ) {
    const isHeavy = regEntry?.model?.includes('777') || regEntry?.model?.includes('767') || mc === 'B748';
    return {
      category: 'CARGO',
      categoryLabel: 'Air Freight / Cargo',
      categoryBadge: 'CARGO',
      categoryColor: '#f97316',
      categoryBg: 'rgba(249, 115, 22, 0.16)',
      aircraftType: explicitModel || regEntry?.model || 'Boeing 737-800BCF (Cargo)',
      aircraftClass: 'Dedicated Cargo Freighter',
      wakeCategory: isHeavy ? 'Heavy' : 'Medium',
      mission: 'Scheduled Express Cargo / Logistics',
    };
  }

  // 4. Regional Turboprop / Feeder detection
  if (
    regEntry?.type === 'REGIONAL' ||
    prefix3 === 'LLR' ||
    prefix3 === 'FLG' ||
    prefix3 === 'STR' ||
    mc === 'AT76' ||
    mc === 'AT72' ||
    mc === 'D228' ||
    (speedKts < 240 && altFt < 18000 && !regEntry && !explicitModel)
  ) {
    return {
      category: 'REGIONAL',
      categoryLabel: 'Regional Turboprop / Jet',
      categoryBadge: 'REG',
      categoryColor: '#06b6d4',
      categoryBg: 'rgba(6, 182, 212, 0.16)',
      aircraftType: explicitModel || regEntry?.model || 'ATR 72-600',
      aircraftClass: 'Regional Turboprop',
      wakeCategory: 'Medium',
      mission: 'UDAN Regional Connectivity',
    };
  }

  // 5. Private / Corporate Business Jet detection
  if (
    cs.startsWith('VT-') ||
    cs.startsWith('N1') ||
    cs.startsWith('M-') ||
    cs.startsWith('VP-') ||
    cs.startsWith('B-') ||
    mc === 'PRM1' ||
    mc === 'E35L' ||
    mc === 'C56X' ||
    mc === 'GL5T' ||
    (country !== 'India' && cs.length <= 5 && !regEntry)
  ) {
    return {
      category: 'PRIVATE',
      categoryLabel: 'Private / Business Jet',
      categoryBadge: 'BIZJET',
      categoryColor: '#c084fc',
      categoryBg: 'rgba(192, 132, 252, 0.16)',
      aircraftType: explicitModel || 'Executive Business Jet',
      aircraftClass: 'Executive Business Jet',
      wakeCategory: 'Medium',
      mission: 'Corporate Charter / Private Transport',
    };
  }

  // 6. Commercial Passenger (Widebody vs Narrowbody)
  const isWidebody =
    regEntry?.widebody ||
    ['UAE', 'SIA', 'QTR', 'ETD', 'BAW', 'LHA', 'AFR', 'KLM', 'CXA', 'MAS', 'THA', 'JAL', 'QFA'].includes(prefix3) ||
    mc === 'B77W' ||
    mc === 'A359' ||
    mc === 'B789' ||
    (altFt > 32000 && speedKts > 450);

  let passengerModel = explicitModel || regEntry?.model;
  if (!passengerModel) {
    if (isWidebody) passengerModel = 'Boeing 777-300ER / Airbus A350';
    else if (prefix3 === 'IGO') passengerModel = altFt > 25000 ? 'Airbus A321neo' : 'Airbus A320neo';
    else if (prefix3 === 'AXB' || prefix3 === 'AKJ') passengerModel = 'Boeing 737 MAX 8';
    else passengerModel = 'Airbus A320neo';
  }

  return {
    category: 'COMMERCIAL',
    categoryLabel: isWidebody ? 'Commercial (Widebody)' : 'Commercial (Narrowbody)',
    categoryBadge: isWidebody ? 'WIDEBODY' : 'PAX',
    categoryColor: '#38bdf8',
    categoryBg: 'rgba(56, 189, 248, 0.16)',
    aircraftType: passengerModel,
    aircraftClass: isWidebody ? 'Widebody Commercial Jet' : 'Narrowbody Commercial Jet',
    wakeCategory: isWidebody ? 'Heavy' : 'Medium',
    mission: isWidebody ? 'International Long-Haul Passenger' : 'Domestic Scheduled Passenger',
  };
}

/**
 * Convert detailed aircraft model / classification into short recognizable tactical code (e.g. A320, B737, SU30)
 */
export function getShortAircraftModel(f) {
  if (!f) return '---';
  const mc = (f.modelCode || '').trim().toUpperCase();
  const cs = (f.callsign || '').trim().toUpperCase();
  const desc = (f.aircraftType || f.aircraftDesc || '').toUpperCase();

  // 1. Direct ICAO Type Code shortcuts
  if (mc === 'A20N' || mc === 'A320') return 'A320';
  if (mc === 'A21N' || mc === 'A321') return 'A321';
  if (mc === 'A319') return 'A319';
  if (mc === 'A359' || mc === 'A35K' || mc === 'A350') return 'A350';
  if (mc === 'A332' || mc === 'A333' || mc === 'A339' || mc === 'A330') return 'A330';
  if (mc === 'A388' || mc === 'A380') return 'A380';
  if (mc === 'B38M' || mc === 'B39M') return 'B737 MAX';
  if (mc === 'B738' || mc === 'B737' || mc === 'B739') return 'B737';
  if (mc === 'B77W' || mc === 'B772' || mc === 'B77L' || mc === 'B777') return 'B777';
  if (mc === 'B788' || mc === 'B789' || mc === 'B78X') return 'B787';
  if (mc === 'B744' || mc === 'B748') return 'B747';
  if (mc === 'AT76' || mc === 'AT72') return 'ATR72';
  if (mc === 'AT45' || mc === 'AT42') return 'ATR42';
  if (mc === 'D228' || mc === 'DO228') return 'DO228';
  if (mc === 'DH8D' || mc === 'Q400') return 'Q400';
  if (mc === 'E35L') return 'LEGACY';
  if (mc === 'PRM1') return 'PREMIER';
  if (mc === 'C56X') return 'CITATION';
  if (mc === 'GL5T' || mc === 'GLEX') return 'GLOBAL';
  if (mc === 'ALH' || mc === 'DHRUV') return 'DHRUV';

  // 2. Military and Defense
  if (cs.startsWith('HAL') || desc.includes('TEJAS')) return 'TEJAS';
  if (cs.startsWith('SU30') || desc.includes('SU-30') || desc.includes('SU30') || (f.category === 'MILITARY' && f.speedKts > 360)) return 'SU30';
  if (cs.startsWith('RAF') || cs.startsWith('RAFI') || desc.includes('RAFALE')) return 'RAFALE';
  if (cs.startsWith('IFC') || cs.startsWith('IAF') || desc.includes('C-17') || desc.includes('GLOBEMASTER')) return 'C17';
  if (cs.startsWith('PAW') || f.category === 'HELICOPTER' || desc.includes('HELI') || desc.includes('BELL')) return 'HELI';

  // 3. Fallback from description string
  if (desc.includes('A321')) return 'A321';
  if (desc.includes('A320')) return 'A320';
  if (desc.includes('MAX') || desc.includes('737 MAX')) return 'B737 MAX';
  if (desc.includes('737')) return 'B737';
  if (desc.includes('777')) return 'B777';
  if (desc.includes('787')) return 'B787';
  if (desc.includes('747')) return 'B747';
  if (desc.includes('350')) return 'A350';
  if (desc.includes('330')) return 'A330';
  if (desc.includes('ATR')) return 'ATR72';
  if (desc.includes('SU-30') || desc.includes('SU30')) return 'SU30';
  if (desc.includes('TEJAS')) return 'TEJAS';
  if (desc.includes('DORNIER') || desc.includes('228')) return 'DO228';
  if (desc.includes('BUSINESS') || f.category === 'PRIVATE') return 'BIZJET';
  if (f.category === 'CARGO') return 'CARGO';

  if (mc && mc.length <= 6) return mc;
  return f.category === 'COMMERCIAL' ? 'A320' : (f.categoryBadge || 'AIRCRAFT');
}

/**
 * Determine flight phase (Climb, Descent, Final Approach, Cruise, Ground)
 */
export function determineFlightPhase(onGround, altFt, vRateFpm, distanceKm) {
  if (onGround) return { phase: 'GROUND', label: 'On Apron / Runway', symbol: '■' };
  if (altFt < 4500 && distanceKm < 28 && vRateFpm < -150) {
    return { phase: 'APPROACH', label: 'Final ILS Approach', symbol: '🛬' };
  }
  if (vRateFpm < -250) {
    return { phase: 'DESCENT', label: 'Descent / Inbound BLR', symbol: '▼' };
  }
  if (vRateFpm > 250) {
    return { phase: 'CLIMB', label: 'Climb / Outbound BLR', symbol: '▲' };
  }
  return { phase: 'CRUISE', label: 'Level Airway Cruise', symbol: '▶' };
}

/**
 * Resolve airline info and formatted display callsign
 */
export function resolveAirline(rawCallsign, country = 'India') {
  const callsign = (rawCallsign || '').trim().toUpperCase();
  if (!callsign) {
    return {
      callsign: 'UNID',
      airline: 'Civil Aircraft',
      code: 'CIV',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.14)',
    };
  }

  const prefix3 = callsign.slice(0, 3);
  if (AIRLINE_REGISTRY[prefix3]) {
    const info = AIRLINE_REGISTRY[prefix3];
    const flightNum = callsign.slice(3).trim();
    return {
      callsign,
      flightNum: flightNum ? `${info.iata}-${flightNum}` : callsign,
      airline: info.name,
      code: info.iata,
      color: info.color,
      bg: info.bg,
    };
  }

  const prefix2 = callsign.slice(0, 2);
  for (const key of Object.keys(AIRLINE_REGISTRY)) {
    if (AIRLINE_REGISTRY[key].iata === prefix2) {
      const info = AIRLINE_REGISTRY[key];
      return {
        callsign,
        flightNum: callsign,
        airline: info.name,
        code: info.iata,
        color: info.color,
        bg: info.bg,
      };
    }
  }

  return {
    callsign,
    flightNum: callsign,
    airline: country || 'Civil Air Transport',
    code: country ? country.slice(0, 3).toUpperCase() : 'AIR',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.14)',
  };
}

/**
 * Convert raw OpenSky state vector into rich flight object with aircraft classification
 */
export function processFlightState(state, center) {
  const [
    icao24,
    rawCallsign,
    originCountry,
    timePosition,
    lastContact,
    lon,
    lat,
    baroAltM,
    onGround,
    velocityMs,
    trueTrackDeg,
    verticalRateMs,
    sensors,
    geoAltM,
    squawk,
    spi,
    positionSource,
  ] = state;

  if (lat == null || lon == null) return null;

  const distanceKm = calculateDistanceKm(center.lat, center.lon, lat, lon);
  const bearingDeg = calculateBearingDeg(center.lat, center.lon, lat, lon);
  const compass = getCompassDirection(bearingDeg);

  const altM = baroAltM != null ? baroAltM : geoAltM != null ? geoAltM : 0;
  const altFt = Math.round(altM * 3.28084);
  const speedKts = Math.round((velocityMs || 0) * 1.94384);
  const speedKmh = Math.round((velocityMs || 0) * 3.6);
  const vRateFpm = Math.round((verticalRateMs || 0) * 196.85);

  const flightLevel = altFt >= 10000 ? `FL${Math.round(altFt / 100)}` : `${altFt.toLocaleString()} ft`;
  const airline = resolveAirline(rawCallsign, originCountry);

  const classification = classifyAircraft({
    callsign: airline.callsign,
    country: originCountry,
    altFt,
    speedKts,
    vRateFpm,
    distanceKm,
  });

  const phaseInfo = determineFlightPhase(Boolean(onGround), altFt, vRateFpm, distanceKm);

  return {
    id: icao24 || Math.random().toString(36).slice(2, 8),
    icao24: icao24 ? icao24.toUpperCase() : 'UNKNOWN',
    callsign: airline.callsign,
    flightNum: airline.flightNum,
    airline: airline.airline,
    airlineCode: airline.code,
    airlineColor: airline.color,
    airlineBg: airline.bg,
    country: originCountry || 'India',
    lat,
    lon,
    altitudeFt: altFt,
    altitudeM: Math.round(altM),
    flightLevel,
    speedKts,
    speedKmh,
    heading: Math.round(trueTrackDeg || 0),
    verticalRateFpm: vRateFpm,
    verticalStatus: vRateFpm > 150 ? 'CLIMBING' : vRateFpm < -150 ? 'DESCENDING' : 'LEVEL',
    verticalSymbol: phaseInfo.symbol,
    flightPhase: phaseInfo.phase,
    flightPhaseLabel: phaseInfo.label,
    onGround: Boolean(onGround),
    squawk: squawk || '----',
    distanceKm: Math.round(distanceKm * 10) / 10,
    distanceNm: Math.round((distanceKm / 1.852) * 10) / 10,
    bearingDeg,
    compass,
    // Classification fields
    category: classification.category,
    categoryLabel: classification.categoryLabel,
    categoryBadge: classification.categoryBadge,
    categoryColor: classification.categoryColor,
    categoryBg: classification.categoryBg,
    aircraftType: classification.aircraftType,
    aircraftClass: classification.aircraftClass,
    wakeCategory: classification.wakeCategory,
    mission: classification.mission,
    lastSeen: lastContact || Math.floor(Date.now() / 1000),
  };
}

/**
 * Convert modern ADS-B record (adsb.lol / adsb.fi / tar1090 format) into rich flight object
 */
export function processAdsbRecord(record, center) {
  if (record == null || record.lat == null || record.lon == null) return null;

  const hex = (record.hex || '').trim().toLowerCase();
  const rawCallsign = (record.flight || record.r || hex || '').trim().toUpperCase();
  const registration = (record.r || '').trim().toUpperCase();
  const modelCode = (record.t || '').trim().toUpperCase();
  const lat = Number(record.lat);
  const lon = Number(record.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const distanceKm = calculateDistanceKm(center.lat, center.lon, lat, lon);
  const bearingDeg = calculateBearingDeg(center.lat, center.lon, lat, lon);
  const compass = getCompassDirection(bearingDeg);

  const onGround = record.alt_baro === 'ground' || Boolean(record.ground) || (record.alt_baro == null && (record.gs || 0) < 45);
  let altFt = 0;
  if (!onGround) {
    if (typeof record.alt_baro === 'number') altFt = Math.round(record.alt_baro);
    else if (typeof record.alt_geom === 'number') altFt = Math.round(record.alt_geom);
  }
  const altM = Math.round(altFt / 3.28084);

  const speedKts = Math.round(record.gs || 0);
  const speedKmh = Math.round(speedKts * 1.852);
  const vRateFpm = Math.round(record.baro_rate || record.geom_rate || 0);
  const heading = Math.round(record.track || record.true_heading || record.mag_heading || 0);

  const flightLevel = altFt >= 10000 ? `FL${Math.round(altFt / 100)}` : `${altFt.toLocaleString()} ft`;
  const airline = resolveAirline(rawCallsign, 'India');

  const classification = classifyAircraft({
    callsign: rawCallsign,
    country: 'India',
    altFt,
    speedKts,
    vRateFpm,
    distanceKm,
    modelCode,
  });

  const phaseInfo = determineFlightPhase(Boolean(onGround), altFt, vRateFpm, distanceKm);

  return {
    id: hex || rawCallsign,
    icao24: hex ? hex.toUpperCase() : 'UNKNOWN',
    callsign: rawCallsign,
    flightNum: airline.flightNum || rawCallsign,
    airline: airline.airline,
    airlineCode: airline.code,
    airlineColor: airline.color,
    airlineBg: airline.bg,
    country: 'India',
    registration,
    modelCode,
    aircraftDesc: record.desc || classification.aircraftType,
    lat,
    lon,
    altitudeFt: altFt,
    altitudeM: altM,
    flightLevel,
    speedKts,
    speedKmh,
    heading,
    verticalRateFpm: vRateFpm,
    verticalStatus: vRateFpm > 150 ? 'CLIMBING' : vRateFpm < -150 ? 'DESCENDING' : 'LEVEL',
    verticalSymbol: phaseInfo.symbol,
    flightPhase: phaseInfo.phase,
    flightPhaseLabel: phaseInfo.label,
    onGround: Boolean(onGround),
    squawk: record.squawk || '----',
    distanceKm: Math.round(distanceKm * 10) / 10,
    distanceNm: Math.round((distanceKm / 1.852) * 10) / 10,
    bearingDeg,
    compass,
    category: classification.category,
    categoryLabel: classification.categoryLabel,
    categoryBadge: classification.categoryBadge,
    categoryColor: classification.categoryColor,
    categoryBg: classification.categoryBg,
    aircraftType: classification.aircraftType,
    aircraftClass: classification.aircraftClass,
    wakeCategory: classification.wakeCategory,
    mission: classification.mission,
    lastSeen: record.seen_pos ? Math.floor(Date.now() / 1000 - record.seen_pos) : Math.floor(Date.now() / 1000),
  };
}

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:5173';

/**
 * High-fidelity tactical flight generator for the Bangalore (VOBL / VOBG / VOJK) FIR sector.
 * Simulates authentic commercial, cargo, and defense flights along real flight corridors,
 * dynamically advancing their positions along their tracks based on current timestamp.
 */
export function generateRealisticBangaloreFlights(center = RADAR_CENTERS.VOBL, maxRadiusKm = 100) {
  const now = Date.now() / 1000;

  // Real Bangalore FIR routes & corridors
  const templates = [
    {
      icao24: '8014ce',
      callsign: 'IGO6653 ',
      country: 'India',
      // Inbound IndiGo A320neo from Mumbai on ILS runway 09L approach
      startLat: 13.32, startLon: 77.48,
      endLat: 13.20, endLon: 77.71,
      speedKts: 172,
      altFt: 3950,
      vRateFpm: -650,
      heading: 104,
      cycleSec: 360,
      squawk: '7243',
    },
    {
      icao24: '8015d9',
      callsign: 'AIC506  ',
      country: 'India',
      // Departing Air India A321neo climbing towards Delhi
      startLat: 13.21, startLon: 77.73,
      endLat: 13.48, endLon: 77.96,
      speedKts: 310,
      altFt: 14600,
      vRateFpm: 1950,
      heading: 38,
      cycleSec: 420,
      squawk: '1000',
    },
    {
      icao24: '8015d3',
      callsign: 'AKJ1372 ',
      country: 'India',
      // Akasa Air B737 MAX downwind base leg east of Whitefield/Hoskote
      startLat: 12.86, startLon: 77.82,
      endLat: 13.14, endLon: 77.84,
      speedKts: 215,
      altFt: 6200,
      vRateFpm: -320,
      heading: 358,
      cycleSec: 400,
      squawk: '7327',
    },
    {
      icao24: '896172',
      callsign: 'UAE564  ',
      country: 'United Arab Emirates',
      // Emirates B777-300ER widebody cruising high altitude west of city towards Singapore
      startLat: 13.15, startLon: 77.32,
      endLat: 12.86, endLon: 77.86,
      speedKts: 460,
      altFt: 34000,
      vRateFpm: 0,
      heading: 122,
      cycleSec: 540,
      squawk: '5120',
    },
    {
      icao24: '801506',
      callsign: 'IGO941  ',
      country: 'India',
      // IndiGo inbound from Hyderabad approaching VOBL from North
      startLat: 13.42, startLon: 77.68,
      endLat: 13.22, endLon: 77.70,
      speedKts: 220,
      altFt: 7600,
      vRateFpm: -800,
      heading: 184,
      cycleSec: 380,
      squawk: '2701',
    },
    {
      icao24: '8002a4',
      callsign: 'BPA102  ',
      country: 'India',
      // Blue Dart Boeing 757-200F cargo freighter
      startLat: 13.11, startLon: 77.40,
      endLat: 13.19, endLon: 77.68,
      speedKts: 195,
      altFt: 4600,
      vRateFpm: -480,
      heading: 82,
      cycleSec: 440,
      squawk: '4211',
    },
    {
      icao24: '801458',
      callsign: 'IAF042  ',
      country: 'India',
      // Indian Air Force Tejas fighter sortie (HAL VOBG / Yelahanka VOJK sector)
      startLat: 13.04, startLon: 77.61,
      endLat: 13.24, endLon: 77.76,
      speedKts: 410,
      altFt: 11200,
      vRateFpm: 350,
      heading: 36,
      cycleSec: 320,
      squawk: '7771',
    },
    {
      icao24: '8017f8',
      callsign: 'PAW08   ',
      country: 'India',
      // Pawan Hans helicopter VIP corridor
      startLat: 12.85, startLon: 77.66,
      endLat: 12.98, endLon: 77.68,
      speedKts: 110,
      altFt: 2200,
      vRateFpm: 0,
      heading: 8,
      cycleSec: 480,
      squawk: '2011',
    },
  ];

  const states = templates.map((tpl, idx) => {
    const t = (now + idx * 47) % tpl.cycleSec;
    const progress = t / tpl.cycleSec;

    const lat = tpl.startLat + (tpl.endLat - tpl.startLat) * progress;
    const lon = tpl.startLon + (tpl.endLon - tpl.startLon) * progress;

    const altM = Math.round(tpl.altFt * 0.3048);
    const velMs = Math.round(tpl.speedKts * 0.514444);
    const vRateMs = Math.round(tpl.vRateFpm * 0.00508 * 10) / 10;

    return [
      tpl.icao24,
      tpl.callsign,
      tpl.country,
      Math.floor(now),
      Math.floor(now),
      lon,
      lat,
      altM,
      false,
      velMs,
      tpl.heading,
      vRateMs,
      null,
      altM,
      tpl.squawk,
      false,
      0,
    ];
  });

  return states
    .map((s) => processFlightState(s, center))
    .filter((f) => f && f.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Retrieve cached flights for instant cold-start rendering
 */
export function getCachedFlights(center = RADAR_CENTERS.VOBL, maxRadiusKm = 75) {
  try {
    if (typeof localStorage !== 'undefined') {
      const savedRaw = localStorage.getItem('aether_cached_flights');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        const list = Array.isArray(parsed) ? parsed : (parsed.flights || []);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    }
  } catch { }
  // Cold start fallback guarantees instant visual feedback on TV
  return generateRealisticBangaloreFlights(center, maxRadiusKm);
}

/**
 * Fetch live flights within the Bangalore FIR (adsb.lol -> adsb.fi -> OpenSky -> Google Sync -> Fallback)
 */
export async function fetchBangaloreFlights(center = RADAR_CENTERS.VOBL, maxRadiusKm = 75) {
  const actualLat = center.lat ?? 12.9716;
  const actualLon = center.lon ?? 77.7473;
  const radiusNm = Math.min(100, Math.max(25, Math.ceil(maxRadiusKm / 1.852)));

  const lamin = (actualLat - 1.2).toFixed(2);
  const lamax = (actualLat + 1.2).toFixed(2);
  const lomin = (actualLon - 1.3).toFixed(2);
  const lomax = (actualLon + 1.3).toFixed(2);

  let processed = [];
  let liveSource = 'offline';

  // 1. Primary: Local or deployed backend proxy (/api/radar/flights)
  try {
    const res = await fetch(
      `${API_BASE}/api/radar/flights?lat=${actualLat}&lon=${actualLon}&radius=${radiusNm}&lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.ac) && data.ac.length > 0) {
        processed = data.ac
          .map((a) => processAdsbRecord(a, center))
          .filter((f) => f && f.distanceKm <= maxRadiusKm && !f.callsign.startsWith('TXLU') && f.category !== 'C0');
        liveSource = data.source || 'adsb-lol-live';
      } else if (Array.isArray(data.states) && data.states.length > 0) {
        processed = data.states
          .map((s) => processFlightState(s, center))
          .filter((f) => f && f.distanceKm <= maxRadiusKm);
        liveSource = data.source || 'opensky-live';
      }
    }
  } catch {
    // Backend proxy not available (e.g. GitHub Pages static hosting or offline)
  }

  // 2. Secondary: Google Apps Script Web App (user's 24x7 personal cloud proxy for TV)
  if (processed.length === 0 && DASHBOARD_CONFIG?.googleSyncUrl) {
    try {
      const gUrl = `${DASHBOARD_CONFIG.googleSyncUrl}${DASHBOARD_CONFIG.googleSyncUrl.includes('?') ? '&' : '?'}action=get_flights&lat=${actualLat}&lon=${actualLon}&radius=${radiusNm}`;
      const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(6000) });
      if (gRes.ok) {
        const gData = await gRes.json();
        const list = gData.ac || gData.aircraft || [];
        if (Array.isArray(list) && list.length > 0) {
          processed = list
            .map((a) => processAdsbRecord(a, center))
            .filter((f) => f && f.distanceKm <= maxRadiusKm && !f.callsign.startsWith('TXLU') && f.category !== 'C0');
          liveSource = 'google-adsb-live';
        }
      }
    } catch {
      // Google script proxy not available or pending update
    }
  }

  // 3. Tertiary: Fast public CORS proxy directly to adsb.lol
  if (processed.length === 0) {
    try {
      const targetUrl = `https://api.adsb.lol/v2/point/${actualLat}/${actualLon}/${radiusNm}`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const pRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(4000) });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData.ac) && pData.ac.length > 0) {
          processed = pData.ac
            .map((a) => processAdsbRecord(a, center))
            .filter((f) => f && f.distanceKm <= maxRadiusKm && !f.callsign.startsWith('TXLU') && f.category !== 'C0');
          liveSource = 'cors-adsb-live';
        }
      }
    } catch {
      // CORS proxy timeout
    }
  }

  // If live flights were found:
  if (processed.length > 0) {
    processed.sort((a, b) => a.distanceKm - b.distanceKm);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('aether_cached_flights', JSON.stringify({
          timestamp: Date.now(),
          flights: processed,
          source: liveSource,
        }));
      }
    } catch { }

    return {
      flights: processed,
      source: liveSource,
      timestamp: Date.now(),
    };
  }

  // 4. Fallback: Recent cached contacts with continuous track projection
  try {
    if (typeof localStorage !== 'undefined') {
      const savedRaw = localStorage.getItem('aether_cached_flights');
      if (savedRaw) {
        const savedObj = JSON.parse(savedRaw);
        const list = Array.isArray(savedObj) ? savedObj : (savedObj.flights || []);
        const savedTime = savedObj.timestamp || 0;
        const ageSec = (Date.now() - savedTime) / 1000;
        // If cached within the last 15 minutes, project coordinates forward along heading
        if (list.length > 0 && ageSec < 900) {
          const projected = list.map((f) => {
            const speedKts = f.speedKts || 250;
            const headingRad = ((f.heading || 0) * Math.PI) / 180;
            const distTraveledKm = (speedKts * 1.852 * (ageSec / 3600));
            const dLat = (distTraveledKm / 111) * Math.cos(headingRad);
            const dLon = (distTraveledKm / (111 * Math.cos((f.lat * Math.PI) / 180))) * Math.sin(headingRad);
            const nLat = f.lat + dLat;
            const nLon = f.lon + dLon;
            const nDist = Math.round(calculateDistanceKm(center.lat, center.lon, nLat, nLon) * 10) / 10;
            const nBrg = calculateBearingDeg(center.lat, center.lon, nLat, nLon);
            return {
              ...f,
              lat: nLat,
              lon: nLon,
              distanceKm: nDist,
              bearingDeg: nBrg,
            };
          }).filter((f) => f.distanceKm <= maxRadiusKm).sort((a, b) => a.distanceKm - b.distanceKm);

          if (projected.length > 0) {
            return {
              flights: projected,
              source: 'cached-radar-replay',
              timestamp: Date.now(),
            };
          }
        }
      }
    }
  } catch { }

  // 5. Ultimate Guarantee: Tactical Bangalore FIR Corridors
  // Guarantees that the TV NEVER displays an empty black box or "NO CONTACTS"
  const fallback = generateRealisticBangaloreFlights(center, maxRadiusKm);
  return {
    flights: fallback.slice(0, 10).sort((a, b) => a.distanceKm - b.distanceKm),
    source: 'aether-tactical-fir',
    timestamp: Date.now(),
  };
}

/**
 * Calculate Doppler Radar Reflectivity (dBZ) from rain rate (mm/h) using Marshall-Palmer relation
 * Z = 200 * (R ^ 1.6)
 * dBZ = 10 * log10(Z)
 */
export function rainRateToDbz(rainRateMmH) {
  if (rainRateMmH <= 0.02) return 12; // Atmospheric clear-air boundary return
  const Z = 200 * Math.pow(Math.max(0.05, rainRateMmH), 1.6);
  const dbz = 10 * Math.log10(Z);
  return Math.min(68, Math.max(12, Math.round(dbz)));
}

/**
 * Get standard meteorological Doppler color for a given dBZ reflectivity value
 */
export function getDbzColor(dbz) {
  if (dbz < 18) return { color: '#06b6d4', label: 'Cloud Deck / Trace', severity: 'MIST' }; // Cyan
  if (dbz < 26) return { color: '#22c55e', label: 'Light Rain (0.5–2 mm/h)', severity: 'LIGHT' }; // Green
  if (dbz < 36) return { color: '#84cc16', label: 'Moderate Rain (2–6 mm/h)', severity: 'MODERATE' }; // Lime
  if (dbz < 46) return { color: '#eab308', label: 'Heavy Rain (6–16 mm/h)', severity: 'HEAVY' }; // Amber
  if (dbz < 55) return { color: '#f97316', label: 'Very Heavy (16–40 mm/h)', severity: 'DOWNPOUR' }; // Orange
  return { color: '#ec4899', label: 'Severe Convective / Hail (>40 mm/h)', severity: 'SEVERE' }; // Magenta
}

/**
 * Interpret WMO Weather Code
 */
export function interpretWeatherCode(code) {
  const table = {
    0: { desc: 'Clear Skies', isRain: false, severity: 'NONE' },
    1: { desc: 'Mainly Clear', isRain: false, severity: 'NONE' },
    2: { desc: 'Partly Cloudy', isRain: false, severity: 'NONE' },
    3: { desc: 'Overcast Skies', isRain: false, severity: 'NONE' },
    45: { desc: 'Foggy Horizon', isRain: false, severity: 'NONE' },
    48: { desc: 'Depositing Rime Fog', isRain: false, severity: 'NONE' },
    51: { desc: 'Light Drizzle', isRain: true, severity: 'LIGHT' },
    53: { desc: 'Moderate Drizzle', isRain: true, severity: 'LIGHT' },
    55: { desc: 'Dense Drizzle', isRain: true, severity: 'LIGHT' },
    61: { desc: 'Slight Rain', isRain: true, severity: 'LIGHT' },
    63: { desc: 'Moderate Rain', isRain: true, severity: 'MODERATE' },
    65: { desc: 'Heavy Monsoonal Rain', isRain: true, severity: 'HEAVY' },
    80: { desc: 'Slight Rain Showers', isRain: true, severity: 'LIGHT' },
    81: { desc: 'Moderate Rain Showers', isRain: true, severity: 'MODERATE' },
    82: { desc: 'Violent Rain Showers', isRain: true, severity: 'DOWNPOUR' },
    95: { desc: 'Thunderstorm with Rain', isRain: true, severity: 'SEVERE' },
    96: { desc: 'Thunderstorm with Hail', isRain: true, severity: 'SEVERE' },
  };
  return table[code] || { desc: 'Atmospheric Moisture', isRain: false, severity: 'NONE' };
}

/**
 * Generate localized spatial weather radar cells around Bangalore
 */
export function generateRadarPrecipitationCells(centerLat, centerLon, currentPrecipMm, cloudCover, windDeg) {
  const cells = [];
  const baseIntensity = Math.max(0, currentPrecipMm);
  const isWet = baseIntensity > 0.1;

  // Key sector anchor locations in Greater Bangalore FIR
  const anchors = [
    { id: 'cell-vobl', name: 'Kempegowda North Corridor', lat: 13.23, lon: 77.71, factor: 1.1 },
    { id: 'cell-east', name: 'Whitefield - Hoskote Sector', lat: 12.98, lon: 77.76, factor: 0.9 },
    { id: 'cell-south', name: 'Electronic City - Hosur Arc', lat: 12.82, lon: 77.67, factor: 1.25 },
    { id: 'cell-west', name: 'Nelamangala - TG Halli Ridge', lat: 13.06, lon: 77.42, factor: 1.4 },
    { id: 'cell-central', name: 'Central Urban Core', lat: 12.97, lon: 77.61, factor: 0.8 },
  ];

  anchors.forEach((a, idx) => {
    const rainRate = isWet ? baseIntensity * a.factor : (cloudCover > 40 && idx % 2 === 0 ? 0.05 : 0);
    const dbz = rainRateToDbz(rainRate);
    const radiusKm = isWet ? 14 + (a.factor * 10) : 12 + (cloudCover * 0.15);

    cells.push({
      id: a.id,
      name: a.name,
      lat: a.lat,
      lon: a.lon,
      radiusKm,
      rainRateMmH: Math.round(rainRate * 10) / 10,
      dbz,
      ...getDbzColor(dbz),
      isRainCell: rainRate > 0.2,
    });
  });

  return cells;
}

/**
 * Fetch comprehensive weather radar, precipitation telemetry, and RainViewer Doppler radar metadata
 */
export async function fetchBangaloreCloudInfo(lat = 13.1986, lon = 77.7066) {
  let actualLat = lat;
  let actualLon = lon;
  if (typeof lat === 'object' && lat !== null) {
    actualLat = lat.lat ?? 13.1986;
    actualLon = lat.lon ?? 77.7066;
  }

  try {
    let data = null;
    try {
      const res = await fetch(`${API_BASE}/api/radar/clouds?lat=${actualLat}&lon=${actualLon}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) data = await res.json();
    } catch { }

    if (!data || !data.current) {
      const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${actualLat}&longitude=${actualLon}&current=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,precipitation,rain,showers,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,relative_humidity_2m&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
      const directRes = await fetch(directUrl, { signal: AbortSignal.timeout(6000) });
      if (directRes.ok) data = await directRes.json();
    }

    if (!data) throw new Error('Cloud telemetry failed');

    const curr = data.current || {};
    const hourly = data.hourly || {};

    const cloudTotal = Math.round(curr.cloud_cover ?? 18);
    const cloudLow = Math.round(curr.cloud_cover_low ?? 6);
    const cloudMid = Math.round(curr.cloud_cover_mid ?? 6);
    const cloudHigh = Math.round(curr.cloud_cover_high ?? 5);

    const visMeters = curr.visibility ?? 20000;
    const visKm = Math.round((visMeters / 1000) * 10) / 10;
    const visNm = Math.round((visKm / 1.852) * 10) / 10;

    const windSpeedKmh = curr.wind_speed_10m ?? 8.5;
    const windSpeedKts = Math.round(windSpeedKmh * 0.539957);
    const windDeg = Math.round(curr.wind_direction_10m ?? 90);
    const windGustsKmh = curr.wind_gusts_10m ?? windSpeedKmh * 1.3;
    const windGustsKts = Math.round(windGustsKmh * 0.539957);
    const windDirText = getCompassDirection(windDeg);

    const pressure = Math.round(curr.surface_pressure ?? 1013);
    const humidity = Math.round(curr.relative_humidity_2m ?? 65);

    // Live Rain & Precipitation
    const precipMm = curr.precipitation ?? curr.rain ?? curr.showers ?? 0;
    const weatherCode = curr.weather_code ?? 0;
    const wmoInterpretation = interpretWeatherCode(weatherCode);

    // Hourly rain risk next 6h
    const hourlyProb = (hourly.precipitation_probability || []).slice(0, 6);
    const rainRiskPct = hourlyProb.length > 0 ? Math.max(...hourlyProb) : (precipMm > 0 ? 90 : 5);

    // Doppler reflectivity peak dBZ
    const peakDbz = rainRateToDbz(precipMm);
    const dbzInfo = getDbzColor(peakDbz);

    // Aviation flight category
    let flightCategory = 'VFR';
    let flightCategoryLabel = 'Visual Flight Rules';
    let categoryColor = '#34d399'; // Emerald

    if (visKm < 5 || (cloudLow > 75 && cloudTotal > 80) || precipMm > 8) {
      flightCategory = 'IFR';
      flightCategoryLabel = 'Instrument Flight Rules';
      categoryColor = '#f43f5e'; // Rose
    } else if (visKm < 8 || cloudLow > 50 || precipMm > 1) {
      flightCategory = 'MVFR';
      flightCategoryLabel = 'Marginal VFR';
      categoryColor = '#fbbf24'; // Amber
    }

    // Ceiling estimate
    let ceilingText = 'Unlimited (>10,000 ft)';
    if (cloudLow > 60) ceilingText = 'Est. 2,200 – 3,200 ft AGL';
    else if (cloudLow > 30) ceilingText = 'Est. 4,000 – 6,000 ft AGL';
    else if (cloudMid > 50) ceilingText = 'Est. 7,000 – 9,000 ft AGL';

    // Storm motion drift vector (clouds carried by wind: downwind direction)
    const stormMotionDir = (windDeg + 180) % 360;
    const stormMotionCompass = getCompassDirection(stormMotionDir);

    // Spatial Doppler precipitation cells
    const radarCells = generateRadarPrecipitationCells(actualLat, actualLon, precipMm, cloudTotal, windDeg);

    return {
      cloudTotal,
      cloudLow,
      cloudMid,
      cloudHigh,
      conditionDesc: wmoInterpretation.desc,
      ceilingText,
      visibilityKm: visKm,
      visibilityNm: visNm,
      flightCategory,
      flightCategoryLabel,
      categoryColor,
      windSpeedKts,
      windGustsKts,
      windDeg,
      windDirText,
      stormMotionDir,
      stormMotionCompass,
      pressureHpa: pressure,
      humidity,
      precipMm: Math.round(precipMm * 10) / 10,
      rainRiskPct,
      peakDbz,
      dbzLabel: dbzInfo.label,
      dbzColor: dbzInfo.color,
      isRaining: precipMm > 0.1 || wmoInterpretation.isRain,
      radarCells,
      rainviewer: data.rainviewer || null,
      hourlyProb,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn('Weather fetch error, using default meteorological estimate:', err);
    const fallbackDbz = 14;
    const dbzInfo = getDbzColor(fallbackDbz);
    return {
      cloudTotal: 18,
      cloudLow: 6,
      cloudMid: 7,
      cloudHigh: 5,
      conditionDesc: 'Few Clouds (FEW) • Clear Horizon',
      ceilingText: 'Unlimited (>10,000 ft)',
      visibilityKm: 20.0,
      visibilityNm: 10.8,
      flightCategory: 'VFR',
      flightCategoryLabel: 'Visual Flight Rules',
      categoryColor: '#34d399',
      windSpeedKts: 7,
      windGustsKts: 11,
      windDeg: 110,
      windDirText: 'ESE',
      stormMotionDir: 290,
      stormMotionCompass: 'WNW',
      pressureHpa: 1013,
      humidity: 62,
      precipMm: 0,
      rainRiskPct: 10,
      peakDbz: fallbackDbz,
      dbzLabel: dbzInfo.label,
      dbzColor: dbzInfo.color,
      isRaining: false,
      radarCells: generateRadarPrecipitationCells(actualLat, actualLon, 0, 18, 110),
      rainviewer: null,
      hourlyProb: [10, 10, 5, 5, 5, 5],
      timestamp: Date.now(),
    };
  }
}
