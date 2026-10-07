// Open-Meteo Free Weather Service (No API key needed)

export const WMO_WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: 'Sun' },
  1: { label: 'Mainly Clear', icon: 'Sun' },
  2: { label: 'Partly Cloudy', icon: 'CloudSun' },
  3: { label: 'Overcast', icon: 'Cloud' },
  45: { label: 'Foggy', icon: 'CloudFog' },
  48: { label: 'Depositing Rime Fog', icon: 'CloudFog' },
  51: { label: 'Light Drizzle', icon: 'CloudDrizzle' },
  53: { label: 'Moderate Drizzle', icon: 'CloudDrizzle' },
  55: { label: 'Dense Drizzle', icon: 'CloudDrizzle' },
  61: { label: 'Slight Rain', icon: 'CloudRain' },
  63: { label: 'Moderate Rain', icon: 'CloudRain' },
  65: { label: 'Heavy Rain', icon: 'CloudRainWind' },
  71: { label: 'Slight Snow', icon: 'CloudSnow' },
  73: { label: 'Moderate Snow', icon: 'CloudSnow' },
  75: { label: 'Heavy Snow', icon: 'CloudSnow' },
  77: { label: 'Snow Grains', icon: 'CloudSnow' },
  80: { label: 'Slight Rain Showers', icon: 'CloudRain' },
  81: { label: 'Moderate Showers', icon: 'CloudRain' },
  82: { label: 'Violent Showers', icon: 'CloudRainWind' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning' },
  96: { label: 'Thunderstorm with Hail', icon: 'CloudLightning' },
  99: { label: 'Severe Thunderstorm', icon: 'CloudLightning' },
};

export async function fetchCoordinatesForCity(city) {
  if (!city) return null;
  const clean = city.trim();

  // Direct coordinate match (e.g. "12.9716, 77.5946" or "12.9716,77.5946")
  const coordMatch = clean.match(/^([-+]?[0-9]*\.?[0-9]+)\s*,\s*([-+]?[0-9]*\.?[0-9]+)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return {
        name: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
        country: '',
        lat,
        lon,
      };
    }
  }

  const lower = clean.toLowerCase();

  // Known neighborhood shortcut for Whitefield, Bangalore
  if (lower.includes('whitefield')) {
    return {
      name: 'Whitefield',
      country: 'IN',
      lat: 12.9716,
      lon: 77.7473,
    };
  }

  if (lower.includes('bangalore') || lower.includes('bengaluru')) {
    return {
      name: 'Bangalore',
      country: 'IN',
      lat: 12.9716,
      lon: 77.5946,
    };
  }

  try {
    const searchName = clean.includes(',') ? clean.split(',')[0].trim() : clean.trim();
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=5&language=en&format=json`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const top = data.results[0];
      return {
        name: top.name,
        country: top.country_code || top.country,
        lat: top.latitude,
        lon: top.longitude,
      };
    }
  } catch (err) {
    console.warn('Geocoding error:', err);
  }
  return null;
}

export async function reverseGeocodeCoordinates(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: { 'User-Agent': 'HomeDashboardApp/1.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.city || addr.town || addr.village;
      const stateOrCity = addr.city || addr.county || addr.state_district || addr.state || '';
      if (locality && stateOrCity && locality !== stateOrCity) {
        return `${locality}, ${stateOrCity}`;
      }
      if (locality) return locality;
      if (stateOrCity) return stateOrCity;
      if (data.display_name) return data.display_name.split(',').slice(0, 2).join(',').trim();
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }
  return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
}

export async function fetchWeatherData(lat = 12.9716, lon = 77.7473, cityName = 'Your Location') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();

    const curr = data.current || {};
    const code = curr.weather_code ?? 0;
    const weatherInfo = WMO_WEATHER_CODES[code] || { label: 'Clear', icon: 'Sun' };

    // Process 4-day forecast
    const daily = data.daily || {};
    const forecast = [];
    if (daily.time) {
      for (let i = 1; i < Math.min(daily.time.length, 5); i++) {
        const d = new Date(daily.time[i]);
        const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
        const dCode = daily.weather_code ? daily.weather_code[i] : 0;
        const dInfo = WMO_WEATHER_CODES[dCode] || { label: 'Clear', icon: 'Sun' };
        forecast.push({
          day: dayName,
          max: Math.round(daily.temperature_2m_max[i]),
          min: Math.round(daily.temperature_2m_min[i]),
          icon: dInfo.icon,
          condition: dInfo.label,
        });
      }
    }

    return {
      city: cityName,
      temp: Math.round(curr.temperature_2m ?? 28),
      feelsLike: Math.round(curr.apparent_temperature ?? 30),
      humidity: Math.round(curr.relative_humidity_2m ?? 65),
      windSpeed: Math.round(curr.wind_speed_10m ?? 12),
      isDay: curr.is_day === 1,
      condition: weatherInfo.label,
      iconName: weatherInfo.icon,
      forecast,
    };
  } catch (err) {
    console.error('Weather error:', err);
    // Return high quality fallback data
    return {
      city: cityName || 'Home',
      temp: 28,
      feelsLike: 31,
      humidity: 68,
      windSpeed: 14,
      isDay: true,
      condition: 'Partly Cloudy',
      iconName: 'CloudSun',
      forecast: [
        { day: 'Thu', max: 32, min: 25, icon: 'Sun', condition: 'Sunny' },
        { day: 'Fri', max: 31, min: 24, icon: 'CloudSun', condition: 'Partly Cloudy' },
        { day: 'Sat', max: 29, min: 23, icon: 'CloudRain', condition: 'Scattered Rain' },
        { day: 'Sun', max: 30, min: 24, icon: 'Sun', condition: 'Sunny' },
      ],
    };
  }
}
