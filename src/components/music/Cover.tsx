import type { Track } from '../../types'

// Cover art without images: a gradient whose hue comes from the artist, so a band's songs look
// related. A playlist cover is the first four songs as a 2x2 mosaic.

function hue(text: string): number {
  let h = 0
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

export function TrackCover({ track, className = 'h-10 w-10' }: { track: Track; className?: string }) {
  const h = hue(track.artist)
  return (
    <div
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-md text-xs font-bold text-white/90 ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${h} 55% 48%), hsl(${(h + 40) % 360} 55% 26%))` }}
    >
      {track.title.charAt(0)}
    </div>
  )
}

export function PlaylistCover({ tracks, className = 'h-32 w-32' }: { tracks: Track[]; className?: string }) {
  const cells = tracks.slice(0, 4)
  if (cells.length === 0) {
    return (
      <div aria-hidden="true" className={`grid place-items-center rounded-lg bg-[var(--surface)] text-3xl text-[var(--text-muted)] ${className}`}>
        ♪
      </div>
    )
  }
  return (
    <div aria-hidden="true" className={`grid grid-cols-2 overflow-hidden rounded-lg ${className}`}>
      {Array.from({ length: 4 }, (_, i) => cells[i % cells.length]).map((t, i) => (
        <div
          key={i}
          style={{ background: `linear-gradient(135deg, hsl(${hue(t.artist)} 55% 48%), hsl(${(hue(t.artist) + 40) % 360} 55% 26%))` }}
        />
      ))}
    </div>
  )
}

/** 255 seconds as 4:15. */
export function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** A playlist's length: "2 h 5 min" or "42 min". */
export function totalLength(tracks: Track[]): string {
  const min = Math.round(tracks.reduce((s, t) => s + t.seconds, 0) / 60)
  return min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`
}
