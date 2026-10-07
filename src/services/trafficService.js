// Bangalore Live Surface Traffic Telemetry Service
// Models real-time traffic corridors, bottlenecks, congestion levels, and transit ETAs centered around Whitefield / Bangalore.

export const TRAFFIC_CENTERS = {
  WHITEFIELD: {
    key: 'WHITEFIELD',
    name: 'East Tech Corridor',
    shortName: 'WHITEFIELD',
    lat: 12.9698,
    lon: 77.7499,
  },
  ORR: {
    key: 'ORR',
    name: 'Outer Ring Road (Tech Corridor)',
    shortName: 'ORR BELLANDUR',
    lat: 12.9249,
    lon: 77.6744,
  },
  CBD: {
    key: 'CBD',
    name: 'Central Metro (CBD / MG Road)',
    shortName: 'CBD / MG ROAD',
    lat: 12.9716,
    lon: 77.5946,
  },
};

// Key Bangalore Arterial Corridors
export const BANGALORE_CORRIDORS = [
  {
    id: 'itpl_main',
    name: 'ITPL Main Road',
    sector: 'Whitefield',
    start: [12.9850, 77.7300],
    end: [12.9698, 77.7499],
    lengthKm: 4.2,
    speedLimit: 40,
    basePeakCongestion: 0.72,
  },
  {
    id: 'kundalahalli',
    name: 'Kundalahalli - Hope Farm',
    sector: 'Whitefield',
    start: [12.9634, 77.7179],
    end: [12.9820, 77.7610],
    lengthKm: 5.1,
    speedLimit: 40,
    basePeakCongestion: 0.75,
  },
  {
    id: 'varthur_road',
    name: 'Varthur - Gunjur Road',
    sector: 'East Peripheral',
    start: [12.9380, 77.7470],
    end: [12.9120, 77.7250],
    lengthKm: 6.4,
    speedLimit: 45,
    basePeakCongestion: 0.55,
  },
  {
    id: 'marathahalli_orr',
    name: 'ORR: Marathahalli to Bellandur',
    sector: 'Outer Ring Road',
    start: [12.9560, 77.7011],
    end: [12.9249, 77.6744],
    lengthKm: 5.5,
    speedLimit: 50,
    basePeakCongestion: 0.88,
  },
  {
    id: 'bellandur_silkboard',
    name: 'ORR: Bellandur to Silk Board',
    sector: 'Outer Ring Road',
    start: [12.9249, 77.6744],
    end: [12.9176, 77.6233],
    lengthKm: 6.2,
    speedLimit: 50,
    basePeakCongestion: 0.92,
  },
  {
    id: 'kr_puram_tinfactory',
    name: 'K.R. Puram / Tin Factory Flyover',
    sector: 'East Hub',
    start: [12.9982, 77.6789],
    end: [12.9960, 77.6520],
    lengthKm: 3.8,
    speedLimit: 40,
    basePeakCongestion: 0.94,
  },
  {
    id: 'old_airport_rd',
    name: 'Old Airport Road / HAL',
    sector: 'Central Arterial',
    start: [12.9560, 77.7011],
    end: [12.9609, 77.6436],
    lengthKm: 7.2,
    speedLimit: 45,
    basePeakCongestion: 0.70,
  },
  {
    id: 'indiranagar_100ft',
    name: 'Indiranagar 100ft Road',
    sector: 'East Central',
    start: [12.9784, 77.6408],
    end: [12.9625, 77.6380],
    lengthKm: 3.5,
    speedLimit: 35,
    basePeakCongestion: 0.65,
  },
  {
    id: 'hebbal_airport_nh',
    name: 'Airport Elevated Expressway (NH 44)',
    sector: 'North Corridor',
    start: [13.0358, 77.5970],
    end: [13.1986, 77.7066],
    lengthKm: 22.0,
    speedLimit: 80,
    basePeakCongestion: 0.40,
  },
  {
    id: 'electronic_city_flyover',
    name: 'Electronic City Elevated Tollway',
    sector: 'South Corridor',
    start: [12.9176, 77.6233],
    end: [12.8452, 77.6602],
    lengthKm: 9.9,
    speedLimit: 80,
    basePeakCongestion: 0.45,
  },
  {
    id: 'sarjapur_road',
    name: 'Sarjapur Road / Carmelaram',
    sector: 'Southeast',
    start: [12.9120, 77.6850],
    end: [12.8800, 77.7200],
    lengthKm: 8.0,
    speedLimit: 45,
    basePeakCongestion: 0.78,
  },
  {
    id: 'hebbal_manyata',
    name: 'Manyata Tech Park ORR',
    sector: 'North Corridor',
    start: [13.0358, 77.5970],
    end: [13.0450, 77.6200],
    lengthKm: 4.8,
    speedLimit: 50,
    basePeakCongestion: 0.82,
  },
];

// Key Travel Destinations from Whitefield
export const DESTINATION_HUBS = [
  {
    id: 'airport',
    name: 'Kempegowda Int. Airport (VOBL)',
    icon: 'Plane',
    distanceKm: 38,
    nominalMins: 45,
    route: 'via SH104 / Budigere Cross',
  },
  {
    id: 'indiranagar',
    name: 'Indiranagar (100ft Rd)',
    icon: 'Building',
    distanceKm: 14,
    nominalMins: 28,
    route: 'via Old Airport Rd',
  },
  {
    id: 'bellandur',
    name: 'Bellandur / EcoWorld (ORR)',
    icon: 'Briefcase',
    distanceKm: 12,
    nominalMins: 22,
    route: 'via Marathahalli Bridge',
  },
  {
    id: 'mg_road',
    name: 'MG Road / Brigade Rd (CBD)',
    icon: 'MapPin',
    distanceKm: 18,
    nominalMins: 35,
    route: 'via HAL Old Airport Rd',
  },
  {
    id: 'ecity',
    name: 'Electronic City Phase 1',
    icon: 'Zap',
    distanceKm: 28,
    nominalMins: 40,
    route: 'via Sarjapur / NICE Rd',
  },
];

// Great-circle distance in kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
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

// Calculate bearing in degrees (0 = North, 90 = East, etc.)
function calculateBearingDeg(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const brg = (Math.atan2(y, x) * 180) / Math.PI;
  return (brg + 360) % 360;
}

// Computes current Bangalore traffic density modifier based on IST time of day
function getBangaloreTimeCongestionFactor() {
  const now = new Date();
  // Get current hour in IST (UTC + 5:30)
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

/**
 * Fetch and compute live traffic data around center within selected km range.
 */
export async function fetchLiveTrafficData(center = TRAFFIC_CENTERS.WHITEFIELD, rangeKm = 15) {
  const timeFactor = getBangaloreTimeCongestionFactor();

  // Process corridors relative to center
  const visibleCorridors = BANGALORE_CORRIDORS.map((c) => {
    const midLat = (c.start[0] + c.end[0]) / 2;
    const midLon = (c.start[1] + c.end[1]) / 2;
    const distFromCenter = calculateDistanceKm(center.lat, center.lon, midLat, midLon);
    const bearing = calculateBearingDeg(center.lat, center.lon, midLat, midLon);

    // Compute live congestion level for this corridor (0.0 to 1.0)
    // Add minor pseudo-random variance based on hour
    const noise = Math.sin(c.lengthKm * 10 + timeFactor * 5) * 0.08;
    const congestion = Math.min(0.98, Math.max(0.12, c.basePeakCongestion * timeFactor + noise));

    // Calculate live current speed
    const currentSpeed = Math.max(8, Math.round(c.speedLimit * (1 - congestion * 0.78)));

    // Categorize
    let level = 'FLOWING';
    let color = '#10b981'; // green
    if (congestion > 0.72) {
      level = 'GRIDLOCK';
      color = '#ef4444'; // red
    } else if (congestion > 0.45) {
      level = 'HEAVY';
      color = '#fbbf24'; // gold / amber
    } else if (congestion > 0.30) {
      level = 'MODERATE';
      color = '#00f0ff'; // cyan
    }

    // Delay in minutes
    const freeFlowTimeMin = (c.lengthKm / c.speedLimit) * 60;
    const actualTimeMin = (c.lengthKm / currentSpeed) * 60;
    const delayMins = Math.max(0, Math.round(actualTimeMin - freeFlowTimeMin));

    return {
      ...c,
      distFromCenter: Math.round(distFromCenter * 10) / 10,
      bearingDeg: Math.round(bearing),
      congestionPercent: Math.round(congestion * 100),
      currentSpeedKm: currentSpeed,
      delayMins,
      level,
      color,
      isWithinRange: distFromCenter <= rangeKm,
    };
  });

  // Filter within selected range
  const corridorsInRange = visibleCorridors.filter((c) => c.isWithinRange);

  // Overall statistics
  const avgSpeed = corridorsInRange.length > 0
    ? Math.round(corridorsInRange.reduce((acc, c) => acc + c.currentSpeedKm, 0) / corridorsInRange.length)
    : 32;

  const avgCongestion = corridorsInRange.length > 0
    ? Math.round(corridorsInRange.reduce((acc, c) => acc + c.congestionPercent, 0) / corridorsInRange.length)
    : Math.round(timeFactor * 100);

  const totalDelays = corridorsInRange.reduce((acc, c) => acc + c.delayMins, 0);

  // Hotspots: top congested bottlenecks
  const bottlenecks = [...corridorsInRange]
    .sort((a, b) => b.congestionPercent - a.congestionPercent)
    .slice(0, 4);

  // Transit ETAs calculated from Whitefield with live congestion factor
  const destinations = DESTINATION_HUBS.map((d) => {
    const extraMinutes = Math.round(d.nominalMins * (avgCongestion / 100) * 0.85);
    const currentEtaMins = d.nominalMins + extraMinutes;
    return {
      ...d,
      currentEtaMins,
      delayMins: extraMinutes,
      statusColor: extraMinutes > 15 ? '#ef4444' : extraMinutes > 7 ? '#fbbf24' : '#10b981',
    };
  });

  return {
    center,
    rangeKm,
    timestamp: new Date(),
    avgSpeedKmH: avgSpeed,
    overallCongestion: avgCongestion,
    totalDelayMinutes: totalDelays,
    corridors: visibleCorridors,
    corridorsInRange,
    bottlenecks,
    destinations,
  };
}
