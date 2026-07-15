import { useState, useCallback } from 'react';
import api from '../api/axios';

/**
 * useWeather — custom hook that fetches current weather from the backend proxy.
 *
 * Returns: { weather, forecast, loading, error, searchCity }
 */
export function useWeather(initialCity = '') {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchCity = useCallback(async (city) => {
    if (!city?.trim()) return;
    setLoading(true);
    setError('');
    setWeather(null);
    setForecast(null);

    try {
      // Fire both requests in parallel
      const [currentRes, forecastRes] = await Promise.all([
        api.get(`/weather/current/?city=${encodeURIComponent(city.trim())}`),
        api.get(`/weather/forecast/?city=${encodeURIComponent(city.trim())}`),
      ]);
      setWeather(currentRes.data);
      setForecast(forecastRes.data?.forecast ?? []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setError(`City "${city}" not found. Please check the spelling and try again.`);
      } else if (status === 503) {
        setError('Weather service is not configured. Please contact support.');
      } else if (status === 502) {
        setError('Could not reach the weather service. Please try again later.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { weather, forecast, loading, error, searchCity };
}
