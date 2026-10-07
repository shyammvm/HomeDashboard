import React, { useState } from 'react';
import { X, Save, HelpCircle, RotateCw, Globe, Calendar, DollarSign, User, Rss } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) {
  const [calendarUrl, setCalendarUrl] = useState(config.calendarUrl || '');
  const [city, setCity] = useState(config.city || 'Chennai');
  const [userName, setUserName] = useState(config.userName || 'Shyam');
  const [currency, setCurrency] = useState(config.currency || '₹');
  const [monthlyBudget, setMonthlyBudget] = useState(config.monthlyBudget || 40000);
  const [rssUrl, setRssUrl] = useState(config.rssUrl || 'https://feeds.bbci.co.uk/news/world/rss.xml');
  const [rotation, setRotation] = useState(config.rotation || 0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig({
      calendarUrl,
      city,
      userName,
      currency,
      monthlyBudget: Number(monthlyBudget),
      rssUrl,
      rotation: Number(rotation),
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="modal-title">Dashboard Settings</h2>
          </div>
          <button
            className="icon-btn"
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

          {/* Google Calendar iCal URL */}
          <div className="setting-field">
            <label className="setting-label" htmlFor="cfg-cal">
              <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
              Google Calendar iCal (.ics) URL
            </label>
            <input
              id="cfg-cal"
              type="url"
              className="setting-input"
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            />
            <div className="setting-hint">
              💡 In Google Calendar (Web): Click calendar settings ➔ Scroll to <strong>"Integrate calendar"</strong> ➔ Copy <strong>"Secret address in iCal format"</strong>.
            </div>
          </div>

          {/* Weather Location */}
          <div className="setting-field">
            <label className="setting-label" htmlFor="cfg-city">
              <Globe size={13} style={{ display: 'inline', marginRight: 4 }} />
              Weather Location / City
            </label>
            <input
              id="cfg-city"
              type="text"
              className="setting-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Chennai, Bangalore, London, New York"
            />
          </div>

          {/* Expense & Currency */}
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
              <label className="setting-label" htmlFor="cfg-budget">
                <DollarSign size={13} style={{ display: 'inline', marginRight: 4 }} />
                Monthly Budget Limit
              </label>
              <input
                id="cfg-budget"
                type="number"
                className="setting-input"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="40000"
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
