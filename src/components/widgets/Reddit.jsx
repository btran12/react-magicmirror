import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';

const DEFAULT_SUBREDDITS = [];
const DEFAULT_TITLES_PER_SUBREDDIT = 5;
const DEFAULT_POLL_INTERVAL_MINUTES = 30;
const DEFAULT_ROTATION_INTERVAL_SECONDS = 15;
const MAX_TOTAL_TITLES = 100;

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const parseSubreddits = (value) => {
  if (!value || typeof value !== 'string') return DEFAULT_SUBREDDITS;

  const parsed = value
    .split(',')
    .map((item) => item.trim().replace(/^r\//i, '').replace(/\s+/g, ''))
    .filter(Boolean);

  if (parsed.length === 0) return DEFAULT_SUBREDDITS;

  return Array.from(new Set(parsed));
};

export const Reddit = ({
  subreddits = DEFAULT_SUBREDDITS.join(','),
  titlesPerSubreddit = DEFAULT_TITLES_PER_SUBREDDIT,
  pollIntervalMinutes = DEFAULT_POLL_INTERVAL_MINUTES,
  rotationIntervalSeconds = DEFAULT_ROTATION_INTERVAL_SECONDS,
  showFade = false,
}) => {
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef(null);

  const normalizedSubreddits = useMemo(() => parseSubreddits(subreddits), [subreddits]);
  const normalizedTitlesPerSubreddit = clamp(Number(titlesPerSubreddit), 1, 25);
  const normalizedPollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;
  const normalizedRotationIntervalMs = clamp(Number(rotationIntervalSeconds), 2, 300) * 1000;

  useEffect(() => {
    const fetchSubredditPosts = async (subreddit) => {
      const url = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/top.json?t=day&limit=${normalizedTitlesPerSubreddit}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'react-magicmirror/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch r/${subreddit}`);
      }

      const data = await response.json();
      const children = Array.isArray(data?.data?.children) ? data.data.children : [];

      return children
        .map((item) => item?.data)
        .filter((item) => item?.title)
        .map((item) => ({
          id: item.id,
          title: item.title,
          permalink: item.permalink,
          url: item.url,
          subreddit: item.subreddit,
          source: `Reddit - r/${item.subreddit}`,
          publishedAt: new Date(item.created_utc * 1000).toISOString(),
        }));
    };

    const fetchReddit = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = await Promise.allSettled(
          normalizedSubreddits.map((subreddit) => fetchSubredditPosts(subreddit))
        );

        const merged = [];
        const seen = new Set();

        results.forEach((result) => {
          if (result.status !== 'fulfilled') return;

          result.value.forEach((post) => {
            const key = post.id || post.permalink || `${post.title}-${post.publishedAt}`;
            if (!seen.has(key) && merged.length < MAX_TOTAL_TITLES) {
              seen.add(key);
              merged.push(post);
            }
          });
        });

        if (merged.length === 0) {
          setError('No Reddit posts found for the configured subreddits.');
          setPosts([]);
          return;
        }

        setPosts(merged);
        setCurrentIndex(0);
      } catch (err) {
        setError(err.message || 'Failed to fetch Reddit posts');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReddit();
    const pollInterval = setInterval(fetchReddit, normalizedPollIntervalMs);

    return () => {
      clearInterval(pollInterval);
    };
  }, [normalizedPollIntervalMs, normalizedSubreddits, normalizedTitlesPerSubreddit]);

  useEffect(() => {
    if (posts.length === 0) return undefined;

    const rotationInterval = setInterval(() => {
      setIsFading(true);

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
        setIsFading(false);
      }, 500);
    }, normalizedRotationIntervalMs);

    return () => {
      clearInterval(rotationInterval);
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [normalizedRotationIntervalMs, posts.length]);

  const currentPost = posts[currentIndex];

  return (
    <Widget title="Reddit" widgetType="reddit" showFade={showFade}>
      {loading && <Typography sx={{ color: '#888888' }}>Loading Reddit posts...</Typography>}

      {!loading && error && (
        <Typography sx={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</Typography>
      )}

      {!loading && !error && posts.length === 0 && (
        <Typography sx={{ color: '#888888' }}>No posts found</Typography>
      )}

      {!loading && !error && currentPost && (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              pb: 1,
              opacity: isFading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            <Typography sx={{ fontSize: '0.95rem', color: '#666666' }}>
              {new Date(currentPost.publishedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: '#aaaaaa' }}>
              {currentPost.source}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 'clamp(1.1rem, 1.5vw, 1.8rem)',
              color: '#ffffff',
              lineHeight: 1.3,
              fontFamily: 'var(--font-family, monospace)',
              textAlign: 'center',
              opacity: isFading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            {currentPost.title}
          </Typography>

          <Box sx={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease-in-out', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#888888' }}>
              {currentIndex + 1} of {posts.length}
            </Typography>
          </Box>
        </Box>
      )}
    </Widget>
  );
};
