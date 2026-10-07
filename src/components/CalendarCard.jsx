import React from 'react';
import { Calendar, Clock, MapPin, Video, AlertCircle } from 'lucide-react';
import { formatEventTime, getRelativeTimeStr, isEventToday } from '../services/calendarService';

export default function CalendarCard({ events = [], isLive = false }) {
  // Sort events by start date
  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const todayEvents = sortedEvents.filter(e => isEventToday(new Date(e.startDate)));
  const futureEvents = sortedEvents.filter(e => !isEventToday(new Date(e.startDate)));

  // Find next upcoming event
  const now = new Date();
  const nextEvent = sortedEvents.find(e => new Date(e.endDate) > now);

  return (
    <div className="dash-card calendar-card" role="region" aria-label="Schedule">
      <div className="card-section-header">
        <div className="card-title-group">
          <div className="card-title-icon icon-calendar">
            <Calendar size={18} />
          </div>
          <div>
            <h2 className="card-section-title">Schedule & Agenda</h2>
          </div>
        </div>
        <span className="card-badge" style={{ color: 'var(--accent-cyan)' }}>
          {isLive ? 'GOOGLE SYNC' : 'ACTIVE FEED'}
        </span>
      </div>

      {nextEvent && (
        <div style={{
          marginBottom: 14,
          padding: '10px 14px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pulse-dot" style={{ backgroundColor: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              NEXT UP:
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {nextEvent.summary}
            </span>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            background: 'var(--accent-cyan)',
            color: '#061a29',
            padding: '2px 8px',
            borderRadius: 6
          }}>
            {getRelativeTimeStr(new Date(nextEvent.startDate), new Date(nextEvent.endDate))}
          </span>
        </div>
      )}

      <div className="event-list custom-scroll">
        {sortedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: 13 }}>
            <AlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
            No events scheduled. Enjoy your free time!
          </div>
        ) : (
          sortedEvents.map((ev) => {
            const startD = new Date(ev.startDate);
            const endD = new Date(ev.endDate);
            const isToday = isEventToday(startD);
            const relTime = getRelativeTimeStr(startD, endD);
            const isNow = relTime === 'NOW';

            return (
              <div
                key={ev.id || ev.summary + ev.startDate}
                className={`event-item ${isToday ? 'is-today' : ''}`}
                style={{
                  borderLeft: isNow ? '3px solid var(--accent-rose)' : isToday ? '3px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                }}
              >
                <div className="event-time-col">
                  <span className="event-time-str">
                    {ev.allDay ? 'All Day' : formatEventTime(startD)}
                  </span>
                  <span className="event-relative-tag" style={{ color: isNow ? 'var(--accent-rose)' : undefined, fontWeight: isNow ? 700 : 400 }}>
                    {relTime}
                  </span>
                </div>

                <div className="event-details-col">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="event-title">{ev.summary}</div>
                    {ev.tag && (
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-dim)',
                      }}>
                        {ev.tag}
                      </span>
                    )}
                  </div>

                  {(ev.location || ev.description) && (
                    <div className="event-meta">
                      {ev.location && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {ev.location.toLowerCase().includes('meet') || ev.location.toLowerCase().includes('zoom') ? (
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
