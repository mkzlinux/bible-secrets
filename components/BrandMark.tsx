export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bs-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0dda6" />
          <stop offset="45%" stopColor="#d4b45a" />
          <stop offset="100%" stopColor="#8a6d2b" />
        </linearGradient>
      </defs>
      {/* the crystal platform */}
      <rect x="10" y="28" width="44" height="3.4" rx="1.2" fill="url(#bs-gold)" opacity="0.95" />
      {/* four wheels + eyes (Ezekiel 1) */}
      {[
        [18, 21],
        [46, 21],
        [14, 40],
        [50, 40],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="7.4" fill="none" stroke="url(#bs-gold)" strokeWidth="2.1" />
          <circle cx={cx} cy={cy} r="2.1" fill="url(#bs-gold)" />
        </g>
      ))}
      {/* the scroll between them */}
      <path
        d="M24 32c0-3 2.4-4.6 5.2-4.6h6c2.8 0 5.2 1.6 5.2 4.6"
        fill="none"
        stroke="#f3ead8"
        strokeWidth="1.6"
        opacity="0.85"
      />
    </svg>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark className={compact ? "h-7 w-7" : "h-8 w-8"} />
      <span className="leading-none">
        <span className="block font-display text-[15px] font-bold tracking-[0.28em] text-cream uppercase">
          Bible
        </span>
        <span className="block font-display text-[15px] font-bold tracking-[0.32em] text-gold-500 uppercase">
          Secrets
        </span>
      </span>
    </span>
  );
}
