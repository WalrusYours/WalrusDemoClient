import { useEffect, useState } from 'react'
import { api } from '../../api'
import type { FeedbackEntry } from '../../api'
import { usePosts } from '../../context/PostsContext'
import { useSession } from '../../context/SessionContext'
import { timeAgo } from '../../utils/time'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; entries: FeedbackEntry[] }

/**
 * Everything the user said they are not interested in, each with an undo. Feedback that cannot
 * be taken back would quietly narrow the feed for good.
 */
export function FeedbackList({ onBack }: { onBack: () => void }) {
  const { userId } = useSession()
  const { refresh } = usePosts()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let live = true
    api.listFeedback(userId).then(
      (entries) => live && setState({ status: 'ready', entries }),
      () => live && setState({ status: 'error' }),
    )
    return () => {
      live = false
    }
  }, [userId])

  const undo = (id: string) => {
    setState((s) => (s.status === 'ready' ? { status: 'ready', entries: s.entries.filter((e) => e.id !== id) } : s))
    api.undoFeedback(userId, id).then(refresh, console.error)
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex w-full items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2.5 text-left text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <span aria-hidden="true">←</span> Your feedback
      </button>
      <div className="max-h-80 overflow-y-auto">
        {state.status === 'loading' && <p className="px-4 py-3 text-sm text-[var(--text-muted)]">Loading...</p>}
        {state.status === 'error' && <p className="px-4 py-3 text-sm text-[var(--text-muted)]">Could not load your feedback.</p>}
        {state.status === 'ready' && state.entries.length === 0 && (
          <p className="px-4 py-3 text-sm text-[var(--text-muted)]">
            Nothing yet. "Not interested" on a post shows up here, and you can take it back.
          </p>
        )}
        {state.status === 'ready' && state.entries.length > 0 && (
          <ul>
            {state.entries.map((e) => (
              <li key={e.id} className="flex items-start gap-3 border-b border-[var(--border-subtle)] px-4 py-2.5 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text)]">{e.label}</p>
                  {e.preview && <p className="truncate text-xs text-[var(--text-muted)]">{e.preview}</p>}
                  <p className="text-[11px] text-[var(--text-muted)]">{timeAgo(e.at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => undo(e.id)}
                  className="shrink-0 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text)] hover:border-primary hover:text-primary"
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
