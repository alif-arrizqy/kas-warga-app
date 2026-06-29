'use client'
import { useState } from 'react'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export interface SelectOption {
  value: string
  label: string
}

interface AnimatedSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
}

// Radix Select tidak mengizinkan value kosong pada Item — pakai sentinel internal.
const EMPTY = '__empty__'
const toInternal = (v: string) => (v === '' ? EMPTY : v)
const toExternal = (v: string) => (v === EMPTY ? '' : v)

// Radix Select + Motion (pola motion.dev/examples/react-radix-select).
export default function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  className = '',
}: AnimatedSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Select.Root
      value={toInternal(value)}
      onValueChange={(v) => onChange(toExternal(v))}
      open={open}
      onOpenChange={setOpen}
    >
      <Select.Trigger
        className={`input-field flex items-center justify-between gap-2 text-left text-sm data-[placeholder]:text-slate-400 ${className}`}
        aria-label={placeholder}
      >
        <Select.Value placeholder={placeholder}>
          {selected ? selected.label : placeholder}
        </Select.Value>
        <Select.Icon asChild>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
          </motion.span>
        </Select.Icon>
      </Select.Trigger>

      <AnimatePresence>
        {open && (
          <Select.Portal forceMount>
            <Select.Content
              forceMount
              position="popper"
              sideOffset={6}
              className="z-[60] w-[var(--radix-select-trigger-width)]"
            >
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 460, damping: 32, mass: 0.7 }}
                className="max-h-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10"
              >
                <Select.Viewport className="max-h-56 overflow-y-auto">
                  {options.map((opt) => (
                    <Select.Item
                      key={opt.value || EMPTY}
                      value={toInternal(opt.value)}
                      className="relative flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer select-none outline-none transition-colors data-[highlighted]:bg-slate-100 data-[state=checked]:bg-brand-50 data-[state=checked]:text-brand-700 data-[state=checked]:font-medium"
                    >
                      <Select.ItemText>{opt.label}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={15} className="text-brand-600 flex-shrink-0" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </motion.div>
            </Select.Content>
          </Select.Portal>
        )}
      </AnimatePresence>
    </Select.Root>
  )
}
