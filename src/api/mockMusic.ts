import { communityPlaylists, initialPlaylists, likedTrackIds, tracks } from '../data/music'
import type { Playlist, Suggestion, Track } from '../types'
import type { KnobValues } from './types'

// The mock's "you might also add": a port of the `playlist_add` recommender in
// walrus/docs/schema/schema-examples/spotify.yml. The mock stands in for the app server and
// WALRUS, so the ranking lives here; the client only shows the order it gets back.
//
//   seed          the playlist's tracks (seed: items), aggregated by mean or max
//   co_listed     added to the same playlists as the seed (co_occurrence, cosine of sets)
//   genre_fit     shared genres with the seed (item_neighbors, jaccard)
//   sounds_like   energy and mood close to the seed (item_neighbors)
//   energy_fit    close to the playlist's average energy (attribute_target, seed.mean)
//   my_taste      close to songs the user liked
//   popularity    plays, exploration: the opposite
// Weights come from the schema and the "Playlist suggestions" knobs; the weights of energy_fit
// and my_taste depend on the playlist's size (weights as expressions of seed.size).
// A song already in the playlist is excluded (not_in_seed), and at most one song per artist
// appears in the first ten (one_per_artist). An empty playlist falls back to its title.

const byId = new Map(tracks.map((t) => [t.id, t]))
const playlists: Playlist[] = structuredClone(initialPlaylists)

export const catalogue = tracks
export const trackById = (id: string) => byId.get(id)

export function listPlaylists(): Playlist[] {
  return structuredClone(playlists)
}

export function getPlaylist(id: string): Playlist | undefined {
  const p = playlists.find((x) => x.id === id)
  return p && structuredClone(p)
}

export function createPlaylist(name: string): Playlist {
  const p: Playlist = { id: `pl_${Date.now().toString(36)}`, name: name.trim(), description: '', trackIds: [] }
  playlists.unshift(p)
  return structuredClone(p)
}

export function addTrack(playlistId: string, trackId: string) {
  const p = playlists.find((x) => x.id === playlistId)
  if (p && byId.has(trackId) && !p.trackIds.includes(trackId)) p.trackIds.push(trackId)
}

export function removeTrack(playlistId: string, trackId: string) {
  const p = playlists.find((x) => x.id === playlistId)
  if (p) p.trackIds = p.trackIds.filter((id) => id !== trackId)
}

export interface Suggestions {
  suggestions: Suggestion[]
  candidates: number
  /** true when the playlist was empty and only its title was used */
  fromTitle: boolean
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const jaccard = (a: string[], b: string[]) => {
  const set = new Set(a)
  const shared = b.filter((x) => set.has(x)).length
  const union = a.length + b.length - shared
  return union === 0 ? 0 : shared / union
}
const soundSim = (a: Track, b: Track) => 1 - (Math.abs(a.energy - b.energy) + Math.abs(a.valence - b.valence)) / 2
/** mean (fit the whole seed) to max (fit any one item in it), by `a` in 0..1 */
const aggregate = (xs: number[], a: number) => (xs.length ? (1 - a) * mean(xs) + a * Math.max(...xs) : 0)
/** min-max within the candidates; a constant signal carries no information (ALGORITHMS.md 7) */
function normalise(xs: number[]): number[] {
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  return xs.map((x) => (hi > lo ? (x - lo) / (hi - lo) : 0.5))
}

type Signal = 'co_listed' | 'vibe' | 'energy_fit' | 'taste' | 'popularity' | 'exploration'

export function suggest(playlistId: string, knobs: KnobValues, limit = 8): Suggestions {
  const playlist = playlists.find((p) => p.id === playlistId)
  if (!playlist) throw new Error('unknown playlist')
  const members = new Set(playlist.trackIds)
  const seeds = playlist.trackIds.flatMap((id) => byId.get(id) ?? [])
  const liked = likedTrackIds.flatMap((id) => byId.get(id) ?? [])
  const candidates = tracks.filter((t) => !members.has(t.id)) // not_in_seed
  const n = seeds.length
  const maxPlays = Math.max(...tracks.map((t) => t.plays))

  const k = (id: string, d: number) => knobs[id] ?? d
  const vibe = k('vibe_vs_branch_out', 0.3)
  const w = {
    co_listed: 0.4,
    genre: 0.15,
    sounds: 0.35 * (1 - vibe),
    exploration: 0.3 * vibe,
    popularity: 0.2 * k('deep_cuts_vs_hits', 0.3),
    energy_fit: (0.1 * Math.min(n, 5)) / 5, // trust the playlist's centre as it grows
    taste: (0.15 + (0.25 * Math.max(0, 3 - n)) / 3) * k('mix_in_my_taste', 1), // lean on the owner early
  }
  const agg = k('whole_vs_any', 0)

  const popularity = normalise(candidates.map((t) => Math.log1p(t.plays) / Math.log1p(maxPlays)))
  const taste = normalise(candidates.map((t) => mean(liked.map((l) => (jaccard(t.genres, l.genres) + soundSim(t, l)) / 2))))

  // An empty playlist has no seed: only its title (and the owner's taste) to go on.
  if (n === 0) {
    const words = playlist.name.toLowerCase().split(/[^a-z]+/).filter(Boolean)
    const matches = candidates.map((t) => (t.genres.some((g) => words.some((x) => g.includes(x))) ? 1 : 0))
    const scored = candidates
      .map((track, i) => ({
        track,
        score: 0.6 * matches[i] + 0.25 * taste[i] + 0.15 * popularity[i],
        because: matches[i] ? `Matches “${playlist.name}”` : 'Popular with people like you',
      }))
      .sort((a, b) => b.score - a.score)
    return { suggestions: scored.slice(0, limit), candidates: candidates.length, fromTitle: true }
  }

  // co_listed: other playlists (everyone's) that share songs with this one
  const others = [...communityPlaylists, ...playlists.filter((p) => p.id !== playlistId).map((p) => p.trackIds)]
  const together = (a: string, b: string) => others.filter((q) => q.includes(a) && q.includes(b)).length
  const coListed = candidates.map((c) =>
    others.reduce((sum, q) => {
      if (!q.includes(c.id)) return sum
      const overlap = q.filter((id) => members.has(id)).length
      return sum + overlap / Math.sqrt(q.length * n)
    }, 0),
  )
  const genre = candidates.map((c) => aggregate(seeds.map((s) => jaccard(c.genres, s.genres)), agg))
  const sounds = candidates.map((c) => aggregate(seeds.map((s) => soundSim(c, s)), agg))
  const centre = mean(seeds.map((s) => s.energy))
  const energyFit = candidates.map((c) => 1 - Math.abs(c.energy - centre))
  const explore = popularity.map((p) => 1 - p)

  const norm = {
    co_listed: normalise(coListed),
    vibe: normalise(candidates.map((_, i) => (w.genre * genre[i] + w.sounds * sounds[i]) / (w.genre + w.sounds || 1))),
    energy_fit: normalise(energyFit),
    taste,
    popularity,
    exploration: explore,
  }
  const weight: Record<Signal, number> = {
    co_listed: w.co_listed,
    vibe: w.genre + w.sounds,
    energy_fit: w.energy_fit,
    taste: w.taste,
    popularity: w.popularity,
    exploration: w.exploration,
  }

  const scored = candidates.map((track, i) => {
    const parts = (Object.keys(weight) as Signal[]).map((s) => ({ s, v: weight[s] * norm[s][i] }))
    const top = parts.reduce((a, b) => (b.v > a.v ? b : a))
    return { track, score: parts.reduce((sum, p) => sum + p.v, 0), top: top.s, i }
  })
  scored.sort((a, b) => b.score - a.score || a.track.id.localeCompare(b.track.id))

  const because = (e: (typeof scored)[number]): string => {
    const t = e.track
    switch (e.top) {
      case 'co_listed': {
        const best = seeds.reduce((a, b) => (together(t.id, b.id) > together(t.id, a.id) ? b : a))
        return `Often added to playlists with “${best.title}”`
      }
      case 'vibe': {
        const counts = new Map<string, number>()
        for (const s of seeds) for (const g of s.genres) counts.set(g, (counts.get(g) ?? 0) + 1)
        const shared = t.genres.filter((g) => counts.has(g)).sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
        return shared.length ? `Fits the vibe: ${shared.slice(0, 2).join(', ')}` : 'Sounds like the rest of this playlist'
      }
      case 'energy_fit':
        return 'Same energy as most of this playlist'
      case 'taste':
        return 'Close to songs you like'
      case 'popularity':
        return 'Popular right now'
      default:
        return 'Something you may not have heard'
    }
  }

  // one_per_artist: at most one song per artist in the first ten, the rest follow
  const first: typeof scored = []
  const later: typeof scored = []
  const artists = new Set<string>()
  for (const e of scored) {
    if (first.length < 10 && !artists.has(e.track.artist)) {
      first.push(e)
      artists.add(e.track.artist)
    } else later.push(e)
  }
  const ordered = [...first, ...later].slice(0, limit)
  return {
    suggestions: ordered.map((e) => ({ track: e.track, score: e.score, because: because(e) })),
    candidates: candidates.length,
    fromTitle: false,
  }
}
