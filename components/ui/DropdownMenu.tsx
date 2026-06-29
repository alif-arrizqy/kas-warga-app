'use client'
import { useState, type ReactNode } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'

export interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick?: () => void
  href?: string
  danger?: boolean
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
}

// Radix Dropdown Menu + Motion (pola motion.dev/examples/react-radix-dropdown).
export default function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>

      <AnimatePresence>
        {open && (
          <DropdownMenuPrimitive.Portal forceMount>
            <DropdownMenuPrimitive.Content
              forceMount
              align="end"
              sideOffset={8}
              className="z-[60] min-w-[12rem]"
            >
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 460, damping: 32, mass: 0.7 }}
                className="rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10"
              >
                {items.map((item, i) => {
                  const cls = `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer select-none outline-none transition-colors ${
                    item.danger
                      ? 'text-red-600 data-[highlighted]:bg-red-50'
                      : 'text-slate-700 data-[highlighted]:bg-slate-100'
                  }`
                  return (
                    <DropdownMenuPrimitive.Item
                      key={i}
                      asChild={!!item.href}
                      onSelect={item.onClick}
                      className={item.href ? undefined : cls}
                    >
                      {item.href ? (
                        <Link href={item.href} className={cls}>
                          {item.icon}
                          {item.label}
                        </Link>
                      ) : (
                        <>
                          {item.icon}
                          {item.label}
                        </>
                      )}
                    </DropdownMenuPrimitive.Item>
                  )
                })}
              </motion.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  )
}
