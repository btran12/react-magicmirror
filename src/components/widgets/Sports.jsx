import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const UPCOMING_DAYS = 14; // look ahead window

const LEAGUES = {
  nfl: { sport: 'football', league: 'nfl', name: 'NFL' },
  nba: { sport: 'basketball', league: 'nba', name: 'NBA' },
  mlb: { sport: 'baseball', league: 'mlb', name: 'MLB' },
  nhl: { sport: 'hockey', league: 'nhl', name: 'NHL' },
  mls: { sport: 'soccer', league: 'usa.1', name: 'MLS' },
  epl: { sport: 'soccer', league: 'eng.1', name: 'Premier League' },
  laliga: { sport: 'soccer', league: 'esp.1', name: 'La Liga' },
  bundesliga: { sport: 'soccer', league: 'ger.1', name: 'Bundesliga' },
  seriea: { sport: 'soccer', league: 'ita.1', name: 'Serie A' },
  ucl: { sport: 'soccer', league: 'uefa.champions', name: 'Champions League' },
};

const toDateParam = (date) =>
  date.toISOString().slice(0, 10).replace(/-/g, '');

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const parseTeamFilters = (teamsStr) => {
  if (!teamsStr) return [];
  return teamsStr
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
};

const matchesTeamFilter = (event, teamFilters) => {
  if (teamFilters.length === 0) return true;
  const competitors = event.competitions?.[0]?.competitors || [];
  return competitors.some((c) => {
    const name = (c.team?.displayName || '').toLowerCase();
    const abbr = (c.team?.abbreviation || '').toLowerCase();
    const short = (c.team?.shortDisplayName || '').toLowerCase();
    return teamFilters.some(
      (f) => name.includes(f) || abbr === f || short.includes(f)
    );
  });
};

const getEventState = (event) => event.status?.type?.state; // 'pre' | 'in' | 'post'

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const fetchLeagueEvents = async (leagueKey, startDate, endDate) => {
  const { sport, league } = LEAGUES[leagueKey];
  const start = toDateParam(startDate);
  const end = toDateParam(endDate);
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard?dates=${start}-${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN API error for ${league}: ${res.status}`);
  const data = await res.json();
  return (data.events || []).map((ev) => ({ ...ev, _leagueKey: leagueKey }));
};

// Render a single game row
const GameRow = ({ event }) => {
  const state = getEventState(event);
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
  const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];

  if (!home || !away) return null;

  const homeName = home.team?.displayName || home.team?.shortDisplayName || home.team?.abbreviation || '?';
  const awayName = away.team?.displayName || away.team?.shortDisplayName || away.team?.abbreviation || '?';
  const leagueName = LEAGUES[event._leagueKey]?.name || '';

  let scoreOrTime = null;
  let statusLabel = null;
  let statusColor = '#888888';

  if (state === 'in') {
    // Live game
    const clockDetail =
      event.status?.type?.shortDetail ||
      event.status?.displayClock ||
      '';
    statusLabel = `LIVE · ${clockDetail}`;
    statusColor = '#4caf50';
    scoreOrTime = `${awayName} ${away.score ?? '—'} – ${homeName} ${home.score ?? '—'}`;
  } else if (state === 'post') {
    // Finished
    statusLabel = 'Final';
    statusColor = '#888888';
    scoreOrTime = `${awayName} ${away.score ?? '—'} – ${homeName} ${home.score ?? '—'}`;
  } else {
    // Scheduled
    const gameDate = new Date(event.date);
    const today = new Date();
    statusLabel = isSameDay(gameDate, today)
      ? formatTime(event.date)
      : `${formatDate(event.date)} · ${formatTime(event.date)}`;
    statusColor = '#aaaaaa';
    scoreOrTime = `${awayName} vs ${homeName}`;
  }

  return (
    <Box
      sx={{
        py: 0.75,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>
          {scoreOrTime}
        </Typography>
        <Typography sx={{ color: '#666666', fontSize: '0.7rem', ml: 1, whiteSpace: 'nowrap' }}>
          {leagueName}
        </Typography>
      </Box>
      <Typography sx={{ color: statusColor, fontSize: '0.75rem', mt: 0.25 }}>
        {statusLabel}
      </Typography>
    </Box>
  );
};

// Group events into "today" and "upcoming"
const partitionEvents = (events) => {
  const today = new Date();
  const todayEvents = [];
  const upcomingEvents = [];

  events.forEach((ev) => {
    const gameDate = new Date(ev.date);
    if (isSameDay(gameDate, today)) {
      todayEvents.push(ev);
    } else if (gameDate > today) {
      upcomingEvents.push(ev);
    }
  });

  // Sort today: live first, then by time; upcoming: chronological
  todayEvents.sort((a, b) => {
    const aLive = getEventState(a) === 'in' ? 0 : 1;
    const bLive = getEventState(b) === 'in' ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return new Date(a.date) - new Date(b.date);
  });

  upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  return { todayEvents, upcomingEvents };
};

export const Sports = ({
  leagues = [],
  teams = '',
  livePollIntervalMinutes = 1,
  showFade = false,
}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeLeagues = leagues.filter((l) => LEAGUES[l]);
  const teamFilters = parseTeamFilters(teams);
  const livePollIntervalMs = clamp(Number(livePollIntervalMinutes), 1, 60) * 60 * 1000;

  useEffect(() => {
    if (activeLeagues.length === 0) {
      setError('No leagues configured. Open Settings to choose sports leagues.');
      setLoading(false);
      return;
    }

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + UPCOMING_DAYS);
    let interval = null;
    let isMounted = true;

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const fetchAll = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          activeLeagues.map((key) => fetchLeagueEvents(key, today, endDate))
        );
        const allEvents = results.flat();
        const filtered = teamFilters.length > 0
          ? allEvents.filter((ev) => matchesTeamFilter(ev, teamFilters))
          : allEvents;
        const hasLiveMatches = filtered.some((ev) => getEventState(ev) === 'in');

        if (hasLiveMatches && !interval) {
          interval = setInterval(fetchAll, livePollIntervalMs);
        } else if (!hasLiveMatches) {
          stopPolling();
        }

        if (!isMounted) return;
        setEvents(filtered);
        setError(null);
      } catch (err) {
        stopPolling();
        if (!isMounted) return;
        setError(err.message);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeagues.join(','), livePollIntervalMs, teams]);

  const { todayEvents, upcomingEvents } = partitionEvents(events);
  const hasToday = todayEvents.length > 0;
  const hasUpcoming = upcomingEvents.length > 0;

  return (
    <Widget widgetType="sports" showFade={showFade}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {loading && (
          <Typography sx={{ color: '#888888', fontSize: '0.85rem' }}>Loading scores...</Typography>
        )}

        {error && !loading && (
          <Typography sx={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</Typography>
        )}

        {!loading && !error && !hasToday && !hasUpcoming && (
          <Typography sx={{ color: '#888888', fontSize: '0.85rem' }}>
            {teamFilters.length > 0
              ? 'No upcoming matches found for the configured teams.'
              : 'No upcoming matches scheduled.'}
          </Typography>
        )}

        {!loading && !error && (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {hasToday && (
              <>
                <Typography
                  sx={{ color: '#aaaaaa', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}
                >
                  Today
                </Typography>
                {todayEvents.map((ev) => (
                  <GameRow key={ev.id} event={ev} />
                ))}
              </>
            )}

            {hasUpcoming && (
              <Box sx={{ mt: hasToday ? 1.5 : 0 }}>
                <Typography
                  sx={{ color: '#aaaaaa', fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}
                >
                  Upcoming Matches
                </Typography>
                {upcomingEvents.map((ev) => (
                  <GameRow key={ev.id} event={ev} />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Widget>
  );
};

export { LEAGUES as SPORTS_LEAGUES };
