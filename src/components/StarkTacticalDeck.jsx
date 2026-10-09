import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Radio,
  Newspaper,
  Car,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Briefcase,
  ArrowRightLeft,
  Activity,
  Pause,
  Play,
} from 'lucide-react';

import GoogleTrafficMap from './GoogleTrafficMap';
import {
  fetchBangaloreFlights,
  fetchBangaloreCloudInfo,
  getCachedFlights,
  calculateDistanceKm,
  calculateBearingDeg,
  getShortAircraftModel,
} from '../services/radarService';
import {
  BANGALORE_METRO_BOUNDARY,
  BANGALORE_INNER_BOUNDARY,
  RING_ROADS,
  MAJOR_ARTERIALS,
  WATER_BODIES,
  AIRFIELDS,
  LANDMARK_HUBS,
} from '../services/radarMapData';

import {
  fetchLiveTrafficData,
} from '../services/trafficService';

export default function StarkTacticalDeck({
  newsArticles = [],
  cycleSeconds = 18,
  autoCycle = true,
  userLocation = { lat: 12.9716, lon: 77.7473, cityName: 'Your Location' },
  commuteData = null,
  onToggleCommuteDirection = null,
}) {
  // Main deck active slide: 0 = SURFACE TRAFFIC, 1 = AIRSPACE RADAR, 2 = SATELLITE INTEL
  const [activeSlide, setActiveSlide] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const s = urlParams.get('slide');
      if (s !== null) {
        const parsed = parseInt(s, 10);
        if ([0, 1, 2].includes(parsed)) return parsed;
      }
    } catch {}
    return 0;
  });
  const [isPaused, setIsPaused] = useState(!autoCycle || cycleSeconds <= 0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  // Sub-state: News
  const [newsIndex, setNewsIndex] = useState(0);
  const [newsImgError, setNewsImgError] = useState(false);

  // Sub-state: Airspace Radar (Strictly 50 km range on homescreen, no selectable options)
  const RADAR_RANGE_KM = 50;
  const [radarFlights, setRadarFlights] = useState(() => getCachedFlights(userLocation, 75));
  const [radarFlightSource, setRadarFlightSource] = useState(() => {
    try {
      const s = localStorage.getItem('aether_cached_flights');
      if (s) {
        const o = JSON.parse(s);
        return o?.source || 'loading';
      }
    } catch {}
    return 'loading';
  });
  const [cloudInfo, setCloudInfo] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Sub-state: Surface Traffic Map with dynamic scales (2km, 10km, 20km) & auto-oscillation
  const [trafficScaleKm, setTrafficScaleKm] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('stark_traffic_scale_km'));
      return [2, 10, 20].includes(saved) ? saved : 10;
    } catch {
      return 10;
    }
  });

  const [isOscillating, setIsOscillating] = useState(() => {
    try {
      const saved = localStorage.getItem('stark_traffic_oscillate');
      if (saved !== null) return saved === 'true';
      return true; // Oscillate between scales by default
    } catch {
      return true;
    }
  });
  const oscillateDirRef = useRef(1); // 1 = expanding (3 -> 10 -> 20), -1 = contracting (20 -> 10 -> 3)

  const [trafficData, setTrafficData] = useState(null);

  const radarCanvasRef = useRef(null);
  const radarAnimRef = useRef(null);
  const radarSweepAngleRef = useRef(0);
  const timerRef = useRef(null);

  // Dynamic Airspace & Traffic Centers anchored to User's Location
  const activeRadarCenter = useMemo(() => ({
    id: 'USER_LOC',
    name: userLocation?.cityName || 'User Airspace',
    shortName: (userLocation?.cityName || 'Airspace').split(',')[0],
    lat: userLocation?.lat || 12.9716,
    lon: userLocation?.lon || 77.7473,
    elevationM: 920,
    runways: [
      { id: '09L/27R', heading: 92, lengthM: 4000 },
      { id: '09R/27L', heading: 92, lengthM: 4000 },
    ],
  }), [userLocation?.lat, userLocation?.lon, userLocation?.cityName]);

  const activeTrafficCenter = useMemo(() => ({
    key: 'USER',
    name: userLocation?.cityName || 'Your Location',
    shortName: (userLocation?.cityName || 'MY LOCATION').split(',')[0].toUpperCase(),
    lat: userLocation?.lat || 12.9716,
    lon: userLocation?.lon || 77.7473,
  }), [userLocation?.lat, userLocation?.lon, userLocation?.cityName]);

  // Deck slide names & icons: Traffic (0), Radar (1), News (2)
  const SLIDES = useMemo(() => [
    {
      id: 0,
      key: 'traffic',
      code: 'SYS-01',
      title: 'SURFACE TRAFFIC',
      icon: Car,
      tag: commuteData
        ? `${commuteData.liveEtaMinutes}M COMMUTE`
        : isOscillating
          ? `∿ ${trafficScaleKm}KM AUTO`
          : `${trafficScaleKm}KM MAP`,
    },
    {
      id: 1,
      key: 'radar',
      code: 'SYS-02',
      title: 'AIRSPACE RADAR',
      icon: Radio,
      tag: '50KM SCOPE',
    },
    {
      id: 2,
      key: 'news',
      code: 'SYS-03',
      title: 'SATELLITE INTEL',
      icon: Newspaper,
      tag: 'GLOBAL DISPATCH',
    },
  ], [commuteData, trafficScaleKm, isOscillating]);

  // Auto-oscillate between 2km, 10km, and 20km scales (8 second interval)
  useEffect(() => {
    if (!isOscillating) return;

    const interval = setInterval(() => {
      setTrafficScaleKm((curr) => {
        const scales = [2, 10, 20];
        let dir = oscillateDirRef.current;
        let idx = scales.indexOf(curr);
        if (idx === -1) idx = 1;

        let nextIdx = idx + dir;
        if (nextIdx >= scales.length) {
          dir = -1;
          oscillateDirRef.current = -1;
          nextIdx = scales.length - 2; // from 20 -> 10
        } else if (nextIdx < 0) {
          dir = 1;
          oscillateDirRef.current = 1;
          nextIdx = 1; // from 2 -> 10
        }

        const nextScale = scales[nextIdx];
        try {
          localStorage.setItem('stark_traffic_scale_km', String(nextScale));
        } catch {}
        return nextScale;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isOscillating]);

  // 1. Deck Auto-looping Timer
  useEffect(() => {
    if (isPaused || isHovered) return;

    const stepMs = 100;
    const increment = (stepMs / (cycleSeconds * 1000)) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveSlide((curr) => (curr + 1) % SLIDES.length);
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(timerRef.current);
  }, [isPaused, isHovered, cycleSeconds, SLIDES.length]);

  // Auto-oscillate news headlines (5.5s cycle)
  useEffect(() => {
    if (newsArticles.length <= 1 || isPaused || isHovered) return;
    const interval = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % newsArticles.length);
      setNewsImgError(false);
    }, 5500);
    return () => clearInterval(interval);
  }, [newsArticles.length, isPaused, isHovered]);

  const goToSlide = (idx) => {
    setActiveSlide(idx);
    setProgress(0);
  };

  const handleTabClick = (slideId) => {
    if (activeSlide === slideId) {
      setIsPaused((prev) => !prev);
    } else {
      setActiveSlide(slideId);
      setProgress(0);
    }
  };

  // 2. Airspace Radar Data (50 km scope)
  const loadRadarData = useCallback(async () => {
    try {
      const [flightsRes, clouds] = await Promise.all([
        fetchBangaloreFlights(activeRadarCenter, 75),
        fetchBangaloreCloudInfo(activeRadarCenter.lat, activeRadarCenter.lon, false),
      ]);
      const flightList = Array.isArray(flightsRes)
        ? flightsRes
        : (flightsRes?.flights || []);
      setRadarFlights(flightList);
      setRadarFlightSource(flightsRes?.source || 'live');
      setCloudInfo(clouds);
    } catch (err) {
      console.warn('Airspace data load warning:', err);
    }
  }, [activeRadarCenter]);

  useEffect(() => {
    loadRadarData();
    const interval = setInterval(loadRadarData, 30000);
    return () => clearInterval(interval);
  }, [loadRadarData]);

  // 3. Traffic Data (dynamically scaled according to active scale)
  const loadTrafficData = useCallback(async () => {
    try {
      const data = await fetchLiveTrafficData(activeTrafficCenter, trafficScaleKm);
      setTrafficData(data);
    } catch {
      // Background catch
    }
  }, [activeTrafficCenter, trafficScaleKm]);

  useEffect(() => {
    loadTrafficData();
    const interval = setInterval(loadTrafficData, 30000);
    return () => clearInterval(interval);
  }, [loadTrafficData]);

  // Filter & calculate polar coordinates for flights in 50 km scope
  const visibleFlights = useMemo(() => {
    const list = Array.isArray(radarFlights) ? radarFlights : (radarFlights?.flights || []);
    const mapped = list
      .map((f) => {
        const dist = calculateDistanceKm(activeRadarCenter.lat, activeRadarCenter.lon, f.lat, f.lon);
        const brg = calculateBearingDeg(activeRadarCenter.lat, activeRadarCenter.lon, f.lat, f.lon);
        return {
          ...f,
          distanceKm: Math.round(dist * 10) / 10,
          bearingDeg: brg,
        };
      });

    return mapped
      .filter((f) => f && f.distanceKm <= RADAR_RANGE_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [radarFlights, activeRadarCenter, RADAR_RANGE_KM]);

  // 4. Airspace Radar Canvas Animation (50 km scope matching RadarCard)
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas || activeSlide !== 1) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 290;
      const height = rect.height || 290;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 14;

      // Project geo coordinates relative to activeRadarCenter and RADAR_RANGE_KM (50 km)
      const projectGeo = (lat, lon) => {
        const d = calculateDistanceKm(activeRadarCenter.lat, activeRadarCenter.lon, lat, lon);
        if (d > RADAR_RANGE_KM * 1.15) return null;
        const b = calculateBearingDeg(activeRadarCenter.lat, activeRadarCenter.lon, lat, lon);
        const rad = (b * Math.PI) / 180;
        const norm = d / RADAR_RANGE_KM;
        return {
          x: cx + radius * norm * Math.sin(rad),
          y: cy - radius * norm * Math.cos(rad),
          distKm: d,
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
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 2. Cardinal Labels (N, E, S, W) & Ticks
      const cardinals = [
        { label: 'N', deg: 0, color: '#00f0ff' },
        { label: 'E', deg: 90, color: 'rgba(148, 163, 184, 0.7)' },
        { label: 'S', deg: 180, color: 'rgba(148, 163, 184, 0.7)' },
        { label: 'W', deg: 270, color: 'rgba(148, 163, 184, 0.7)' },
      ];
      cardinals.forEach(({ label, deg, color }) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const tx = cx + (radius - 10) * Math.cos(rad);
        const ty = cy + (radius - 10) * Math.sin(rad);
        ctx.fillStyle = color;
        ctx.font = 'bold 9px var(--font-mono, monospace)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, tx, ty);
      });

      // 3. Concentric Range Rings (12.5km, 25km, 37.5km, 50km)
      [0.25, 0.5, 0.75, 1].forEach((pct) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * pct, 0, Math.PI * 2);
        ctx.strokeStyle = pct === 1 ? 'rgba(0, 240, 255, 0.35)' : 'rgba(0, 240, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.setLineDash(pct === 1 ? [] : [2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label distance along North-East radial
        const lDist = Math.round(RADAR_RANGE_KM * pct);
        const lAngle = (45 - 90) * (Math.PI / 180);
        const lx = cx + radius * pct * Math.cos(lAngle);
        const ly = cy + radius * pct * Math.sin(lAngle);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.55)';
        ctx.font = '7.5px var(--font-mono, monospace)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${lDist}k`, lx + 2, ly - 2);
      });

      // 4. Tactical Crosshairs
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
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

      // 5. Geographic Map Layer
      // A. Water bodies
      WATER_BODIES.forEach((wb) => {
        const pts = wb.points.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
        if (pts.length > 2) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.04)';
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      // B. Metro Boundary
      const metroPts = BANGALORE_METRO_BOUNDARY.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
      if (metroPts.length > 3) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(metroPts[0].x, metroPts[0].y);
        for (let i = 1; i < metroPts.length; i++) ctx.lineTo(metroPts[i].x, metroPts[i].y);
        ctx.closePath();
        ctx.stroke();
      }

      // C. Inner BBMP Core Boundary
      const innerPts = BANGALORE_INNER_BOUNDARY.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
      if (innerPts.length > 3) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.10)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(innerPts[0].x, innerPts[0].y);
        for (let i = 1; i < innerPts.length; i++) ctx.lineTo(innerPts[i].x, innerPts[i].y);
        ctx.closePath();
        ctx.stroke();
      }

      // D. Outer Ring Road (ORR) Loop
      const orrPts = RING_ROADS.outerRingRoad.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
      if (orrPts.length > 3) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.32)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(orrPts[0].x, orrPts[0].y);
        for (let i = 1; i < orrPts.length; i++) ctx.lineTo(orrPts[i].x, orrPts[i].y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // E. NICE Peripheral Road
      const nicePts = RING_ROADS.niceRoad.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
      if (nicePts.length > 2) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.20)';
        ctx.lineWidth = 0.9;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(nicePts[0].x, nicePts[0].y);
        for (let i = 1; i < nicePts.length; i++) ctx.lineTo(nicePts[i].x, nicePts[i].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // F. Major Radial Arterials
      MAJOR_ARTERIALS.forEach((art) => {
        const pts = art.points.map(([pLat, pLon]) => projectGeo(pLat, pLon)).filter(Boolean);
        if (pts.length > 1) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
      });

      // G. Airfields & Oriented Runways (VOBL, VOBG, VOJK)
      AIRFIELDS.forEach((af) => {
        const pt = projectGeo(af.lat, af.lon);
        if (pt) {
          ctx.save();
          ctx.translate(pt.x, pt.y);
          af.runways.forEach((rw) => {
            ctx.save();
            ctx.rotate((rw.heading * Math.PI) / 180);
            const rwLenPx = Math.max(9, (rw.lengthKm / RADAR_RANGE_KM) * radius * 0.85);
            ctx.strokeStyle = af.id === 'VOBL' ? 'rgba(0, 240, 255, 0.85)' : 'rgba(0, 240, 255, 0.45)';
            ctx.lineWidth = af.id === 'VOBL' ? 1.8 : 1.2;
            ctx.beginPath();
            ctx.moveTo(-rwLenPx / 2, rw.offsetLat * 80);
            ctx.lineTo(rwLenPx / 2, rw.offsetLat * 80);
            ctx.stroke();
            ctx.restore();
          });

          ctx.fillStyle = af.id === 'VOBL' ? '#00f0ff' : 'rgba(0, 240, 255, 0.7)';
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
          ctx.font = 'bold 7.5px var(--font-mono, monospace)';
          ctx.textAlign = 'center';
          ctx.fillText(af.code, 0, 11);
          ctx.restore();
        }
      });

      // H. Clean Spaced Sector Anchors
      LANDMARK_HUBS.filter((lm) => lm.tier === 1 && lm.short !== 'HEBBAL').forEach((lm) => {
        const pt = projectGeo(lm.lat, lm.lon);
        if (pt) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
          ctx.font = '7px var(--font-mono, monospace)';
          ctx.textAlign = 'left';
          ctx.fillText(lm.short || lm.name, pt.x + 3.5, pt.y + 2.5);
        }
      });

      // 6. Doppler Weather Radar Reflectivity & Rain Cells
      const radarCells = cloudInfo?.radarCells || [];
      radarCells.forEach((cell) => {
        const pt = projectGeo(cell.lat, cell.lon);
        if (pt) {
          const vRadius = Math.max(16, (cell.radiusKm / RADAR_RANGE_KM) * radius * 0.95);
          const cellGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, vRadius);
          if (cell.dbz >= 45) {
            cellGrad.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
            cellGrad.addColorStop(0.35, 'rgba(249, 115, 22, 0.35)');
            cellGrad.addColorStop(0.7, 'rgba(234, 179, 8, 0.22)');
            cellGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          } else if (cell.dbz >= 35) {
            cellGrad.addColorStop(0, 'rgba(234, 179, 8, 0.35)');
            cellGrad.addColorStop(0.5, 'rgba(132, 204, 22, 0.22)');
            cellGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          } else if (cell.dbz >= 24) {
            cellGrad.addColorStop(0, 'rgba(34, 197, 94, 0.28)');
            cellGrad.addColorStop(0.55, 'rgba(6, 182, 212, 0.16)');
            cellGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
          } else {
            cellGrad.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
            cellGrad.addColorStop(0.6, 'rgba(0, 240, 255, 0.08)');
            cellGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
          }
          ctx.fillStyle = cellGrad;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, vRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 7. Sweep Beam & Phosphor Trail
      radarSweepAngleRef.current = (radarSweepAngleRef.current + 0.032) % (Math.PI * 2);
      const angle = radarSweepAngleRef.current;

      const beamGrad = ctx.createConicGradient(angle - 0.75, cx, cy);
      beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      beamGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.03)');
      beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0.32)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Sweep Leading Line
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.stroke();

      // 8. Flight ADS-B Contacts: Silhouettes, Velocity Vectors, Category Colors & Clean Chips
      visibleFlights.forEach((flight, fIdx) => {
        const pt = projectGeo(flight.lat, flight.lon);
        if (!pt) return;
        const { x: px, y: py } = pt;
        const isSel = selectedFlight?.id === flight.id;

        // Velocity vector line
        const flightColor = flight.airlineColor || flight.categoryColor || '#00f0ff';
        const headingRad = (((flight.heading || 0) - 90) * Math.PI) / 180;
        const vLen = Math.min(22, Math.max(8, ((flight.speedKts || 250) / 400) * 18));
        ctx.strokeStyle = isSel ? '#00f0ff' : flightColor;
        ctx.lineWidth = isSel ? 1.6 : 0.9;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + vLen * Math.cos(headingRad), py + vLen * Math.sin(headingRad));
        ctx.stroke();

        // Silhouette glyph
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(((flight.heading || 0) * Math.PI) / 180);
        ctx.fillStyle = isSel ? '#00f0ff' : flightColor;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 0.8;

        if (flight.category === 'MILITARY') {
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(5, 5);
          ctx.lineTo(2, 3.5);
          ctx.lineTo(2, 6);
          ctx.lineTo(0, 4.5);
          ctx.lineTo(-2, 6);
          ctx.lineTo(-2, 3.5);
          ctx.lineTo(-5, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (flight.category === 'CARGO') {
          ctx.beginPath();
          ctx.moveTo(0, -5.5);
          ctx.lineTo(6, 3.5);
          ctx.lineTo(2.5, 2.5);
          ctx.lineTo(2.5, 6);
          ctx.lineTo(0, 4.5);
          ctx.lineTo(-2.5, 6);
          ctx.lineTo(-2.5, 2.5);
          ctx.lineTo(-6, 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (flight.category === 'HELICOPTER') {
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -4);
          ctx.lineTo(2, 2.5);
          ctx.lineTo(0, 5);
          ctx.lineTo(-2, 2.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (flight.category === 'REGIONAL') {
          ctx.beginPath();
          ctx.moveTo(0, -5.5);
          ctx.lineTo(5.5, 1);
          ctx.lineTo(1.8, 1.8);
          ctx.lineTo(1.8, 5.5);
          ctx.lineTo(0, 4.5);
          ctx.lineTo(-1.8, 5.5);
          ctx.lineTo(-1.8, 1.8);
          ctx.lineTo(-5.5, 1);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -5.5);
          ctx.lineTo(5, 4.5);
          ctx.lineTo(1.8, 2.5);
          ctx.lineTo(1.8, 5.5);
          ctx.lineTo(0, 4.5);
          ctx.lineTo(-1.8, 5.5);
          ctx.lineTo(-1.8, 2.5);
          ctx.lineTo(-5, 4.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();

        // Single-line clean callsign chip with alternating offset
        const callsignStr = (flight.flightNum || flight.callsign || '').trim();
        if (callsignStr) {
          ctx.font = 'bold 7.5px var(--font-mono, monospace)';
          const textW = ctx.measureText(callsignStr).width;
          const chipW = Math.max(26, textW + 6);
          const chipH = 11;
          const isAlt = fIdx % 2 === 1;
          const chipX = isAlt ? px - chipW - 5 : px + 5;
          const chipY = py - 5;

          ctx.fillStyle = isSel ? 'rgba(8, 47, 73, 0.95)' : 'rgba(2, 6, 23, 0.85)';
          ctx.strokeStyle = isSel ? '#00f0ff' : `${flightColor}77`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.roundRect(chipX, chipY, chipW, chipH, 2.5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isSel ? '#00f0ff' : '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(callsignStr, chipX + chipW / 2, chipY + 8.5);
        }
      });

      // 9. Center Beacon for User Location
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore(); // end clip
      ctx.restore(); // end dpr scale

      radarAnimRef.current = requestAnimationFrame(render);
    };

    radarAnimRef.current = requestAnimationFrame(render);
    return () => {
      isMounted = false;
      if (radarAnimRef.current) cancelAnimationFrame(radarAnimRef.current);
    };
  }, [visibleFlights, cloudInfo, selectedFlight, activeSlide, activeRadarCenter, RADAR_RANGE_KM]);

  // 5. News State Helpers
  const currentNews = newsArticles[newsIndex] || {
    title: 'Decrypting global intelligence feeds...',
    source: 'World News',
    timeAgo: 'Live',
    imageUrl: null,
    link: '#',
    snippet: 'Monitoring worldwide telemetry arrays for updates.',
  };

  const handlePrevNews = (e) => {
    e.stopPropagation();
    if (newsArticles.length === 0) return;
    setNewsIndex((prev) => (prev - 1 + newsArticles.length) % newsArticles.length);
    setNewsImgError(false);
  };

  const handleNextNews = (e) => {
    e.stopPropagation();
    if (newsArticles.length === 0) return;
    setNewsIndex((prev) => (prev + 1) % newsArticles.length);
    setNewsImgError(false);
  };

  return (
    <div
      className="full-width-tactical-deck stark-tactical-frame"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Iron Man Mk LXXXV HUD Corner Brackets */}
      <div className="stark-frame-corner tl" />
      <div className="stark-frame-corner tr" />
      <div className="stark-frame-corner bl" />
      <div className="stark-frame-corner br" />

      {/* Top Animated Neon Scan Beam */}
      <div className="stark-frame-scanner" />

      {/* Top Deck Control Header */}
      <div className="deck-control-header">
        {/* Holographic Slide Tabs */}
        <div className="deck-tabs-row">
          {SLIDES.map((slide) => {
            const Icon = slide.icon;
            const isActive = activeSlide === slide.id;
            return (
              <button
                key={slide.id}
                className={`deck-tab-pill ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(slide.id)}
                title={
                  isActive
                    ? isPaused
                      ? 'Click to resume auto-loop'
                      : 'Click to pause on this card'
                    : `Switch to ${slide.title}`
                }
              >
                <span className="deck-tab-code">{slide.code}</span>
                <Icon size={12} />
                <span>{slide.title}</span>
                {isActive && isPaused && (
                  <span className="deck-tab-pause-badge">PAUSED</span>
                )}
                {slide.tag ? (
                  <span
                    className="deck-tab-tag"
                    style={
                      slide.key === 'traffic' && commuteData
                        ? {
                            color: '#ef4444',
                            borderColor: 'rgba(239, 68, 68, 0.45)',
                            background: 'rgba(239, 68, 68, 0.14)',
                            fontWeight: 800,
                          }
                        : {}
                    }
                  >
                    {slide.tag}
                  </span>
                ) : null}
              </button>
            );
          })}

          <button
            className={`deck-tab-pill deck-pause-toggle-btn ${isPaused ? 'paused' : ''}`}
            onClick={() => setIsPaused((prev) => !prev)}
            title={
              isPaused
                ? 'Auto-cycle paused. Click to resume auto-looping slides.'
                : 'Auto-cycle active. Click to pause on current slide.'
            }
          >
            {isPaused ? <Play size={10} fill="currentColor" /> : <Pause size={10} fill="currentColor" />}
            <span>{isPaused ? 'PAUSED' : 'AUTO'}</span>
          </button>
        </div>
      </div>

      {/* Looping Countdown Progress Line (Click to Pause/Resume) */}
      <div
        className="deck-progress-track"
        onClick={() => setIsPaused((prev) => !prev)}
        style={{ cursor: 'pointer' }}
        title={isPaused ? 'Click to resume auto-loop' : 'Click to pause auto-loop'}
      >
        <div
          className="deck-progress-bar"
          style={{
            width: isPaused ? '100%' : `${progress}%`,
            background: isPaused ? 'var(--stark-gold, #fbbf24)' : undefined,
          }}
        />
      </div>

      {/* 3D Stack Viewport (Full Width, Expanded Vertical Length) */}
      <div className="deck-3d-viewport">
        {SLIDES.map((slide) => {
          const layerOffset = (slide.id - activeSlide + SLIDES.length) % SLIDES.length;
          const isFront = layerOffset === 0;

          return (
            <div
              key={slide.id}
              className={`deck-slide-layer layer-${layerOffset} ${isFront ? 'is-front' : 'is-stacked'}`}
              onClick={!isFront ? () => goToSlide(slide.id) : undefined}
            >
              {/* RADAR SLIDE: FULL-WIDTH AIRSPACE RADAR (50 KM RANGE) */}
              {slide.key === 'radar' && (
                <div className="fw-radar-content">
                  {/* Left: Scope Canvas (Expanded size) */}
                  <div className="fw-radar-canvas-box">
                    <canvas
                      ref={radarCanvasRef}
                      className="fw-radar-canvas"
                      title="Airspace Scope // 50km Sector"
                    />
                    <div className="fw-scope-badge">
                      <span>{activeRadarCenter.shortName} • 50KM SECTOR</span>
                    </div>
                  </div>

                  {/* Center: Live Clouds & Met Telemetry */}
                  <div className="fw-radar-center-col">
                    <div className="card-section-super">
                      <span className="tag-bracket">[</span>SYS-02 // AERONAUTICAL METAR<span className="tag-bracket">]</span>
                    </div>

                    <div className="fw-status-top">
                      <div className="compact-airborne-pill">
                        <span
                          className="pulse-dot"
                          style={{
                            backgroundColor: radarFlightSource.includes('tactical') ? '#fbbf24' : '#00f0ff',
                            width: 5,
                            height: 5,
                          }}
                        />
                        <span>{visibleFlights.length} TRACKED AIRBORNE</span>
                      </div>
                      <div className="compact-status-tag">
                        <span>
                          {radarFlightSource.includes('tactical')
                            ? 'TACTICAL AIRSPACE'
                            : (radarFlightSource.includes('replay')
                              ? 'RADAR MEMORY'
                              : (radarFlightSource.includes('google') ? 'GOOGLE LIVE ADS-B' : 'LIVE ADS-B'))}
                        </span>
                      </div>
                    </div>

                    <div className="fw-cloud-card">
                      <div className="fw-cloud-val-box">
                        <span className="fw-cloud-val">{cloudInfo?.cloudTotal ?? 27}%</span>
                        <span className="fw-cloud-lbl">COVER</span>
                      </div>
                      <div className="fw-cloud-text">
                        <div className="fw-cloud-title">{cloudInfo?.conditionDesc || 'Partly Cloudy (SCT)'}</div>
                        <div className="fw-cloud-sub">
                          Visibility: <span style={{ color: '#00f0ff' }}>{cloudInfo?.visibilityKm ?? 20}km</span> • Ceiling: <span style={{ color: '#00f0ff' }}>{cloudInfo?.ceilingText || 'Unlim'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Runway & Wind Bar */}
                    <div className="fw-metar-bar">
                      <span className="metar-tag">VOBL 09L/27R</span>
                      <span className="metar-dot">•</span>
                      <span className="metar-val">WIND: {cloudInfo?.windSpeedKts ?? 14}kt @ {cloudInfo?.windDeg ?? 80}°</span>
                      <span className="metar-dot">•</span>
                      <span className="metar-val">QNH {cloudInfo?.pressureHpa ?? 1014}hPa</span>
                    </div>

                    <div className="fw-avionics-sub-bar">
                      <span className="avionics-tag">XPDR: ADS-B 1090MHz</span>
                      <span className="metar-dot">•</span>
                      <span className="avionics-tag">MODE-S EN ROUTE</span>
                      <span className="metar-dot">•</span>
                      <span className="avionics-tag">RANGE: 50 KM</span>
                    </div>
                  </div>

                  {/* Right: Active Intercepts List within 50 km */}
                  <div className="fw-radar-right-col">
                    <div className="card-section-super">
                      <span className="tag-bracket">[</span>SYS-ADSB // SECTOR INTERCEPT MATRIX<span className="tag-bracket">]</span>
                    </div>

                    <div className="tape-header-row">
                      <span className="tape-header">AIRSPACE CONTACTS (50KM)</span>
                      <span className="compact-news-counter">[{visibleFlights.length} TARGETS]</span>
                    </div>

                    <div className="radar-table-head">
                      <span className="col-flight">FLIGHT / OPERATOR</span>
                      <span className="col-type">TYPE</span>
                      <span className="col-alt">ALT</span>
                      <span className="col-spd">SPD</span>
                      <span className="col-dist">DIST</span>
                    </div>

                    <div className="fw-contacts-list">
                      {visibleFlights.slice(0, 5).map((f) => {
                        const flightColor = f.airlineColor || f.categoryColor || '#00f0ff';
                        const shortModel = getShortAircraftModel(f);
                        const companyName = f.airline || 'Civil Aircraft';
                        const flightId = f.flightNum || f.callsign || 'UNK';
                        const altText = f.onGround
                          ? 'GND'
                          : (f.flightLevel || (f.altitudeFt >= 10000 ? `FL${Math.round(f.altitudeFt / 100)}` : `${f.altitudeFt || 0}ft`));
                        const spdText = `${Math.round(f.speedKts || ((f.velocityMs || 0) * 1.94384))}kt`;
                        const distText = `${f.distanceKm}km`;

                        return (
                          <div
                            key={f.id}
                            className={`tape-item ${selectedFlight?.id === f.id ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFlight(f);
                            }}
                            title={`${flightId} • ${companyName} • ${shortModel} • ${altText} • ${spdText}`}
                          >
                            <div className="tape-col-flight">
                              <span
                                className="tape-airline-dot"
                                style={{ backgroundColor: flightColor, boxShadow: `0 0 6px ${flightColor}99` }}
                              />
                              <div className="tape-flight-info">
                                <span className="tape-callsign" style={{ color: flightColor }}>
                                  {flightId}
                                </span>
                                <span className="tape-company-name">
                                  {companyName}
                                </span>
                              </div>
                            </div>
                            <div className="tape-col-type">
                              <span
                                className="tape-model-badge"
                                style={{ borderColor: `${flightColor}55`, color: flightColor }}
                              >
                                {shortModel}
                              </span>
                            </div>
                            <span className="tape-alt">{altText}</span>
                            <span className="tape-spd">{spdText}</span>
                            <span className="tape-dist">{distText}</span>
                          </div>
                        );
                      })}
                      {visibleFlights.length === 0 && (
                        <div className="tactical-radar-scan-box">
                          <div className="scan-line-anim" />
                          <div className="scan-telemetry-row">
                            <span className="scan-dot active" />
                            <span>SWEEP: 360° CONTINUOUS SCAN</span>
                          </div>
                          <div className="scan-telemetry-row">
                            <span className="scan-dot" />
                            <span>AIRSPACE: 50 KM PERIMETER SECURE</span>
                          </div>
                          <div className="scan-telemetry-row">
                            <span className="scan-dot" />
                            <span>AERODROMES: VOBL • VOBG • VOJK</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Operator Color Legend */}
                    <div className="radar-operator-legend">
                      <div className="legend-title">OPERATOR COLOR IDENTIFIERS</div>
                      <div className="legend-grid">
                        <div className="legend-item" title="IndiGo">
                          <span className="legend-color-dot" style={{ backgroundColor: '#0080ff' }} />
                          <span className="legend-label">IndiGo</span>
                        </div>
                        <div className="legend-item" title="Air India">
                          <span className="legend-color-dot" style={{ backgroundColor: '#e52424' }} />
                          <span className="legend-label">Air India</span>
                        </div>
                        <div className="legend-item" title="Akasa Air">
                          <span className="legend-color-dot" style={{ backgroundColor: '#ff6200' }} />
                          <span className="legend-label">Akasa</span>
                        </div>
                        <div className="legend-item" title="Air India Express">
                          <span className="legend-color-dot" style={{ backgroundColor: '#f97316' }} />
                          <span className="legend-label">AI Express</span>
                        </div>
                        <div className="legend-item" title="SpiceJet">
                          <span className="legend-color-dot" style={{ backgroundColor: '#ef4444' }} />
                          <span className="legend-label">SpiceJet</span>
                        </div>
                        <div className="legend-item" title="Indian Air Force / Defense">
                          <span className="legend-color-dot" style={{ backgroundColor: '#22c55e' }} />
                          <span className="legend-label">IAF / Defense</span>
                        </div>
                        <div className="legend-item" title="Helicopters / Rotary">
                          <span className="legend-color-dot" style={{ backgroundColor: '#eab308' }} />
                          <span className="legend-label">Helicopter</span>
                        </div>
                        <div className="legend-item" title="Commercial & International">
                          <span className="legend-color-dot" style={{ backgroundColor: '#38bdf8' }} />
                          <span className="legend-label">Other / Int'l</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRAFFIC SLIDE: FULL-WIDTH SURFACE TRAFFIC MAP (3km, 10km, 20km with Auto-Oscillation) */}
              {slide.key === 'traffic' && (
                <div className="fw-traffic-map-content">
                  {/* Clean Full-Width Single Map View */}
                  <div className="fw-traffic-map-container single-mode">
                    <GoogleTrafficMap
                      center={activeTrafficCenter}
                      rangeKm={trafficScaleKm}
                      height="535px"
                      interactive={true}
                      topOffset={52}
                      showScaleBar={true}
                      showControls={true}
                      showLegend={true}
                      showBranding={false}
                    />
                  </div>

                  {/* Floating Stark HUD Telemetry Ribbon Over Map */}
                  <div className="fw-traffic-floating-hud">
                    <div className="hud-left">
                      <div className="hud-loc-chip">
                        <MapPin size={12} color="var(--stark-cyan)" />
                        <span className="loc-title">{activeTrafficCenter.shortName || 'HOME'}</span>
                      </div>
                      <div
                        className="hud-congestion-chip"
                        style={{
                          color:
                            (trafficData?.overallCongestion || 0) > 70
                              ? 'var(--stark-crimson)'
                              : (trafficData?.overallCongestion || 0) > 45
                                ? 'var(--stark-gold)'
                                : 'var(--stark-cyan)',
                          borderColor:
                            (trafficData?.overallCongestion || 0) > 70
                              ? 'rgba(239, 68, 68, 0.4)'
                              : 'rgba(0, 240, 255, 0.3)',
                        }}
                      >
                        <span
                          className="pulse-dot"
                          style={{
                            backgroundColor:
                              (trafficData?.overallCongestion || 0) > 70
                                ? '#ef4444'
                                : (trafficData?.overallCongestion || 0) > 45
                                  ? '#fbbf24'
                                  : '#00f0ff',
                            width: 5,
                            height: 5,
                          }}
                        />
                        <span>{trafficData?.overallCongestion ?? 64}% CONGESTION</span>
                      </div>
                    </div>

                    <div className="hud-center">
                      <div className="hud-metric-item">
                        <span className="metric-lbl">AVG SPEED</span>
                        <span className="metric-val cyan">{trafficData?.avgSpeedKmH ?? 22} km/h</span>
                      </div>

                      {/* Commute Telemetry with Inline Swap Button */}
                      {commuteData ? (
                        <div className="hud-commute-corridor-slot" style={{ borderColor: `${commuteData.color}55` }}>
                          <Briefcase size={10} color={commuteData.color} />
                          <span className="commute-slot-route">
                            {commuteData.fromAlias || commuteData.originAlias || 'Home'} ➔ {commuteData.toAlias || commuteData.destinationLabel || 'Work'}
                          </span>
                          <span className="commute-slot-eta" style={{ color: commuteData.color }}>
                            {commuteData.liveEtaMinutes}m
                          </span>
                          {commuteData.delayMinutes > 0 && (
                            <span className="commute-slot-delay">+{commuteData.delayMinutes}m</span>
                          )}
                          <span className="commute-slot-dist">{commuteData.distanceKm}km</span>
                          {onToggleCommuteDirection && (
                            <button
                              type="button"
                              className="commute-swap-inline-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleCommuteDirection();
                              }}
                              title="Swap Commute Direction"
                            >
                              <ArrowRightLeft size={10} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="hud-metric-item">
                          <span className="metric-lbl">DELAY</span>
                          <span className="metric-val gold">+{trafficData?.totalDelayMinutes ?? 28}m</span>
                        </div>
                      )}
                    </div>

                    <div className="hud-right">
                      {/* Scale Selector (2 KM, 10 KM, 20 KM) with Auto-Oscillation Toggle */}
                      <div className="traffic-scale-pill-group">
                        <button
                          type="button"
                          className={`traffic-scale-btn traffic-oscillate-btn ${isOscillating ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOscillating((prev) => {
                              const next = !prev;
                              try {
                                localStorage.setItem('stark_traffic_oscillate', String(next));
                              } catch {}
                              return next;
                            });
                          }}
                          title={isOscillating ? 'Pause auto-scale oscillation' : 'Play auto-scale oscillation (cycles between 2km, 10km, 20km)'}
                        >
                          {isOscillating ? <Pause size={10} /> : <Play size={10} />}
                        </button>

                        {[2, 10, 20].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`traffic-scale-btn ${trafficScaleKm === s ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrafficScaleKm(s);
                              if (s === 2) oscillateDirRef.current = 1;
                              if (s === 20) oscillateDirRef.current = -1;
                              try {
                                localStorage.setItem('stark_traffic_scale_km', String(s));
                              } catch {}
                            }}
                            title={`Switch map to ${s} KM scale`}
                          >
                            <span>{s} KM</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NEWS SLIDE: FULL-WIDTH SATELLITE INTEL (NEWS - OSCILLATING) */}
              {slide.key === 'news' && (
                <div className="fw-news-content">
                  {/* Left: Featured Photo or Satellite Orbital Telemetry */}
                  <div className="fw-news-media-box">
                    {currentNews.imageUrl && !newsImgError ? (
                      <img
                        src={currentNews.imageUrl}
                        alt={currentNews.title}
                        className="fw-news-img"
                        onError={() => setNewsImgError(true)}
                      />
                    ) : (
                      <div className="fw-news-fallback sat-hud-display">
                        <svg className="sat-hud-svg" viewBox="0 0 160 160" width="130" height="130">
                          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
                          <circle cx="80" cy="80" r="48" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1" />
                          <circle cx="80" cy="80" r="26" fill="rgba(0, 240, 255, 0.05)" stroke="rgba(0, 240, 255, 0.6)" strokeWidth="1.2" />
                          <line x1="80" y1="6" x2="80" y2="154" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="0.8" strokeDasharray="4 4" />
                          <line x1="6" y1="80" x2="154" y2="80" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="0.8" strokeDasharray="4 4" />
                          <circle cx="128" cy="80" r="4" fill="#00f0ff">
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              from="0 80 80"
                              to="360 80 80"
                              dur="12s"
                              repeatCount="indefinite"
                            />
                          </circle>
                          <circle cx="80" cy="80" r="6" fill="rgba(0, 240, 255, 0.3)" />
                          <circle cx="80" cy="80" r="3" fill="#00f0ff" />
                        </svg>
                        <div className="sat-hud-readout">
                          <span className="sat-hud-code">SIGINT // ORBITAL ARRAY</span>
                          <span className="sat-hud-sub">DOWNLINK: 480 Mbps • ECC ON</span>
                          <span className="sat-hud-sub">GEO: 12.97°N 77.74°E BLR</span>
                        </div>
                      </div>
                    )}
                    <div className="fw-news-tag">
                      <span className="pulse-dot" style={{ backgroundColor: '#00f0ff', width: 5, height: 5 }} />
                      <span>{currentNews.source || 'WORLD NEWS'}</span>
                    </div>
                  </div>

                  {/* Right: Headlines, Snippet, and Paginator */}
                  <div className="fw-news-body-box">
                    <div className="card-section-super">
                      <span className="tag-bracket">[</span>SYS-03 // SATELLITE INTELLIGENCE STREAM<span className="tag-bracket">]</span>
                    </div>

                    <div className="fw-news-top-row">
                      <span className="fw-news-feed-pill oscillating-feed">
                        <span className="oscillating-wave" />
                        <span>SATELLITE INTERCEPT // LIVE INTEL</span>
                      </span>
                      <span className="fw-news-time">{currentNews.timeAgo || 'Live'}</span>
                    </div>

                    <a
                      href={currentNews.link && currentNews.link !== '#' ? currentNews.link : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fw-news-headline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {currentNews.title}
                      <ExternalLink size={12} style={{ display: 'inline', marginLeft: 6, verticalAlign: 'middle' }} />
                    </a>

                    {currentNews.snippet && (
                      <p className="fw-news-snippet">
                        {currentNews.snippet}
                      </p>
                    )}

                    <div className="fw-news-footer">
                      <span className="compact-news-counter">
                        ARTICLE {newsArticles.length > 0 ? `${newsIndex + 1} / ${newsArticles.length}` : '0/0'}
                      </span>
                      <div className="compact-news-btns">
                        <button className="mini-arrow-btn" onClick={handlePrevNews} title="Previous article">
                          <ChevronLeft size={12} />
                        </button>
                        <button className="mini-arrow-btn" onClick={handleNextNews} title="Next article">
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
