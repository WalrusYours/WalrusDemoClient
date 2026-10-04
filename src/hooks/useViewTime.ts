import { useEffect, useRef, useState } from 'react'

// `onLeave` receives the seconds viewed since the last report, when the element leaves the
// screen or unmounts. That value becomes the `view` interaction sent to the app server.
export function useViewTime<T extends HTMLElement = HTMLElement>(
  threshold = 0.5,
  onLeave?: (seconds: number) => void,
) {
  const ref = useRef<T>(null)
  const [seconds, setSeconds] = useState(0)
  const viewed = useRef(0)
  const onLeaveRef = useRef(onLeave)
  useEffect(() => {
    onLeaveRef.current = onLeave
  })
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const stop = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const report = () => {
      if (viewed.current > 0) onLeaveRef.current?.(viewed.current)
      viewed.current = 0
    }

    const start = () => {
      if (intervalRef.current !== null) return
      intervalRef.current = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          setSeconds((s) => s + 1)
          viewed.current += 1
        }
      }, 1000)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          start()
        } else {
          stop()
          report()
        }
      },
      { threshold },
    )

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') stop()
    }

    observer.observe(node)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stop()
      report()
    }
  }, [threshold])

  return { ref, seconds }
}
