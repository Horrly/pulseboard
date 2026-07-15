/**
 * WeatherCard — Displays current weather conditions.
 *
 * The 5-day forecast is now rendered by ForecastChart + ForecastDayCards
 * in the right panel of the Dashboard.
 *
 * Props:
 *   weather — current weather object from /api/weather/current/
 */
export default function WeatherCard({ weather }) {
  if (!weather) return null;

  const iconUrl = (code) =>
    `https://openweathermap.org/img/wn/${code}@2x.png`;

  const getWindLabel = (speed) => {
    if (speed < 1) return 'Calm';
    if (speed < 6) return 'Light breeze';
    if (speed < 12) return 'Moderate';
    if (speed < 20) return 'Fresh breeze';
    return 'Strong wind';
  };

  return (
    <div id="weather-card" style={{
      borderRadius: '1.5rem',
      overflow: 'hidden',
      background: 'linear-gradient(145deg, #0f172a, #1e3a5f)',
      color: '#fff',
      boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      position: 'relative',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30px', left: '-30px',
        width: '160px', height: '160px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* ── Current conditions ────────────────────────────────────────────── */}
      <div style={{ padding: '1.75rem 1.75rem 1.5rem', position: 'relative', zIndex: 1 }}>
        {/* City + country */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {weather.city}
            </h2>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', opacity: 0.65, fontWeight: 500 }}>
              {weather.country}
            </p>
          </div>
          <span style={{
            padding: '0.25rem 0.7rem',
            borderRadius: '2rem',
            background: 'rgba(255,255,255,0.1)',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            backdropFilter: 'blur(6px)',
          }}>
            LIVE
          </span>
        </div>

        {/* Icon + temp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
          <img
            src={iconUrl(weather.icon_code)}
            alt={weather.description}
            width={72}
            height={72}
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }}
          />
          <div>
            <p style={{ margin: 0, fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>
              {weather.temp}°
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', opacity: 0.75, textTransform: 'capitalize' }}>
              {weather.description}
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginTop: '1.25rem',
        }}>
          {[
            { label: 'Feels like', value: `${weather.feels_like}°C`, icon: '🌡️' },
            { label: 'Humidity',   value: `${weather.humidity}%`,    icon: '💧' },
            { label: 'Wind',       value: `${weather.wind_speed} m/s`, icon: '💨', sub: getWindLabel(weather.wind_speed) },
          ].map(({ label, value, icon, sub }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '0.875rem',
              padding: '0.75rem',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{icon}</p>
              <p style={{ margin: '0.3rem 0 0', fontSize: '1rem', fontWeight: 700 }}>{value}</p>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.68rem', opacity: 0.6, fontWeight: 500 }}>
                {sub || label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
