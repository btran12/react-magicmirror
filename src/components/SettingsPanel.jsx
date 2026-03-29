import React, { useState, useContext, useEffect } from 'react';
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
} from '@mui/material';
import { WidgetContext } from '../context/WidgetContext';
import {
  createWidgetSettingsForType,
  getLayoutPreset,
  getPositionLabel,
  LAYOUT_PRESETS,
  normalizeLayoutPreset,
  WIDGET_OPTIONS,
} from './widgetConfig';

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

const buildSettingsDefaultsFromInstances = (layoutWidgets, widgetSettingsMap, previousSettings) => {
  const nextSettings = { ...previousSettings };

  layoutWidgets.forEach((widgetType, position) => {
    const instanceSettings = widgetSettingsMap[position];
    if (!widgetType || !instanceSettings) return;

    if (widgetType === 'clock' && instanceSettings.clockFormat) {
      nextSettings.clockFormat = instanceSettings.clockFormat;
    }

    if (widgetType === 'weather') {
      nextSettings.location = instanceSettings.location || nextSettings.location;
      nextSettings.tempUnit = instanceSettings.tempUnit || nextSettings.tempUnit;
      nextSettings.clockFormat = instanceSettings.clockFormat || nextSettings.clockFormat;
    }

    if (widgetType === 'calendar' && instanceSettings.icsUrl) {
      nextSettings.icsUrl = instanceSettings.icsUrl;
    }

    if (widgetType === 'airquality') {
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }

    if (widgetType === 'compliments') {
      nextSettings.complimentsConfigUrl = instanceSettings.complimentsConfigUrl || nextSettings.complimentsConfigUrl;
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }
  });

  return nextSettings;
};

export const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, layout, widgetSettings, saveDashboardConfiguration } = useContext(WidgetContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLayout, setLocalLayout] = useState(layout.widgets);
  const [localLayoutPreset, setLocalLayoutPreset] = useState(layout.preset);
  const [localWidgetSettings, setLocalWidgetSettings] = useState(widgetSettings);

  useEffect(() => {
    if (!isOpen) return;

    setLocalSettings(settings);
    setLocalLayout(layout.widgets);
    setLocalLayoutPreset(layout.preset);
    setLocalWidgetSettings(widgetSettings);
  }, [isOpen, layout.preset, layout.widgets, settings, widgetSettings]);

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

  const handleDefaultSettingChange = (key, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    const nextSettings = buildSettingsDefaultsFromInstances(localLayout, localWidgetSettings, localSettings);
    saveDashboardConfiguration(localLayout, localWidgetSettings, nextSettings, localLayoutPreset);
    onClose();
  };

  const layoutPresetOptions = Object.values(LAYOUT_PRESETS);
  const activeLayoutPreset = getLayoutPreset(localLayoutPreset);

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
            <Stack spacing={2} sx={{ mb: 3 }}>
              <FormControl size="small" variant="outlined" sx={{ maxWidth: 300 }}>
                <InputLabel sx={{ color: '#cccccc' }}>Layout Preset</InputLabel>
                <Select
                  value={normalizeLayoutPreset(localLayoutPreset)}
                  onChange={(e) => setLocalLayoutPreset(normalizeLayoutPreset(e.target.value))}
                  label="Layout Preset"
                  sx={selectStyles}
                >
                  {layoutPresetOptions.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography sx={{ color: '#999999', fontSize: '0.85rem' }}>
                {activeLayoutPreset.description}
              </Typography>
            </Stack>
            <Stack spacing={3} divider={<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}>
              {activeLayoutPreset.rows.map((row) => {
                const colWidths = row.colSpans;
                return (
                  <Box key={row.id}>
                    <Typography sx={{ color: '#ffffff', fontSize: '1rem', mb: 1 }}>
                      {row.label}
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
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Default Service API Keys</Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="OpenWeather API Key (Weather / Air Quality / Compliments)"
                type="password"
                value={localSettings.openweatherApiKey || ''}
                onChange={(e) => handleDefaultSettingChange('openweatherApiKey', e.target.value)}
                placeholder="Enter default OpenWeather key"
                variant="outlined"
                sx={fieldStyles}
              />
              <TextField
                fullWidth
                label="TheNewsAPI Key (News)"
                type="password"
                value={localSettings.newsApiKey || ''}
                onChange={(e) => handleDefaultSettingChange('newsApiKey', e.target.value)}
                placeholder="Enter default TheNewsAPI key"
                variant="outlined"
                sx={fieldStyles}
              />
              <TextField
                fullWidth
                label="Finnhub API Key (Stocks)"
                type="password"
                value={localSettings.finnhubApiKey || ''}
                onChange={(e) => handleDefaultSettingChange('finnhubApiKey', e.target.value)}
                placeholder="Enter default Finnhub key"
                variant="outlined"
                sx={fieldStyles}
              />
              <Typography sx={{ color: '#999999', fontSize: '0.8rem' }}>
                These defaults are used when adding new widgets or when widget-specific keys are left empty.
              </Typography>
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