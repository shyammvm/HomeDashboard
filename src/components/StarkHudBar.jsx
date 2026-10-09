import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Radio,
  Cpu,
  Compass,
} from 'lucide-react';

export default function StarkHudBar({
  onRefreshAll,
  userName = 'Shyam',
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [pingMs, setPingMs] = useState(18);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update UTC time and simulate subtle network latency telemetry
    const timer = setInterval(() => {
      const now = new Date();
      const uH = String(now.getUTCHours()).padStart(2, '0');
      const uM = String(now.getUTCMinutes()).padStart(2, '0');
      const uS = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${uH}:${uM}:${uS}Z`);
      // Realistic minor latency jitter between 14ms - 24ms
      setPingMs(Math.floor(16 + Math.random() * 8));
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshAll) onRefreshAll();
    setTimeout(() => setIsRefreshing(false), 900);
  };

  return (
    <header className="stark-hud-bar" role="banner" aria-label="Tactical Operations Telemetry Bar">
      {/* Left: Glowing Arc Core & System ID */}
      <div className="stark-reactor-group">
        {/* Animated Holographic Core */}
        <div className="arc-reactor-emblem" title="Aether Tactical Core // Nominal">
          <svg viewBox="0 0 100 100" className="arc-reactor-svg">
            {/* Outer Ring */}
            <circle cx="50" cy="50" r="46" className="arc-ring-outer" />
            
            {/* Rotating Segmented Ring */}
            <g className="arc-ring-segments">
              {[...Array(12)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="8"
                  x2="50"
                  y2="16"
                  className="arc-coil"
                  transform={`rotate(${i * 30} 50 50)`}
                />
              ))}
              <circle cx="50" cy="50" r="32" className="arc-ring-inner" />
            </g>

            {/* Core Triangle Bracket */}
            <polygon points="50,26 69,60 31,60" className="arc-core-tri" />

            {/* Glowing Core Center */}
            <circle cx="50" cy="49" r="10" className="arc-core-glow" />
            <circle cx="50" cy="49" r="5" className="arc-core-center" />
          </svg>
        </div>

        {/* System Title & Telemetry Status */}
        <div className="stark-telemetry-meta">
          <div className="stark-title-row">
            <span className="stark-brand">AETHER HUD</span>
            <span className="stark-divider">//</span>
            <span className="stark-model">MK-LXXXV TACTICAL DECK</span>
            <span className="stark-tag-code">[SYS-TEL: 01]</span>
          </div>

          <div className="stark-status-row">
            <span className="stark-pulse-dot" />
            <span className="stark-status-text">
              J.A.R.V.I.S. PROTOCOL: ONLINE
            </span>
            <span className="stark-meta-sep">•</span>
            <span className="stark-net-status">
              {isOnline ? (
                <span className="online-tag">
                  <Wifi size={11} /> SAT-LINK 100% <span className="ping-pill">{pingMs}ms</span>
                </span>
              ) : (
                <span className="offline-tag">
                  <WifiOff size={11} /> LINK OFFLINE
                </span>
              )}
            </span>
            <span className="stark-meta-sep">•</span>
            {/* Audio Waveform Telemetry */}
            <div className="jarvis-waveform" title="Neural Link Active">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
              <span className="bar bar-4" />
              <span className="bar bar-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live UTC / Zulu Telemetry & Geolocation Anchor */}
      <div className="stark-center-telemetry">
        <div className="telemetry-pill">
          <Compass size={11} className="pill-icon" />
          <span className="pill-label">BLR SECTOR</span>
          <span className="pill-val">12.9712°N 77.7359°E</span>
        </div>
        <div className="telemetry-pill utc-pill">
          <Radio size={11} className="pill-icon" />
          <span className="pill-label">ZULU</span>
          <span className="pill-val">{utcTime || '00:00:00Z'}</span>
        </div>
      </div>

      {/* Right: Tactical Command Controls */}
      <div className="stark-hud-controls">
        <button
          className={`stark-sync-btn ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleManualRefresh}
          title="Re-calibrate / Refresh All Feeds"
          aria-label="Re-calibrate telemetry"
        >
          <RefreshCw
            size={13}
            className={isRefreshing ? 'spin-anim' : ''}
          />
          <span className="sync-btn-text">RE-CALIBRATE</span>
        </button>
      </div>
    </header>
  );
}
