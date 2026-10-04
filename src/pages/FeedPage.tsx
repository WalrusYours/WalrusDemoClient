import { Composer } from '../components/post/Composer'
import { PostRow } from '../components/post/PostRow'
import { WalrusTune } from '../components/walrus/WalrusTune'
import { usePosts } from '../context/PostsContext'

export function FeedPage() {
  const { posts, loading, error } = usePosts()

  return (
    <div className="flex flex-col gap-4">
      <Composer />
      {/* Tune lives where the recommendations are: this feed is ranked by it. */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[17px] font-semibold">Your feed</h2>
        <WalrusTune align="right" surface="home" show={{ badge: false }} />
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-lightred/40 bg-lightred/10 p-3 text-sm text-lightred">
          Could not load the feed: {error}
        </p>
      )}
      {loading && posts.length === 0 && !error && <p className="p-4 text-[var(--text-muted)]">Loading feed...</p>}
      {posts.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </div>
  )
}
