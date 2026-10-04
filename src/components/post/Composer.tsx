import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePosts } from '../../context/PostsContext'
import { Avatar } from '../ui/Avatar'

const MAX = 280 // same limit as the server

export function Composer() {
  const { user } = useAuth()
  const { createPost } = usePosts()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const length = [...text.trim()].length // characters, like the server counts them
  const valid = length > 0 && length <= MAX
  const left = MAX - length

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      await createPost(text)
      setText('')
    } catch {
      setError('Could not post. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-[var(--container)] px-4 pb-3 pt-3 shadow-sm">
      <div className="flex gap-3">
        <Avatar name={user.username} color={user.avatarColor} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) e.currentTarget.form?.requestSubmit()
          }}
          aria-label="Write a post"
          placeholder={`What's on your mind, ${user.username}?`}
          rows={text ? 3 : 1}
          className="min-w-0 flex-1 resize-none rounded-[1.25rem] bg-[var(--input)] px-4 py-2.5 text-[17px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-lightred">
          {error}
        </p>
      )}
      {text && (
        <div className="mt-3 flex items-center justify-end gap-3 border-t border-[var(--border)] pt-3">
          {length > 0 && (
            <span
              className={`text-sm tabular-nums ${left < 0 ? 'text-lightred' : left <= 20 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}
            >
              {left}
            </span>
          )}
          <button
            type="submit"
            disabled={!valid || busy}
            className="w-full rounded-md bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primaryfocus disabled:opacity-40"
          >
            {busy ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}
    </form>
  )
}
