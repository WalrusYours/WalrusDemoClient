import type { HostApi, KnobValues, LoginResult } from './types'

// Talks to the app server (the host platform's backend). In compose, nginx proxies /api
// to it; in dev set VITE_API_URL. Auth is the host's own session; this demo identifies
// the persona with an X-Demo-User header, which a real platform would replace.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

let token: string | null = null
let onUnauthorized: () => void = () => {}

export function setToken(t: string | null) {
  token = t
}

/** Called when the server rejects the session (expired, or the server restarted). */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

async function request<T>(userId: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Demo-User': userId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (res.status === 401 && token) onUnauthorized()
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status}`)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

function knobQuery(knobs?: KnobValues) {
  if (!knobs) return ''
  const q = new URLSearchParams()
  for (const [id, v] of Object.entries(knobs)) q.set(`knobs.${id}`, String(v))
  return `?${q}`
}

async function login(username: string): Promise<LoginResult> {
  let res: Response
  try {
    res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
  } catch {
    throw new Error('Cannot reach the server. Is it running?')
  }
  const body = (await res.json().catch(() => null)) as
    | (Partial<LoginResult> & { error?: string })
    | null
  if (!res.ok || !body?.token || !body.user) {
    throw new Error(body?.error ?? `Sign in failed (${res.status})`)
  }
  return { token: body.token, user: body.user }
}

export const httpApi: HostApi = {
  login,
  logout: () => request('', '/auth/logout', { method: 'POST' }),
  getKnobConfig: () => request('', '/knobs'),
  getProfile: (userId) => request(userId, `/users/${userId}/profile`),
  saveProfile: (userId, patch) =>
    request(userId, `/users/${userId}/profile`, { method: 'PUT', body: JSON.stringify(patch) }),
  getFeed: (userId, opts) =>
    request(userId, `/feed${knobQuery(opts?.knobs)}`, { signal: opts?.signal }),
  createPost: (userId, content) =>
    request(userId, '/posts', { method: 'POST', body: JSON.stringify({ content }) }),
  getRelated: (userId, postId, opts) =>
    request(userId, `/posts/${encodeURIComponent(postId)}/related${knobQuery(opts?.knobs)}`, {
      signal: opts?.signal,
    }),
  explain: (userId, postId, signal) => request(userId, `/explain/${postId}`, { signal }),
  sendEvent: (userId, event) =>
    request(userId, '/events', { method: 'POST', body: JSON.stringify(event) }),
  addComment: (userId, postId, content) =>
    request(userId, `/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  listPlaylists: (userId) => request(userId, '/playlists'),
  getPlaylist: (userId, id) => request(userId, `/playlists/${encodeURIComponent(id)}`),
  createPlaylist: (userId, name) =>
    request(userId, '/playlists', { method: 'POST', body: JSON.stringify({ name }) }),
  addToPlaylist: (userId, id, trackId) =>
    request(userId, `/playlists/${encodeURIComponent(id)}/tracks`, { method: 'POST', body: JSON.stringify({ trackId }) }),
  removeFromPlaylist: (userId, id, trackId) =>
    request(userId, `/playlists/${encodeURIComponent(id)}/tracks/${encodeURIComponent(trackId)}`, { method: 'DELETE' }),
  getPlaylistSuggestions: (userId, id, opts) =>
    request(userId, `/playlists/${encodeURIComponent(id)}/suggestions${knobQuery(opts?.knobs)}`, { signal: opts?.signal }),
  getFeedbackReasons: () => request('', '/feedback/reasons'),
  listFeedback: (userId) => request(userId, `/users/${encodeURIComponent(userId)}/feedback`),
  undoFeedback: (userId, feedbackId) =>
    request(userId, `/users/${encodeURIComponent(userId)}/feedback/${encodeURIComponent(feedbackId)}`, {
      method: 'DELETE',
    }),
}
