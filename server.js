import express from 'express';
import cors from 'cors';
import ical from 'node-ical';
import Parser from 'rss-parser';
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
    return res.json({ events });
  } catch (err) {
    console.error('Error fetching calendar feed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch calendar', details: err.message });
  }
});

// RSS proxy endpoint
app.get('/api/rss', async (req, res) => {
  const feedUrl = req.query.url || 'https://feeds.bbci.co.uk/news/world/rss.xml';
  try {
    const feed = await rssParser.parseURL(feedUrl);
    return res.json({
      title: feed.title || 'World News',
      items: (feed.items || []).slice(0, 15).map(item => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet || item.content || '',
        creator: item.creator || item.author || '',
      })),
    });
  } catch (err) {
    console.error('Error parsing RSS feed:', err.message);
    return res.status(500).json({ error: 'Failed to parse RSS feed', details: err.message });
  }
});

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
