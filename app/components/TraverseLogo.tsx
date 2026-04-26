// Server-renderable Traverse mark — used across nav, status pages, etc.

const COPPER = "#E07A2F";

export function TraverseLogo({ size = 30 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 68 80"
      width={size}
      height={(size * 80) / 68}
      aria-label="Traverse"
    >
      <path
        d="M6 58 Q14 32 24 18 Q30 8 34 4 Q38 8 44 18 Q54 32 62 58 Z"
        fill="rgba(255,255,255,0.03)"
      />
      <path
        d="M6 58 Q14 32 24 18 Q30 8 34 4"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      <path
        d="M62 58 Q54 32 44 18 Q38 8 34 4"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      <line x1="20" y1="32" x2="34" y2="52" stroke={COPPER} strokeWidth="1.2" opacity="0.55" />
      <line x1="48" y1="32" x2="34" y2="52" stroke={COPPER} strokeWidth="1.2" opacity="0.55" />
      <circle cx="34" cy="4" r="2.2" fill="rgba(255,255,255,0.4)" />
      <circle cx="24" cy="18" r="2.5" fill="white" />
      <circle cx="44" cy="18" r="2.5" fill="white" />
      <circle cx="20" cy="32" r="2.5" fill="white" />
      <circle cx="48" cy="32" r="2.5" fill="white" />
      <circle cx="34" cy="52" r="6" fill={COPPER} />
      <circle cx="34" cy="52" r="2.2" fill="white" />
    </svg>
  );
}
