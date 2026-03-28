import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';

export const News = ({ apiKey }) => {
  const [articles, setArticles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const POLL_INTERVAL = 30 * 60 * 1000; // 30 minutes
  const ROTATION_INTERVAL = 15 * 1000; // 15 seconds

  // Fetch news every 30 minutes
  useEffect(() => {
    if (!apiKey) {
      setError('API key not configured');
      setLoading(false);
      return;
    }

    const fetchNews = async () => {
      try {
        setLoading(true);
        const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        setArticles(data.articles?.slice(0, 10) || []);
        setCurrentIndex(0);
        setError(null);
      } catch (err) {
        setError(err.message);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const pollInterval = setInterval(fetchNews, POLL_INTERVAL);
    return () => clearInterval(pollInterval);
  }, [apiKey]);

  // Rotate through headlines every 15 seconds
  useEffect(() => {
    if (articles.length === 0) return;

    const rotationInterval = setInterval(() => {
      // Fade out
      setIsFading(true);
      
      // Change article and fade in after 500ms
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % articles.length);
        setIsFading(false);
      }, 500);
    }, ROTATION_INTERVAL);

    return () => clearInterval(rotationInterval);
  }, [articles.length]);

  const currentArticle = articles[currentIndex];

  return (
    <Widget title="Top Headlines" widgetType="news">
      {loading && (
        <Typography sx={{ color: '#888888' }}>Loading news...</Typography>
      )}
      {error && (
        <Typography sx={{ color: '#ff6b6b' }}>{error}</Typography>
      )}
      {!loading && !error && articles.length === 0 && (
        <Typography sx={{ color: '#888888' }}>No articles found</Typography>
      )}
      {!loading && !error && articles.length > 0 && currentArticle && (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 2 }}>
          {/* Metadata - Published at and source */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1, opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography sx={{ fontSize: '1rem', color: '#666666' }}>
                {new Date(currentArticle.publishedAt).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '1rem', color: '#aaaaaa' }}>
              {currentArticle.source.name}
            </Typography>
          </Box>

          {/* Headline */}
          <Typography
            sx={{
              fontSize: '2rem',
              fontWeight: 'light',
              color: '#ffffff',
              lineHeight: 1.2,
              fontFamily: 'monospace',
              letterSpacing: '1px',
              opacity: isFading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            {currentArticle.title}
          </Typography>

          {/* Article counter */}
          <Box sx={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease-in-out' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#888888' }}>
              {currentIndex + 1} of {articles.length}
            </Typography>
          </Box>
        </Box>
      )}
    </Widget>
  );
};
