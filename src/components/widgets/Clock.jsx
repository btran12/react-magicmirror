import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';

export const Clock = ({ clockFormat = '24h', showFade = false }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const format24 = clockFormat === '24h';

  const hours = format24
    ? time.getHours().toString().padStart(2, '0')
    : (time.getHours() % 12 || 12).toString().padStart(2, '0');
  
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = format24 ? '' : (time.getHours() >= 12 ? 'PM' : 'AM');
  
  const dateString = time.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <Widget widgetType="clock" showFade={showFade}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        {/* Date */}
        <Typography fontWeight={'light'} fontSize={'clamp(1rem, 1.5vw, 1.75rem)'} fontFamily={'var(--font-family, monospace)'} color={'#888888'}>
          {dateString}
        </Typography>
        
        {/* Time */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'left', gap: 0.5 }}>
          <Typography fontWeight={'light'} fontSize={'clamp(2rem, 3.5vw, 3.75rem)'} fontFamily={'var(--font-family, monospace)'}>
            {hours}:{minutes}
          </Typography>
          <Typography fontWeight={'light'} fontSize={'clamp(1rem, 1.5vw, 1.75rem)'} fontFamily={'var(--font-family, monospace)'} color={'#888888'}>
            {seconds}
          </Typography>
          <Typography fontFamily={'var(--font-family, monospace)'} fontSize={'clamp(1rem, 1.8vw, 2rem)'} color={'#888888'} marginLeft={1}>
            {!format24 && ampm}
          </Typography>
        </Box>
      </Box>
    </Widget>
  );
};
