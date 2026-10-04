import { useEffect, useState } from 'react'
import { api } from '../../api'
import type { Explanation } from '../../api'
import { useSession } from '../../context/SessionContext'

function sentence(e: Explanation) {
  if (e.sentence) return e.sentence
  const top = [...e.breakdown].sort((a, b) => b.value - a.value)[0]
  return top ? `Mostly because of: ${top.signal}.` : 'No explanation available.'
}

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: Explanation }

/**
 * "Why am I seeing this?" Opened from the post menu; loads when it appears. The breakdown is
 * the same one the server scored with.
 */
export function WhyThis({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { userId } = useSession()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const ctrl = new AbortController()
    api.explain(userId, postId, ctrl.signal).then(
      (data) => {
        if (!ctrl.signal.aborted) setState({ status: 'ready', data })
      },
      () => {
        if (!ctrl.signal.aborted) setState({ status: 'error' })
      },
    )
    return () => ctrl.abort()
  }, [userId, postId])

  return (
    <div className="mt-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-semibold text-[var(--text-muted)]">Why am I seeing this?</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close explanation"
          className="-mt-1 -mr-1 rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ×
        </button>
      </div>
      {state.status === 'error' && <p className="mt-1">Could not load the explanation.</p>}
      {state.status === 'loading' && <p className="mt-1 text-[var(--text-muted)]">Loading...</p>}
      {state.status === 'ready' && (
        <>
          <p className="mt-1">{sentence(state.data)}</p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-[var(--text-muted)]">
            {state.data.breakdown.map((b) => (
              <li key={b.signal} className="flex items-center gap-2">
                <span className="w-28 shrink-0">{b.signal}</span>
                <span
                  className="h-1.5 rounded bg-primary"
                  style={{ width: `${Math.max(2, Math.min(100, b.value * 100))}%` }}
                />
                <span>{b.value.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
