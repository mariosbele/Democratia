export function Logo({ className = 'h-9 w-9', light = false }) {
  const stroke = light ? '#fff' : '#1d44d8'
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path
        d="M20 44V24l12-7 12 7v20"
        fill="none"
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M16 44h32" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="30" r="3.2" fill={stroke} />
    </svg>
  )
}

export function Wordmark({ light = false, className = '' }) {
  return (
    <span
      className={`font-extrabold tracking-tight ${light ? 'text-white' : 'text-brand-700'} ${className}`}
    >
      Democratia
    </span>
  )
}
