/**
 * NewsCard — A single news article card.
 *
 * Props:
 *   article  — { title, description, url, image_url, source, published_at }
 *   isDark   — boolean
 *   index    — number (used for staggered animation delay)
 */
export default function NewsCard({ article, isDark, index = 0 }) {
  const fallbackImg = `https://placehold.co/600x340/${isDark ? '1e293b/475569' : 'f1f5f9/94a3b8'}?text=No+Image`;

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const truncate = (str, n) =>
    str && str.length > n ? str.slice(0, n).trimEnd() + '…' : str;

  return (
    <article
      id={`news-card-${index}`}
      style={{
        borderRadius: '1.25rem',
        overflow: 'hidden',
        background: isDark ? 'rgba(30,41,59,0.9)' : '#ffffff',
        border: isDark ? '1.5px solid rgba(255,255,255,0.07)' : '1.5px solid #e2e8f0',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.35)'
          : '0 2px 16px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'both',
        animation: 'fadeSlideUp 0.4s ease both',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 12px 40px rgba(0,0,0,0.5)'
          : '0 10px 32px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 4px 24px rgba(0,0,0,0.35)'
          : '0 2px 16px rgba(0,0,0,0.07)';
      }}
    >
      {/* Article image */}
      <div style={{ position: 'relative', overflow: 'hidden', height: '180px', flexShrink: 0 }}>
        <img
          src={article.image_url || fallbackImg}
          alt={article.title}
          onError={(e) => { e.target.src = fallbackImg; }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.4s ease',
          }}
          onMouseEnter={(e) => { e.target.style.transform = 'scale(1.04)'; }}
          onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
        />
        {/* Source badge */}
        <span style={{
          position: 'absolute',
          top: '0.6rem',
          left: '0.6rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '2rem',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          color: '#fff',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {article.source}
        </span>
      </div>

      {/* Card body */}
      <div style={{
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: '0.5rem',
      }}>
        {/* Date */}
        {article.published_at && (
          <p style={{
            margin: 0,
            fontSize: '0.68rem',
            color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.38)',
            fontWeight: 500,
          }}>
            {formatDate(article.published_at)}
          </p>
        )}

        {/* Title */}
        <h3 style={{
          margin: 0,
          fontSize: '0.9rem',
          fontWeight: 700,
          lineHeight: 1.4,
          color: isDark ? '#f1f5f9' : '#0f172a',
        }}>
          {truncate(article.title, 90)}
        </h3>

        {/* Description */}
        {article.description && (
          <p style={{
            margin: 0,
            fontSize: '0.78rem',
            lineHeight: 1.5,
            color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
            flex: 1,
          }}>
            {truncate(article.description, 120)}
          </p>
        )}

        {/* Read more */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          id={`news-read-more-${index}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            marginTop: '0.25rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#6366f1',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#4f46e5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6366f1'; }}
        >
          Read more
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </article>
  );
}
