// Room PM 2.5 Environmental Telemetry Service
// Fetches live indoor PM 2.5 & air quality status from Air Purifier Alexa endpoint

import { DASHBOARD_CONFIG } from '../config.js';

const DEFAULT_PM_URL = DASHBOARD_CONFIG.pmMeterUrl || 'https://pmmeter.onrender.com/alexa';
const CACHE_KEY = 'aether_room_pm_cache';

export function parsePmResponse(data) {
  let pm25 = null;
  let status = 'Good';
  let rawText = '';

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      rawText = data;
    }
  }

  if (typeof data === 'object' && data !== null) {
    const cardTitle = data?.response?.card?.title || '';
    const cardContent = data?.response?.card?.content || '';
    const speechText = data?.response?.outputSpeech?.text || '';
    rawText = `${cardTitle} ${cardContent} ${speechText} ${JSON.stringify(data)}`;
  }

  // 1. Extract PM 2.5 numeric value
  const pmMatch =
    rawText.match(/PM\s*2\.5[:\s]+(\d+(?:\.\d+)?)/i) ||
    rawText.match(/room\s+is\s+(\d+(?:\.\d+)?)/i) ||
    rawText.match(/class="pm-val">(\d+(?:\.\d+)?)</i) ||
    rawText.match(/"pm25":\s*(\d+(?:\.\d+)?)/i);

  if (pmMatch) {
    pm25 = Math.round(parseFloat(pmMatch[1]));
  }

  // 2. Extract Air Quality status category
  const statusMatch =
    rawText.match(/Air Quality:\s*([a-zA-Z]+)/i) ||
    rawText.match(/quality\s+is\s+([a-zA-Z]+)/i) ||
    rawText.match(/class="badge[^"]*">([a-zA-Z]+)</i);

  if (statusMatch) {
    status = statusMatch[1].trim();
  } else if (pm25 != null) {
    if (pm25 <= 12) status = 'Good';
    else if (pm25 <= 35) status = 'Moderate';
    else if (pm25 <= 55) status = 'Unhealthy (Sens)';
    else status = 'Unhealthy';
  }

  // 3. Sci-Fi HUD color encoding based on PM 2.5 concentration
  let color = '#34d399'; // Emerald / Good
  if (pm25 != null) {
    if (pm25 > 55) color = '#ef4444'; // Red (Unhealthy)
    else if (pm25 > 35) color = '#f97316'; // Orange (Unhealthy for Sensitive)
    else if (pm25 > 12) color = '#fbbf24'; // Amber / Gold (Moderate)
    else color = '#34d399'; // Emerald (Good)
  }

  return {
    pm25: pm25 ?? 19,
    status: status || 'Good',
    color,
    unit: 'µg/m³',
    updatedAt: Date.now(),
  };
}

export function getCachedRoomPm() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.pm25 != null) {
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }
  return {
    pm25: 19,
    status: 'Good',
    color: '#34d399',
    unit: 'µg/m³',
    updatedAt: Date.now(),
  };
}

export async function fetchRoomPm(customUrl) {
  const targetUrl = customUrl || DEFAULT_PM_URL;

  // 1. Try local/backend API proxy first (avoids CORS in development & server deployment)
  try {
    const proxyRes = await fetch(`/api/room-pm?url=${encodeURIComponent(targetUrl)}`, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: 'application/json' },
    });
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      const parsed = parsePmResponse(json);
      if (parsed.pm25 != null) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch {
    // Proceed to direct / CORS fallback
  }

  // 2. Try direct fetch (if CORS allowed)
  try {
    const directRes = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (directRes.ok) {
      const json = await directRes.json();
      const parsed = parsePmResponse(json);
      if (parsed.pm25 != null) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Direct room PM fetch failed, trying CORS proxy:', err.message);
  }

  // 3. Fallback CORS proxy for static hosting (e.g. GitHub Pages)
  try {
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const corsRes = await fetch(corsProxyUrl, {
      signal: AbortSignal.timeout(7000),
    });
    if (corsRes.ok) {
      const text = await corsRes.text();
      const parsed = parsePmResponse(text);
      if (parsed.pm25 != null) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (err) {
    console.warn('CORS proxy PM fetch failed:', err.message);
  }

  return getCachedRoomPm();
}

