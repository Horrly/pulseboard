import { useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const CATEGORIES = ['general', 'technology', 'business', 'sports', 'health', 'entertainment'];

/**
 * useNews — fetches headlines or searches topics via the backend proxy.
 *
 * Returns:
 *   { articles, loading, error, category, changeCategory, CATEGORIES,
 *     searchQuery, searchNews, clearSearch, isSearchMode }
 */
export function useNews(initialCategory = 'general', country = 'ng') {
  const [articles, setArticles]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [category, setCategory]   = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // ── Error mapper ─────────────────────────────────────────────────────────
  const mapError = (err) => {
    const s = err?.response?.status;
    if (s === 503) return 'News service is not configured. Please add a valid NEWS_API_KEY.';
    if (s === 429) return 'News rate limit reached. Please try again in a few minutes.';
    if (s === 502) return 'Could not reach the news service. Please try again later.';
    if (s === 400) return err?.response?.data?.detail || 'Invalid request.';
    return 'Failed to load news. Please try again.';
  };

  // ── Fetch headlines by category ────────────────────────────────────────
  const fetchNews = useCallback(async (cat) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(
        `/news/?category=${encodeURIComponent(cat)}&country=${encodeURIComponent(country)}`
      );
      setArticles(res.data ?? []);
    } catch (err) {
      setError(mapError(err));
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [country]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search by free-text query ──────────────────────────────────────────
  const searchNews = useCallback(async (q) => {
    const trimmed = q?.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    setIsSearchMode(true);
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/news/search/?q=${encodeURIComponent(trimmed)}`);
      setArticles(res.data ?? []);
    } catch (err) {
      setError(mapError(err));
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Clear search → return to category feed ────────────────────────────
  const clearSearch = useCallback(() => {
    setIsSearchMode(false);
    setSearchQuery('');
    fetchNews(category);
  }, [category, fetchNews]);

  // ── Fetch on category change (only when not in search mode) ──────────
  const changeCategory = useCallback((cat) => {
    if (!CATEGORIES.includes(cat)) return;
    setCategory(cat);
    setIsSearchMode(false);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    if (!isSearchMode) {
      fetchNews(category);
    }
  }, [category, isSearchMode, fetchNews]);

  return {
    articles, loading, error,
    category, changeCategory, CATEGORIES,
    searchQuery, searchNews, clearSearch, isSearchMode,
  };
}
