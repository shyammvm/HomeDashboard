import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RotateCw, Maximize, Minimize, Settings, RefreshCw } from 'lucide-react';

export default function HeaderBar({ rotation, onRotate, onOpenSettings, onRefreshAll }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOffline(false);
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshAll) onRefreshAll();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="top-status-bar" role="banner">
      <div className="status-badge">
        <span className="pulse-dot" style={{ backgroundColor: isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)' }} />
        <span>AETHER • 24X7 AMBIENT DISPLAY</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {isOnline ? <Wifi size={13} color="var(--accent-emerald)" /> : <WifiOff size={13} color="var(--accent-rose)" />}
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <div className="status-actions">
        <button
          className="icon-btn"
          onClick={handleManualRefresh}
          title="Refresh All Feeds"
          aria-label="Refresh feeds"
        >
          <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>

        <button
          className="icon-btn"
          onClick={onRotate}
          title={`Screen Rotation (${rotation}°)`}
          aria-label="Rotate screen"
        >
          <RotateCw size={15} />
        </button>

        <button
          className="icon-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
        </button>

        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title="Dashboard Settings"
          aria-label="Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
