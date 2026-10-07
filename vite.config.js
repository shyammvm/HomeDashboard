import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import ical from 'node-ical';
import Parser from 'rss-parser';

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AetherDashboard/1.0)',
  },
});

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
              const pastLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
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
                })),
              }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: 'Failed to fetch RSS', details: err.message }));
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
  plugins: [react(), apiProxyPlugin()],
  server: {
    port: 5173,
    host: true, // Allow local network access (e.g. from Mi Box on same Wi-Fi)
  },
});
