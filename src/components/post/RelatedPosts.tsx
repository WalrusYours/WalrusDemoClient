import { useEffect, useState } from 'react'
import { api } from '../../api'
import { usePosts } from '../../context/PostsContext'
import { useSession } from '../../context/SessionContext'
import type { Post, Vote } from '../../types'
import { applyVote } from '../../utils/vote'
import { WalrusTune } from '../walrus/WalrusTune'
import { PostRow } from './PostRow'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; posts: Post[] }

/**
 * "More like this": the posts the server returns for this one, in that order, shown as full
 * posts (menu, votes, comments) like the feed. They are not part of the feed state, so this
 * keeps its own copy and reports the same events.
 */
export function RelatedPosts({ postId }: { postId: string }) {
  const { userId, knobs } = useSession()
  const { track, refresh } = usePosts()
  const [loaded, setLoaded] = useState<{ postId: string; state: State } | null>(null)
  // bumped after feedback, so the reason's effect on the other posts shows
  const [nonce, setNonce] = useState(0)

  // Refetch when the post or a knob changes, so the list follows the sliders while dragging.
  // The old list stays on screen until the new one arrives; the server decides the order.
  useEffect(() => {
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => {
      api.getRelated(userId, postId, { knobs, signal: ctrl.signal }).then(
        (res) => {
          if (!ctrl.signal.aborted) setLoaded({ postId, state: { status: 'ready', posts: res.posts } })
        },
        () => {
          if (!ctrl.signal.aborted) setLoaded({ postId, state: { status: 'error' } })
        },
      )
    }, 60)
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [userId, postId, knobs, nonce])

  // Results of a previous post count as loading, so the old list never flashes under the new post.
  const state: State = loaded?.postId === postId ? loaded.state : { status: 'loading' }
  const posts = state.status === 'ready' ? state.posts : []

  const update = (fn: (posts: Post[]) => Post[]) =>
    setLoaded((prev) =>
      prev && prev.postId === postId && prev.state.status === 'ready'
        ? { postId, state: { status: 'ready', posts: fn(prev.state.posts) } }
        : prev,
    )

  const vote = (id: string, type: Vote) => {
    const current = posts.find((p) => p.id === id)
    update((ps) => ps.map((p) => (p.id === id ? applyVote(p, type) : p)))
    if (current && current.userVote !== type) track({ type, postId: id })
  }

  const hide = (id: string, reason?: string) => {
    update((ps) => ps.filter((p) => p.id !== id))
    track({ type: 'hide', postId: id, reason })
    setNonce((n) => n + 1)
    refresh() // the feed reflects it too
  }

  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h2 id="related-title" className="text-[17px] font-semibold text-[var(--text)]">
          More like this
        </h2>
        <WalrusTune align="right" surface="home" show={{ badge: false }} />
      </div>
      {state.status === 'loading' && <p className="px-1 text-sm text-[var(--text-muted)]">Loading...</p>}
      {state.status === 'error' && (
        <p className="px-1 text-sm text-[var(--text-muted)]">Could not load related posts.</p>
      )}
      {state.status === 'ready' && posts.length === 0 && (
        <p className="px-1 text-sm text-[var(--text-muted)]">Nothing related yet.</p>
      )}
      {posts.map((post) => (
        <div key={post.id}>
          <PostRow post={post} onVote={vote} onHide={hide} />
        </div>
      ))}
    </section>
  )
}
