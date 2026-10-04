export type Vote = 'like' | 'dislike'

export interface Comment {
  id: string
  author: string
  avatarColor: string
  content: string
  createdAt: string
}

export interface Post {
  id: string
  author: string
  handle: string
  avatarColor: string
  content: string
  createdAt: string
  likes: number
  dislikes: number
  userVote: Vote | null
  comments: Comment[]
}

export interface Track {
  id: string
  title: string
  artist: string
  year: number
  genres: string[]
  /** 0 calm .. 1 intense, and 0 sad .. 1 happy: the audio features a platform's own analysis sends */
  energy: number
  valence: number
  seconds: number
  /** popularity, in millions of plays */
  plays: number
}

export interface Playlist {
  id: string
  name: string
  description: string
  trackIds: string[]
}

/** A song WALRUS suggests adding to a playlist, with the plain-language reason. */
export interface Suggestion {
  track: Track
  score: number
  because: string
}
