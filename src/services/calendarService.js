// Google Calendar & iCal Service

export async function fetchCalendarEvents(calendarUrl) {
  if (!calendarUrl || calendarUrl.trim() === '') {
    return getMockCalendarEvents();
  }

  try {
    const res = await fetch(`/api/calendar?url=${encodeURIComponent(calendarUrl)}`);
    if (!res.ok) throw new Error('Failed to fetch calendar from API');
    const data = await res.json();
    if (data.events && data.events.length > 0) {
      return data.events.map(ev => ({
        ...ev,
        startDate: new Date(ev.start),
        endDate: new Date(ev.end),
      }));
    }
  } catch (err) {
    console.warn('Could not fetch remote calendar, showing local/demo schedule:', err.message);
  }

  return getMockCalendarEvents();
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
