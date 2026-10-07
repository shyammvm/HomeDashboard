import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Car,
  Clock,
  AlertTriangle,
  RefreshCw,
  MapPin,
  ArrowLeft,
  Plane,
  Building,
  Briefcase,
  Zap,
  CheckCircle2,
} from 'lucide-react';

import GoogleTrafficMap from './GoogleTrafficMap';
import {
  TRAFFIC_CENTERS,
  fetchLiveTrafficData,
} from '../services/trafficService';

export default function BangaloreTrafficView({
  onBack,
  userLocation = { lat: 12.9716, lon: 77.7473, cityName: 'Your Location' },
  initialRangeKm = 15,
}) {
  const [selectedCenter, setSelectedCenter] = useState('USER');
  const [rangeKm, setRangeKm] = useState(initialRangeKm);
  const [trafficData, setTrafficData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCorridor, setSelectedCorridor] = useState(null);
  const [activeTab, setActiveTab] = useState('bottlenecks'); // 'bottlenecks' | 'etas' | 'corridors'
  const [corridorFilter, setCorridorFilter] = useState('ALL'); // 'ALL' | 'GRIDLOCK' | 'HEAVY' | 'FLOWING'

  const activeCenter = useMemo(() => {
    if (selectedCenter === 'USER' || !TRAFFIC_CENTERS[selectedCenter]) {
      return {
        key: 'USER',
        name: userLocation?.cityName || 'Your Location',
        shortName: (userLocation?.cityName || 'MY GPS').split(',')[0].toUpperCase(),
        lat: userLocation?.lat || 12.9716,
        lon: userLocation?.lon || 77.7473,
      };
    }
    return TRAFFIC_CENTERS[selectedCenter];
  }, [selectedCenter, userLocation]);

  const loadTraffic = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLiveTrafficData(activeCenter, rangeKm);
      setTrafficData(data);
    } catch (err) {
      console.error('Failed to load traffic data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCenter, rangeKm]);

  useEffect(() => {
    loadTraffic();
    const interval = setInterval(loadTraffic, 30000); // 30 sec auto-refresh
    return () => clearInterval(interval);
  }, [loadTraffic]);

  const corridors = trafficData?.corridors || [];
  const corridorsInRange = trafficData?.corridorsInRange || [];
  const bottlenecks = trafficData?.bottlenecks || [];
  const destinations = trafficData?.destinations || [];

  const filteredCorridors = corridorsInRange.filter((c) => {
    if (corridorFilter === 'ALL') return true;
    return c.level === corridorFilter;
  });

  return (
    <div className="bangalore-traffic-view-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* 1. Tactical Command Header */}
      <div className="traffic-view-header">
        <div className="traffic-header-left">
          {onBack && (
            <button
              onClick={onBack}
              className="traffic-back-btn"
              title="Return to Full Dashboard Overview"
            >
              <ArrowLeft size={14} />
              <span>RETURN TO HUD</span>
            </button>
          )}

          <div className="traffic-title-group">
            <div className="traffic-badge-row">
              <span className="live-pulse-dot" />
              <span className="traffic-title-prefix">
                {userLocation?.cityName ? userLocation.cityName.split(',')[0].toUpperCase() : 'REGIONAL'} METRO TELEMETRY
              </span>
              <span className="traffic-slash">//</span>
              <span className="traffic-title-sub">SURFACE TRAFFIC PROTOCOL</span>
            </div>
            <h1 className="traffic-main-title">
              LIVE SURFACE TRAFFIC & CORRIDOR MAP
            </h1>
          </div>
        </div>

        {/* Center / Origin Toggle & KM Range Selector */}
        <div className="traffic-header-controls">
          {/* Origin Base Switcher */}
          <div className="traffic-center-pills">
            <button
              className={`center-pill-btn ${selectedCenter === 'USER' ? 'active' : ''}`}
              onClick={() => {
                setSelectedCenter('USER');
                setSelectedCorridor(null);
              }}
            >
              <MapPin size={10} />
              <span>MY LOCATION</span>
            </button>
            {Object.values(TRAFFIC_CENTERS).map((center) => (
              <button
                key={center.key}
                className={`center-pill-btn ${selectedCenter === center.key ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCenter(center.key);
                  setSelectedCorridor(null);
                }}
              >
                <MapPin size={10} />
                <span>{center.shortName}</span>
              </button>
            ))}
          </div>

          {/* Range Selector */}
          <div className="traffic-range-selector">
            <span className="range-label">RADIUS:</span>
            {[5, 10, 15, 25, 40].map((km) => (
              <button
                key={km}
                className={`range-pill-btn ${rangeKm === km ? 'active' : ''}`}
                onClick={() => setRangeKm(km)}
              >
                {km} KM
              </button>
            ))}
          </div>

          {/* Refresh Action */}
          <button
            onClick={loadTraffic}
            disabled={isLoading}
            className="traffic-refresh-btn"
            title="Refresh Live Traffic Corridors"
          >
            <RefreshCw size={13} style={{ animation: isLoading ? 'spin 0.7s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* 2. City Pulse Stats Bar */}
      <div className="traffic-pulse-bar">
        <div className="pulse-stat-card">
          <div className="stat-label">CITY CONGESTION INDEX</div>
          <div className="stat-value" style={{ color: (trafficData?.overallCongestion || 0) > 70 ? '#ef4444' : '#fbbf24' }}>
            {trafficData?.overallCongestion || 68}%
          </div>
          <div className="stat-sub">
            {(trafficData?.overallCongestion || 0) > 70 ? 'HEAVY COMMUTE CONGESTION' : 'MODERATE FLOW'}
          </div>
        </div>

        <div className="pulse-stat-card">
          <div className="stat-label">AVERAGE ARTERIAL SPEED</div>
          <div className="stat-value" style={{ color: '#00f0ff' }}>
            {trafficData?.avgSpeedKmH || 24} <span className="stat-unit">KM/H</span>
          </div>
          <div className="stat-sub">AROUND {activeCenter.shortName}</div>
        </div>

        <div className="pulse-stat-card">
          <div className="stat-label">MONITORED CORRIDORS</div>
          <div className="stat-value" style={{ color: '#ffffff' }}>
            {corridorsInRange.length} <span className="stat-unit">/ {corridors.length}</span>
          </div>
          <div className="stat-sub">WITHIN {rangeKm} KM RADIUS</div>
        </div>

        <div className="pulse-stat-card">
          <div className="stat-label">CUMULATIVE BOTTLENECK DELAY</div>
          <div className="stat-value" style={{ color: '#f97316' }}>
            +{trafficData?.totalDelayMinutes || 0} <span className="stat-unit">MINS</span>
          </div>
          <div className="stat-sub">ESTIMATED EXCESS TRANSIT TIME</div>
        </div>
      </div>

      {/* 3. Main Split: Normal Google Maps (Left) + Detail Telemetry Console (Right) */}
      <div className="traffic-main-split">
        {/* Left Column: Interactive Map */}
        <div className="traffic-map-col">
          <div className="traffic-map-frame">
            <GoogleTrafficMap
              center={activeCenter}
              rangeKm={rangeKm}
              height="530px"
              interactive={true}
            />
          </div>

          {/* Quick Map Legend */}
          <div className="traffic-map-legend">
            <div className="legend-item">
              <span className="legend-line" style={{ background: '#10b981' }} />
              <span>FLOWING (&gt;35 km/h)</span>
            </div>
            <div className="legend-item">
              <span className="legend-line" style={{ background: '#00f0ff' }} />
              <span>MODERATE</span>
            </div>
            <div className="legend-item">
              <span className="legend-line" style={{ background: '#fbbf24' }} />
              <span>HEAVY</span>
            </div>
            <div className="legend-item">
              <span className="legend-line" style={{ background: '#ef4444' }} />
              <span>GRIDLOCK (&lt;15 km/h)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot-cyan" />
              <span>{activeCenter.shortName} BASE</span>
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry & Feeds Console */}
        <div className="traffic-sidebar-col">
          {/* Tab Selector */}
          <div className="traffic-sidebar-tabs">
            <button
              className={`sidebar-tab-btn ${activeTab === 'bottlenecks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bottlenecks')}
            >
              <AlertTriangle size={12} />
              <span>BOTTLENECKS ({bottlenecks.length})</span>
            </button>
            <button
              className={`sidebar-tab-btn ${activeTab === 'etas' ? 'active' : ''}`}
              onClick={() => setActiveTab('etas')}
            >
              <Clock size={12} />
              <span>TRANSIT ETAs</span>
            </button>
            <button
              className={`sidebar-tab-btn ${activeTab === 'corridors' ? 'active' : ''}`}
              onClick={() => setActiveTab('corridors')}
            >
              <Car size={12} />
              <span>ALL ARTERIES</span>
            </button>
          </div>

          <div className="traffic-sidebar-content">
            {/* 1. Bottlenecks Tab */}
            {activeTab === 'bottlenecks' && (
              <div className="bottlenecks-list-pane">
                <div className="pane-headline">
                  <span>TOP CHOKE POINTS WITHIN {rangeKm} KM</span>
                  <span className="count-tag">{bottlenecks.length} DETECTED</span>
                </div>

                {bottlenecks.length === 0 ? (
                  <div className="empty-choke-msg">
                    <CheckCircle2 size={24} style={{ color: '#10b981', marginBottom: 8 }} />
                    <div>NO SEVERE BOTTLENECKS IN THIS RADIUS</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Arterial flow is running smoothly.</div>
                  </div>
                ) : (
                  bottlenecks.map((b) => (
                    <div
                      key={b.id}
                      className={`choke-point-card ${selectedCorridor?.id === b.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCorridor(b)}
                    >
                      <div className="choke-top-row">
                        <span className="choke-name">{b.name}</span>
                        <span className="choke-delay-badge">+{b.delayMins}m DELAY</span>
                      </div>
                      <div className="choke-meta-row">
                        <span className="choke-sector">{b.sector}</span>
                        <span className="choke-sep">•</span>
                        <span className="choke-speed" style={{ color: b.color }}>
                          {b.currentSpeedKm} km/h (Limit: {b.speedLimit})
                        </span>
                        <span className="choke-sep">•</span>
                        <span className="choke-dist">{b.distFromCenter} km away</span>
                      </div>
                      <div className="choke-bar-bg">
                        <div
                          className="choke-bar-fill"
                          style={{
                            width: `${b.congestionPercent}%`,
                            background: b.color,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Transit ETAs Tab */}
            {activeTab === 'etas' && (
              <div className="transit-etas-pane">
                <div className="pane-headline">
                  <span>PROJECTED DRIVE TIMES FROM {activeCenter.shortName}</span>
                </div>

                <div className="eta-cards-grid">
                  {destinations.map((d) => (
                    <div key={d.id} className="transit-eta-card">
                      <div className="eta-card-header">
                        <span className="eta-icon-box">
                          {d.icon === 'Plane' && <Plane size={14} />}
                          {d.icon === 'Building' && <Building size={14} />}
                          {d.icon === 'Briefcase' && <Briefcase size={14} />}
                          {d.icon === 'MapPin' && <MapPin size={14} />}
                          {d.icon === 'Zap' && <Zap size={14} />}
                        </span>
                        <span className="eta-dest-name">{d.name}</span>
                        <span className="eta-dist-tag">{d.distanceKm} km</span>
                      </div>

                      <div className="eta-card-body">
                        <div className="eta-time-val" style={{ color: d.statusColor }}>
                          {d.currentEtaMins} <span className="mins-label">MINS</span>
                        </div>
                        <div className="eta-delta-val">
                          +{d.delayMins}m traffic delay (nominal {d.nominalMins}m)
                        </div>
                      </div>

                      <div className="eta-card-route">
                        {d.route}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. All Arteries Tab */}
            {activeTab === 'corridors' && (
              <div className="all-corridors-pane">
                {/* Filter Pills */}
                <div className="corridor-filter-bar">
                  {['ALL', 'GRIDLOCK', 'HEAVY', 'FLOWING'].map((f) => (
                    <button
                      key={f}
                      className={`filter-pill ${corridorFilter === f ? 'active' : ''}`}
                      onClick={() => setCorridorFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="corridors-scroll-list">
                  {filteredCorridors.map((c) => (
                    <div
                      key={c.id}
                      className={`corridor-item-row ${selectedCorridor?.id === c.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCorridor(c)}
                    >
                      <div className="corr-left">
                        <span className="corr-dot" style={{ background: c.color }} />
                        <span className="corr-name">{c.name}</span>
                      </div>
                      <div className="corr-right">
                        <span className="corr-spd" style={{ color: c.color }}>{c.currentSpeedKm} km/h</span>
                        <span className="corr-delay">+{c.delayMins}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
