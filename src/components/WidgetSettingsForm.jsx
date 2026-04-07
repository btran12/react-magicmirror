import React, { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { SPORTS_LEAGUES } from './widgets/Sports';

const FALLBACK_CITIES = [
  'New York, New York',
  'Los Angeles, California',
  'Chicago, Illinois',
  'Houston, Texas',
  'Phoenix, Arizona',
  'Philadelphia, Pennsylvania',
  'San Francisco, California',
  'Seattle, Washington',
  'Denver, Colorado',
  'Boston, Massachusetts',
  'Miami, Florida',
  'Atlanta, Georgia',
  'Austin, Texas',
  'Portland, Oregon',
  'Las Vegas, Nevada',
];

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    color: '#ffffff',
    '& fieldset': { borderColor: '#444444' },
    '&:hover fieldset': { borderColor: '#555555' },
    '&.Mui-focused fieldset': { borderColor: '#2196f3' },
  },
  '& .MuiInputBase-input::placeholder': { color: '#888888', opacity: 1 },
  '& .MuiInputLabel-root': { color: '#cccccc' },
};

const selectStyles = {
  color: '#ffffff',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
  '& .MuiSvgIcon-root': { color: '#ffffff' },
};

const menuProps = {
  PaperProps: {
    sx: {
      bgcolor: '#000000',
      color: '#ffffff',
      '& .MuiMenuItem-root': {
        color: '#ffffff',
        '&:hover': {
          bgcolor: '#2196f3',
        },
        '&.Mui-selected': {
          bgcolor: '#2196f3',
          '&:hover': {
            bgcolor: '#2196f3',
          },
        },
      },
    },
  },
};

const switchStyles = {
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#2196f3',
    '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    bgcolor: 'rgba(33, 150, 243, 0.3)',
  },
  '& .MuiSwitch-track': {
    bgcolor: '#444444',
  },
};

export const WidgetSettingsForm = ({ widgetType, settings = {}, onChange }) => {
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [draggedTickerIndex, setDraggedTickerIndex] = useState(null);
  const [dragOverTickerIndex, setDragOverTickerIndex] = useState(null);
  const debounceTimerRef = useRef(null);
  const searchCacheRef = useRef({});

  useEffect(() => () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  const updateSetting = (key, value) => {
    onChange(key, value);
  };

  const fetchCitySuggestions = async (query, apiKey) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const cacheKey = `${apiKey || 'fallback'}:${query.toLowerCase()}`;
    if (searchCacheRef.current[cacheKey]) {
      setCitySuggestions(searchCacheRef.current[cacheKey]);
      return;
    }

    if (!apiKey) {
      const fallbackCities = FALLBACK_CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
      searchCacheRef.current[cacheKey] = fallbackCities;
      setCitySuggestions(fallbackCities);
      return;
    }

    setCityLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=10&appid=${apiKey}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        const formatted = data.map((location) => {
          let label = location.name;
          if (location.state) label += `, ${location.state}`;
          if (location.country) label += `, ${location.country}`;
          return label;
        });
        searchCacheRef.current[cacheKey] = formatted;
        setCitySuggestions(formatted);
      } else {
        setCitySuggestions([]);
      }
    } catch (error) {
      console.error('City search error:', error);
      setCitySuggestions(FALLBACK_CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase())));
    } finally {
      setCityLoading(false);
    }
  };

  const handleCityInputChange = (newInputValue) => {
    updateSetting('location', newInputValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCitySuggestions(newInputValue, settings.openweatherApiKey);
    }, 300);
  };

  const reorderTickers = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const tickers = settings.stockTickers || [];
    if (fromIndex < 0 || fromIndex >= tickers.length) return;
    if (toIndex < 0 || toIndex >= tickers.length) return;

    const next = [...tickers];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    updateSetting('stockTickers', next);
  };

  const resetTickerDragState = () => {
    setDraggedTickerIndex(null);
    setDragOverTickerIndex(null);
  };

  const renderFadeToggle = () => (
    <FormControlLabel
      control={
        <Switch
          checked={Boolean(settings.showFade)}
          onChange={() => updateSetting('showFade', !settings.showFade)}
          sx={switchStyles}
        />
      }
      label="Show Fade Effect"
      sx={{ color: '#ffffff' }}
    />
  );

  const renderPollingField = (label, settingKey, fallbackValue, helperText, min = 1, max = 1440) => (
    <TextField
      fullWidth
      label={label}
      type="number"
      value={settings[settingKey] ?? fallbackValue}
      onChange={(event) => updateSetting(settingKey, Number(event.target.value) || min)}
      inputProps={{ min, max, step: 1 }}
      helperText={helperText}
      variant="outlined"
      sx={{
        ...fieldStyles,
        '& .MuiFormHelperText-root': { color: '#999999' },
      }}
    />
  );

  const renderLocationField = () => (
    <Autocomplete
      freeSolo
      options={citySuggestions}
      value={settings.location || ''}
      onChange={(event, newValue) => {
        updateSetting('location', newValue || '');
      }}
      inputValue={settings.location || ''}
      onInputChange={(event, newInputValue) => handleCityInputChange(newInputValue)}
      loading={cityLoading}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Location"
          placeholder="Enter city name (e.g., 'New York')"
          variant="outlined"
          sx={fieldStyles}
        />
      )}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 12],
              },
            },
          ],
        },
        paper: {
          sx: {
            bgcolor: '#1a1a1a',
            color: '#ffffff',
            '& .MuiAutocomplete-listbox': {
              '& li': {
                padding: '8px 16px',
                '&[aria-selected="true"]': {
                  bgcolor: '#2196f3',
                },
                '&:hover': {
                  bgcolor: '#2196f3',
                },
              },
            },
          },
        },
      }}
    />
  );

  switch (widgetType) {
    case 'clock':
      return (
        <Stack spacing={2}>
          <FormControl variant="outlined">
            <InputLabel sx={{ color: '#cccccc' }}>Time Format</InputLabel>
            <Select
              value={settings.clockFormat || '24h'}
              onChange={(event) => updateSetting('clockFormat', event.target.value)}
              label="Time Format"
              sx={selectStyles}
              MenuProps={menuProps}
            >
              <MenuItem value="12h">12-Hour Format</MenuItem>
              <MenuItem value="24h">24-Hour Format</MenuItem>
            </Select>
          </FormControl>
          {renderFadeToggle()}
        </Stack>
      );
    case 'weather':
      return (
        <Stack spacing={2}>
          {renderLocationField()}
          <FormControl variant="outlined">
            <InputLabel sx={{ color: '#cccccc' }}>Temperature Unit</InputLabel>
            <Select
              value={settings.tempUnit || 'F'}
              onChange={(event) => updateSetting('tempUnit', event.target.value)}
              label="Temperature Unit"
              sx={selectStyles}
              MenuProps={menuProps}
            >
              <MenuItem value="C">Celsius</MenuItem>
              <MenuItem value="F">Fahrenheit</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined">
            <InputLabel sx={{ color: '#cccccc' }}>Time Format</InputLabel>
            <Select
              value={settings.clockFormat || '24h'}
              onChange={(event) => updateSetting('clockFormat', event.target.value)}
              label="Time Format"
              sx={selectStyles}
              MenuProps={menuProps}
            >
              <MenuItem value="12h">12-Hour Format</MenuItem>
              <MenuItem value="24h">24-Hour Format</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="OpenWeather API Key"
            type="password"
            value={settings.openweatherApiKey || ''}
            onChange={(event) => updateSetting('openweatherApiKey', event.target.value)}
            placeholder="Enter your API key"
            helperText="Required for weather data and city suggestions (openweathermap.org/api)"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderPollingField(
            'Poll Interval (Minutes)',
            'weatherPollIntervalMinutes',
            180,
            'How often to refresh weather data'
          )}
          {renderFadeToggle()}
        </Stack>
      );
    case 'calendar':
      return (
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Calendar ICS URL"
            type="text"
            value={settings.icsUrl || ''}
            onChange={(event) => updateSetting('icsUrl', event.target.value)}
            placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
            variant="outlined"
            sx={fieldStyles}
          />
          {renderPollingField(
            'Poll Interval (Minutes)',
            'calendarPollIntervalMinutes',
            30,
            'How often to refresh calendar events'
          )}
          {renderFadeToggle()}
        </Stack>
      );
    case 'news':
      return (
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Currents API Key (Primary)"
            type="password"
            value={settings.currentsApiKey || ''}
            onChange={(event) => updateSetting('currentsApiKey', event.target.value)}
            placeholder="Enter your Currents API key"
            helperText="Get a key from currentsapi.services for primary news source"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          <TextField
            fullWidth
            label="TheNewsAPI API Key (Fallback)"
            type="password"
            value={settings.newsApiKey || ''}
            onChange={(event) => updateSetting('newsApiKey', event.target.value)}
            placeholder="Enter your TheNewsAPI key"
            helperText="Optional fallback. Currents + Reddit used if not provided"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderPollingField(
            'Poll Interval (Minutes)',
            'newsPollIntervalMinutes',
            30,
            'How often to refresh headlines'
          )}
          {renderFadeToggle()}
        </Stack>
      );
    case 'holidays':
      return (
        <Stack spacing={2}>
          <Typography sx={{ color: '#aaaaaa', fontSize: '0.875rem' }}>
            Displays the 5 upcoming US holidays from api-ninjas.com
          </Typography>
          <TextField
            fullWidth
            label="API Ninjas API Key"
            type="password"
            value={settings.apiNinjasApiKey || ''}
            onChange={(event) => updateSetting('apiNinjasApiKey', event.target.value)}
            placeholder="Enter your API Ninjas API key"
            helperText="Get a free key from api-ninjas.com/register"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderPollingField(
            'Poll Interval (Minutes)',
            'holidaysPollIntervalMinutes',
            720,
            'How often to refresh holiday data'
          )}
          {renderFadeToggle()}
        </Stack>
      );
    case 'reddit':
      return (
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Favorite Subreddits"
            type="text"
            value={settings.redditSubreddits || ''}
            onChange={(event) => updateSetting('redditSubreddits', event.target.value)}
            placeholder="news, worldnews, UpliftingNews"
            helperText="Comma-separated subreddit names (without r/)"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          <TextField
            fullWidth
            label="Titles Per Subreddit"
            type="number"
            value={settings.redditTitlesPerSubreddit ?? 5}
            onChange={(event) => updateSetting('redditTitlesPerSubreddit', Number(event.target.value) || 1)}
            inputProps={{ min: 1, max: 25, step: 1 }}
            helperText="How many post titles to fetch from each subreddit"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          <TextField
            fullWidth
            label="Poll Interval (Minutes)"
            type="number"
            value={settings.redditPollIntervalMinutes ?? 30}
            onChange={(event) => updateSetting('redditPollIntervalMinutes', Number(event.target.value) || 1)}
            inputProps={{ min: 1, max: 1440, step: 1 }}
            helperText="How often to refresh Reddit posts"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          <TextField
            fullWidth
            label="Rotation Interval (Seconds)"
            type="number"
            value={settings.redditRotationIntervalSeconds ?? 15}
            onChange={(event) => updateSetting('redditRotationIntervalSeconds', Number(event.target.value) || 2)}
            inputProps={{ min: 2, max: 300, step: 1 }}
            helperText="How often to rotate to the next title"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderFadeToggle()}
        </Stack>
      );
    case 'compliments':
      return (
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Compliments JSON URL"
            type="text"
            value={settings.complimentsConfigUrl || ''}
            onChange={(event) => updateSetting('complimentsConfigUrl', event.target.value)}
            placeholder="Optional. Leave empty to use /compliments.json"
            helperText="Expected format: { fallback: [], timeOfDay: { morning: [] }, weather: { clear: [] } }"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderLocationField()}
          <TextField
            fullWidth
            label="OpenWeather API Key"
            type="password"
            value={settings.openweatherApiKey || ''}
            onChange={(event) => updateSetting('openweatherApiKey', event.target.value)}
            placeholder="Enter your API key"
            variant="outlined"
            helperText="Optional: enables weather-aware compliments (openweathermap.org/api)"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderPollingField(
            'Poll Interval (Minutes)',
            'complimentsPollIntervalMinutes',
            60,
            'How often to refresh compliments config and weather context'
          )}
          {renderFadeToggle()}
        </Stack>
      );
    case 'stocks': {
      const currentTickers = settings.stockTickers || [];
      return (
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Finnhub API Key"
            type="password"
            value={settings.finnhubApiKey || ''}
            onChange={(event) => updateSetting('finnhubApiKey', event.target.value)}
            placeholder="Enter your Finnhub token"
            helperText="Free tier at finnhub.io — 60 calls/min"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          <Box>
            <Typography sx={{ color: '#cccccc', fontSize: '0.85rem', mb: 1 }}>
              Tickers ({currentTickers.length}/10)
            </Typography>
            <Typography sx={{ color: '#888888', fontSize: '0.75rem', mb: 1 }}>
              Drag rows by the handle to reorder display priority.
            </Typography>
            <Stack spacing={1}>
              {currentTickers.map((ticker, index) => (
                <Box
                  key={`${ticker}-${index}`}
                  draggable
                  onDragStart={() => {
                    setDraggedTickerIndex(index);
                    setDragOverTickerIndex(index);
                  }}
                  onDragEnter={() => {
                    if (draggedTickerIndex === null) return;
                    setDragOverTickerIndex(index);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedTickerIndex === null) {
                      resetTickerDragState();
                      return;
                    }
                    reorderTickers(draggedTickerIndex, index);
                    resetTickerDragState();
                  }}
                  onDragEnd={resetTickerDragState}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: dragOverTickerIndex === index
                      ? 'rgba(33, 150, 243, 0.8)'
                      : 'transparent',
                    borderRadius: '8px',
                    px: 0.5,
                    py: 0.25,
                    opacity: draggedTickerIndex === index ? 0.55 : 1,
                    cursor: 'grab',
                  }}
                >
                  <DragIndicatorIcon sx={{ color: '#777777', fontSize: '1rem' }} />
                  <TextField
                    size="small"
                    value={ticker}
                    onChange={(event) => {
                      const next = [...currentTickers];
                      next[index] = event.target.value.toUpperCase();
                      updateSetting('stockTickers', next);
                    }}
                    placeholder="e.g. AAPL"
                    variant="outlined"
                    sx={{ flex: 1, ...fieldStyles }}
                    inputProps={{ maxLength: 10 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const next = currentTickers.filter((_, tickerIndex) => tickerIndex !== index);
                      updateSetting('stockTickers', next);
                    }}
                    sx={{ color: '#888888', '&:hover': { color: '#ff6b6b' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {currentTickers.length < 10 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => updateSetting('stockTickers', [...currentTickers, ''])}
                  sx={{
                    color: '#2196f3',
                    borderColor: '#2196f3',
                    '&:hover': { borderColor: '#1976d2', bgcolor: 'rgba(33,150,243,0.08)' },
                    textTransform: 'none',
                    alignSelf: 'flex-start',
                  }}
                >
                  + Add Ticker
                </Button>
              )}
            </Stack>
          </Box>
          {renderPollingField(
            'Poll Interval (Minutes)',
            'stocksPollIntervalMinutes',
            5,
            'How often to refresh stock quotes'
          )}
          {renderFadeToggle()}
        </Stack>
      );
    }
    case 'crypto': {
      const currentCoins = settings.cryptoCoins || [];
      return (
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ color: '#cccccc', fontSize: '0.85rem', mb: 1 }}>
              Coins ({currentCoins.length}/10)
            </Typography>
            <Typography sx={{ color: '#888888', fontSize: '0.75rem', mb: 1 }}>
              Enter CoinGecko IDs (e.g. bitcoin, ethereum, solana). No API key required.
            </Typography>
            <Stack spacing={1}>
              {currentCoins.map((coin, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    value={coin}
                    onChange={(event) => {
                      const next = [...currentCoins];
                      next[index] = event.target.value.toLowerCase();
                      updateSetting('cryptoCoins', next);
                    }}
                    placeholder="e.g. bitcoin"
                    variant="outlined"
                    sx={{ flex: 1, ...fieldStyles }}
                    inputProps={{ maxLength: 40 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const next = currentCoins.filter((_, coinIndex) => coinIndex !== index);
                      updateSetting('cryptoCoins', next);
                    }}
                    sx={{ color: '#888888', '&:hover': { color: '#ff6b6b' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {currentCoins.length < 10 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => updateSetting('cryptoCoins', [...currentCoins, ''])}
                  sx={{
                    color: '#2196f3',
                    borderColor: '#2196f3',
                    '&:hover': { borderColor: '#1976d2', bgcolor: 'rgba(33,150,243,0.08)' },
                    textTransform: 'none',
                    alignSelf: 'flex-start',
                  }}
                >
                  + Add Coin
                </Button>
              )}
            </Stack>
          </Box>
          {renderPollingField(
            'Poll Interval (Minutes)',
            'cryptoPollIntervalMinutes',
            5,
            'How often to refresh crypto prices'
          )}
          {renderFadeToggle()}
        </Stack>
      );
    }
    case 'airquality':
      return (
        <Stack spacing={2}>
          {renderLocationField()}
          <TextField
            fullWidth
            label="OpenWeather API Key"
            type="password"
            value={settings.openweatherApiKey || ''}
            onChange={(event) => updateSetting('openweatherApiKey', event.target.value)}
            placeholder="Enter your API key"
            helperText="Required for air quality data (openweathermap.org/api)"
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderPollingField(
            'Poll Interval (Minutes)',
            'airQualityPollIntervalMinutes',
            30,
            'How often to refresh air quality data'
          )}
          {renderFadeToggle()}
        </Stack>
      );
    case 'sports': {
      const currentLeagues = settings.sportsLeagues || [];
      const toggleLeague = (leagueKey) => {
        const next = currentLeagues.includes(leagueKey)
          ? currentLeagues.filter((league) => league !== leagueKey)
          : [...currentLeagues, leagueKey];
        updateSetting('sportsLeagues', next);
      };

      return (
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ color: '#cccccc', fontSize: '0.85rem', mb: 1 }}>
              Leagues
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(SPORTS_LEAGUES).map(([key, info]) => {
                const selected = currentLeagues.includes(key);
                return (
                  <Button
                    key={key}
                    size="small"
                    variant={selected ? 'contained' : 'outlined'}
                    onClick={() => toggleLeague(key)}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      px: 1.5,
                      py: 0.5,
                      ...(selected
                        ? { bgcolor: '#2196f3', color: '#ffffff', '&:hover': { bgcolor: '#1976d2' } }
                        : { color: '#aaaaaa', borderColor: '#444444', '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' } }),
                    }}
                  >
                    {info.name}
                  </Button>
                );
              })}
            </Box>
          </Box>
          <TextField
            fullWidth
            label="Favorite Teams (optional)"
            type="text"
            value={settings.sportsTeams || ''}
            onChange={(event) => updateSetting('sportsTeams', event.target.value)}
            placeholder="e.g. Lakers, Cowboys, Arsenal"
            helperText="Comma-separated team names to filter games. Leave empty to show all games."
            variant="outlined"
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderPollingField(
            'Live Poll Interval (Minutes)',
            'sportsLivePollIntervalMinutes',
            1,
            'How often to refresh scores while games are live',
            1,
            60
          )}
          {renderFadeToggle()}
        </Stack>
      );
    }
    case 'animations': {
      const animationOptions = [
        { value: 'starfield', label: 'Starfield' },
        { value: 'matrix', label: 'Matrix Rain' },
        { value: 'bubbles', label: 'Bubbles' },
        { value: 'fireworks', label: 'Fireworks' },
        { value: 'rain', label: 'Rain' },
        { value: 'snow', label: 'Snowfall' },
        { value: 'fish', label: '\uD83D\uDC20 Fish Aquarium' },
        { value: 'birds', label: '\uD83D\uDC26 Birds' },
        { value: 'fireflies', label: '\u2728 Fireflies' },
        { value: 'cats', label: '\uD83D\uDC08 Cats' },
        { value: 'dna', label: '\uD83E\uDDEC DNA Helix' },
        { value: 'sleepycat', label: '\uD83D\uDE3B Sleepy Cat' },
      ];

      return (
        <Stack spacing={2}>
          <FormControl fullWidth variant="outlined">
            <InputLabel sx={{ color: '#cccccc' }}>Animation Type</InputLabel>
            <Select
              value={settings.animationType || 'starfield'}
              label="Animation Type"
              onChange={(event) => updateSetting('animationType', event.target.value)}
              sx={selectStyles}
              MenuProps={menuProps}
            >
              {animationOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Rotate Every (minutes)"
            type="number"
            value={settings.animationRotationMinutes ?? 0}
            onChange={(event) => updateSetting('animationRotationMinutes', Number(event.target.value))}
            placeholder="0"
            helperText="0 = no rotation. Cycles through all animation types."
            variant="outlined"
            inputProps={{ min: 0, max: 60 }}
            sx={{
              ...fieldStyles,
              '& .MuiFormHelperText-root': { color: '#999999' },
            }}
          />
          {renderFadeToggle()}
        </Stack>
      );
    }
    default:
      return null;
  }
};
