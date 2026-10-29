import { useState } from 'react'
import type { Video } from '../../types'
import { StarIcon } from '../ui/icons'

// Cinema cover art without external images: a rich multi-stop gradient whose hue comes from
// the film's title and director, plus subtle film-grain lighting and an Original badge.

export function videoHue(text: string): number {
  let h = 0
  for (const c of text) h = (h * 37 + c.charCodeAt(0)) % 360
  return h
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

export function VideoThumbnail({
  video,
  className = 'aspect-video w-full',
  showPlayOverlay = false,
}: {
  video: Video
  className?: string
  showPlayOverlay?: boolean
}) {
  const h1 = videoHue(video.title)
  const h2 = (videoHue(video.director) + 60) % 360

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-lg select-none ${className}`}
      style={{
        background: `radial-gradient(circle at 22% 28%, hsl(${h1} 65% 42% / 0.85), transparent 65%), linear-gradient(135deg, hsl(${h1} 55% 24%), hsl(${h2} 60% 12%))`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {video.original && (
        <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-white uppercase shadow-sm">
          Original
        </span>
      )}

      <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur-xs">
        {video.ageRating === 0 ? 'All' : `${video.ageRating}+`}
      </span>

      {showPlayOverlay && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black shadow-lg">
            ▶
          </span>
        </div>
      )}

      <div className="absolute inset-x-2.5 bottom-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white drop-shadow-xs">{video.title}</p>
          <p className="truncate text-[11px] text-white/75">
            {video.year} · {formatRuntime(video.runtimeMin)}
          </p>
        </div>
      </div>
    </div>
  )
}

export function StarRating({
  rating,
  onRate,
  size = 'md',
  label,
}: {
  rating: number | null
  onRate: (stars: number | null) => void
  size?: 'sm' | 'md' | 'lg'
  label?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const active = hover ?? rating ?? 0
  const iconCls = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'

  return (
    <div
      role="group"
      aria-label={label ?? 'Rate from 1 to 5 stars'}
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active
        const isCurrent = rating === star
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onClick={(e) => {
              e.stopPropagation()
              onRate(isCurrent ? null : star)
            }}
            aria-label={isCurrent ? `Clear ${star} out of 5 rating` : `Rate ${star} out of 5`}
            aria-pressed={isCurrent}
            title={isCurrent ? `Rated ${star}/5 (click to clear)` : `Rate ${star}/5`}
            className={`rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary ${
              filled ? 'text-amber-400' : 'text-[var(--text-muted)]/50 hover:text-amber-300'
            }`}
          >
            <StarIcon filled={filled} className={iconCls} />
          </button>
        )
      })}
      <span className="ml-1 text-xs tabular-nums text-[var(--text-muted)]">
        {rating ? `${rating}/5` : 'Rate 1–5'}
      </span>
    </div>
  )
}
