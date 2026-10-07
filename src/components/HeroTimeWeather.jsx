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
    <section className="hero-time-row" aria-label="Clock and Weather">
      {/* Clock Card */}
      <div className="dash-card clock-card">
        <div>
          <div className="clock-greeting">
            <span className="pulse-dot" style={{ backgroundColor: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }} />
            {greeting}, {userName}
          </div>

          <div className="digital-time">
            <span>{hours12}:{minutes}</span>
            <span className="digital-seconds">{seconds}</span>
            <span className="digital-ampm">{ampm}</span>
          </div>
        </div>

        <div className="full-date-display">
          {dateFormatted}
        </div>
      </div>

      {/* Weather Card */}
      <div className="dash-card weather-card">
        <div>
          <div className="weather-header">
            <span className="weather-location">
              <MapPin size={15} color="var(--accent-cyan)" />
              {weatherData.city || 'Chennai'}
            </span>
            <span className="card-badge" style={{ color: 'var(--accent-cyan)' }}>LIVE METEO</span>
          </div>

          <div className="weather-temp-row">
            <div>
              <div className="weather-big-temp">{weatherData.temp}°C</div>
              <div className="weather-condition-desc">{weatherData.condition}</div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '16px' }}>
              <DynamicWeatherIcon iconName={weatherData.iconName} size={46} color="var(--accent-cyan)" />
            </div>
          </div>
        </div>

        <div>
          <div className="weather-stats-grid">
            <div className="weather-stat-item">
              <span className="weather-stat-label">
                <Thermometer size={11} style={{ display: 'inline', marginRight: 3 }} />
                Feels Like
              </span>
              <span className="weather-stat-val">{weatherData.feelsLike}°C</span>
            </div>
            <div className="weather-stat-item">
              <span className="weather-stat-label">
                <Droplets size={11} style={{ display: 'inline', marginRight: 3 }} />
                Humidity
              </span>
              <span className="weather-stat-val">{weatherData.humidity}%</span>
            </div>
            <div className="weather-stat-item">
              <span className="weather-stat-label">
                <Wind size={11} style={{ display: 'inline', marginRight: 3 }} />
                Wind
              </span>
              <span className="weather-stat-val">{weatherData.windSpeed} km/h</span>
            </div>
          </div>

          {/* 4-Day Forecast Strip */}
          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <div className="mini-forecast-strip">
              {weatherData.forecast.map((day, idx) => (
                <div key={idx} className="forecast-day-col">
                  <span className="forecast-day-name">{day.day}</span>
                  <DynamicWeatherIcon iconName={day.icon} size={18} color="var(--text-muted)" />
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
