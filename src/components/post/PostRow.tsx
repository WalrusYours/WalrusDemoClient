import { usePosts } from '../../context/PostsContext'
import { useViewTime } from '../../hooks/useViewTime'
import type { Post, Vote } from '../../types'
import { PostCard } from './PostCard'

interface PostRowProps {
  post: Post
  linkToDetail?: boolean
  onVote?: (postId: string, type: Vote) => void
  onHide?: (postId: string, reason?: string) => void
}

export function PostRow({ post, linkToDetail = true, onVote, onHide }: PostRowProps) {
  const { reportView } = usePosts()
  const { ref, seconds } = useViewTime<HTMLDivElement>(0.5, (s) => reportView(post.id, s))

  return (
    <div ref={ref}>
      <PostCard post={post} linkToDetail={linkToDetail} viewedSeconds={seconds} onVote={onVote} onHide={onHide} />
    </div>
  )
}
