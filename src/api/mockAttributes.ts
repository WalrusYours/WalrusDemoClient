import type { Post } from '../types'
import { countWords, extractKeywords } from '../utils/text'

// Stand-in for what a host platform's own analysis would send to WALRUS: the attributes of a
// post. Derived here from the text so every post, including ones created in the demo, has
// them. A real platform would send its model's output (topic classifier, mood model...).

export interface PostAttrs {
  topic: string
  tags: string[]
  /** 0 = negative or serious, 1 = positive or playful. */
  valence: number
  /** 0 = calm, 1 = intense. */
  energy: number
  words: number
  author: string
}

const TOPICS: [string, RegExp][] = [
  ['code', /\b(code|coding|debug\w*|bugs?|component|refactor\w*|readme|api|migration|staging|react|typescript|deploy\w*|dependency|compile\w*|tests?)\b/g],
  ['study', /\b(thesis|defense|slides|exams?|study|studying|draft|university|lecture|paper|deadline|supervisor)\b/g],
  ['food', /\b(coffee|espresso|lunch|dinner|recipe|cook\w*|pasta|breakfast|pizza)\b/g],
  ['music', /\b(song|album|playlist|music|band|concert|guitar|listening)\b/g],
  ['sport', /\b(run|running|gym|workout|match|football|training|marathon)\b/g],
]

const POSITIVE = /\b(better|thanks?|great|love\w*|good|agreed|finally|nice|happy|win|wins|done|ship|worth|proud|improv\w*)\b/g
const NEGATIVE = /\b(bugs?|fail\w*|curse|angry|hate\w*|tired|bad|stuck|broken|worse|classic|unpopular|ugh|annoy\w*|late)\b/g
const INTENSE = /\b(urgent|insane|crazy|!!+|never|always|worst|best|incredible|2am|deadline)\b/g

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const count = (text: string, re: RegExp) => text.match(re)?.length ?? 0

export function attrsOf(post: Post): PostAttrs {
  const text = post.content.toLowerCase()

  let topic = 'life'
  let best = 0
  for (const [name, re] of TOPICS) {
    const n = count(text, re)
    if (n > best) {
      best = n
      topic = name
    }
  }

  const hashtags = [...text.matchAll(/#([a-z0-9_]+)/g)].map((m) => m[1])
  const tags = [...new Set([...hashtags, ...extractKeywords(post.content, 5)])]

  const valence = clamp01(0.5 + 0.15 * (count(text, POSITIVE) - count(text, NEGATIVE)))
  const exclaim = count(post.content, /!/g)
  const shouting = (post.content.match(/[A-Z]/g)?.length ?? 0) / Math.max(post.content.length, 1)
  const energy = clamp01(0.3 + 0.12 * exclaim + 0.1 * count(text, INTENSE) + shouting)

  return { topic, tags, valence, energy, words: countWords(post.content), author: post.handle }
}
