import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Widget } from '../Widget';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const GIS_SCRIPT_ID = 'google-identity-services';

const buildCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

export const Calendar = ({ apiKey, clientId }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [tokenClient, setTokenClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = buildCalendarDays(year, month);

  // Load Google Identity Services and initialize token client
  useEffect(() => {
    if (!clientId) {
      setTokenClient(null);
      setAccessToken(null);
      setEvents([]);
      return;
    }

    const initTokenClient = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_CALENDAR_SCOPE,
        callback: (response) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            setError(null);
          } else if (response.error) {
            setError('Sign-in failed: ' + response.error);
          }
        },
      });
      setTokenClient(client);
    };

    if (window.google?.accounts?.oauth2) {
      initTokenClient();
      return;
    }

    if (!document.getElementById(GIS_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = GIS_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initTokenClient;
      document.head.appendChild(script);
    }
  }, [clientId]);

  const fetchEvents = useCallback(
    async (token) => {
      if (!token || !apiKey) return;
      setLoading(true);
      setError(null);
      try {
        const now = new Date().toISOString();
        const later = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const url =
          `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
          `?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(later)}` +
          `&orderBy=startTime&singleEvents=true&maxResults=10&key=${apiKey}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setEvents(data.items || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  useEffect(() => {
    if (accessToken) fetchEvents(accessToken);
  }, [accessToken, fetchEvents]);

  const handleConnect = () => {
    if (tokenClient) tokenClient.requestAccessToken();
  };

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const eventDatesInView = new Set(
    events
      .map((e) => {
        const raw = e.start?.dateTime || e.start?.date;
        return raw ? new Date(raw) : null;
      })
      .filter((d) => d && !isNaN(d) && d.getFullYear() === year && d.getMonth() === month)
      .map((d) => d.getDate())
  );

  const formatEventDate = (event) => {
    const raw = event.start?.dateTime || event.start?.date;
    if (!raw) return '';
    const d = new Date(raw);
    return isNaN(d) ? '' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatEventTime = (event) => {
    if (!event.start?.dateTime) return 'All day';
    const d = new Date(event.start.dateTime);
    return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Widget title="Calendar" widgetType="calendar">
      {/* Month navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <IconButton
          size="small"
          sx={{ color: '#aaaaaa', p: 0.5 }}
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          aria-label="Previous month"
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.95rem' }}>
          {MONTH_NAMES[month]} {year}
        </Typography>
        <IconButton
          size="small"
          sx={{ color: '#aaaaaa', p: 0.5 }}
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          aria-label="Next month"
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Day-of-week headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {DAY_NAMES.map((d) => (
          <Typography
            key={d}
            sx={{ fontSize: '0.65rem', color: '#888888', textAlign: 'center', py: 0.25 }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Calendar day cells */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {days.map((day, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 0.5,
              borderRadius: 1,
              backgroundColor: isToday(day) ? '#1976d2' : 'transparent',
              minHeight: 28,
            }}
          >
            {day !== null && (
              <>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: isToday(day) ? 700 : 400,
                    color: isToday(day) ? '#ffffff' : '#dddddd',
                    lineHeight: 1,
                  }}
                >
                  {day}
                </Typography>
                {eventDatesInView.has(day) && !isToday(day) && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: '#90caf9',
                      mt: '2px',
                    }}
                  />
                )}
              </>
            )}
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: '#333333', my: 1.5 }} />

      {/* Google Calendar section */}
      {!clientId ? (
        <Typography sx={{ fontSize: '0.75rem', color: '#666666', textAlign: 'center' }}>
          Add a Google Client ID in settings to connect your calendar
        </Typography>
      ) : !accessToken ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            size="small"
            onClick={handleConnect}
            disabled={!tokenClient}
            sx={{
              color: '#90caf9',
              fontSize: '0.75rem',
              textTransform: 'none',
              '&:hover': { bgcolor: 'rgba(144, 202, 249, 0.08)' },
            }}
          >
            Connect Google Calendar
          </Button>
        </Box>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={18} sx={{ color: '#90caf9' }} />
        </Box>
      ) : error ? (
        <Typography sx={{ fontSize: '0.7rem', color: '#f44336', textAlign: 'center' }}>
          {error}
        </Typography>
      ) : events.length === 0 ? (
        <Typography sx={{ fontSize: '0.75rem', color: '#666666', textAlign: 'center' }}>
          No upcoming events in the next 7 days
        </Typography>
      ) : (
        <Box>
          <Typography
            sx={{
              fontSize: '0.65rem',
              color: '#888888',
              mb: 1,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Upcoming
          </Typography>
          {events.slice(0, 5).map((event) => (
            <Box key={event.id} sx={{ mb: 1 }}>
              <Typography
                sx={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 500, lineHeight: 1.3 }}
              >
                {event.summary}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: '#90caf9' }}>
                {formatEventDate(event)} · {formatEventTime(event)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Widget>
  );
};
