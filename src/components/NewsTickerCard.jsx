import React, { useState, useEffect, useRef } from 'react';
import { Newspaper, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const CYCLE_TIME_MS = 12000;

export default function NewsTickerCard({ newsArticles = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const total = newsArticles.length;
  const current = newsArticles[currentIndex] || {
    title: 'Loading global news feeds...',
    source: 'World News',
    snippet: '',
  };

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const stepMs = 100;
    const increment = (stepMs / CYCLE_TIME_MS) * 100;

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
  }, [total, isPaused, currentIndex]);

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex((old) => (old - 1 + total) % total);
  };

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex((old) => (old + 1) % total);
  };

  return (
    <div
      className="dash-card rss-news-card"
      role="region"
      aria-label="News ticker"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div>
        <div className="card-section-header">
          <div className="card-title-group">
            <div className="card-title-icon icon-news">
              <Newspaper size={18} />
            </div>
            <div>
              <h2 className="card-section-title">Live News & Feeds</h2>
            </div>
          </div>
          <span className="card-badge" style={{ color: 'var(--accent-purple)' }}>
            HEADLINES
          </span>
        </div>

        <div className="news-article-preview">
          <div className="news-source-tag">
            <span className="pulse-dot" style={{ backgroundColor: 'var(--accent-purple)' }} />
            {current.source}
          </div>
          <div className="news-headline">{current.title}</div>
          {current.snippet && <p className="news-snippet">{current.snippet}</p>}
        </div>
      </div>

      <div>
        {/* Progress Bar indicating time to next story */}
        <div className="news-progress-bar">
          <div className="news-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="news-nav-row">
          <span className="news-counter">
            Story {currentIndex + 1} of {total}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="icon-btn"
              style={{ width: 26, height: 26 }}
              onClick={handlePrev}
              title="Previous Story"
              aria-label="Previous story"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              className="icon-btn"
              style={{ width: 26, height: 26 }}
              onClick={handleNext}
              title="Next Story"
              aria-label="Next story"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
