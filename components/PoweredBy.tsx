'use client'
import { INSPIRALABS_URL } from '@/lib/inspiralabs'
import { trackEvent } from '@/lib/analytics'

export default function PoweredBy({ className = 'text-slate-400' }: { className?: string }) {
  return (
    <p className={`text-center text-xs ${className}`}>
      Powered by{' '}
      <a
        href={INSPIRALABS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold hover:underline"
        onClick={() => trackEvent('click_inspiralabs', { source: 'powered_by' })}
      >
        InspiraLabs
      </a>
    </p>
  )
}
