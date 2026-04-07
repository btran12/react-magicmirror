import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Widget } from '../Widget';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

export const Calendar = ({ icsUrl, pollIntervalMinutes = 30, showFade = false }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const normalizedPollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;

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
    const id = setInterval(fetchEvents, normalizedPollIntervalMs);
    return () => clearInterval(id);
  }, [fetchEvents, normalizedPollIntervalMs]);

  const formatEventDate = (event) => {
    if (!event.start || isNaN(event.start)) return '';
    return event.start.toLocaleDateString(navigator.language, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatEventTime = (event) => {
    if (event.isAllDay) return 'All day';
    if (!event.start || isNaN(event.start)) return '';
    return event.start.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit' });
  };

  // Show the next 10 upcoming events
  const upcomingEvents = events.slice(0, 10);

  return (
    <Widget title="Calendar" widgetType="calendar" showFade={showFade}>
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
              fontSize: '0.7rem',
              color: '#888888',
              mb: 1.25,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Upcoming Events
          </Typography>
          {upcomingEvents.map((event, i) => (
            <Box key={event.id || i} sx={{ mb: 1.1 }}>
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
