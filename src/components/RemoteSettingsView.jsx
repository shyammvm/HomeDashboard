import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCw,
  Home,
  Briefcase,
  Moon,
  Rss,
  Navigation,
  Receipt,
  User,
  Check,
  RefreshCw,
  ChevronLeft,
  Tv,
  Globe,
  MapPin,
} from 'lucide-react';
import { POPULAR_OFFICE_PRESETS, parseCoordinateString } from '../services/commuteService';
import {
  getInitialSettings,
  saveAndBroadcastSettings,
  triggerRemoteRefresh,
  subscribeToSettings,
} from '../services/settingsSyncService';

const BANGALORE_LOCALITY_PRESETS = [
  'Whitefield, Bangalore',
  'HSR Layout, Bangalore',
  'Indiranagar, Bangalore',
  'Koramangala, Bangalore',
  'Bellandur, Bangalore',
  'Hebbal, Bangalore',
  'Sarjapur Road, Bangalore',
  'Electronic City, Bangalore',
];

const RSS_PRESETS = [
  { label: 'BBC World News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { label: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { label: 'Reuters World', url: 'https://www.reutersagency.com/feed/?taxonomy=markets&post_type=best' },
  { label: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
  { label: 'Mint Business', url: 'https://www.livemint.com/rss/news' },
];

export default function RemoteSettingsView({
  onBackToDashboard,
  initialConfig = null,
}) {
  const [config, setConfig] = useState(() => initialConfig || getInitialSettings());

  // Form states
  const [userName, setUserName] = useState(config.userName || 'Shyam');
  const [currency, setCurrency] = useState(config.currency || '₹');
  const [homeAddress, setHomeAddress] = useState(config.homeAddress || config.city || '12.971211, 77.735895');
  const [officeAddress, setOfficeAddress] = useState(config.officeAddress || '12.919583, 77.671528');
  const [officeName, setOfficeName] = useState(config.officeName || 'Office');
  const [selectedOfficePreset, setSelectedOfficePreset] = useState(() => {
    const found = POPULAR_OFFICE_PRESETS.find(p => p.address === config.officeAddress || p.label === config.officeAddress);
    return found ? found.address : 'custom';
  });

  // Coordinate builder & parsed states
  const [showHomeCoordBuilder, setShowHomeCoordBuilder] = useState(() => Boolean(parseCoordinateString(config.homeAddress || config.city)));
  const [showOfficeCoordBuilder, setShowOfficeCoordBuilder] = useState(() => Boolean(parseCoordinateString(config.officeAddress)));

  const parsedHomeCoords = parseCoordinateString(homeAddress);
  const parsedOfficeCoords = parseCoordinateString(officeAddress);

  const [homeLatInput, setHomeLatInput] = useState(() => (parsedHomeCoords ? String(parsedHomeCoords.lat) : ''));
  const [homeLonInput, setHomeLonInput] = useState(() => (parsedHomeCoords ? String(parsedHomeCoords.lon) : ''));
  const [officeLatInput, setOfficeLatInput] = useState(() => (parsedOfficeCoords ? String(parsedOfficeCoords.lat) : ''));
  const [officeLonInput, setOfficeLonInput] = useState(() => (parsedOfficeCoords ? String(parsedOfficeCoords.lon) : ''));

  const handleHomeAddressChange = (val) => {
    setHomeAddress(val);
    const parsed = parseCoordinateString(val);
    if (parsed) {
      setHomeLatInput(String(parsed.lat));
      setHomeLonInput(String(parsed.lon));
    }
  };

  const handleHomeLatLonChange = (newLat, newLon) => {
    setHomeLatInput(newLat);
    setHomeLonInput(newLon);
    if (newLat.trim() && newLon.trim()) {
      setHomeAddress(`${newLat.trim()}, ${newLon.trim()}`);
    }
  };

  const handleOfficeAddressChange = (val) => {
    setOfficeAddress(val);
    const found = POPULAR_OFFICE_PRESETS.find(p => p.address === val || p.label === val);
    setSelectedOfficePreset(found ? found.address : 'custom');
    const parsed = parseCoordinateString(val);
    if (parsed) {
      setOfficeLatInput(String(parsed.lat));
      setOfficeLonInput(String(parsed.lon));
    }
  };

  const handleOfficeLatLonChange = (newLat, newLon) => {
    setOfficeLatInput(newLat);
    setOfficeLonInput(newLon);
    setSelectedOfficePreset('custom');
    if (newLat.trim() && newLon.trim()) {
      setOfficeAddress(`${newLat.trim()}, ${newLon.trim()}`);
    }
  };

  const [lcdSleepMode, setLcdSleepMode] = useState(config.lcdSleepMode || false);
  const [lcdSleepStart, setLcdSleepStart] = useState(config.lcdSleepStart || '23:30');
  const [lcdSleepEnd, setLcdSleepEnd] = useState(config.lcdSleepEnd || '06:30');

  const [rotation, setRotation] = useState(config.rotation || 0);
  const [rssUrl, setRssUrl] = useState(config.rssUrl || 'https://feeds.bbci.co.uk/news/world/rss.xml');
  const [newsCycleSeconds, setNewsCycleSeconds] = useState(config.newsCycleSeconds || 35);

  const [expenseTrackerApiUrl, setExpenseTrackerApiUrl] = useState(
    config.expenseTrackerApiUrl || 'https://smartexpensetracker-vtkb.onrender.com'
  );
  const [expenseTrackerSecret, setExpenseTrackerSecret] = useState(
    config.expenseTrackerSecret || '2546698'
  );

  // Status & Feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [isRefreshingTv, setIsRefreshingTv] = useState(false);
  const [tvRefreshSuccess, setTvRefreshSuccess] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => Date.now());
  const [syncStatusText, setSyncStatusText] = useState('LIVE SYNC: CONNECTED');

  // Keep synced with any external changes
  useEffect(() => {
    const unsubscribe = subscribeToSettings((remoteConfig, source) => {
      setConfig(remoteConfig);
      setLastSyncTime(Date.now());
      setSyncStatusText(`SYNCED FROM ${source.toUpperCase()}`);
    }, 15000);
    return unsubscribe;
  }, []);

  // Update local states when config prop changes
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setUserName(initialConfig.userName || 'Shyam');
      setCurrency(initialConfig.currency || '₹');
      const home = initialConfig.homeAddress || initialConfig.city || '12.971211, 77.735895';
      const office = initialConfig.officeAddress || '12.919583, 77.671528';
      setHomeAddress(home);
      setOfficeAddress(office);
      const parsedH = parseCoordinateString(home);
      if (parsedH) {
        setHomeLatInput(String(parsedH.lat));
        setHomeLonInput(String(parsedH.lon));
      }
      const parsedO = parseCoordinateString(office);
      if (parsedO) {
        setOfficeLatInput(String(parsedO.lat));
        setOfficeLonInput(String(parsedO.lon));
      }
      setOfficeName(initialConfig.officeName || 'Office');
      setLcdSleepMode(initialConfig.lcdSleepMode || false);
      setLcdSleepStart(initialConfig.lcdSleepStart || '23:30');
      setLcdSleepEnd(initialConfig.lcdSleepEnd || '06:30');
      setRotation(initialConfig.rotation || 0);
      setRssUrl(initialConfig.rssUrl || 'https://feeds.bbci.co.uk/news/world/rss.xml');
      setNewsCycleSeconds(initialConfig.newsCycleSeconds || 35);
      setExpenseTrackerApiUrl(initialConfig.expenseTrackerApiUrl || 'https://smartexpensetracker-vtkb.onrender.com');
      setExpenseTrackerSecret(initialConfig.expenseTrackerSecret || '2546698');
    }
  }, [initialConfig]);

  // GPS detection for either Home or Work destination
  const handleDetectGpsCoords = (target = 'home') => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const coordsStr = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        if (target === 'home') {
          setHomeAddress(coordsStr);
          setHomeLatInput(String(lat.toFixed(6)));
          setHomeLonInput(String(lon.toFixed(6)));
          setShowHomeCoordBuilder(true);
        } else {
          setOfficeAddress(coordsStr);
          setOfficeLatInput(String(lat.toFixed(6)));
          setOfficeLonInput(String(lon.toFixed(6)));
          setSelectedOfficePreset('custom');
          setShowOfficeCoordBuilder(true);
          if (!officeName || officeName === 'Work / EcoWorld' || officeName === 'RMZ Ecoworld, Bellandur, Bangalore') {
            setOfficeName('Work (GPS Destination)');
          }
        }
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 3000);
        setIsGpsLocating(false);
      },
      (err) => {
        alert('GPS Location error: ' + err.message);
        setIsGpsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle GPS Auto-detect from Phone with reverse geocoding fallback
  const handleDetectPhoneGps = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGpsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
            headers: { 'User-Agent': 'AetherRemoteControl/1.0' },
          });
          const data = await res.json();
          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city || data.address?.town;
          const state = data.address?.state;
          const locName = suburb ? (state ? `${suburb}, ${state}` : suburb) : `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          setHomeAddress(locName);
          const parsed = parseCoordinateString(locName);
          if (parsed) {
            setHomeLatInput(String(parsed.lat));
            setHomeLonInput(String(parsed.lon));
          }
          setGpsSuccess(true);
          setTimeout(() => setGpsSuccess(false), 3000);
        } catch {
          setHomeAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
          setHomeLatInput(String(lat.toFixed(6)));
          setHomeLonInput(String(lon.toFixed(6)));
          setGpsSuccess(true);
          setTimeout(() => setGpsSuccess(false), 3000);
        } finally {
          setIsGpsLocating(false);
        }
      },
      (err) => {
        alert('GPS Location error: ' + err.message);
        setIsGpsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle Remote TV Refresh trigger
  const handleTriggerTvRefresh = async () => {
    setIsRefreshingTv(true);
    try {
      await triggerRemoteRefresh();
      setTvRefreshSuccess(true);
      setTimeout(() => setTvRefreshSuccess(false), 3000);
    } catch {
      // Ignore
    } finally {
      setIsRefreshingTv(false);
    }
  };

  // Save and Broadcast to All Displays
  const handleSaveAndBroadcast = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const updated = {
      ...config,
      userName: userName.trim() || 'Shyam',
      currency,
      city: config.city || (parseCoordinateString(homeAddress) ? 'Home' : homeAddress.trim()) || 'Home',
      homeAddress: homeAddress.trim() || '12.971211, 77.735895',
      officeAddress: officeAddress.trim() || '12.919583, 77.671528',
      officeName: officeName.trim() || 'Office',
      lcdSleepMode: Boolean(lcdSleepMode),
      lcdSleepStart,
      lcdSleepEnd,
      rotation: Number(rotation),
      rssUrl: rssUrl.trim(),
      newsCycleSeconds: Number(newsCycleSeconds) || 35,
      expenseTrackerApiUrl: expenseTrackerApiUrl.trim(),
      expenseTrackerSecret: expenseTrackerSecret.trim(),
    };

    try {
      // Determine device name
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const deviceLabel = isMobile ? 'Mobile Phone' : 'Laptop / PC';

      const result = await saveAndBroadcastSettings(updated, deviceLabel);
      setConfig(result.config);
      setLastSyncTime(result.updatedAt);
      setSaveSuccess(true);

      // Mobile haptic feedback
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([40, 30, 40]);
        }
      } catch { }

      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert('Save error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="remote-view-container">
      {/* Top Remote Header */}
      <header className="remote-header">
        <div className="remote-header-inner">
          <div className="remote-header-left">
            {onBackToDashboard && (
              <button
                type="button"
                className="remote-back-btn"
                onClick={onBackToDashboard}
                title="Return to TV Dashboard"
              >
                <ChevronLeft size={16} />
                <span>TV VIEW</span>
              </button>
            )}
            <div>
              <div className="remote-badge-row">
                <span className="pulse-dot" style={{ backgroundColor: 'var(--stark-cyan)', width: 7, height: 7 }} />
                <span className="remote-brand-text">STARK INDUSTRIES // AETHER</span>
              </div>
              <h1 className="remote-title">Centralized Settings Console</h1>
            </div>
          </div>

          <div className="remote-header-right">
            <div className="remote-sync-pill" title={`Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`}>
              <span className="pulse-dot" style={{ backgroundColor: '#10b981', width: 6, height: 6 }} />
              <span className="remote-sync-pill-text">{syncStatusText}</span>
            </div>
            {onBackToDashboard && (
              <button
                type="button"
                className="remote-preview-btn"
                onClick={onBackToDashboard}
              >
                <Tv size={14} />
                <span className="btn-label-mobile-hide">Live Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="remote-content-scroll">
        <div className="remote-content-max">
          {/* Quick Remote Actions Strip */}
          <div className="remote-action-strip">
            <button
              type="button"
              className="remote-quick-action-btn"
              onClick={handleDetectPhoneGps}
              disabled={isGpsLocating}
            >
              <Navigation size={14} style={{ animation: isGpsLocating ? 'spin 1s linear infinite' : 'none' }} />
              <span>{gpsSuccess ? '✓ GPS Detected' : 'Use This Phone\'s GPS'}</span>
            </button>

            <button
              type="button"
              className="remote-quick-action-btn"
              onClick={handleTriggerTvRefresh}
              disabled={isRefreshingTv}
            >
              <RefreshCw size={14} style={{ animation: isRefreshingTv ? 'spin 0.7s linear infinite' : 'none' }} />
              <span>{tvRefreshSuccess ? '✓ TV Refreshed' : 'Force TV Refresh'}</span>
            </button>
          </div>

          {/* Success Banner */}
          {saveSuccess && (
            <div className="remote-toast-banner" role="alert">
              <Check size={18} color="#10b981" />
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 13 }}>Settings Broadcasted Successfully!</div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.85)' }}>
                  Your TV display and all connected devices are now synced with these preferences.
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: Identity & Profile */}
          <section className="remote-card">
            <div className="remote-card-header">
              <User size={15} color="var(--stark-cyan)" />
              <h2>PROFILE & IDENTITY</h2>
            </div>

            <div className="remote-grid-2">
              <div className="setting-field">
                <label className="setting-label" htmlFor="rem-user">Greeting Name</label>
                <input
                  id="rem-user"
                  type="text"
                  className="setting-input"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Shyam"
                />
              </div>

              <div className="setting-field">
                <label className="setting-label" htmlFor="rem-curr">Currency</label>
                <select
                  id="rem-curr"
                  className="setting-input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="$">$ (USD - US Dollar)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="¥">¥ (JPY - Japanese Yen)</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 2: Locations & Commute Telemetry */}
          <section className="remote-card">
            <div className="remote-card-header">
              <Home size={15} color="var(--stark-cyan)" />
              <h2>COMMUTE & LOCATION TELEMETRY</h2>
            </div>

            {/* Home Location */}
            <div className="setting-field" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <label className="setting-label" htmlFor="rem-home" style={{ margin: 0 }}>
                  Home / Base Location (Origin)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className={`mini-expand-text-btn ${showHomeCoordBuilder ? 'active' : ''}`}
                    onClick={() => setShowHomeCoordBuilder(!showHomeCoordBuilder)}
                    title="Toggle Latitude & Longitude Builder"
                  >
                    <Globe size={10} />
                    <span>{showHomeCoordBuilder ? 'HIDE BUILDER' : 'LAT/LON BUILDER'}</span>
                  </button>
                  <button
                    type="button"
                    className="mini-expand-text-btn"
                    onClick={() => handleDetectGpsCoords('home')}
                    disabled={isGpsLocating}
                    title="Detect exact GPS coordinates from your device"
                  >
                    <Navigation size={10} />
                    <span>{gpsSuccess ? 'COORDINATES SET' : 'PHONE GPS COORDS'}</span>
                  </button>
                </div>
              </div>

              <input
                id="rem-home"
                type="text"
                className="setting-input"
                value={homeAddress}
                onChange={(e) => handleHomeAddressChange(e.target.value)}
                placeholder="e.g. 12.9716, 77.5946 or Whitefield, Bangalore"
              />

              {parsedHomeCoords && (
                <div className="coord-valid-tag">
                  <Globe size={11} />
                  <span>GPS COORDINATES DETECTED: {parsedHomeCoords.lat.toFixed(5)}°, {parsedHomeCoords.lon.toFixed(5)}° (ACTIVE ORIGIN)</span>
                </div>
              )}

              {/* Lat/Lon Builder for Home */}
              {showHomeCoordBuilder && (
                <div className="coord-builder-box">
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--stark-cyan)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Globe size={11} />
                    <span>HOME LATITUDE & LONGITUDE BUILDER</span>
                  </div>
                  <div className="coord-input-row">
                    <div>
                      <label style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                        LATITUDE (NORTH/SOUTH)
                      </label>
                      <input
                        type="text"
                        className="setting-input"
                        value={homeLatInput}
                        onChange={(e) => handleHomeLatLonChange(e.target.value, homeLonInput)}
                        placeholder="e.g. 12.9716"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                        LONGITUDE (EAST/WEST)
                      </label>
                      <input
                        type="text"
                        className="setting-input"
                        value={homeLonInput}
                        onChange={(e) => handleHomeLatLonChange(homeLatInput, e.target.value)}
                        placeholder="e.g. 77.5946"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Locality Quick Chips */}
              <div className="remote-chip-row">
                {BANGALORE_LOCALITY_PRESETS.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`remote-chip ${homeAddress === loc ? 'active' : ''}`}
                    onClick={() => handleHomeAddressChange(loc)}
                  >
                    {loc.split(',')[0]}
                  </button>
                ))}
              </div>

              <div className="coord-helper-note">
                💡 Tip: Right-click any location on Google Maps (or long-press on mobile) to copy exact coordinates (e.g. <code>12.9716, 77.5946</code>). TV radar, surface traffic, and weather will anchor precisely to this spot.
              </div>
            </div>

            {/* Office Location */}
            <div className="setting-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <label className="setting-label" htmlFor="rem-office-preset" style={{ margin: 0 }}>
                  Work / Office Destination (for Live Commute ETAs)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className={`mini-expand-text-btn ${showOfficeCoordBuilder ? 'active' : ''}`}
                    onClick={() => setShowOfficeCoordBuilder(!showOfficeCoordBuilder)}
                    title="Toggle Work Latitude & Longitude Builder"
                  >
                    <Globe size={10} />
                    <span>{showOfficeCoordBuilder ? 'HIDE BUILDER' : 'LAT/LON BUILDER'}</span>
                  </button>
                  <button
                    type="button"
                    className="mini-expand-text-btn"
                    onClick={() => handleDetectGpsCoords('office')}
                    disabled={isGpsLocating}
                    title="Use current GPS as your workplace coordinates"
                  >
                    <Navigation size={10} />
                    <span>CURRENT GPS AS WORK</span>
                  </button>
                </div>
              </div>

              {/* Quick Tech Park Buttons */}
              <div className="remote-techparks-grid">
                <button
                  type="button"
                  className={`remote-park-btn ${selectedOfficePreset === 'custom' || parsedOfficeCoords ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedOfficePreset('custom');
                    setShowOfficeCoordBuilder(true);
                    if (!parsedOfficeCoords) {
                      handleOfficeAddressChange('12.9249, 77.6744');
                    }
                  }}
                  title="Use exact GPS coordinates for your workplace"
                >
                  <Globe size={12} />
                  <span>Custom GPS Coords</span>
                </button>
                {POPULAR_OFFICE_PRESETS.slice(0, 7).map((p, idx) => {
                  const isSelected = officeAddress === p.address && selectedOfficePreset !== 'custom';
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`remote-park-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedOfficePreset(p.address);
                        handleOfficeAddressChange(p.address);
                        setOfficeName(p.label.split('(')[0].trim());
                      }}
                    >
                      <Briefcase size={12} />
                      <span>{p.label.split('(')[0].trim()}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 12 }}>
                <select
                  id="rem-office-preset"
                  className="setting-input"
                  value={selectedOfficePreset}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedOfficePreset(val);
                    if (val !== 'custom') {
                      const found = POPULAR_OFFICE_PRESETS.find(p => p.address === val);
                      if (found) {
                        handleOfficeAddressChange(found.address);
                        setOfficeName(found.label.split('(')[0].trim());
                      }
                    } else {
                      setShowOfficeCoordBuilder(true);
                    }
                  }}
                  style={{ marginBottom: 8 }}
                >
                  {POPULAR_OFFICE_PRESETS.map((p, idx) => (
                    <option key={idx} value={p.address}>{p.label}</option>
                  ))}
                  <option value="custom">🌐 Custom GPS Coordinates / Custom Address...</option>
                </select>

                {parsedOfficeCoords && (
                  <div className="coord-valid-tag" style={{ marginBottom: 8 }}>
                    <Globe size={11} />
                    <span>GPS WORK DESTINATION: {parsedOfficeCoords.lat.toFixed(5)}°, {parsedOfficeCoords.lon.toFixed(5)}° (ACTIVE DESTINATION)</span>
                  </div>
                )}

                {/* Lat/Lon Builder for Work */}
                {showOfficeCoordBuilder && (
                  <div className="coord-builder-box">
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--stark-cyan)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Globe size={11} />
                      <span>WORK DESTINATION LATITUDE & LONGITUDE BUILDER</span>
                    </div>
                    <div className="coord-input-row">
                      <div>
                        <label style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                          WORK LATITUDE
                        </label>
                        <input
                          type="text"
                          className="setting-input"
                          value={officeLatInput}
                          onChange={(e) => handleOfficeLatLonChange(e.target.value, officeLonInput)}
                          placeholder="e.g. 12.9249"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                          WORK LONGITUDE
                        </label>
                        <input
                          type="text"
                          className="setting-input"
                          value={officeLonInput}
                          onChange={(e) => handleOfficeLatLonChange(officeLatInput, e.target.value)}
                          placeholder="e.g. 77.6744"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="remote-grid-2" style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    className="setting-input"
                    value={officeAddress}
                    onChange={(e) => handleOfficeAddressChange(e.target.value)}
                    placeholder="e.g. 12.9249, 77.6744 or Manyata Tech Park, Bangalore"
                  />
                  <input
                    type="text"
                    className="setting-input"
                    value={officeName}
                    onChange={(e) => setOfficeName(e.target.value)}
                    placeholder="Label (e.g. Work / EcoWorld)"
                  />
                </div>

                <div className="coord-helper-note">
                  💡 Tip: You can set exact coordinates (e.g. <code>12.9249, 77.6744</code>) for your workplace. Turn-by-turn road routing and live traffic delays calculate driving time directly to your office gate.
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: LCD TV Screen Care & Night Sleep Schedule */}
          <section className="remote-card" style={{ borderColor: 'rgba(251, 191, 36, 0.3)' }}>
            <div className="remote-card-header" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Moon size={15} color="#fbbf24" />
                <h2 style={{ color: '#fbbf24' }}>LCD TV CARE // NIGHT SLEEP DIMMER</h2>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: '#ffffff' }}>
                <input
                  type="checkbox"
                  checked={lcdSleepMode}
                  onChange={(e) => setLcdSleepMode(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#fbbf24', width: 16, height: 16 }}
                />
                <span style={{ fontWeight: 600 }}>Enable Sleep Schedule</span>
              </label>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.45, marginBottom: 12 }}>
              Protects TV backlights from 24/7 static heat stress and prevents room glare at night. Automatically dims into a minimalist dark clock during sleep hours.
            </div>

            {lcdSleepMode && (
              <div className="remote-grid-2">
                <div className="setting-field">
                  <label className="setting-label" htmlFor="rem-sleep-start">Sleep Start Time</label>
                  <input
                    id="rem-sleep-start"
                    type="time"
                    className="setting-input"
                    value={lcdSleepStart}
                    onChange={(e) => setLcdSleepStart(e.target.value)}
                  />
                </div>
                <div className="setting-field">
                  <label className="setting-label" htmlFor="rem-sleep-end">Wake Up Time</label>
                  <input
                    id="rem-sleep-end"
                    type="time"
                    className="setting-input"
                    value={lcdSleepEnd}
                    onChange={(e) => setLcdSleepEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {/* SECTION 4: Remote TV Screen Rotation */}
          <section className="remote-card">
            <div className="remote-card-header">
              <RotateCw size={15} color="var(--stark-cyan)" />
              <h2>TV SCREEN ORIENTATION (REMOTE ROTATE)</h2>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: 10 }}>
              Adjust the TV output orientation directly from your phone if the Android TV box is locked in landscape.
            </div>

            <div className="remote-rotation-selector">
              {[
                { val: 0, label: '0° Portrait (Standard)' },
                { val: 90, label: '90° Clockwise' },
                { val: 180, label: '180° Inverted' },
                { val: 270, label: '270° Counter-Clockwise' },
              ].map((rot) => (
                <button
                  key={rot.val}
                  type="button"
                  className={`remote-rotation-btn ${rotation === rot.val ? 'active' : ''}`}
                  onClick={() => setRotation(rot.val)}
                >
                  <RotateCw size={12} style={{ transform: `rotate(${rot.val}deg)` }} />
                  <span>{rot.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* SECTION 5: Live News & RSS Feed */}
          <section className="remote-card">
            <div className="remote-card-header">
              <Rss size={15} color="var(--stark-cyan)" />
              <h2>LIVE NEWS HEADLINES & RSS</h2>
            </div>

            <div className="setting-field" style={{ marginBottom: 14 }}>
              <label className="setting-label" htmlFor="rem-rss">RSS Feed URL</label>
              <input
                id="rem-rss"
                type="url"
                className="setting-input"
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                placeholder="https://feeds.bbci.co.uk/news/world/rss.xml"
              />

              {/* RSS Preset Chips */}
              <div className="remote-chip-row">
                {RSS_PRESETS.map((feed, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`remote-chip ${rssUrl === feed.url ? 'active' : ''}`}
                    onClick={() => setRssUrl(feed.url)}
                  >
                    {feed.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-field">
              <label className="setting-label" htmlFor="rem-news-duration">
                Story Stay Duration (Seconds on Screen)
              </label>
              <select
                id="rem-news-duration"
                className="setting-input"
                value={newsCycleSeconds}
                onChange={(e) => setNewsCycleSeconds(Number(e.target.value))}
              >
                <option value={20}>20 seconds (Fast)</option>
                <option value={35}>35 seconds (Recommended - Great for photos)</option>
                <option value={45}>45 seconds (Relaxed reading)</option>
                <option value={60}>60 seconds (1 minute per story)</option>
                <option value={90}>90 seconds (1.5 minutes per story)</option>
              </select>
            </div>
          </section>

          {/* SECTION 6: Smart Expense Tracker & Integrations */}
          <section className="remote-card">
            <div className="remote-card-header">
              <Receipt size={15} color="var(--stark-cyan)" />
              <h2>EXPENSE TRACKER & APIS</h2>
            </div>

            <div className="remote-grid-2">
              <div className="setting-field">
                <label className="setting-label" htmlFor="rem-exp-url">Expense API URL</label>
                <input
                  id="rem-exp-url"
                  type="text"
                  className="setting-input"
                  value={expenseTrackerApiUrl}
                  onChange={(e) => setExpenseTrackerApiUrl(e.target.value)}
                  placeholder="https://smartexpensetracker-vtkb.onrender.com"
                />
              </div>

              <div className="setting-field">
                <label className="setting-label" htmlFor="rem-exp-secret">API Secret Code</label>
                <input
                  id="rem-exp-secret"
                  type="password"
                  className="setting-input"
                  value={expenseTrackerSecret}
                  onChange={(e) => setExpenseTrackerSecret(e.target.value)}
                  placeholder="2546698"
                />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Sticky Bottom Save & Broadcast Bar */}
      <footer className="remote-sticky-bar">
        <div className="remote-sticky-inner">
          <div className="remote-sticky-info">
            <span className="pulse-dot" style={{ backgroundColor: '#10b981', width: 6, height: 6 }} />
            <span>Syncs to TV instantly</span>
          </div>

          <button
            type="button"
            className="remote-save-btn"
            onClick={handleSaveAndBroadcast}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                <span>BROADCASTING TO DISPLAYS...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={16} />
                <span>SAVED & SYNCED TO TV!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>SAVE & SYNC TO ALL DISPLAYS</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
