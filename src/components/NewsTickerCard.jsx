import React, { useState, useEffect, useRef } from 'react';
import {
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ExternalLink,
  Clock,
  Globe,
} from 'lucide-react';
import FastTypewriter from './FastTypewriter';

export default function NewsTickerCard({ newsArticles = [], cycleSeconds = 35 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [imageError, setImageError] = useState(false);
  const intervalRef = useRef(null);

  const total = newsArticles.length;
  const current = newsArticles[currentIndex] || {
    title: 'Loading global news feeds...',
    source: 'World News',
    snippet: '',
    link: '#',
    timeAgo: 'Live',
    imageUrl: null,
    category: 'HEADLINES',
  };

  const cycleTimeMs = Math.max(5000, (cycleSeconds || 35) * 1000);
  const isPaused = isHovered || isManuallyPaused;

  // Reset image error state whenever current story changes
  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  // Main story rotation timer
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const stepMs = 100;
    const increment = (stepMs / cycleTimeMs) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((old) => (old + 1) % total);
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(intervalRef.current);
  }, [total, isPaused, cycleTimeMs, currentIndex]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setProgress(0);
    setCurrentIndex((old) => (old - 1 + total) % total);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setProgress(0);
    setCurrentIndex((old) => (old + 1) % total);
  };

  const handleTogglePause = (e) => {
    if (e) e.stopPropagation();
    setIsManuallyPaused((prev) => !prev);
  };

  const handleDotClick = (index) => {
    setProgress(0);
    setCurrentIndex(index);
  };

  const hasPhoto = current.imageUrl && !imageError;

  return (
    <div
      className="dash-card rss-news-card stark-hud-card"
      role="region"
      aria-label="Live News & Feeds"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="stark-card-corner tl" />
      <div className="stark-card-corner tr" />
      <div className="stark-card-corner bl" />
      <div className="stark-card-corner br" />

      {/* Card Header */}
      <div className="card-section-header" style={{ marginBottom: 14 }}>
        <div className="card-title-group">
          <div className="card-title-icon icon-news">
            <Newspaper size={18} />
          </div>
          <div>
            <h2 className="card-section-title">Satellite Intercept // World</h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isManuallyPaused ? (
            <span className="card-badge news-paused-badge">
              <Pause size={10} style={{ marginRight: 4 }} />
              PAUSED
            </span>
          ) : (
            <span className="card-badge news-live-badge">
              <span className="pulse-dot" style={{ backgroundColor: 'var(--accent-purple)' }} />
              LIVE FEED
            </span>
          )}
          <span className="news-counter-pill">
            {total > 0 ? `${currentIndex + 1} / ${total}` : '0 / 0'}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="news-content-body">
        {/* Large Featured Photo Hero */}
        <div className="news-hero-media">
          {hasPhoto ? (
            <img
              key={`img-${currentIndex}-${current.imageUrl}`}
              src={current.imageUrl}
              alt={current.title}
              className="news-hero-img"
              loading="eager"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="news-hero-fallback">
              <div className="news-hero-fallback-bg" />
              <Globe size={48} className="news-fallback-icon" />
            </div>
          )}

          {/* Vignette Gradients */}
          <div className="news-hero-scrim-top" />
          <div className="news-hero-scrim-bottom" />

          {/* Overlaid Badges on Photo */}
          <div className="news-hero-overlay-tags">
            <div className="news-source-badge">
              <span className="pulse-dot" style={{ backgroundColor: '#c084fc', width: 6, height: 6 }} />
              {current.source || 'World News'}
            </div>

            {current.category && (
              <span className="news-category-badge">
                {current.category}
              </span>
            )}
          </div>

          {current.timeAgo && (
            <div className="news-time-tag">
              <Clock size={11} />
              {current.timeAgo}
            </div>
          )}
        </div>

        {/* Text Story Section */}
        <div className="news-text-block">
          <a
            href={current.link && current.link !== '#' ? current.link : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="news-headline-link"
            title="Open original news article"
          >
            <h3 className="news-headline-large">{current.title}</h3>
          </a>

          {(current.paragraph || current.snippet) && (
            <p className="news-snippet-large">
              <FastTypewriter
                key={`card-news-${currentIndex}-${(current.paragraph || current.snippet).slice(0, 20)}`}
                text={current.paragraph || current.snippet}
                speedMs={32}
                maxDuration={6500}
              />
            </p>
          )}
        </div>
      </div>

      {/* Bottom Footer: Progress Bar & Controls */}
      <div className="news-footer-container">
        {/* Progress Bar indicating time left before rotating */}
        <div
          className="news-progress-bar"
          title={`${Math.round(((100 - progress) / 100) * (cycleSeconds || 35))}s remaining`}
        >
          <div
            className={`news-progress-fill ${isPaused ? 'is-paused' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Navigation & Action Bar */}
        <div className="news-nav-row">
          {/* Quick story dots (up to 10) */}
          <div className="news-dots-group">
            {total > 1 &&
              Array.from({ length: Math.min(total, 8) }).map((_, idx) => (
                <button
                  key={idx}
                  className={`news-dot-btn ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => handleDotClick(idx)}
                  title={`Go to story ${idx + 1}`}
                  aria-label={`Story ${idx + 1}`}
                />
              ))}
            {total > 8 && (
              <span className="news-more-counter">+{total - 8}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="news-control-buttons">
            {current.link && current.link !== '#' && (
              <a
                href={current.link}
                target="_blank"
                rel="noopener noreferrer"
                className="news-read-btn"
                title="Read full story in new tab"
              >
                <span>Read Story</span>
                <ExternalLink size={12} />
              </a>
            )}

            <button
              className={`icon-btn news-pause-btn ${isManuallyPaused ? 'active-pause' : ''}`}
              onClick={handleTogglePause}
              title={isManuallyPaused ? 'Resume auto-cycle' : 'Pause on this story'}
              aria-label={isManuallyPaused ? 'Resume story rotation' : 'Pause story rotation'}
            >
              {isManuallyPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>

            <button
              className="icon-btn"
              onClick={handlePrev}
              title="Previous Story"
              aria-label="Previous story"
            >
              <ChevronLeft size={15} />
            </button>

            <button
              className="icon-btn"
              onClick={handleNext}
              title="Next Story"
              aria-label="Next story"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
