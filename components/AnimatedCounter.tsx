'use client'
import { useEffect, useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
  formatter?: (val: number) => string
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
  className = '',
  formatter,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = prevValue.current
    const diff = value - from
    if (diff === 0) return

    const start = performance.now()
    let raf: number

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - t) ** 3 // ease-out-cubic
      const current = Math.round(from + diff * eased)
      el!.textContent = `${prefix}${formatter ? formatter(current) : current.toLocaleString('id-ID')}${suffix}`
      if (t < 1) raf = requestAnimationFrame(tick)
      else prevValue.current = value
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, prefix, suffix, formatter])

  return (
    <span ref={ref} className={className}>
      {prefix}{formatter ? formatter(0) : '0'}{suffix}
    </span>
  )
}
