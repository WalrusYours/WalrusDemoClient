interface IconProps {
  className?: string
  filled?: boolean
}

export function ArrowUpIcon({ className, filled }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V6M5 13l7-7 7 7" />
    </svg>
  )
}

export function ArrowDownIcon({ className, filled }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v13M5 11l7 7 7-7" />
    </svg>
  )
}

export function CommentIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.29 0-2.51-.29-3.6-.82L3 21l1.82-5.9A8.5 8.5 0 1 1 21 11.5Z"
      />
    </svg>
  )
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function DotsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  )
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10.5 7 10.5 7a17 17 0 0 1-3.2 4M6.4 6.4A17 17 0 0 0 1.5 12S5.5 19 12 19c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"
      />
    </svg>
  )
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"
      />
    </svg>
  )
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export function ThumbUpIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} fill={filled ? 'currentColor' : 'none'} className={className}>
      <path d="M7 10v11H3V10h4Zm0 0 4-7c1.7 0 3 1.3 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.2 7a2 2 0 0 1-2 1.7H7" />
    </svg>
  )
}

export function ThumbDownIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} fill={filled ? 'currentColor' : 'none'} className={className}>
      <path d="M17 14V3h4v11h-4Zm0 0-4 7c-1.7 0-3-1.3-3-3v-4H4.5a2 2 0 0 1-2-2.3l1.2-7A2 2 0 0 1 5.7 3H17" />
    </svg>
  )
}

export function HomeIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} fill={filled ? 'currentColor' : 'none'} className={className}>
      <path d="M3 11 12 3l9 8v10h-6v-6H9v6H3V11Z" />
    </svg>
  )
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.3c2.2.7 3.5 2.600 3.5 5.7" />
    </svg>
  )
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} className={className}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="m10 9 5 3-5 3V9Z" />
    </svg>
  )
}

export function StoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M4 9.5 5.500 4h13L20 9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5 12.5V20h14v-7.500" />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function MusicIcon({ className, filled }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} fill={filled ? 'currentColor' : 'none'} className={className}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  )
}
