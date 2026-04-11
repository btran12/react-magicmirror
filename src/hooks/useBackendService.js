import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook for calling backend premium services
 * Handles JWT auth, premium checking, and error states
 *
 * @param {string} endpoint - Service endpoint path (e.g., '/v1/services/weather')
 * @param {Object} queryParams - Query parameters to pass to the endpoint
 * @param {number} pollIntervalMinutes - How often to refetch (default 5 minutes)
 * @returns {Object} { data, loading, error, refetch }
 */
export const useBackendService = (endpoint, queryParams = {}, pollIntervalMinutes = 5) => {
  const auth = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseEndpoint = import.meta.env.VITE_ENTITLEMENT_ENDPOINT?.replace(
    '/v1/entitlements/me',
    endpoint
  );

  const normalizedPollIntervalMs = Math.max(1, Math.min(1440, Number(pollIntervalMinutes))) * 60 * 1000;

  const buildUrl = () => {
    if (!baseEndpoint) return null;
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.append(key, value);
      }
    });
    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  };

  const fetchData = async () => {
    if (!auth.isAuthenticated) {
      setError('Log in to access this service');
      setLoading(false);
      return;
    }

    if (!baseEndpoint) {
      setError('Service endpoint not configured');
      setLoading(false);
      return;
    }

    const url = buildUrl();
    if (!url) {
      setError('Invalid query parameters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = auth.user?.accessToken;
      if (!accessToken) {
        setError('No access token available');
        setLoading(false);
        return;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          setError('Premium feature. Subscribe to access this service.');
        } else if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(errorData.message || `Service error: ${response.status}`);
        }
        setLoading(false);
        return;
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, normalizedPollIntervalMs);
    return () => clearInterval(interval);
  }, [endpoint, JSON.stringify(queryParams), pollIntervalMinutes, auth.isAuthenticated, auth.user?.accessToken]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
