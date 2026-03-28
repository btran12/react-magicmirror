import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Widget } from '../Widget';
import { WidgetContext } from '../../context/WidgetContext';

export const Clock = () => {
  const { settings } = useContext(WidgetContext);
  const [time, setTime] = useState(new Date());
  const [format24, setFormat24] = useState(settings.clockFormat === '24h');

  useEffect(() => {
    setFormat24(settings.clockFormat === '24h');
  }, [settings.clockFormat]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <Widget widgetType="clock">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
        {/* Date */}
        <Typography fontWeight={'light'} fontSize={'clamp(1rem, 1.5vw, 1.75rem)'} fontFamily={'monospace'} color={'#888888'}>
          {dateString}
        </Typography>
        
        {/* Time */}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'left', gap: 0.5 }}>
          <Typography fontWeight={'light'} fontSize={'clamp(2rem, 3.5vw, 3.75rem)'} fontFamily={'monospace'}>
            {hours}:{minutes}
          </Typography>
          <Typography fontWeight={'light'} fontSize={'clamp(1rem, 1.5vw, 1.75rem)'} fontFamily={'monospace'} color={'#888888'}>
            {seconds}
          </Typography>
          <Typography fontFamily={'monospace'} fontSize={'clamp(1rem, 1.8vw, 2rem)'} color={'#888888'} marginLeft={1}>
            {!format24 && ampm}
          </Typography>
        </Box>
      </Box>
    </Widget>
  );
};
