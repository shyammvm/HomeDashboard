import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Video, CheckCircle2 } from 'lucide-react';
import { formatEventTime, getRelativeTimeStr, isEventToday } from '../services/calendarService';

export default function CalendarCard({ events = [], isLive = false }) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Periodically refresh time to keep countdowns and active status accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Strictly filter only current (in-progress) and future events
  const currentAndFutureEvents = useMemo(() => {
    return (events || [])
      .filter((ev) => {
        if (!ev.endDate) return false;
        const endD = ev.endDate instanceof Date ? ev.endDate : new Date(ev.endDate);
        if (isNaN(endD.getTime())) return false;
        // Event is valid if it has not yet concluded
        return endD >= currentTime;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [events, currentTime]);

  // Find currently active event (in-progress right now)
  const currentActiveEvent = useMemo(() => {
    return currentAndFutureEvents.find((e) => {
      const startD = new Date(e.startDate);
      const endD = new Date(e.endDate);
      return currentTime >= startD && currentTime <= endD;
    });
  }, [currentAndFutureEvents, currentTime]);

  // Find the next upcoming event (or current active event for the banner)
  const bannerEvent = currentActiveEvent || currentAndFutureEvents[0];

  // Exclude the banner event from the list below so it is only displayed once
  const listEvents = useMemo(() => {
    if (!bannerEvent) return currentAndFutureEvents;
    return currentAndFutureEvents.filter((ev) => {
      if (ev === bannerEvent) return false;
      if (ev.id && bannerEvent.id && ev.id === bannerEvent.id) return false;
      const evKey = `${ev.summary}-${new Date(ev.startDate).getTime()}`;
      const bannerKey = `${bannerEvent.summary}-${new Date(bannerEvent.startDate).getTime()}`;
      return evKey !== bannerKey;
    });
  }, [currentAndFutureEvents, bannerEvent]);

  return (
    <div className="dash-card calendar-card stark-hud-card" role="region" aria-label="Schedule">
      <div className="stark-card-corner tl" />
      <div className="stark-card-corner tr" />
      <div className="stark-card-corner bl" />
      <div className="stark-card-corner br" />

      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-calendar">
            <Calendar size={16} />
          </div>
          <div>
            <div className="card-section-super">SEC-OPS // AGENDA</div>
            <h2 className="card-section-title">Schedule & Protocols</h2>
          </div>
        </div>
        <span className="card-badge stark-badge" style={{ color: 'var(--accent-cyan)' }}>
          <span
            className="pulse-dot"
            style={{
              backgroundColor: isLive ? 'var(--accent-cyan)' : 'var(--accent-amber)',
              marginRight: 4,
            }}
          />
          {isLive ? 'CALENDAR SYNC' : 'LOCAL CACHE'}
        </span>
      </div>

      {/* Hero Banner: Happening Now or Next Up */}
      {bannerEvent && (
        <div
          className={`calendar-hero-alert ${currentActiveEvent ? 'is-active' : 'is-upcoming'}`}
        >
          <div className="calendar-hero-top">
            <div className="hero-status-tag">
              <span
                className="pulse-dot"
                style={{
                  backgroundColor: currentActiveEvent
                    ? 'var(--accent-rose)'
                    : 'var(--accent-cyan)',
                  flexShrink: 0,
                }}
              />
              <span className="status-label">
                {currentActiveEvent ? 'PROTOCOL IN PROGRESS' : 'NEXT PROTOCOL'}
              </span>
            </div>
            <span className="hero-time-badge">
              {getRelativeTimeStr(new Date(bannerEvent.startDate), new Date(bannerEvent.endDate))}
            </span>
          </div>

          <div className="calendar-hero-title" title={bannerEvent.summary}>
            {bannerEvent.summary}
          </div>

          <div className="calendar-hero-meta">
            <span className="meta-time">
              {bannerEvent.allDay
                ? 'All Day'
                : `${formatEventTime(new Date(bannerEvent.startDate))} ➔ ${formatEventTime(new Date(bannerEvent.endDate))}`}
            </span>
            {bannerEvent.location && (
              <span className="meta-loc">
                {bannerEvent.location}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Events List (strictly current and future, excluding hero banner event) */}
      <div className="event-list custom-scroll">
        {listEvents.length === 0 ? (
          <div className="tactical-empty-box">
            <div className="tactical-empty-reticle">
              <CheckCircle2 size={20} color="var(--stark-cyan)" />
            </div>
            <div className="tactical-empty-title">
              {bannerEvent ? 'AGENDA NOMINAL // ALL PROTOCOLS DISPATCHED' : 'SCHEDULE CLEAR // ZERO ACTIVE CONFLICTS'}
            </div>
            <div className="tactical-empty-sub">
              CALENDAR TELEMETRY SYNCED • STANDBY FOR NEW EVENTS
            </div>
          </div>
        ) : (
          listEvents.map((ev) => {
            const startD = new Date(ev.startDate);
            const endD = new Date(ev.endDate);
            const isToday = isEventToday(startD);
            const isOngoing = currentTime >= startD && currentTime <= endD;
            const relTime = getRelativeTimeStr(startD, endD);

            return (
              <div
                key={ev.id || `${ev.summary}-${startD.getTime()}`}
                className={`event-item ${isToday ? 'is-today' : ''}`}
                style={{
                  borderLeft: isOngoing
                    ? '3px solid var(--accent-rose)'
                    : isToday
                      ? '3px solid var(--accent-cyan)'
                      : '1px solid var(--border-subtle)',
                }}
              >
                <div className="event-time-col">
                  <span className="event-time-str">
                    {ev.allDay ? 'All Day' : formatEventTime(startD)}
                  </span>
                  <span
                    className="event-relative-tag"
                    style={{
                      color: isOngoing ? 'var(--accent-rose)' : undefined,
                      fontWeight: isOngoing ? 700 : 400,
                    }}
                  >
                    {isOngoing ? 'NOW' : relTime}
                  </span>
                </div>

                <div className="event-details-col">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div className="event-title" title={ev.summary}>
                      {ev.summary}
                    </div>
                    {(ev.calendarName || ev.tag) && (
                      <span
                        style={{
                          fontSize: 9.5,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-dim)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {ev.calendarName || ev.tag}
                      </span>
                    )}
                  </div>

                  {(ev.location || ev.description) && (
                    <div className="event-meta">
                      {ev.location && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ev.location.toLowerCase().includes('meet') ||
                            ev.location.toLowerCase().includes('zoom') ? (
                            <Video size={12} color="var(--accent-indigo)" />
                          ) : (
                            <MapPin size={12} color="var(--accent-cyan)" />
                          )}
                          {ev.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
