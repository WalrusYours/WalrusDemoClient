import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { PlaylistCover, totalLength } from '../components/music/Cover'
import { useSession } from '../context/SessionContext'
import type { Playlist, Track } from '../types'

type Loaded = { playlists: Playlist[]; tracks: Map<string, Track> }

export function MusicPage() {
  const { userId } = useSession()
  const navigate = useNavigate()
  const [data, setData] = useState<Loaded | 'error' | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    api.listPlaylists(userId).then(
      async (playlists) => {
        // Cover art needs each playlist's first songs.
        const full = await Promise.all(playlists.map((p) => api.getPlaylist(userId, p.id)))
        const tracks = new Map(full.flatMap((f) => f.tracks).map((t) => [t.id, t]))
        if (live) setData({ playlists, tracks })
      },
      () => live && setData('error'),
    )
    return () => {
      live = false
    }
  }, [userId])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      const p = await api.createPlaylist(userId, trimmed)
      navigate(`/music/${p.id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 text-2xl font-bold">Music</h1>

      <form onSubmit={create} className="flex gap-2 rounded-lg bg-[var(--container)] p-3 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="New playlist name"
          placeholder="New playlist, for example “Rock workout”"
          maxLength={60}
          className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--input)] px-3 py-2 text-[var(--text)] outline-none placeholder:text-[var(--placeholder)] focus:border-primary"
        />
        <button
          type="submit"
          disabled={!name.trim() || busy}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primaryfocus disabled:opacity-40"
        >
          Create
        </button>
      </form>

      {data === null && <p className="px-1 text-[var(--text-muted)]">Loading...</p>}
      {data === 'error' && <p className="px-1 text-[var(--text-muted)]">Could not load your playlists.</p>}
      {data && data !== 'error' && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.playlists.map((p) => {
            const tracks = p.trackIds.flatMap((id) => data.tracks.get(id) ?? [])
            return (
              <li key={p.id}>
                <Link
                  to={`/music/${p.id}`}
                  className="flex gap-3 rounded-lg bg-[var(--container)] p-3 shadow-sm transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <PlaylistCover tracks={tracks} className="h-24 w-24 shrink-0" />
                  <div className="min-w-0 self-center">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
                      {tracks.length > 0 && ` · ${totalLength(tracks)}`}
                    </p>
                    {p.description && <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{p.description}</p>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
