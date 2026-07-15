import { useState } from 'react';

/**
 * WeatherSearch — City search bar with animated submit button.
 *
 * Props:
 *   onSearch(city: string) — called when the form is submitted
 *   loading: boolean       — disables the button during fetches
 */
export default function WeatherSearch({ onSearch, loading }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

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
          opacity: 0.5,
        }}>
          🔍
        </span>
        <input
          id="weather-city-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search city… e.g. Tokyo, New York"
          autoComplete="off"
          disabled={loading}
          style={{
            width: '100%',
            paddingLeft: '2.5rem',
            paddingRight: '1rem',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem',
            borderRadius: '0.875rem',
            border: '1.5px solid var(--search-border, #e2e8f0)',
            background: 'var(--search-bg, #f8fafc)',
            color: 'var(--search-color, #0f172a)',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6366f1';
            e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--search-border, #e2e8f0)';
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
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s, transform 0.15s',
          whiteSpace: 'nowrap',
          flexShrink: 0,
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
