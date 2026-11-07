import { Link } from 'react-router-dom';

export function BrandGlyph({ size = 34, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M10 8h13c11.6 0 19 6.5 19 16s-7.4 16-19 16H10V8Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M17 17h8m-8 7h15m-15 7h8" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <rect x="35" y="5" width="7" height="7" rx="1" fill="var(--accent-purple)" />
    </svg>
  );
}

export function BrandMark({ compact = false, className = '' }) {
  return (
    <Link to="/" className={`dv-brand ${className}`} aria-label="DevFolio — Home">
      <BrandGlyph size={32} />
      {!compact && <span className="dv-brand-word">dev<span>folio</span><span className="dv-brand-period">.</span></span>}
    </Link>
  );
}
