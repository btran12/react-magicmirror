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
} from '@mui/material';
import { WidgetContext } from '../context/WidgetContext';

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
];

const WIDGET_LABELS = {
  clock: 'Clock',
  weather: 'Weather',
  calendar: 'Calendar',
  news: 'News',
  compliments: 'Compliments',
};

const GRID_LAYOUT = [
  { row: 1, cols: '3-6-3', positions: [0, 1, 2] },
  { row: 2, cols: '3-6-3', positions: [3, 4, 5] },
  { row: 3, cols: '12', positions: [6] },
];

const DEFAULT_WIDGET_FADE = {
  clock: false,
  weather: true,
  calendar: false,
  news: false,
  compliments: false,
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

    if (widgetType === 'compliments') {
      nextSettings.complimentsConfigUrl = instanceSettings.complimentsConfigUrl || nextSettings.complimentsConfigUrl;
      nextSettings.openweatherApiKey = instanceSettings.openweatherApiKey || nextSettings.openweatherApiKey;
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }
  });

  return nextSettings;
};

const getPositionLabel = (position) => {
  for (const row of GRID_LAYOUT) {
    const index = row.positions.indexOf(position);
    if (index === -1) continue;

    if (row.cols === '12') {
      return `Row ${row.row}`;
    }

    return `Row ${row.row}, Column ${index + 1}`;
  }

  return `Position ${position + 1}`;
};

export const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, layout, widgetSettings, saveDashboardConfiguration } = useContext(WidgetContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLayout, setLocalLayout] = useState(layout.widgets);
  const [localWidgetSettings, setLocalWidgetSettings] = useState(widgetSettings);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
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
              variant="outlined"
              sx={fieldStyles}
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
              label="NewsAPI API Key"
              type="password"
              value={currentSettings.newsApiKey || ''}
              onChange={(e) => handleWidgetSettingChange(position, 'newsApiKey', e.target.value)}
              placeholder="Enter your API key"
              variant="outlined"
              sx={fieldStyles}
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
              sx={fieldStyles}
            />
            {renderFadeToggle(position)}
          </Stack>
        );
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
                    <Typography sx={{ color: '#ffffff', fontSize: '1rem', mb: 1 }}>Row {row.row} ({row.cols})</Typography>
                    <Grid container spacing={2}>
                      {row.positions.map((position, index) => (
                        <Grid item xs={12} md={colWidths[index]} key={position}>
                          <FormControl sx={{ minWidth: '150px' }} size="small" variant="outlined">
                            <InputLabel sx={{ color: '#cccccc' }}>Column {index + 1}</InputLabel>
                            <Select
                              value={localLayout[position] || ''}
                              onChange={(e) => handleLayoutChange(position, e.target.value || null)}
                              label={`Column ${index + 1}`}
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