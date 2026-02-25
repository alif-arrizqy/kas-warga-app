'use client'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

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
  duration = 1.5,
  className = '',
  formatter,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const from = prevValue.current
    const obj = { val: from }

    gsap.to(obj, {
      val: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        const current = Math.round(obj.val)
        el.textContent = `${prefix}${formatter ? formatter(current) : current.toLocaleString('id-ID')}${suffix}`
      },
    })

    prevValue.current = value
  }, [value, duration, prefix, suffix, formatter])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatter ? formatter(0) : '0'}
      {suffix}
    </span>
  )
}
