// RSS News Service for Ambient Dashboard (Works on GitHub Pages & Standalone)

export async function fetchRssFeed(feedUrl) {
  const targetUrl = feedUrl || 'https://feeds.bbci.co.uk/news/world/rss.xml';

  // 1. Try backend API proxy if available (local dev or Render)
  try {
    const url = `/api/rss?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data.items.map(item => ({
          title: item.title,
          source: data.title || 'World News',
          snippet: item.contentSnippet || item.title,
          link: item.link,
          pubDate: item.pubDate,
        }));
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
        return data.items.slice(0, 15).map(item => ({
          title: item.title,
          source: data.feed ? data.feed.title : 'World News',
          snippet: item.description ? item.description.replace(/<[^>]*>?/gm, '').trim() : item.title,
          link: item.link,
          pubDate: item.pubDate,
        }));
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
      snippet: 'Breakthrough capacity in solar and grid-scale battery storage drives historic surge across major continents.',
      link: '#',
    },
    {
      title: 'Next-Generation Space Telescope Reveals Atmospheric Details of Nearby Exoplanets',
      source: 'Science & Astro Today',
      snippet: 'Astronomers detect signs of vapor and carbon-rich clouds in terrestrial rocky planets orbiting nearby stars.',
      link: '#',
    },
    {
      title: 'Breakthrough in Solid-State Battery Tech Promises 800-Mile Range and 10-Minute Rapid Charge',
      source: 'TechPulse',
      snippet: 'New silicon-anode solid electrolyte overcomes decades of degradation challenges in commercial trials.',
      link: '#',
    },
    {
      title: 'Open Source AI Models Surpass Frontier Milestones in Coding and Math Reasoning',
      source: 'Tech Trends',
      snippet: 'Autonomous coding agents and distilled reasoning architectures gain widespread adoption across research labs.',
      link: '#',
    },
    {
      title: 'High-Speed Maglev Rail Corridor Completes Maiden Fully Autonomous Test Run',
      source: 'World Transit Report',
      snippet: 'Passenger transit speeds reach 600 km/h with zero emissions and whisper-quiet magnetic levitation tracks.',
      link: '#',
    },
  ];
}
