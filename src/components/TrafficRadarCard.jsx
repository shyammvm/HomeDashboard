import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Car,
  Clock,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Plane,
  Building,
  Briefcase,
  Zap,
} from 'lucide-react';

import {
  TRAFFIC_CENTERS,
  fetchLiveTrafficData,
} from '../services/trafficService';

export default function TrafficRadarCard({
  centerKey = 'WHITEFIELD',
  defaultRangeKm = 15,
  isCompact = false,
}) {
  const [selectedCenter, setSelectedCenter] = useState(centerKey);
  const [rangeKm, setRangeKm] = useState(defaultRangeKm);
  const [trafficData, setTrafficData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCorridorId, setSelectedCorridorId] = useState(null);
  const [activeTab, setActiveTab] = useState('bottlenecks'); // 'bottlenecks' | 'etas'

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const sweepAngleRef = useRef(0);

  const activeCenter = TRAFFIC_CENTERS[selectedCenter] || TRAFFIC_CENTERS.WHITEFIELD;

  // Load traffic data
  const loadTraffic = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveTrafficData(activeCenter, rangeKm);
      setTrafficData(data);
    } catch (err) {
      console.warn('TrafficRadarCard: load error', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCenter, rangeKm]);

  useEffect(() => {
    loadTraffic();
    const timer = setInterval(loadTraffic, 30000); // 30 sec refresh
    return () => clearInterval(timer);
  }, [loadTraffic]);

  // Selected corridor details
  const selectedCorridor = useMemo(() => {
    if (!trafficData || !selectedCorridorId) return null;
    return trafficData.corridors.find((c) => c.id === selectedCorridorId);
  }, [trafficData, selectedCorridorId]);

  // Canvas Radar Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 220;
      const height = rect.height || 220;

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
      const radius = Math.min(cx, cy) - 12;

      // Outer Scope Ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#02050e';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Range Concentric Rings
      [0.33, 0.66, 1].forEach((pct) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * pct, 0, Math.PI * 2);
        ctx.strokeStyle = pct === 1 ? 'rgba(0, 240, 255, 0.35)' : 'rgba(0, 240, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Crosshairs
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Sweep Beam
      sweepAngleRef.current = (sweepAngleRef.current + 0.035) % (Math.PI * 2);
      const angle = sweepAngleRef.current;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const beamGrad = ctx.createConicGradient(angle - 0.7, cx, cy);
      beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      beamGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.04)');
      beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0.35)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Sweep Line
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.stroke();
      ctx.restore();

      // Draw Arterial Corridors
      if (trafficData?.corridors) {
        trafficData.corridors.forEach((c) => {
          if (c.distFromCenter > rangeKm * 1.25) return;

          const normDist = Math.min(1, c.distFromCenter / rangeKm);
          const bearingRad = ((c.bearingDeg - 90) * Math.PI) / 180;
          const px = cx + radius * normDist * Math.cos(bearingRad);
          const py = cy + radius * normDist * Math.sin(bearingRad);

          const isSel = selectedCorridorId === c.id;

          // Corridor Arterial Line radiating from center
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = c.color;
          ctx.lineWidth = isSel ? 3.5 : c.congestionPercent > 70 ? 2.5 : 1.5;
          ctx.stroke();

          // End node marker
          ctx.beginPath();
          ctx.arc(px, py, isSel ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = c.color;
          ctx.fill();
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Selection highlight
          if (isSel) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      }

      // Center Node (Home base / User Location)
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [trafficData, rangeKm, selectedCorridorId]);

  // Handle canvas click to select corridor
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !trafficData?.corridors) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const radius = Math.min(cx, cy) - 12;

    let closestId = null;
    let minDist = 20;

    trafficData.corridors.forEach((c) => {
      if (c.distFromCenter > rangeKm * 1.25) return;
      const normDist = Math.min(1, c.distFromCenter / rangeKm);
      const bearingRad = ((c.bearingDeg - 90) * Math.PI) / 180;
      const px = cx + radius * normDist * Math.cos(bearingRad);
      const py = cy + radius * normDist * Math.sin(bearingRad);

      const d = Math.hypot(clickX - px, clickY - py);
      if (d < minDist) {
        minDist = d;
        closestId = c.id;
      }
    });

    setSelectedCorridorId(closestId);
  };

  const RANGES = [5, 10, 15, 25, 40];

  return (
    <div
      className={`dash-card stark-hud-card traffic-radar-card ${isCompact ? 'compact' : ''}`}
      role="region"
      aria-label="Surface Traffic Radar"
    >
      <div className="stark-card-corner tl" />
      <div className="stark-card-corner tr" />
      <div className="stark-card-corner bl" />
      <div className="stark-card-corner br" />

      {/* Header Bar */}
      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-traffic">
            <Car size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="card-section-title">Surface Traffic Radar</h2>
              <span
                className="live-status-pill"
                style={{
                  color:
                    trafficData?.overallCongestion > 70
                      ? 'var(--stark-crimson)'
                      : trafficData?.overallCongestion > 45
                      ? 'var(--stark-gold)'
                      : 'var(--stark-cyan)',
                  borderColor:
                    trafficData?.overallCongestion > 70
                      ? 'rgba(239, 68, 68, 0.35)'
                      : 'rgba(0, 240, 255, 0.35)',
                }}
              >
                <span
                  className="pulse-dot"
                  style={{
                    backgroundColor:
                      trafficData?.overallCongestion > 70
                        ? '#ef4444'
                        : trafficData?.overallCongestion > 45
                        ? '#fbbf24'
                        : '#00f0ff',
                  }}
                />
                {trafficData?.overallCongestion ?? 58}% DENSITY
              </span>
            </div>
            <div className="radar-subtitle">
              {activeCenter.shortName} • RANGE: {rangeKm} KM
            </div>
          </div>
        </div>

        {/* Quick Actions & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className={`radar-icon-btn ${isLoading ? 'is-active' : ''}`}
            onClick={loadTraffic}
            title="Refresh live traffic telemetry"
            aria-label="Refresh traffic"
          >
            <RefreshCw size={13} style={{ animation: isLoading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Controls Bar: Range Selector & Center Location */}
      <div className="radar-controls-bar">
        {/* KM Range Selector */}
        <div className="radar-control-group">
          <span className="control-label">RANGE:</span>
          <div className="pill-toggle-container">
            {RANGES.map((r) => (
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

        {/* Center Point */}
        <div className="radar-control-group">
          <span className="control-label">CENTER:</span>
          <div className="pill-toggle-container">
            {Object.keys(TRAFFIC_CENTERS).map((k) => (
              <button
                key={k}
                className={`pill-toggle-btn ${selectedCenter === k ? 'active' : ''}`}
                onClick={() => setSelectedCenter(k)}
              >
                {TRAFFIC_CENTERS[k].shortName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Split: Radar Scope Canvas + Telemetry Panels */}
      <div className="traffic-main-split">
        {/* Left: Interactive Traffic Scope */}
        <div className="traffic-scope-container">
          <canvas
            ref={canvasRef}
            className="traffic-canvas"
            onClick={handleCanvasClick}
            title="Click any corridor to inspect congestion details"
          />
          <div className="scope-overlay-badge top-left">
            <span>AZ: 360° • {rangeKm}KM RADAR</span>
          </div>
          <div className="scope-overlay-badge bottom-right">
            <span>TRAFFIC • LIVE</span>
          </div>
        </div>

        {/* Right: Telemetry & Corridors */}
        <div className="traffic-telemetry-col">
          {/* Top Quick Stats Strip */}
          <div className="traffic-stats-strip">
            <div className="traffic-stat-item">
              <span className="traffic-stat-lbl">AVG SPEED</span>
              <span className="traffic-stat-val cyan">{trafficData?.avgSpeedKmH ?? 22} km/h</span>
            </div>
            <div className="traffic-stat-item">
              <span className="traffic-stat-lbl">ACTIVE DELAY</span>
              <span className="traffic-stat-val gold">+{trafficData?.totalDelayMinutes ?? 28}m</span>
            </div>
            <div className="traffic-stat-item">
              <span className="traffic-stat-lbl">CORRIDORS</span>
              <span className="traffic-stat-val emerald">{trafficData?.corridorsInRange.length ?? 6}</span>
            </div>
          </div>

          {/* Sub-Tabs: Bottlenecks vs Transit ETAs */}
          <div className="traffic-subtabs-row">
            <button
              className={`traffic-subtab-btn ${activeTab === 'bottlenecks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bottlenecks')}
            >
              <AlertTriangle size={11} />
              BOTTLENECKS
            </button>
            <button
              className={`traffic-subtab-btn ${activeTab === 'etas' ? 'active' : ''}`}
              onClick={() => setActiveTab('etas')}
            >
              <Clock size={11} />
              TRANSIT ETAs
            </button>
          </div>

          {/* Content A: Congested Bottlenecks */}
          {activeTab === 'bottlenecks' && (
            <div className="traffic-bottlenecks-list">
              {(trafficData?.bottlenecks || []).map((b) => (
                <div
                  key={b.id}
                  className={`traffic-corridor-row ${selectedCorridorId === b.id ? 'is-selected' : ''}`}
                  onClick={() => setSelectedCorridorId(b.id)}
                >
                  <div className="corridor-left">
                    <span
                      className="corridor-dot"
                      style={{ backgroundColor: b.color }}
                    />
                    <div className="corridor-info">
                      <span className="corridor-name">{b.name}</span>
                      <span className="corridor-sector">{b.sector} • {b.distFromCenter}km</span>
                    </div>
                  </div>
                  <div className="corridor-right">
                    <span className="corridor-speed" style={{ color: b.color }}>
                      {b.currentSpeedKm} km/h
                    </span>
                    <span className="corridor-delay">+{b.delayMins}m</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content B: Destination Transit ETAs from Whitefield */}
          {activeTab === 'etas' && (
            <div className="traffic-destinations-list">
              {(trafficData?.destinations || []).map((d) => (
                <div key={d.id} className="traffic-destination-row">
                  <div className="destination-left">
                    <div className="dest-icon-box">
                      {d.icon === 'Plane' && <Plane size={13} color="var(--stark-cyan)" />}
                      {d.icon === 'Building' && <Building size={13} color="var(--stark-gold)" />}
                      {d.icon === 'Briefcase' && <Briefcase size={13} color="var(--stark-cyan)" />}
                      {d.icon === 'MapPin' && <MapPin size={13} color="var(--stark-gold)" />}
                      {d.icon === 'Zap' && <Zap size={13} color="#10b981" />}
                    </div>
                    <div>
                      <div className="dest-name">{d.name}</div>
                      <div className="dest-route">{d.route}</div>
                    </div>
                  </div>
                  <div className="destination-right">
                    <span className="dest-eta" style={{ color: d.statusColor }}>
                      ~{d.currentEtaMins} min
                    </span>
                    <span className="dest-dist">{d.distanceKm} km</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Corridor HUD Overlay */}
          {selectedCorridor && (
            <div className="selected-corridor-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                  {selectedCorridor.name}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: selectedCorridor.color,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${selectedCorridor.color}`,
                  }}
                >
                  {selectedCorridor.level}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                Speed: <span style={{ color: '#00f0ff', fontWeight: 700 }}>{selectedCorridor.currentSpeedKm} km/h</span> • Delay: <span style={{ color: '#fbbf24', fontWeight: 700 }}>+{selectedCorridor.delayMins} min</span> • Dist: {selectedCorridor.distFromCenter} km
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
