/** The Visagemanuscript mark: a round badge with a bold V, in the WALRUS coral. Same drawing as public/favicon.svg. */
export function Logo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="32" fill="#f4586a" />
      <path
        d="M14 16h10.5L32 40.5 39.5 16H50L37.5 54h-11L14 16Z"
        fill="#fff"
      />
    </svg>
  )
}
