import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  ExternalLink,
  Layers,
  MapPin,
  Car,
  Moon,
  Sun,
} from 'lucide-react';

/**
 * GoogleTrafficMap - Dark Mode Google Map View with Live Traffic Layer
 * Uses Google's official vector-rendered road and live traffic overlay tiles
 * with interactive drag-to-pan, zoom controls, KM range ring, and user location beacon.
 * Unnecessary POIs/shops stripped to focus purely on roads, place names, and live traffic.
 */
export default function GoogleTrafficMap({
  center = { lat: 12.9716, lon: 77.7473, cityName: 'Your Location' },
  rangeKm = 15,
  height = '310px',
  interactive = true,
  onRangeChange,
}) {
  // Zoom level mapped to selected km range
  const targetZoom = useMemo(() => {
    if (rangeKm <= 5) return 14;
    if (rangeKm <= 10) return 13;
    if (rangeKm <= 15) return 12;
    if (rangeKm <= 25) return 11;
    return 10;
  }, [rangeKm]);

  const [zoom, setZoom] = useState(targetZoom);
  const [mapType, setMapType] = useState('r'); // 'r' = Clean road & place labels without commercial shop clutter, 'y' = Satellite Hybrid
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Sync zoom when rangeKm changes
  useEffect(() => {
    setZoom(targetZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [targetZoom, center.lat, center.lon]);

  // Dimensions of viewport
  const [dims, setDims] = useState({ width: 700, height: 350 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDims({
          width: containerRef.current.clientWidth || 700,
          height: containerRef.current.clientHeight || 350,
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Web Mercator calculation for center tile and pixel offsets
  const TILE_SIZE = 256;
  const numTiles = Math.pow(2, zoom);

  // Center coordinates in pixel space
  const centerWorldX = ((center.lon + 180) / 360) * numTiles * TILE_SIZE;
  const latRad = (center.lat * Math.PI) / 180;
  const centerWorldY =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    numTiles *
    TILE_SIZE;

  // Apply user pan offset (in world pixels)
  const currentWorldX = centerWorldX - panOffset.x;
  const currentWorldY = centerWorldY - panOffset.y;

  // Viewport bounds in world coordinates
  const leftWorldX = currentWorldX - dims.width / 2;
  const topWorldY = currentWorldY - dims.height / 2;

  // Determine which tiles are visible (+ 1 buffer tile around edges)
  const startTileX = Math.floor(leftWorldX / TILE_SIZE) - 1;
  const endTileX = Math.floor((leftWorldX + dims.width) / TILE_SIZE) + 1;
  const startTileY = Math.floor(topWorldY / TILE_SIZE) - 1;
  const endTileY = Math.floor((topWorldY + dims.height) / TILE_SIZE) + 1;

  const visibleTiles = useMemo(() => {
    const tiles = [];
    for (let ty = startTileY; ty <= endTileY; ty++) {
      if (ty < 0 || ty >= numTiles) continue;
      for (let tx = startTileX; tx <= endTileX; tx++) {
        // Wrap tile X around international date line
        const wrappedTx = ((tx % numTiles) + numTiles) % numTiles;
        const sub = Math.abs((tx + ty) % 4);
        const url = `https://mt${sub}.google.com/vt/lyrs=${mapType},traffic&x=${wrappedTx}&y=${ty}&z=${zoom}`;

        // Screen position of tile
        const screenX = tx * TILE_SIZE - leftWorldX;
        const screenY = ty * TILE_SIZE - topWorldY;

        tiles.push({
          key: `${wrappedTx}-${ty}-${zoom}-${mapType}`,
          url,
          left: screenX,
          top: screenY,
        });
      }
    }
    return tiles;
  }, [startTileX, endTileX, startTileY, endTileY, numTiles, zoom, mapType, leftWorldX, topWorldY]);

  // Center pin position on screen
  const pinScreenX = centerWorldX - leftWorldX;
  const pinScreenY = centerWorldY - topWorldY;

  // Radius of range circle in screen pixels
  // At latitude `lat`, meters per pixel = 156543.03392 * cos(lat) / 2^zoom
  const metersPerPixel = (156543.03392 * Math.cos(latRad)) / numTiles;
  const rangeRadiusPx = (rangeKm * 1000) / metersPerPixel;

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (!interactive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !interactive) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPanOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setZoom((z) => Math.min(z + 1, 18));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setZoom((z) => Math.max(z - 1, 8));
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    setPanOffset({ x: 0, y: 0 });
    setZoom(targetZoom);
  };

  // Google Maps Direct URL with Traffic Layer enabled
  const googleMapsWebUrl = `https://www.google.com/maps/@${center.lat},${center.lon},${zoom}z/data=!5m1!1e1`;

  return (
    <div
      ref={containerRef}
      className="google-traffic-map-root"
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        borderRadius: '8px',
        overflow: 'hidden',
        border: isDarkMode ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid #dadce0',
        background: isDarkMode ? '#060b17' : '#e5e7eb',
        userSelect: 'none',
        cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
        boxShadow: isDarkMode
          ? '0 6px 28px rgba(0, 0, 0, 0.75), inset 0 0 20px rgba(0, 240, 255, 0.05)'
          : '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. Google Maps Tile Layer Grid (Dark Mode Applied) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {visibleTiles.map((t) => (
          <img
            key={t.key}
            src={t.url}
            alt=""
            loading="eager"
            style={{
              position: 'absolute',
              left: `${t.left}px`,
              top: `${t.top}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
              display: 'block',
              filter: isDarkMode && mapType !== 'y'
                ? 'invert(93%) hue-rotate(180deg) brightness(88%) contrast(120%) saturate(120%)'
                : 'none',
              transition: 'filter 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Cybernetic HUD Scanline & Vignette Overlay (Dark Mode Only) */}
      {isDarkMode && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 2,
            background: 'radial-gradient(circle at center, transparent 45%, rgba(2, 6, 23, 0.5) 100%)',
            boxShadow: 'inset 0 0 25px rgba(0, 240, 255, 0.08)',
          }}
        />
      )}

      {/* 2. SVG Overlay for Range Circle and Origin Pin */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        {/* Range Radius Circle */}
        <circle
          cx={pinScreenX}
          cy={pinScreenY}
          r={rangeRadiusPx}
          fill="rgba(0, 160, 255, 0.05)"
          stroke="#0080ff"
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* Outer Wave Pulse Animation */}
        <circle
          cx={pinScreenX}
          cy={pinScreenY}
          r={rangeRadiusPx * 0.35}
          fill="none"
          stroke="#00f0ff"
          strokeWidth="1.5"
          opacity="0.7"
        >
          <animate
            attributeName="r"
            values={`${rangeRadiusPx * 0.1};${rangeRadiusPx * 0.8}`}
            dur="3s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* 3. User Location Google Pin (HTML Overlay) */}
      <div
        style={{
          position: 'absolute',
          left: `${pinScreenX}px`,
          top: `${pinScreenY}px`,
          transform: 'translate(-50%, -100%)',
          pointerEvents: 'none',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Name Bubble */}
        <div
          style={{
            background: 'rgba(2, 6, 23, 0.92)',
            color: '#00f0ff',
            border: '1px solid #00f0ff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '9px',
            fontFamily: 'monospace',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            marginBottom: '3px',
          }}
        >
          {center.cityName || 'YOUR LOCATION'}
        </div>

        {/* Authentic Red / Cyan Google Pin */}
        <div
          style={{
            width: '26px',
            height: '34px',
            position: 'relative',
            filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.6))',
          }}
        >
          <svg viewBox="0 0 24 32" width="26" height="34">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z"
              fill="#ea4335"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle cx="12" cy="11" r="4.5" fill="#ffffff" />
            <circle cx="12" cy="11" r="2.5" fill="#ea4335" />
          </svg>
        </div>
      </div>

      {/* 4. Top-Left Google Maps Branding & Traffic Indicator */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.94)',
          border: '1px solid rgba(0, 0, 0, 0.15)',
          padding: '4px 10px',
          borderRadius: '4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#0f9d58',
            boxShadow: '0 0 6px #0f9d58',
          }}
        />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#202124' }}>
          Google Maps
        </span>
        <span style={{ fontSize: '10px', color: '#5f6368', fontWeight: 600 }}>
          // Live Traffic
        </span>
      </div>

      {/* 5. Top-Right Map Controls (Zoom, Reset, Satellite Toggle, Open Web) */}
      {interactive && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <button
            onClick={handleZoomIn}
            className="mini-arrow-btn"
            style={{
              width: 26,
              height: 26,
              background: isDarkMode ? 'rgba(4, 12, 28, 0.92)' : '#ffffff',
              color: isDarkMode ? 'var(--stark-cyan)' : '#3c4043',
              border: isDarkMode ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid #dadce0',
              borderRadius: '4px',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.2)',
            }}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={handleZoomOut}
            className="mini-arrow-btn"
            style={{
              width: 26,
              height: 26,
              background: isDarkMode ? 'rgba(4, 12, 28, 0.92)' : '#ffffff',
              color: isDarkMode ? 'var(--stark-cyan)' : '#3c4043',
              border: isDarkMode ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid #dadce0',
              borderRadius: '4px',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.2)',
            }}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={handleReset}
            className="mini-arrow-btn"
            style={{
              width: 26,
              height: 26,
              background: isDarkMode ? 'rgba(4, 12, 28, 0.92)' : '#ffffff',
              color: isDarkMode ? 'var(--stark-cyan)' : '#3c4043',
              border: isDarkMode ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid #dadce0',
              borderRadius: '4px',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.2)',
            }}
            title="Recenter Map"
          >
            <RotateCcw size={12} />
          </button>
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode((d) => !d)}
            className="mini-arrow-btn"
            style={{
              width: 26,
              height: 26,
              background: isDarkMode ? 'rgba(0, 240, 255, 0.18)' : '#ffffff',
              color: isDarkMode ? 'var(--stark-cyan)' : '#3c4043',
              border: isDarkMode ? '1px solid var(--stark-cyan)' : '1px solid #dadce0',
              borderRadius: '4px',
              boxShadow: isDarkMode ? '0 0 10px rgba(0, 240, 255, 0.35)' : '0 1px 4px rgba(0,0,0,0.2)',
            }}
            title={isDarkMode ? 'Switch to Light Map Mode' : 'Switch to Dark HUD Mode'}
          >
            {isDarkMode ? <Moon size={12} /> : <Sun size={12} />}
          </button>
          {/* Satellite / Clean Vector Toggle */}
          <button
            onClick={() => setMapType((curr) => (curr === 'r' ? 'y' : 'r'))}
            className="mini-arrow-btn"
            style={{
              width: 26,
              height: 26,
              background: mapType === 'y' ? (isDarkMode ? 'var(--stark-cyan)' : '#1a73e8') : (isDarkMode ? 'rgba(4, 12, 28, 0.92)' : '#ffffff'),
              color: mapType === 'y' ? '#020617' : (isDarkMode ? '#e2e8f0' : '#3c4043'),
              border: isDarkMode ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid #dadce0',
              borderRadius: '4px',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.2)',
            }}
            title={mapType === 'r' ? 'Switch to Satellite Hybrid View' : 'Switch to Clean Road Map'}
          >
            <Layers size={13} />
          </button>
        </div>
      )}

      {/* 6. Bottom Traffic Flow Heat Legend (Google Colors) */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          zIndex: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isDarkMode ? 'rgba(3, 10, 24, 0.94)' : 'rgba(255, 255, 255, 0.95)',
          padding: '4px 10px',
          borderRadius: '4px',
          border: isDarkMode ? '1px solid rgba(0, 240, 255, 0.28)' : '1px solid rgba(0,0,0,0.12)',
          boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.6)' : '0 2px 6px rgba(0,0,0,0.25)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9.5px',
          color: isDarkMode ? '#f8fafc' : '#3c4043',
        }}
      >
        <span style={{ fontWeight: 700, color: isDarkMode ? 'var(--stark-cyan)' : '#3c4043' }}>Traffic:</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 12, height: 4, background: '#0f9d58', borderRadius: 2 }} />
          Fast
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 12, height: 4, background: '#f4b400', borderRadius: 2 }} />
          Moderate
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 12, height: 4, background: '#db4437', borderRadius: 2 }} />
          Slow
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 12, height: 4, background: '#8b0000', borderRadius: 2 }} />
          Gridlock
        </span>
      </div>

      {/* 7. Bottom-Right "Open in Google Maps" Link */}
      <a
        href={googleMapsWebUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          zIndex: 6,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: isDarkMode ? 'rgba(3, 10, 24, 0.92)' : '#ffffff',
          color: isDarkMode ? 'var(--stark-cyan)' : '#1a73e8',
          padding: '4px 8px',
          borderRadius: '4px',
          border: isDarkMode ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid #dadce0',
          boxShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.2)',
          textDecoration: 'none',
          fontSize: '9.5px',
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
        }}
        title="Open Live Traffic in Google Maps Web"
      >
        <span>Open in Google Maps</span>
        <ExternalLink size={10} />
      </a>
    </div>
  );
}
