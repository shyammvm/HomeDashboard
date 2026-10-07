import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Radio,
  Cloud,
  CloudRain,
  Wind,
  Eye,
  Gauge,
  Play,
  Pause,
  RefreshCw,
  Volume2,
  VolumeX,
  Layers,
  MapPin,
  Map,
  Plane,
  Shield,
  Sparkles,
  X,
  ChevronRight,
  Droplets,
  Sliders,
} from 'lucide-react';
import {
  RADAR_CENTERS,
  fetchBangaloreFlights,
  fetchBangaloreCloudInfo,
  calculateDistanceKm,
  calculateBearingDeg,
  getCompassDirection,
  rainRateToDbz,
  getDbzColor,
} from '../services/radarService';
import {
  BANGALORE_METRO_BOUNDARY,
  BANGALORE_INNER_BOUNDARY,
  RING_ROADS,
  MAJOR_ARTERIALS,
  WATER_BODIES,
  AIRFIELDS,
  LANDMARK_HUBS,
  AIRSPACE_WAYPOINTS,
} from '../services/radarMapData';

export default function RadarCard({
  userLocation = { lat: 12.9716, lon: 77.7473, cityName: 'Your Location' },
}) {
  const [centerKey, setCenterKey] = useState('USER'); // 'USER', 'VOBL', or 'CITY'
  const [rangeKm, setRangeKm] = useState(100); // 50, 100, 150, 200
  const [activeLayer, setActiveLayer] = useState('ALL'); // 'ALL', 'FLIGHTS', 'WEATHER', 'MAP'
  const [showMap, setShowMap] = useState(true);
  const [showWeatherRadar, setShowWeatherRadar] = useState(true);
  const [isDecluttered, setIsDecluttered] = useState(true); // Default to clean, decluttered mode
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL', 'COMMERCIAL', 'CARGO', 'MILITARY', 'PRIVATE', 'REGIONAL', 'HELICOPTER'
  const [activeTab, setActiveTab] = useState('FLIGHTS'); // 'FLIGHTS', 'WEATHER'

  const [isSweeping, setIsSweeping] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [hoveredFlightId, setHoveredFlightId] = useState(null);

  const [flights, setFlights] = useState([]);
  const [flightSource, setFlightSource] = useState('loading');
  const [cloudData, setCloudData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const sweepAngleRef = useRef(0); // in radians
  const audioCtxRef = useRef(null);
  const lastBlipPingRef = useRef(0);

  const activeCenter = useMemo(() => {
    if (centerKey === 'USER' || !RADAR_CENTERS[centerKey]) {
      return {
        id: 'USER',
        name: userLocation?.cityName || 'User Airspace',
        shortName: (userLocation?.cityName || 'MY LOCATION').split(',')[0].toUpperCase(),
        lat: userLocation?.lat || 12.9716,
        lon: userLocation?.lon || 77.7473,
        elevationM: 920,
        runways: [],
      };
    }
    return RADAR_CENTERS[centerKey];
  }, [centerKey, userLocation]);

  // Load live flights
  const loadFlights = useCallback(async () => {
    try {
      const res = await fetchBangaloreFlights(activeCenter, 220);
      setFlights(res.flights || []);
      setFlightSource(res.source || 'opensky-live');
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('RadarCard: error loading flights', err);
    }
  }, [activeCenter]);

  // Load weather radar and atmospheric telemetry
  const loadClouds = useCallback(async () => {
    try {
      const data = await fetchBangaloreCloudInfo(activeCenter.lat, activeCenter.lon);
      setCloudData(data);
    } catch (err) {
      console.warn('RadarCard: error loading clouds', err);
    }
  }, [activeCenter]);

  // Initial and periodic refresh
  useEffect(() => {
    loadFlights();
    loadClouds();

    const flightTimer = setInterval(loadFlights, 10000);
    const cloudTimer = setInterval(loadClouds, 120000);

    return () => {
      clearInterval(flightTimer);
      clearInterval(cloudTimer);
    };
  }, [loadFlights, loadClouds]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadFlights(), loadClouds()]);
    setTimeout(() => setIsRefreshing(false), 700);
  };

  // Subtle tactical audio chirp
  const playRadarPing = useCallback(() => {
    if (!isAudioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio not permitted or supported
    }
  }, [isAudioEnabled]);

  // Filter flights within selected range and attach polar coordinates relative to activeCenter
  const visibleFlights = useMemo(() => {
    return flights
      .map((f) => {
        const dist = calculateDistanceKm(activeCenter.lat, activeCenter.lon, f.lat, f.lon);
        const brg = calculateBearingDeg(activeCenter.lat, activeCenter.lon, f.lat, f.lon);
        return {
          ...f,
          distanceKm: Math.round(dist * 10) / 10,
          distanceNm: Math.round((dist / 1.852) * 10) / 10,
          bearingDeg: brg,
          compass: getCompassDirection(brg),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [flights, activeCenter]);

  // Flight counts by aircraft category
  const categoryCounts = useMemo(() => {
    const inRange = visibleFlights.filter((f) => f.distanceKm <= rangeKm);
    const counts = {
      ALL: inRange.length,
      COMMERCIAL: 0,
      CARGO: 0,
      MILITARY: 0,
      PRIVATE: 0,
      REGIONAL: 0,
      HELICOPTER: 0,
    };
    inRange.forEach((f) => {
      if (counts[f.category] != null) counts[f.category]++;
    });
    return counts;
  }, [visibleFlights, rangeKm]);

  // Filtered flights by category
  const categoryFilteredFlights = useMemo(() => {
    return visibleFlights
      .filter((f) => f.distanceKm <= rangeKm)
      .filter((f) => selectedCategory === 'ALL' || f.category === selectedCategory);
  }, [visibleFlights, rangeKm, selectedCategory]);

  // Find selected flight
  const selectedFlight = useMemo(() => {
    if (!selectedFlightId) return null;
    return visibleFlights.find((f) => f.id === selectedFlightId) || null;
  }, [selectedFlightId, visibleFlights]);

  // Airspace statistics
  const airspaceStats = useMemo(() => {
    const inRange = visibleFlights.filter((f) => f.distanceKm <= rangeKm);
    const closest = inRange[0] || null;
    const highest = inRange.reduce((prev, curr) => (curr.altitudeFt > (prev?.altitudeFt || 0) ? curr : prev), null);
    const fastest = inRange.reduce((prev, curr) => (curr.speedKts > (prev?.speedKts || 0) ? curr : prev), null);

    return {
      totalInRange: inRange.length,
      closestCallsign: closest ? closest.flightNum : '—',
      closestDist: closest ? `${closest.distanceKm} km` : '—',
      highestAlt: highest ? highest.flightLevel : '—',
      fastestSpeed: fastest ? `${fastest.speedKts} kt` : '—',
    };
  }, [visibleFlights, rangeKm]);

  // Canvas radar animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;
    let lastTime = performance.now();

    const render = (now) => {
      if (!isRunning) return;

      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Update sweep angle (1 full turn every 4.8 seconds)
      if (isSweeping) {
        sweepAngleRef.current = (sweepAngleRef.current + (Math.PI * 2 * dt) / 4.8) % (Math.PI * 2);
      }

      const sweepAngle = sweepAngleRef.current;

      // Crisp high-DPI scaling
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 22; // leaving margin for degree ticks

      // Geographic coordinate projection helper relative to active radar center
      const projectGeo = (lat, lon) => {
        const dist = calculateDistanceKm(activeCenter.lat, activeCenter.lon, lat, lon);
        if (dist > rangeKm * 1.15) return null;
        const brg = calculateBearingDeg(activeCenter.lat, activeCenter.lon, lat, lon);
        const rad = (brg * Math.PI) / 180;
        const norm = dist / rangeKm;
        return {
          x: cx + radius * norm * Math.sin(rad),
          y: cy - radius * norm * Math.cos(rad),
          distKm: dist,
        };
      };

      // 1. Radar Glass Background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      bgGrad.addColorStop(0, '#040b17');
      bgGrad.addColorStop(0.7, '#020610');
      bgGrad.addColorStop(1, '#01040a');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer bezel ring
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Azimuth Outer Ring & Degree Ticks
      ctx.save();
      for (let deg = 0; deg < 360; deg += 10) {
        const rad = ((deg - 90) * Math.PI) / 180;
        const isMajor = deg % 30 === 0;
        const isCardinal = deg % 90 === 0;
        const tickLength = isCardinal ? 9 : isMajor ? 6 : 3;

        const x1 = cx + (radius - 1) * Math.cos(rad);
        const y1 = cy + (radius - 1) * Math.sin(rad);
        const x2 = cx + (radius - 1 - tickLength) * Math.cos(rad);
        const y2 = cy + (radius - 1 - tickLength) * Math.sin(rad);

        ctx.strokeStyle = isCardinal
          ? 'rgba(56, 189, 248, 0.9)'
          : isMajor
          ? 'rgba(56, 189, 248, 0.5)'
          : 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = isCardinal ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Major degree labels
        if (isMajor && deg % 90 !== 0) {
          const textR = radius - 15;
          const tx = cx + textR * Math.cos(rad);
          const ty = cy + textR * Math.sin(rad);
          ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.font = '8px var(--font-mono, monospace)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${deg.toString().padStart(3, '0')}°`, tx, ty);
        }
      }

      // Cardinal Labels (N, E, S, W)
      const cardinals = [
        { label: 'N', deg: 0, color: '#38bdf8' },
        { label: 'E', deg: 90, color: '#94a3b8' },
        { label: 'S', deg: 180, color: '#94a3b8' },
        { label: 'W', deg: 270, color: '#94a3b8' },
      ];
      cardinals.forEach(({ label, deg, color }) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const tx = cx + (radius - 14) * Math.cos(rad);
        const ty = cy + (radius - 14) * Math.sin(rad);
        ctx.fillStyle = color;
        ctx.font = 'bold 11px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, tx, ty);
      });
      ctx.restore();

      // 3. Concentric Distance Range Rings
      const ringSteps = [0.25, 0.5, 0.75, 1.0];
      ringSteps.forEach((step) => {
        const r = radius * step;
        ctx.strokeStyle = step === 1.0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash(step === 1.0 ? [] : [3, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring distance label along North-East radial
        const labelDistKm = Math.round(rangeKm * step);
        const lAngle = (45 - 90) * (Math.PI / 180);
        const lx = cx + r * Math.cos(lAngle);
        const ly = cy + r * Math.sin(lAngle);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.font = '9px var(--font-mono, monospace)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${labelDistKm} km`, lx + 3, ly - 2);
      });

      // 4. Tactical Crosshairs
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Clip scope interior for all map and weather layers
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // ==========================================
      // 5. MAP OUTLINE & GEOGRAPHIC LANDMARKS LAYER
      // ==========================================
      if (showMap && (activeLayer === 'ALL' || activeLayer === 'MAP')) {
        // A. Water Bodies (Bellandur, Varthur, Hesaraghatta, TG Halli, etc.) - Subtle outlines, no text clutter
        WATER_BODIES.forEach((wb) => {
          const pts = wb.points.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
          if (pts.length > 2) {
            ctx.fillStyle = 'rgba(6, 182, 212, 0.035)';
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        });

        // B. Bangalore Metropolitan Boundary
        const metroPts = BANGALORE_METRO_BOUNDARY.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
        if (metroPts.length > 3) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
          ctx.lineWidth = 1.0;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.015)';
          ctx.beginPath();
          ctx.moveTo(metroPts[0].x, metroPts[0].y);
          for (let i = 1; i < metroPts.length; i++) {
            ctx.lineTo(metroPts[i].x, metroPts[i].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // C. Inner BBMP Core Boundary
        const innerPts = BANGALORE_INNER_BOUNDARY.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
        if (innerPts.length > 3) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(innerPts[0].x, innerPts[0].y);
          for (let i = 1; i < innerPts.length; i++) {
            ctx.lineTo(innerPts[i].x, innerPts[i].y);
          }
          ctx.closePath();
          ctx.stroke();
        }

        // D. Outer Ring Road (ORR) Loop (Subtle dashed tactical trace)
        const orrPts = RING_ROADS.outerRingRoad.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
        if (orrPts.length > 3) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.20)';
          ctx.lineWidth = 1.0;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(orrPts[0].x, orrPts[0].y);
          for (let i = 1; i < orrPts.length; i++) {
            ctx.lineTo(orrPts[i].x, orrPts[i].y);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // E. NICE Peripheral Road
        const nicePts = RING_ROADS.niceRoad.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
        if (nicePts.length > 2) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.16)';
          ctx.lineWidth = 0.9;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(nicePts[0].x, nicePts[0].y);
          for (let i = 1; i < nicePts.length; i++) {
            ctx.lineTo(nicePts[i].x, nicePts[i].y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // F. Radial Arterials & Expressways (NH44 North/South, NH75, NH275, NH48, SH35)
        MAJOR_ARTERIALS.forEach((art) => {
          const pts = art.points.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
          if (pts.length > 1) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.stroke();
          }
        });

        // G. Airfields & Runways (Kempegowda VOBL, HAL VOBG, Yelahanka VOJK)
        AIRFIELDS.forEach((af) => {
          const pt = projectGeo(af.lat, af.lon);
          if (pt) {
            ctx.save();
            ctx.translate(pt.x, pt.y);

            // Draw runway strips
            af.runways.forEach((rw) => {
              ctx.save();
              ctx.rotate((rw.heading * Math.PI) / 180);
              const rwLenPx = Math.max(7, (rw.lengthKm / rangeKm) * radius * 0.75);

              // Runway center line
              ctx.strokeStyle = af.id === 'VOBL' ? 'rgba(56, 189, 248, 0.75)' : 'rgba(56, 189, 248, 0.40)';
              ctx.lineWidth = af.id === 'VOBL' ? 1.8 : 1.2;
              ctx.beginPath();
              ctx.moveTo(-rwLenPx / 2, rw.offsetLat * 80);
              ctx.lineTo(rwLenPx / 2, rw.offsetLat * 80);
              ctx.stroke();
              ctx.restore();
            });

            // Center beacon dot
            ctx.fillStyle = af.id === 'VOBL' ? '#38bdf8' : 'rgba(56, 189, 248, 0.6)';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();

            // Minimal clean label
            ctx.fillStyle = af.id === 'VOBL' ? 'rgba(56, 189, 248, 0.85)' : 'rgba(148, 163, 184, 0.6)';
            ctx.font = 'bold 7.5px var(--font-mono, monospace)';
            ctx.textAlign = 'center';
            ctx.fillText(af.code, 0, 12);
            ctx.restore();
          }
        });

        // H. Sector Landmarks (Decluttered: spaced far apart, faint and non-intrusive)
        const visibleLandmarks = LANDMARK_HUBS.filter((lm) => {
          if (isDecluttered) {
            // In clean mode: only show 3 widely spaced anchors to preserve absolute clarity
            if (lm.tier === 1 && lm.short !== 'HEBBAL') return true;
            if (lm.tier === 3 && rangeKm >= 100 && lm.short === 'HOSUR') return true;
            return false;
          }
          return lm.minRange <= rangeKm && (!lm.maxRange || lm.maxRange >= rangeKm);
        });

        visibleLandmarks.forEach((lm) => {
          const pt = projectGeo(lm.lat, lm.lon);
          if (pt) {
            // Tiny 1.5px marker pip
            ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Subtle, dim tactical label
            ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
            ctx.font = '7px var(--font-mono, monospace)';
            ctx.textAlign = 'left';
            ctx.fillText(lm.short || lm.name, pt.x + 3.5, pt.y + 2);
          }
        });

        // I. Airspace Fixes / Waypoints (Only in non-decluttered view)
        if (!isDecluttered) {
          AIRSPACE_WAYPOINTS.forEach((wp) => {
            const pt = projectGeo(wp.lat, wp.lon);
            if (pt) {
              ctx.strokeStyle = 'rgba(192, 132, 252, 0.3)';
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(pt.x, pt.y - 3);
              ctx.lineTo(pt.x + 3, pt.y);
              ctx.lineTo(pt.x, pt.y + 3);
              ctx.lineTo(pt.x - 3, pt.y);
              ctx.closePath();
              ctx.stroke();

              ctx.fillStyle = 'rgba(192, 132, 252, 0.5)';
              ctx.font = '6.5px var(--font-mono, monospace)';
              ctx.textAlign = 'center';
              ctx.fillText(wp.name, pt.x, pt.y + 9);
            }
          });
        }
      }

      // ==========================================
      // 6. FULL WEATHER RADAR: DOPPLER REFLECTIVITY (dBZ) & RAIN CELLS
      // ==========================================
      if (showWeatherRadar && (activeLayer === 'ALL' || activeLayer === 'WEATHER' || activeLayer === 'CLOUDS')) {
        const radarCells = cloudData?.radarCells || [];
        const windDeg = cloudData?.windDeg ?? 110;
        const windRad = ((windDeg - 90) * Math.PI) / 180;
        const driftOffset = Math.sin(now * 0.001) * 3; // subtle atmospheric wave motion

        radarCells.forEach((cell, idx) => {
          const pt = projectGeo(cell.lat, cell.lon);
          if (pt) {
            const visualRadius = Math.max(18, (cell.radiusKm / rangeKm) * radius * 0.95);
            const cellGrad = ctx.createRadialGradient(
              pt.x + driftOffset,
              pt.y + driftOffset,
              0,
              pt.x + driftOffset,
              pt.y + driftOffset,
              visualRadius
            );

            if (cell.dbz >= 45) {
              // Severe convective storm cell / downpour (Magenta -> Red -> Amber -> Cyan)
              cellGrad.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
              cellGrad.addColorStop(0.3, 'rgba(249, 115, 22, 0.38)');
              cellGrad.addColorStop(0.65, 'rgba(234, 179, 8, 0.25)');
              cellGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
            } else if (cell.dbz >= 35) {
              // Heavy rain / shower cell (Amber -> Lime -> Cyan)
              cellGrad.addColorStop(0, 'rgba(234, 179, 8, 0.38)');
              cellGrad.addColorStop(0.45, 'rgba(132, 204, 22, 0.26)');
              cellGrad.addColorStop(0.8, 'rgba(34, 197, 94, 0.15)');
              cellGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
            } else if (cell.dbz >= 24) {
              // Moderate to light rain (Green -> Cyan)
              cellGrad.addColorStop(0, 'rgba(34, 197, 94, 0.30)');
              cellGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.18)');
              cellGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
            } else {
              // Cloud condensation deck / trace moisture (Soft Cyan/Teal)
              cellGrad.addColorStop(0, 'rgba(6, 182, 212, 0.20)');
              cellGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.10)');
              cellGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
            }

            ctx.fillStyle = cellGrad;
            ctx.beginPath();
            ctx.arc(pt.x + driftOffset, pt.y + driftOffset, visualRadius, 0, Math.PI * 2);
            ctx.fill();

            // Cell reflectivity tag (only in non-decluttered view for severe cells)
            if (!isDecluttered && cell.dbz >= 42) {
              ctx.fillStyle = cell.color;
              ctx.font = 'bold 7px var(--font-mono, monospace)';
              ctx.textAlign = 'center';
              ctx.fillText(`${cell.dbz} dBZ`, pt.x, pt.y - visualRadius * 0.4);
            }
          }
        });

        // Storm motion vector indicator (showing cloud/rain drift direction)
        const stormDir = cloudData?.stormMotionDir ?? 290;
        const stormDirRad = ((stormDir - 90) * Math.PI) / 180;
        const arrowR = radius * 0.65;
        const ax = cx + arrowR * Math.cos(stormDirRad);
        const ay = cy + arrowR * Math.sin(stormDirRad);

        ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore(); // end clip

      // ==========================================
      // 7. ROTATING RADAR SWEEP BEAM & PHOSPHOR TRAIL
      // ==========================================
      if (isSweeping) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();

        const trailAngle = (45 * Math.PI) / 180;
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
        sweepGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.08)');
        sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

        const segments = 24;
        for (let s = 0; s < segments; s++) {
          const a1 = sweepAngle - (trailAngle * (s + 1)) / segments;
          const a2 = sweepAngle - (trailAngle * s) / segments;
          const alpha = 0.22 * Math.pow((segments - s) / segments, 2.2);

          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, radius, a1, a2);
          ctx.closePath();
          ctx.fill();
        }

        // Leading sweep line
        const lx = cx + radius * Math.cos(sweepAngle);
        const ly = cy + radius * Math.sin(sweepAngle);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(lx, ly);
        ctx.stroke();
        ctx.restore();
      }

      // ==========================================
      // 8. AIRCRAFT ADS-B BLIPS & VECTORS (WITH TYPE ICONS)
      // ==========================================
      if (activeLayer === 'ALL' || activeLayer === 'FLIGHTS') {
        const inScopeFlights = visibleFlights.filter((f) => f.distanceKm <= rangeKm);

        inScopeFlights.forEach((flight, flightIdx) => {
          const normDist = flight.distanceKm / rangeKm;
          const bearingRad = (flight.bearingDeg * Math.PI) / 180;
          const px = cx + radius * normDist * Math.sin(bearingRad);
          const py = cy - radius * normDist * Math.cos(bearingRad);

          // Check if sweep beam touches this aircraft
          const blipAngle = Math.atan2(py - cy, px - cx);
          const normBlipAngle = (blipAngle + Math.PI * 2) % (Math.PI * 2);
          const normSweep = (sweepAngle + Math.PI * 2) % (Math.PI * 2);
          const angleDiff = (normSweep - normBlipAngle + Math.PI * 2) % (Math.PI * 2);

          const isIlluminated = angleDiff < 0.6;
          const isSelected = flight.id === selectedFlightId;
          const isHovered = flight.id === hoveredFlightId;
          const isCategoryMatch = selectedCategory === 'ALL' || flight.category === selectedCategory;

          // Subtle audio ping
          if (
            isAudioEnabled &&
            isSweeping &&
            angleDiff < 0.08 &&
            now - lastBlipPingRef.current > 400 &&
            (isSelected || flight === inScopeFlights[0])
          ) {
            lastBlipPingRef.current = now;
            playRadarPing();
          }

          // A. Projected Velocity Vector line
          const headingRad = ((flight.heading - 90) * Math.PI) / 180;
          const vectorLen = Math.min(26, Math.max(9, (flight.speedKts / 400) * 20));
          const vx = px + vectorLen * Math.cos(headingRad);
          const vy = py + vectorLen * Math.sin(headingRad);

          ctx.strokeStyle = isSelected
            ? '#38bdf8'
            : isIlluminated
            ? (flight.categoryColor || '#38bdf8')
            : 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = isSelected ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(vx, vy);
          ctx.stroke();

          // B. Distinct Aircraft Icons based on Aircraft Category
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate((flight.heading * Math.PI) / 180);

          const iconColor = isSelected ? '#38bdf8' : (flight.categoryColor || '#38bdf8');
          ctx.fillStyle = iconColor;
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1;
          ctx.globalAlpha = isCategoryMatch ? 1.0 : 0.35;

          if (flight.category === 'MILITARY') {
            // Delta-wing fighter silhouette (sharp tactical triangle)
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(6, 6);
            ctx.lineTo(2, 4);
            ctx.lineTo(2, 7);
            ctx.lineTo(0, 5);
            ctx.lineTo(-2, 7);
            ctx.lineTo(-2, 4);
            ctx.lineTo(-6, 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (flight.category === 'CARGO') {
            // Heavy cargo freighter with wider wings & blunt nose
            ctx.beginPath();
            ctx.moveTo(0, -6.5);
            ctx.lineTo(7, 4);
            ctx.lineTo(3, 3);
            ctx.lineTo(3, 7);
            ctx.lineTo(0, 5.5);
            ctx.lineTo(-3, 7);
            ctx.lineTo(-3, 3);
            ctx.lineTo(-7, 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (flight.category === 'HELICOPTER') {
            // Rotary wing symbol (rotor disc circle + fuselage)
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(2, 3);
            ctx.lineTo(0, 6);
            ctx.lineTo(-2, 3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (flight.category === 'REGIONAL') {
            // Straight-wing turboprop silhouette
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(6, 1);
            ctx.lineTo(2, 2);
            ctx.lineTo(2, 6);
            ctx.lineTo(0, 5);
            ctx.lineTo(-2, 6);
            ctx.lineTo(-2, 2);
            ctx.lineTo(-6, 1);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            // Commercial Passenger Swept-Wing Chevron
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(5.5, 5);
            ctx.lineTo(2, 3);
            ctx.lineTo(2, 6);
            ctx.lineTo(0, 5);
            ctx.lineTo(-2, 6);
            ctx.lineTo(-2, 3);
            ctx.lineTo(-5.5, 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();

          // C. Target Acquisition Brackets
          if (isSelected || isHovered) {
            ctx.save();
            ctx.strokeStyle = isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.7)';
            ctx.lineWidth = 1.5;
            const bSize = 10;
            // Corners
            ctx.beginPath();
            ctx.moveTo(px - bSize, py - bSize + 4);
            ctx.lineTo(px - bSize, py - bSize);
            ctx.lineTo(px - bSize + 4, py - bSize);
            ctx.moveTo(px + bSize - 4, py - bSize);
            ctx.lineTo(px + bSize, py - bSize);
            ctx.lineTo(px + bSize, py - bSize + 4);
            ctx.moveTo(px + bSize, py + bSize - 4);
            ctx.lineTo(px + bSize, py + bSize);
            ctx.lineTo(px + bSize - 4, py + bSize);
            ctx.moveTo(px - bSize + 4, py + bSize);
            ctx.lineTo(px - bSize, py + bSize);
            ctx.lineTo(px - bSize, py + bSize - 4);
            ctx.stroke();

            // Range vector
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }

          // D. Aircraft Callsign & Tactical HUD Data Block
          ctx.save();
          const callsignText = (flight.flightNum || flight.callsign || '').trim();

          if (isSelected || isHovered) {
            // ===============================================
            // SELECTED OR HOVERED FLIGHT: High-Contrast Tactical HUD Card
            // ===============================================
            const cardW = 112;
            const cardH = 46;
            const placeRight = px + cardW + 24 < width - 12;
            const placeBelow = py + cardH + 24 < height - 12;

            const cardX = placeRight ? px + 18 : px - cardW - 18;
            const cardY = placeBelow ? py + 12 : py - cardH - 12;

            // Angled tactical leader line
            ctx.strokeStyle = isSelected ? '#38bdf8' : (flight.categoryColor || '#38bdf8');
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            const elbowX = placeRight ? px + 10 : px - 10;
            ctx.lineTo(elbowX, cardY + cardH / 2);
            ctx.lineTo(placeRight ? cardX : cardX + cardW, cardY + cardH / 2);
            ctx.stroke();

            // Card background & glowing border
            ctx.fillStyle = 'rgba(3, 10, 24, 0.95)';
            ctx.strokeStyle = isSelected ? '#38bdf8' : (flight.categoryColor || '#38bdf8');
            ctx.lineWidth = 1.2;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 4);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Line 1: Callsign & Category Badge
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9.5px var(--font-mono, monospace)';
            ctx.textAlign = 'left';
            ctx.fillText(callsignText, cardX + 6, cardY + 13);

            ctx.fillStyle = flight.categoryColor || '#38bdf8';
            ctx.font = 'bold 7.5px var(--font-mono, monospace)';
            ctx.textAlign = 'right';
            ctx.fillText(`[${flight.categoryBadge || 'CIV'}]`, cardX + cardW - 6, cardY + 13);

            // Line 2: Flight Level & Speed
            ctx.fillStyle = '#38bdf8';
            ctx.font = '8px var(--font-mono, monospace)';
            ctx.textAlign = 'left';
            const altStr = `${flight.flightLevel} ${flight.verticalSymbol}`;
            const spdStr = `${flight.speedKts}kt • ${flight.distanceKm}km`;
            ctx.fillText(`${altStr}  ${spdStr}`, cardX + 6, cardY + 26);

            // Line 3: Model / Airline Class
            ctx.fillStyle = '#94a3b8';
            ctx.font = '7.5px var(--font-mono, monospace)';
            const modelStr = (flight.aircraftType || flight.categoryLabel || '').slice(0, 20);
            ctx.fillText(modelStr, cardX + 6, cardY + 39);

          } else {
            // ===============================================
            // STANDARD UNSELECTED FLIGHT: Compact, Crisp Single-Line Chip
            // ===============================================
            ctx.font = 'bold 7.5px var(--font-mono, monospace)';
            const textWidth = ctx.measureText(callsignText).width;
            const chipW = Math.max(26, textWidth + 8);
            const chipH = 12;

            // Alternate placement offset (left/right) to prevent stacking between adjacent aircraft
            const isAlt = flightIdx % 2 === 1;
            const chipX = isAlt ? px - chipW - 6 : px + 6;
            const chipY = py - 6;

            // Minimal dark pill
            ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
            ctx.strokeStyle = flight.categoryColor ? `${flight.categoryColor}66` : 'rgba(56, 189, 248, 0.25)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.roundRect(chipX, chipY, chipW, chipH, 2.5);
            ctx.fill();
            ctx.stroke();

            // Callsign text
            ctx.fillStyle = isCategoryMatch ? '#f8fafc' : 'rgba(248, 250, 252, 0.35)';
            ctx.textAlign = 'center';
            ctx.fillText(callsignText, chipX + chipW / 2, chipY + 9);
          }

          ctx.restore();
        });
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    isSweeping,
    rangeKm,
    activeLayer,
    showMap,
    showWeatherRadar,
    isDecluttered,
    centerKey,
    activeCenter,
    visibleFlights,
    selectedCategory,
    cloudData,
    selectedFlightId,
    hoveredFlightId,
    isAudioEnabled,
    playRadarPing,
  ]);

  // Handle mouse move on canvas to hover aircraft
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const radius = Math.min(cx, cy) - 22;

    let foundId = null;
    let minD = 20;

    visibleFlights.forEach((flight) => {
      if (flight.distanceKm > rangeKm) return;
      const normDist = flight.distanceKm / rangeKm;
      const bearingRad = (flight.bearingDeg * Math.PI) / 180;
      const px = cx + radius * normDist * Math.sin(bearingRad);
      const py = cy - radius * normDist * Math.cos(bearingRad);

      const d = Math.hypot(mouseX - px, mouseY - py);
      if (d < minD) {
        minD = d;
        foundId = flight.id;
      }
    });

    setHoveredFlightId(foundId);
    canvas.style.cursor = foundId ? 'pointer' : 'crosshair';
  };

  const handleCanvasMouseLeave = () => {
    setHoveredFlightId(null);
  };

  // Handle click on canvas to select aircraft
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const radius = Math.min(cx, cy) - 22;

    let closestId = null;
    let minDistance = 24;

    visibleFlights.forEach((flight) => {
      if (flight.distanceKm > rangeKm) return;
      const normDist = flight.distanceKm / rangeKm;
      const bearingRad = (flight.bearingDeg * Math.PI) / 180;
      const px = cx + radius * normDist * Math.sin(bearingRad);
      const py = cy - radius * normDist * Math.cos(bearingRad);

      const d = Math.hypot(clickX - px, clickY - py);
      if (d < minDistance) {
        minDistance = d;
        closestId = flight.id;
      }
    });

    setSelectedFlightId((prev) => (prev === closestId ? null : closestId));
  };

  return (
    <div className="dash-card radar-card stark-hud-card" role="region" aria-label="Regional Airspace & Full Weather Radar">
      <div className="stark-card-corner tl" />
      <div className="stark-card-corner tr" />
      <div className="stark-card-corner bl" />
      <div className="stark-card-corner br" />

      {/* 1. Header Bar */}
      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-radar">
            <Radio size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="card-section-title">Airspace & Weather Radar</h2>
              <span className="live-status-pill">
                <span className="pulse-dot" style={{ backgroundColor: 'var(--accent-emerald)' }} />
                {visibleFlights.length} AIRBORNE
              </span>
              {cloudData?.isRaining && (
                <span className="rain-live-pill">
                  <CloudRain size={11} />
                  RAIN ACTIVE ({cloudData.precipMm} mm/h)
                </span>
              )}
            </div>
            <div className="radar-subtitle">
              {activeCenter.shortName} • {activeCenter.lat.toFixed(4)}°N {activeCenter.lon.toFixed(4)}°E • BANGALORE FIR
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`radar-icon-btn ${isAudioEnabled ? 'is-active' : ''}`}
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            title={isAudioEnabled ? 'Mute radar ping' : 'Enable tactical radar ping'}
            aria-label="Toggle radar audio"
          >
            {isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <button
            className={`radar-icon-btn ${isSweeping ? 'is-active' : ''}`}
            onClick={() => setIsSweeping(!isSweeping)}
            title={isSweeping ? 'Pause radar sweep' : 'Resume radar sweep'}
            aria-label="Toggle radar sweep"
          >
            {isSweeping ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            className="radar-icon-btn"
            onClick={handleRefresh}
            title="Refresh ADS-B & Weather"
            aria-label="Refresh radar"
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* 2. Tactical Controls Bar: Layers, Ranges, Centers, Map & Weather Toggles */}
      <div className="radar-controls-bar">
        {/* Layer Mode Pills */}
        <div className="radar-control-group">
          <span className="control-label">
            <Layers size={11} style={{ display: 'inline', marginRight: 3 }} />
            LAYER:
          </span>
          <div className="pill-toggle-container">
            {['ALL', 'FLIGHTS', 'WEATHER', 'MAP'].map((layer) => (
              <button
                key={layer}
                className={`pill-toggle-btn ${activeLayer === layer ? 'active' : ''}`}
                onClick={() => setActiveLayer(layer)}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>

        {/* Range Selector */}
        <div className="radar-control-group">
          <span className="control-label">RANGE:</span>
          <div className="pill-toggle-container">
            {[50, 100, 150, 200].map((r) => (
              <button
                key={r}
                className={`pill-toggle-btn ${rangeKm === r ? 'active' : ''}`}
                onClick={() => setRangeKm(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        {/* Feature Toggles (Declutter, Map Outline & Rain Radar) */}
        <div className="radar-control-group">
          <button
            className={`feature-toggle-pill ${isDecluttered ? 'active' : ''}`}
            onClick={() => setIsDecluttered(!isDecluttered)}
            title="Toggle Declutter Mode: Hides background noise, prevents text overlap, and maximizes readability"
          >
            <Sliders size={11} style={{ marginRight: 4 }} />
            DECLUTTER: {isDecluttered ? 'ON (CLEAN)' : 'OFF'}
          </button>

          <button
            className={`feature-toggle-pill ${showMap ? 'active' : ''}`}
            onClick={() => setShowMap(!showMap)}
            title="Toggle Bangalore map outline, ring roads and landmarks"
          >
            <Map size={11} style={{ marginRight: 4 }} />
            MAP OUTLINE
          </button>

          <button
            className={`feature-toggle-pill ${showWeatherRadar ? 'active' : ''}`}
            onClick={() => setShowWeatherRadar(!showWeatherRadar)}
            title="Toggle Doppler rain & weather radar reflectivity"
          >
            <CloudRain size={11} style={{ marginRight: 4 }} />
            RAIN RADAR (dBZ)
          </button>
        </div>

        {/* Center Point Selector */}
        <div className="radar-control-group">
          <span className="control-label">
            <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />
            CENTER:
          </span>
          <div className="pill-toggle-container">
            <button
              className={`pill-toggle-btn ${centerKey === 'USER' ? 'active' : ''}`}
              onClick={() => setCenterKey('USER')}
              title={`Center radar on your location (${userLocation?.cityName || 'GPS'})`}
            >
              MY LOCATION
            </button>
            <button
              className={`pill-toggle-btn ${centerKey === 'VOBL' ? 'active' : ''}`}
              onClick={() => setCenterKey('VOBL')}
              title="Regional International Airport (VOBL)"
            >
              VOBL AIRPORT
            </button>
            <button
              className={`pill-toggle-btn ${centerKey === 'CITY' ? 'active' : ''}`}
              onClick={() => setCenterKey('CITY')}
              title="Local City Sector"
            >
              LOCAL SECTOR
            </button>
          </div>
        </div>
      </div>

      {/* 3. Aircraft Category Filter Bar */}
      <div className="aircraft-category-filter-strip">
        <span className="filter-title">FLIGHT TYPES:</span>
        <div className="category-chips-list">
          {[
            { id: 'ALL', label: 'ALL', count: categoryCounts.ALL, color: '#38bdf8' },
            { id: 'COMMERCIAL', label: 'COMMERCIAL', count: categoryCounts.COMMERCIAL, color: '#38bdf8' },
            { id: 'CARGO', label: 'CARGO FREIGHT', count: categoryCounts.CARGO, color: '#f97316' },
            { id: 'MILITARY', label: 'MILITARY DEFENSE', count: categoryCounts.MILITARY, color: '#22c55e' },
            { id: 'PRIVATE', label: 'PRIVATE JET', count: categoryCounts.PRIVATE, color: '#c084fc' },
            { id: 'REGIONAL', label: 'REGIONAL', count: categoryCounts.REGIONAL, color: '#06b6d4' },
            { id: 'HELICOPTER', label: 'ROTARY', count: categoryCounts.HELICOPTER, color: '#eab308' },
          ].map((cat) => (
            <button
              key={cat.id}
              className={`category-chip-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                borderColor: selectedCategory === cat.id ? cat.color : undefined,
                color: selectedCategory === cat.id ? cat.color : undefined,
              }}
            >
              <span className="cat-chip-dot" style={{ backgroundColor: cat.color }} />
              {cat.label}
              <span className="cat-chip-count">{cat.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Radar Content: Scope Canvas + Telemetry Panels */}
      <div className="radar-main-content">
        {/* Left / Center: Interactive Radar Scope Canvas */}
        <div className="radar-canvas-container">
          <canvas
            ref={canvasRef}
            className="radar-canvas"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            title="Hover or click any aircraft blip to inspect live flight telemetry"
          />

          {/* Top-Left Badge: Range & Map Status */}
          <div className="scope-overlay-badge top-left">
            <span>
              AZ: 360° • RANGE: {rangeKm} KM {showMap ? '• MAP ON' : ''}
            </span>
          </div>

          {/* Top-Right Badge: Doppler dBZ Key */}
          {showWeatherRadar && (
            <div className="scope-overlay-badge top-right doppler-key-chip">
              <span className="key-title">DOPPLER (dBZ):</span>
              <span className="key-scale">
                <span style={{ color: '#06b6d4' }}>15</span>
                <span style={{ color: '#22c55e' }}>25</span>
                <span style={{ color: '#eab308' }}>35</span>
                <span style={{ color: '#f97316' }}>45</span>
                <span style={{ color: '#ec4899' }}>55+</span>
              </span>
            </div>
          )}

          {/* Bottom-Right Badge: Live Data Feed & Timestamp */}
          <div className="scope-overlay-badge bottom-right">
            <span>
              FEED: {flightSource.toUpperCase()}
              {lastUpdated ? ` • ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
            </span>
          </div>
        </div>

        {/* Right Side: Airspace Flights vs Weather Radar Telemetry Panels */}
        <div className="radar-side-panel">
          {/* Sub-tab navigation between Flights and Weather */}
          <div className="panel-tab-strip">
            <button
              className={`panel-tab-btn ${activeTab === 'FLIGHTS' ? 'active' : ''}`}
              onClick={() => setActiveTab('FLIGHTS')}
            >
              <Plane size={13} style={{ marginRight: 5 }} />
              AIRSPACE FLIGHTS ({categoryFilteredFlights.length})
            </button>
            <button
              className={`panel-tab-btn ${activeTab === 'WEATHER' ? 'active' : ''}`}
              onClick={() => setActiveTab('WEATHER')}
            >
              <CloudRain size={13} style={{ marginRight: 5 }} />
              FULL WEATHER RADAR
            </button>
          </div>

          {activeTab === 'WEATHER' ? (
            /* ==================================================== */
            /* FULL WEATHER & RAIN RADAR TELEMETRY VIEW              */
            /* ==================================================== */
            <div className="radar-telemetry-box weather-focus-box">
              <div className="box-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CloudRain size={15} color="var(--accent-cyan)" />
                  <span className="box-title">Doppler Weather Radar</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="category-pill"
                    style={{
                      color: cloudData?.categoryColor || 'var(--accent-emerald)',
                      borderColor: cloudData?.categoryColor || 'var(--accent-emerald)',
                    }}
                  >
                    {cloudData?.flightCategory || 'VFR'}
                  </span>
                </div>
              </div>

              {/* Rain Hero Gauge */}
              <div className="weather-hero-card">
                <div className="rain-gauge-block">
                  <div className="rain-rate-val">{cloudData?.precipMm ?? 0} <span className="unit">mm/h</span></div>
                  <div className="rain-rate-lbl">PRECIPITATION RATE</div>
                </div>

                <div className="dbz-gauge-block" style={{ borderColor: cloudData?.dbzColor || '#06b6d4' }}>
                  <div className="dbz-number" style={{ color: cloudData?.dbzColor || '#06b6d4' }}>
                    {cloudData?.peakDbz ?? 14} <span className="unit">dBZ</span>
                  </div>
                  <div className="dbz-label">PEAK REFLECTIVITY</div>
                </div>

                <div className="rain-risk-block">
                  <div className="risk-percent">{cloudData?.rainRiskPct ?? 10}%</div>
                  <div className="risk-label">3H RAIN RISK</div>
                </div>
              </div>

              {/* Weather Condition Highlight */}
              <div className="weather-condition-banner">
                <div className="condition-desc-bold">{cloudData?.conditionDesc || 'Clear Skies'}</div>
                <div className="storm-motion-text">
                  Storm Motion Drift: <strong>{cloudData?.stormMotionDir ?? 290}° ({cloudData?.stormMotionCompass ?? 'WNW'})</strong> @ {cloudData?.windSpeedKts ?? 8} kts
                </div>
              </div>

              {/* Doppler Color Legend Scale */}
              <div className="doppler-scale-panel">
                <div className="scale-title">DOPPLER REFLECTIVITY SCALE (dBZ)</div>
                <div className="scale-bar">
                  <div className="scale-segment" style={{ backgroundColor: '#06b6d4' }}>&lt;18 (Trace)</div>
                  <div className="scale-segment" style={{ backgroundColor: '#22c55e' }}>25 (Light)</div>
                  <div className="scale-segment" style={{ backgroundColor: '#84cc16' }}>35 (Mod)</div>
                  <div className="scale-segment" style={{ backgroundColor: '#eab308' }}>45 (Heavy)</div>
                  <div className="scale-segment" style={{ backgroundColor: '#f97316' }}>52 (Downpour)</div>
                  <div className="scale-segment" style={{ backgroundColor: '#ec4899' }}>58+ (Severe)</div>
                </div>
              </div>

              {/* Cloud Layer Distribution (Low / Mid / High) */}
              <div className="cloud-layer-meters">
                <div className="layer-item">
                  <div className="layer-label-row">
                    <span>Low Deck (0–2km)</span>
                    <span className="layer-pct">{cloudData?.cloudLow ?? 5}%</span>
                  </div>
                  <div className="mini-progress-track">
                    <div className="mini-progress-bar" style={{ width: `${cloudData?.cloudLow ?? 5}%`, backgroundColor: 'var(--accent-cyan)' }} />
                  </div>
                </div>

                <div className="layer-item">
                  <div className="layer-label-row">
                    <span>Mid Deck (2–6km)</span>
                    <span className="layer-pct">{cloudData?.cloudMid ?? 6}%</span>
                  </div>
                  <div className="mini-progress-track">
                    <div className="mini-progress-bar" style={{ width: `${cloudData?.cloudMid ?? 6}%`, backgroundColor: 'var(--accent-emerald)' }} />
                  </div>
                </div>

                <div className="layer-item">
                  <div className="layer-label-row">
                    <span>High Deck (&gt;6km)</span>
                    <span className="layer-pct">{cloudData?.cloudHigh ?? 4}%</span>
                  </div>
                  <div className="mini-progress-track">
                    <div className="mini-progress-bar" style={{ width: `${cloudData?.cloudHigh ?? 4}%`, backgroundColor: 'var(--accent-purple)' }} />
                  </div>
                </div>
              </div>

              {/* Active Radar Rain Cells List */}
              <div className="radar-cells-summary">
                <div className="cells-header">ACTIVE WEATHER RADAR CELLS</div>
                <div className="cells-grid">
                  {(cloudData?.radarCells || []).map((cell) => (
                    <div key={cell.id} className="radar-cell-card">
                      <div className="cell-top">
                        <span className="cell-dot" style={{ backgroundColor: cell.color }} />
                        <span className="cell-name">{cell.name}</span>
                        <span className="cell-dbz" style={{ color: cell.color }}>{cell.dbz} dBZ</span>
                      </div>
                      <div className="cell-bottom">
                        <span>{cell.severity}</span>
                        <span>{cell.rainRateMmH} mm/h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Atmospheric Telemetry Grid */}
              <div className="atmospheric-metrics-grid">
                <div className="metric-chip">
                  <Wind size={12} color="var(--accent-cyan)" />
                  <span className="chip-label">SURFACE WIND</span>
                  <span className="chip-value">{cloudData?.windSpeedKts ?? 7} kt @ {cloudData?.windDirText ?? 'ESE'}</span>
                </div>
                <div className="metric-chip">
                  <Gauge size={12} color="var(--accent-amber)" />
                  <span className="chip-label">ALTIMETER QNH</span>
                  <span className="chip-value">{cloudData?.pressureHpa ?? 1013} hPa</span>
                </div>
                <div className="metric-chip">
                  <Eye size={12} color="var(--accent-emerald)" />
                  <span className="chip-label">VISIBILITY</span>
                  <span className="chip-value">{cloudData?.visibilityKm ?? 20} km</span>
                </div>
              </div>
            </div>
          ) : (
            /* ==================================================== */
            /* AIRSPACE FLIGHTS & AIRCRAFT TYPE INSPECTOR VIEW      */
            /* ==================================================== */
            <>
              {/* Airspace Summary Strip */}
              <div className="airspace-summary-strip">
                <div className="summary-metric">
                  <span className="lbl">IN SCOPE</span>
                  <span className="val">{airspaceStats.totalInRange} flights</span>
                </div>
                <div className="summary-metric">
                  <span className="lbl">CLOSEST</span>
                  <span className="val">{airspaceStats.closestCallsign} ({airspaceStats.closestDist})</span>
                </div>
                <div className="summary-metric">
                  <span className="lbl">CEILING</span>
                  <span className="val">{airspaceStats.highestAlt}</span>
                </div>
                <div className="summary-metric">
                  <span className="lbl">MAX SPEED</span>
                  <span className="val">{airspaceStats.fastestSpeed}</span>
                </div>
              </div>

              {/* Selected Flight Inspector HUD Card */}
              {selectedFlight ? (
                <div className="selected-flight-hud">
                  <div className="hud-top-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="airline-code-badge"
                        style={{ backgroundColor: selectedFlight.airlineBg, color: selectedFlight.airlineColor }}
                      >
                        {selectedFlight.airlineCode}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="hud-callsign">{selectedFlight.flightNum}</span>
                          <span
                            className="hud-category-badge"
                            style={{
                              color: selectedFlight.categoryColor,
                              backgroundColor: selectedFlight.categoryBg,
                              borderColor: selectedFlight.categoryColor,
                            }}
                          >
                            {selectedFlight.categoryBadge}
                          </span>
                        </div>
                        <div className="hud-aircraft-model">{selectedFlight.aircraftType}</div>
                      </div>
                    </div>
                    <button
                      className="close-hud-btn"
                      onClick={() => setSelectedFlightId(null)}
                      title="Close inspector"
                      aria-label="Close inspector"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Classification Strip */}
                  <div className="hud-class-strip">
                    <span><strong>Role:</strong> {selectedFlight.categoryLabel}</span>
                    <span><strong>Class:</strong> {selectedFlight.aircraftClass}</span>
                    <span><strong>Phase:</strong> {selectedFlight.flightPhaseLabel}</span>
                  </div>

                  <div className="hud-telemetry-grid">
                    <div className="hud-metric">
                      <span className="lbl">ALTITUDE</span>
                      <span className="val cyan">{selectedFlight.altitudeFt.toLocaleString()} ft ({selectedFlight.flightLevel})</span>
                    </div>
                    <div className="hud-metric">
                      <span className="lbl">SPEED</span>
                      <span className="val emerald">{selectedFlight.speedKts} kts ({selectedFlight.speedKmh} km/h)</span>
                    </div>
                    <div className="hud-metric">
                      <span className="lbl">DISTANCE</span>
                      <span className="val">{selectedFlight.distanceKm} km ({selectedFlight.distanceNm} NM)</span>
                    </div>
                    <div className="hud-metric">
                      <span className="lbl">BEARING</span>
                      <span className="val">{selectedFlight.bearingDeg}° {selectedFlight.compass}</span>
                    </div>
                    <div className="hud-metric">
                      <span className="lbl">V-RATE</span>
                      <span className="val">{selectedFlight.verticalSymbol} {selectedFlight.verticalRateFpm} fpm</span>
                    </div>
                    <div className="hud-metric">
                      <span className="lbl">SQUAWK</span>
                      <span className="val font-mono">{selectedFlight.squawk}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Scrollable Active Airspace Flights Table with Flight Type Indicators */
                <div className="airspace-flight-list custom-scroll">
                  <div className="list-header-row">
                    <span>FLIGHT / TYPE</span>
                    <span>AIRCRAFT MODEL</span>
                    <span>ALTITUDE</span>
                    <span>SPEED</span>
                    <span>RANGE</span>
                  </div>
                  {categoryFilteredFlights.map((f) => (
                    <div
                      key={f.id}
                      className={`flight-row-item ${hoveredFlightId === f.id ? 'is-hovered' : ''}`}
                      onMouseEnter={() => setHoveredFlightId(f.id)}
                      onMouseLeave={() => setHoveredFlightId(null)}
                      onClick={() => setSelectedFlightId(f.id)}
                    >
                      <div className="flight-col-id">
                        <span
                          className="mini-category-tag"
                          style={{ color: f.categoryColor, backgroundColor: f.categoryBg }}
                        >
                          {f.categoryBadge}
                        </span>
                        <span className="flight-id-str">{f.flightNum}</span>
                      </div>
                      <div className="flight-col-model" title={f.aircraftType}>
                        {f.aircraftType}
                      </div>
                      <div className="flight-col-alt">
                        <span>{f.flightLevel}</span>
                        <span
                          className="v-symbol"
                          style={{
                            color:
                              f.verticalStatus === 'CLIMBING'
                                ? '#34d399'
                                : f.verticalStatus === 'DESCENDING'
                                ? '#fbbf24'
                                : '#94a3b8',
                          }}
                        >
                          {f.verticalSymbol}
                        </span>
                      </div>
                      <div className="flight-col-spd">
                        {f.speedKts} kt
                      </div>
                      <div className="flight-col-range">
                        {f.distanceKm} km
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
