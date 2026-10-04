import type { Post } from '../types'
import { attrsOf } from './mockAttributes'
import { knobConfig } from './mockKnobs'
import type { KnobValues } from './types'

// Ranking by similarity, with a weight per attribute: "50% topic, 80% mood". This lives in the
// mock because the mock stands in for the app server and WALRUS, which do the real ranking;
// the client itself never sorts or scores posts.

export const MATCH_KNOB = {
  topic: 'match_topic',
  tags: 'match_tags',
  mood: 'match_mood',
  length: 'match_length',
  author: 'match_author',
} as const

export type Attribute = keyof typeof MATCH_KNOB
export type Weights = Record<Attribute, number>

/** The attribute weights in 0..1; a knob that is not set is at its default. */
export function weightsFrom(knobs: KnobValues): Weights {
  const out = {} as Weights
  for (const attr of Object.keys(MATCH_KNOB) as Attribute[]) {
    const id = MATCH_KNOB[attr]
    out[attr] = knobs[id] ?? knobConfig.knobs.find((k) => k.id === id)?.default ?? 0
  }
  return out
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0
  const set = new Set(a)
  const shared = b.filter((t) => set.has(t)).length
  return shared / (a.length + b.length - shared)
}

/** How alike two posts are, 0..1: the weighted mean of one similarity per attribute. */
export function similarity(a: Post, b: Post, w: Weights): number {
  const x = attrsOf(a)
  const y = attrsOf(b)
  const parts: Record<Attribute, number> = {
    topic: x.topic === y.topic ? 1 : 0,
    tags: jaccard(x.tags, y.tags),
    mood: 1 - (Math.abs(x.valence - y.valence) + Math.abs(x.energy - y.energy)) / 2,
    length: 1 - Math.abs(x.words - y.words) / Math.max(x.words, y.words, 1),
    author: x.author === y.author ? 1 : 0,
  }
  let sum = 0
  let total = 0
  for (const attr of Object.keys(parts) as Attribute[]) {
    sum += w[attr] * parts[attr]
    total += w[attr]
  }
  return total === 0 ? 0 : sum / total
}

/**
 * Candidates ordered by their mean similarity to the seed posts (a post is never compared
 * with itself). The sort is stable, so equal scores keep their original order.
 */
export function rankBySimilarity(seeds: Post[], candidates: Post[], w: Weights): Post[] {
  const score = (c: Post) => {
    const others = seeds.filter((s) => s.id !== c.id)
    if (others.length === 0) return 0
    return others.reduce((sum, s) => sum + similarity(s, c, w), 0) / others.length
  }
  return candidates
    .map((post) => ({ post, score: score(post) }))
    .sort((a, b) => b.score - a.score)
    .map((e) => e.post)
}
