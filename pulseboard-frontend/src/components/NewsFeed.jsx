import NewsCard from './NewsCard';
import NewsCategoryTabs from './NewsCategoryTabs';

/**
 * NewsFeed — Full news section with category tabs + card grid.
 *
 * Props:
 *   articles       — array of article objects
 *   loading        — boolean
 *   error          — string
 *   category       — active category string
 *   categories     — all category strings
 *   onCategoryChange(cat) — handler
 *   isDark         — boolean
 */
export default function NewsFeed({
  articles,
  loading,
  error,
  category,
  categories,
  onCategoryChange,
  isDark,
}) {
  return (
    <section id="news-feed" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
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
            {category.charAt(0).toUpperCase() + category.slice(1)} News
          </h2>
        </div>
        {!loading && articles.length > 0 && (
          <span style={{
            fontSize: '0.72rem',
            color: isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8',
            alignSelf: 'flex-end',
          }}>
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Category tabs ────────────────────────────────────────────────────── */}
      <NewsCategoryTabs
        categories={categories}
        activeCategory={category}
        onChange={onCategoryChange}
        isDark={isDark}
      />

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
          borderRadius: '1.25rem',
          padding: '1.5rem',
          background: 'rgba(239,68,68,0.07)',
          border: '1.5px solid rgba(239,68,68,0.2)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
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
          borderRadius: '1.25rem',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
        }}>
          <p style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>📭</p>
          <p style={{ margin: 0, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>
            No articles found
          </p>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>
            Try a different category or check back later.
          </p>
        </div>
      )}

      {/* ── Article card grid ─────────────────────────────────────────────────── */}
      {!loading && !error && articles.length > 0 && (
        <div
          id="news-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
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
