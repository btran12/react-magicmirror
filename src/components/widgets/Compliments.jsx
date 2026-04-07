import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Widget } from '../Widget';

const DEFAULT_CONFIG_URL = `${import.meta.env.BASE_URL}compliments.json`;
const MESSAGE_ROTATION_MS = 30 * 1000;
const FADE_DURATION_MS = 1000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const EMPTY_CONFIG = {
  fallback: [],
  timeOfDay: {},
  weather: {},
};

const getTimeBucket = (date = new Date()) => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

const normalizeCondition = (main = '', windSpeed = 0, tempKelvin = 273.15) => {
  const value = String(main).toLowerCase();
  
  // Convert temperature from Kelvin to Celsius for easier comparison
  const tempCelsius = tempKelvin - 273.15;
  
  // Check for precipitation that could create icy conditions
  const isPrecipitation = value.includes('rain') || value.includes('drizzle') || value.includes('snow');
  const isBelowFreezing = tempCelsius < 0;
  
  // Determine weather conditions in priority order
  // Icy: precipitation + below freezing OR below -5°C
  if ((isPrecipitation && isBelowFreezing) || tempCelsius < -5) {
    return 'icy';
  }
  
  // Hot: above 28°C (82°F) and not snowing
  if (tempCelsius > 28 && !value.includes('snow')) {
    return 'hot';
  }
  
  // Cold: below 0°C (32°F) and not precipitation (precipitation handled above as icy)
  if (tempCelsius < 0 && !isPrecipitation) {
    return 'cold';
  }
  
  // Windy: wind speed above 15 m/s (54 km/h, 33 mph)
  if (windSpeed > 15) {
    return 'windy';
  }
  
  // Calm: wind speed below 3 m/s (11 km/h, 7 mph) and clear/cloudy
  if (windSpeed < 3 && (value.includes('clear') || value.includes('cloud'))) {
    return 'calm';
  }

  // Standard OpenWeatherMap conditions
  if (value.includes('thunder')) return 'thunderstorm';
  if (value.includes('drizzle')) return 'drizzle';
  if (value.includes('rain')) return 'rain';
  if (value.includes('snow')) return 'snow';
  if (value.includes('mist') || value.includes('fog') || value.includes('haze')) return 'mist';
  if (value.includes('cloud')) return 'clouds';
  if (value.includes('clear')) return 'clear';
  return 'default';
};

const dedupeMessages = (messages) => [...new Set(messages.filter(Boolean))];

const resolveConfigUrl = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_CONFIG_URL;

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('//')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${trimmed.replace(/^\/+/, '')}`;
  }

  return trimmed;
};

export const Compliments = ({
  configUrl,
  weatherApiKey,
  location,
  pollIntervalMinutes = 60,
  showFade = false,
}) => {
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [weatherCondition, setWeatherCondition] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const sourceUrl = resolveConfigUrl(configUrl);
  const timeBucket = getTimeBucket();
  const pollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;

  useEffect(() => {
    const parseConfig = (data) => ({
      fallback: Array.isArray(data?.fallback) ? data.fallback : [],
      timeOfDay: data?.timeOfDay && typeof data.timeOfDay === 'object' ? data.timeOfDay : {},
      weather: data?.weather && typeof data.weather === 'object' ? data.weather : {},
    });

    const loadConfigFromUrl = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch compliments config (${response.status})`);
      }
      const data = await response.json();
      return parseConfig(data);
    };

    const fetchConfig = async () => {
      try {
        const nextConfig = await loadConfigFromUrl(sourceUrl);
        setConfig(nextConfig);
        setError(null);
      } catch (primaryError) {
        if (sourceUrl !== DEFAULT_CONFIG_URL) {
          try {
            const fallbackConfig = await loadConfigFromUrl(DEFAULT_CONFIG_URL);
            setConfig(fallbackConfig);
            setError(null);
            return;
          } catch (fallbackError) {
            setError(fallbackError.message || 'Failed to load compliments config');
            setConfig(EMPTY_CONFIG);
            return;
          }
        }

        setError(primaryError.message || 'Failed to load compliments config');
        setConfig(EMPTY_CONFIG);
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs, sourceUrl]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!weatherApiKey || !location) {
        setWeatherCondition('default');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${weatherApiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch weather (${response.status})`);
        }

        const weatherData = await response.json();
        const mainCondition = weatherData?.weather?.[0]?.main || 'default';
        const windSpeed = weatherData?.wind?.speed || 0;
        const tempKelvin = weatherData?.main?.temp || 273.15;
        
        setWeatherCondition(normalizeCondition(mainCondition, windSpeed, tempKelvin));
        setError(null);
      } catch (err) {
        setWeatherCondition('default');
        setError((prev) => prev || err.message || 'Failed to fetch weather for compliments');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, pollIntervalMs);
    return () => clearInterval(interval);
  }, [location, pollIntervalMs, weatherApiKey]);

  const messages = useMemo(() => {
    const timeMessages = Array.isArray(config.timeOfDay?.[timeBucket]) ? config.timeOfDay[timeBucket] : [];
    const weatherMessages = Array.isArray(config.weather?.[weatherCondition])
      ? config.weather[weatherCondition]
      : Array.isArray(config.weather?.default)
        ? config.weather.default
        : [];
    const fallbackMessages = Array.isArray(config.fallback) ? config.fallback : [];

    const merged = dedupeMessages([...timeMessages, ...weatherMessages, ...fallbackMessages]);
    return merged.length > 0 ? merged : ['You are doing great.'];
  }, [config, timeBucket, weatherCondition]);

  useEffect(() => {
    if (messages.length <= 1) {
      setCurrentIndex(0);
      setIsFading(false);
      return;
    }

    let fadeTimeoutId;

    const intervalId = setInterval(() => {
      setIsFading(true);

      fadeTimeoutId = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setIsFading(false);
      }, FADE_DURATION_MS);
    }, MESSAGE_ROTATION_MS);

    return () => {
      clearInterval(intervalId);
      clearTimeout(fadeTimeoutId);
    };
  }, [messages]);

  const activeMessage = messages[currentIndex] || messages[0];

  return (
    <Widget widgetType="compliments" showFade={showFade}>
      <Stack sx={{ height: '100%', justifyContent: 'center', textAlign: 'center' }} spacing={2}>

        <Typography
          sx={{
            fontSize: 'clamp(1.2rem, 2vw, 2rem)',
            color: '#ffffff',
            fontWeight: 300,
            lineHeight: 1.3,
            fontFamily: 'var(--font-family, monospace)',
            opacity: isFading ? 0 : 1,
            transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
          }}
        >
          {activeMessage}
        </Typography>

        {loading && <Typography sx={{ color: '#888888', fontSize: '0.75rem' }}>Refreshing context...</Typography>}
        {error && <Typography sx={{ color: '#ff6b6b', fontSize: '0.75rem' }}>{error}</Typography>}
      </Stack>
    </Widget>
  );
};
