export function AiraMascot({
  className,
  animated = false,
}: {
  className?: string
  animated?: boolean
}) {
  return (
    <svg
      viewBox="0 0 340 380"
      className={className}
      role="img"
      aria-label="AIRA, your AI copilot"
    >
      <defs>
        <linearGradient id="aira-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
        <radialGradient id="aira-glow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="170" cy="352" rx="90" ry="12" fill="var(--foreground)" opacity="0.06" />
      <circle cx="170" cy="140" r="150" fill="url(#aira-glow)" />

      <g className={animated ? 'animate-aira-bob' : undefined}>
        {/* antenna */}
        <line x1="170" y1="40" x2="170" y2="8" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="170" cy="4" r="9" fill="var(--accent)" />

        {/* head */}
        <rect x="90" y="40" width="160" height="130" rx="48" fill="url(#aira-body)" />

        {/* ears */}
        <rect x="66" y="88" width="20" height="52" rx="10" fill="var(--secondary)" />
        <rect x="254" y="88" width="20" height="52" rx="10" fill="var(--secondary)" />

        {/* eyes */}
        <circle cx="132" cy="108" r="20" fill="var(--primary-foreground)" />
        <circle cx="208" cy="108" r="20" fill="var(--primary-foreground)" />
        <circle cx="136" cy="110" r="10" fill="var(--foreground)" />
        <circle cx="204" cy="110" r="10" fill="var(--foreground)" />
        <circle cx="139" cy="106" r="3" fill="var(--primary-foreground)" />
        <circle cx="207" cy="106" r="3" fill="var(--primary-foreground)" />

        {/* smile */}
        <path
          d="M138 140 Q170 156 202 140"
          stroke="var(--primary-foreground)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* body */}
        <rect x="105" y="178" width="130" height="110" rx="36" fill="url(#aira-body)" />

        {/* compass emblem */}
        <circle cx="170" cy="230" r="28" fill="var(--primary-foreground)" opacity="0.95" />
        <circle cx="170" cy="230" r="19" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
        <path d="M170 230 L179 213 L170 230 L161 247 Z" fill="var(--accent)" />

        {/* arms */}
        <rect x="70" y="196" width="22" height="64" rx="11" fill="var(--primary)" />
        <rect x="248" y="196" width="22" height="64" rx="11" fill="var(--primary)" />

        {/* legs */}
        <rect x="122" y="278" width="34" height="42" rx="14" fill="var(--accent)" />
        <rect x="184" y="278" width="34" height="42" rx="14" fill="var(--accent)" />
        <ellipse cx="139" cy="322" rx="22" ry="10" fill="var(--foreground)" opacity="0.85" />
        <ellipse cx="201" cy="322" rx="22" ry="10" fill="var(--foreground)" opacity="0.85" />
      </g>
    </svg>
  )
}
