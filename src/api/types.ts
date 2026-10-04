import type { Playlist, Post, Suggestion, Track } from '../types'

// What the app server exposes to this client. These shapes mirror the WALRUS responses
// described in .claude/ADAPT.md (steps 6 to 8), but the client never talks to WALRUS:
// the app server relays, hydrates ids into posts, and holds the WALRUS keys.

export type KnobValues = Record<string, number>

export interface KnobDef {
  id: string
  label: string
  low: string // plain-language label for the 0 end
  high: string // plain-language label for the 1 end
  min: number
  max: number
  default: number
  /** Section heading in the panel. Knobs without one are listed first, ungrouped. */
  group?: string
  /** One plain-language sentence under the label. */
  help?: string
  /**
   * Id of the knob this one only makes sense with (a direction knob and its importance
   * knob). The panel dims this knob while the other sits at its minimum.
   */
  dependsOn?: string
  /** slider (default), toggle (0 or 1), or choice (one of `options`) */
  kind?: 'slider' | 'toggle' | 'choice'
  options?: { value: number; label: string }[]
  /**
   * Surfaces that show this knob (recommender ids: home, playlist_add). The panel lists only the
   * knobs of the page you are on; a knob without scope shows everywhere.
   */
  scope?: string[]
}

/**
 * A reason a user can give for "not interested" (schema v2 `feedback.reasons`). The label may
 * hold `{author}`, filled from the post. What the reason does is decided by the server.
 */
export interface FeedbackReason {
  id: string
  label: string
  hint?: string
}

/** One piece of feedback the user gave, listed back to them so they can undo it. */
export interface FeedbackEntry {
  id: string
  postId: string
  reason: string
  label: string
  preview: string
  at: string
}

export interface Preset {
  id: string
  label: string
  knobs: KnobValues
  /** Surfaces that offer this preset, like KnobDef.scope. */
  scope?: string[]
}

export interface KnobConfig {
  knobs: KnobDef[]
  presets: Preset[]
}

export interface Profile {
  knobs: KnobValues
  preset: string | null
}

export interface FeedResult {
  posts: Post[]
  tookMs?: number
  candidates?: number
}

export interface ExplainEntry {
  signal: string
  value: number
  because?: string[]
}

export interface Explanation {
  score: number
  breakdown: ExplainEntry[]
  // Optional ready-made sentence for the top reason; the UI builds one if absent.
  sentence?: string
}

export type EventType = 'view' | 'like' | 'dislike' | 'comment' | 'hide'

export interface InteractionEvent {
  type: EventType
  postId: string
  value?: number // seconds for `view`
  reason?: string // for `hide`: a FeedbackReason id
  ts: string // ISO time of the event, not of sending
}

export interface AuthUser {
  id: string
  username: string
  avatarColor: string
}

export interface LoginResult {
  token: string
  user: AuthUser
}

/** Same rule as the server: 3 to 20 characters, lowercase letters, digits, underscore. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export interface HostApi {
  /** Username only, no password. The server creates the user on first login. */
  login(username: string): Promise<LoginResult>
  logout(): Promise<void>
  getKnobConfig(): Promise<KnobConfig>
  getProfile(userId: string): Promise<Profile>
  saveProfile(userId: string, patch: Partial<Profile>): Promise<void>
  /** `knobs` are per-request overrides for live sliders; they do not persist. */
  getFeed(userId: string, opts?: { knobs?: KnobValues; signal?: AbortSignal }): Promise<FeedResult>
  createPost(userId: string, content: string): Promise<Post>
  /**
   * "More like this" for one post, in the order the server returns it (never re-sorted here).
   * `knobs` are per-request overrides, like for the feed, so the list follows the sliders.
   */
  getRelated(
    userId: string,
    postId: string,
    opts?: { knobs?: KnobValues; signal?: AbortSignal },
  ): Promise<FeedResult>
  explain(userId: string, postId: string, signal?: AbortSignal): Promise<Explanation>
  sendEvent(userId: string, event: InteractionEvent): Promise<void>
  addComment(userId: string, postId: string, content: string): Promise<void>
  /** The reasons offered under "Not interested", from the schema. */
  getFeedbackReasons(): Promise<FeedbackReason[]>
  /** What the user said they are not interested in, newest first, so it can be undone. */
  listFeedback(userId: string): Promise<FeedbackEntry[]>
  undoFeedback(userId: string, feedbackId: string): Promise<void>

  // Music
  listPlaylists(userId: string): Promise<Playlist[]>
  getPlaylist(userId: string, playlistId: string): Promise<{ playlist: Playlist; tracks: Track[] }>
  createPlaylist(userId: string, name: string): Promise<Playlist>
  addToPlaylist(userId: string, playlistId: string, trackId: string): Promise<void>
  removeFromPlaylist(userId: string, playlistId: string, trackId: string): Promise<void>
  /**
   * "You might want to add here...": songs that fit the playlist, in the order the server
   * returns them. `knobs` are per-request overrides, like for the feed.
   */
  getPlaylistSuggestions(
    userId: string,
    playlistId: string,
    opts?: { knobs?: KnobValues; signal?: AbortSignal },
  ): Promise<{ suggestions: Suggestion[]; candidates: number; tookMs: number; fromTitle: boolean }>
}
