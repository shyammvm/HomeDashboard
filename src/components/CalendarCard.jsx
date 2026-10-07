import React, { useMemo } from 'react';
import { Calendar, MapPin, Video, CheckCircle2 } from 'lucide-react';
import { formatEventTime, getRelativeTimeStr, isEventToday } from '../services/calendarService';

export default function CalendarCard({ events = [], isLive = false }) {
  const now = new Date();

  // Strictly filter only current (in-progress) and future events
  const currentAndFutureEvents = useMemo(() => {
    const currentTime = new Date();
    return (events || [])
      .filter((ev) => {
        if (!ev.endDate) return false;
        const endD = ev.endDate instanceof Date ? ev.endDate : new Date(ev.endDate);
        if (isNaN(endD.getTime())) return false;
        // Event is valid if it has not yet concluded
        return endD >= currentTime;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [events]);

  // Find currently active event (in-progress right now)
  const currentActiveEvent = useMemo(() => {
    const currentTime = new Date();
    return currentAndFutureEvents.find((e) => {
      const startD = new Date(e.startDate);
      const endD = new Date(e.endDate);
      return currentTime >= startD && currentTime <= endD;
    });
  }, [currentAndFutureEvents]);

  // Find the next upcoming event (or current active event for the banner)
  const bannerEvent = currentActiveEvent || currentAndFutureEvents[0];

  return (
    <div className="dash-card calendar-card stark-hud-card" role="region" aria-label="Schedule">
      <div className="stark-card-corner tl" />
      <div className="stark-card-corner tr" />
      <div className="stark-card-corner bl" />
      <div className="stark-card-corner br" />

      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-calendar">
            <Calendar size={18} />
          </div>
          <div>
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
          {isLive ? 'GOOGLE SYNC' : 'ACTIVE FEED'}
        </span>
      </div>

      {/* Hero Banner: Happening Now or Next Up */}
      {bannerEvent && (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            background: currentActiveEvent
              ? 'rgba(244, 63, 94, 0.08)'
              : 'rgba(56, 189, 248, 0.08)',
            border: currentActiveEvent
              ? '1px solid rgba(244, 63, 94, 0.25)'
              : '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span
              className="pulse-dot"
              style={{
                backgroundColor: currentActiveEvent
                  ? 'var(--accent-rose)'
                  : 'var(--accent-cyan)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: currentActiveEvent ? 'var(--accent-rose)' : 'var(--accent-cyan)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                flexShrink: 0,
              }}
            >
              {currentActiveEvent ? 'NOW:' : 'NEXT UP:'}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {bannerEvent.summary}
            </span>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: currentActiveEvent ? 'var(--accent-rose)' : 'var(--accent-cyan)',
              color: currentActiveEvent ? '#ffffff' : '#061a29',
              padding: '2px 8px',
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            {getRelativeTimeStr(new Date(bannerEvent.startDate), new Date(bannerEvent.endDate))}
          </span>
        </div>
      )}

      {/* Events List (strictly current and future) */}
      <div className="event-list custom-scroll">
        {currentAndFutureEvents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 15px',
              color: 'var(--text-dim)',
              fontSize: 12.5,
              background: 'rgba(255, 255, 255, 0.01)',
              borderRadius: '8px',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            <CheckCircle2
              size={24}
              style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4, color: 'var(--accent-emerald)' }}
            />
            No current or upcoming events scheduled.
          </div>
        ) : (
          currentAndFutureEvents.map((ev) => {
            const startD = new Date(ev.startDate);
            const endD = new Date(ev.endDate);
            const isToday = isEventToday(startD);
            const isOngoing = now >= startD && now <= endD;
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
