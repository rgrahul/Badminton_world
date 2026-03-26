interface GavelIconProps {
  className?: string
  size?: number
}

export function GavelIcon({ className = "", size = 48 }: GavelIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Gavel head */}
      <rect x="30" y="15" width="30" height="18" rx="3" transform="rotate(-35 45 24)" />
      {/* Handle */}
      <line x1="50" y1="35" x2="80" y2="75" />
      {/* Base block */}
      <rect x="15" y="75" width="35" height="8" rx="2" />
      <rect x="18" y="83" width="29" height="5" rx="1" />
      {/* Impact lines */}
      <line x1="25" y1="55" x2="18" y2="48" />
      <line x1="22" y1="62" x2="13" y2="58" />
      <line x1="28" y1="68" x2="18" y2="67" />
    </svg>
  )
}

export function SoldGavelIcon({ className = "", size = 48 }: GavelIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 100"
      width={size * 1.2}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* SOLD text */}
      <text
        x="60"
        y="22"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontSize="20"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        SOLD!
      </text>
      {/* Gavel head */}
      <rect x="45" y="28" width="28" height="16" rx="3" transform="rotate(-35 59 36)" />
      {/* Handle */}
      <line x1="62" y1="45" x2="90" y2="80" />
      {/* Base block */}
      <rect x="25" y="78" width="35" height="7" rx="2" />
      <rect x="28" y="85" width="29" height="5" rx="1" />
      {/* Impact lines */}
      <line x1="38" y1="58" x2="30" y2="50" />
      <line x1="33" y1="65" x2="24" y2="60" />
    </svg>
  )
}
