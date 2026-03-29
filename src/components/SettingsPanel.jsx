import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Button,
  Box,
  Stack,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Autocomplete,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { WidgetContext } from '../context/WidgetContext';
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

const WIDGET_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'clock', label: 'Clock' },
  { value: 'weather', label: 'Weather' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'news', label: 'News' },
  { value: 'compliments', label: 'Compliments' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'airquality', label: 'Air Quality' },
  { value: 'sports', label: 'Sports' },
];

const WIDGET_LABELS = {
  clock: 'Clock',
  weather: 'Weather',
  calendar: 'Calendar',
  news: 'News',
  compliments: 'Compliments',
  stocks: 'Stocks',
  crypto: 'Crypto',
  airquality: 'Air Quality',
  sports: 'Sports',
};

const GRID_LAYOUT = [
  { row: 1, cols: '3-6-3', positions: [0, 1, 2] },
  { row: 2, cols: '3-6-3', positions: [3, 4, 5] },
  { row: 3, cols: '12', positions: [6] },
];

const POSITION_LABELS = {
  0: 'Top Left',
  1: 'Top Middle',
  2: 'Top Right',
  3: 'Middle Left',
  4: 'Middle Middle',
  5: 'Middle Right',
  6: 'Bottom',
};

const DEFAULT_WIDGET_FADE = {
  clock: false,
  weather: true,
  calendar: false,
  news: false,
  compliments: false,
  stocks: false,
  crypto: false,
  airquality: false,
  sports: false,
};

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

const createWidgetSettingsForType = (widgetType, defaults) => {
  switch (widgetType) {
    case 'clock':
      return {
        widgetType,
        clockFormat: defaults.clockFormat || '24h',
        showFade: DEFAULT_WIDGET_FADE.clock,
      };
    case 'weather':
      return {
        widgetType,
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        tempUnit: defaults.tempUnit || 'F',
        clockFormat: defaults.clockFormat || '24h',
        showFade: DEFAULT_WIDGET_FADE.weather,
      };
    case 'calendar':
      return {
        widgetType,
        icsUrl: defaults.icsUrl || '',
        showFade: DEFAULT_WIDGET_FADE.calendar,
      };
    case 'news':
      return {
        widgetType,
        newsApiKey: defaults.newsApiKey || '',
        showFade: DEFAULT_WIDGET_FADE.news,
      };
    case 'compliments':
      return {
        widgetType,
        complimentsConfigUrl: defaults.complimentsConfigUrl || '',
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        showFade: DEFAULT_WIDGET_FADE.compliments,
      };
    case 'stocks':
      return {
        widgetType,
        finnhubApiKey: defaults.finnhubApiKey || '',
        stockTickers: [],
        showFade: DEFAULT_WIDGET_FADE.stocks,
      };
    case 'crypto':
      return {
        widgetType,
        cryptoCoins: ['bitcoin', 'ethereum'],
        showFade: DEFAULT_WIDGET_FADE.crypto,
      };
    case 'airquality':
      return {
        widgetType,
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        showFade: DEFAULT_WIDGET_FADE.airquality,
      };
    case 'sports':
      return {
        widgetType,
        sportsLeagues: [],
        sportsTeams: '',
        showFade: DEFAULT_WIDGET_FADE.sports,
      };
    default:
      return {
        widgetType,
        showFade: false,
      };
  }
};

const buildSettingsDefaultsFromInstances = (layoutWidgets, widgetSettingsMap, previousSettings) => {
  const nextSettings = { ...previousSettings };

  layoutWidgets.forEach((widgetType, position) => {
    const instanceSettings = widgetSettingsMap[position];
    if (!widgetType || !instanceSettings) return;

    if (widgetType === 'clock' && instanceSettings.clockFormat) {
      nextSettings.clockFormat = instanceSettings.clockFormat;
    }

    if (widgetType === 'weather') {
      nextSettings.openweatherApiKey = instanceSettings.openweatherApiKey || nextSettings.openweatherApiKey;
      nextSettings.location = instanceSettings.location || nextSettings.location;
      nextSettings.tempUnit = instanceSettings.tempUnit || nextSettings.tempUnit;
      nextSettings.clockFormat = instanceSettings.clockFormat || nextSettings.clockFormat;
    }

    if (widgetType === 'calendar' && instanceSettings.icsUrl) {
      nextSettings.icsUrl = instanceSettings.icsUrl;
    }

    if (widgetType === 'news' && instanceSettings.newsApiKey) {
      nextSettings.newsApiKey = instanceSettings.newsApiKey;
    }

    if (widgetType === 'stocks' && instanceSettings.finnhubApiKey) {
      nextSettings.finnhubApiKey = instanceSettings.finnhubApiKey;
    }

    if (widgetType === 'airquality') {
      nextSettings.openweatherApiKey = instanceSettings.openweatherApiKey || nextSettings.openweatherApiKey;
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }

    if (widgetType === 'compliments') {
      nextSettings.complimentsConfigUrl = instanceSettings.complimentsConfigUrl || nextSettings.complimentsConfigUrl;
      nextSettings.openweatherApiKey = instanceSettings.openweatherApiKey || nextSettings.openweatherApiKey;
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }
  });

  return nextSettings;
};

const getPositionLabel = (position) => {
  return POSITION_LABELS[position] || `Position ${position + 1}`;
};

export const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, layout, widgetSettings, saveDashboardConfiguration } = useContext(WidgetContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLayout, setLocalLayout] = useState(layout.widgets);
  const [localWidgetSettings, setLocalWidgetSettings] = useState(widgetSettings);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [dragTickerPosition, setDragTickerPosition] = useState(null);
  const [draggedTickerIndex, setDraggedTickerIndex] = useState(null);
  const [dragOverTickerIndex, setDragOverTickerIndex] = useState(null);
  const debounceTimerRef = useRef(null);
  const searchCacheRef = useRef({});

  useEffect(() => {
    if (!isOpen) return;

    setLocalSettings(settings);
    setLocalLayout(layout.widgets);
    setLocalWidgetSettings(widgetSettings);
  }, [isOpen, layout.widgets, settings, widgetSettings]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleLayoutChange = (position, widgetType) => {
    const nextLayout = [...localLayout];
    nextLayout[position] = widgetType;
    setLocalLayout(nextLayout);

    setLocalWidgetSettings(prev => {
      const next = { ...prev };

      if (!widgetType) {
        delete next[position];
        return next;
      }

      if (next[position]?.widgetType === widgetType) {
        return next;
      }

      const existingInstance = Object.values(next).find(item => item?.widgetType === widgetType);
      next[position] = existingInstance
        ? { ...existingInstance, widgetType }
        : createWidgetSettingsForType(widgetType, localSettings);

      return next;
    });
  };

  const handleWidgetSettingChange = (position, key, value) => {
    setLocalWidgetSettings(prev => ({
      ...prev,
      [position]: {
        widgetType: prev[position]?.widgetType || localLayout[position],
        ...prev[position],
        [key]: value,
      },
    }));
  };

  const reorderTickers = (position, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const tickers = localWidgetSettings[position]?.stockTickers || [];
    if (fromIndex < 0 || fromIndex >= tickers.length) return;
    if (toIndex < 0 || toIndex >= tickers.length) return;

    const next = [...tickers];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    handleWidgetSettingChange(position, 'stockTickers', next);
  };

  const resetTickerDragState = () => {
    setDragTickerPosition(null);
    setDraggedTickerIndex(null);
    setDragOverTickerIndex(null);
  };

  const handleTickerDragStart = (position, tickerIndex) => {
    setDragTickerPosition(position);
    setDraggedTickerIndex(tickerIndex);
    setDragOverTickerIndex(tickerIndex);
  };

  const handleTickerDragEnter = (position, tickerIndex) => {
    if (dragTickerPosition !== position || draggedTickerIndex === null) return;
    setDragOverTickerIndex(tickerIndex);
  };

  const handleTickerDrop = (position, tickerIndex) => {
    if (dragTickerPosition !== position || draggedTickerIndex === null) {
      resetTickerDragState();
      return;
    }

    reorderTickers(position, draggedTickerIndex, tickerIndex);
    resetTickerDragState();
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
      const fallbackCities = FALLBACK_CITIES.filter(city => city.toLowerCase().includes(query.toLowerCase()));
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
        const formatted = data.map(location => {
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
      setCitySuggestions(FALLBACK_CITIES.filter(city => city.toLowerCase().includes(query.toLowerCase())));
    } finally {
      setCityLoading(false);
    }
  };

  const handleCityInputChange = (position, newInputValue) => {
    handleWidgetSettingChange(position, 'location', newInputValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCitySuggestions(newInputValue, localWidgetSettings[position]?.openweatherApiKey);
    }, 300);
  };

  const handleSave = () => {
    const nextSettings = buildSettingsDefaultsFromInstances(localLayout, localWidgetSettings, localSettings);
    saveDashboardConfiguration(localLayout, localWidgetSettings, nextSettings);
    onClose();
  };

  const selectedWidgets = localLayout
    .map((widgetType, position) => {
      if (!widgetType) return null;

      return {
        position,
        widgetType,
        settings: localWidgetSettings[position] || createWidgetSettingsForType(widgetType, localSettings),
      };
    })
    .filter(Boolean);

  const renderFadeToggle = (position) => (
    <FormControlLabel
      control={
        <Switch
          checked={Boolean(localWidgetSettings[position]?.showFade)}
          onChange={() => handleWidgetSettingChange(position, 'showFade', !localWidgetSettings[position]?.showFade)}
          sx={switchStyles}
        />
      }
      label="Show Fade Effect"
      sx={{ color: '#ffffff' }}
    />
  );

  const renderLocationField = (position) => (
    <Autocomplete
      freeSolo
      options={citySuggestions}
      value={localWidgetSettings[position]?.location || ''}
      onChange={(event, newValue) => {
        handleWidgetSettingChange(position, 'location', newValue || '');
      }}
      inputValue={localWidgetSettings[position]?.location || ''}
      onInputChange={(event, newInputValue) => handleCityInputChange(position, newInputValue)}
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

  const renderWidgetFields = (widget) => {
    const position = widget.position;
    const widgetType = widget.widgetType;
    const currentSettings = localWidgetSettings[position] || widget.settings;

    switch (widgetType) {
      case 'clock':
        return (
          <Stack spacing={2}>
            <FormControl variant="outlined">
              <InputLabel sx={{ color: '#cccccc' }}>Time Format</InputLabel>
              <Select
                value={currentSettings.clockFormat || '24h'}
                onChange={(e) => handleWidgetSettingChange(position, 'clockFormat', e.target.value)}
                label="Time Format"
                sx={selectStyles}
              >
                <MenuItem value="12h">12-Hour Format</MenuItem>
                <MenuItem value="24h">24-Hour Format</MenuItem>
              </Select>
            </FormControl>
            {renderFadeToggle(position)}
          </Stack>
        );
      case 'weather':
        return (
          <Stack spacing={2}>
            {renderLocationField(position)}
            <FormControl variant="outlined">
              <InputLabel sx={{ color: '#cccccc' }}>Temperature Unit</InputLabel>
              <Select
                value={currentSettings.tempUnit || 'F'}
                onChange={(e) => handleWidgetSettingChange(position, 'tempUnit', e.target.value)}
                label="Temperature Unit"
                sx={selectStyles}
              >
                <MenuItem value="C">Celsius</MenuItem>
                <MenuItem value="F">Fahrenheit</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="outlined">
              <InputLabel sx={{ color: '#cccccc' }}>Time Format</InputLabel>
              <Select
                value={currentSettings.clockFormat || '24h'}
                onChange={(e) => handleWidgetSettingChange(position, 'clockFormat', e.target.value)}
                label="Time Format"
                sx={selectStyles}
              >
                <MenuItem value="12h">12-Hour Format</MenuItem>
                <MenuItem value="24h">24-Hour Format</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="OpenWeather API Key"
              type="password"
              value={currentSettings.openweatherApiKey || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'openweatherApiKey', e.target.value)}
              placeholder="Enter your API key"
              helperText="Required for weather data and city suggestions (openweathermap.org/api)"
              variant="outlined"
              sx={{
                ...fieldStyles,
                '& .MuiFormHelperText-root': { color: '#999999' },
              }}
            />
            {renderFadeToggle(position)}
          </Stack>
        );
      case 'calendar':
        return (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Calendar ICS URL"
              type="text"
              value={currentSettings.icsUrl || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'icsUrl', e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
              variant="outlined"
              sx={fieldStyles}
            />
            {renderFadeToggle(position)}
          </Stack>
        );
      case 'news':
        return (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="TheNewsAPI API Key"
              type="password"
              value={currentSettings.newsApiKey || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'newsApiKey', e.target.value)}
              placeholder="Enter your API key"
              helperText="Get a key from thenewsapi.com to load top headlines"
              variant="outlined"
              sx={{
                ...fieldStyles,
                '& .MuiFormHelperText-root': { color: '#999999' },
              }}
            />
            {renderFadeToggle(position)}
          </Stack>
        );
      case 'compliments':
        return (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Compliments JSON URL"
              type="text"
              value={currentSettings.complimentsConfigUrl || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'complimentsConfigUrl', e.target.value)}
              placeholder="Optional. Leave empty to use /compliments.json"
              helperText="Expected format: { fallback: [], timeOfDay: { morning: [] }, weather: { clear: [] } }"
              variant="outlined"
              sx={{
                ...fieldStyles,
                '& .MuiFormHelperText-root': { color: '#999999' },
              }}
            />
            {renderLocationField(position)}
            <TextField
              fullWidth
              label="OpenWeather API Key"
              type="password"
              value={currentSettings.openweatherApiKey || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'openweatherApiKey', e.target.value)}
              placeholder="Enter your API key"
              variant="outlined"
              helperText="Optional: enables weather-aware compliments (openweathermap.org/api)"
              sx={{
                ...fieldStyles,
                '& .MuiFormHelperText-root': { color: '#999999' },
              }}
            />
            {renderFadeToggle(position)}
          </Stack>
        );
      case 'stocks': {
        const currentTickers = currentSettings.stockTickers || [];
        return (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Finnhub API Key"
              type="password"
              value={currentSettings.finnhubApiKey || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'finnhubApiKey', e.target.value)}
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
                {currentTickers.map((ticker, idx) => (
                  <Box
                    key={`${ticker}-${idx}`}
                    draggable
                    onDragStart={() => handleTickerDragStart(position, idx)}
                    onDragEnter={() => handleTickerDragEnter(position, idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleTickerDrop(position, idx)}
                    onDragEnd={resetTickerDragState}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: dragOverTickerIndex === idx && dragTickerPosition === position
                        ? 'rgba(33, 150, 243, 0.8)'
                        : 'transparent',
                      borderRadius: '8px',
                      px: 0.5,
                      py: 0.25,
                      opacity: draggedTickerIndex === idx && dragTickerPosition === position ? 0.55 : 1,
                      cursor: 'grab',
                    }}
                  >
                    <DragIndicatorIcon sx={{ color: '#777777', fontSize: '1rem' }} />
                    <TextField
                      size="small"
                      value={ticker}
                      onChange={(e) => {
                        const next = [...currentTickers];
                        next[idx] = e.target.value.toUpperCase();
                        handleWidgetSettingChange(position, 'stockTickers', next);
                      }}
                      placeholder="e.g. AAPL"
                      variant="outlined"
                      sx={{ flex: 1, ...fieldStyles }}
                      inputProps={{ maxLength: 10 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        const next = currentTickers.filter((_, i) => i !== idx);
                        handleWidgetSettingChange(position, 'stockTickers', next);
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
                    onClick={() => {
                      handleWidgetSettingChange(position, 'stockTickers', [...currentTickers, '']);
                    }}
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
            {renderFadeToggle(position)}
          </Stack>
        );
      }
      case 'crypto': {
        const currentCoins = currentSettings.cryptoCoins || [];
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
                {currentCoins.map((coin, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      value={coin}
                      onChange={(e) => {
                        const next = [...currentCoins];
                        next[idx] = e.target.value.toLowerCase();
                        handleWidgetSettingChange(position, 'cryptoCoins', next);
                      }}
                      placeholder="e.g. bitcoin"
                      variant="outlined"
                      sx={{ flex: 1, ...fieldStyles }}
                      inputProps={{ maxLength: 40 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        const next = currentCoins.filter((_, i) => i !== idx);
                        handleWidgetSettingChange(position, 'cryptoCoins', next);
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
                    onClick={() => {
                      handleWidgetSettingChange(position, 'cryptoCoins', [...currentCoins, '']);
                    }}
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
            {renderFadeToggle(position)}
          </Stack>
        );
      }
      case 'airquality':
        return (
          <Stack spacing={2}>
            {renderLocationField(position)}
            <TextField
              fullWidth
              label="OpenWeather API Key"
              type="password"
              value={currentSettings.openweatherApiKey || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'openweatherApiKey', e.target.value)}
              placeholder="Enter your API key"
              helperText="Required for air quality data (openweathermap.org/api)"
              variant="outlined"
              sx={{
                ...fieldStyles,
                '& .MuiFormHelperText-root': { color: '#999999' },
              }}
            />
            {renderFadeToggle(position)}
          </Stack>
        );
      case 'sports': {
        const currentLeagues = currentSettings.sportsLeagues || [];
        const toggleLeague = (leagueKey) => {
          const next = currentLeagues.includes(leagueKey)
            ? currentLeagues.filter((l) => l !== leagueKey)
            : [...currentLeagues, leagueKey];
          handleWidgetSettingChange(position, 'sportsLeagues', next);
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
              value={currentSettings.sportsTeams || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'sportsTeams', e.target.value)}
              placeholder="e.g. Lakers, Cowboys, Arsenal"
              helperText="Comma-separated team names to filter games. Leave empty to show all games."
              variant="outlined"
              sx={{
                ...fieldStyles,
                '& .MuiFormHelperText-root': { color: '#999999' },
              }}
            />
            {renderFadeToggle(position)}
          </Stack>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          backgroundImage: 'none',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', pb: 2 }}>
        Settings
      </DialogTitle>

      <DialogContent sx={{ pt: 2, overflowY: 'auto' }}>
        <Stack spacing={4}>
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>Dashboard Layout</Typography>
            <Stack spacing={3} divider={<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}>
              {GRID_LAYOUT.map((row) => {
                const colWidths = row.cols === '12' ? [12] : [3, 6, 3];
                return (
                  <Box key={row.row}>
                    <Typography sx={{ color: '#ffffff', fontSize: '1rem', mb: 1 }}>
                      {row.cols === '12' ? 'Bottom Row' : row.row === 1 ? 'Top Row' : 'Middle Row'}
                    </Typography>
                    <Grid container spacing={2}>
                      {row.positions.map((position, index) => (
                        <Grid item xs={12} md={colWidths[index]} key={position}>
                          <FormControl sx={{ minWidth: '150px' }} size="small" variant="outlined">
                            <InputLabel sx={{ color: '#cccccc' }}>{getPositionLabel(position)}</InputLabel>
                            <Select
                              value={localLayout[position] || ''}
                              onChange={(e) => handleLayoutChange(position, e.target.value || null)}
                              label={getPositionLabel(position)}
                              sx={selectStyles}
                            >
                              {WIDGET_OPTIONS.map((option) => (
                                <MenuItem key={option.label} value={option.value || ''}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Widget Settings</Typography>
            {selectedWidgets.length === 0 ? (
              <Typography sx={{ color: '#888888' }}>Select widgets in the layout above to configure their settings.</Typography>
            ) : (
              <Stack spacing={3} divider={<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}>
                {selectedWidgets.map((widget) => (
                  <Box key={`${widget.widgetType}-${widget.position}`}>
                    <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2, fontSize: '1rem', textAlign: 'center' }}>
                      {WIDGET_LABELS[widget.widgetType]} · {getPositionLabel(widget.position)}
                    </Typography>
                    {renderWidgetFields(widget)}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#ffffff',
            borderColor: '#444444',
            '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: '#2196f3',
            color: '#ffffff',
            '&:hover': { bgcolor: '#1976d2' },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};