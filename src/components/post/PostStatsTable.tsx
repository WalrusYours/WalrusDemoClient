import type { Post } from '../../types'
import { countWords, extractKeywords, formatDuration } from '../../utils/text'

interface PostStatsTableProps {
  post: Post
  viewedSeconds: number
}

export function PostStatsTable({ post, viewedSeconds }: PostStatsTableProps) {
  const keywords = extractKeywords(post.content)

  const rows: [string, string][] = [
    ['Author', post.author],
    ['Handle', `@${post.handle}`],
    ['Posted', post.createdAt],
    ['Characters', String(post.content.length)],
    ['Words', String(countWords(post.content))],
    ['Likes', String(post.likes)],
    ['Dislikes', String(post.dislikes)],
    ['Comments', String(post.comments.length)],
    ['Watched', formatDuration(viewedSeconds)],
  ]

  return (
    <aside className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3">
      <table className="w-full border-collapse text-xs">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-[var(--divider)] last:border-0">
              <th scope="row" className="py-1.5 pr-2 text-left font-medium text-[var(--text-muted)]">
                {label}
              </th>
              <td className="py-1.5 text-right tabular-nums text-[var(--text)]">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 border-t border-[var(--divider)] pt-3">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] text-primaryfocus"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </aside>
  )
}
