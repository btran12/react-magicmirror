import React, { useState, useEffect } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Widget } from '../Widget';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import ThunderstormOutlinedIcon from '@mui/icons-material/ThunderstormOutlined';
import FogOutlinedIcon from '@mui/icons-material/Foggy';
import AirOutlinedIcon from '@mui/icons-material/AirOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const Weather = ({
  apiKey,
  location,
  tempUnit = 'F',
  clockFormat = '24h',
  pollIntervalMinutes = 180,
  showFade = true,
}) => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const normalizedPollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;

  useEffect(() => {
    if (!apiKey || !location) {
      setError('API key or location not configured');
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      try {
        setLoading(true);
        const unitsMap = {
          'C': 'metric',
          'F': 'imperial',
        };
        const units = unitsMap[tempUnit] || 'metric';
        
        // Fetch current weather
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=${units}`;
        const weatherResponse = await fetch(weatherUrl);
        
        if (!weatherResponse.ok) {
          throw new Error('Failed to fetch weather');
        }
        
        const weatherData = await weatherResponse.json();
        setWeather(weatherData);
        
        // Fetch forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=${units}`;
        const forecastResponse = await fetch(forecastUrl);
        
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json();
          setForecast(forecastData);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message);
        setWeather(null);
        setForecast(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, normalizedPollIntervalMs);
    return () => clearInterval(interval);
  }, [apiKey, location, tempUnit, normalizedPollIntervalMs]);

  const getWeatherIcon = (weatherMain) => {
    const iconProps = { sx: { fontSize: 40 } };
    const icons = {
      'Clear': <WbSunnyOutlinedIcon {...iconProps} />,
      'Clouds': <CloudOutlinedIcon {...iconProps} />,
      'Rain': <WaterDropOutlinedIcon {...iconProps} />,
      'Snow': <AcUnitOutlinedIcon {...iconProps} />,
      'Thunderstorm': <ThunderstormOutlinedIcon {...iconProps} />,
      'Mist': <FogOutlinedIcon {...iconProps} />,
      'Smoke': <FogOutlinedIcon {...iconProps} />,
      'Haze': <FogOutlinedIcon {...iconProps} />,
      'Dust': <AirOutlinedIcon {...iconProps} />,
      'Fog': <FogOutlinedIcon {...iconProps} />,
      'Sand': <AirOutlinedIcon {...iconProps} />,
      'Ash': <FogOutlinedIcon {...iconProps} />,
      'Squall': <AirOutlinedIcon {...iconProps} />,
      'Tornado': <AirOutlinedIcon {...iconProps} />,
      'Drizzle': <WaterDropOutlinedIcon {...iconProps} />,
    };
    return icons[weatherMain] || <CloudOutlinedIcon {...iconProps} />;
  };

  const getWindDirection = () => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(weather.wind.deg / 22.5) % 16;
    return directions[index];
  };

  const getSunriseSunsetInfo = () => {
    if (!weather.sys) return { type: 'sunrise', time: '', icon: <LightModeOutlinedIcon /> };
    
    const sunrise = new Date(weather.sys.sunrise * 1000);
    const sunset = new Date(weather.sys.sunset * 1000);
    const now = new Date();
    
    // Show sunset if after sunset time, otherwise show sunrise
    if (now > sunset) {
      const time = sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: clockFormat === '12h' });
      return { type: 'sunrise', time, icon: <LightModeOutlinedIcon /> };
    } else {
      const time = sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: clockFormat === '12h' });
      return { type: 'sunset', time, icon: <DarkModeOutlinedIcon /> };
    }
  };

  const getDailyForecast = () => {
    if (!forecast) return [];
    
    const dailyMap = {};
    const today = new Date().toDateString();
    
    // Group all forecast items by day and aggregate values
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      
      // Skip today, only include tomorrow onwards
      if (date === today) return;
      
      if (!dailyMap[date]) {
        dailyMap[date] = {
          dt: item.dt,
          main: {
            temp_max: item.main.temp_max,
            temp_min: item.main.temp_min,
          },
          weather: [item.weather[0]],
          wind: {
            speed: item.wind.speed,
            speedSum: item.wind.speed,
            count: 1,
          },
        };
      } else {
        // Update with highest max and lowest min
        dailyMap[date].main.temp_max = Math.max(dailyMap[date].main.temp_max, item.main.temp_max);
        dailyMap[date].main.temp_min = Math.min(dailyMap[date].main.temp_min, item.main.temp_min);
        // Accumulate wind speed for averaging
        dailyMap[date].wind.speedSum += item.wind.speed;
        dailyMap[date].wind.count += 1;
        dailyMap[date].wind.speed = dailyMap[date].wind.speedSum / dailyMap[date].wind.count;
        // Keep first weather condition encountered for the day
      }
    });
    
    // Convert to array and return first 5 days (starting from tomorrow)
    return Object.values(dailyMap).slice(0, 5);
  };

  return (
    <Widget widgetType="weather" showFade={showFade}>
      {loading && <Typography sx={{ color: '#ffffff' }}>Loading weather...</Typography>}
      {error && <Typography sx={{ color: '#ff6b6b' }}>{error}</Typography>}
      {weather && (
        <Stack spacing={-1}>
          {/* Header - Wind and Sunrise/Sunset */}
          <Box sx={{ display: 'flex', justifyContent: 'right', alignItems: 'center', pb: 1.5, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AirOutlinedIcon sx={{ fontSize: 16, color: '#aaaaaa' }} />
              <Typography sx={{ fontSize: '1rem', color: '#aaaaaa' }}>
                {getWindDirection()} {Math.round(weather.wind.speed)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {React.cloneElement(getSunriseSunsetInfo().icon, { sx: { fontSize: 16, color: '#aaaaaa' } })}
              <Typography sx={{ fontSize: '1rem', color: '#aaaaaa' }}>
                {getSunriseSunsetInfo().time}
              </Typography>
            </Box>
          </Box>

          {/* Current Weather - Large Icon + Temp */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'right', gap: 2 }}>
            <Box sx={{ color: '#888888', minWidth: '60px' }}>
              {React.cloneElement(getWeatherIcon(weather.weather[0].main), { sx: { fontSize: 50 } })}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 'clamp(1.75rem, 2.8vw, 3rem)', fontWeight: 'light', color: '#ffffff', lineHeight: 1 }}>
                {Math.round(weather.main.temp)}°
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: '#888888' }}>
                Feels like {Math.round(weather.main.feels_like)}°
              </Typography>
            </Box>
          </Box>

          {/* Forecast Title */}
          {forecast && (
            <Box >
              <Typography sx={{ textAlign: 'right', fontSize: '0.75rem', color: '#888888', fontWeight: '500', mt: 1.5, mb: 1.5, pt: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                WEATHER FORECAST {location.toUpperCase()}
              </Typography>

              {/* Forecast Table */}
              <Stack>
                {getDailyForecast().map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.875rem', color: '#cccccc', width: '70px' }}>
                      {index === 0 ? 'Tomorrow' : new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888888', width: '30px' }}>
                      {React.cloneElement(getWeatherIcon(item.weather[0].main), { sx: { fontSize: 20 } })}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end', flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#cccccc', minWidth: '80px', textAlign: 'right' }}>
                        {Math.round(item.main.temp_max)}° / {Math.round(item.main.temp_min)}°
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AirOutlinedIcon sx={{ fontSize: 14, color: '#888888' }} />
                        <Typography sx={{ fontSize: '0.875rem', color: '#888888', minWidth: '40px' }}>
                          {Math.round(item.wind.speed)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Widget>
  );
};
