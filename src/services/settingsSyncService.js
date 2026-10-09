// Aether Ambient Dashboard — Centralized Settings Synchronization Engine
// Synchronizes settings seamlessly across TV, Phone, and Laptop displays in real-time.

import { DASHBOARD_CONFIG } from '../config.js';

const STORAGE_KEY = 'aether_config';
const SYNC_TIMESTAMP_KEY = 'aether_last_sync_timestamp';
const BROADCAST_CHANNEL_NAME = 'aether_settings_sync';

// Default configuration baseline
export const DEFAULT_CONFIG = {
  userName: DASHBOARD_CONFIG.userName || 'Shyam',
  city: DASHBOARD_CONFIG.city || 'Home',
  homeAddress: DASHBOARD_CONFIG.homeAddress || '12.971211, 77.735895',
  officeAddress: DASHBOARD_CONFIG.officeAddress || '12.919583, 77.671528',
  officeName: DASHBOARD_CONFIG.officeName || 'Office',
  currency: DASHBOARD_CONFIG.currency || '₹',
  expenseTrackerApiUrl: DASHBOARD_CONFIG.expenseTrackerApiUrl || 'https://smartexpensetracker-vtkb.onrender.com',
  expenseTrackerSecret: DASHBOARD_CONFIG.expenseTrackerSecret || '2546698',
  googleSyncUrl: DASHBOARD_CONFIG.googleSyncUrl || '',
  defaultCalendarUrl: DASHBOARD_CONFIG.defaultCalendarUrl || '',
  rssUrl: DASHBOARD_CONFIG.rssUrl || 'https://feeds.bbci.co.uk/news/world/rss.xml',
  newsCycleSeconds: DASHBOARD_CONFIG.newsCycleSeconds || 35,
  rotation: DASHBOARD_CONFIG.rotation || 0,
  lcdSleepMode: DASHBOARD_CONFIG.lcdSleepMode || false,
  lcdSleepStart: DASHBOARD_CONFIG.lcdSleepStart || '23:30',
  lcdSleepEnd: DASHBOARD_CONFIG.lcdSleepEnd || '06:30',
  tvKioskAutoReloadHours: DASHBOARD_CONFIG.tvKioskAutoReloadHours || 3,
  autoCycleSlides: DASHBOARD_CONFIG.autoCycleSlides ?? true,
  simulateOfflineFlights: DASHBOARD_CONFIG.simulateOfflineFlights ?? true,
  updatedAt: DASHBOARD_CONFIG.updatedAt || 0,
  updatedBy: DASHBOARD_CONFIG.updatedBy || 'defaults',
  remoteRefreshTrigger: 0,
};

// Cloud fallback sync endpoint (ensures instant zero-setup sync on GitHub Pages even before updating Google Apps Script)
const CLOUD_FALLBACK_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a09d98f701a11ad0d6bf1f14';

// In-memory BroadcastChannel for multi-tab/same-device zero-latency sync
let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  // Ignore BroadcastChannel errors in restrictive environments
}

/**
 * Get initial settings from local storage merged with defaults
 */
export function getInitialSettings() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.city === 'Chennai' || parsed.city === 'Your Location') parsed.city = DEFAULT_CONFIG.city;
        if (parsed.officeName === 'Work / EcoWorld') parsed.officeName = DEFAULT_CONFIG.officeName;
        if (parsed.officeAddress === 'RMZ Ecoworld, Bellandur, Bangalore') parsed.officeAddress = DEFAULT_CONFIG.officeAddress;
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Could not read cached settings from localStorage:', err);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Check local backend endpoint (/api/settings)
 */
async function fetchFromLocalBackend() {
  try {
    const res = await fetch('/api/settings', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings && typeof data.settings === 'object') {
        return {
          settings: data.settings,
          updatedAt: Number(data.updatedAt || data.settings.updatedAt || 0),
          source: 'local-server',
        };
      }
    }
  } catch {
    // Ignore backend fetch errors (e.g. static hosting on GitHub Pages)
  }
  return null;
}

/**
 * Fetch from user's Google Apps Script Web App
 */
async function fetchFromGoogleScript(googleSyncUrl) {
  if (!googleSyncUrl || typeof googleSyncUrl !== 'string' || !googleSyncUrl.startsWith('http')) {
    return null;
  }

  try {
    const url = `${googleSyncUrl}${googleSyncUrl.includes('?') ? '&' : '?'}action=get_settings&_t=${Date.now()}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings && typeof data.settings === 'object') {
        return {
          settings: data.settings,
          updatedAt: Number(data.updatedAt || data.settings.updatedAt || 0),
          source: 'google-sync',
        };
      }
    }
  } catch {
    // Google script fetch failed or script doesn't support action=get_settings yet
  }
  return null;
}

/**
 * Fetch from Cloud Fallback endpoint (zero-config, high availability)
 */
async function fetchFromCloudFallback() {
  try {
    const res = await fetch(CLOUD_FALLBACK_ENDPOINT, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && typeof data.data === 'object') {
        return {
          settings: data.data,
          updatedAt: Number(data.data.updatedAt || data.updatedAt || 0),
          source: 'cloud-store',
        };
      }
    }
  } catch {
    // Ignore cloud fallback fetch error
  }
  return null;
}

/**
 * Pull the latest remote settings from all available sources
 * Returns the newest config object if newer than local, or null if up-to-date
 */
export async function fetchRemoteSettings(currentLocalConfig = null) {
  const syncUrl = DASHBOARD_CONFIG.googleSyncUrl;
  const localConfig = currentLocalConfig || getInitialSettings();
  const currentUpdatedAt = Number(localConfig.updatedAt || 0);

  // Poll all candidate sources in parallel
  const results = await Promise.allSettled([
    fetchFromLocalBackend(),
    fetchFromGoogleScript(syncUrl),
    fetchFromCloudFallback(),
  ]);

  let bestResult = null;
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value && r.value.settings) {
      const cand = r.value;
      if (!bestResult || cand.updatedAt > bestResult.updatedAt) {
        bestResult = cand;
      }
    }
  }

  if (bestResult && bestResult.settings) {
    // Validate if the remote settings are newer or have distinct values
    const isNewer = bestResult.updatedAt > currentUpdatedAt;
    const isDifferent = hasConfigChanges(localConfig, bestResult.settings);

    if (isNewer || isDifferent) {
      const merged = {
        ...DEFAULT_CONFIG,
        ...bestResult.settings,
        updatedAt: bestResult.updatedAt || Date.now(),
      };
      // Cache locally
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          localStorage.setItem(SYNC_TIMESTAMP_KEY, String(Date.now()));
        }
      } catch { }

      return {
        config: merged,
        source: bestResult.source,
        updatedAt: bestResult.updatedAt,
      };
    }
  }

  return null;
}

/**
 * Checks whether two configs differ in functional keys
 */
export function hasConfigChanges(a, b) {
  if (!a || !b) return true;
  const keys = [
    'userName',
    'city',
    'homeAddress',
    'officeAddress',
    'officeName',
    'currency',
    'expenseTrackerApiUrl',
    'rssUrl',
    'newsCycleSeconds',
    'rotation',
    'lcdSleepMode',
    'lcdSleepStart',
    'lcdSleepEnd',
    'remoteRefreshTrigger',
  ];
  for (const k of keys) {
    if (String(a[k] ?? '') !== String(b[k] ?? '')) {
      return true;
    }
  }
  return false;
}

/**
 * Save and broadcast updated settings to ALL connected displays and cloud targets
 */
export async function saveAndBroadcastSettings(newSettings, updatedBy = 'Phone / Lap') {
  const now = Date.now();
  const fullConfig = {
    ...DEFAULT_CONFIG,
    ...newSettings,
    updatedAt: now,
    updatedBy,
  };

  // 1. Cache immediately in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullConfig));
      localStorage.setItem(SYNC_TIMESTAMP_KEY, String(now));
    }
  } catch (err) {
    console.warn('Failed to cache settings in localStorage:', err);
  }

  // 2. Broadcast immediately to any other tabs or windows on the same device
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'SETTINGS_UPDATED',
        config: fullConfig,
        updatedAt: now,
        updatedBy,
      });
    } catch { }
  }

  // 3. Push to all remote targets in parallel
  const syncPromises = [];

  // 3A. Local / Express server (/api/settings)
  syncPromises.push(
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullConfig),
      signal: AbortSignal.timeout(4000),
    }).catch(() => null)
  );

  // 3B. Google Apps Script Web App
  const googleSyncUrl = DASHBOARD_CONFIG.googleSyncUrl;
  if (googleSyncUrl && googleSyncUrl.startsWith('http')) {
    const dataEncoded = encodeURIComponent(JSON.stringify(fullConfig));
    const url = `${googleSyncUrl}${googleSyncUrl.includes('?') ? '&' : '?'}action=save_settings&data=${dataEncoded}&_t=${now}`;
    syncPromises.push(
      fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      }).catch(() => null)
    );
  }

  // 3C. Cloud Fallback endpoint (zero-setup PUT)
  syncPromises.push(
    fetch(CLOUD_FALLBACK_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AetherSettings',
        data: fullConfig,
        updatedAt: now,
      }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)
  );

  const results = await Promise.allSettled(syncPromises);
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;

  return {
    success: true,
    config: fullConfig,
    updatedAt: now,
    syncedTargetsCount: successCount,
  };
}

/**
 * Trigger remote TV refresh signal
 */
export async function triggerRemoteRefresh() {
  const current = getInitialSettings();
  const next = {
    ...current,
    remoteRefreshTrigger: (current.remoteRefreshTrigger || 0) + 1,
  };
  return saveAndBroadcastSettings(next, 'Remote Refresh Signal');
}

/**
 * Setup subscription to remote settings updates
 * Calls callback(newConfig, source) when newer settings are received
 */
export function subscribeToSettings(onSettingsUpdated, pollIntervalMs = 15000) {
  let isSubscribed = true;

  // Listen to BroadcastChannel
  const handleBroadcast = (event) => {
    if (!isSubscribed) return;
    if (event?.data?.type === 'SETTINGS_UPDATED' && event.data.config) {
      onSettingsUpdated(event.data.config, event.data.updatedBy || 'Local Broadcast');
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  // Periodic polling
  const poll = async () => {
    if (!isSubscribed) return;
    try {
      const current = getInitialSettings();
      const remote = await fetchRemoteSettings(current);
      if (remote && remote.config && isSubscribed) {
        onSettingsUpdated(remote.config, remote.source || 'Remote Cloud');
      }
    } catch (err) {
      console.warn('Periodic settings poll error:', err);
    }
  };

  // Immediate initial check
  poll();

  const intervalId = setInterval(poll, pollIntervalMs);

  // Return unsubscribe cleanup function
  return () => {
    isSubscribed = false;
    clearInterval(intervalId);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}
