// Aether Dashboard — Live Telemetry
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AmbientBackground from './components/AmbientBackground';
import StarkHudBar from './components/StarkHudBar';
import HeroTimeWeather from './components/HeroTimeWeather';
import CalendarCard from './components/CalendarCard';
import TasksCard from './components/TasksCard';
import ExpenseTrackerCard from './components/ExpenseTrackerCard';
import StarkTacticalDeck from './components/StarkTacticalDeck';

import { DASHBOARD_CONFIG } from './config';
import {
  fetchWeatherData,
  fetchCoordinatesForCity,
  getCachedWeatherData,
} from './services/weatherService';
import { fetchCalendarEvents } from './services/calendarService';
import { fetchGoogleTasks } from './services/tasksService';
import { fetchRssFeed } from './services/rssService';
import { calculateLiveCommute, parseCoordinateString } from './services/commuteService';
import { getInitialSettings, subscribeToSettings } from './services/settingsSyncService';

export default function App() {
  // Centralized dynamic settings synced across Phone, Laptop, and TV
  const [config, setConfig] = useState(() => getInitialSettings());

  const homeCoords = useMemo(() => {
    const candidateStrings = [
      config.homeAddress,
      config.home?.coordinates,
      DASHBOARD_CONFIG.homeAddress,
    ];
    for (const str of candidateStrings) {
      if (str && typeof str === 'string') {
        const parsed = parseCoordinateString(str);
        if (parsed) return parsed;
      }
    }
    return { lat: 12.9712, lon: 77.7359 };
  }, [config.homeAddress, config.home?.coordinates]);

  // Centralized user location state (anchoring Weather, Traffic, & Flight Radar)
  const [userLocation, setUserLocation] = useState(() => ({
    lat: homeCoords?.lat || 12.9716,
    lon: homeCoords?.lon || 77.7473,
    cityName: config.city || config.home?.alias || 'Home',
    isGps: false,
  }));

  // Initialized with cached or modeled weather data so AQI and 4-Day forecast are NEVER missing
  const [weatherData, setWeatherData] = useState(() => getCachedWeatherData());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isTasksSynced, setIsTasksSynced] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [isCalendarLive, setIsCalendarLive] = useState(false);
  const [expenseRefreshTrigger, setExpenseRefreshTrigger] = useState(0);

  // Live Commute & LCD Sleep State
  const [commuteData, setCommuteData] = useState(null);
  const [commuteDirection, setCommuteDirection] = useState('TO_OFFICE');
  const [isSleepAwake, setIsSleepAwake] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Sync URLs from config
  const syncUrl = config.googleSyncUrl || DASHBOARD_CONFIG.googleSyncUrl;
  const effectiveCalendarUrl = syncUrl || config.defaultCalendarUrl || DASHBOARD_CONFIG.defaultCalendarUrl || '';

  // Load weather for location
  const loadWeather = useCallback(async (targetLoc) => {
    try {
      const loc = targetLoc || {
        lat: homeCoords?.lat || 12.9716,
        lon: homeCoords?.lon || 77.7473,
        cityName: config.home?.alias || config.city || 'Home',
      };
      if (loc?.lat && loc?.lon) {
        const data = await fetchWeatherData(loc.lat, loc.lon, config.home?.alias || loc.cityName || 'Home');
        if (data && data.temp != null) {
          setWeatherData(data);
        }
      } else {
        const geo = await fetchCoordinatesForCity(config.home?.alias || config.city || 'Bangalore');
        if (geo) {
          const data = await fetchWeatherData(geo.lat, geo.lon, geo.name);
          if (data && data.temp != null) {
            setWeatherData(data);
          }
        }
      }
    } catch (err) {
      console.warn('Weather load warning:', err);
    }
  }, [homeCoords, config.city, config.home?.alias]);

  // Load live commute between Home and Office
  const loadCommute = useCallback(async (dirOverride) => {
    try {
      const activeDir = dirOverride || commuteDirection;
      const originCoord = config.homeAddress || config.home?.coordinates || '12.971211, 77.735895';
      const destCoord = config.officeAddress || config.work?.coordinates || '12.919583, 77.671528';
      const data = await calculateLiveCommute({
        origin: originCoord,
        originName: config.city || config.home?.alias || 'Home',
        destination: destCoord,
        destinationName: config.officeName || config.work?.alias || 'Office',
        direction: activeDir,
      });
      if (data) setCommuteData(data);
    } catch (err) {
      console.warn('Commute loading failed:', err);
    }
  }, [commuteDirection, config.homeAddress, config.home, config.officeAddress, config.work, config.officeName, config.city]);

  // Toggle direction between Home ➔ Work and Work ➔ Home
  const toggleCommuteDirection = useCallback(() => {
    const next = commuteDirection === 'TO_OFFICE' ? 'TO_HOME' : 'TO_OFFICE';
    setCommuteDirection(next);
    loadCommute(next);
  }, [commuteDirection, loadCommute]);

  // Synchronize location strictly via config coordinates (No browser location prompts)
  const syncLocation = useCallback(() => {
    const coords = homeCoords || { lat: 12.9712, lon: 77.7359 };
    const newLoc = {
      lat: coords.lat,
      lon: coords.lon,
      cityName: config.city || config.home?.alias || DASHBOARD_CONFIG.city || 'Home',
      isGps: false,
    };
    setUserLocation((prev) => {
      if (prev.lat === newLoc.lat && prev.lon === newLoc.lon && prev.cityName === newLoc.cityName) {
        return prev;
      }
      return newLoc;
    });
    loadWeather(newLoc);
  }, [homeCoords, config.city, config.home?.alias, loadWeather]);

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

  // Master refresh function
  const handleRefreshAll = useCallback(() => {
    syncLocation();
    loadCalendar();
    loadTasks();
    loadNews(config.rssUrl);
    loadCommute();
    setExpenseRefreshTrigger(prev => prev + 1);
  }, [syncLocation, loadCalendar, loadTasks, loadNews, loadCommute, config.rssUrl]);

  // Clock ticker for LCD TV Sleep Mode
  useEffect(() => {
    const updateTime = () => setCurrentTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Night Sleep Dimmer check for LCD TV Backlight Longevity
  const isNightSleepActive = useMemo(() => {
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

  // 1. Initial load once on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const root = document.getElementById('dashboard-root');
    if (root) root.scrollTop = 0;

    syncLocation();
    loadCalendar();
    loadTasks();
    loadNews(config.rssUrl);
    loadCommute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Settings Subscription: Listen for remote settings updates & Remote Refresh Trigger
  useEffect(() => {
    const unsubscribe = subscribeToSettings((remoteConfig) => {
      setConfig((prev) => {
        if (remoteConfig.remoteRefreshTrigger && remoteConfig.remoteRefreshTrigger !== prev.remoteRefreshTrigger) {
          console.log('[TV Watchdog] Remote refresh command detected! Triggering full refresh...');
          handleRefreshAll();
        }
        return { ...prev, ...remoteConfig };
      });
    }, 10000);
    return () => unsubscribe && unsubscribe();
  }, [handleRefreshAll]);

  // 3. Network Reconnect Watchdog (Recovers immediately if TV Wi-Fi drops and reconnects)
  useEffect(() => {
    const handleOnline = () => {
      console.log('[TV Watchdog] Network connectivity restored. Syncing all feeds...');
      handleRefreshAll();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [handleRefreshAll]);

  // 4. TV Screen Wake & Visibility Watchdog (Refreshes immediately when screen wakes from standby)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log('[TV Watchdog] TV screen awake/visible. Syncing all feeds...');
        handleRefreshAll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [handleRefreshAll]);

  // 5. Standby Resume / Timer Drift Heartbeat Watchdog
  useEffect(() => {
    let lastHeartbeat = Date.now();
    const heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const diff = now - lastHeartbeat;
      lastHeartbeat = now;
      if (diff > 45000) {
        console.log('[TV Watchdog] Timer drift detected (resumed from standby). Syncing all feeds...');
        handleRefreshAll();
      }
    }, 10000);
    return () => clearInterval(heartbeatTimer);
  }, [handleRefreshAll]);

  // 6. 24x7 Kiosk Memory Flush (Clean auto-reload every 3 hours to prevent Smart TV WebView DOM/memory leaks)
  useEffect(() => {
    const reloadHours = config.tvKioskAutoReloadHours || 3;
    const reloadTimer = setInterval(() => {
      console.log(`[TV Watchdog] 24x7 Kiosk cycle expired (${reloadHours}h). Performing clean TV reload...`);
      window.location.reload();
    }, reloadHours * 60 * 60 * 1000);
    return () => clearInterval(reloadTimer);
  }, [config.tvKioskAutoReloadHours]);

  // 7. Periodic Auto-refresh intervals for 24x7 unattended operation
  useEffect(() => {
    const weatherTimer = setInterval(() => loadWeather(), 5 * 60 * 1000); // 5 mins (was 15m)
    const calendarTimer = setInterval(() => loadCalendar(), 5 * 60 * 1000); // 5 mins (was 10m)
    const tasksTimer = setInterval(() => loadTasks(), 3 * 60 * 1000); // 3 mins (was 5m)
    const newsTimer = setInterval(() => loadNews(config.rssUrl), 15 * 60 * 1000); // 15 mins (was 30m)
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
  }, [loadWeather, loadCalendar, loadTasks, loadNews, loadCommute, config.rssUrl]);

  const rotationClass = config.rotation ? `rotate-${config.rotation}` : '';

  return (
    <>
      <AmbientBackground />

      <main className={`dashboard-viewport ${rotationClass}`} id="dashboard-root">
        {/* Stark Industries Tactical HUD Telemetry Bar */}
        <StarkHudBar
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
          cycleSeconds={config.newsCycleSeconds || 35}
          autoCycle={config.autoCycleSlides ?? true}
          userLocation={userLocation}
          commuteData={commuteData}
          onToggleCommuteDirection={toggleCommuteDirection}
        />

        {/* Operations Command Deck: Left (Calendar + Expense) | Right (Tasks) */}
        <div className="dashboard-operations-row">
          {/* Left Column: Agenda (Next 5 Events) + Treasury (Below Calendar) */}
          <div className="operations-col-left">
            <CalendarCard events={calendarEvents} isLive={isCalendarLive} />
            <ExpenseTrackerCard
              currency={config.currency}
              apiUrl={config.expenseTrackerApiUrl}
              secret={config.expenseTrackerSecret}
              refreshTrigger={expenseRefreshTrigger}
            />
          </div>

          {/* Right Column: Directives & Tasks */}
          <div className="operations-col-right">
            <TasksCard
              tasks={tasks}
              isSynced={isTasksSynced}
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
    </>
  );
}
