import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const COIN_DISPLAY_NAMES = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  cardano: 'ADA',
  ripple: 'XRP',
  dogecoin: 'DOGE',
  polkadot: 'DOT',
  avalanche: 'AVAX',
  chainlink: 'LINK',
  litecoin: 'LTC',
};

const getCoinSymbol = (coinId) =>
  COIN_DISPLAY_NAMES[coinId.toLowerCase()] || coinId.toUpperCase();

export const Crypto = ({ coins = ['bitcoin', 'ethereum'], pollIntervalMinutes = 5, showFade = false }) => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;

  useEffect(() => {
    const validCoins = coins.filter((c) => c && c.trim());

    if (validCoins.length === 0) {
      setError('No coins configured');
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        setLoading(true);
        const ids = validCoins.map((c) => encodeURIComponent(c.trim().toLowerCase())).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        const results = validCoins
          .map((coinId) => {
            const id = coinId.trim().toLowerCase();
            const info = data[id];
            if (!info) return null;
            return {
              id,
              symbol: getCoinSymbol(id),
              price: info.usd,
              change24h: info.usd_24h_change,
              change24hUsd:
                info.usd != null && info.usd_24h_change != null
                  ? info.usd - (info.usd / (1 + info.usd_24h_change / 100))
                  : null,
            };
          })
          .filter(Boolean);

        setPrices(results);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, pollIntervalMs);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollIntervalMs, JSON.stringify(coins)]);

  const formatPrice = (price) => {
    if (price == null) return '—';
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatDollarChange = (change) => {
    if (change == null) return '—';
    const sign = change >= 0 ? '+' : '';
    return `${sign}$${Math.abs(change).toFixed(2)}`;
  };

  const formatPercentChange = (change) => {
    if (change == null) return '—';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <Widget widgetType="crypto" showFade={showFade}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {loading && (
          <Typography sx={{ color: '#888888' }}>Loading prices...</Typography>
        )}

        {error && !loading && (
          <Typography sx={{ color: '#ff6b6b' }}>{error}</Typography>
        )}

        {!loading && !error && prices.length > 0 && (
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {prices.map(({ id, symbol, price, change24h, change24hUsd }) => {
              const isPositive = change24h == null ? null : change24h >= 0;
              const changeColor =
                isPositive === null ? '#888888' : isPositive ? '#4caf50' : '#f44336';

              return (
                <Box
                  key={id}
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
                      {`${formatDollarChange(change24hUsd)} (${formatPercentChange(change24h)})`}
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
