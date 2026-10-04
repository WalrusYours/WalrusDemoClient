import type { Post } from '../types'
import { attrsOf } from './mockAttributes'
import { similarity, type Weights } from './mockRank'
import type { FeedbackEntry, FeedbackReason } from './types'

// "Not interested", with a reason: the mock's version of the schema v2 `feedback` section
// (SCHEMA-V2.md 4.16). Each reason says which other posts it reaches, through the reacted
// post's own attributes, and what it does to them. The reacted post itself is always hidden.

interface ReasonRule extends FeedbackReason {
  /** which other posts the reason reaches */
  reaches: (reacted: Post, other: Post, w: Weights) => boolean
  /** how far down they move: 0 none, 1 to the bottom */
  penalty: number
}

const rules: ReasonRule[] = [
  {
    id: 'not_my_taste',
    label: 'Not my taste',
    hint: 'Fewer posts like this one',
    reaches: (a, b, w) => similarity(a, b, w) >= 0.7, // applies_to: { similar: 0.7 }
    penalty: 0.7, // effect: { taste: -1 }
  },
  {
    id: 'already_read',
    label: 'Already read about this',
    hint: 'Fewer posts on this topic for a while',
    reaches: (a, b) => attrsOf(a).topic === attrsOf(b).topic, // applies_to: { same: topic }
    penalty: 0.5, // effect: satiate
  },
  {
    id: 'fewer_from_author',
    label: 'Fewer posts from {author}',
    hint: 'Their posts move down',
    reaches: (a, b) => a.handle === b.handle, // applies_to: { same: author }
    penalty: 0.8, // effect: { penalty: 0.8 }
  },
  {
    id: 'seen_too_often',
    label: "I've seen this too many times",
    hint: 'Hidden for 30 days',
    reaches: () => false, // applies_to: item, effect: hide
    penalty: 0,
  },
  {
    id: 'offensive',
    label: 'This is offensive',
    hint: 'Hidden and reported',
    reaches: () => false, // applies_to: item, effect: hide, also: report
    penalty: 0,
  },
]

export const feedbackReasons: FeedbackReason[] = rules.map(({ id, label, hint }) => ({ id, label, hint }))

const store = new Map<string, FeedbackEntry[]>()

export function fillLabel(label: string, post: Post | undefined): string {
  return label.replace('{author}', post ? `@${post.handle}` : 'this author')
}

export function recordFeedback(userId: string, post: Post | undefined, postId: string, reason?: string) {
  const rule = rules.find((r) => r.id === reason)
  const entry: FeedbackEntry = {
    id: crypto.randomUUID(),
    postId,
    reason: rule?.id ?? 'not_interested',
    label: rule ? fillLabel(rule.label, post) : 'Not interested',
    preview: post ? post.content.slice(0, 80) : '',
    at: new Date().toISOString(),
  }
  store.set(userId, [entry, ...(store.get(userId) ?? [])])
  if (rule?.id === 'offensive') console.info('[mock] reported to the host for moderation:', postId)
}

export function listFeedback(userId: string): FeedbackEntry[] {
  return structuredClone(store.get(userId) ?? [])
}

export function undoFeedback(userId: string, id: string) {
  store.set(userId, (store.get(userId) ?? []).filter((e) => e.id !== id))
}

/**
 * The list with the user's feedback applied: reacted posts removed, the posts a reason reaches
 * moved down by its penalty. Stable, so the server's order holds otherwise.
 */
export function applyFeedback(userId: string, list: Post[], all: Post[], w: Weights): Post[] {
  const entries = store.get(userId) ?? []
  if (entries.length === 0) return list
  const hidden = new Set(entries.map((e) => e.postId))
  const reacted = entries.flatMap((e) => {
    const rule = rules.find((r) => r.id === e.reason)
    const post = all.find((p) => p.id === e.postId)
    return rule && post ? [{ rule, post }] : []
  })
  return list
    .filter((p) => !hidden.has(p.id))
    .map((p, i) => {
      const penalty = Math.max(0, ...reacted.filter(({ rule, post }) => rule.reaches(post, p, w)).map(({ rule }) => rule.penalty))
      return { p, key: i + penalty * list.length }
    })
    .sort((a, b) => a.key - b.key)
    .map((x) => x.p)
}
