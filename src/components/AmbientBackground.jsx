import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="stark-ambient-canvas" aria-hidden="true">
      {/* Holographic Hexagonal & Blueprint Grid */}
      <div className="stark-blueprint-grid" />

      {/* Sci-Fi HUD Scanline Sweep */}
      <div className="stark-scanline-beam" />

      {/* Rotating Holographic Arc Reactor Reticle Watermark in Background */}
      <div className="stark-reticle-watermark">
        <svg viewBox="0 0 600 600" className="stark-reticle-svg">
          <circle cx="300" cy="300" r="280" className="reticle-ring-outer" />
          <circle cx="300" cy="300" r="230" className="reticle-ring-dashed" />
          <circle cx="300" cy="300" r="160" className="reticle-ring-inner" />
          <line x1="300" y1="10" x2="300" y2="590" className="reticle-axis" />
          <line x1="10" y1="300" x2="590" y2="300" className="reticle-axis" />
          {/* Degree Ticks */}
          {[...Array(24)].map((_, i) => (
            <line
              key={i}
              x1="300"
              y1="25"
              x2="300"
              y2="40"
              className="reticle-tick"
              transform={`rotate(${i * 15} 300 300)`}
            />
          ))}
        </svg>
      </div>

      {/* Arc Reactor Glowing Energy Pools */}
      <div className="ambient-orb stark-cyan-core" />
      <div className="ambient-orb stark-gold-core" />
      <div className="ambient-orb stark-crimson-core" />
    </div>
  );
}
