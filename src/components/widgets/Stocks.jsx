import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const isWeekday = () => {
  const day = new Date().getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
};

export const Stocks = ({ apiKey, tickers = [], pollIntervalMinutes = 5, showFade = false }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;

  useEffect(() => {
    const validTickers = tickers.filter(t => t && t.trim());

    if (!apiKey) {
      setError('Finnhub API key not configured');
      setLoading(false);
      return;
    }

    if (validTickers.length === 0) {
      setError('No tickers configured');
      setLoading(false);
      return;
    }

    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const results = await Promise.all(
          validTickers.map(async (symbol) => {
            const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol.trim())}&token=${apiKey}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${symbol}`);
            const data = await response.json();
            return {
              symbol: symbol.trim().toUpperCase(),
              price: data.c,
              change: data.d,
              changePercent: data.dp,
            };
          })
        );
        setQuotes(results);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
    const interval = setInterval(() => {
      if (isWeekday()) fetchQuotes();
    }, pollIntervalMs);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, pollIntervalMs, JSON.stringify(tickers)]);

  const formatPrice = (price) => {
    if (price == null || price === 0) return '—';
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change, changePercent) => {
    if (change == null) return '—';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent?.toFixed(2)}%)`;
  };

  return (
    <Widget widgetType="stocks" showFade={showFade}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {loading && (
          <Typography sx={{ color: '#888888' }}>Loading quotes...</Typography>
        )}

        {error && !loading && (
          <Typography sx={{ color: '#ff6b6b' }}>{error}</Typography>
        )}

        {!loading && !error && quotes.length > 0 && (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {quotes.map(({ symbol, price, change, changePercent }) => {
              const isPositive = change == null ? null : change >= 0;
              const changeColor =
                isPositive === null ? '#888888' : isPositive ? '#4caf50' : '#f44336';

              return (
                <Box
                  key={symbol}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.75,
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography
                    sx={{
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {symbol}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ color: '#aaaaaa', fontSize: '1rem', fontWeight: 500 }}>
                      {formatPrice(price)}
                    </Typography>
                    <Typography sx={{ color: changeColor, fontSize: '0.78rem' }}>
                      {formatChange(change, changePercent)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Widget>
  );
};
