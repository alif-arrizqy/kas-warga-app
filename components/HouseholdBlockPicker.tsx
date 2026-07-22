'use client'
import { useMemo } from 'react'
import AnimatedSelect from '@/components/ui/AnimatedSelect'
import type { Household } from '@/lib/types'

/** Pilih blok + nomor dari data KK tersimpan (bukan ketik manual). */
export default function HouseholdBlockPicker({
  households,
  block,
  number,
  onBlockChange,
  onNumberChange,
  className,
}: {
  households: Household[]
  block: string
  number: string
  onBlockChange: (block: string) => void
  onNumberChange: (number: string) => void
  className?: string
}) {
  const blocks = useMemo(
    () => Array.from(new Set(households.map((h) => h.block))).sort(),
    [households]
  )

  const numbers = useMemo(
    () =>
      households
        .filter((h) => h.block === block)
        .map((h) => h.number)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [households, block]
  )

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 ${className ?? ''}`}>
      <div className="min-w-0">
        <label className="input-label">Blok rumah</label>
        <AnimatedSelect
          value={block}
          onChange={(v) => {
            onBlockChange(v)
            onNumberChange('')
          }}
          placeholder="Blok rumah"
          options={[
            { value: '', label: 'Blok rumah' },
            ...blocks.map((b) => ({ value: b, label: `Blok ${b}` })),
          ]}
        />
      </div>
      <div className="min-w-0">
        <label className="input-label">No. Rumah</label>
        <AnimatedSelect
          value={number}
          onChange={onNumberChange}
          placeholder="Nomor rumah"
          options={[
            { value: '', label: block ? 'Nomor rumah' : 'Pilih blok dulu' },
            ...numbers.map((n) => ({ value: n, label: n })),
          ]}
        />
      </div>
    </div>
  )
}
