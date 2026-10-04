import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api'
import type { InteractionEvent } from '../api'
import type { Post, Vote } from '../types'
import { applyVote } from '../utils/vote'
import { useAuth } from './AuthContext'
import { useSession } from './SessionContext'

export interface FeedMeta {
  tookMs?: number
  candidates?: number
}

interface PostsContextValue {
  /** The feed, in the order the server returned it. */
  posts: Post[]
  loading: boolean
  error: string | null
  /** Timing of the last feed response, shown in the tuning panel. */
  meta: FeedMeta
  /** Rejects when the server refuses the post; the new post is shown at the top on success. */
  createPost: (content: string) => Promise<void>
  vote: (postId: string, type: Vote) => void
  /**
   * "Not interested", with an optional reason: removes the post from view, reports a `hide`
   * event, and refetches so the reason's effect on other posts shows.
   */
  hidePost: (postId: string, reason?: string) => void
  /** Fetch the feed again, for example after feedback was undone. */
  refresh: () => void
  addComment: (postId: string, content: string) => void
  /** Report that a post was on screen for `seconds` (becomes a `view` interaction). */
  reportView: (postId: string, seconds: number) => void
  /** Fire-and-forget interaction event, for posts shown outside the feed ("More like this"). */
  track: (event: Omit<InteractionEvent, 'ts'>) => void
}

const PostsContext = createContext<PostsContextValue | null>(null)

export function PostsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { userId, knobs, ready } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<FeedMeta>({})
  const [refreshKey, setRefreshKey] = useState(0)

  // Re-fetch whenever the persona or a knob changes. The ranking happens on the server;
  // this client only displays the order it gets back.
  useEffect(() => {
    if (!ready) return
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => {
      setLoading(true)
      api
        .getFeed(userId, { knobs, signal: ctrl.signal })
        .then((res) => {
          if (ctrl.signal.aborted) return
          setPosts(res.posts)
          setMeta({ tookMs: res.tookMs, candidates: res.candidates })
          setError(null)
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return
          setError(e instanceof Error ? e.message : 'Could not load the feed')
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false)
        })
    }, 60)
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [ready, userId, knobs, refreshKey])

  const send = useCallback(
    (event: Omit<InteractionEvent, 'ts'>) => {
      // Fire and forget: a failed event must never block the UI.
      api.sendEvent(userId, { ...event, ts: new Date().toISOString() }).catch(console.error)
    },
    [userId],
  )

  const createPost = async (content: string) => {
    const post = await api.createPost(userId, content)
    setPosts((prev) => [post, ...prev])
  }

  const vote = (postId: string, type: Vote) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? applyVote(post, type) : post)))
    const current = posts.find((p) => p.id === postId)
    if (current?.userVote !== type) send({ type, postId })
  }

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const hidePost = (postId: string, reason?: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
    send({ type: 'hide', postId, reason })
    refresh()
  }

  const addComment = (postId: string, content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: crypto.randomUUID(),
                  author: user?.username ?? 'You',
                  avatarColor: user?.avatarColor ?? 'bg-[var(--surface-active)]',
                  content: trimmed,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : post,
      ),
    )
    api.addComment(userId, postId, trimmed).catch(console.error)
    send({ type: 'comment', postId })
  }

  const reportView = useCallback(
    (postId: string, seconds: number) => {
      if (seconds > 0) send({ type: 'view', postId, value: seconds })
    },
    [send],
  )

  const value = useMemo(
    () => ({
      posts,
      loading,
      error,
      meta,
      createPost,
      vote,
      hidePost,
      addComment,
      reportView,
      track: send,
      refresh,
    }),
    // createPost, vote, hidePost and addComment close over `posts` and `userId`, so they follow them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, loading, error, meta, userId, reportView, refresh],
  )

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export function usePosts() {
  const ctx = useContext(PostsContext)
  if (!ctx) throw new Error('usePosts must be used within a PostsProvider')
  return ctx
}
