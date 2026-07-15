import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import DarkModeToggle from '../components/DarkModeToggle';
import WeatherSearch from '../components/WeatherSearch';
import WeatherCard from '../components/WeatherCard';
import ForecastChart from '../components/ForecastChart';
import ForecastDayCards from '../components/ForecastDayCards';
import NewsFeed from '../components/NewsFeed';
import { useWeather } from '../hooks/useWeather';
import { useNews } from '../hooks/useNews';

/**
 * Dashboard — Phase 4: News API Feed integrated.
 *
 * Layout (large screen):
 *   Top section (3-col grid):
 *     Left  (1/3) — Search + Current weather card
 *     Right (2/3) — 5-Day chart + Day cards
 *   Bottom section (full-width):
 *     News feed with category tabs + card grid
 */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isDark } = useDarkMode();
  const navigate   = useNavigate();

  const { weather, forecast, loading: weatherLoading, error: weatherError, searchCity } = useWeather();
  const { articles, loading: newsLoading, error: newsError, category, changeCategory, CATEGORIES } = useNews('general', 'ng');

  // Auto-load user's default city on mount
  useEffect(() => {
    if (user?.default_city) {
      searchCity(user.default_city);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.default_city]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const hasForecast = !weatherLoading && forecast?.length > 0 && !weatherError;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Helmet>
        <title>Dashboard · PulseBoard</title>
        <meta name="description" content="Your personal weather and news dashboard." />
      </Helmet>

      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-cyan-400">
          PulseBoard
        </span>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {user?.first_name || user?.email}
          </span>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Welcome banner ──────────────────────────────────────────────── */}
        <section className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Good to see you, {user?.first_name || 'there'} 👋
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Live weather, 5-day forecast, and top headlines — all in one place.
          </p>
        </section>

        {/* ── Preferences summary ─────────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: '🌡️',
              label: 'Temperature unit',
              value: user?.preferred_unit === 'F' ? '°F Fahrenheit' : '°C Celsius',
              color: 'from-orange-500/10 to-amber-500/10 border-orange-200 dark:border-orange-900',
            },
            {
              icon: '📍',
              label: 'Default city',
              value: user?.default_city || 'London',
              color: 'from-cyan-500/10 to-blue-500/10 border-cyan-200 dark:border-cyan-900',
            },
            {
              icon: '📰',
              label: 'News categories',
              value: user?.preferred_news_categories?.length
                ? user.preferred_news_categories.join(', ')
                : 'None selected',
              color: 'from-violet-500/10 to-indigo-500/10 border-violet-200 dark:border-violet-900',
            },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className={`rounded-2xl border bg-gradient-to-br ${color} p-5`}>
              <p className="text-2xl mb-2">{icon}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{value}</p>
            </div>
          ))}
        </section>

        {/* ── Weather grid ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* LEFT: Search + Current weather */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                🌍 Weather Search
              </p>
              <WeatherSearch onSearch={searchCity} loading={weatherLoading} />
            </div>

            {weatherLoading && (
              <div
                id="weather-loading"
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, #0f172a, #1e3a5f)',
                  minHeight: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{
                    width: '40px', height: '40px',
                    border: '3px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    margin: '0 auto 1rem',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>Fetching weather…</p>
                </div>
              </div>
            )}

            {!weatherLoading && weatherError && (
              <div
                id="weather-error"
                style={{
                  borderRadius: '1.25rem', padding: '1.25rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1.5px solid rgba(239,68,68,0.25)',
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#dc2626' }}>City not found</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#ef4444', opacity: 0.85 }}>{weatherError}</p>
                </div>
              </div>
            )}

            {!weatherLoading && weather && !weatherError && (
              <WeatherCard weather={weather} />
            )}

            {!weatherLoading && !weather && !weatherError && (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
                <span className="text-5xl">🌤️</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Weather Widget</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Search for a city above to see live weather</p>
              </div>
            )}
          </div>

          {/* RIGHT: Forecast chart + day cards */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {hasForecast ? (
              <>
                <div id="forecast-panel" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        📈 5-Day Temperature Forecast
                      </p>
                      {weather?.city && (
                        <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                          {weather.city}, {weather.country}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {[['#6366f1', 'Max'], ['#06b6d4', 'Min']].map(([color, label]) => (
                        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 600, color }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ForecastChart forecast={forecast} isDark={isDark} />
                </div>

                <div id="forecast-cards-panel" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
                    🗓️ Daily Breakdown
                  </p>
                  <ForecastDayCards forecast={forecast} isDark={isDark} />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center gap-3 min-h-[320px]">
                {weatherLoading ? (
                  <>
                    <div style={{ width: '36px', height: '36px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p className="text-sm text-slate-400 dark:text-slate-500">Loading forecast…</p>
                  </>
                ) : (
                  <>
                    <span className="text-5xl">📈</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">5-Day Forecast</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Search for a city to see the temperature chart</p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── News feed (full-width below weather) ────────────────────────── */}
        <section
          id="news-section"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
        >
          <NewsFeed
            articles={articles}
            loading={newsLoading}
            error={newsError}
            category={category}
            categories={CATEGORIES}
            onCategoryChange={changeCategory}
            isDark={isDark}
          />
        </section>

      </main>

      {/* Global keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
