import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
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
  Button,
  Box,
  Stack,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import { WidgetContext } from '../context/WidgetContext';

// Fallback cities for when API fails or no key configured
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
];

const GRID_LAYOUT = [
  { row: 1, cols: '3-6-3', positions: [0, 1, 2] },
  { row: 2, cols: '3-6-3', positions: [3, 4, 5] },
  { row: 3, cols: '12', positions: [6] },
];

export const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, updateSettings, layout, updateLayout, fadeSettings, updateFadeSettings } = useContext(WidgetContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLayout, setLocalLayout] = useState(layout.widgets);
  const [localFadeSettings, setLocalFadeSettings] = useState(fadeSettings || { clock: true, weather: true, calendar: true, news: true });
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const searchCacheRef = useRef({});

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLayoutChange = (position, widget) => {
    const newLayout = [...localLayout];
    newLayout[position] = widget;
    setLocalLayout(newLayout);
  };

  const handleFadeToggle = (widgetType) => {
    setLocalFadeSettings(prev => ({
      ...prev,
      [widgetType]: !prev[widgetType]
    }));
  };

  const fetchCitySuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      return;
    }

    // Check cache first
    if (searchCacheRef.current[query]) {
      setCitySuggestions(searchCacheRef.current[query]);
      return;
    }

    const apiKey = localSettings.openweatherApiKey;
    if (!apiKey) {
      setCitySuggestions(FALLBACK_CITIES.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      ));
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
          if (location.state) label += ', ' + location.state;
          if (location.country) label += ', ' + location.country;
          return label;
        });
        searchCacheRef.current[query] = formatted;
        setCitySuggestions(formatted);
      } else {
        setCitySuggestions(FALLBACK_CITIES.filter(city => 
          city.toLowerCase().includes(query.toLowerCase())
        ));
      }
    } catch (error) {
      console.error('City search error:', error);
      setCitySuggestions(FALLBACK_CITIES.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      ));
    } finally {
      setCityLoading(false);
    }
  }, [localSettings.openweatherApiKey]);

  const handleCityInputChange = useCallback((event, newInputValue) => {
    handleSettingChange('location', newInputValue);
    
    // Debounce API calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      fetchCitySuggestions(newInputValue);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    updateSettings(localSettings);
    updateLayout(localLayout);
    updateFadeSettings(localFadeSettings);
    onClose();
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
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', pb: 2 }}>
        Settings
      </DialogTitle>

      <DialogContent sx={{ pt: 2, overflowY: 'auto' }}>
        <Stack spacing={4}>
          {/* Widget Settings - Two Column Layout */}
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Widget Settings</Typography>
            <Grid container spacing={3}>
              {/* Left Column - Weather & API Keys */}
              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  {/* Weather Settings Section */}
                  <Box>
                    <Typography sx={{ color: '#aaaaaa', fontWeight: 'bold', mb: 2, fontSize: '0.875rem' }}>Weather</Typography>
                    <Stack spacing={2}>
                      <Autocomplete
                        freeSolo
                        options={citySuggestions}
                        value={localSettings.location}
                        onChange={(event, newValue) => {
                          handleSettingChange('location', newValue || '');
                        }}
                        inputValue={localSettings.location}
                        onInputChange={handleCityInputChange}
                        loading={cityLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Location"
                            placeholder="Enter city name (e.g., 'New York')"
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                color: '#ffffff',
                                '& fieldset': { borderColor: '#444444' },
                                '&:hover fieldset': { borderColor: '#555555' },
                                '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                              },
                              '& .MuiInputBase-input::placeholder': { color: '#888888', opacity: 1 },
                              '& .MuiInputLabel-root': { color: '#cccccc' },
                            }}
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

                      <FormControl variant="outlined">
                        <InputLabel sx={{ color: '#cccccc' }}>Temperature Unit</InputLabel>
                        <Select
                          value={localSettings.tempUnit}
                          onChange={(e) => handleSettingChange('tempUnit', e.target.value)}
                          label="Temperature Unit"
                          sx={{
                            color: '#ffffff',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
                            '& .MuiSvgIcon-root': { color: '#ffffff' }
                          }}
                        >
                          <MenuItem value="C">Celsius</MenuItem>
                          <MenuItem value="F">Fahrenheit</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label="OpenWeather API Key"
                        type="password"
                        value={localSettings.openweatherApiKey}
                        onChange={(e) => handleSettingChange('openweatherApiKey', e.target.value)}
                        placeholder="Enter your API key"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: '#444444' },
                            '&:hover fieldset': { borderColor: '#555555' },
                            '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                          },
                          '& .MuiInputBase-input::placeholder': { color: '#888888', opacity: 1 },
                          '& .MuiInputLabel-root': { color: '#cccccc' },
                        }}
                      />

                      {localFadeSettings && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={localFadeSettings.weather}
                              onChange={() => handleFadeToggle('weather')}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#2196f3',
                                  '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' }
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  bgcolor: 'rgba(33, 150, 243, 0.3)'
                                },
                                '& .MuiSwitch-track': {
                                  bgcolor: '#444444'
                                }
                              }}
                            />
                          }
                          label="Show Fade Effect"
                          sx={{ color: '#ffffff' }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Grid>

              {/* Right Column - Clock & News API */}
              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  {/* Clock Settings Section */}
                  <Box>
                    <Typography sx={{ color: '#aaaaaa', fontWeight: 'bold', mb: 2, fontSize: '0.875rem' }}>Clock</Typography>
                    <Stack spacing={2}>
                      <FormControl variant="outlined">
                        <InputLabel sx={{ color: '#cccccc' }}>Time Format</InputLabel>
                        <Select
                          value={localSettings.clockFormat}
                          onChange={(e) => handleSettingChange('clockFormat', e.target.value)}
                          label="Time Format"
                          sx={{
                            color: '#ffffff',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
                            '& .MuiSvgIcon-root': { color: '#ffffff' }
                          }}
                        >
                          <MenuItem value="12h">12-Hour Format</MenuItem>
                          <MenuItem value="24h">24-Hour Format</MenuItem>
                        </Select>
                      </FormControl>

                      {localFadeSettings && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={localFadeSettings.clock}
                              onChange={() => handleFadeToggle('clock')}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#2196f3',
                                  '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' }
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  bgcolor: 'rgba(33, 150, 243, 0.3)'
                                },
                                '& .MuiSwitch-track': {
                                  bgcolor: '#444444'
                                }
                              }}
                            />
                          }
                          label="Show Fade Effect"
                          sx={{ color: '#ffffff' }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* News Settings Section */}
                  <Box>
                    <Typography sx={{ color: '#aaaaaa', fontWeight: 'bold', mb: 2, fontSize: '0.875rem' }}>News</Typography>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="NewsAPI API Key"
                        type="password"
                        value={localSettings.newsApiKey}
                        onChange={(e) => handleSettingChange('newsApiKey', e.target.value)}
                        placeholder="Enter your API key"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: '#444444' },
                            '&:hover fieldset': { borderColor: '#555555' },
                            '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                          },
                          '& .MuiInputBase-input::placeholder': { color: '#888888', opacity: 1 },
                          '& .MuiInputLabel-root': { color: '#cccccc' },
                        }}
                      />

                      {localFadeSettings && (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={localFadeSettings.news}
                              onChange={() => handleFadeToggle('news')}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#2196f3',
                                  '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' }
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  bgcolor: 'rgba(33, 150, 243, 0.3)'
                                },
                                '& .MuiSwitch-track': {
                                  bgcolor: '#444444'
                                }
                              }}
                            />
                          }
                          label="Show Fade Effect"
                          sx={{ color: '#ffffff' }}
                        />
                      )}
                    </Stack>
                  </Box>

                  {/* Calendar Settings Section */}
                  <Box>
                    <Typography sx={{ color: '#aaaaaa', fontWeight: 'bold', mb: 2, fontSize: '0.875rem' }}>Calendar</Typography>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Calendar ICS URL"
                        type="text"
                        value={localSettings.icsUrl}
                        onChange={(e) => handleSettingChange('icsUrl', e.target.value)}
                        placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: '#444444' },
                            '&:hover fieldset': { borderColor: '#555555' },
                            '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                          },
                          '& .MuiInputBase-input::placeholder': { color: '#888888', opacity: 1 },
                          '& .MuiInputLabel-root': { color: '#cccccc' },
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Layout Settings Section */}
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>Dashboard Layout</Typography>
            <Stack spacing={3}>
              {GRID_LAYOUT.map((row) => {
                const colWidths = row.cols === '12' ? [12] : [3, 6, 3];
                return (
                  <Box key={row.row}>
                    <Typography sx={{ color: '#aaaaaa', fontSize: '0.875rem', mb: 1 }}>Row {row.row} ({row.cols})</Typography>
                    <Grid container spacing={2}>
                      {row.positions.map((position, index) => (
                        <Grid item xs={12} md={colWidths[index]} key={position}>
                          <FormControl sx={{ minWidth: '150px' }} size="small" variant="outlined">
                            <InputLabel sx={{ color: '#cccccc' }}>Column {index + 1}</InputLabel>
                            <Select
                              value={localLayout[position] || ''}
                              onChange={(e) => handleLayoutChange(position, e.target.value || null)}
                              label={`Column ${index + 1}`}
                              sx={{
                                color: '#ffffff',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
                                '& .MuiSvgIcon-root': { color: '#ffffff' }
                              }}
                            >
                              {WIDGET_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value || ''}>
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


        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#ffffff',
            borderColor: '#444444',
            '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' }
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
            '&:hover': { bgcolor: '#1976d2' }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
