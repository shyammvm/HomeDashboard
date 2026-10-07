import React, { useState } from 'react';
import { X, Save, RotateCw, Globe, Receipt, User, Rss, Clock, Navigation } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) {
  const [city, setCity] = useState(config.city || 'Your Location');
  const [userName, setUserName] = useState(config.userName || 'Shyam');
  const [currency, setCurrency] = useState(config.currency || '₹');
  const [expenseTrackerApiUrl, setExpenseTrackerApiUrl] = useState(
    config.expenseTrackerApiUrl || 'https://smartexpensetracker-vtkb.onrender.com'
  );
  const [rssUrl, setRssUrl] = useState(config.rssUrl || 'https://feeds.bbci.co.uk/news/world/rss.xml');
  const [newsCycleSeconds, setNewsCycleSeconds] = useState(config.newsCycleSeconds || 35);
  const [rotation, setRotation] = useState(config.rotation || 0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig({
      city,
      userName,
      currency,
      expenseTrackerApiUrl,
      rssUrl,
      newsCycleSeconds: Number(newsCycleSeconds) || 35,
      rotation: Number(rotation),
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
              <h2 className="modal-title stark-title">STARK IND. // CONFIGURATION</h2>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 2, letterSpacing: '0.6px' }}>
              J.A.R.V.I.S. M.K. 85 INTERFACE PARAMETERS
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

          {/* Weather, Traffic & Flight Radar Location */}
          <div className="setting-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label className="setting-label" htmlFor="cfg-city" style={{ margin: 0 }}>
                <Globe size={13} style={{ display: 'inline', marginRight: 4 }} />
                Location (Weather, Traffic & Flight Radar)
              </label>
              <button
                type="button"
                className="mini-expand-text-btn"
                onClick={async () => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      async (pos) => {
                        const { latitude: lat, longitude: lon } = pos.coords;
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
                            headers: { 'User-Agent': 'AetherDashboard/1.0' },
                          });
                          const data = await res.json();
                          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city || data.address?.town;
                          const state = data.address?.state;
                          if (suburb) {
                            setCity(state ? `${suburb}, ${state}` : suburb);
                          } else {
                            setCity(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                          }
                        } catch {
                          setCity(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                        }
                      },
                      (err) => alert('Unable to retrieve GPS coordinates: ' + err.message)
                    );
                  }
                }}
                title="Detect live GPS coordinates from your browser"
              >
                <Navigation size={10} />
                <span>USE GPS LOCATION</span>
              </button>
            </div>
            <input
              id="cfg-city"
              type="text"
              className="setting-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. San Francisco, Tokyo, London, New York"
            />
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 4 }}>
              Syncs weather telemetry, live surface traffic map, and flight radar to this location.
            </div>
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
