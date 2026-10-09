import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Radio,
  Cpu,
  Compass,
  Clock,
  Globe,
} from 'lucide-react';

export default function StarkHudBar({
  onRefreshAll,
  userName = 'Shyam',
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [ukTime, setUkTime] = useState('');
  const [usTime, setUsTime] = useState('');
  const [usZone, setUsZone] = useState(() => {
    try {
      return localStorage.getItem('aether_us_timezone') || 'ET';
    } catch {
      return 'ET';
    }
  });
  const [pingMs, setPingMs] = useState(18);

  const handleToggleUsZone = () => {
    setUsZone((prev) => {
      const next = prev === 'ET' ? 'PT' : 'ET';
      try {
        localStorage.setItem('aether_us_timezone', next);
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update UK & US World Times and simulate subtle network latency telemetry
    const updateTimes = () => {
      const now = new Date();

      // UK Time (London - GMT / BST)
      try {
        const ukFormatted = now.toLocaleTimeString('en-GB', {
          timeZone: 'Europe/London',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setUkTime(ukFormatted);
      } catch {
        setUkTime('--:--:--');
      }

      // US Time (Eastern ET or Pacific PT)
      try {
        const targetUsTz = usZone === 'PT' ? 'America/Los_Angeles' : 'America/New_York';
        const usFormatted = now.toLocaleTimeString('en-GB', {
          timeZone: targetUsTz,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setUsTime(usFormatted);
      } catch {
        setUsTime('--:--:--');
      }

      // Realistic minor latency jitter between 14ms - 24ms
      setPingMs(Math.floor(16 + Math.random() * 8));
    };

    updateTimes();
    const timer = setInterval(updateTimes, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, [usZone]);

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

      {/* Center: Live Geolocation Anchor & UK / US World Time Telemetry */}
      <div className="stark-center-telemetry">
        <div className="telemetry-pill blr-pill" title="Bangalore Sector: 12.9712°N 77.7359°E">
          <Compass size={11} className="pill-icon" />
          <span className="pill-label">BLR</span>
          <span className="pill-val">12.97°N 77.74°E</span>
        </div>
        <div className="telemetry-pill world-clock-stacked-pill" title="World Telemetry: UK (London) & US">
          <Globe size={13} className="pill-icon world-icon" />
          <div className="clock-stack-column">
            <div className="clock-stack-row uk-row" title="United Kingdom / London Time (Europe/London)">
              <span className="pill-mini-tag uk-tag">UK</span>
              <span className="pill-mini-val">{ukTime || '--:--:--'}</span>
            </div>
            <div
              className="clock-stack-row us-row"
              onClick={handleToggleUsZone}
              title={`US ${usZone === 'ET' ? 'Eastern (New York)' : 'Pacific (California)'} Time — Click to toggle ET / PT`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleToggleUsZone();
              }}
            >
              <span className="pill-mini-tag us-tag">US {usZone}</span>
              <span className="pill-mini-val">{usTime || '--:--:--'}</span>
              <span className="pill-zone-hint">⇄</span>
            </div>
          </div>
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
