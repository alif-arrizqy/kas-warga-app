'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'motion/react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'warning',
  loading = false,
}: ConfirmDialogProps) {
  const confirmClass =
    variant === 'danger' ? 'btn-danger flex-1 justify-center' : 'btn-primary flex-1 justify-center'

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && !loading && onClose()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
              <Dialog.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
                <motion.div
                  className="max-w-sm w-full bg-white rounded-2xl shadow-2xl pointer-events-auto"
                  initial={{ opacity: 0, y: 32, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
                >
                  <div className="p-5 space-y-3">
                    <Dialog.Title className="text-lg font-semibold text-gray-900">{title}</Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-600 leading-relaxed">
                      {message}
                    </Dialog.Description>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="btn-secondary flex-1 justify-center"
                      >
                        {cancelLabel}
                      </button>
                      <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={confirmClass}
                      >
                        {loading ? 'Memproses...' : confirmLabel}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
