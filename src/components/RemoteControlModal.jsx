import React, { useState } from 'react';
import { X, Smartphone, Check, Copy, Laptop, RefreshCw, Zap } from 'lucide-react';
import { triggerRemoteRefresh } from '../services/settingsSyncService';

export default function RemoteControlModal({
  isOpen,
  onClose,
  onOpenLocalSettings,
}) {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSent, setRefreshSent] = useState(false);

  if (!isOpen) return null;

  // Compute remote URL dynamically based on current location
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  // Remote settings URL
  const remoteUrl = `${currentOrigin}${currentPath}?remote=1`;

  // Standard QR code URL (using high-reliability QR service with SVG output)
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&bgcolor=030a19&color=00f0ff&data=${encodeURIComponent(remoteUrl)}`;

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(remoteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerRemoteRefresh();
      setRefreshSent(true);
      setTimeout(() => setRefreshSent(false), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="settings-modal-content stark-hud-card remote-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540 }}
      >
        <div className="stark-card-corner tl" />
        <div className="stark-card-corner tr" />
        <div className="stark-card-corner bl" />
        <div className="stark-card-corner br" />

        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulse-dot" style={{ backgroundColor: 'var(--stark-cyan)', width: 7, height: 7 }} />
              <h2 className="modal-title stark-title">REMOTE SETTINGS // PHONE & LAPTOP LINK</h2>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: 2, letterSpacing: '0.6px' }}>
              CROSS-DEVICE SYNCHRONIZATION PROTOCOL
            </div>
          </div>
          <button
            className="icon-btn stark-close-btn"
            onClick={onClose}
            aria-label="Close remote modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Hero Explanation */}
        <div className="remote-hero-box">
          <div className="remote-hero-icon-wrap">
            <Smartphone size={24} className="remote-pulse-icon" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '0.4px' }}>
              Edit Fast on Your Phone or Laptop
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.45, marginTop: 3 }}>
              Typing on TV displays is clunky and slow. Scan this QR code with your phone camera or open the link on your laptop to adjust all settings with touch or physical keyboard.
            </div>
          </div>
        </div>

        {/* QR Code Card */}
        <div className="remote-qr-card">
          <div className="remote-qr-frame">
            <img
              src={qrCodeImageUrl}
              alt="Scan QR code for remote dashboard settings"
              className="remote-qr-img"
              width={200}
              height={200}
            />
            <div className="remote-qr-scan-line" />
          </div>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--stark-cyan)', letterSpacing: '1px', fontWeight: 700 }}>
              SCAN WITH PHONE CAMERA
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
              Opens instant mobile remote control • No apps or logins needed
            </div>
          </div>
        </div>

        {/* URL Box & Copy */}
        <div className="remote-url-strip">
          <div className="remote-url-text" title={remoteUrl}>
            {remoteUrl}
          </div>
          <button
            type="button"
            className="mini-expand-text-btn"
            onClick={handleCopyLink}
            style={{ padding: '6px 10px', minWidth: 90 }}
          >
            {copied ? (
              <>
                <Check size={12} color="#10b981" />
                <span style={{ color: '#10b981' }}>COPIED!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>COPY LINK</span>
              </>
            )}
          </button>
        </div>

        {/* Live Sync Feature Highlights */}
        <div className="remote-sync-features">
          <div className="remote-feature-pill">
            <span className="pulse-dot" style={{ backgroundColor: '#10b981', width: 6, height: 6 }} />
            <span>Automatic 2-Way Sync</span>
          </div>
          <div className="remote-feature-pill">
            <Zap size={11} color="var(--stark-cyan)" />
            <span>Updates TV in Seconds</span>
          </div>
          <div className="remote-feature-pill">
            <Smartphone size={11} color="#fbbf24" />
            <span>Phone GPS Auto-Detect</span>
          </div>
        </div>

        {/* Quick Remote Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0, 240, 255, 0.04)', borderRadius: 6, border: '1px solid rgba(0, 240, 255, 0.15)' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff' }}>Send Quick Refresh to TV</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Force re-calculates weather, traffic, and calendar</div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            style={{ padding: '6px 12px', fontSize: 11 }}
          >
            <RefreshCw size={12} style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            <span>{refreshSent ? 'REFRESHED!' : 'REFRESH NOW'}</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 12, borderTop: '1px solid rgba(0, 240, 255, 0.15)' }}>
          {onOpenLocalSettings ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLocalSettings();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 8px',
              }}
            >
              <Laptop size={12} />
              <span>Open on-screen settings anyway</span>
            </button>
          ) : <div />}

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
            style={{ padding: '7px 18px', fontSize: 12 }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
