// Google Tasks Service for Aether Ambient Dashboard

export async function fetchGoogleTasks(syncUrl) {
  if (!syncUrl || syncUrl.trim() === '') {
    return {
      isSynced: false,
      tasks: getCachedOrFallbackTasks(),
    };
  }

  // 1. Try local/backend API proxy first (if server is running)
  try {
    const res = await fetch(`/api/sync?url=${encodeURIComponent(syncUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        cacheTasksLocally(data.tasks);
        return { isSynced: true, tasks: normalizeTasks(data.tasks) };
      }
    }
  } catch {
    // Continue to direct / CORS fetch
  }

  // 2. Fetch directly (Google Apps Script Web Apps support CORS)
  try {
    const response = await fetch(syncUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      const taskList = Array.isArray(data) ? data : (data.tasks || []);
      if (taskList.length >= 0) {
        cacheTasksLocally(taskList);
        return { isSynced: true, tasks: normalizeTasks(taskList) };
      }
    }
  } catch (err) {
    console.warn('Direct Google Tasks fetch failed, trying proxy:', err.message);
  }

  // 3. Fallback CORS proxy for static hosting (e.g. GitHub Pages)
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(syncUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const data = await res.json();
      const taskList = Array.isArray(data) ? data : (data.tasks || []);
      if (taskList.length >= 0) {
        cacheTasksLocally(taskList);
        return { isSynced: true, tasks: normalizeTasks(taskList) };
      }
    }
  } catch (err) {
    console.warn('All tasks fetch attempts failed:', err);
  }

  return {
    isSynced: false,
    tasks: getCachedOrFallbackTasks(),
  };
}

function isCompletedToday(dateStrOrObj) {
  if (!dateStrOrObj) return false;
  const d = new Date(dateStrOrObj);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function normalizeTasks(rawTasks) {
  return rawTasks
    .filter(t => {
      // Exclude any legacy mock tasks
      if (t.id && ['g-1', 'g-2', 'g-3', 'g-4', 'g-5'].includes(t.id)) return false;
      const isCompleted = Boolean(t.completed || t.status === 'completed');
      if (!isCompleted) return true; // Keep all active/pending tasks
      // For completed tasks, only keep if completed today
      return isCompletedToday(t.completedAt || t.updated || t.completed);
    })
    .map((t, idx) => {
      const isCompleted = Boolean(t.completed || t.status === 'completed');
      return {
        id: t.id || `task-${idx}`,
        title: t.title || 'Untitled Task',
        completed: isCompleted,
        completedAt: isCompleted ? (t.completedAt || t.updated || t.completed) : null,
        priority: t.priority || 'normal',
        due: t.due ? new Date(t.due) : null,
        notes: t.notes || '',
        listTitle: t.listTitle || 'My Tasks',
      };
    })
    .sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
}

function cacheTasksLocally(tasks) {
  try {
    const sanitized = tasks.filter(t => !['g-1', 'g-2', 'g-3', 'g-4', 'g-5'].includes(t.id));
    localStorage.setItem('aether_google_tasks_cache', JSON.stringify(sanitized));
  } catch {
    // Ignore storage errors
  }
}

export function getCachedOrFallbackTasks() {
  try {
    const cached = localStorage.getItem('aether_google_tasks_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed.filter(t => !['g-1', 'g-2', 'g-3', 'g-4', 'g-5'].includes(t.id));
        if (sanitized.length > 0) {
          return normalizeTasks(sanitized);
        }
      }
    }
  } catch {
    // Ignore cache parse errors
  }

  // Strictly no mock tasks returned
  return [];
}
