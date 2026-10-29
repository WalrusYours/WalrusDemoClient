import { communityRatings, initialUserRatings, videos } from '../data/videos'
import type { Video, VideoSuggestion } from '../types'
import type { KnobValues } from './types'

// The mock's video streaming recommender: a port of walrus/docs/schema/schema-examples/movies.yml.
//
//   rate              1..5 stars, centred at 3 via (v - 3) / 2 so 4..5 pull similar films up and 1..2 push them down
//   content           film-to-film similarity (genres 0.55, director 0.15, era 0.15, runtime 0.15)
//   people_like_you   viewers whose star ratings agree with yours
//   popularity        views and community rating
//   recency           release year, boosted by originals_amount when show_originals is on
//   boost_originals   editorial rule boosting platform originals when show_originals is on
//   bury_old          editorial rule burying pre-1970 titles

const ratingsByUser = new Map<string, Map<string, number>>(
  Object.entries(initialUserRatings).map(([u, map]) => [u, new Map(Object.entries(map))]),
)

function userMap(userId: string): Map<string, number> {
  let m = ratingsByUser.get(userId)
  if (!m) {
    // New signed-in usernames start with Maya's starter ratings so the demo is lively right away.
    const seed = userId === 'u_theo' ? {} : (initialUserRatings[userId] ?? initialUserRatings.u_maya)
    m = new Map(Object.entries(seed))
    ratingsByUser.set(userId, m)
  }
  return m
}

function hydrate(userId: string, v: Video): Video {
  const r = userMap(userId).get(v.id) ?? null
  return { ...structuredClone(v), userRating: r }
}

export function rateVideo(userId: string, videoId: string, rating: number | null): Video {
  const found = videos.find((v) => v.id === videoId)
  if (!found) throw new Error('unknown video')
  const m = userMap(userId)
  if (rating === null || rating < 1 || rating > 5) {
    m.delete(videoId)
  } else {
    m.set(videoId, Math.round(rating))
  }
  return hydrate(userId, found)
}

const jaccard = (a: string[], b: string[]) => {
  const set = new Set(a)
  const shared = b.filter((x) => set.has(x)).length
  const union = a.length + b.length - shared
  return union === 0 ? 0 : shared / union
}

/** Similarity between two films, following movies.yml (genres 0.55, director 0.15, era 0.15, length 0.15). */
function filmSimilarity(a: Video, b: Video): number {
  const genres = jaccard(a.genres, b.genres)
  const director = a.director === b.director ? 1 : 0
  const era = Math.max(0, 1 - Math.abs(a.year - b.year) / 40)
  const length = Math.max(0, 1 - Math.abs(a.runtimeMin - b.runtimeMin) / 90)
  return 0.55 * genres + 0.15 * director + 0.15 * era + 0.15 * length
}

function normalise(xs: number[]): number[] {
  const lo = Math.min(...xs)
  const hi = Math.max(...xs)
  return xs.map((x) => (hi > lo ? (x - lo) / (hi - lo) : 0.5))
}

/** Transform from movies.yml: (v - 3) / 2, mapping 1..5 stars to -1..+1. */
const starTransform = (stars: number) => (stars - 3) / 2

export function listVideos(
  userId: string,
  knobs: KnobValues,
): {
  featured: Video
  recommended: VideoSuggestion[]
  catalogue: Video[]
  candidates: number
  tookMs: number
} {
  const hydrated = videos.map((v) => hydrate(userId, v))

  const k = (id: string, d: number) => knobs[id] ?? d
  const tasteVsCrowd = k('video_taste_vs_crowd', 0.5)
  const showOriginals = k('show_originals', 1) >= 0.5
  const originalsAmount = k('originals_amount', 0.5)
  const useRatings = k('use_ratings', 1) >= 0.5

  const ratedEntries = useRatings
    ? hydrated
        .filter((v) => v.userRating !== null)
        .map((v) => ({ video: v, weight: starTransform(v.userRating!) }))
    : []

  const contentRaw = hydrated.map((cand) => {
    const others = ratedEntries.filter((r) => r.video.id !== cand.id && r.weight !== 0)
    if (others.length === 0) return 0
    const sum = others.reduce((acc, r) => acc + r.weight * filmSimilarity(cand, r.video), 0)
    return sum / others.length
  })

  // people_like_you: other viewers weighted by agreement on rated titles
  const collabRaw = hydrated.map((cand) => {
    let score = 0
    for (const peer of communityRatings) {
      let overlap = 0
      if (ratedEntries.length === 0) {
        overlap = 0.3
      } else {
        for (const r of ratedEntries) {
          const peerStars = peer[r.video.id]
          if (peerStars !== undefined) {
            overlap += r.weight * starTransform(peerStars)
          }
        }
      }
      if (overlap > 0 && peer[cand.id] !== undefined) {
        score += overlap * starTransform(peer[cand.id])
      }
    }
    return score
  })

  const maxViews = Math.max(...hydrated.map((v) => v.views))
  const popRaw = hydrated.map((v) => 0.6 * (v.views / maxViews) + 0.4 * ((v.communityRating - 3.5) / 1.5))
  const recencyRaw = hydrated.map((v) => Math.max(0, 1 - (2026 - v.year) / 25))

  const contentNorm = normalise(contentRaw)
  const collabNorm = normalise(collabRaw)
  const popNorm = normalise(popRaw)
  const recencyNorm = normalise(recencyRaw)

  const wContent = ratedEntries.length > 0 ? 0.6 * (1 - tasteVsCrowd) : 0.15
  const wCollab = 0.4 * tasteVsCrowd + (ratedEntries.length > 0 ? 0.2 * (1 - tasteVsCrowd) : 0.3)
  const wPop = 0.35 * tasteVsCrowd + (ratedEntries.length === 0 ? 0.35 : 0.1)
  const wRecency = showOriginals ? 0.3 * originalsAmount : 0.1

  const scored = hydrated.map((video, i) => {
    const parts = [
      { id: 'content', val: wContent * contentNorm[i] },
      { id: 'collab', val: wCollab * collabNorm[i] },
      { id: 'popularity', val: wPop * popNorm[i] },
      { id: 'recency', val: wRecency * recencyNorm[i] },
    ]
    let total = parts.reduce((s, p) => s + p.val, 0)

    // Editorial rules from movies.yml: boost_originals and bury_old
    const boostedOriginal = showOriginals && video.original
    if (boostedOriginal) {
      total *= 1 + 0.3 * (0.5 + originalsAmount)
    }
    const buried = video.year < 1970

    // Reason generation
    let because = 'Popular right now'
    const positivelyRated = ratedEntries
      .filter((r) => r.weight > 0 && r.video.id !== video.id)
      .sort((a, b) => filmSimilarity(video, b.video) * b.weight - filmSimilarity(video, a.video) * a.weight)

    if (positivelyRated.length > 0 && wContent >= wPop * 0.8) {
      const best = positivelyRated[0].video
      if (best.director === video.director) {
        because = `Same director as “${best.title}”, which you rated ${best.userRating}/5`
      } else {
        const sharedGenres = video.genres.filter((g) => best.genres.includes(g))
        because = sharedGenres.length
          ? `Because you rated “${best.title}” ${best.userRating}/5 (${sharedGenres.slice(0, 2).join(', ')})`
          : `Close to “${best.title}” (${best.userRating}/5)`
      }
    } else if (boostedOriginal && originalsAmount >= 0.65) {
      because = 'WALRUS Original · New release'
    } else if (tasteVsCrowd >= 0.65) {
      because = `Trending with viewers (${video.views}M views · ${video.communityRating.toFixed(1)}★)`
    } else if (positivelyRated.length > 0) {
      const best = positivelyRated[0].video
      because = `Liked by viewers who rated “${best.title}” highly`
    } else if (video.original && showOriginals) {
      because = 'Featured Original'
    }

    return { video, score: total, buried, because }
  })

  scored.sort((a, b) => {
    if (a.buried !== b.buried) return Number(a.buried) - Number(b.buried)
    return b.score - a.score || a.video.id.localeCompare(b.video.id)
  })

  // Apply director quota rule from movies.yml (max 2 per 10)
  const top: typeof scored = []
  const rest: typeof scored = []
  const dirCount = new Map<string, number>()
  for (const item of scored) {
    const c = dirCount.get(item.video.director) ?? 0
    if (top.length < 10 && c < 2) {
      top.push(item)
      dirCount.set(item.video.director, c + 1)
    } else {
      rest.push(item)
    }
  }
  const ordered = [...top, ...rest]
  const featured = ordered.find((x) => x.video.original)?.video ?? ordered[0].video

  return {
    featured,
    recommended: ordered.slice(0, 8).map(({ video, score, because }) => ({ video, score, because })),
    catalogue: hydrated,
    candidates: hydrated.length,
    tookMs: 4,
  }
}

export function getVideo(
  userId: string,
  videoId: string,
  knobs: KnobValues,
): {
  video: Video
  similar: VideoSuggestion[]
  fromDirector: Video[]
  candidates: number
  tookMs: number
} {
  const target = videos.find((v) => v.id === videoId)
  if (!target) throw new Error('unknown video')
  const video = hydrate(userId, target)
  const others = videos.filter((v) => v.id !== videoId).map((v) => hydrate(userId, v))

  const tasteVsCrowd = knobs.video_taste_vs_crowd ?? 0.5
  const useRatings = (knobs.use_ratings ?? 1) >= 0.5
  const maxViews = Math.max(...others.map((v) => v.views))

  const userRated = useRatings
    ? others.filter((v) => v.userRating !== null && v.userRating !== 3)
    : []

  const scored = others.map((cand) => {
    const simSeed = filmSimilarity(cand, video)
    const pop = cand.views / maxViews
    let userBlend = 0
    if (userRated.length > 0) {
      userBlend =
        userRated.reduce((acc, r) => acc + starTransform(r.userRating!) * filmSimilarity(cand, r), 0) /
        userRated.length
    }
    const score = (1 - 0.5 * tasteVsCrowd) * simSeed + 0.5 * tasteVsCrowd * pop + 0.2 * userBlend

    const sharedGenres = cand.genres.filter((g) => video.genres.includes(g))
    const because =
      cand.director === video.director
        ? `Also directed by ${video.director}`
        : sharedGenres.length > 0
          ? `Shares ${sharedGenres.slice(0, 2).join(' & ')} with “${video.title}”`
          : `Similar era and pacing to “${video.title}”`

    return { video: cand, score, because }
  })

  scored.sort((a, b) => b.score - a.score)

  const fromDirector = others
    .filter((v) => v.director === video.director)
    .sort((a, b) => b.views - a.views)

  return {
    video,
    similar: scored.slice(0, 6),
    fromDirector,
    candidates: others.length,
    tookMs: 3,
  }
}
