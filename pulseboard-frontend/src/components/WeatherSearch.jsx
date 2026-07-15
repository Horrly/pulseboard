import { useState } from 'react';

/**
 * WeatherSearch — City search bar with animated submit button.
 *
 * Fix: replaced CSS variable-based theming (which was never injected) with
 * explicit isDark-aware inline styles so the input is always visible.
 *
 * Props:
 *   onSearch(city: string) — called when the form is submitted
 *   loading: boolean       — disables the button during fetches
 *   isDark: boolean        — drives input colour scheme
 */
export default function WeatherSearch({ onSearch, loading, isDark }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  // Explicit dark/light colours — no CSS variable dependency
  const inputBg     = isDark ? '#1e293b' : '#f8fafc';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0';
  const inputColor  = isDark ? '#f1f5f9' : '#0f172a';
  const placeholderOpacity = isDark ? 0.35 : 0.5;

  return (
    <form
      id="weather-search-form"
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '0.5rem', width: '100%' }}
    >
      <div style={{ position: 'relative', flex: 1 }}>
        {/* Search icon */}
        <span style={{
          position: 'absolute',
          left: '0.875rem',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '1rem',
          pointerEvents: 'none',
          opacity: placeholderOpacity,
          userSelect: 'none',
        }}>
          🔍
        </span>
        <input
          id="weather-city-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const trimmed = value.trim();
              if (trimmed && !loading) onSearch(trimmed);
            }
          }}
          placeholder="Search city… e.g. Lagos, Abuja"
          autoComplete="off"
          disabled={loading}
          style={{
            width: '100%',
            paddingLeft: '2.5rem',
            paddingRight: '1rem',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem',
            borderRadius: '0.875rem',
            border: `1.5px solid ${inputBorder}`,
            background: inputBg,
            color: inputColor,
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
            opacity: loading ? 0.6 : 1,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6366f1';
            e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.18)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = inputBorder;
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
      <button
        id="weather-search-btn"
        type="submit"
        disabled={loading || !value.trim()}
        style={{
          padding: '0.625rem 1.25rem',
          borderRadius: '0.875rem',
          background: (loading || !value.trim())
            ? (isDark ? '#334155' : '#cbd5e1')
            : 'linear-gradient(135deg, #6366f1, #06b6d4)',
          color: (loading || !value.trim())
            ? (isDark ? '#64748b' : '#94a3b8')
            : '#fff',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s, transform 0.15s, background 0.2s',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxShadow: (loading || !value.trim()) ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
        }}
        onMouseEnter={(e) => {
          if (!loading && value.trim()) e.currentTarget.style.transform = 'scale(1.03)';
        }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {loading ? '…' : 'Search'}
      </button>
    </form>
  );
}
