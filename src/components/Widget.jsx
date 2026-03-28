import React from 'react';
import { Box } from '@mui/material';

export const Widget = ({ widgetType, children, showFade = false }) => {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
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
