import React, { useState, useContext } from 'react';
import { Box, Button } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { Clock } from './widgets/Clock';
import { Weather } from './widgets/Weather';
import { Calendar } from './widgets/Calendar';
import { News } from './widgets/News';
import { Notifications } from './Notifications';
import { SettingsPanel } from './SettingsPanel';
import { WidgetContext } from '../context/WidgetContext';

const GRID_ROWS = [
  { row: 1, colSpans: [3, 6, 3], positions: [0, 1, 2] },
  { row: 2, colSpans: [3, 6, 3], positions: [3, 4, 5] },
  { row: 3, colSpans: [12], positions: [6] },
];

const WIDGET_COMPONENTS = {
  clock: Clock,
  weather: Weather,
  calendar: Calendar,
  news: News,
};

export const Dashboard = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, layout } = useContext(WidgetContext);
  const widgets = layout.widgets;

  const renderWidget = (widgetType) => {
    if (!widgetType) return null;

    const WidgetComponent = WIDGET_COMPONENTS[widgetType];
    if (!WidgetComponent) return null;

    if (widgetType === 'weather') {
      return <WidgetComponent apiKey={settings.openweatherApiKey} location={settings.location} />;
    } else if (widgetType === 'news') {
      return <WidgetComponent apiKey={settings.newsApiKey} />;
    } else if (widgetType === 'calendar') {
      return <WidgetComponent icsUrl={settings.icsUrl} />;
    } else {
      return <WidgetComponent />;
    }
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
          transition: 'background-color 0.3s'
        }}
      >
        <SettingsIcon sx={{ fontSize: 30 }} />
      </Button>

      {/* Main Content Area - Full viewport without scrolling */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3, height: '100%' }}>
          {GRID_ROWS.map((row) =>
            row.positions.map((position, index) => (
              <Box
                key={position}
                sx={{
                  gridColumn: { xs: '1', md: `span ${row.colSpans[index]}` },
                  minHeight: '300px',
                  overflow: 'hidden',
                }}
              >
                {renderWidget(widgets[position])}
              </Box>
            ))
          )}
        </Box>
      </Box>

      {/* Notifications */}
      <Notifications />

      {/* Settings Modal */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  );
};
