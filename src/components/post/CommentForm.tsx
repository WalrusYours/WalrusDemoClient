import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/Avatar'

interface CommentFormProps {
  onSubmit: (content: string) => void
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const { user } = useAuth()
  const [text, setText] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSubmit(text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <Avatar name={user?.username ?? 'You'} color={user?.avatarColor ?? 'bg-[var(--surface-active)]'} size="sm" />
      <div className="flex min-w-0 flex-1 items-end gap-2 rounded-[1.25rem] bg-[var(--input)] px-3 py-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
          aria-label="Write a comment"
          placeholder="Write a comment..."
          rows={1}
          className="min-w-0 flex-1 resize-none bg-transparent py-1 text-[15px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="py-1 text-sm font-semibold text-primary transition-colors hover:text-primaryfocus disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </form>
  )
}
