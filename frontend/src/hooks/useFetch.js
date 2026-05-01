import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * Generic data-fetching hook.
 * @param {string} url - API endpoint
 * @param {object} options - { immediate: bool, params: object }
 * @returns {{ data, loading, error, refetch }}
 */
export function useFetch(url, options = {}) {
  const { immediate = true, params = {} } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url, {
        params: overrideParams || params,
      });
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      return null;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
