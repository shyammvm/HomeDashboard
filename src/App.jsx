import React, { useState, useEffect, useCallback } from 'react';
import AmbientBackground from './components/AmbientBackground';
import HeaderBar from './components/HeaderBar';
import HeroTimeWeather from './components/HeroTimeWeather';
import QuoteBanner from './components/QuoteBanner';
import CalendarCard from './components/CalendarCard';
import TasksCard from './components/TasksCard';
import ExpenseTrackerCard from './components/ExpenseTrackerCard';
import NewsTickerCard from './components/NewsTickerCard';
import SettingsModal from './components/SettingsModal';

import { fetchWeatherData, fetchCoordinatesForCity } from './services/weatherService';
import { fetchCalendarEvents } from './services/calendarService';
import { fetchRssFeed } from './services/rssService';

const DEFAULT_CONFIG = {
  userName: 'Shyam',
  city: 'Chennai',
  calendarUrl: '',
  currency: '₹',
  monthlyBudget: 40000,
  rssUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
  rotation: 0,
};

export default function App() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('aether_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weatherData, setWeatherData] = useState({
    city: config.city,
    temp: 29,
    feelsLike: 32,
    humidity: 68,
    windSpeed: 14,
    condition: 'Mainly Clear',
    iconName: 'Sun',
    forecast: [],
  });
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [newsArticles, setNewsArticles] = useState([]);
  const [isCalendarLive, setIsCalendarLive] = useState(false);

  // Load weather
  const loadWeather = useCallback(async (cityName) => {
    const geo = await fetchCoordinatesForCity(cityName || config.city);
    if (geo) {
      const data = await fetchWeatherData(geo.lat, geo.lon, geo.name);
      setWeatherData(data);
    } else {
      const data = await fetchWeatherData(13.0827, 80.2707, cityName || 'Chennai');
      setWeatherData(data);
    }
  }, [config.city]);

  // Load calendar
  const loadCalendar = useCallback(async (url) => {
    const events = await fetchCalendarEvents(url !== undefined ? url : config.calendarUrl);
    setCalendarEvents(events);
    setIsCalendarLive(Boolean(url || config.calendarUrl));
  }, [config.calendarUrl]);

  // Load news
  const loadNews = useCallback(async (feedUrl) => {
    const articles = await fetchRssFeed(feedUrl || config.rssUrl);
    setNewsArticles(articles);
  }, [config.rssUrl]);

  // Initial load
  useEffect(() => {
    loadWeather(config.city);
    loadCalendar(config.calendarUrl);
    loadNews(config.rssUrl);
  }, [config.city, config.calendarUrl, config.rssUrl, loadWeather, loadCalendar, loadNews]);

  // Periodic Auto-refresh intervals for 24x7 unattended operation
  useEffect(() => {
    const weatherTimer = setInterval(() => loadWeather(config.city), 15 * 60 * 1000); // 15 mins
    const calendarTimer = setInterval(() => loadCalendar(config.calendarUrl), 10 * 60 * 1000); // 10 mins
    const newsTimer = setInterval(() => loadNews(config.rssUrl), 30 * 60 * 1000); // 30 mins

    return () => {
      clearInterval(weatherTimer);
      clearInterval(calendarTimer);
      clearInterval(newsTimer);
    };
  }, [config.city, config.calendarUrl, config.rssUrl, loadWeather, loadCalendar, loadNews]);

  // Save config
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('aether_config', JSON.stringify(newConfig));
    if (newConfig.city !== config.city) loadWeather(newConfig.city);
    if (newConfig.calendarUrl !== config.calendarUrl) loadCalendar(newConfig.calendarUrl);
    if (newConfig.rssUrl !== config.rssUrl) loadNews(newConfig.rssUrl);
  };

  // Screen rotation cycle
  const handleRotateCycle = () => {
    const rotations = [0, 90, 180, 270];
    const nextIdx = (rotations.indexOf(config.rotation) + 1) % rotations.length;
    const nextRot = rotations[nextIdx];
    const updated = { ...config, rotation: nextRot };
    setConfig(updated);
    localStorage.setItem('aether_config', JSON.stringify(updated));
  };

  const handleRefreshAll = () => {
    loadWeather(config.city);
    loadCalendar(config.calendarUrl);
    loadNews(config.rssUrl);
  };

  const rotationClass = config.rotation ? `rotate-${config.rotation}` : '';

  return (
    <>
      <AmbientBackground />

      <main className={`dashboard-viewport ${rotationClass}`} id="dashboard-root">
        {/* Top Status & Controls */}
        <HeaderBar
          rotation={config.rotation}
          onRotate={handleRotateCycle}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRefreshAll={handleRefreshAll}
        />

        {/* Hero Clock & Live Weather */}
        <HeroTimeWeather
          weatherData={weatherData}
          userName={config.userName}
        />

        {/* Daily Quote / Affirmation */}
        <QuoteBanner />

        {/* 2-Column Split: Calendar & Tasks on Left | Expenses & News on Right */}
        <div className="dashboard-grid-main">
          {/* Left Column: Agenda & Focus */}
          <div className="dashboard-column">
            <CalendarCard events={calendarEvents} isLive={isCalendarLive} />
            <TasksCard />
          </div>

          {/* Right Column: Finance & World */}
          <div className="dashboard-column">
            <ExpenseTrackerCard
              currency={config.currency}
              monthlyBudget={config.monthlyBudget}
            />
            <NewsTickerCard newsArticles={newsArticles} />
          </div>
        </div>

        {/* Bottom Ambient Bar */}
        <footer className="bottom-ambient-bar">
          <div>
            PORTRAIT DISPLAY MODE • 1080×1920 OPTIMIZED • ACTIVE KIOSK
          </div>
          <div>
            AETHER OS • 24×7 TELEMETRY ENGINE
          </div>
        </footer>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </>
  );
}
