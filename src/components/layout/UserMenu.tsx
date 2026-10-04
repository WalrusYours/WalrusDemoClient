import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/Avatar'
import { FeedbackList } from './FeedbackList'

/** Avatar button in the header. The name and Sign out live in a dropdown, so the bar stays one row. */
export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'main' | 'feedback'>('main')
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) {
        setOpen(false)
        setView('main')
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setView('main')
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.username}`}
        className="rounded-full ring-offset-2 ring-offset-[var(--bg)] transition hover:ring-2 hover:ring-[var(--border-strong)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none aria-expanded:ring-2 aria-expanded:ring-primary"
      >
        <Avatar name={user.username} color={user.avatarColor} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--container)] shadow-xl ${view === 'feedback' ? 'w-80' : 'w-56'}`}
        >
          {view === 'feedback' ? (
            <FeedbackList onBack={() => setView('main')} />
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
                <Avatar name={user.username} color={user.avatarColor} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--text)]">{user.username}</p>
                  <p className="truncate text-sm text-[var(--text-muted)]">@{user.username}</p>
                </div>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => setView('feedback')}
                className="block w-full px-4 py-2.5 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                Your feedback
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="block w-full px-4 py-2.5 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
