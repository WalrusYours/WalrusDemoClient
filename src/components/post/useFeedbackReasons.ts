import { useEffect, useState } from 'react'
import { api } from '../../api'
import type { FeedbackReason } from '../../api'

// The reasons come from the schema through the app server and do not change while the page is
// open, so every post menu shares one request.
let cached: Promise<FeedbackReason[]> | null = null

function load(): Promise<FeedbackReason[]> {
  cached ??= api.getFeedbackReasons().catch(() => {
    cached = null // try again next time; meanwhile "Not interested" works without a reason
    return []
  })
  return cached
}

/** The "Not interested" reasons, or [] while loading or when the server offers none. */
export function useFeedbackReasons(): FeedbackReason[] {
  const [reasons, setReasons] = useState<FeedbackReason[]>([])
  useEffect(() => {
    let live = true
    load().then((r) => live && setReasons(r))
    return () => {
      live = false
    }
  }, [])
  return reasons
}

/** A reason's label with the post's author filled in. */
export function reasonLabel(label: string, author: string): string {
  return label.replace('{author}', author)
}
