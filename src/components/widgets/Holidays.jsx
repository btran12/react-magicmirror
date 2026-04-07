import React, { useState, useEffect } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Widget } from '../Widget';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const Holidays = ({ apiKey = '', pollIntervalMinutes = 720, showFade = false }) => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;

  useEffect(() => {
    if (!apiKey) {
      setError('API key not configured');
      setLoading(false);
      return;
    }

    const fetchHolidays = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.api-ninjas.com/v1/publicholidays?country=US`,
          {
            headers: {
              'X-Api-Key': apiKey,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch holidays');
        }

        const data = await response.json();

        // Filter holidays that are today or in the future, and get the next 5
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingHolidays = data
          .filter((holiday) => {
            const holidayDate = new Date(holiday.date);
            holidayDate.setHours(0, 0, 0, 0);
            return holidayDate >= today;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 10);

        setHolidays(upcomingHolidays);
        setError(null);
      } catch (err) {
        console.error('Holiday fetch error:', err);
        setError(err.message);
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
    const interval = setInterval(fetchHolidays, pollIntervalMs);
    return () => clearInterval(interval);
  }, [apiKey, pollIntervalMs]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
    });
  };

  return (
    <Widget widgetType="holidays" showFade={showFade}>
      {loading && <Typography sx={{ color: '#ffffff' }}>Loading holidays...</Typography>}
      {error && <Typography sx={{ color: '#ff6b6b' }}>Error: {error}</Typography>}
      {!loading && !error && holidays.length === 0 && (
        <Typography sx={{ color: '#888888' }}>No upcoming holidays</Typography>
      )}
      {!loading && !error && holidays.length > 0 && (
        <Stack spacing={1}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: '#888888',
              fontWeight: '500',
              mb: 1,
              pb: 1,
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            UPCOMING HOLIDAYS
          </Typography>
          {holidays.map((holiday, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 0.5,
              }}
            >
              <EventNoteOutlinedIcon sx={{ fontSize: 18, color: '#aaaaaa', flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      color: '#ffffff',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {holiday.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.75rem',
                      color: '#888888',
                      whiteSpace: 'nowrap',
                      marginLeft: 'auto',
                    }}
                  >
                    {getDayOfWeek(holiday.date)}, {formatDate(holiday.date)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Widget>
  );
};
