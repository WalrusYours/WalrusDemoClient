const ISO = /^\d{4}-\d{2}-\d{2}T/

/**
 * "now", "5m", "3h", "2d", then a short date. Server timestamps are ISO strings; anything
 * else (the mock data already says "2h") is shown as it is.
 */
export function timeAgo(value: string, now = Date.now()): string {
  if (!ISO.test(value)) return value
  const t = Date.parse(value)
  if (Number.isNaN(t)) return value
  const s = Math.max(0, Math.floor((now - t) / 1000))
  if (s < 45) return 'now'
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d`
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
