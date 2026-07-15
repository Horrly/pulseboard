import { useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const CATEGORIES = ['general', 'technology', 'business', 'sports', 'health', 'entertainment'];

/**
 * useNews — fetches top-headlines from the backend proxy.
 *
 * Returns: { articles, loading, error, category, setCategory }
 */
export function useNews(initialCategory = 'general', country = 'ng') {
  const [articles, setArticles]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [category, setCategory]   = useState(initialCategory);

  const fetchNews = useCallback(async (cat) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(
        `/news/?category=${encodeURIComponent(cat)}&country=${encodeURIComponent(country)}`
      );
      setArticles(res.data ?? []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 503) {
        setError('News service is not configured. Please add a valid NEWS_API_KEY.');
      } else if (status === 429) {
        setError('News rate limit reached. Please try again in a few minutes.');
      } else if (status === 502) {
        setError('Could not reach the news service. Please try again later.');
      } else {
        setError('Failed to load news. Please try again.');
      }
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [country]);

  // Fetch whenever category changes
  useEffect(() => {
    fetchNews(category);
  }, [category, fetchNews]);

  const changeCategory = useCallback((cat) => {
    if (CATEGORIES.includes(cat)) setCategory(cat);
  }, []);

  return { articles, loading, error, category, changeCategory, CATEGORIES };
}
