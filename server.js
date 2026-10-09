import express from 'express';
import cors from 'cors';
import ical from 'node-ical';
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AetherDashboard/1.0)',
  },
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
    ],
  },
});

function extractRssImageUrl(item) {
  let url = null;
  if (item.mediaThumbnail?.$?.url) url = item.mediaThumbnail.$.url;
  else if (item.mediaThumbnail?.url) url = item.mediaThumbnail.url;
  else if (Array.isArray(item.mediaThumbnail) && item.mediaThumbnail[0]?.$?.url) url = item.mediaThumbnail[0].$.url;
  else if (Array.isArray(item.mediaThumbnail) && item.mediaThumbnail[0]?.url) url = item.mediaThumbnail[0].url;
  else if (typeof item.mediaThumbnail === 'string' && item.mediaThumbnail.startsWith('http')) url = item.mediaThumbnail;

  if (!url) {
    if (item.mediaContent?.$?.url) url = item.mediaContent.$.url;
    else if (item.mediaContent?.url) url = item.mediaContent.url;
    else if (Array.isArray(item.mediaContent) && item.mediaContent[0]?.$?.url) url = item.mediaContent[0].$.url;
    else if (Array.isArray(item.mediaContent) && item.mediaContent[0]?.url) url = item.mediaContent[0].url;
  }

  if (!url && item.enclosure?.url) {
    url = item.enclosure.url;
  }

  if (!url) {
    const raw = item.contentEncoded || item.content || item.description || item.contentSnippet || '';
    const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match) url = match[1];
  }

  if (url && url.includes('/standard/240/')) {
    url = url.replace('/standard/240/', '/standard/800/');
  } else if (url && url.includes('/standard/320/')) {
    url = url.replace('/standard/320/', '/standard/800/');
  }
  return url || null;
}

const articleParagraphCache = new Map();

async function extractArticleParagraph(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  if (articleParagraphCache.has(url)) return articleParagraphCache.get(url);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const articleHtml = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html;
    const pMatches = [...articleHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    const cleanParas = pMatches
      .map(m =>
        m[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&#x27;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(p =>
        p.length >= 45 &&
        !p.startsWith('Image caption') &&
        !p.startsWith('Image source') &&
        !p.startsWith('Media caption') &&
        !p.startsWith('Listen:') &&
        !p.startsWith('Watch:') &&
        !p.startsWith('Follow:') &&
        !p.startsWith('Skip to') &&
        !p.includes('video you need') &&
        !p.includes('video can not be played') &&
        !p.includes('cookie') &&
        !p.includes('privacy policy') &&
        !p.includes('terms of use') &&
        !p.includes('BBC is not responsible') &&
        !p.includes('Subscribe to')
      );

    let paragraph = null;
    if (cleanParas.length >= 2) {
      paragraph = `${cleanParas[0]} ${cleanParas[1]}`.trim();
    } else if (cleanParas.length === 1) {
      paragraph = cleanParas[0];
    }

    if (paragraph) {
      if (articleParagraphCache.size > 200) {
        const firstKey = articleParagraphCache.keys().next().value;
        articleParagraphCache.delete(firstKey);
      }
      articleParagraphCache.set(url, paragraph);
      return paragraph;
    }
  } catch {
    // Ignore fetch timeout/errors and fall back
  }
  return null;
}

// Centralized settings persistence
const SETTINGS_FILE = path.join(__dirname, 'dashboard-settings.json');

function readLocalSettingsFile() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.warn('Could not read dashboard-settings.json:', err.message);
  }
  return null;
}

function writeLocalSettingsFile(data) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write dashboard-settings.json:', err.message);
  }
}

let activeSettings = readLocalSettingsFile();

// Centralized Settings endpoints (Syncs TV, Phone, and Laptop)
app.get('/api/settings', (req, res) => {
  const current = activeSettings || readLocalSettingsFile();
  res.json({
    status: 'ok',
    settings: current,
    updatedAt: current?.updatedAt || 0,
  });
});

app.post('/api/settings', (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'Invalid settings body' });
  }
  const merged = {
    ...activeSettings,
    ...incoming,
    updatedAt: incoming.updatedAt || Date.now(),
  };
  activeSettings = merged;
  writeLocalSettingsFile(merged);
  res.json({
    status: 'ok',
    settings: merged,
    updatedAt: merged.updatedAt,
  });
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Calendar proxy endpoint
app.get('/api/calendar', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing calendar URL' });
  }

  try {
    const webEvents = await ical.async.fromURL(url);
    const events = [];
    const now = new Date();
    const pastLimit = now; // strictly current and future events
    const futureLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const k in webEvents) {
      const ev = webEvents[k];
      if (ev.type === 'VEVENT') {
        const start = ev.start ? new Date(ev.start) : null;
        const end = ev.end ? new Date(ev.end) : null;
        if (start && end && end >= pastLimit && start <= futureLimit) {
          events.push({
            id: ev.uid || k,
            summary: ev.summary || 'Untitled Event',
            description: ev.description || '',
            location: ev.location || '',
            start: start.toISOString(),
            end: end.toISOString(),
            allDay: Boolean(ev.datetype === 'date' || (start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0)),
          });
        }
      }
    }

    events.sort((a, b) => new Date(a.start) - new Date(b.start));
    return res.json({ events });
  } catch (err) {
    console.error('Error fetching calendar feed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch calendar', details: err.message });
  }
});

// Google Sync proxy endpoint (supports Google Apps Script Web App redirects)
app.get('/api/sync', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing sync URL' });
  }

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'Accept': 'application/json',
      },
    });
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.json(data);
    } catch {
      return res.status(502).json({ error: 'Sync endpoint did not return JSON', raw: text.substring(0, 300) });
    }
  } catch (err) {
    console.error('Error proxying sync URL:', err.message);
    return res.status(500).json({ error: 'Failed to proxy sync URL', details: err.message });
  }
});

// RSS proxy endpoint
app.get('/api/rss', async (req, res) => {
  const feedUrl = req.query.url || 'https://feeds.bbci.co.uk/news/world/rss.xml';
  try {
    const feed = await rssParser.parseURL(feedUrl);
    const rawItems = (feed.items || []).slice(0, 15);

    // Enrich each item with a clean detailed paragraph
    const items = await Promise.all(
      rawItems.map(async (item) => {
        let paragraph = await extractArticleParagraph(item.link);
        if (!paragraph) {
          const snippet = (item.contentSnippet || item.content || '').replace(/<[^>]*>/g, '').trim();
          if (snippet && !snippet.toLowerCase().includes(item.title.toLowerCase().slice(0, 30)) && snippet.length < 160) {
            paragraph = `${item.title}. ${snippet}`.trim();
          } else {
            paragraph = snippet || item.title;
          }
        }
        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          contentSnippet: paragraph,
          paragraph,
          creator: item.creator || item.author || '',
          imageUrl: extractRssImageUrl(item),
        };
      })
    );

    return res.json({
      title: feed.title || 'World News',
      items,
    });
  } catch (err) {
    console.error('Error parsing RSS feed:', err.message);
    return res.status(500).json({ error: 'Failed to parse RSS feed', details: err.message });
  }
});

// Expense Tracker proxies
app.get('/api/expenses/summary', async (req, res) => {
  const secret = '2546698';
  const targets = [
    'http://127.0.0.1:8000/summary/entry-page',
    'https://smartexpensetracker-vtkb.onrender.com/summary/entry-page',
  ];
  for (const target of targets) {
    try {
      const response = await fetch(target, {
        headers: { 'Accept': 'application/json', 'x-endpoint-secret': secret },
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch {
      // try next
    }
  }
  return res.status(502).json({ error: 'Failed to fetch expense summary from tracker' });
});

app.get('/api/expenses/recent', async (req, res) => {
  const secret = '2546698';
  const limit = req.query.limit || '30';
  const targets = [
    `http://127.0.0.1:8000/expenses/recent?limit=${limit}`,
    `https://smartexpensetracker-vtkb.onrender.com/expenses/recent?limit=${limit}`,
  ];
  for (const target of targets) {
    try {
      const response = await fetch(target, {
        headers: { 'Accept': 'application/json', 'x-endpoint-secret': secret },
        signal: AbortSignal.timeout(6000),
      });
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch {
      // try next
    }
  }
  return res.status(502).json({ error: 'Failed to fetch recent expenses from tracker' });
});

// Live Flight Radar proxy (adsb.lol primary -> adsb.fi secondary -> OpenSky fallback with in-memory caching)
let flightsCache = { timestamp: 0, data: null };
app.get('/api/radar/flights', async (req, res) => {
  const now = Date.now();
  // 30-second cache to prevent slamming providers
  if (flightsCache.data && now - flightsCache.timestamp < 30000) {
    return res.json({ ...flightsCache.data, cached: true });
  }

  const lat = req.query.lat || '12.9716';
  const lon = req.query.lon || '77.7473';
  const radius = req.query.radius || '50';
  const userAgent = 'AetherDashboard/1.0 (HomeDashboard/Bangalore; shyammohanvm@gmail.com)';

  // 1. Primary: adsb.lol (unrestricted real-time ADS-B aggregator)
  try {
    const response = await fetch(`https://api.adsb.lol/v2/point/${lat}/${lon}/${radius}`, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.ac) && data.ac.length > 0) {
        flightsCache = { timestamp: now, data: { ac: data.ac, source: 'adsb-lol-live', time: Math.floor(now / 1000) } };
        return res.json({ ...flightsCache.data, cached: false });
      }
    }
  } catch (err) {
    console.warn('adsb.lol fetch warning:', err.message);
  }

  // 2. Secondary: opendata.adsb.fi
  try {
    const response = await fetch(`https://opendata.adsb.fi/api/v2/lat/${lat}/lon/${lon}/dist/${radius}`, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.aircraft) && data.aircraft.length > 0) {
        const normalized = { ac: data.aircraft, source: 'adsb-fi-live', time: Math.floor(now / 1000) };
        flightsCache = { timestamp: now, data: normalized };
        return res.json({ ...normalized, cached: false });
      }
    }
  } catch (err) {
    console.warn('adsb.fi fetch warning:', err.message);
  }

  // 3. Tertiary: OpenSky Network
  const lamin = req.query.lamin || '12.0';
  const lomin = req.query.lomin || '76.4';
  const lamax = req.query.lamax || '14.3';
  const lomax = req.query.lomax || '79.0';
  const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AetherDashboard/1.0)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.states && data.states.length > 0) {
        flightsCache = { timestamp: now, data: { ...data, source: 'opensky-live' } };
        return res.json({ ...data, source: 'opensky-live', cached: false });
      }
    }
  } catch (err) {
    console.warn('OpenSky fetch warning:', err.message);
  }

  // 4. Return cached contacts if available
  if (flightsCache.data) {
    return res.json({ ...flightsCache.data, source: flightsCache.data.source || 'cache', cached: true });
  }

  // 5. Empty fallback
  return res.json({ ac: [], states: [], time: Math.floor(now / 1000), source: 'empty' });
});

// Cloud, Rain and Weather Radar Telemetry proxy (Open-Meteo + RainViewer)
let cloudCache = { timestamp: 0, data: null };
const handleWeatherTelemetry = async (req, res) => {
  const now = Date.now();
  // 2-minute cache for weather and radar telemetry
  if (cloudCache.data && now - cloudCache.timestamp < 120000) {
    return res.json({ ...cloudCache.data, cached: true });
  }

  const lat = req.query.lat || '13.1986';
  const lon = req.query.lon || '77.7066';
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,precipitation,rain,showers,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure,relative_humidity_2m&hourly=precipitation_probability,precipitation,rain,showers,weather_code,cloud_cover,visibility&forecast_days=1&timezone=auto`;

  try {
    const [fetchRes, rvRes] = await Promise.allSettled([
      fetch(weatherUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      }),
      fetch('https://api.rainviewer.com/public/weather-maps.json', {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      }),
    ]);

    let data = {};
    if (fetchRes.status === 'fulfilled' && fetchRes.value.ok) {
      data = await fetchRes.value.json();
    }

    let rainviewer = null;
    if (rvRes.status === 'fulfilled' && rvRes.value.ok) {
      try {
        const rvData = await rvRes.value.json();
        const past = rvData.radar?.past || [];
        const latest = past[past.length - 1] || null;
        if (latest) {
          rainviewer = {
            host: rvData.host || 'https://tilecache.rainviewer.com',
            path: latest.path,
            time: latest.time,
            pastCount: past.length,
          };
        }
      } catch {
        // Ignore rainviewer parse error
      }
    }

    if (data.current) {
      const enriched = { ...data, rainviewer, source: 'open-meteo-live', cached: false };
      cloudCache = { timestamp: now, data: enriched };
      return res.json(enriched);
    }

    if (cloudCache.data) {
      return res.json({ ...cloudCache.data, cached: true });
    }
    return res.status(502).json({ error: 'Failed to fetch weather telemetry' });
  } catch (err) {
    console.error('Error fetching weather telemetry:', err.message);
    if (cloudCache.data) {
      return res.json({ ...cloudCache.data, cached: true });
    }
    return res.status(500).json({ error: 'Weather telemetry error', details: err.message });
  }
};

app.get('/api/radar/clouds', handleWeatherTelemetry);
app.get('/api/radar/weather', handleWeatherTelemetry);

// Serve frontend static build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Aether Home Dashboard server running on port ${PORT}`);
});
