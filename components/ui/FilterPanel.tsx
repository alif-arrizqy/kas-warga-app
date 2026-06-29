'use client'
import { useState, type ReactNode } from 'react'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'

// Filter collapsible di mobile, selalu tampil di desktop (lg+).
export default function FilterPanel({
  children,
  activeCount = 0,
}: {
  children: ReactNode
  activeCount?: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="lg:hidden w-full flex items-center justify-between min-h-11"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-semibold text-slate-700 text-sm">
          <SlidersHorizontal size={16} className="text-brand-600" />
          Filter
          {activeCount > 0 && (
            <span className="bg-brand-100 text-brand-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-slate-400" />
        </motion.span>
      </button>

      <div className={`${open ? 'block mt-3' : 'hidden'} lg:block lg:mt-0`}>{children}</div>
    </div>
  )
}
