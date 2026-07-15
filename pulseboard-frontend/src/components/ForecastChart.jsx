import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * ForecastChart — Recharts AreaChart for 5-day min/max temperatures.
 *
 * Props:
 *   forecast  — array of { date, min_temp, max_temp, description, icon_code }
 *   isDark    — boolean, drives colour palette
 */
export default function ForecastChart({ forecast = [], isDark }) {
  if (!forecast.length) return null;

  // Format "2024-01-15" → "Mon"
  const dayName = (dateStr) =>
    new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });

  const chartData = forecast.map((d) => ({
    day: dayName(d.date),
    Max: d.max_temp,
    Min: d.min_temp,
    // keep raw for tooltip
    description: d.description,
  }));

  // Palette
  const maxColor  = '#6366f1'; // indigo
  const minColor  = '#06b6d4'; // cyan
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const textColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const desc = payload[0]?.payload?.description || '';
    return (
      <div style={{
        background: tooltipBg,
        border: `1px solid ${tooltipBorder}`,
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        fontSize: '0.8rem',
        color: isDark ? '#e2e8f0' : '#1e293b',
        minWidth: '130px',
      }}>
        <p style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '0.875rem' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ margin: '0.15rem 0', color: p.color }}>
            {p.dataKey}: <strong>{p.value}°C</strong>
          </p>
        ))}
        {desc && (
          <p style={{ margin: '0.4rem 0 0', opacity: 0.6, textTransform: 'capitalize', fontSize: '0.72rem' }}>
            {desc}
          </p>
        )}
      </div>
    );
  };

  // Dynamic y-axis domain: pad by 2° for breathing room
  const allTemps = forecast.flatMap((d) => [d.min_temp, d.max_temp]);
  const yMin = Math.floor(Math.min(...allTemps)) - 2;
  const yMax = Math.ceil(Math.max(...allTemps)) + 2;

  return (
    <div id="forecast-chart" style={{ width: '100%', padding: '0.25rem 0' }}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gradMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={maxColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={maxColor} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="gradMin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={minColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={minColor} stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

          <XAxis
            dataKey="day"
            tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v) => `${v}°`}
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: gridColor, strokeWidth: 2 }} />

          <Legend
            wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem', color: textColor }}
            iconType="circle"
            iconSize={8}
          />

          <Area
            type="monotone"
            dataKey="Max"
            stroke={maxColor}
            strokeWidth={2.5}
            fill="url(#gradMax)"
            dot={{ r: 4, fill: maxColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: maxColor }}
          />
          <Area
            type="monotone"
            dataKey="Min"
            stroke={minColor}
            strokeWidth={2.5}
            fill="url(#gradMin)"
            dot={{ r: 4, fill: minColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: minColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
