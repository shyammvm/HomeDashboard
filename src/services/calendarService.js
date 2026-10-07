// Google Calendar & iCal Service (Works on GitHub Pages & Standalone)

export async function fetchCalendarEvents(calendarUrl) {
  if (!calendarUrl || calendarUrl.trim() === '') {
    return getMockCalendarEvents();
  }

  // 1. Try local/backend API proxy first (if running with Node server)
  try {
    const res = await fetch(`/api/calendar?url=${encodeURIComponent(calendarUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.events && data.events.length > 0) {
        return data.events.map(ev => ({
          ...ev,
          startDate: new Date(ev.start),
          endDate: new Date(ev.end),
        }));
      }
    }
  } catch {
    // API endpoint not found (e.g. static GitHub Pages hosting) -> continue to client-side CORS fetch
  }

  // 2. Fetch directly via free public CORS proxy for GitHub Pages
  try {
    const proxyUrls = [
      `https://corsproxy.io/?url=${encodeURIComponent(calendarUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(calendarUrl)}`,
    ];

    let icsText = null;
    for (const pUrl of proxyUrls) {
      try {
        const response = await fetch(pUrl, { signal: AbortSignal.timeout(8000) });
        if (response.ok) {
          icsText = await response.text();
          if (icsText && icsText.includes('BEGIN:VCALENDAR')) {
            break;
          }
        }
      } catch (err) {
        console.warn('Proxy attempt failed:', pUrl, err);
      }
    }

    if (icsText) {
      const parsed = parseIcsString(icsText);
      if (parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Could not parse remote calendar, using local fallback:', err.message);
  }

  return getMockCalendarEvents();
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
        const now = new Date();
        const pastLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const futureLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const startDate = new Date(currentEvent.start);
        const endDate = currentEvent.end ? new Date(currentEvent.end) : new Date(startDate.getTime() + 3600000);

        if (endDate >= pastLimit && startDate <= futureLimit) {
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

    // Parse KEY:VALUE or KEY;PARAM=VAL:VALUE
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

  // Format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
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

export function getMockCalendarEvents() {
  const now = new Date();
  const today = (hours, mins) => {
    const d = new Date(now);
    d.setHours(hours, mins, 0, 0);
    return d;
  };

  const daysAhead = (offset, hours, mins) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(hours, mins, 0, 0);
    return d;
  };

  return [
    {
      id: 'demo-1',
      summary: 'Daily Engineering Standup',
      description: 'Review sprints, roadmap blockers, and weekly deployments',
      location: 'Google Meet',
      startDate: today(10, 0),
      endDate: today(10, 30),
      allDay: false,
      tag: 'Work',
      color: 'var(--accent-cyan)',
    },
    {
      id: 'demo-2',
      summary: 'Design Review: Smart Home Ecosystem',
      description: 'Review UI mockups for 1080x1920 ambient mirror display',
      location: 'Conference Room B / Discord',
      startDate: today(14, 0),
      endDate: today(15, 0),
      allDay: false,
      tag: 'Design',
      color: 'var(--accent-indigo)',
    },
    {
      id: 'demo-3',
      summary: 'Gym & Cardio Session',
      description: 'Upper body and 5k run',
      location: 'Fitness Center',
      startDate: today(18, 30),
      endDate: today(19, 45),
      allDay: false,
      tag: 'Personal',
      color: 'var(--accent-emerald)',
    },
    {
      id: 'demo-4',
      summary: 'Monthly Financial Audit & Budgeting',
      description: 'Review expense statements and investments',
      location: 'Home Office',
      startDate: daysAhead(1, 11, 0),
      endDate: daysAhead(1, 12, 0),
      allDay: false,
      tag: 'Finance',
      color: 'var(--accent-amber)',
    },
    {
      id: 'demo-5',
      summary: 'Weekend Dinner with Friends',
      description: 'Rooftop dining',
      location: 'Downtown Bistro',
      startDate: daysAhead(3, 19, 30),
      endDate: daysAhead(3, 22, 0),
      allDay: false,
      tag: 'Social',
      color: 'var(--accent-rose)',
    },
  ];
}
