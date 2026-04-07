import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SettingsIcon from '@mui/icons-material/Settings';
import { Clock } from './widgets/Clock';
import { Weather } from './widgets/Weather';
import { Calendar } from './widgets/Calendar';
import { News } from './widgets/News';
import { Holidays } from './widgets/Holidays';
import { Reddit } from './widgets/Reddit';
import { Compliments } from './widgets/Compliments';
import { Stocks } from './widgets/Stocks';
import { Crypto } from './widgets/Crypto';
import { AirQuality } from './widgets/AirQuality';
import { Sports } from './widgets/Sports';
import { Animations } from './widgets/Animations';
import { Notifications } from './Notifications';
import { SettingsPanel } from './SettingsPanel';
import { WidgetSettingsForm } from './WidgetSettingsForm';
import {
  createWidgetSettingsForType,
  getLayoutPreset,
  getPositionLabel,
  WIDGET_LABELS,
  WIDGET_OPTIONS,
} from './widgetConfig';
import { WidgetContext } from '../context/WidgetContext';

const WIDGET_COMPONENTS = {
  clock: Clock,
  weather: Weather,
  calendar: Calendar,
  news: News,
  holidays: Holidays,
  reddit: Reddit,
  compliments: Compliments,
  stocks: Stocks,
  crypto: Crypto,
  airquality: AirQuality,
  sports: Sports,
  animations: Animations,
};

export const Dashboard = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSettingsButton, setShowSettingsButton] = useState(false);
  const [hoveredPosition, setHoveredPosition] = useState(null);
  const [slotEditor, setSlotEditor] = useState({
    open: false,
    position: null,
    widgetType: '',
    settings: null,
  });
  const { layout, settings, getWidgetSettingsForPosition, saveWidgetConfiguration } = useContext(WidgetContext);
  const settingsButtonHideTimerRef = useRef(null);
  const widgets = layout.widgets;
  const activeLayoutPreset = getLayoutPreset(layout.preset);
  const gridRows = activeLayoutPreset.rows;
  const widgetChoices = WIDGET_OPTIONS.filter((option) => option.value);

  useEffect(() => {
    const scheduleHide = () => {
      if (settingsButtonHideTimerRef.current) {
        clearTimeout(settingsButtonHideTimerRef.current);
      }

      settingsButtonHideTimerRef.current = setTimeout(() => {
        setShowSettingsButton(false);
      }, 5000);
    };

    const handleMouseMove = () => {
      setShowSettingsButton(true);
      scheduleHide();
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (settingsButtonHideTimerRef.current) {
        clearTimeout(settingsButtonHideTimerRef.current);
      }
    };
  }, []);

  const renderWidget = (position, widgetType) => {
    if (!widgetType) return null;

    const WidgetComponent = WIDGET_COMPONENTS[widgetType];
    if (!WidgetComponent) return null;

    const widgetSettings = getWidgetSettingsForPosition(position, widgetType) || {};

    if (widgetType === 'weather') {
      return (
        <WidgetComponent
          apiKey={widgetSettings.openweatherApiKey || settings.openweatherApiKey}
          location={widgetSettings.location}
          tempUnit={widgetSettings.tempUnit}
          clockFormat={widgetSettings.clockFormat}
          pollIntervalMinutes={widgetSettings.weatherPollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'news') {
      return (
        <WidgetComponent
          apiKey={widgetSettings.newsApiKey || settings.newsApiKey}
          currentsApiKey={widgetSettings.currentsApiKey || settings.currentsApiKey}
          pollIntervalMinutes={widgetSettings.newsPollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'reddit') {
      return (
        <WidgetComponent
          subreddits={widgetSettings.redditSubreddits}
          titlesPerSubreddit={widgetSettings.redditTitlesPerSubreddit}
          pollIntervalMinutes={widgetSettings.redditPollIntervalMinutes}
          rotationIntervalSeconds={widgetSettings.redditRotationIntervalSeconds}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'compliments') {
      return (
        <WidgetComponent
          configUrl={widgetSettings.complimentsConfigUrl}
          weatherApiKey={widgetSettings.openweatherApiKey || settings.openweatherApiKey}
          location={widgetSettings.location}
          pollIntervalMinutes={widgetSettings.complimentsPollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'calendar') {
      return (
        <WidgetComponent
          icsUrl={widgetSettings.icsUrl}
          pollIntervalMinutes={widgetSettings.calendarPollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'clock') {
      return <WidgetComponent clockFormat={widgetSettings.clockFormat} showFade={widgetSettings.showFade} />;
    } else if (widgetType === 'stocks') {
      return (
        <WidgetComponent
          apiKey={widgetSettings.finnhubApiKey || settings.finnhubApiKey}
          tickers={widgetSettings.stockTickers || []}
          pollIntervalMinutes={widgetSettings.stocksPollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'crypto') {
      return (
        <WidgetComponent
          coins={widgetSettings.cryptoCoins || ['bitcoin', 'ethereum']}
          pollIntervalMinutes={widgetSettings.cryptoPollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'airquality') {
      return (
        <WidgetComponent
          apiKey={widgetSettings.openweatherApiKey || settings.openweatherApiKey}
          location={widgetSettings.location}
          pollIntervalMinutes={widgetSettings.airQualityPollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'sports') {
      return (
        <WidgetComponent
          leagues={widgetSettings.sportsLeagues || []}
          teams={widgetSettings.sportsTeams || ''}
          livePollIntervalMinutes={widgetSettings.sportsLivePollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'holidays') {
      return (
        <WidgetComponent
          apiKey={widgetSettings.apiNinjasApiKey || settings.apiNinjasApiKey}
          pollIntervalMinutes={widgetSettings.holidaysPollIntervalMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else if (widgetType === 'animations') {
      return (
        <WidgetComponent
          animationType={widgetSettings.animationType}
          rotationIntervalMinutes={widgetSettings.animationRotationMinutes}
          showFade={widgetSettings.showFade}
        />
      );
    } else {
      return <WidgetComponent />;
    }
  };

  const closeSlotEditor = () => {
    setSlotEditor({
      open: false,
      position: null,
      widgetType: '',
      settings: null,
    });
  };

  const openSlotEditor = (position) => {
    const widgetType = widgets[position] || '';
    const currentSettings = widgetType
      ? { ...getWidgetSettingsForPosition(position, widgetType) }
      : null;

    setSlotEditor({
      open: true,
      position,
      widgetType,
      settings: currentSettings,
    });
  };

  const handleSlotWidgetTypeChange = (nextWidgetType) => {
    setSlotEditor((prev) => ({
      ...prev,
      widgetType: nextWidgetType,
      settings: nextWidgetType
        ? {
            ...(getWidgetSettingsForPosition(prev.position, nextWidgetType)
              || createWidgetSettingsForType(nextWidgetType)),
          }
        : null,
    }));
  };

  const handleSlotSettingChange = (key, value) => {
    setSlotEditor((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        widgetType: prev.widgetType,
        [key]: value,
      },
    }));
  };

  const handleSlotSave = () => {
    if (slotEditor.position == null || !slotEditor.widgetType || !slotEditor.settings) return;

    saveWidgetConfiguration(slotEditor.position, slotEditor.widgetType, slotEditor.settings);
    closeSlotEditor();
  };

  const handleSlotRemove = () => {
    if (slotEditor.position == null) return;

    saveWidgetConfiguration(slotEditor.position, null, null);
    closeSlotEditor();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', bgcolor: '#000000', overflow: 'hidden' }}>
      {/* Settings Button - Fixed Position */}
      <Button
        onClick={() => setSettingsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 50,
          px: 2,
          py: 1,
          color: '#ffffff',
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&:hover': { bgcolor: '#b1b1b1' },
          transition: 'background-color 0.3s, opacity 0.35s ease',
          opacity: showSettingsButton ? 1 : 0,
          pointerEvents: showSettingsButton ? 'auto' : 'none',
        }}
      >
        <SettingsIcon sx={{ fontSize: 30 }} />
      </Button>

      {/* Main Content Area - Full viewport without scrolling */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gridTemplateRows: activeLayoutPreset.gridTemplateRows, gap: 2, height: '100%' }}>
          {gridRows.map((row) =>
            row.positions.map((position, index) => (
              <Box
                key={position}
                sx={{
                  gridColumn: { xs: '1', md: `span ${row.colSpans[index]}` },
                  minHeight: 0,
                  height: '100%',
                  overflow: 'visible',
                }}
              >
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => openSlotEditor(position)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openSlotEditor(position);
                    }
                  }}
                  onMouseEnter={() => setHoveredPosition(position)}
                  onMouseLeave={() => setHoveredPosition((current) => (current === position ? null : current))}
                  sx={{
                    position: 'relative',
                    height: '100%',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease',
                    transform: hoveredPosition === position ? 'translateY(-8px)' : 'translateY(0)',
                    boxShadow: hoveredPosition === position
                      ? '0 22px 48px rgba(0, 0, 0, 0.45)'
                      : '0 0 0 rgba(0, 0, 0, 0)',
                    zIndex: hoveredPosition === position ? 4 : 1,
                    border: '1px solid rgba(255,255,255,0)',
                    borderColor: hoveredPosition === position
                      ? 'rgba(255,255,255,0.95)'
                      : undefined,
                    // bgcolor: widgets[position] ? 'transparent' : 'rgba(255,255,255,0.03)',
                    outline: 'none',
                    '&:focus-visible': {
                      borderColor: '#2196f3',
                      boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.35)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      px: 1.25,
                      py: 0.5,
                      borderRadius: '999px',
                      bgcolor: 'rgba(0, 0, 0, 0.65)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      opacity: hoveredPosition === position ? 1 : 0,
                      transform: hoveredPosition === position ? 'translateY(0)' : 'translateY(4px)',
                      transition: 'opacity 180ms ease, transform 180ms ease',
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography sx={{ color: '#ffffff', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {widgets[position] ? 'Edit Widget' : 'Add Widget'}
                    </Typography>
                  </Box>

                  {widgets[position] ? (
                    renderWidget(position, widgets[position])
                  ) : (
                    hoveredPosition === position ? (
                      <Stack
                        spacing={1}
                        sx={{
                          height: '100%',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          px: 3,
                          textAlign: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.14)',
                          }}
                        >
                          <AddRoundedIcon sx={{ fontSize: 30, color: '#ffffff' }} />
                        </Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
                          Add a widget
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: '#9a9a9a', maxWidth: '220px' }}>
                          Choose a widget for {getPositionLabel(position, layout.preset)} and configure its settings.
                        </Typography>
                      </Stack>
                    ) : null
                  )}
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Notifications */}
      <Notifications />

      <Dialog
        open={slotEditor.open}
        onClose={closeSlotEditor}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle sx={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 'bold', pb: 1 }}>
          {slotEditor.widgetType
            ? `${WIDGET_LABELS[slotEditor.widgetType]} · ${getPositionLabel(slotEditor.position, layout.preset)}`
            : `Add Widget · ${getPositionLabel(slotEditor.position, layout.preset)}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, overflowY: 'auto' }}>
          <Stack spacing={3}>
            <FormControl variant="outlined" fullWidth>
              <InputLabel sx={{ color: '#cccccc' }}>Widget</InputLabel>
              <Select
                value={slotEditor.widgetType}
                onChange={(event) => handleSlotWidgetTypeChange(event.target.value)}
                label="Widget"
                sx={{
                  color: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
                  '& .MuiSvgIcon-root': { color: '#ffffff' },
                }}
                MenuProps={{
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
                }}
              >
                {widgetChoices.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {slotEditor.widgetType && slotEditor.settings ? (
              <WidgetSettingsForm
                widgetType={slotEditor.widgetType}
                settings={slotEditor.settings}
                onChange={handleSlotSettingChange}
              />
            ) : (
              <Box
                sx={{
                  borderRadius: '18px',
                  border: '1px dashed rgba(255,255,255,0.14)',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  px: 3,
                  py: 4,
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ color: '#ffffff', fontSize: '1rem', fontWeight: 600, mb: 1 }}>
                  Choose a widget to place here
                </Typography>
                <Typography sx={{ color: '#9a9a9a', fontSize: '0.85rem' }}>
                  After selecting a widget, its individual settings will appear below.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          {widgets[slotEditor.position] && (
            <Button
              onClick={handleSlotRemove}
              variant="outlined"
              sx={{
                mr: 'auto',
                color: '#ff6b6b',
                borderColor: 'rgba(255, 107, 107, 0.45)',
                '&:hover': { borderColor: '#ff6b6b', bgcolor: 'rgba(255, 107, 107, 0.08)' },
              }}
            >
              Remove Widget
            </Button>
          )}
          <Button
            onClick={closeSlotEditor}
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
            onClick={handleSlotSave}
            disabled={!slotEditor.widgetType || !slotEditor.settings}
            variant="contained"
            sx={{
              bgcolor: '#2196f3',
              color: '#ffffff',
              '&:hover': { bgcolor: '#1976d2' },
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Modal */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
};
