import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
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
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const buildCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

// Parse a bare iCal date/datetime value string into a Date.
// Supports: YYYYMMDD, YYYYMMDDTHHmmSS, YYYYMMDDTHHmmSSZ
const parseIcsDate = (value) => {
  if (!value || value.length < 8) return null;
  const y = parseInt(value.slice(0, 4), 10);
  const mo = parseInt(value.slice(4, 6), 10) - 1;
  const d = parseInt(value.slice(6, 8), 10);
  if (value.length === 8) {
    // Date-only (all-day)
    return new Date(y, mo, d);
  }
  // Date-time
  const h = parseInt(value.slice(9, 11), 10);
  const mi = parseInt(value.slice(11, 13), 10);
  const s = parseInt(value.slice(13, 15), 10);
  return value.endsWith('Z')
    ? new Date(Date.UTC(y, mo, d, h, mi, s))
    : new Date(y, mo, d, h, mi, s);
};

// Parse iCalendar text into a list of event objects with id, summary, start, end, isAllDay.
const parseIcs = (text) => {
  // Unfold continuation lines (CRLF or LF followed by a space/tab)
  const unfolded = text.replace(/\r\n([ \t])/g, '$1').replace(/\n([ \t])/g, '$1');
  const lines = unfolded.split(/\r?\n/);

  const events = [];
  let inEvent = false;
  let current = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
    } else if (line === 'END:VEVENT') {
      if (current.summary && current.start && !isNaN(current.start)) {
        events.push(current);
      }
      inEvent = false;
    } else if (inEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      // Key may contain parameters, e.g. DTSTART;TZID=America/New_York
      const keyPart = line.slice(0, colonIdx).toUpperCase();
      const value = line.slice(colonIdx + 1).trim();
      const key = keyPart.split(';')[0];

      if (key === 'SUMMARY') {
        current.summary = value
          .replace(/\\n/g, ' ')
          .replace(/\\,/g, ',')
          .replace(/\\;/g, ';')
          .replace(/\\\\/g, '\\');
      } else if (key === 'UID') {
        current.id = value;
      } else if (key === 'DTSTART') {
        current.isAllDay = !value.includes('T');
        current.start = parseIcsDate(value);
      } else if (key === 'DTEND') {
        current.end = parseIcsDate(value);
      }
    }
  }

  return events;
};

export const Calendar = ({ icsUrl }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = buildCalendarDays(year, month);

  const fetchEvents = useCallback(async () => {
    if (!icsUrl) {
      setEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(icsUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const parsed = parseIcs(text);
      // Keep only future/ongoing events, sorted by start
      const now = Date.now();
      const upcoming = parsed
        .filter((e) => {
          // For all-day events without an explicit end, treat as ending at midnight the next day
          const end = e.end ?? (e.isAllDay
            ? new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate() + 1)
            : e.start);
          return end.getTime() >= now;
        })
        .sort((a, b) => a.start - b.start);
      setEvents(upcoming);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [icsUrl]);

  // Fetch on mount / URL change, then refresh on interval
  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchEvents]);

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const eventDatesInView = new Set(
    events
      .filter((e) => e.start.getFullYear() === year && e.start.getMonth() === month)
      .map((e) => e.start.getDate())
  );

  const formatEventDate = (event) => {
    if (!event.start || isNaN(event.start)) return '';
    return event.start.toLocaleDateString(navigator.language, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatEventTime = (event) => {
    if (event.isAllDay) return 'All day';
    if (!event.start || isNaN(event.start)) return '';
    return event.start.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });
  };

  // Show the next 5 upcoming events
  const upcomingEvents = events.slice(0, 5);

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

      {/* Upcoming events section */}
      {!icsUrl ? (
        <Typography sx={{ fontSize: '0.75rem', color: '#666666', textAlign: 'center' }}>
          Add a calendar ICS URL in settings to show events
        </Typography>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={18} sx={{ color: '#90caf9' }} />
        </Box>
      ) : error ? (
        <Typography sx={{ fontSize: '0.7rem', color: '#f44336', textAlign: 'center' }}>
          {error}
        </Typography>
      ) : upcomingEvents.length === 0 ? (
        <Typography sx={{ fontSize: '0.75rem', color: '#666666', textAlign: 'center' }}>
          No upcoming events
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
          {upcomingEvents.map((event, i) => (
            <Box key={event.id || i} sx={{ mb: 1 }}>
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
