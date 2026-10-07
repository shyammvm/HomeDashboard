import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Settings, RefreshCw, LayoutGrid, Radio } from 'lucide-react';

export default function HeaderBar({
  onOpenSettings,
  onRefreshAll,
  activeView = 'all',
  onSelectView,
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

      {/* Central Tactical View Selector */}
      {onSelectView && (
        <div className="header-view-selector">
          <button
            className={`header-view-btn ${activeView === 'all' ? 'active' : ''}`}
            onClick={() => onSelectView('all')}
            title="Complete 24x7 Kiosk (All Widgets)"
          >
            <LayoutGrid size={12} />
            <span>ALL</span>
          </button>
          <button
            className={`header-view-btn ${activeView === 'radar' ? 'active' : ''}`}
            onClick={() => onSelectView('radar')}
            title="Airspace & Cloud Radar Focus"
          >
            <Radio size={12} />
            <span>RADAR</span>
          </button>
        </div>
      )}

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
