import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { PlaylistCover, TrackCover, clock, totalLength } from '../components/music/Cover'
import { WalrusTune } from '../components/walrus/WalrusTune'
import { useSession } from '../context/SessionContext'
import type { Playlist, Suggestion, Track } from '../types'

type Suggestions = { suggestions: Suggestion[]; candidates: number; tookMs: number; fromTitle: boolean }

export function PlaylistPage() {
  const { playlistId = '' } = useParams()
  const { userId, knobs } = useSession()
  const [data, setData] = useState<{ playlist: Playlist; tracks: Track[] } | 'missing' | null>(null)
  const [recs, setRecs] = useState<Suggestions | null>(null)
  // bumped after the playlist changes, so both lists are fetched again
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let live = true
    api.getPlaylist(userId, playlistId).then(
      (d) => live && setData(d),
      () => live && setData('missing'),
    )
    return () => {
      live = false
    }
  }, [userId, playlistId, version])

  // "You might want to add here...": refetched when the playlist or a Tune knob changes, so the
  // list follows the sliders. The old list stays until the new one arrives; the server orders it.
  useEffect(() => {
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => {
      api.getPlaylistSuggestions(userId, playlistId, { knobs, signal: ctrl.signal }).then(
        (r) => !ctrl.signal.aborted && setRecs(r),
        () => {},
      )
    }, 60)
    return () => {
      window.clearTimeout(timer)
      ctrl.abort()
    }
  }, [userId, playlistId, knobs, version])

  const change = async (action: Promise<void>) => {
    await action
    setVersion((v) => v + 1)
  }

  if (data === null) return <p className="px-1 text-[var(--text-muted)]">Loading...</p>
  if (data === 'missing') {
    return (
      <p className="px-1 text-[var(--text-muted)]">
        That playlist does not exist.{' '}
        <Link to="/music" className="text-primary">
          Back to your music
        </Link>
      </p>
    )
  }
  const { playlist, tracks } = data

  return (
    <div className="flex flex-col gap-4">
      <Link
        to="/music"
        className="self-start rounded-full bg-[var(--container)] px-4 py-1.5 text-sm font-semibold hover:bg-[var(--surface)]"
      >
        ← Your music
      </Link>

      <header className="flex items-end gap-4 rounded-lg bg-[var(--container)] p-4 shadow-sm">
        <PlaylistCover tracks={tracks} className="h-32 w-32 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Playlist</p>
          <h1 className="truncate text-3xl font-bold">{playlist.name}</h1>
          {playlist.description && <p className="text-sm text-[var(--text-muted)]">{playlist.description}</p>}
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
            {tracks.length > 0 && ` · ${totalLength(tracks)}`}
          </p>
        </div>
      </header>

      <section aria-label="Songs" className="rounded-lg bg-[var(--container)] shadow-sm">
        {tracks.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
            Nothing here yet. Add a song from the suggestions below.
          </p>
        ) : (
          <ol>
            {tracks.map((t, i) => (
              <li key={t.id} className="group flex items-center gap-3 px-4 py-2 hover:bg-[var(--surface-hover)]">
                <span className="w-5 text-right text-sm tabular-nums text-[var(--text-muted)]">{i + 1}</span>
                <TrackCover track={t} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="truncate text-sm text-[var(--text-muted)]">{t.artist}</p>
                </div>
                <span className="hidden truncate text-xs text-[var(--text-muted)] sm:block">{t.genres.slice(0, 2).join(', ')}</span>
                <span className="w-10 text-right text-sm tabular-nums text-[var(--text-muted)]">{clock(t.seconds)}</span>
                <button
                  type="button"
                  onClick={() => change(api.removeFromPlaylist(userId, playlist.id, t.id))}
                  aria-label={`Remove ${t.title} from ${playlist.name}`}
                  className="rounded-full px-2 text-lg leading-none text-[var(--text-muted)] opacity-0 transition-opacity hover:text-lightred focus-visible:opacity-100 group-hover:opacity-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="add-title" className="rounded-lg bg-[var(--container)] shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <div className="min-w-0">
            <h2 id="add-title" className="text-[17px] font-semibold">
              You might want to add here...
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
            {recs?.fromTitle
              ? 'This playlist is empty, so these go by its name and your taste.'
              : 'Songs that fit this playlist.'}
            </p>
          </div>
          <WalrusTune align="right" surface="playlist_add" show={{ badge: false }} />
        </div>

        {recs === null && <p className="px-4 py-4 text-sm text-[var(--text-muted)]">Loading...</p>}
        {recs && recs.suggestions.length === 0 && (
          <p className="px-4 py-4 text-sm text-[var(--text-muted)]">Nothing left to suggest.</p>
        )}
        {recs && recs.suggestions.length > 0 && (
          <ol>
            {recs.suggestions.map(({ track: t, because }) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--surface-hover)]">
                <TrackCover track={t} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {t.title} <span className="font-normal text-[var(--text-muted)]">· {t.artist}</span>
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{because}</p>
                </div>
                <button
                  type="button"
                  onClick={() => change(api.addToPlaylist(userId, playlist.id, t.id))}
                  aria-label={`Add ${t.title} to ${playlist.name}`}
                  className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1 text-sm font-semibold hover:border-primary hover:text-primary"
                >
                  Add
                </button>
              </li>
            ))}
          </ol>
        )}

        {recs && (
          <p className="border-t border-[var(--border-subtle)] px-4 py-2 text-[11px] text-[var(--text-muted)]">
            Ranked in {recs.tookMs} ms from {recs.candidates} songs
          </p>
        )}
      </section>
    </div>
  )
}
