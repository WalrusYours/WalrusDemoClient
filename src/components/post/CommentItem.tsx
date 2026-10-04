import type { Comment } from '../../types'
import { timeAgo } from '../../utils/time'
import { Avatar } from '../ui/Avatar'

export function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2">
      <Avatar name={comment.author} color={comment.avatarColor} size="sm" />
      <div className="min-w-0">
        <div className="rounded-2xl bg-[var(--surface)] px-3 py-2">
          <span className="block text-[13px] font-semibold text-[var(--text)]">{comment.author}</span>
          <p className="break-words text-[15px] text-[var(--text)]">{comment.content}</p>
        </div>
        <span className="ml-3 text-xs text-[var(--text-muted)]">{timeAgo(comment.createdAt)}</span>
      </div>
    </div>
  )
}
