import React, { useState } from 'react';
import { X, Save, RotateCw, Globe, Receipt, User, Rss, Clock, Navigation, Home, Briefcase, Moon, Shield, Smartphone, QrCode } from 'lucide-react';
import { POPULAR_OFFICE_PRESETS, parseCoordinateString } from '../services/commuteService';

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onOpenRemoteModal,
}) {
  const [city, setCity] = useState(config.city || 'Your Location');
  const [homeAddress, setHomeAddress] = useState(config.homeAddress || config.city || 'Whitefield, Bangalore');
  const [officeAddress, setOfficeAddress] = useState(config.officeAddress || 'RMZ Ecoworld, Bellandur, Bangalore');
  const [officeName, setOfficeName] = useState(config.officeName || 'Work / EcoWorld');
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
    setCity(val);
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
      const coordStr = `${newLat.trim()}, ${newLon.trim()}`;
      setHomeAddress(coordStr);
      setCity(coordStr);
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
  const [userName, setUserName] = useState(config.userName || 'Shyam');
  const [currency, setCurrency] = useState(config.currency || '₹');
  const [expenseTrackerApiUrl, setExpenseTrackerApiUrl] = useState(
    config.expenseTrackerApiUrl || 'https://smartexpensetracker-vtkb.onrender.com'
  );
  const [rssUrl, setRssUrl] = useState(config.rssUrl || 'https://feeds.bbci.co.uk/news/world/rss.xml');
  const [newsCycleSeconds, setNewsCycleSeconds] = useState(config.newsCycleSeconds || 35);
  const [rotation, setRotation] = useState(config.rotation || 0);
  const [lcdSleepMode, setLcdSleepMode] = useState(config.lcdSleepMode || false);
  const [lcdSleepStart, setLcdSleepStart] = useState(config.lcdSleepStart || '23:30');
  const [lcdSleepEnd, setLcdSleepEnd] = useState(config.lcdSleepEnd || '06:30');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig({
      city: homeAddress || city,
      homeAddress: homeAddress || city,
      officeAddress,
      officeName,
      userName,
      currency,
      expenseTrackerApiUrl,
      rssUrl,
      newsCycleSeconds: Number(newsCycleSeconds) || 35,
      rotation: Number(rotation),
      lcdSleepMode: Boolean(lcdSleepMode),
      lcdSleepStart,
      lcdSleepEnd,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="settings-modal-content stark-hud-card" onClick={(e) => e.stopPropagation()}>
        <div className="stark-card-corner tl" />
        <div className="stark-card-corner tr" />
        <div className="stark-card-corner bl" />
        <div className="stark-card-corner br" />

        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulse-dot" style={{ backgroundColor: 'var(--stark-cyan)', width: 7, height: 7 }} />
              <h2 className="modal-title stark-title">STARK IND. // COMMON CONFIGURATION</h2>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 2, letterSpacing: '0.6px' }}>
              SYNCED ACROSS TV, PHONE & LAPTOP DISPLAYS
            </div>
          </div>
          <button
            className="icon-btn stark-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Remote Sync Callout Banner */}
        <div className="settings-remote-banner">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div className="settings-banner-icon">
              <Smartphone size={18} color="var(--stark-cyan)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>TV Display Too Slow to Type?</span>
                <span className="remote-feature-pill" style={{ padding: '2px 6px', fontSize: 9 }}>
                  <span className="pulse-dot" style={{ backgroundColor: '#10b981', width: 5, height: 5 }} />
                  CLOUD SYNC ACTIVE
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4 }}>
                Edit all preferences comfortably on your phone or laptop. Saving there instantly updates this TV!
              </div>
            </div>
            {onOpenRemoteModal && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onOpenRemoteModal();
                }}
                style={{ padding: '6px 10px', fontSize: 11, whiteSpace: 'nowrap' }}
              >
                <QrCode size={12} />
                <span>QR CODE</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* User Name */}
          <div className="setting-field">
            <label className="setting-label" htmlFor="cfg-username">
              <User size={13} style={{ display: 'inline', marginRight: 4 }} />
              Greeting Name
            </label>
            <input
              id="cfg-username"
              type="text"
              className="setting-input"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Shyam"
            />
          </div>

          {/* Commute & Telemetry Locations (Home & Office) */}
          <div style={{ padding: '12px 14px', background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.15)', borderRadius: 6 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--stark-cyan)', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Home size={13} />
              <span>GLOBAL LOCATIONS & COMMUTE TELEMETRY</span>
            </div>

            {/* Home Location */}
            <div className="setting-field" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <label className="setting-label" htmlFor="cfg-home" style={{ margin: 0 }}>
                  <Home size={12} style={{ display: 'inline', marginRight: 4 }} />
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
                    onClick={() => {
                      if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const { latitude: lat, longitude: lon } = pos.coords;
                            const coordStr = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                            handleHomeAddressChange(coordStr);
                            setShowHomeCoordBuilder(true);
                          },
                          (err) => alert('Unable to retrieve GPS coordinates: ' + err.message),
                          { enableHighAccuracy: true, timeout: 8000 }
                        );
                      }
                    }}
                    title="Detect live GPS coordinates from your device"
                  >
                    <Navigation size={10} />
                    <span>USE GPS COORDS</span>
                  </button>
                </div>
              </div>

              <input
                id="cfg-home"
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

              <div className="coord-helper-note">
                Syncs weather telemetry, live surface traffic map, and flight radar. Accepts exact coordinates (e.g. <code>12.9716, 77.5946</code>) or locality name.
              </div>
            </div>

            {/* Office Location */}
            <div className="setting-field" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <label className="setting-label" htmlFor="cfg-office-preset" style={{ margin: 0 }}>
                  <Briefcase size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Work / Office Destination (for Live Commute ETAs)
                </label>
                <button
                  type="button"
                  className={`mini-expand-text-btn ${showOfficeCoordBuilder ? 'active' : ''}`}
                  onClick={() => setShowOfficeCoordBuilder(!showOfficeCoordBuilder)}
                  title="Toggle Work Latitude & Longitude Builder"
                >
                  <Globe size={10} />
                  <span>{showOfficeCoordBuilder ? 'HIDE BUILDER' : 'LAT/LON BUILDER'}</span>
                </button>
              </div>

              <select
                id="cfg-office-preset"
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

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 6 }}>
                <input
                  type="text"
                  className="setting-input"
                  value={officeAddress}
                  onChange={(e) => handleOfficeAddressChange(e.target.value)}
                  placeholder="e.g. 12.9249, 77.6744 or Manyata Tech Park, Hebbal"
                />
                <input
                  type="text"
                  className="setting-input"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="Label (e.g. Work)"
                />
              </div>

              <div className="coord-helper-note">
                Calculates real-world road routing & live traffic congestion delays. Accepts exact coordinates (e.g. <code>12.9249, 77.6744</code>) or office address.
              </div>
            </div>
          </div>

          {/* LCD TV Protection & Sleep Dimmer */}
          <div style={{ padding: '12px 14px', background: 'rgba(255, 180, 0, 0.03)', border: '1px solid rgba(255, 180, 0, 0.2)', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: '#fbbf24', letterSpacing: '0.8px' }}>
                <Moon size={13} />
                <span>LCD TV CARE // NIGHT SLEEP DIMMER</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: '#ffffff' }}>
                <input
                  type="checkbox"
                  checked={lcdSleepMode}
                  onChange={(e) => setLcdSleepMode(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#fbbf24' }}
                />
                <span>Enable Sleep Schedule</span>
              </label>
            </div>

            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', lineHeight: 1.45, marginBottom: 8 }}>
              LCD panels don't suffer from OLED burn-in, but static 24/7 running wears down the LED backlight. Sleep mode dims the screen into a subtle dark clock to prolong TV lifespan and eliminate bedroom glare.
            </div>

            {lcdSleepMode && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                <div className="setting-field">
                  <label className="setting-label" htmlFor="cfg-sleep-start">Sleep Start Time</label>
                  <input
                    id="cfg-sleep-start"
                    type="time"
                    className="setting-input"
                    value={lcdSleepStart}
                    onChange={(e) => setLcdSleepStart(e.target.value)}
                  />
                </div>
                <div className="setting-field">
                  <label className="setting-label" htmlFor="cfg-sleep-end">Wake Up Time</label>
                  <input
                    id="cfg-sleep-end"
                    type="time"
                    className="setting-input"
                    value={lcdSleepEnd}
                    onChange={(e) => setLcdSleepEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Currency & Expense Tracker Integration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div className="setting-field">
              <label className="setting-label" htmlFor="cfg-curr">Currency</label>
              <select
                id="cfg-curr"
                className="setting-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="¥">¥ (JPY)</option>
              </select>
            </div>
            <div className="setting-field">
              <label className="setting-label" htmlFor="cfg-expense-url">
                <Receipt size={13} style={{ display: 'inline', marginRight: 4 }} />
                Expense Tracker API
              </label>
              <input
                id="cfg-expense-url"
                type="text"
                className="setting-input"
                value={expenseTrackerApiUrl}
                onChange={(e) => setExpenseTrackerApiUrl(e.target.value)}
                placeholder="https://smartexpensetracker-vtkb.onrender.com"
              />
            </div>
          </div>

          {/* RSS Feed URL */}
          <div className="setting-field">
            <label className="setting-label" htmlFor="cfg-rss">
              <Rss size={13} style={{ display: 'inline', marginRight: 4 }} />
              News RSS Feed URL
            </label>
            <input
              id="cfg-rss"
              type="url"
              className="setting-input"
              value={rssUrl}
              onChange={(e) => setRssUrl(e.target.value)}
              placeholder="https://feeds.bbci.co.uk/news/world/rss.xml"
            />
          </div>

          {/* News Story Display Duration */}
          <div className="setting-field">
            <label className="setting-label" htmlFor="cfg-news-duration">
              <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
              News Story Display Duration
            </label>
            <select
              id="cfg-news-duration"
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
            <div className="setting-hint">
              Controls how long each news article and photo stay on screen before rotating.
            </div>
          </div>

          {/* Screen Rotation Override */}
          <div className="setting-field">
            <label className="setting-label" htmlFor="cfg-rotation">
              <RotateCw size={13} style={{ display: 'inline', marginRight: 4 }} />
              Screen Rotation Override
            </label>
            <select
              id="cfg-rotation"
              className="setting-input"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            >
              <option value={0}>0° (Standard Portrait)</option>
              <option value={90}>90° (Rotate Right / Clockwise)</option>
              <option value={180}>180° (Inverted)</option>
              <option value={270}>270° (Rotate Left / Counter-Clockwise)</option>
            </select>
            <div className="setting-hint">
              Use this if the Android TV box outputs landscape and you need to rotate 90° internally.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '9px 16px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={15} />
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
