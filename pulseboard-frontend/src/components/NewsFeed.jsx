import { useState } from 'react';
import NewsCard from './NewsCard';
import NewsCategoryTabs from './NewsCategoryTabs';

/**
 * NewsFeed — Full news section: search bar + category tabs + card grid.
 *
 * Props:
 *   articles           — array of article objects
 *   loading            — boolean
 *   error              — string
 *   category           — active category string
 *   categories         — all category strings
 *   onCategoryChange   — handler(cat)
 *   searchQuery        — current active search term ('' when in headline mode)
 *   onSearch(q)        — trigger search
 *   onClearSearch()    — clear search, back to headlines
 *   isSearchMode       — boolean
 *   isDark             — boolean
 */
export default function NewsFeed({
  articles,
  loading,
  error,
  category,
  categories,
  onCategoryChange,
  searchQuery,
  onSearch,
  onClearSearch,
  isSearchMode,
  isDark,
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) onSearch(q);
  };

  const handleClear = () => {
    setInputValue('');
    onClearSearch();
  };

  const inputBg     = isDark ? '#1e293b' : '#f8fafc';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const inputColor  = isDark ? '#f1f5f9' : '#0f172a';

  return (
    <section id="news-feed" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p style={{
            margin: 0,
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.38)',
          }}>
            📰 Top Headlines
          </p>
          <h2 style={{
            margin: '0.2rem 0 0',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: isDark ? '#f1f5f9' : '#0f172a',
            letterSpacing: '-0.01em',
          }}>
            {isSearchMode
              ? `Search: "${searchQuery}"`
              : `${category.charAt(0).toUpperCase() + category.slice(1)} News`}
          </h2>
        </div>
        {!loading && articles.length > 0 && (
          <span style={{ fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── News Search Bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <form
          id="news-search-form"
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', gap: '0.5rem' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{
              position: 'absolute', left: '0.875rem', top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.95rem', pointerEvents: 'none',
              opacity: isDark ? 0.35 : 0.45,
            }}>
              🔍
            </span>
            <input
              id="news-search-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search news topics… e.g. Tinubu, oil, elections"
              autoComplete="off"
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: inputValue ? '2.5rem' : '1rem',
                paddingTop: '0.55rem',
                paddingBottom: '0.55rem',
                borderRadius: '0.875rem',
                border: `1.5px solid ${isSearchMode ? '#6366f1' : inputBorder}`,
                background: inputBg,
                color: inputColor,
                fontSize: '0.875rem',
                outline: 'none',
                boxShadow: isSearchMode ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
              }}
              onBlur={(e) => {
                if (!isSearchMode) {
                  e.target.style.borderColor = inputBorder;
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {/* Clear X button inside input */}
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isDark ? 'rgba(255,255,255,0.4)' : '#94a3b8',
                  fontSize: '1rem', lineHeight: 1, padding: 0,
                }}
                aria-label="Clear input"
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="news-search-btn"
            type="submit"
            disabled={!inputValue.trim() || loading}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '0.875rem',
              background: (!inputValue.trim() || loading)
                ? (isDark ? '#334155' : '#e2e8f0')
                : 'linear-gradient(135deg, #6366f1, #06b6d4)',
              color: (!inputValue.trim() || loading)
                ? (isDark ? '#64748b' : '#94a3b8')
                : '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: (!inputValue.trim() || loading) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.2s, transform 0.15s',
              boxShadow: (!inputValue.trim() || loading) ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim() && !loading) e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Search
          </button>
        </form>

        {/* Active search banner */}
        {isSearchMode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.45rem 0.875rem',
            borderRadius: '0.75rem',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            fontSize: '0.8rem',
          }}>
            <span style={{ color: '#6366f1', fontWeight: 600 }}>
              Results for "{searchQuery}"
            </span>
            <button
              id="news-clear-search-btn"
              onClick={handleClear}
              style={{
                marginLeft: 'auto',
                background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '0.78rem',
                color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
                fontWeight: 500,
                padding: '0.1rem 0.4rem',
                borderRadius: '0.4rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              ✕ Clear search
            </button>
          </div>
        )}
      </div>

      {/* ── Category tabs (hidden during search mode) ────────────────────────── */}
      {!isSearchMode && (
        <NewsCategoryTabs
          categories={categories}
          activeCategory={category}
          onChange={onCategoryChange}
          isDark={isDark}
        />
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {loading && (
        <div id="news-loading" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: '1.25rem',
              overflow: 'hidden',
              background: isDark ? 'rgba(30,41,59,0.6)' : '#f8fafc',
              border: isDark ? '1.5px solid rgba(255,255,255,0.06)' : '1.5px solid #e2e8f0',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 100}ms`,
            }}>
              <div style={{ height: '180px', background: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }} />
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ height: '10px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0', width: '40%' }} />
                <div style={{ height: '14px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0' }} />
                <div style={{ height: '14px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0', width: '80%' }} />
                <div style={{ height: '10px', borderRadius: '4px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', width: '60%', marginTop: '0.25rem' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div id="news-error" style={{
          borderRadius: '1.25rem', padding: '1.5rem',
          background: 'rgba(239,68,68,0.07)',
          border: '1.5px solid rgba(239,68,68,0.2)',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: '#dc2626' }}>
              News unavailable
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#ef4444', opacity: 0.85 }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {!loading && !error && articles.length === 0 && (
        <div style={{
          borderRadius: '1.25rem', padding: '3rem 1.5rem', textAlign: 'center',
          border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
        }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>
            {isSearchMode ? '🔍' : '📭'}
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
            {isSearchMode ? `No results for "${searchQuery}"` : 'No articles found'}
          </p>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>
            {isSearchMode ? 'Try a different search term.' : 'Try a different category or check back later.'}
          </p>
          {isSearchMode && (
            <button onClick={handleClear} style={{
              marginTop: '1rem',
              padding: '0.4rem 1rem', borderRadius: '2rem',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#6366f1', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer',
            }}>
              Back to headlines
            </button>
          )}
        </div>
      )}

      {/* ── Article card grid ─────────────────────────────────────────────────── */}
      {!loading && !error && articles.length > 0 && (
        <div id="news-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {articles.map((article, i) => (
            <NewsCard
              key={article.url || i}
              article={article}
              isDark={isDark}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
