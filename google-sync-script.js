/**
 * ==============================================================================
 * AETHER AMBIENT DASHBOARD — GOOGLE CALENDAR & GOOGLE TASKS 24x7 SYNC SCRIPT
 * ==============================================================================
 * 
 * This lightweight script runs inside your Google account (via Google Apps Script).
 * It securely exposes ALL your Google Calendars (primary, secondary, work, subscribed)
 * and Google Tasks to your wall dashboard without needing browser logins on your TV.
 * 
 * ------------------------------------------------------------------------------
 * UPDATE INSTRUCTIONS:
 * ------------------------------------------------------------------------------
 * 1. Open your project at https://script.google.com
 * 2. Select all code in Code.gs, replace with this file, and press Cmd+S (or Ctrl+S).
 * 3. Test: Select "testSync" in the top toolbar dropdown and click "Run".
 *    - Check the Execution log to see all your detected calendars and event counts!
 * 4. Deploy update:
 *    - Click "Deploy" (top right) -> "Manage deployments".
 *    - Click the pencil icon (Edit) ✏️ on your active deployment.
 *    - Under "Version", select "New version".
 *    - Click "Deploy" (the URL stays exactly the same!).
 * ==============================================================================
 */

function doGet(e) {
  try {
    const props = PropertiesService.getScriptProperties();

    // 1. Remote Settings Save Action (can be called via GET query to avoid CORS issues)
    if (e && e.parameter && e.parameter.action === 'save_settings') {
      const dataStr = e.parameter.data;
      if (dataStr) {
        props.setProperty('AETHER_SETTINGS', dataStr);
        const now = String(new Date().getTime());
        props.setProperty('AETHER_SETTINGS_TIME', now);
        return ContentService.createTextOutput(JSON.stringify({
          status: 'ok',
          message: 'Settings saved successfully',
          updatedAt: Number(now)
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. Remote Settings Read Action
    if (e && e.parameter && e.parameter.action === 'get_flights') {
      const lat = e.parameter.lat || '12.9716';
      const lon = e.parameter.lon || '77.7473';
      const radius = e.parameter.radius || '50';
      try {
        const adsbUrl = 'https://api.adsb.lol/v2/point/' + lat + '/' + lon + '/' + radius;
        const resp = UrlFetchApp.fetch(adsbUrl, {
          headers: {
            'User-Agent': 'AetherDashboard/1.0 (HomeDashboard/Bangalore; shyammohanvm@gmail.com)',
            'Accept': 'application/json'
          },
          muteHttpExceptions: true
        });
        return ContentService.createTextOutput(resp.getContentText())
          .setMimeType(ContentService.MimeType.JSON);
      } catch (fErr) {
        return ContentService.createTextOutput(JSON.stringify({ error: fErr.toString(), ac: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (e && e.parameter && e.parameter.action === 'get_settings') {
      const raw = props.getProperty('AETHER_SETTINGS');
      const time = props.getProperty('AETHER_SETTINGS_TIME');
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        settings: raw ? JSON.parse(raw) : null,
        updatedAt: time ? Number(time) : 0
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Regular 24x7 Sync (streams Calendar, Google Tasks, AND synchronized settings)
    const calendarEvents = getCalendarEvents();
    const googleTasks = getGoogleTasks();
    const rawSettings = props.getProperty('AETHER_SETTINGS');
    const settingsTime = props.getProperty('AETHER_SETTINGS_TIME');

    const output = {
      status: 'ok',
      syncedAt: new Date().toISOString(),
      events: calendarEvents,
      tasks: googleTasks,
      settings: rawSettings ? JSON.parse(rawSettings) : null,
      settingsUpdatedAt: settingsTime ? Number(settingsTime) : 0,
    };

    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    const errorOutput = {
      status: 'error',
      message: err.toString(),
      timestamp: new Date().toISOString(),
    };
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const bodyStr = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    if (bodyStr) {
      props.setProperty('AETHER_SETTINGS', bodyStr);
      const now = String(new Date().getTime());
      props.setProperty('AETHER_SETTINGS_TIME', now);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        message: 'Settings saved via POST',
        updatedAt: Number(now)
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Empty body' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function to verify all detected calendars and tasks in Apps Script log
 */
function testSync() {
  const allCals = CalendarApp.getAllCalendars();
  Logger.log("📅 Detected " + allCals.length + " Google Calendars in your account:");
  for (var i = 0; i < allCals.length; i++) {
    Logger.log("   • " + allCals[i].getName());
  }

  const events = getCalendarEvents();
  const tasks = getGoogleTasks();
  Logger.log("✅ Total calendar events across all calendars: " + events.length);
  Logger.log("✅ Total Google tasks: " + tasks.length);
  Logger.log(JSON.stringify({ totalEvents: events.length, totalTasks: tasks.length }, null, 2));
}

/**
 * Fetches events from ALL Google Calendars in the account for the next 14 days
 */
function getCalendarEvents() {
  const events = [];
  const seenEventIds = {};

  try {
    const now = new Date();
    // Only fetch current & future events (from right now up to 14 days in future)
    const startTime = now;
    const endTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Fetch all user calendars (primary, work, shared, family, subscribed, etc.)
    const allCalendars = CalendarApp.getAllCalendars();

    for (var c = 0; c < allCalendars.length; c++) {
      var cal = allCalendars[c];
      try {
        var calName = cal.getName();
        // Skip hidden calendars if marked hidden in UI
        if (cal.isHidden && cal.isHidden()) continue;

        var rawEvents = cal.getEvents(startTime, endTime);
        for (var i = 0; i < rawEvents.length; i++) {
          var ev = rawEvents[i];
          // Strictly skip any past events whose end time has already elapsed
          if (ev.getEndTime() < now) continue;

          var id = ev.getId();

          // Avoid duplicate entries if shared across views
          if (seenEventIds[id]) continue;
          seenEventIds[id] = true;

          events.push({
            id: id,
            calendarName: calName,
            summary: ev.getTitle() || 'Scheduled Event',
            description: ev.getDescription() || '',
            location: ev.getLocation() || '',
            start: ev.getStartTime().toISOString(),
            end: ev.getEndTime().toISOString(),
            allDay: ev.isAllDayEvent(),
            tag: calName && !calName.includes('@') ? calName : determineTag(ev.getTitle()),
          });
        }
      } catch (calErr) {
        console.warn('Skipping calendar "' + cal.getName() + '": ' + calErr);
      }
    }

    // Sort chronologically
    events.sort(function (a, b) {
      return new Date(a.start) - new Date(b.start);
    });
  } catch (err) {
    console.error('Calendar sync error: ' + err);
  }
  return events;
}

/**
 * Fetches all active and completed tasks from Google Tasks
 */
function getGoogleTasks() {
  const tasks = [];
  try {
    if (typeof Tasks === 'undefined') {
      console.warn('Google Tasks service not enabled in Apps Script Services.');
      return tasks;
    }

    // In Google Apps Script, resource name is Tasklists (lowercase 'l')
    const taskListsResponse = Tasks.Tasklists.list();
    const taskLists = (taskListsResponse && taskListsResponse.items) ? taskListsResponse.items : [];

    for (var i = 0; i < taskLists.length; i++) {
      var list = taskLists[i];
      var result = Tasks.Tasks.list(list.id, {
        showCompleted: true,
        showHidden: true,
        maxResults: 100,
      });

      if (result && result.items && result.items.length > 0) {
        for (var j = 0; j < result.items.length; j++) {
          var t = result.items[j];
          if (!t.title) continue; // skip empty rows

          var isCompleted = t.status === 'completed';
          if (isCompleted) {
            // Check if completed TODAY
            var completedDateStr = t.completed || t.updated;
            if (!completedDateStr) continue; // skip if completion date unknown
            var cDate = new Date(completedDateStr);
            var now = new Date();
            var completedToday = (
              cDate.getFullYear() === now.getFullYear() &&
              cDate.getMonth() === now.getMonth() &&
              cDate.getDate() === now.getDate()
            );
            if (!completedToday) continue; // Skip older historical completed tasks from past days
          }

          tasks.push({
            id: t.id,
            listId: list.id,
            listTitle: list.title,
            title: t.title,
            notes: t.notes || '',
            completed: isCompleted,
            completedAt: isCompleted ? (t.completed || t.updated) : null,
            due: t.due || null,
            updated: t.updated || null,
            priority: inferPriority(t.title, t.notes),
          });
        }
      }
    }

    // Sort: pending tasks first, then tasks completed today
    tasks.sort(function (a, b) {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  } catch (err) {
    console.error('Google Tasks error: ' + err);
  }
  return tasks;
}

function determineTag(title) {
  if (!title) return 'Event';
  var t = title.toLowerCase();
  if (t.includes('standup') || t.includes('sync') || t.includes('review') || t.includes('sprint') || t.includes('meeting')) return 'Work';
  if (t.includes('gym') || t.includes('run') || t.includes('workout') || t.includes('doctor')) return 'Health';
  if (t.includes('dinner') || t.includes('lunch') || t.includes('coffee') || t.includes('party')) return 'Social';
  if (t.includes('bill') || t.includes('rent') || t.includes('tax') || t.includes('bank')) return 'Finance';
  return 'Agenda';
}

function inferPriority(title, notes) {
  var text = ((title || '') + ' ' + (notes || '')).toLowerCase();
  if (text.includes('urgent') || text.includes('high priority') || text.includes('asap') || text.includes('important')) return 'high';
  if (text.includes('medium') || text.includes('med priority')) return 'med';
  return 'normal';
}

/**
 * Run this function once inside script.google.com editor to grant external request permission!
 */
function testFlights() {
  var url = 'https://api.adsb.lol/v2/point/12.9716/77.7473/50';
  var resp = UrlFetchApp.fetch(url, {
    headers: {
      'User-Agent': 'AetherDashboard/1.0 (HomeDashboard/Bangalore; shyammohanvm@gmail.com)',
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  });
  var data = JSON.parse(resp.getContentText());
  Logger.log('Success! Live aircraft count: ' + (data.ac ? data.ac.length : 0));
  if (data.ac) {
    data.ac.slice(0, 5).forEach(function(a) {
      Logger.log((a.flight || a.hex) + ' | ' + (a.t || 'UNK') + ' | ' + (a.alt_baro || 'GND') + 'ft');
    });
  }
}
