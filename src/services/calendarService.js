// Google Calendar & iCal Service (Current & Future Events Only)

const CALENDAR_CACHE_KEY = 'aether_calendar_cache';

/**
 * Filter events to only keep current (happening now) and future events.
 * Strips out any event whose end time is before the current moment.
 */
function filterCurrentAndFuture(events) {
  const now = new Date();
  return (events || [])
    .filter(ev => {
      if (!ev.endDate) return false;
      const endD = ev.endDate instanceof Date ? ev.endDate : new Date(ev.endDate);
      return !isNaN(endD.getTime()) && endD >= now;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

/**
 * Saves real events to localStorage for offline resilience
 */
function cacheEventsLocally(events) {
  try {
    const serialized = (events || []).map(e => ({
      ...e,
      startDate: e.startDate instanceof Date ? e.startDate.toISOString() : e.startDate,
      endDate: e.endDate instanceof Date ? e.endDate.toISOString() : e.endDate,
    }));
    localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(serialized));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Loads cached real events (ignoring any expired past ones)
 */
function getCachedRealEvents() {
  try {
    const raw = localStorage.getItem(CALENDAR_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const hydrated = parsed.map(e => ({
      ...e,
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
    }));
    return filterCurrentAndFuture(hydrated);
  } catch {
    return [];
  }
}

export async function fetchCalendarEvents(calendarUrl) {
  if (!calendarUrl || calendarUrl.trim() === '') {
    return getCachedRealEvents();
  }

  // 1. If this is a Google Apps Script Web App endpoint, fetch through sync proxy or direct
  if (calendarUrl.includes('script.google.com')) {
    // Try local / server sync proxy first (handles redirects and CORS reliably)
    try {
      const res = await fetch(`/api/sync?url=${encodeURIComponent(calendarUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          const mapped = data.events.map(ev => ({
            ...ev,
            startDate: new Date(ev.start),
            endDate: new Date(ev.end),
          }));
          const filtered = filterCurrentAndFuture(mapped);
          cacheEventsLocally(filtered);
          return filtered;
        }
      }
    } catch (err) {
      console.warn('Sync proxy calendar fetch failed, trying direct:', err.message);
    }

    // Try direct fetch
    try {
      const res = await fetch(calendarUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          const mapped = data.events.map(ev => ({
            ...ev,
            startDate: new Date(ev.start),
            endDate: new Date(ev.end),
          }));
          const filtered = filterCurrentAndFuture(mapped);
          cacheEventsLocally(filtered);
          return filtered;
        }
      }
    } catch (err) {
      console.warn('Direct Apps Script calendar fetch failed:', err.message);
    }
  }

  // 2. Try backend API proxy for iCal (.ics) URLs
  try {
    const res = await fetch(`/api/calendar?url=${encodeURIComponent(calendarUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        const mapped = data.events.map(ev => ({
          ...ev,
          startDate: new Date(ev.start || ev.startDate),
          endDate: new Date(ev.end || ev.endDate),
        }));
        const filtered = filterCurrentAndFuture(mapped);
        cacheEventsLocally(filtered);
        return filtered;
      }
    }
  } catch {
    // Proxy not available
  }

  // 3. Fallback direct / CORS proxy for standalone static hosting
  try {
    const proxyUrls = [
      `https://corsproxy.io/?url=${encodeURIComponent(calendarUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(calendarUrl)}`,
    ];

    for (const pUrl of proxyUrls) {
      try {
        const response = await fetch(pUrl, { signal: AbortSignal.timeout(8000) });
        if (response.ok) {
          const text = await response.text();
          if (text.includes('BEGIN:VCALENDAR')) {
            const parsed = parseIcsString(text);
            const filtered = filterCurrentAndFuture(parsed);
            if (filtered.length > 0) {
              cacheEventsLocally(filtered);
              return filtered;
            }
          } else {
            try {
              const jsonData = JSON.parse(text);
              if (jsonData.events && Array.isArray(jsonData.events)) {
                const mapped = jsonData.events.map(ev => ({
                  ...ev,
                  startDate: new Date(ev.start || ev.startDate),
                  endDate: new Date(ev.end || ev.endDate),
                }));
                const filtered = filterCurrentAndFuture(mapped);
                cacheEventsLocally(filtered);
                return filtered;
              }
            } catch {
              // Not JSON
            }
          }
        }
      } catch (err) {
        console.warn('Proxy attempt failed:', pUrl, err.message);
      }
    }
  } catch (err) {
    console.warn('Could not parse remote calendar:', err.message);
  }

  // No mock or placeholder events returned under any condition
  return getCachedRealEvents();
}

/**
 * Lightweight Client-side iCalendar (.ics) Parser
 */
export function parseIcsString(icsContent) {
  // Unfold folded lines (RFC 5545)
  const unfolded = icsContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\n|\r/);

  const events = [];
  let inEvent = false;
  let currentEvent = {};
  const now = new Date();
  const futureLimit = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  for (let line of lines) {
    line = line.trim();
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.start) {
        const startDate = new Date(currentEvent.start);
        const endDate = currentEvent.end ? new Date(currentEvent.end) : new Date(startDate.getTime() + 3600000);

        // Strictly current and future events: endDate must be >= now
        if (endDate >= now && startDate <= futureLimit) {
          events.push({
            id: currentEvent.uid || `ev-${Math.random()}`,
            summary: currentEvent.summary || 'Scheduled Event',
            description: currentEvent.description || '',
            location: currentEvent.location || '',
            startDate,
            endDate,
            allDay: Boolean(currentEvent.allDay),
            tag: currentEvent.summary ? (currentEvent.summary.toLowerCase().includes('standup') ? 'Work' : 'Agenda') : 'Event',
          });
        }
      }
      continue;
    }

    if (!inEvent) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const fullKey = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);
    const key = fullKey.split(';')[0].toUpperCase();

    if (key === 'SUMMARY') {
      currentEvent.summary = cleanIcsText(value);
    } else if (key === 'DESCRIPTION') {
      currentEvent.description = cleanIcsText(value);
    } else if (key === 'LOCATION') {
      currentEvent.location = cleanIcsText(value);
    } else if (key === 'UID') {
      currentEvent.uid = value;
    } else if (key === 'DTSTART') {
      const isDateOnly = fullKey.includes('VALUE=DATE') || value.length === 8;
      currentEvent.start = parseIcsDate(value, isDateOnly);
      if (isDateOnly) currentEvent.allDay = true;
    } else if (key === 'DTEND') {
      const isDateOnly = fullKey.includes('VALUE=DATE') || value.length === 8;
      currentEvent.end = parseIcsDate(value, isDateOnly);
    }
  }

  return events.sort((a, b) => a.startDate - b.startDate);
}

function parseIcsDate(str, isDateOnly) {
  if (isDateOnly || str.length === 8) {
    const year = parseInt(str.substring(0, 4), 10);
    const month = parseInt(str.substring(4, 6), 10) - 1;
    const day = parseInt(str.substring(6, 8), 10);
    return new Date(year, month, day);
  }

  const clean = str.replace(/[^0-9T]/g, '');
  const parts = clean.split('T');
  if (parts.length === 2) {
    const d = parts[0];
    const t = parts[1];
    const year = parseInt(d.substring(0, 4), 10);
    const month = parseInt(d.substring(4, 6), 10) - 1;
    const day = parseInt(d.substring(6, 8), 10);
    const hours = parseInt(t.substring(0, 2), 10);
    const mins = parseInt(t.substring(2, 4), 10);
    const secs = parseInt(t.substring(4, 6) || '0', 10);

    if (str.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hours, mins, secs));
    }
    return new Date(year, month, day, hours, mins, secs);
  }

  return new Date();
}

function cleanIcsText(str) {
  return str
    .replace(/\\n/g, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

export function formatEventTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function getRelativeTimeStr(startDate, endDate) {
  const now = new Date();
  const diffMs = startDate.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (60 * 1000));

  if (now >= startDate && now <= endDate) {
    return 'NOW';
  }

  if (diffMins > 0 && diffMins < 60) {
    return `In ${diffMins}m`;
  }

  const diffHours = Math.round(diffMins / 60);
  if (diffHours >= 1 && diffHours < 24 && startDate.getDate() === now.getDate()) {
    return `In ${diffHours}h`;
  }

  const isTomorrow = startDate.getDate() === new Date(now.getTime() + 86400000).getDate();
  if (isTomorrow) {
    return 'Tomorrow';
  }

  return startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isEventToday(date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
