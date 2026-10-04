import { Link } from 'react-router-dom'
import { CommentIcon, ThumbDownIcon, ThumbUpIcon } from '../ui/icons'
import type { Post } from '../../types'

interface PostActionsProps {
  post: Post
  onLike: () => void
  onDislike: () => void
  commentsHref?: string
}

const base =
  'flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-[15px] font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)]'

export function PostActions({ post, onLike, onDislike, commentsHref }: PostActionsProps) {
  const liked = post.userVote === 'like'
  const disliked = post.userVote === 'dislike'
  const n = post.comments.length

  return (
    <div>
      <div className="flex items-center gap-4 pb-2.5 text-[15px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
            <ThumbUpIcon filled className="h-3 w-3" />
          </span>
          {post.likes}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--surface)] text-[var(--text)]">
            <ThumbDownIcon filled className="h-3 w-3" />
          </span>
          {post.dislikes}
        </span>
        <span className="ml-auto">
          {n} {n === 1 ? 'comment' : 'comments'}
        </span>
      </div>
      <div className="flex gap-1 border-t border-[var(--border)] pt-1">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          className={`${base} ${liked ? '!text-primary' : ''}`}
        >
          <ThumbUpIcon filled={liked} className="h-5 w-5" />
          Like
        </button>
        <button
          type="button"
          onClick={onDislike}
          aria-pressed={disliked}
          className={`${base} ${disliked ? '!text-lightred' : ''}`}
        >
          <ThumbDownIcon filled={disliked} className="h-5 w-5" />
          Dislike
        </button>
        {commentsHref ? (
          <Link to={commentsHref} className={base}>
            <CommentIcon className="h-5 w-5" />
            Comment
          </Link>
        ) : (
          <span className={`${base} cursor-default`}>
            <CommentIcon className="h-5 w-5" />
            Comment
          </span>
        )}
      </div>
    </div>
  )
}
