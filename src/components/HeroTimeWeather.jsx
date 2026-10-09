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
  SunMedium,
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

  // Day of year and Week number calculation
  const startOfYear = new Date(time.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((time - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
  const weekNum = Math.ceil((dayOfYear + startOfYear.getDay()) / 7);

  // Formatted date
  const dateFormatted = time.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <section className="hero-time-row stark-hero-row" aria-label="Temporal & Atmospheric Telemetry">
      {/* Clock Card // Precision Chrono Telemetry */}
      <div className="dash-card clock-card stark-hud-card">
        <div className="stark-card-corner tl" />
        <div className="stark-card-corner tr" />
        <div className="stark-card-corner bl" />
        <div className="stark-card-corner br" />

        <div className="chrono-upper-section">
          <div className="clock-greeting">
            <span className="pulse-dot stark-dot" />
            <span className="jarvis-tag">SYS-CHRONO //</span>
            <span className="greeting-text">{greeting}, {userName}</span>
            <span className="stark-tag-code ml-auto">[NOMINAL]</span>
          </div>

          <div className="digital-time stark-digital-time">
            <span className="time-digits">{hours12}:{minutes}</span>
            <div className="time-micro-stack">
              <span className="digital-seconds stark-seconds">:{seconds}</span>
              <span className="digital-ampm stark-ampm">{ampm}</span>
            </div>
          </div>
        </div>

        <div className="chrono-lower-section">
          <div className="full-date-row">
            <span className="full-date-display stark-date">{dateFormatted}</span>
            <span className="doy-tag">WK {weekNum} // DOY {dayOfYear}</span>
          </div>

          {/* Stark System Diagnostics Micro-Bar */}
          <div className="stark-diag-strip">
            <span className="diag-item">
              <span className="label">CORE:</span> <span className="val-cyan">100% NOMINAL</span>
            </span>
            <span className="diag-sep">•</span>
            <span className="diag-item">
              <span className="label">NEURAL:</span> <span className="val-gold">SYNCHRONIZED</span>
            </span>
            <span className="diag-sep">•</span>
            <span className="diag-item">
              <span className="label">HUD:</span> <span className="val-emerald">ACTIVE</span>
            </span>
            <span className="diag-sep">•</span>
            <span className="diag-item">
              <span className="label">FREQ:</span> <span className="val-cyan">1000 Hz</span>
            </span>
          </div>
        </div>
      </div>

      {/* Weather Card // Atmospheric Sensor Array */}
      <div className="dash-card weather-card stark-hud-card">
        <div className="stark-card-corner tl" />
        <div className="stark-card-corner tr" />
        <div className="stark-card-corner bl" />
        <div className="stark-card-corner br" />

        <div className="weather-upper-section">
          <div className="weather-header">
            <span className="weather-location stark-location">
              <MapPin size={13} color="var(--accent-cyan)" />
              <span className="loc-text">{weatherData.city || 'Home Base'}</span>
              <span className="loc-coords-tag">12.97°N 77.74°E</span>
            </span>
            <span className="stark-badge">ATMOSPHERIC ARRAY // LIVE METAR</span>
          </div>

          <div className="weather-temp-row">
            <div>
              <div className="weather-big-temp stark-temp">
                {weatherData.temp}°<span className="temp-unit">C</span>
              </div>
              <div className="weather-condition-desc stark-condition">
                {weatherData.condition || 'Mainly Clear'}
              </div>
            </div>
            <div className="weather-icon-hud-container" title={weatherData.condition}>
              <DynamicWeatherIcon iconName={weatherData.iconName} size={32} color="var(--accent-cyan)" />
            </div>
          </div>
        </div>

        <div className="weather-lower-section">
          <div className="weather-stats-grid stark-stats-grid">
            <div className="weather-stat-item stark-stat-box" title={`Thermal / Feels like ${weatherData.feelsLike}°C`}>
              <span className="weather-stat-label">
                <Thermometer size={9} />
                FEELS
              </span>
              <span className="weather-stat-val">{weatherData.feelsLike}°C</span>
            </div>
            <div className="weather-stat-item stark-stat-box" title={`Relative Humidity: ${weatherData.humidity}%`}>
              <span className="weather-stat-label">
                <Droplets size={9} />
                HUMIDITY
              </span>
              <span className="weather-stat-val">{weatherData.humidity}%</span>
            </div>
            <div className="weather-stat-item stark-stat-box" title={`Wind Velocity: ${weatherData.windSpeed} km/h`}>
              <span className="weather-stat-label">
                <Wind size={9} />
                WIND
              </span>
              <span className="weather-stat-val">{weatherData.windSpeed} <span className="stat-unit">km/h</span></span>
            </div>

            {/* UV Index Stat Box */}
            {(() => {
              const uvObj = weatherData.uvIndex || {
                current: 0,
                max: 8.3,
                category: 'LOW',
                color: '#10b981',
                description: 'Low danger (safe exposure)',
              };
              const currentVal = typeof uvObj === 'object' ? (uvObj.current ?? 0) : Number(uvObj) || 0;
              const maxVal = typeof uvObj === 'object' ? uvObj.max : null;
              const category = uvObj.category || (currentVal < 3 ? 'LOW' : currentVal < 6 ? 'MOD' : currentVal < 8 ? 'HIGH' : 'V.HIGH');
              const shortCat = category === 'VERY HIGH' ? 'V.HIGH' : category === 'MODERATE' ? 'MOD' : category;
              const color = uvObj.color || (currentVal < 3 ? '#10b981' : currentVal < 6 ? '#fbbf24' : currentVal < 8 ? '#f97316' : '#ef4444');
              const desc = uvObj.description || `UV Index: ${currentVal} (${category})`;

              return (
                <div
                  className="weather-stat-item stark-stat-box uv-stat-box"
                  style={{
                    borderColor: `${color}44`,
                    background: `linear-gradient(135deg, rgba(10,20,30,0.6), ${color}12)`,
                  }}
                  title={`${desc}${maxVal != null ? ` • Peak today: ${maxVal}` : ''}`}
                >
                  <span className="weather-stat-label" style={{ color: color }}>
                    <SunMedium size={9} />
                    UV ({shortCat})
                  </span>
                  <span className="weather-stat-val" style={{ color: color }}>
                    {currentVal}
                    {maxVal != null && maxVal > 0 && (
                      <span className="stat-micro-sub" title={`Peak: ${maxVal}`}>
                        /{maxVal}
                      </span>
                    )}
                  </span>
                </div>
              );
            })()}

            {/* AQI Stat Box */}
            {(() => {
              const aqiObj = weatherData.aqi || {
                aqi: 65,
                pm25: 14.2,
                category: 'MODERATE',
                color: '#fbbf24',
                description: 'Moderate air quality',
              };
              const rawCat = aqiObj.category || 'MOD';
              const shortCat = rawCat === 'MODERATE' ? 'MOD' : rawCat === 'UNHEALTHY' ? 'UNHL' : rawCat === 'HAZARDOUS' ? 'HAZ' : rawCat;

              return (
                <div
                  className="weather-stat-item stark-stat-box"
                  style={{
                    borderColor: `${aqiObj.color}44`,
                    background: `linear-gradient(135deg, rgba(10,20,30,0.6), ${aqiObj.color}12)`,
                  }}
                  title={`${aqiObj.description} • PM2.5: ${aqiObj.pm25 ?? 'N/A'}`}
                >
                  <span className="weather-stat-label" style={{ color: aqiObj.color }}>
                    <Activity size={9} />
                    AQI ({shortCat})
                  </span>
                  <span className="weather-stat-val" style={{ color: aqiObj.color }}>
                    {aqiObj.aqi}
                    {aqiObj.pm25 != null && (
                      <span className="stat-micro-sub" title={`PM2.5: ${aqiObj.pm25}`}>
                        •{aqiObj.pm25}
                      </span>
                    )}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* 4-Day Forecast Strip */}
          {(() => {
            const forecastList = weatherData.forecast && weatherData.forecast.length > 0
              ? weatherData.forecast
              : [
                  { day: 'Day 1', max: 31, min: 21, icon: 'CloudSun', condition: 'Partly Cloudy' },
                  { day: 'Day 2', max: 30, min: 20, icon: 'Sun', condition: 'Sunny' },
                  { day: 'Day 3', max: 29, min: 20, icon: 'CloudRain', condition: 'Scattered Showers' },
                  { day: 'Day 4', max: 31, min: 22, icon: 'Sun', condition: 'Mainly Clear' },
                ];
            return (
              <div className="mini-forecast-strip stark-forecast-strip">
                {forecastList.slice(0, 4).map((day, idx) => (
                  <div key={idx} className="forecast-day-col stark-forecast-col">
                    <span className="forecast-day-name">{day.day}</span>
                    <DynamicWeatherIcon iconName={day.icon} size={13} color="var(--accent-cyan)" />
                    <span className="forecast-day-temp">{day.max}°</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
