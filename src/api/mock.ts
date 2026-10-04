import { initialPosts } from '../data/posts'
import type { Post } from '../types'
import { applyFeedback, feedbackReasons, listFeedback, recordFeedback, undoFeedback } from './mockFeedback'
import { knobConfig } from './mockKnobs'
import * as music from './mockMusic'
import { rankBySimilarity, weightsFrom } from './mockRank'
import { USERNAME_RE } from './types'
import type { HostApi, KnobValues, Profile } from './types'

// Stand-in for the app server while WALRUS is not wired in. It keeps host-owned data
// (votes, comments) in memory like a backend would. Its only ranking is by attribute
// similarity (mockRank.ts): "More like this" is ordered by the "Match similar posts by"
// weights, and the feed is ordered by them once you have liked a post (until then it keeps
// its fixed order). Every other knob is accepted and ignored, and explanations are
// placeholders. Real ordering and reasons must come from the server (WALRUS), never from
// this client.

const config = knobConfig

const posts: Post[] = structuredClone(initialPosts)
const profiles = new Map<string, Profile>()
const delay = (ms = 60) => new Promise((r) => setTimeout(r, ms))

function defaultProfile(): Profile {
  return { knobs: { ...config.presets[0].knobs }, preset: 'default' }
}

/** The user's saved knobs with the per-request overrides (a slider being dragged) on top. */
function weightsFor(userId: string, overrides?: KnobValues) {
  const saved = (profiles.get(userId) ?? defaultProfile()).knobs
  return weightsFrom({ ...saved, ...overrides })
}

export const mockApi: HostApi = {
  async login(username) {
    await delay()
    if (!USERNAME_RE.test(username)) throw new Error('Invalid username')
    return { token: 'mock', user: { id: username, username, avatarColor: 'bg-violet-600' } }
  },
  async logout() {},
  async getKnobConfig() {
    await delay()
    return config
  },
  async getProfile(userId) {
    await delay()
    return profiles.get(userId) ?? defaultProfile()
  },
  async saveProfile(userId, patch) {
    const current = profiles.get(userId) ?? defaultProfile()
    profiles.set(userId, { ...current, ...patch, knobs: { ...current.knobs, ...patch.knobs } })
  },
  async getFeed(userId, opts) {
    await delay()
    const started = performance.now()
    const w = weightsFor(userId, opts?.knobs)
    const liked = posts.filter((p) => p.userVote === 'like')
    const ordered = applyFeedback(userId, liked.length > 0 ? rankBySimilarity(liked, posts, w) : posts, posts, w)
    return {
      posts: structuredClone(ordered),
      tookMs: Math.round(performance.now() - started),
      candidates: posts.length,
    }
  },
  async createPost(userId, content) {
    await delay()
    const post: Post = {
      id: crypto.randomUUID(),
      author: userId,
      handle: userId,
      avatarColor: 'bg-violet-600',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      userVote: null,
      comments: [],
    }
    posts.unshift(post) // so a feed refetch keeps it
    return structuredClone(post)
  },
  async getRelated(userId, postId, opts) {
    await delay()
    const started = performance.now()
    const seed = posts.find((p) => p.id === postId)
    if (!seed) throw new Error('unknown post')
    const others = posts.filter((p) => p.id !== postId)
    const w = weightsFor(userId, opts?.knobs)
    const ranked = applyFeedback(userId, rankBySimilarity([seed], others, w), posts, w).slice(0, 5)
    return {
      posts: structuredClone(ranked),
      tookMs: Math.round(performance.now() - started),
      candidates: others.length,
    }
  },
  async explain(_userId, postId) {
    await delay()
    if (!posts.some((p) => p.id === postId)) throw new Error('unknown post')
    return {
      score: 0,
      breakdown: [
        { signal: 'content', value: 0.5, because: ['placeholder'] },
        { signal: 'popularity', value: 0.3 },
        { signal: 'recency', value: 0.2 },
      ],
      sentence: 'Placeholder explanation: WALRUS is not connected yet.',
    }
  },
  async sendEvent(userId, event) {
    const post = posts.find((p) => p.id === event.postId)
    if (event.type === 'hide') recordFeedback(userId, post, event.postId, event.reason)
    if (post && (event.type === 'like' || event.type === 'dislike')) {
      const type = event.type
      const same = post.userVote === type
      const switching = post.userVote !== null && !same
      if (type === 'like') post.likes += same ? -1 : 1
      else post.dislikes += same ? -1 : 1
      if (switching) {
        if (type === 'like') post.dislikes -= 1
        else post.likes -= 1
      }
      post.userVote = same ? null : type
    }
    console.debug('[mock] event', event)
  },
  async addComment(_userId, postId, content) {
    posts
      .find((p) => p.id === postId)
      ?.comments.push({
        id: crypto.randomUUID(),
        author: 'You',
        avatarColor: 'bg-primary',
        content,
        createdAt: 'just now',
      })
  },
  async listPlaylists() {
    await delay()
    return music.listPlaylists()
  },
  async getPlaylist(_userId, id) {
    await delay()
    const playlist = music.getPlaylist(id)
    if (!playlist) throw new Error('unknown playlist')
    const tracks = playlist.trackIds.flatMap((t) => music.trackById(t) ?? [])
    return { playlist, tracks: structuredClone(tracks) }
  },
  async createPlaylist(_userId, name) {
    await delay()
    return music.createPlaylist(name)
  },
  async addToPlaylist(_userId, id, trackId) {
    music.addTrack(id, trackId)
  },
  async removeFromPlaylist(_userId, id, trackId) {
    music.removeTrack(id, trackId)
  },
  async getPlaylistSuggestions(userId, id, opts) {
    await delay()
    const started = performance.now()
    const saved = (profiles.get(userId) ?? defaultProfile()).knobs
    const r = music.suggest(id, { ...saved, ...opts?.knobs })
    return {
      suggestions: structuredClone(r.suggestions),
      candidates: r.candidates,
      fromTitle: r.fromTitle,
      tookMs: Math.round(performance.now() - started),
    }
  },
  async getFeedbackReasons() {
    await delay()
    return feedbackReasons
  },
  async listFeedback(userId) {
    await delay()
    return listFeedback(userId)
  },
  async undoFeedback(userId, feedbackId) {
    undoFeedback(userId, feedbackId)
  },
}
