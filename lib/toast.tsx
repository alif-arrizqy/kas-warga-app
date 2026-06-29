'use client'
import { useSyncExternalStore } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  type: ToastType
  message: string
  duration: number
}

// Store imperatif sederhana agar API `toast.success(...)` bisa dipanggil di luar React.
let items: ToastItem[] = []
let listeners: Array<() => void> = []
let counter = 0

function emit() {
  listeners.forEach((l) => l())
}
function push(type: ToastType, message: string, duration = 4000): number {
  const id = ++counter
  items = [...items, { id, type, message, duration }]
  emit()
  return id
}
function dismiss(id: number) {
  items = items.filter((t) => t.id !== id)
  emit()
}
function subscribe(l: () => void) {
  listeners.push(l)
  return () => {
    listeners = listeners.filter((x) => x !== l)
  }
}
const getSnapshot = () => items

// Drop-in untuk react-hot-toast (hanya .success/.error/.info yang dipakai aplikasi).
export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
}

const ICONS = {
  success: <CheckCircle size={18} className="text-green-400 flex-shrink-0" />,
  error: <XCircle size={18} className="text-red-400 flex-shrink-0" />,
  info: <Info size={18} className="text-sky-400 flex-shrink-0" />,
}

// Radix Toast + Motion (pola motion.dev/examples/react-radix-toast).
export function ToastProvider() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            asChild
            forceMount
            duration={t.duration}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id)
            }}
          >
            <motion.li
              layout
              initial={{ opacity: 0, y: -24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 80 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
              className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-slate-50 shadow-2xl shadow-black/40 ring-1 ring-white/15"
            >
              {ICONS[t.type]}
              <ToastPrimitive.Title className="flex-1 leading-snug">{t.message}</ToastPrimitive.Title>
              <ToastPrimitive.Close className="text-gray-400 hover:text-gray-100 transition-colors" aria-label="Tutup">
                <X size={15} />
              </ToastPrimitive.Close>
            </motion.li>
          </ToastPrimitive.Root>
        ))}
      </AnimatePresence>
      <ToastPrimitive.Viewport className="fixed top-4 inset-x-0 z-[100] mx-auto flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  )
}
