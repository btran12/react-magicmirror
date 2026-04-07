import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import AirIcon from '@mui/icons-material/Air';
import { Widget } from '../Widget';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const AQI_LEVELS = [
  { max: 1, label: 'Good',      color: '#4caf50' },
  { max: 2, label: 'Fair',      color: '#8bc34a' },
  { max: 3, label: 'Moderate',  color: '#ffeb3b' },
  { max: 4, label: 'Poor',      color: '#ff9800' },
  { max: 5, label: 'Very Poor', color: '#f44336' },
];

const getAqiInfo = (aqi) => AQI_LEVELS[Math.min(aqi, 5) - 1] || AQI_LEVELS[0];

const PollutantRow = ({ label, value, unit }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: 0.5,
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      '&:last-child': { borderBottom: 'none' },
    }}
  >
    <Typography sx={{ color: '#aaaaaa', fontSize: '0.85rem' }}>{label}</Typography>
    <Typography sx={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 500 }}>
      {value != null ? `${value} ${unit}` : '—'}
    </Typography>
  </Box>
);

export const AirQuality = ({ apiKey, location, pollIntervalMinutes = 30, showFade = false }) => {
  const [airData, setAirData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;

  useEffect(() => {
    if (!apiKey || !location) {
      setError('API key or location not configured');
      setLoading(false);
      return;
    }

    const fetchAirQuality = async () => {
      try {
        setLoading(true);

        // Step 1: geocode the location string to lat/lon
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
        const geoResponse = await fetch(geoUrl);
        if (!geoResponse.ok) throw new Error('Geocoding failed');
        const geoData = await geoResponse.json();
        if (!Array.isArray(geoData) || geoData.length === 0) {
          throw new Error(`Location not found: ${location}`);
        }
        const { lat, lon } = geoData[0];

        // Step 2: fetch air pollution data
        const aqUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        const aqResponse = await fetch(aqUrl);
        if (!aqResponse.ok) throw new Error('Air quality fetch failed');
        const aqData = await aqResponse.json();

        const item = aqData?.list?.[0];
        if (!item) throw new Error('No air quality data available');

        setAirData({
          aqi: item.main.aqi,
          components: item.components,
        });
        setError(null);
      } catch (err) {
        setError(err.message);
        setAirData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAirQuality();
    const interval = setInterval(fetchAirQuality, pollIntervalMs);
    return () => clearInterval(interval);
  }, [apiKey, location, pollIntervalMs]);

  const aqiInfo = airData ? getAqiInfo(airData.aqi) : null;
  const comp = airData?.components || {};

  return (
    <Widget widgetType="airquality" showFade={showFade}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {loading && (
          <Typography sx={{ color: '#888888' }}>Loading air quality...</Typography>
        )}

        {error && !loading && (
          <Typography sx={{ color: '#ff6b6b' }}>{error}</Typography>
        )}

        {!loading && !error && airData && (
          <Box sx={{ flex: 1 }}>
            {/* AQI headline */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <AirIcon sx={{ color: aqiInfo.color, fontSize: 32 }} />
              <Box>
                <Typography
                  sx={{
                    color: aqiInfo.color,
                    fontWeight: 700,
                    fontSize: 'clamp(1.1rem, 1.8vw, 1.5rem)',
                    lineHeight: 1.1,
                  }}
                >
                  {aqiInfo.label}
                </Typography>
                <Typography sx={{ color: '#888888', fontSize: '0.75rem' }}>
                  Air Quality Index {airData.aqi}/5
                </Typography>
              </Box>
            </Box>

            {/* Pollutant breakdown */}
            <Box>
              <PollutantRow label="PM2.5" value={comp.pm2_5?.toFixed(1)}  unit="µg/m³" />
              <PollutantRow label="PM10"  value={comp.pm10?.toFixed(1)}   unit="µg/m³" />
              <PollutantRow label="O₃"   value={comp.o3?.toFixed(1)}     unit="µg/m³" />
              <PollutantRow label="NO₂"  value={comp.no2?.toFixed(1)}    unit="µg/m³" />
              <PollutantRow label="CO"   value={comp.co?.toFixed(0)}     unit="µg/m³" />
            </Box>
          </Box>
        )}
      </Box>
    </Widget>
  );
};
