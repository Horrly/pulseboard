/**
 * NewsCategoryTabs — Horizontal scrollable category pill tabs.
 *
 * Props:
 *   categories     — string[]
 *   activeCategory — string
 *   onChange(cat)  — called on tab click
 *   isDark         — boolean
 */
export default function NewsCategoryTabs({ categories, activeCategory, onChange, isDark }) {
  const labels = {
    general:       '🌐 General',
    technology:    '💻 Tech',
    business:      '💼 Business',
    sports:        '⚽ Sports',
    health:        '🏥 Health',
    entertainment: '🎬 Entertainment',
    science:       '🔬 Science',
  };

  return (
    <div
      id="news-category-tabs"
      style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        scrollbarWidth: 'none',
      }}
    >
      {categories.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <button
            key={cat}
            id={`news-tab-${cat}`}
            onClick={() => onChange(cat)}
            style={{
              flexShrink: 0,
              padding: '0.45rem 1rem',
              borderRadius: '2rem',
              border: isActive
                ? '1.5px solid transparent'
                : `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              background: isActive
                ? 'linear-gradient(135deg, #6366f1, #06b6d4)'
                : isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              color: isActive
                ? '#ffffff'
                : isDark ? 'rgba(255,255,255,0.6)' : '#475569',
              fontSize: '0.78rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
              letterSpacing: isActive ? '0.01em' : '0',
              boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255,255,255,0.09)'
                  : '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255,255,255,0.04)'
                  : '#f8fafc';
              }
            }}
          >
            {labels[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        );
      })}
    </div>
  );
}
