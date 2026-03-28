import React, { useContext, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { WidgetContext } from '../context/WidgetContext';

export const Widget = ({ title, widgetType, children, className = '' }) => {
  const { fadeSettings } = useContext(WidgetContext);
  const showFade = widgetType && fadeSettings && fadeSettings[widgetType];
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsLoaded(true);
  }, []);

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', height: '100%', opacity: isLoaded ? 1 : 0, transition: 'opacity 1s ease-in-out' }}>
      <Box sx={{ color: '#ffffff', padding: 2, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        {children}
      </Box>
      {/* Fade overlay at bottom - configurable per widget */}
      {showFade && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
};
