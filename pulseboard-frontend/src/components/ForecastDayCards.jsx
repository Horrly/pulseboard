/**
 * ForecastDayCards — Row of 5 individual day cards below the chart.
 *
 * Props:
 *   forecast — array of { date, min_temp, max_temp, description, icon_code }
 *   isDark   — boolean for colour theming
 */
export default function ForecastDayCards({ forecast = [], isDark }) {
  if (!forecast.length) return null;

  const iconUrl = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;

  const formatDay = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDateShort = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const cardBase = {
    borderRadius: '1.25rem',
    padding: '1rem 0.75rem',
    textAlign: 'center',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    cursor: 'default',
    flex: '1 1 0',
    minWidth: 0,
  };

  const cardLight = {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  };

  const cardDark = {
    background: 'rgba(30,41,59,0.85)',
    border: '1.5px solid rgba(255,255,255,0.08)',
    boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
  };

  return (
    <div
      id="forecast-day-cards"
      style={{
        display: 'flex',
        gap: '0.625rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
      }}
    >
      {forecast.map((day, i) => (
        <div
          key={day.date}
          id={`forecast-card-${i}`}
          style={{ ...cardBase, ...(isDark ? cardDark : cardLight) }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 8px 28px rgba(0,0,0,0.45)'
              : '0 8px 24px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 2px 16px rgba(0,0,0,0.3)'
              : '0 2px 12px rgba(0,0,0,0.06)';
          }}
        >
          {/* Day name */}
          <p style={{
            margin: 0,
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
          }}>
            {formatDay(day.date)}
          </p>

          {/* Date */}
          <p style={{
            margin: '0.1rem 0 0',
            fontSize: '0.65rem',
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
          }}>
            {formatDateShort(day.date)}
          </p>

          {/* OWM icon */}
          <img
            src={iconUrl(day.icon_code)}
            alt={day.description}
            width={48}
            height={48}
            style={{ margin: '0.25rem auto', display: 'block' }}
          />

          {/* Max temp */}
          <p style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#6366f1',
            lineHeight: 1,
          }}>
            {day.max_temp}°
          </p>

          {/* Min temp */}
          <p style={{
            margin: '0.2rem 0 0',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#06b6d4',
          }}>
            {day.min_temp}°
          </p>

          {/* Description */}
          <p style={{
            margin: '0.4rem 0 0',
            fontSize: '0.65rem',
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            textTransform: 'capitalize',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {day.description}
          </p>
        </div>
      ))}
    </div>
  );
}
