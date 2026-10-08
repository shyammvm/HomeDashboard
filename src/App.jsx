import React, { useState, useEffect, useCallback } from 'react';
import AmbientBackground from './components/AmbientBackground';
import StarkHudBar from './components/StarkHudBar';
import HeroTimeWeather from './components/HeroTimeWeather';
import CalendarCard from './components/CalendarCard';
import TasksCard from './components/TasksCard';
import ExpenseTrackerCard from './components/ExpenseTrackerCard';
import StarkTacticalDeck from './components/StarkTacticalDeck';
import SettingsModal from './components/SettingsModal';
import RemoteControlModal from './components/RemoteControlModal';
import RemoteSettingsView from './components/RemoteSettingsView';

import { DASHBOARD_CONFIG } from './config';
import {
  fetchWeatherData,
  fetchCoordinatesForCity,
  reverseGeocodeCoordinates,
} from './services/weatherService';
import { fetchCalendarEvents } from './services/calendarService';
import { fetchGoogleTasks } from './services/tasksService';
import { fetchRssFeed } from './services/rssService';
import { calculateLiveCommute } from './services/commuteService';
import {
  getInitialSettings,
  saveAndBroadcastSettings,
  subscribeToSettings,
  hasConfigChanges,
  DEFAULT_CONFIG,
} from './services/settingsSyncService';

export default function App() {
  const [config, setConfig] = useState(() => getInitialSettings());

  // Check if browser was opened in Remote Control / Settings mode (e.g. from Phone scanning TV QR code)
  const [isRemoteView, setIsRemoteView] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('remote') === '1' ||
      params.get('settings') === '1' ||
      window.location.hash === '#/remote' ||
      window.location.hash === '#/settings'
    );
  });

  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);
  const [remoteSyncToast, setRemoteSyncToast] = useState(null);

  // Centralized user location state (anchoring Weather, Traffic, & Flight Radar)
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('aether_user_location');
      if (saved) return JSON.parse(saved);
    } catch { }
    return {
      lat: 12.9716,
      lon: 77.7473,
      cityName: config?.city || 'Your Location',
      isGps: false,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weatherData, setWeatherData] = useState({
    city: userLocation?.cityName || config.city,
    temp: 29,
    feelsLike: 32,
    humidity: 68,
    windSpeed: 14,
    condition: 'Mainly Clear',
    iconName: 'Sun',
    forecast: [],
  });
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isTasksSynced, setIsTasksSynced] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [isCalendarLive, setIsCalendarLive] = useState(false);
  const [expenseRefreshTrigger, setExpenseRefreshTrigger] = useState(0);

  // Live Commute & LCD Sleep State
  const [commuteData, setCommuteData] = useState(null);
  const [commuteDirection] = useState('TO_OFFICE');
  const [isSleepAwake, setIsSleepAwake] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Sync URLs from config
  const syncUrl = DASHBOARD_CONFIG.googleSyncUrl;
  const effectiveCalendarUrl = syncUrl || DASHBOARD_CONFIG.defaultCalendarUrl || '';

  // Load weather for location
  const loadWeather = useCallback(async (targetLoc) => {
    const loc = targetLoc || userLocation;
    if (loc?.lat && loc?.lon) {
      const data = await fetchWeatherData(loc.lat, loc.lon, loc.cityName || config.city);
      setWeatherData(data);
    } else {
      const geo = await fetchCoordinatesForCity(config.city);
      if (geo) {
        const data = await fetchWeatherData(geo.lat, geo.lon, geo.name);
        setWeatherData(data);
      }
    }
  }, [userLocation, config.city]);

  // Load live commute between Home and Office
  const loadCommute = useCallback(async (dirOverride) => {
    try {
      const activeDir = dirOverride || commuteDirection;
      const data = await calculateLiveCommute({
        origin: config.homeAddress || userLocation,
        destination: config.officeAddress || 'RMZ Ecoworld, Bellandur, Bangalore',
        destinationName: config.officeName || 'Work / Office',
        direction: activeDir,
      });
      if (data) setCommuteData(data);
    } catch (err) {
      console.warn('Commute loading failed:', err);
    }
  }, [config.homeAddress, config.officeAddress, config.officeName, userLocation, commuteDirection]);

  // Synchronize location via GPS or configured city / coordinates
  const syncLocation = useCallback(async (overrideCity) => {
    if (overrideCity) {
      const geo = await fetchCoordinatesForCity(overrideCity);
      if (geo) {
        let cityName = geo.name;
        // If coordinate numbers, try reverse geocode to get human-friendly locality name
        if (/^[-+]?[0-9]/.test(cityName)) {
          const rev = await reverseGeocodeCoordinates(geo.lat, geo.lon);
          if (rev) cityName = rev;
        }
        const newLoc = { lat: geo.lat, lon: geo.lon, cityName, isGps: false };
        setUserLocation(newLoc);
        localStorage.setItem('aether_user_location', JSON.stringify(newLoc));
        loadWeather(newLoc);
        return;
      }
    }

    // Attempt browser GPS geolocation
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          let cityName = await reverseGeocodeCoordinates(lat, lon);
          if (!cityName) cityName = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
          const newLoc = { lat, lon, cityName, isGps: true };
          setUserLocation(newLoc);
          localStorage.setItem('aether_user_location', JSON.stringify(newLoc));
          loadWeather(newLoc);
        },
        async () => {
          // Geolocation denied or unavailable: fall back to configured city
          const geo = await fetchCoordinatesForCity(config.city);
          if (geo) {
            const newLoc = { lat: geo.lat, lon: geo.lon, cityName: geo.name, isGps: false };
            setUserLocation(newLoc);
            localStorage.setItem('aether_user_location', JSON.stringify(newLoc));
            loadWeather(newLoc);
          }
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 300000 }
      );
    } else {
      const geo = await fetchCoordinatesForCity(config.city);
      if (geo) {
        const newLoc = { lat: geo.lat, lon: geo.lon, cityName: geo.name, isGps: false };
        setUserLocation(newLoc);
        localStorage.setItem('aether_user_location', JSON.stringify(newLoc));
        loadWeather(newLoc);
      }
    }
  }, [config.city, loadWeather]);

  // Load calendar
  const loadCalendar = useCallback(async () => {
    const events = await fetchCalendarEvents(effectiveCalendarUrl);
    setCalendarEvents(events);
    setIsCalendarLive(Boolean(effectiveCalendarUrl));
  }, [effectiveCalendarUrl]);

  // Load Google tasks
  const loadTasks = useCallback(async () => {
    const result = await fetchGoogleTasks(syncUrl);
    setTasks(result.tasks);
    setIsTasksSynced(result.isSynced);
  }, [syncUrl]);

  // Load news
  const loadNews = useCallback(async (feedUrl) => {
    const articles = await fetchRssFeed(feedUrl || config.rssUrl);
    setNewsArticles(articles);
  }, [config.rssUrl]);

  // Clock ticker for LCD TV Sleep Mode
  useEffect(() => {
    const updateTime = () => setCurrentTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Night Sleep Dimmer check for LCD TV Backlight Longevity
  const isNightSleepActive = React.useMemo(() => {
    if (!config.lcdSleepMode || isSleepAwake) return false;
    try {
      const now = new Date();
      const curMins = now.getHours() * 60 + now.getMinutes();
      const [sH, sM] = (config.lcdSleepStart || '23:30').split(':').map(Number);
      const [eH, eM] = (config.lcdSleepEnd || '06:30').split(':').map(Number);
      const startMins = sH * 60 + sM;
      const endMins = eH * 60 + eM;
      if (startMins <= endMins) {
        return curMins >= startMins && curMins < endMins;
      } else {
        return curMins >= startMins || curMins < endMins;
      }
    } catch {
      return false;
    }
  }, [config.lcdSleepMode, config.lcdSleepStart, config.lcdSleepEnd, isSleepAwake, currentTimeStr]);

  // Initial load
  useEffect(() => {
    syncLocation();
    loadCalendar();
    loadTasks();
    loadNews(config.rssUrl);
    loadCommute();
  }, [syncLocation, loadCalendar, loadTasks, loadNews, loadCommute, config.rssUrl]);

  // Periodic Auto-refresh intervals for 24x7 unattended operation
  useEffect(() => {
    const weatherTimer = setInterval(() => loadWeather(userLocation), 15 * 60 * 1000); // 15 mins
    const calendarTimer = setInterval(() => loadCalendar(), 10 * 60 * 1000); // 10 mins
    const tasksTimer = setInterval(() => loadTasks(), 5 * 60 * 1000); // 5 mins
    const newsTimer = setInterval(() => loadNews(config.rssUrl), 30 * 60 * 1000); // 30 mins
    const expenseTimer = setInterval(() => setExpenseRefreshTrigger(prev => prev + 1), 3 * 60 * 1000); // 3 mins
    const commuteTimer = setInterval(() => loadCommute(), 3 * 60 * 1000); // 3 mins

    return () => {
      clearInterval(weatherTimer);
      clearInterval(calendarTimer);
      clearInterval(tasksTimer);
      clearInterval(newsTimer);
      clearInterval(expenseTimer);
      clearInterval(commuteTimer);
    };
  }, [userLocation, config.rssUrl, loadWeather, loadCalendar, loadTasks, loadNews, loadCommute]);

  const handleRefreshAll = useCallback(() => {
    syncLocation();
    loadCalendar();
    loadTasks();
    loadNews(config.rssUrl);
    setExpenseRefreshTrigger(prev => prev + 1);
  }, [syncLocation, loadCalendar, loadTasks, loadNews, config.rssUrl]);

  // Centralized Settings Sync Subscription: Real-time listener for settings saved from Phone or Laptop
  useEffect(() => {
    const unsubscribe = subscribeToSettings((remoteConfig, source) => {
      setConfig((prev) => {
        if (hasConfigChanges(prev, remoteConfig)) {
          // Visual notification on the TV screen
          setRemoteSyncToast(`✦ SETTINGS SYNCED: UPDATED FROM ${source.toUpperCase()}`);
          setTimeout(() => setRemoteSyncToast(null), 4500);

          // If location changed, re-sync location and weather
          if (remoteConfig.homeAddress !== prev.homeAddress || remoteConfig.city !== prev.city) {
            syncLocation(remoteConfig.homeAddress || remoteConfig.city);
          }
          // If RSS changed, re-fetch news
          if (remoteConfig.rssUrl !== prev.rssUrl) {
            loadNews(remoteConfig.rssUrl);
          }
          // If commute changed, re-calculate commute
          if (remoteConfig.officeAddress !== prev.officeAddress || remoteConfig.homeAddress !== prev.homeAddress) {
            loadCommute();
          }
          // Refresh expenses
          setExpenseRefreshTrigger(prevTrig => prevTrig + 1);

          return remoteConfig;
        }

        // If remote refresh trigger changed (forced refresh from remote phone)
        if (remoteConfig.remoteRefreshTrigger && remoteConfig.remoteRefreshTrigger !== prev.remoteRefreshTrigger) {
          setRemoteSyncToast('⚡ REMOTE REFRESH COMMAND RECEIVED');
          setTimeout(() => setRemoteSyncToast(null), 3000);
          handleRefreshAll();
          return remoteConfig;
        }

        return prev;
      });
    }, 12000); // Check every 12 seconds

    return unsubscribe;
  }, [syncLocation, loadNews, loadCommute, handleRefreshAll]);

  // Save config and broadcast to all connected displays
  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    await saveAndBroadcastSettings(newConfig, 'Dashboard Config');
    if (newConfig.city !== config.city || newConfig.homeAddress !== config.homeAddress) {
      syncLocation(newConfig.homeAddress || newConfig.city);
    }
    if (newConfig.rssUrl !== config.rssUrl) loadNews(newConfig.rssUrl);
    setExpenseRefreshTrigger(prev => prev + 1);
    loadCommute();
  };

  // If opened in Phone / Laptop Remote Mode, render the dedicated settings view
  if (isRemoteView) {
    return (
      <RemoteSettingsView
        initialConfig={config}
        onBackToDashboard={() => {
          setIsRemoteView(false);
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  const rotationClass = config.rotation ? `rotate-${config.rotation}` : '';

  return (
    <>
      <AmbientBackground />

      {/* Real-time Remote Sync HUD Toast for TV Display */}
      {remoteSyncToast && (
        <div className="stark-remote-toast-overlay" role="status">
          <div className="stark-remote-toast-badge">
            <span className="pulse-dot" style={{ backgroundColor: 'var(--stark-cyan)', width: 8, height: 8 }} />
            <span>{remoteSyncToast}</span>
          </div>
        </div>
      )}

      <main className={`dashboard-viewport ${rotationClass}`} id="dashboard-root">
        {/* Stark Industries Tactical HUD Telemetry Bar */}
        <StarkHudBar
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenRemote={() => setIsRemoteModalOpen(true)}
          onRefreshAll={handleRefreshAll}
          userName={config.userName}
        />

        {/* Hero Clock & Live Weather (anchored to user's location) */}
        <HeroTimeWeather
          weatherData={weatherData}
          userName={config.userName}
        />

        {/* Full-Width Tactical Console (Radar, Normal Google Traffic Map & News Looping Slides) */}
        <StarkTacticalDeck
          newsArticles={newsArticles}
          cycleSeconds={config.newsCycleSeconds || 16}
          userLocation={userLocation}
          commuteData={commuteData}
        />

        {/* 2-Column Split: Schedule & Tasks on Left | Expenses on Right */}
        <div className="dashboard-grid-main">
          {/* Left Column: Agenda & Focus */}
          <div className="dashboard-column">
            <CalendarCard events={calendarEvents} isLive={isCalendarLive} />
            <TasksCard
              tasks={tasks}
              isSynced={isTasksSynced}
            />
          </div>

          {/* Right Column: Finance */}
          <div className="dashboard-column">
            <ExpenseTrackerCard
              currency={config.currency}
              apiUrl={config.expenseTrackerApiUrl}
              secret={config.expenseTrackerSecret}
              refreshTrigger={expenseRefreshTrigger}
            />
          </div>
        </div>
      </main>

      {/* LCD TV Standby & Night Sleep Dimmer */}
      {isNightSleepActive && (
        <div
          className="lcd-sleep-overlay"
          onClick={() => setIsSleepAwake(true)}
          role="button"
          tabIndex={0}
          title="Click or touch screen to wake"
        >
          <div className="lcd-sleep-content">
            <div className="lcd-sleep-clock">{currentTimeStr}</div>
            <div className="lcd-sleep-sub">LCD TV STANDBY // NIGHT BACKLIGHT DIMMER ACTIVE</div>
            <div className="lcd-sleep-hint">CLICK OR TOUCH SCREEN TO WAKE</div>
          </div>
        </div>
      )}

      {/* Remote Control Modal (QR Code & Phone Link) */}
      <RemoteControlModal
        isOpen={isRemoteModalOpen}
        onClose={() => setIsRemoteModalOpen(false)}
        onOpenLocalSettings={() => {
          setIsRemoteModalOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {/* Settings Modal (Local Device Settings) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onOpenRemoteModal={() => {
          setIsSettingsOpen(false);
          setIsRemoteModalOpen(true);
        }}
      />
    </>
  );
}
