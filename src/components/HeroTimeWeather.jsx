import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudLightning,
  CloudSnow,
  CloudFog,
  MapPin,
  Droplets,
  Wind,
  Thermometer,
  Activity,
} from 'lucide-react';

const ICON_MAP = {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudLightning,
  CloudSnow,
  CloudFog,
};

function DynamicWeatherIcon({ iconName, size = 32, color = 'var(--accent-cyan)' }) {
  const IconComponent = ICON_MAP[iconName] || CloudSun;
  return <IconComponent size={size} color={color} />;
}

export default function HeroTimeWeather({ weatherData, userName = 'Shyam' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Hours & Minutes
  const hoursRaw = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const hours12 = (hoursRaw % 12 || 12).toString().padStart(2, '0');
  const ampm = hoursRaw >= 12 ? 'PM' : 'AM';

  // Greeting logic
  let greeting = 'Good evening';
  if (hoursRaw >= 5 && hoursRaw < 12) greeting = 'Good morning';
  else if (hoursRaw >= 12 && hoursRaw < 17) greeting = 'Good afternoon';
  else if (hoursRaw >= 22 || hoursRaw < 5) greeting = 'Good night';

  // Formatted date
  const dateFormatted = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="hero-time-row stark-hero-row" aria-label="Stark Chrono & Atmospheric Telemetry">
      {/* Clock Card // Stark Chrono Telemetry */}
      <div className="dash-card clock-card stark-hud-card">
        <div className="stark-card-corner tl" />
        <div className="stark-card-corner tr" />
        <div className="stark-card-corner bl" />
        <div className="stark-card-corner br" />

        <div>
          <div className="clock-greeting">
            <span className="pulse-dot stark-dot" />
            <span className="jarvis-tag">J.A.R.V.I.S. //</span> {greeting}, {userName}
          </div>

          <div className="digital-time stark-digital-time">
            <span className="time-digits">{hours12}:{minutes}</span>
            <span className="digital-seconds stark-seconds">{seconds}</span>
            <span className="digital-ampm stark-ampm">{ampm}</span>
          </div>
        </div>

        <div>
          <div className="full-date-display stark-date">
            {dateFormatted}
          </div>

          {/* Stark System Diagnostics Micro-Bar */}
          <div className="stark-diag-strip">
            <span className="diag-item"><span className="label">ARC CORE:</span> <span className="val-cyan">100% NOMINAL</span></span>
            <span className="diag-sep">•</span>
            <span className="diag-item"><span className="label">NEURAL LINK:</span> <span className="val-gold">SYNCHRONIZED</span></span>
            <span className="diag-sep">•</span>
            <span className="diag-item"><span className="label">HUD PROTOCOL:</span> <span className="val-emerald">ACTIVE</span></span>
          </div>
        </div>
      </div>

      {/* Weather Card // Atmospheric Sensor Array */}
      <div className="dash-card weather-card stark-hud-card">
        <div className="stark-card-corner tl" />
        <div className="stark-card-corner tr" />
        <div className="stark-card-corner bl" />
        <div className="stark-card-corner br" />

        <div>
          <div className="weather-header">
            <span className="weather-location stark-location">
              <MapPin size={14} color="var(--accent-cyan)" />
              <span className="loc-text">{weatherData.city || 'Your Location'}</span>
            </span>
            <span className="stark-badge">ATMOSPHERIC ARRAY // LIVE</span>
          </div>

          <div className="weather-temp-row">
            <div>
              <div className="weather-big-temp stark-temp">{weatherData.temp}°<span className="temp-unit">C</span></div>
              <div className="weather-condition-desc stark-condition">{weatherData.condition}</div>
            </div>
            <div className="weather-icon-hud-container">
              <DynamicWeatherIcon iconName={weatherData.iconName} size={46} color="var(--accent-cyan)" />
            </div>
          </div>
        </div>

        <div>
          <div className="weather-stats-grid stark-stats-grid">
            <div className="weather-stat-item stark-stat-box">
              <span className="weather-stat-label">
                <Thermometer size={11} style={{ display: 'inline', marginRight: 3 }} />
                THERMAL
              </span>
              <span className="weather-stat-val">{weatherData.feelsLike}°C</span>
            </div>
            <div className="weather-stat-item stark-stat-box">
              <span className="weather-stat-label">
                <Droplets size={11} style={{ display: 'inline', marginRight: 3 }} />
                HUMIDITY
              </span>
              <span className="weather-stat-val">{weatherData.humidity}%</span>
            </div>
            <div className="weather-stat-item stark-stat-box">
              <span className="weather-stat-label">
                <Wind size={11} style={{ display: 'inline', marginRight: 3 }} />
                DOPPLER WIND
              </span>
              <span className="weather-stat-val">{weatherData.windSpeed} km/h</span>
            </div>
            {weatherData.aqi && (
              <div
                className="weather-stat-item stark-stat-box"
                style={{
                  borderColor: `${weatherData.aqi.color}44`,
                  background: `linear-gradient(135deg, rgba(10,20,30,0.6), ${weatherData.aqi.color}12)`,
                }}
                title={weatherData.aqi.description}
              >
                <span className="weather-stat-label" style={{ color: weatherData.aqi.color }}>
                  <Activity size={11} style={{ display: 'inline', marginRight: 3 }} />
                  AQI ({weatherData.aqi.category})
                </span>
                <span className="weather-stat-val" style={{ color: weatherData.aqi.color, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span>{weatherData.aqi.aqi}</span>
                  {weatherData.aqi.pm25 != null && (
                    <span style={{ fontSize: 9.5, opacity: 0.85, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                      PM2.5 {weatherData.aqi.pm25}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* 4-Day Forecast Strip */}
          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <div className="mini-forecast-strip stark-forecast-strip">
              {weatherData.forecast.map((day, idx) => (
                <div key={idx} className="forecast-day-col stark-forecast-col">
                  <span className="forecast-day-name">{day.day}</span>
                  <DynamicWeatherIcon iconName={day.icon} size={18} color="var(--accent-cyan)" />
                  <span className="forecast-day-temp">{day.max}°</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
