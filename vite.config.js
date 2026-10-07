import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import ical from 'node-ical';
import Parser from 'rss-parser';

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

function apiProxyPlugin() {
  return {
    name: 'api-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:5173');

          // Calendar proxy
          if (urlObj.pathname === '/api/calendar') {
            const calUrl = urlObj.searchParams.get('url');
            if (!calUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Missing calendar URL' }));
            }

            try {
              const webEvents = await ical.async.fromURL(calUrl);
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
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ events }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Failed to fetch calendar', details: err.message }));
            }
          }

          // Sync proxy (Google Apps Script Web App for Calendar & Tasks)
          if (urlObj.pathname === '/api/sync') {
            const syncUrl = urlObj.searchParams.get('url');
            if (!syncUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Missing sync URL' }));
            }
            try {
              const fetchRes = await fetch(syncUrl, {
                redirect: 'follow',
                headers: { 'Accept': 'application/json' },
              });
              const text = await fetchRes.text();
              res.setHeader('Content-Type', 'application/json');
              return res.end(text);
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Failed to sync with Google', details: err.message }));
            }
          }

          // RSS proxy
          if (urlObj.pathname === '/api/rss') {
            const feedUrl = urlObj.searchParams.get('url') || 'https://feeds.bbci.co.uk/news/world/rss.xml';
            try {
              const feed = await rssParser.parseURL(feedUrl);
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                title: feed.title || 'World News',
                items: (feed.items || []).slice(0, 15).map(item => ({
                  title: item.title,
                  link: item.link,
                  pubDate: item.pubDate,
                  contentSnippet: item.contentSnippet || item.content || '',
                  creator: item.creator || item.author || '',
                  imageUrl: extractRssImageUrl(item),
                })),
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Failed to fetch RSS', details: err.message }));
            }
          }

          // Expense Tracker Summary proxy
          if (urlObj.pathname === '/api/expenses/summary') {
            const secret = '2546698';
            const targets = [
              'http://127.0.0.1:8000/summary/entry-page',
              'https://smartexpensetracker-vtkb.onrender.com/summary/entry-page',
            ];
            for (const target of targets) {
              try {
                const fetchRes = await fetch(target, {
                  headers: { 'Accept': 'application/json', 'x-endpoint-secret': secret },
                  signal: AbortSignal.timeout(6000),
                });
                if (fetchRes.ok) {
                  const text = await fetchRes.text();
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(text);
                }
              } catch {
                // try next
              }
            }
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Failed to fetch expense summary' }));
          }

          // Expense Tracker Recent Expenses proxy
          if (urlObj.pathname === '/api/expenses/recent') {
            const secret = '2546698';
            const limit = urlObj.searchParams.get('limit') || '30';
            const targets = [
              `http://127.0.0.1:8000/expenses/recent?limit=${limit}`,
              `https://smartexpensetracker-vtkb.onrender.com/expenses/recent?limit=${limit}`,
            ];
            for (const target of targets) {
              try {
                const fetchRes = await fetch(target, {
                  headers: { 'Accept': 'application/json', 'x-endpoint-secret': secret },
                  signal: AbortSignal.timeout(6000),
                });
                if (fetchRes.ok) {
                  const text = await fetchRes.text();
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(text);
                }
              } catch {
                // try next
              }
            }
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Failed to fetch recent expenses' }));
          }

          // Live Flight Radar proxy (OpenSky Network with in-memory caching)
          if (urlObj.pathname === '/api/radar/flights') {
            const now = Date.now();
            if (global.__flightsCache && now - global.__flightsCache.timestamp < 10000) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ ...global.__flightsCache.data, cached: true }));
            }

            const lamin = urlObj.searchParams.get('lamin') || '12.0';
            const lomin = urlObj.searchParams.get('lomin') || '76.4';
            const lamax = urlObj.searchParams.get('lamax') || '14.3';
            const lomax = urlObj.searchParams.get('lomax') || '79.0';
            const flightUrl = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

            try {
              const fetchRes = await fetch(flightUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; AetherDashboard/1.0)',
                  'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(7000),
              });

              if (fetchRes.ok) {
                const data = await fetchRes.json();
                global.__flightsCache = { timestamp: now, data };
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ ...data, source: 'opensky-live', cached: false }));
              } else {
                if (global.__flightsCache) {
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ ...global.__flightsCache.data, source: 'opensky-cache', cached: true }));
                }
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ states: [], time: Math.floor(now / 1000), source: 'empty' }));
              }
            } catch (err) {
              if (global.__flightsCache) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ ...global.__flightsCache.data, source: 'opensky-cache', cached: true }));
              }
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ states: [], time: Math.floor(now / 1000), source: 'fallback', error: err.message }));
            }
          }

          // Cloud, Rain and Weather Radar Telemetry proxy (Open-Meteo + RainViewer)
          if (urlObj.pathname === '/api/radar/clouds' || urlObj.pathname === '/api/radar/weather') {
            const now = Date.now();
            if (global.__cloudCache && now - global.__cloudCache.timestamp < 120000) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ ...global.__cloudCache.data, cached: true }));
            }

            const lat = urlObj.searchParams.get('lat') || '13.1986';
            const lon = urlObj.searchParams.get('lon') || '77.7066';
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
                global.__cloudCache = { timestamp: now, data: enriched };
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(enriched));
              }

              if (global.__cloudCache) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ ...global.__cloudCache.data, cached: true }));
              }
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Failed to fetch weather telemetry' }));
            } catch (err) {
              if (global.__cloudCache) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ ...global.__cloudCache.data, cached: true }));
              }
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Weather telemetry error', details: err.message }));
            }
          }
        } catch (e) {
          console.error('API plugin error:', e);
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), apiProxyPlugin()],
  server: {
    port: 5173,
    host: true, // Allow local network access (e.g. from Mi Box on same Wi-Fi)
  },
});
