import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-[var(--container)] px-4 py-24 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-[var(--text)]">Nothing here</h1>
      <p className="text-[var(--text-muted)]">This post doesn't exist or was removed.</p>
      <Link to="/" className="font-semibold text-primary hover:text-primaryfocus">
        Back to feed
      </Link>
    </div>
  )
}
