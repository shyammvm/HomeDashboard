// RSS News Service for Ambient Dashboard (Works on GitHub Pages & Standalone)

export function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (isNaN(diffSec) || diffSec < 0) return '';
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

export function inferCategory(title = '') {
  const lower = title.toLowerCase();
  if (/space|nasa|telescope|exoplanet|star|orbit|galaxy|mars|moon|astronom/i.test(lower)) return 'SPACE & COSMOS';
  if (/ai|artificial intelligence|robot|quantum|cyber|code|software|tech|apple|chip|google|micro/i.test(lower)) return 'TECHNOLOGY';
  if (/climate|energy|solar|wind|green|renewable|warming|carbon|emissions|nature/i.test(lower)) return 'EARTH & CLIMATE';
  if (/economy|market|inflation|trade|dollar|rupee|stock|bank|finance|crypto/i.test(lower)) return 'ECONOMY';
  if (/science|biology|medicine|health|dna|virus|plague|cure|nobel/i.test(lower)) return 'SCIENCE & HEALTH';
  if (/transit|train|maglev|flight|transport|rail|vehicle|car|battery/i.test(lower)) return 'INNOVATION';
  return 'WORLD HEADLINES';
}

export function getTopicFallbackImage(title = '', source = '') {
  const lower = `${title} ${source}`.toLowerCase();
  if (/space|nasa|telescope|exoplanet|star|orbit|galaxy|mars|moon/i.test(lower)) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85';
  }
  if (/solar|renewable|wind|battery|energy|climate|environment/i.test(lower)) {
    return 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=85';
  }
  if (/ai|model|code|software|chip|cyber|tech|robot|algorithm/i.test(lower)) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85';
  }
  if (/train|rail|maglev|vehicle|electric car|speed|transit/i.test(lower)) {
    return 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=85';
  }
  if (/health|medicine|doctor|vaccine|virus|dna|plague|bio/i.test(lower)) {
    return 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85';
  }
  if (/market|economy|finance|inflation|money|trade|bank/i.test(lower)) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=85';
  }
  // Curated premium ambient world news image
  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=85';
}

function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  // Upgrade BBC thumbnail resolution from 240/320px to crisp 800px HD
  if (url.includes('/standard/240/')) return url.replace('/standard/240/', '/standard/800/');
  if (url.includes('/standard/320/')) return url.replace('/standard/320/', '/standard/800/');
  return url;
}

function extractImageFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1]) {
    return sanitizeImageUrl(match[1]);
  }
  return null;
}

export async function fetchRssFeed(feedUrl) {
  const targetUrl = feedUrl || 'https://feeds.bbci.co.uk/news/world/rss.xml';

  // 1. Try backend API proxy if available (local dev or Render)
  try {
    const url = `/api/rss?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items.map(item => {
          const img =
            sanitizeImageUrl(item.imageUrl) ||
            extractImageFromHtml(item.contentSnippet || item.content) ||
            getTopicFallbackImage(item.title, data.title);

          const fullParagraph = (item.paragraph || item.contentSnippet || item.content || '').replace(/<[^>]*>?/gm, '').trim() || item.title;

          return {
            title: item.title,
            source: data.title || 'World News',
            snippet: fullParagraph,
            paragraph: fullParagraph,
            link: item.link || '#',
            pubDate: item.pubDate,
            timeAgo: formatTimeAgo(item.pubDate),
            imageUrl: img,
            category: inferCategory(item.title),
          };
        });
      }
    }
  } catch {
    // API not found (static GitHub Pages) -> fallback to client-side rss2json
  }

  // 2. Client-side fetch via free rss2json service
  try {
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(rss2jsonUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        const sourceName = data.feed ? data.feed.title : 'World News';
        return data.items.slice(0, 15).map(item => {
          let img = item.thumbnail || item.enclosure?.thumbnail || item.enclosure?.link;
          if (!img && (item.description || item.content)) {
            img = extractImageFromHtml(item.description || item.content);
          }
          img = sanitizeImageUrl(img) || getTopicFallbackImage(item.title, sourceName);

          const desc = (item.description || item.content || '').replace(/<[^>]*>?/gm, '').trim();
          const smallParagraph = (desc && !desc.toLowerCase().includes(item.title.toLowerCase().slice(0, 25)) && desc.length < 160)
            ? `${item.title}. ${desc}`
            : desc || item.title;

          return {
            title: item.title,
            source: sourceName,
            snippet: smallParagraph,
            paragraph: smallParagraph,
            link: item.link || '#',
            pubDate: item.pubDate,
            timeAgo: formatTimeAgo(item.pubDate),
            imageUrl: img,
            category: inferCategory(item.title),
          };
        });
      }
    }
  } catch (err) {
    console.warn('rss2json failed, using fallback news:', err.message);
  }

  return getFallbackNews();
}

export function getFallbackNews() {
  return [
    {
      title: 'Global Renewable Energy Reaches Record 40% Share of Worldwide Generation',
      source: 'Global Energy Review',
      snippet: 'Breakthrough capacity in solar and grid-scale battery storage drives historic surge across major continents, outpacing fossil fuel additions for the fifth consecutive quarter. Grid operators report enhanced stability as decentralized regional microgrids integrate high-density storage arrays.',
      paragraph: 'Breakthrough capacity in solar and grid-scale battery storage drives historic surge across major continents, outpacing fossil fuel additions for the fifth consecutive quarter. Grid operators report enhanced stability as decentralized regional microgrids integrate high-density storage arrays.',
      link: 'https://www.bbc.co.uk/news',
      pubDate: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      timeAgo: '35m ago',
      imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=85',
      category: 'CLEAN ENERGY',
    },
    {
      title: 'Next-Generation Space Telescope Reveals Atmospheric Details of Nearby Exoplanets',
      source: 'Science & Astro Today',
      snippet: 'Astronomers detect clear molecular signatures of water vapor and carbon-rich clouds in terrestrial rocky planets orbiting nearby hospitable star systems. High-resolution spectroscopy from orbital observatories confirms stratified layers similar to early planetary atmospheres.',
      paragraph: 'Astronomers detect clear molecular signatures of water vapor and carbon-rich clouds in terrestrial rocky planets orbiting nearby hospitable star systems. High-resolution spectroscopy from orbital observatories confirms stratified layers similar to early planetary atmospheres.',
      link: 'https://www.bbc.co.uk/news',
      pubDate: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      timeAgo: '1h ago',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=85',
      category: 'SPACE & COSMOS',
    },
    {
      title: 'Breakthrough in Solid-State Battery Tech Promises 800-Mile Range and 10-Minute Rapid Charge',
      source: 'TechPulse Mobility',
      snippet: 'New silicon-anode solid electrolyte overcomes decades of degradation challenges in commercial trials, opening the door for affordable ultra-long-range electric vehicles. Pilot manufacturing lines are slated to ramp up mass cell production by late next quarter.',
      paragraph: 'New silicon-anode solid electrolyte overcomes decades of degradation challenges in commercial trials, opening the door for affordable ultra-long-range electric vehicles. Pilot manufacturing lines are slated to ramp up mass cell production by late next quarter.',
      link: 'https://www.bbc.co.uk/news',
      pubDate: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
      timeAgo: '2h ago',
      imageUrl: 'https://images.unsplash.com/photo-1558441719-8b489c634a10?auto=format&fit=crop&w=1200&q=85',
      category: 'INNOVATION',
    },
    {
      title: 'Open Source AI Models Surpass Frontier Milestones in Coding and Math Reasoning',
      source: 'Tech Trends Global',
      snippet: 'Autonomous coding agents and distilled reasoning architectures gain widespread adoption across research labs and open-source communities worldwide. Benchmarks reveal efficiency gains exceeding 40% with significantly reduced compute requirements on edge devices.',
      paragraph: 'Autonomous coding agents and distilled reasoning architectures gain widespread adoption across research labs and open-source communities worldwide. Benchmarks reveal efficiency gains exceeding 40% with significantly reduced compute requirements on edge devices.',
      link: 'https://www.bbc.co.uk/news',
      pubDate: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
      timeAgo: '3h ago',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=85',
      category: 'TECHNOLOGY',
    },
    {
      title: 'High-Speed Maglev Rail Corridor Completes Maiden Fully Autonomous Test Run',
      source: 'World Transit Report',
      snippet: 'Passenger transit speeds reach 600 km/h with zero emissions, ultra-smooth magnetic levitation guideways, and intelligent redundant safety control systems. Civil engineering teams confirm readiness for phase-two intercity passenger operations.',
      paragraph: 'Passenger transit speeds reach 600 km/h with zero emissions, ultra-smooth magnetic levitation guideways, and intelligent redundant safety control systems. Civil engineering teams confirm readiness for phase-two intercity passenger operations.',
      link: 'https://www.bbc.co.uk/news',
      pubDate: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
      timeAgo: '5h ago',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=85',
      category: 'TRANSPORTATION',
    },
  ];
}
