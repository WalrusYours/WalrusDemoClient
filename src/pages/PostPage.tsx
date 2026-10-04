import { Link, Navigate, useParams } from 'react-router-dom'
import { CommentForm } from '../components/post/CommentForm'
import { CommentItem } from '../components/post/CommentItem'
import { PostRow } from '../components/post/PostRow'
import { RelatedPosts } from '../components/post/RelatedPosts'
import { usePosts } from '../context/PostsContext'

export function PostPage() {
  const { postId } = useParams()
  const { posts, loading, addComment } = usePosts()
  const post = posts.find((p) => p.id === postId)

  // On a direct load the feed is still being fetched; do not redirect before it arrives.
  if (!post && loading) return <p className="px-4 py-6 text-[var(--text-muted)]">Loading...</p>
  if (!post) return <Navigate to="/" replace />

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/"
        className="self-start rounded-full bg-[var(--container)] px-4 py-1.5 text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface)]"
      >
        ← Back to feed
      </Link>

      <PostRow post={post} linkToDetail={false} />

      <section className="flex flex-col gap-3 rounded-lg bg-[var(--container)] px-4 py-3 shadow-sm">
        {post.comments.length > 0 && (
          <>
            <h2 className="text-[15px] font-semibold text-[var(--text-muted)]">
              {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
            </h2>
            {post.comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </>
        )}
        <CommentForm onSubmit={(text) => addComment(post.id, text)} />
      </section>

      <RelatedPosts postId={post.id} />
    </div>
  )
}
