// Radar, Flight Intelligence & Weather Radar Service — Bangalore (BLR / VOBL)
// Fetches live ADS-B flight vectors, aircraft type classification, Open-Meteo precipitation/clouds, and RainViewer Doppler radar

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
export function classifyAircraft({ callsign, country, altFt, speedKts, vRateFpm, distanceKm }) {
  const cs = (callsign || '').trim().toUpperCase();
  const prefix3 = cs.slice(0, 3);
  const prefix2 = cs.slice(0, 2);

  // Check known registry entry
  const regEntry = AIRLINE_REGISTRY[prefix3] || AIRLINE_REGISTRY[prefix2];

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
      aircraftType: isFighter ? 'Su-30MKI / Tejas LCA' : 'IAF C-17 Globemaster',
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
      aircraftType: 'HAL ALH Dhruv / Bell 412',
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
    cs.includes('CARGO')
  ) {
    const isHeavy = regEntry?.model?.includes('777') || regEntry?.model?.includes('767');
    return {
      category: 'CARGO',
      categoryLabel: 'Air Freight / Cargo',
      categoryBadge: 'CARGO',
      categoryColor: '#f97316',
      categoryBg: 'rgba(249, 115, 22, 0.16)',
      aircraftType: regEntry?.model || 'Boeing 737-800BCF (Cargo)',
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
    (speedKts < 240 && altFt < 18000 && !regEntry)
  ) {
    return {
      category: 'REGIONAL',
      categoryLabel: 'Regional Turboprop / Jet',
      categoryBadge: 'REG',
      categoryColor: '#06b6d4',
      categoryBg: 'rgba(6, 182, 212, 0.16)',
      aircraftType: regEntry?.model || 'ATR 72-600',
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
    (country !== 'India' && cs.length <= 5 && !regEntry)
  ) {
    return {
      category: 'PRIVATE',
      categoryLabel: 'Private / Business Jet',
      categoryBadge: 'BIZJET',
      categoryColor: '#c084fc',
      categoryBg: 'rgba(192, 132, 252, 0.16)',
      aircraftType: 'Bombardier Global 6000 / Gulfstream',
      aircraftClass: 'Executive Business Jet',
      wakeCategory: 'Medium',
      mission: 'Corporate Charter / Private Transport',
    };
  }

  // 6. Commercial Passenger (Widebody vs Narrowbody)
  const isWidebody =
    regEntry?.widebody ||
    ['UAE', 'SIA', 'QTR', 'ETD', 'BAW', 'LHA', 'AFR', 'KLM', 'CXA', 'MAS', 'THA', 'JAL', 'QFA'].includes(prefix3) ||
    (altFt > 32000 && speedKts > 450);

  let passengerModel = regEntry?.model;
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
 * Realistic simulated flights for Bangalore FIR with full variety of commercial, cargo, military, private, and rotary
 */
export function getRealisticFallbackFlights(center) {
  const templates = [
    // 1. Commercial Domestic (Narrowbody)
    { callsign: 'IGO525', country: 'India', lat: 13.29, lon: 77.47, alt: 2740, spd: 110, trk: 215, vRate: -12, type: 'COMMERCIAL' },
    { callsign: 'AIC8SY', country: 'India', lat: 13.89, lon: 77.85, alt: 6980, spd: 205, trk: 7, vRate: 6, type: 'COMMERCIAL' },
    { callsign: 'AKJ1336', country: 'India', lat: 13.34, lon: 77.90, alt: 3430, spd: 160, trk: 330, vRate: 4, type: 'COMMERCIAL' },
    { callsign: 'AXB1581', country: 'India', lat: 13.61, lon: 77.71, alt: 5280, spd: 185, trk: 328, vRate: 10, type: 'COMMERCIAL' },
    { callsign: 'IGO435', country: 'India', lat: 14.12, lon: 78.16, alt: 8940, spd: 220, trk: 170, vRate: -10, type: 'COMMERCIAL' },
    { callsign: 'SEJ304', country: 'India', lat: 13.05, lon: 77.95, alt: 1850, spd: 135, trk: 272, vRate: -6, type: 'COMMERCIAL' },

    // 2. Commercial International (Widebody)
    { callsign: 'UAE566', country: 'UAE', lat: 13.45, lon: 77.20, alt: 4200, spd: 170, trk: 110, vRate: -8, type: 'COMMERCIAL' },
    { callsign: 'SIA502', country: 'Singapore', lat: 13.12, lon: 78.15, alt: 2100, spd: 140, trk: 272, vRate: -5, type: 'COMMERCIAL' },

    // 3. Dedicated Air Cargo Freighters
    { callsign: 'BPA201', country: 'India', lat: 12.85, lon: 77.62, alt: 3600, spd: 165, trk: 350, vRate: 8, type: 'CARGO' },
    { callsign: 'QNZ412', country: 'India', lat: 13.48, lon: 77.92, alt: 5400, spd: 190, trk: 245, vRate: -7, type: 'CARGO' },

    // 4. Military Defense & Tactical
    { callsign: 'IFC29', country: 'India', lat: 13.18, lon: 77.55, alt: 4800, spd: 280, trk: 90, vRate: 14, type: 'MILITARY' },
    { callsign: 'HAL01', country: 'India', lat: 12.98, lon: 77.68, alt: 3100, spd: 230, trk: 88, vRate: 0, type: 'MILITARY' },

    // 5. Regional Feeder & Turboprop
    { callsign: 'LLR405', country: 'India', lat: 12.72, lon: 77.85, alt: 2400, spd: 145, trk: 335, vRate: -5, type: 'REGIONAL' },

    // 6. Private Corporate Jet
    { callsign: 'VT-RIL', country: 'India', lat: 13.38, lon: 77.40, alt: 7200, spd: 240, trk: 125, vRate: -8, type: 'PRIVATE' },

    // 7. Rotary / Helicopter
    { callsign: 'PAW12', country: 'India', lat: 12.96, lon: 77.72, alt: 600, spd: 75, trk: 280, vRate: 0, type: 'HELICOPTER' },
  ];

  return templates.map((t, idx) => {
    const rawState = [
      `8016${idx.toString(16)}a`,
      t.callsign,
      t.country,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000),
      t.lon,
      t.lat,
      t.alt,
      false,
      t.spd,
      t.trk,
      t.vRate,
      null,
      t.alt + 50,
      '27' + (10 + idx),
      false,
      0,
    ];
    return processFlightState(rawState, center);
  }).filter(Boolean);
}

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:5173';

/**
 * Fetch live flights within the Bangalore FIR
 */
export async function fetchBangaloreFlights(center = RADAR_CENTERS.VOBL, maxRadiusKm = 150) {
  try {
    const lamin = (center.lat - 1.2).toFixed(2);
    const lamax = (center.lat + 1.2).toFixed(2);
    const lomin = (center.lon - 1.3).toFixed(2);
    const lomax = (center.lon + 1.3).toFixed(2);

    const res = await fetch(`${API_BASE}/api/radar/flights?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const states = data.states || [];

    if (states.length === 0) {
      return {
        flights: getRealisticFallbackFlights(center),
        source: 'simulated-airspace',
        timestamp: Date.now(),
      };
    }

    const processed = states
      .map((s) => processFlightState(s, center))
      .filter((f) => f && f.distanceKm <= maxRadiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      flights: processed.length > 0 ? processed : getRealisticFallbackFlights(center),
      source: data.source || 'opensky-live',
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn('Flight fetch error, falling back to simulated traffic:', err);
    return {
      flights: getRealisticFallbackFlights(center),
      source: 'simulated-offline',
      timestamp: Date.now(),
    };
  }
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
export function generateRadarPrecipitationCells(centerLat, centerLon, currentPrecipMm, cloudCover, windDeg, simulateStorm = false) {
  const cells = [];
  const baseIntensity = simulateStorm ? 18.5 : Math.max(0, currentPrecipMm);
  const isWet = baseIntensity > 0.1 || simulateStorm;

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
export async function fetchBangaloreCloudInfo(lat = 13.1986, lon = 77.7066, simulateStorm = false) {
  let actualLat = lat;
  let actualLon = lon;
  if (typeof lat === 'object' && lat !== null) {
    actualLat = lat.lat ?? 13.1986;
    actualLon = lat.lon ?? 77.7066;
  }

  try {
    const res = await fetch(`${API_BASE}/api/radar/clouds?lat=${actualLat}&lon=${actualLon}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
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
    const peakDbz = simulateStorm ? 54 : rainRateToDbz(precipMm);
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
    const radarCells = generateRadarPrecipitationCells(actualLat, actualLon, precipMm, cloudTotal, windDeg, simulateStorm);

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
      precipMm: simulateStorm ? 22.4 : Math.round(precipMm * 10) / 10,
      rainRiskPct,
      peakDbz,
      dbzLabel: dbzInfo.label,
      dbzColor: dbzInfo.color,
      isRaining: precipMm > 0.1 || wmoInterpretation.isRain || simulateStorm,
      radarCells,
      rainviewer: data.rainviewer || null,
      hourlyProb,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn('Weather fetch error, using default meteorological estimate:', err);
    const fallbackDbz = simulateStorm ? 54 : 14;
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
      precipMm: simulateStorm ? 22.4 : 0,
      rainRiskPct: simulateStorm ? 95 : 10,
      peakDbz: fallbackDbz,
      dbzLabel: dbzInfo.label,
      dbzColor: dbzInfo.color,
      isRaining: simulateStorm,
      radarCells: generateRadarPrecipitationCells(actualLat, actualLon, 0, 18, 110, simulateStorm),
      rainviewer: null,
      hourlyProb: [10, 10, 5, 5, 5, 5],
      timestamp: Date.now(),
    };
  }
}
