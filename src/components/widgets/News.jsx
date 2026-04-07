import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const News = ({ apiKey, currentsApiKey, pollIntervalMinutes = 30, showFade = false }) => {
  const [articles, setArticles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const pollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;
  const ROTATION_INTERVAL = 15 * 1000; // 15 seconds
  const TARGET_HEADLINES = 30;

  // Fetch from Currents API
  const fetchFromCurrentsAPI = async (key) => {
    try {
      const url = `https://api.currentsapi.services/v1/latest-news?apikey=${encodeURIComponent(key)}&language=en&limit=100`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Currents API failed');
      }

      const data = await response.json();
      return Array.isArray(data.news) ? data.news : [];
    } catch (err) {
      console.warn('Currents API error:', err.message);
      return [];
    }
  };

  // Fetch from Reddit API
  const fetchFromRedditAPI = async () => {
    try {
      const subreddits = ['news', 'worldnews', 'UpliftingNews'];
      const allArticles = [];
      const seen = new Set();

      for (const subreddit of subreddits) {
        if (allArticles.length >= TARGET_HEADLINES) break;

        const url = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=50`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'react-magicmirror/1.0'
          }
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const posts = data.data?.children || [];

        posts.forEach((post) => {
          if (allArticles.length >= TARGET_HEADLINES) return;

          const item = post.data;
          const key = item.id;

          if (!seen.has(key) && item.title && !item.is_self) {
            seen.add(key);
            allArticles.push({
              title: item.title,
              url: item.url,
              source: `Reddit - r/${subreddit}`,
              published_at: new Date(item.created_utc * 1000).toISOString(),
              image: item.thumbnail && item.thumbnail !== 'self' ? item.thumbnail : null,
            });
          }
        });
      }

      return allArticles;
    } catch (err) {
      console.warn('Reddit API error:', err.message);
      return [];
    }
  };

  // Merge and deduplicate articles from both sources
  const mergeArticles = (currentsArticles, redditArticles) => {
    const combined = [];
    const seen = new Set();

    // Add Currents articles first
    currentsArticles.forEach((item) => {
      const key = item.url || item.title;
      if (!seen.has(key) && combined.length < TARGET_HEADLINES) {
        seen.add(key);
        combined.push({
          title: item.title,
          url: item.url,
          source: item.source || 'Currents News',
          published_at: item.published_at,
          image: item.image,
        });
      }
    });

    // Add Reddit articles if needed
    redditArticles.forEach((item) => {
      const key = item.url || item.title;
      if (!seen.has(key) && combined.length < TARGET_HEADLINES) {
        seen.add(key);
        combined.push(item);
      }
    });

    return combined;
  };

  // Fetch news every 30 minutes
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        let currentsArticles = [];
        let redditArticles = [];

        // Try Currents API first (primary)
        if (currentsApiKey) {
          currentsArticles = await fetchFromCurrentsAPI(currentsApiKey);
        }

        // Always try Reddit API (fallback/supplement)
        redditArticles = await fetchFromRedditAPI();

        // Merge results
        const combined = mergeArticles(currentsArticles, redditArticles);

        if (combined.length === 0) {
          setError('No articles found. Check API keys and try again.');
          setArticles([]);
        } else {
          setArticles(combined);
          setCurrentIndex(0);
        }
      } catch (err) {
        setError(err.message);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const pollInterval = setInterval(fetchNews, pollIntervalMs);
    return () => clearInterval(pollInterval);
  }, [currentsApiKey, pollIntervalMs]);

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
  const publishedAt = currentArticle?.published_at || currentArticle?.publishedAt;
  const sourceName =
    currentArticle?.source ||
    currentArticle?.source_name ||
    currentArticle?.source?.name ||
    'Unknown source';

  return (
    <Widget title="Top Headlines" widgetType="news" showFade={showFade}>
      {loading && (
        <Typography sx={{ color: '#888888' }}>Loading news...</Typography>
      )}
      {error && (
        <Typography sx={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</Typography>
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
                {publishedAt ? new Date(publishedAt).toLocaleString('en-US', {
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit'
                }) : 'Date unavailable'}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '1rem', color: '#aaaaaa' }}>
              {sourceName}
            </Typography>
          </Box>

          {/* Headline */}
          <Typography
            sx={{
              fontSize: 'clamp(1.2rem, 1.8vw, 2rem)',
              fontWeight: 'light',
              color: '#ffffff',
              lineHeight: 1.2,
              fontFamily: 'var(--font-family, monospace)',
              opacity: isFading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
              textAlign: 'center',
            }}
          >
            {currentArticle.title}
          </Typography>

          {/* Article counter */}
          <Box sx={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease-in-out', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#888888' }}>
              {currentIndex + 1} of {articles.length}
            </Typography>
          </Box>
        </Box>
      )}
    </Widget>
  );
};
