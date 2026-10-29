import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { StarRating, VideoThumbnail, formatRuntime, videoHue } from '../components/video/VideoCover'
import { WalrusTune } from '../components/walrus/WalrusTune'
import { useSession } from '../context/SessionContext'
import type { Video, VideoSuggestion } from '../types'

type HomeData = {
  featured: Video
  recommended: VideoSuggestion[]
  catalogue: Video[]
  candidates: number
  tookMs: number
}

type DetailData = {
  video: Video
  similar: VideoSuggestion[]
  fromDirector: Video[]
  candidates: number
  tookMs: number
}

function ratingNote(stars: number | null): string {
  if (stars === null) return 'Rate 1–5 stars to tune your recommendations'
  if (stars >= 4) return `Rated ${stars}/5 · Boosts similar films`
  if (stars === 3) return 'Rated 3/5 · Neutral (3 stars is the midpoint)'
  return `Rated ${stars}/5 · Pushes similar films down`
}

export function VideoPage() {
  const { videoId } = useParams<{ videoId?: string }>()
  const navigate = useNavigate()
  const { userId, knobs } = useSession()

  const [home, setHome] = useState<HomeData | 'error' | null>(null)
  const [loadedDetail, setLoadedDetail] = useState<{ videoId: string; data: DetailData | 'missing' } | null>(null)
  const [version, setVersion] = useState(0)
  const [genreFilter, setGenreFilter] = useState<string>('all')
  const [playing, setPlaying] = useState(() => Boolean(videoId))
  const [progress, setProgress] = useState(18)

  // Simulated playback progress ticker while playing
  useEffect(() => {
    if (!playing || !videoId) return
    const timer = window.setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : +(p + 0.4).toFixed(1)))
    }, 500)
    return () => window.clearInterval(timer)
  }, [playing, videoId])

  // Fetch home recommendations & catalogue whenever user, knobs, or ratings change
  useEffect(() => {
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => {
      api.listVideos(userId, { knobs, signal: ctrl.signal }).then(
        (res) => !ctrl.signal.aborted && setHome(res),
        () => !ctrl.signal.aborted && setHome('error'),
      )
    }, 50)
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [userId, knobs, version])

  // Fetch selected video details & "More like this" when videoId is active
  useEffect(() => {
    if (!videoId) return
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => {
      api.getVideo(userId, videoId, { knobs, signal: ctrl.signal }).then(
        (res) => !ctrl.signal.aborted && setLoadedDetail({ videoId, data: res }),
        () => !ctrl.signal.aborted && setLoadedDetail({ videoId, data: 'missing' }),
      )
    }, 50)
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [userId, videoId, knobs, version])

  const detail = videoId && loadedDetail?.videoId === videoId ? loadedDetail.data : null

  const handleRate = async (targetId: string, stars: number | null) => {
    await api.rateVideo(userId, targetId, stars)
    setVersion((v) => v + 1)
  }

  const selectVideo = (id: string) => {
    setPlaying(true)
    setProgress(18)
    navigate(`/video/${id}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (home === null) return <p className="px-1 text-[var(--text-muted)]">Loading streaming catalogue...</p>
  if (home === 'error') return <p className="px-1 text-[var(--text-muted)]">Could not load videos.</p>

  const genres = Array.from(new Set(home.catalogue.flatMap((v) => v.genres))).sort()
  const ratedCount = home.catalogue.filter((v) => v.userRating !== null).length

  const filteredCatalogue = home.catalogue.filter((v) => {
    if (genreFilter === 'all') return true
    if (genreFilter === 'originals') return v.original
    if (genreFilter === 'rated') return v.userRating !== null
    return v.genres.includes(genreFilter)
  })

  const selected = detail && detail !== 'missing' ? detail.video : null
  const hero = selected ?? home.featured
  const h1 = videoHue(hero.title)
  const h2 = (videoHue(hero.director) + 60) % 360

  const elapsedMin = Math.round((progress / 100) * hero.runtimeMin)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold">Watch</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Choose a film to stream and rate it 1–5 stars to shape your recommendations.
          </p>
        </div>
        {videoId && (
          <button
            type="button"
            onClick={() => navigate('/video')}
            className="rounded-full bg-[var(--container)] px-3.5 py-1.5 text-xs font-semibold hover:bg-[var(--surface)]"
          >
            ← Back to browse
          </button>
        )}
      </div>

      {/* Selected Video Player OR Featured Hero Spotlight */}
      <section
        aria-label={selected ? `Now playing: ${selected.title}` : `Featured: ${hero.title}`}
        className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--container)] shadow-md"
      >
        {/* Widescreen 16:9 Cinema Stage */}
        <div
          className="relative aspect-video w-full overflow-hidden select-none"
          style={{
            background: `radial-gradient(circle at 75% 25%, hsl(${h1} 70% 45% / 0.55), transparent 60%), linear-gradient(145deg, hsl(${h1} 55% 20%), hsl(${h2} 65% 8%))`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />

          {/* Top badges */}
          <div className="absolute inset-x-4 top-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {hero.original && (
                <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-extrabold tracking-wider text-white uppercase">
                  WALRUS Original
                </span>
              )}
              <span className="rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white/85 backdrop-blur-xs">
                {selected ? (playing ? '● Now Streaming' : 'Paused') : 'Featured Film'}
              </span>
            </div>
            <span className="rounded bg-black/60 px-2 py-0.5 text-xs font-semibold text-white/90">
              {hero.ageRating === 0 ? 'All ages' : `${hero.ageRating}+`}
            </span>
          </div>

          {/* Center play/pause button when selected */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                if (!selected) {
                  selectVideo(hero.id)
                } else {
                  setPlaying((p) => !p)
                }
              }}
              aria-label={selected ? (playing ? `Pause ${hero.title}` : `Play ${hero.title}`) : `Select and watch ${hero.title}`}
              className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-lg font-bold text-black shadow-xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {selected && playing ? '❚❚' : '▶'}
            </button>
          </div>

          {/* Bottom overlay inside the video canvas */}
          <div className="absolute inset-x-4 bottom-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-extrabold text-white drop-shadow-xs sm:text-3xl">
                  {hero.title}
                </h2>
                <p className="text-xs text-white/80">
                  Directed by <span className="font-semibold text-white">{hero.director}</span> · {hero.year} ·{' '}
                  {formatRuntime(hero.runtimeMin)} · {hero.communityRating.toFixed(1)}★ ({hero.views}M views)
                </p>
              </div>
              {!selected && (
                <button
                  type="button"
                  onClick={() => selectVideo(hero.id)}
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-primaryfocus"
                >
                  ▶ Watch now
                </button>
              )}
            </div>

            {/* Interactive scrubber bar when a video is selected */}
            {selected && (
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="text-xs font-semibold text-white/90 hover:text-white"
                >
                  {playing ? 'Pause' : 'Play'}
                </button>
                <input
                  type="range"
                  aria-label="Playback position"
                  min={0}
                  max={100}
                  step={0.5}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer accent-primary"
                />
                <span className="text-[11px] tabular-nums text-white/75">
                  {formatRuntime(elapsedMin)} / {formatRuntime(hero.runtimeMin)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Details & 1-5 Star Rating Bar */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {hero.genres.map((g) => (
              <span
                key={g}
                className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium capitalize text-[var(--text-muted)]"
              >
                {g}
              </span>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-[var(--text)]">{hero.synopsis}</p>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/50 px-3.5 py-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-[var(--text)]">Your rating</span>
              <span className="text-[11px] text-[var(--text-muted)]">{ratingNote(hero.userRating)}</span>
            </div>
            <StarRating
              rating={hero.userRating}
              onRate={(stars) => handleRate(hero.id, stars)}
              size="lg"
              label={`Rate ${hero.title} from 1 to 5 stars`}
            />
          </div>
        </div>
      </section>

      {/* When a video is selected: "More like this" & "More from this director" */}
      {selected && detail && detail !== 'missing' && (
        <section aria-labelledby="similar-video-title" className="rounded-lg bg-[var(--container)] p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 id="similar-video-title" className="text-[17px] font-semibold">
                More like “{selected.title}”
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Similar films blended with your star ratings. Click any film to switch or rate it 1/5.
              </p>
            </div>
            <WalrusTune align="right" surface="video" show={{ badge: false }} />
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {detail.similar.map(({ video: v, because }) => (
              <li
                key={v.id}
                onClick={() => selectVideo(v.id)}
                className="group flex cursor-pointer flex-col justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)]/50 p-2.5 transition-colors hover:border-primary/60 hover:bg-[var(--surface-hover)]"
              >
                <div>
                  <VideoThumbnail video={v} showPlayOverlay />
                  <p className="mt-2 truncate text-xs text-[var(--text-muted)]">{because}</p>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
                  <span className="text-[11px] text-[var(--text-muted)]">{v.director}</span>
                  <StarRating
                    rating={v.userRating}
                    onRate={(stars) => handleRate(v.id, stars)}
                    size="sm"
                    label={`Rate ${v.title} from 1 to 5 stars`}
                  />
                </div>
              </li>
            ))}
          </ul>

          {detail.fromDirector.length > 0 && (
            <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
              <h3 className="mb-2 text-sm font-semibold text-[var(--text-muted)]">
                More from {selected.director}
              </h3>
              <div className="flex flex-wrap gap-2">
                {detail.fromDirector.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => selectVideo(v.id)}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-1.5 text-left text-xs hover:border-primary"
                  >
                    <span className="font-semibold text-[var(--text)]">{v.title}</span>
                    <span className="text-[var(--text-muted)]">({v.year})</span>
                    {v.userRating && <span className="text-amber-400">{v.userRating}/5★</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Picked for you (WALRUS ranked shelf) */}
      <section aria-labelledby="picked-title" className="rounded-lg bg-[var(--container)] p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="picked-title" className="text-[17px] font-semibold">
              Picked for you
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Ranked from your {ratedCount} star {ratedCount === 1 ? 'rating' : 'ratings'} and Tune controls.
            </p>
          </div>
          <WalrusTune align="right" surface="video" show={{ badge: false }} />
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {home.recommended.map(({ video: v, because }) => {
            const isSelected = selected?.id === v.id
            return (
              <li
                key={v.id}
                onClick={() => selectVideo(v.id)}
                className={`group flex cursor-pointer flex-col justify-between rounded-lg border p-2.5 transition-colors hover:bg-[var(--surface-hover)] ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-[var(--border-subtle)] bg-[var(--bg)]/40 hover:border-[var(--border-strong)]'
                }`}
              >
                <div>
                  <VideoThumbnail video={v} showPlayOverlay />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-[var(--text)]">
                      {v.director} · {v.genres.slice(0, 2).join(', ')}
                    </span>
                    <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                      {v.communityRating.toFixed(1)}★
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-primary/90">{because}</p>
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      selectVideo(v.id)
                    }}
                    className="text-xs font-semibold text-[var(--text)] group-hover:text-primary"
                  >
                    {isSelected ? '● Selected' : '▶ Select'}
                  </button>
                  <StarRating
                    rating={v.userRating}
                    onRate={(stars) => handleRate(v.id, stars)}
                    size="sm"
                    label={`Rate ${v.title} from 1 to 5 stars`}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        <p className="mt-3 border-t border-[var(--border-subtle)] pt-2 text-[11px] text-[var(--text-muted)]">
          Ranked in {home.tookMs} ms from {home.candidates} films
        </p>
      </section>

      {/* Browse All / Category Filter Shelf */}
      <section aria-labelledby="browse-title" className="rounded-lg bg-[var(--container)] p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2">
          <h2 id="browse-title" className="text-[17px] font-semibold">
            Browse catalogue
          </h2>
          <div role="tablist" aria-label="Filter films" className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${home.catalogue.length})` },
              { id: 'originals', label: 'Originals' },
              { id: 'rated', label: `Rated by you (${ratedCount})` },
              ...genres.map((g) => ({ id: g, label: g })),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={genreFilter === tab.id}
                onClick={() => setGenreFilter(tab.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  genreFilter === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredCatalogue.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">
            No films in this filter yet. Click the stars on any film to rate it 1/5.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filteredCatalogue.map((v) => {
              const isSelected = selected?.id === v.id
              return (
                <li
                  key={v.id}
                  onClick={() => selectVideo(v.id)}
                  className={`group flex cursor-pointer flex-col justify-between rounded-lg border p-2.5 transition-colors hover:bg-[var(--surface-hover)] ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-[var(--border-subtle)] bg-[var(--bg)]/40 hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div>
                    <VideoThumbnail video={v} showPlayOverlay />
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--text-muted)]">{v.synopsis}</p>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
                    <span className="truncate text-xs font-medium text-[var(--text-muted)]">
                      {v.director}
                    </span>
                    <StarRating
                      rating={v.userRating}
                      onRate={(stars) => handleRate(v.id, stars)}
                      size="sm"
                      label={`Rate ${v.title} from 1 to 5 stars`}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
