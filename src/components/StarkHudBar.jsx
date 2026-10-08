import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Settings,
  RefreshCw,
  Smartphone,
} from 'lucide-react';

export default function StarkHudBar({
  onOpenSettings,
  onOpenRemote,
  onRefreshAll,
  userName = 'Shyam',
}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOffline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshAll) onRefreshAll();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="stark-hud-bar" role="banner" aria-label="Stark Industries Tactical Telemetry Bar">
      {/* Left: Glowing Arc Reactor Emblem & System ID */}
      <div className="stark-reactor-group">
        {/* Animated Holographic Arc Reactor */}
        <div className="arc-reactor-emblem" title="Stark Arc Reactor // Mk LXXXV Core Online">
          <svg viewBox="0 0 100 100" className="arc-reactor-svg">
            {/* Outer Ring */}
            <circle cx="50" cy="50" r="46" className="arc-ring-outer" />
            
            {/* Rotating Segmented Ring */}
            <g className="arc-ring-segments">
              {[...Array(10)].map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="8"
                  x2="50"
                  y2="17"
                  className="arc-coil"
                  transform={`rotate(${i * 36} 50 50)`}
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
            <span className="stark-brand">STARK INDUSTRIES</span>
            <span className="stark-divider">//</span>
            <span className="stark-model">MARK LXXXV HUD</span>
          </div>

          <div className="stark-status-row">
            <span className="stark-pulse-dot" />
            <span className="stark-status-text">
              J.A.R.V.I.S. PROTOCOL: ONLINE
            </span>
            <span className="stark-meta-sep">•</span>
            <span className="stark-net-status">
              {isOnline ? (
                <span className="online-tag"><Wifi size={10} /> SAT-LINK 100%</span>
              ) : (
                <span className="offline-tag"><WifiOff size={10} /> LINK OFFLINE</span>
              )}
            </span>
            <span className="stark-meta-sep">•</span>
            {/* Voice Waveform Telemetry simulation */}
            <div className="jarvis-waveform" title="J.A.R.V.I.S. Voice Telemetry">
              <span className="bar bar-1" />
              <span className="bar bar-2" />
              <span className="bar bar-3" />
              <span className="bar bar-4" />
              <span className="bar bar-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Holographic Tactical Controls */}
      <div className="stark-hud-controls">
        {/* Re-Calibrate / Refresh Button */}
        <button
          className="stark-icon-btn"
          onClick={handleManualRefresh}
          title="Re-calibrate / Refresh Telemetry Feeds"
          aria-label="Re-calibrate telemetry"
        >
          <RefreshCw
            size={14}
            style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }}
          />
          <span className="btn-label-mobile-hide">SYNC</span>
        </button>

        {/* Remote Settings Link for Phone & Laptop */}
        {onOpenRemote && (
          <button
            className="stark-icon-btn remote-link-btn"
            onClick={onOpenRemote}
            title="Open Remote Settings on Phone or Laptop"
            aria-label="Open phone remote settings"
          >
            <Smartphone size={14} />
            <span className="btn-label-mobile-hide">REMOTE</span>
          </button>
        )}

        {/* System Settings Override */}
        <button
          className="stark-icon-btn settings-btn"
          onClick={onOpenSettings}
          title="System Configuration Override"
          aria-label="Open settings"
        >
          <Settings size={14} />
          <span className="btn-label-mobile-hide">CONFIG</span>
        </button>
      </div>
    </div>
  );
}
