import { useEffect, useState } from 'react'

interface CounterProps {
  target: number
  duration?: number
}

export default function Counter({ target, duration = 1200 }: CounterProps) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let rafId: number
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return <>{value}</>
}
