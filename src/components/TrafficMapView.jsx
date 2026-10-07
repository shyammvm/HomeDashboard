import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

// Bangalore Geographic Landmark Reference Coordinates
const BANGALORE_LANDMARKS = [
  { id: 'vobl', name: 'REGIONAL AIRPORT (VOBL)', lat: 13.1986, lon: 77.7066, type: 'airport' },
  { id: 'itpl', name: 'ITPL / TECH PARK', lat: 12.9850, lon: 77.7300, type: 'tech' },
  { id: 'mg_road', name: 'CBD / MG ROAD', lat: 12.9716, lon: 77.5946, type: 'cbd' },
  { id: 'indiranagar', name: 'INDIRANAGAR', lat: 12.9784, lon: 77.6408, type: 'hub' },
  { id: 'bellandur_hub', name: 'BELLANDUR ECOWORLD', lat: 12.9249, lon: 77.6744, type: 'tech' },
  { id: 'silk_board', name: 'SILK BOARD', lat: 12.9176, lon: 77.6233, type: 'choke' },
  { id: 'ecity_hub', name: 'ELECTRONIC CITY', lat: 12.8452, lon: 77.6602, type: 'tech' },
  { id: 'manyata_hub', name: 'MANYATA PARK', lat: 13.0450, lon: 77.6200, type: 'tech' },
  { id: 'kr_puram', name: 'K.R. PURAM BRIDGE', lat: 12.9982, lon: 77.6789, type: 'choke' },
  { id: 'marathahalli', name: 'MARATHAHALLI', lat: 12.9560, lon: 77.7011, type: 'hub' },
];

// Major Bangalore Lakes (Outlines for Geographic Realism)
const BANGALORE_LAKES = [
  {
    name: 'Bellandur Lake',
    cx: 12.9350,
    cy: 77.6680,
    rx: 0.012,
    ry: 0.022,
    rotation: -25,
  },
  {
    name: 'Varthur Lake',
    cx: 12.9420,
    cy: 77.7380,
    rx: 0.010,
    ry: 0.018,
    rotation: 35,
  },
  {
    name: 'Ulsoor Lake',
    cx: 12.9820,
    cy: 77.6220,
    rx: 0.006,
    ry: 0.007,
    rotation: 10,
  },
  {
    name: 'Agara Lake',
    cx: 12.9220,
    cy: 77.6450,
    rx: 0.005,
    ry: 0.008,
    rotation: 45,
  },
];

/**
 * Tactical Bangalore Surface Traffic Vector Map
 * 100% crash-proof SVG rendering with Iron Man HUD aesthetic,
 * interactive pan/zoom, glowing arterial corridors, lake outlines,
 * pulsing home base beacon, and bottleneck alert shields.
 */
export default function TrafficMapView({
  center = { lat: 12.9698, lon: 77.7499, name: 'Whitefield' },
  rangeKm = 15,
  corridors = [],
  bottlenecks = [],
  height = '310px',
  onSelectCorridor,
  selectedCorridorId = null,
  interactive = true,
}) {
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState(null);

  const svgRef = useRef(null);

  // Effective visible range taking interactive zoom into account
  const effectiveRangeKm = useMemo(() => {
    return Math.max(2, rangeKm / zoomMultiplier);
  }, [rangeKm, zoomMultiplier]);

  // Coordinate projection from (lat, lon) to SVG pixels (center at 400, 300)
  // 1 degree latitude = ~110.8 km, 1 degree longitude = ~108.2 km at 13°N
  const VIEW_WIDTH = 800;
  const VIEW_HEIGHT = 600;
  const CX = VIEW_WIDTH / 2;
  const CY = VIEW_HEIGHT / 2;

  // Scale: pixels per km
  // At 100% range, the chosen rangeKm radius spans 260px in SVG space
  const pixelsPerKm = 260 / effectiveRangeKm;

  const projectCoords = useCallback(
    (lat, lon) => {
      const dxKm = (lon - center.lon) * 108.2;
      const dyKm = (center.lat - lat) * 110.8; // inverted Y in screen space

      const x = CX + dxKm * pixelsPerKm + panOffset.x;
      const y = CY + dyKm * pixelsPerKm + panOffset.y;
      return { x, y };
    },
    [center.lat, center.lon, pixelsPerKm, panOffset.x, panOffset.y, CX, CY]
  );

  // Mouse drag handlers for interactive panning
  const handleMouseDown = (e) => {
    if (!interactive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !interactive) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = (e) => {
    e?.stopPropagation();
    setZoomMultiplier(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setZoomMultiplier((prev) => Math.min(prev * 1.35, 4));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setZoomMultiplier((prev) => Math.max(prev / 1.35, 0.45));
  };

  // Center beacon coordinates
  const originPos = projectCoords(center.lat, center.lon);

  // Calculate range circle radius in pixels
  const rangeRadiusPx = rangeKm * pixelsPerKm;

  return (
    <div
      className="traffic-map-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 240, 255, 0.22)',
        background: '#02050f',
        userSelect: 'none',
        cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="tacGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 240, 255, 0.035)" strokeWidth="1" />
          </pattern>

          {/* Glowing Filters */}
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Tactical Grid Background */}
        <rect width="100%" height="100%" fill="url(#tacGrid)" />

        {/* 2. Concentric Range Rings from Home Base */}
        {[0.33, 0.66, 1].map((pct, idx) => (
          <circle
            key={idx}
            cx={originPos.x}
            cy={originPos.y}
            r={rangeRadiusPx * pct}
            fill={pct === 1 ? 'rgba(0, 240, 255, 0.02)' : 'none'}
            stroke={pct === 1 ? 'rgba(0, 240, 255, 0.5)' : 'rgba(0, 240, 255, 0.12)'}
            strokeWidth={pct === 1 ? 1.5 : 1}
            strokeDasharray={pct === 1 ? '6 4' : '3 3'}
          />
        ))}

        {/* Range Label on Outer Ring */}
        <text
          x={originPos.x + rangeRadiusPx + 4}
          y={originPos.y - 4}
          fill="rgba(0, 240, 255, 0.7)"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="700"
        >
          {rangeKm} KM RADIUS
        </text>

        {/* 3. Bangalore Waterbodies (Lakes in Wireframe) */}
        {BANGALORE_LAKES.map((lake, idx) => {
          const lakePos = projectCoords(lake.cx, lake.cy);
          const rPxX = lake.rx * 108.2 * pixelsPerKm;
          const rPxY = lake.ry * 110.8 * pixelsPerKm;

          return (
            <g key={idx} transform={`rotate(${lake.rotation} ${lakePos.x} ${lakePos.y})`}>
              <ellipse
                cx={lakePos.x}
                cy={lakePos.y}
                rx={Math.max(4, rPxX)}
                ry={Math.max(3, rPxY)}
                fill="rgba(0, 180, 255, 0.05)"
                stroke="rgba(0, 240, 255, 0.25)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x={lakePos.x}
                y={lakePos.y + 3}
                fill="rgba(0, 240, 255, 0.45)"
                fontSize="7.5"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {lake.name}
              </text>
            </g>
          );
        })}

        {/* 4. Bangalore Arterial Road Corridors */}
        {corridors.map((c) => {
          const p1 = projectCoords(c.start[0], c.start[1]);
          const p2 = projectCoords(c.end[0], c.end[1]);
          const isSelected = selectedCorridorId === c.id;
          const isHovered = hoveredItem?.id === c.id;

          // Road color by level
          const lineColor = c.color || '#00f0ff';
          const strokeWidth = isSelected || isHovered ? 5.5 : c.isWithinRange ? 3.5 : 2;

          return (
            <g
              key={c.id}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectCorridor) onSelectCorridor(c);
              }}
              onMouseEnter={() => setHoveredItem(c)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Outer Glow Path */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={lineColor}
                strokeWidth={strokeWidth + 5}
                strokeOpacity={isSelected || isHovered ? 0.6 : 0.18}
                strokeLinecap="round"
              />

              {/* Core Road Path */}
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isSelected || isHovered ? '#ffffff' : lineColor}
                strokeWidth={strokeWidth}
                strokeOpacity={c.isWithinRange ? 0.95 : 0.45}
                strokeDasharray={c.level === 'GRIDLOCK' ? '8 4' : null}
                strokeLinecap="round"
              />

              {/* Midpoint Label if within range or hovered */}
              {(c.isWithinRange || isHovered || isSelected) && (
                <text
                  x={(p1.x + p2.x) / 2}
                  y={(p1.y + p2.y) / 2 - 6}
                  fill={isSelected || isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.75)'}
                  fontSize={isSelected || isHovered ? '9.5' : '8'}
                  fontFamily="monospace"
                  fontWeight="700"
                  textAnchor="middle"
                  stroke="#02050f"
                  strokeWidth="2.5"
                  paintOrder="stroke"
                >
                  {c.name} ({c.currentSpeedKm} km/h)
                </text>
              )}
            </g>
          );
        })}

        {/* 5. Bangalore Landmark Hubs */}
        {BANGALORE_LANDMARKS.map((lm) => {
          const pos = projectCoords(lm.lat, lm.lon);
          // Only show if somewhat near view
          if (pos.x < -100 || pos.x > VIEW_WIDTH + 100 || pos.y < -100 || pos.y > VIEW_HEIGHT + 100) return null;

          return (
            <g key={lm.id} opacity="0.75">
              <circle cx={pos.x} cy={pos.y} r="2.5" fill="rgba(0, 240, 255, 0.8)" />
              <circle cx={pos.x} cy={pos.y} r="6" fill="none" stroke="rgba(0, 240, 255, 0.3)" strokeWidth="0.8" />
              <text
                x={pos.x + 8}
                y={pos.y + 3}
                fill="rgba(148, 163, 184, 0.85)"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="600"
              >
                {lm.name}
              </text>
            </g>
          );
        })}

        {/* 6. Bottleneck Warning Markers */}
        {bottlenecks.map((b) => {
          if (!b.isWithinRange) return null;
          const midLat = (b.start[0] + b.end[0]) / 2;
          const midLon = (b.start[1] + b.end[1]) / 2;
          const pos = projectCoords(midLat, midLon);
          const isSelected = selectedCorridorId === b.id;

          return (
            <g
              key={`bn-${b.id}`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectCorridor) onSelectCorridor(b);
              }}
              onMouseEnter={() => setHoveredItem(b)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {/* Pulsing ring */}
              <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.6">
                <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
              </circle>

              {/* Alert Shield Background */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="7"
                fill={isSelected ? '#ffffff' : '#ef4444'}
                stroke="#ffffff"
                strokeWidth="1.2"
              />
              <text
                x={pos.x}
                y={pos.y + 3.5}
                fill={isSelected ? '#ef4444' : '#ffffff'}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="900"
                textAnchor="middle"
              >
                !
              </text>

              {/* Delay callout flag */}
              <rect
                x={pos.x + 10}
                y={pos.y - 9}
                width="48"
                height="15"
                rx="3"
                fill="rgba(2, 6, 23, 0.9)"
                stroke="#ef4444"
                strokeWidth="1"
              />
              <text
                x={pos.x + 34}
                y={pos.y + 2}
                fill="#ef4444"
                fontSize="8"
                fontFamily="monospace"
                fontWeight="800"
                textAnchor="middle"
              >
                +{b.delayMins}m
              </text>
            </g>
          );
        })}

        {/* 7. Home Base Focal Point (Whitefield) */}
        <g>
          {/* Animated concentric ripples */}
          <circle cx={originPos.x} cy={originPos.y} r="22" fill="none" stroke="rgba(0, 240, 255, 0.4)" strokeWidth="1">
            <animate attributeName="r" values="6;26;6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.1;0.9" dur="2.4s" repeatCount="indefinite" />
          </circle>

          {/* Solid Core Beacon */}
          <circle cx={originPos.x} cy={originPos.y} r="5" fill="#ffffff" stroke="#00f0ff" strokeWidth="2.5" />
          <circle cx={originPos.x} cy={originPos.y} r="2" fill="#00f0ff" />

          {/* Focal Point Tag */}
          <rect
            x={originPos.x - 38}
            y={originPos.y - 24}
            width="76"
            height="15"
            rx="3"
            fill="rgba(2, 6, 23, 0.92)"
            stroke="#00f0ff"
            strokeWidth="1.2"
          />
          <text
            x={originPos.x}
            y={originPos.y - 13.5}
            fill="#00f0ff"
            fontSize="7.5"
            fontFamily="monospace"
            fontWeight="800"
            textAnchor="middle"
          >
            {center.name?.toUpperCase() || 'HOME BASE'}
          </text>
        </g>
      </svg>

      {/* Cyber Corner HUD Brackets */}
      <div className="map-hud-corner corner-tl" />
      <div className="map-hud-corner corner-tr" />
      <div className="map-hud-corner corner-bl" />
      <div className="map-hud-corner corner-br" />

      {/* Interactive Pan/Zoom HUD Overlay Controls */}
      {interactive && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            zIndex: 10,
          }}
        >
          <button
            onClick={handleZoomIn}
            className="mini-arrow-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={handleZoomOut}
            className="mini-arrow-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={handleResetView}
            className="mini-arrow-btn"
            style={{ width: 24, height: 24, padding: 0 }}
            title="Reset Map to Center"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      )}

      {/* Hovered Corridor Tooltip Box */}
      {hoveredItem && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'rgba(2, 6, 23, 0.92)',
            border: `1px solid ${hoveredItem.color || '#00f0ff'}`,
            padding: '6px 10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            zIndex: 10,
            pointerEvents: 'none',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '11px' }}>{hoveredItem.name}</div>
          <div style={{ fontSize: '9px', color: hoveredItem.color || '#00f0ff' }}>
            SPEED: {hoveredItem.currentSpeedKm} km/h • DELAY: +{hoveredItem.delayMins}m • {hoveredItem.level}
          </div>
        </div>
      )}

      {/* Live Map Telemetry Badge */}
      <div className="map-telemetry-badge">
        <span className="badge-dot pulse-cyan" />
        <span className="badge-text">
          SURFACE TACTICAL MAP // {rangeKm}KM RADIUS // {Math.round(effectiveRangeKm)}KM VISIBLE
        </span>
      </div>
    </div>
  );
}
