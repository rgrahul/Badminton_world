export function BirdieLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="featherGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="wingGrad" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <linearGradient id="corkGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="82" rx="10" ry="11" fill="url(#corkGrad)" />
      <ellipse cx="60" cy="78" rx="8" ry="3" fill="#fde68a" opacity="0.5" />
      <ellipse cx="60" cy="72" rx="9" ry="3" fill="none" stroke="#d97706" strokeWidth="1.5" opacity="0.6" />
      <path d="M60 70 C58 55, 55 35, 55 15 C55 10, 58 8, 60 8 C62 8, 65 10, 65 15 C65 35, 62 55, 60 70Z" fill="url(#featherGrad)" opacity="0.9" />
      <path d="M57 70 C53 55, 46 35, 43 18 C42 13, 45 10, 48 12 C52 18, 55 45, 57 70Z" fill="url(#featherGrad)" opacity="0.8" />
      <path d="M63 70 C67 55, 74 35, 77 18 C78 13, 75 10, 72 12 C68 18, 65 45, 63 70Z" fill="url(#featherGrad)" opacity="0.8" />
      <path d="M54 70 C48 57, 38 40, 33 25 C31 20, 34 17, 37 19 C42 26, 50 50, 54 70Z" fill="url(#featherGrad)" opacity="0.65" />
      <path d="M66 70 C72 57, 82 40, 87 25 C89 20, 86 17, 83 19 C78 26, 70 50, 66 70Z" fill="url(#featherGrad)" opacity="0.65" />
      <path d="M45 58 C35 50, 18 48, 5 52 C3 53, 3 55, 5 55 C15 54, 30 56, 42 62Z" fill="url(#wingGrad)" opacity="0.85" />
      <path d="M43 54 C33 44, 15 38, 2 40 C0 40, 0 42, 2 43 C12 44, 28 48, 40 56Z" fill="url(#wingGrad)" opacity="0.6" />
      <path d="M44 62 C36 56, 22 55, 10 58 C8 59, 8 61, 10 61 C20 60, 34 61, 44 65Z" fill="url(#wingGrad)" opacity="0.5" />
      <path d="M75 58 C85 50, 102 48, 115 52 C117 53, 117 55, 115 55 C105 54, 90 56, 78 62Z" fill="url(#wingGrad)" opacity="0.85" />
      <path d="M77 54 C87 44, 105 38, 118 40 C120 40, 120 42, 118 43 C108 44, 92 48, 80 56Z" fill="url(#wingGrad)" opacity="0.6" />
      <path d="M76 62 C84 56, 98 55, 110 58 C112 59, 112 61, 110 61 C100 60, 86 61, 76 65Z" fill="url(#wingGrad)" opacity="0.5" />
    </svg>
  )
}
