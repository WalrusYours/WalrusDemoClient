const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'so', 'to', 'of', 'in', 'on',
  'for', 'with', 'at', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'it', 'this',
  'that', 'i', 'you', 'your', 'my', 'me', 'we', 'our', 'as', 'not', 'no', 'just',
  'than', 'from', 'into', 'about', 'after', 'before', 'up', 'down', 'out', 'over',
  'under', 'again', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'too', 'very', 'can', 'will', 'should',
  'now', 'what', 'have', 'has', 'had', 'they', 'them', 'been', 'been',
])

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function extractKeywords(text: string, max = 4): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word))

  const frequency = new Map<string, number>()
  for (const word of words) {
    frequency.set(word, (frequency.get(word) ?? 0) + 1)
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word)
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}
