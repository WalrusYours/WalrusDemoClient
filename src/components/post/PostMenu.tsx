import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChartIcon, DotsIcon, EyeOffIcon, LinkIcon } from '../ui/icons'
import { reasonLabel, useFeedbackReasons } from './useFeedbackReasons'

const WALRUS_LOGO = `${import.meta.env.BASE_URL}walrus.png`

function WalrusMark() {
  return <img src={WALRUS_LOGO} alt="" width={16} height={16} className="h-4 w-4 object-contain" draggable={false} />
}

interface PostMenuProps {
  postId: string
  author: string
  onWhy: () => void
  onStats: () => void
  /** reason: a feedback reason id, or undefined when the server offers no reasons */
  onNotInterested: (reason?: string) => void
}

interface Item {
  key: string
  label: string
  hint?: string
  icon: ReactNode
  onSelect: () => void
}

const ITEM =
  'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] focus-visible:outline-none'

/**
 * The "..." menu on a post. "Why am I seeing this?" is answered by WALRUS, hence its logo.
 * "Not interested" opens the reasons the schema declares; each reason reaches other posts
 * through this post's attributes (same author, same topic, similar posts).
 */
export function PostMenu({ postId, author, onWhy, onStats, onNotInterested }: PostMenuProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'main' | 'reasons'>('main')
  const [copied, setCopied] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const reasons = useFeedbackReasons()

  const closeMenu = () => {
    setOpen(false)
    setView('main')
  }

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
        button.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const copyLink = () => {
    const url = `${window.location.origin}/post/${postId}`
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true)
        window.setTimeout(() => {
          setCopied(false)
          closeMenu()
        }, 900)
      },
      () => closeMenu(), // clipboard blocked: nothing useful to show
    )
  }

  const close = (fn: () => void) => () => {
    closeMenu()
    fn()
  }

  const items: Item[] = [
    { key: 'why', label: 'Why am I seeing this?', icon: <WalrusMark />, onSelect: close(onWhy) },
    { key: 'stats', label: 'Post stats', icon: <ChartIcon className="h-4 w-4" />, onSelect: close(onStats) },
    {
      key: 'hide',
      label: 'Not interested',
      hint: reasons.length > 0 ? 'Tell us why' : 'Show fewer posts like this',
      icon: <EyeOffIcon className="h-4 w-4" />,
      onSelect: reasons.length > 0 ? () => setView('reasons') : close(() => onNotInterested()),
    },
    {
      key: 'link',
      label: copied ? 'Link copied' : 'Copy link',
      icon: <LinkIcon className="h-4 w-4" />,
      onSelect: copyLink,
    },
  ]

  return (
    <div ref={root} className="relative -mr-2 shrink-0">
      <button
        ref={button}
        type="button"
        onClick={() => (open ? closeMenu() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More options for ${author}'s post`}
        className="grid h-8 w-8 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--primary-soft)] hover:text-primary focus-visible:outline-2 focus-visible:outline-primary aria-expanded:bg-[var(--primary-soft)] aria-expanded:text-primary"
      >
        <DotsIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={view === 'reasons' ? 'Why are you not interested?' : undefined}
          className="absolute right-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--container)] py-1 shadow-xl"
        >
          {view === 'main' &&
            items.map((item) => (
              <button key={item.key} type="button" role="menuitem" onClick={item.onSelect} className={ITEM}>
                <span className="grid h-5 w-5 shrink-0 place-items-center text-[var(--text-muted)]">{item.icon}</span>
                <span className="min-w-0">
                  <span className="block">{item.label}</span>
                  {item.hint && <span className="block text-xs text-[var(--text-muted)]">{item.hint}</span>}
                </span>
              </button>
            ))}

          {view === 'reasons' && (
            <>
              <button
                type="button"
                onClick={() => setView('main')}
                className="flex w-full items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-2 text-left text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <span aria-hidden="true">←</span> Why are you not interested?
              </button>
              {reasons.map((r) => (
                <button key={r.id} type="button" role="menuitem" onClick={close(() => onNotInterested(r.id))} className={ITEM}>
                  <span className="min-w-0">
                    <span className="block">{reasonLabel(r.label, author)}</span>
                    {r.hint && <span className="block text-xs text-[var(--text-muted)]">{r.hint}</span>}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
