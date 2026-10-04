import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../../context/PostsContext'
import type { Post, Vote } from '../../types'
import { timeAgo } from '../../utils/time'
import { Avatar } from '../ui/Avatar'
import { WhyThis } from '../walrus/WhyThis'
import { PostActions } from './PostActions'
import { PostMenu } from './PostMenu'
import { PostStatsTable } from './PostStatsTable'

interface PostCardProps {
  post: Post
  linkToDetail?: boolean
  /** Seconds the post has been on screen, for the stats panel. */
  viewedSeconds?: number
  /** For posts that are not in the feed state (e.g. "More like this"). Default: the feed's. */
  onVote?: (postId: string, type: Vote) => void
  onHide?: (postId: string, reason?: string) => void
}

type Panel = 'why' | 'stats' | null

// A timeline row: avatar on the left, name line with the "..." menu, text, actions.
export function PostCard({ post, linkToDetail = true, viewedSeconds = 0, onVote, onHide }: PostCardProps) {
  const feed = usePosts()
  const vote = onVote ?? feed.vote
  const hidePost = onHide ?? feed.hidePost
  const [panel, setPanel] = useState<Panel>(null)

  return (
    <article className="rounded-lg bg-[var(--container)] px-4 pb-2 pt-3 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar name={post.author} color={post.avatarColor} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-semibold text-[var(--text)]">{post.author}</p>
          <p className="text-[13px] text-[var(--text-muted)]">
            @{post.handle} · {timeAgo(post.createdAt)}
          </p>
        </div>
        <PostMenu
          postId={post.id}
          author={post.author}
          onWhy={() => setPanel('why')}
          onStats={() => setPanel('stats')}
          onNotInterested={(reason) => hidePost(post.id, reason)}
        />
      </div>

      {linkToDetail ? (
        <Link to={`/post/${post.id}`} className="my-3 block whitespace-pre-line break-words text-[17px] text-[var(--text)]">
          {post.content}
        </Link>
      ) : (
        <p className="my-3 whitespace-pre-line break-words text-[17px] text-[var(--text)]">{post.content}</p>
      )}

      <PostActions
        post={post}
        onLike={() => vote(post.id, 'like')}
        onDislike={() => vote(post.id, 'dislike')}
        commentsHref={linkToDetail ? `/post/${post.id}` : undefined}
      />

      {panel === 'why' && <WhyThis postId={post.id} onClose={() => setPanel(null)} />}
      {panel === 'stats' && (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-muted)]">Post stats</h3>
            <button
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close stats"
              className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              ×
            </button>
          </div>
          <PostStatsTable post={post} viewedSeconds={viewedSeconds} />
        </div>
      )}
    </article>
  )
}
