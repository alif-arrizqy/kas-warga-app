'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'

/** Modal preview gambar bukti — ukuran terbatas, mudah ditutup. */
export default function ImagePreviewModal({
  src,
  onClose,
  title = 'Bukti Transfer',
}: {
  src: string | null
  onClose: () => void
  title?: string
}) {
  return (
    <Dialog.Root open={!!src} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {src && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
              <Dialog.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
                <motion.div
                  className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <Dialog.Title className="text-sm font-semibold text-slate-900">{title}</Dialog.Title>
                    <Dialog.Close
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                      aria-label="Tutup"
                    >
                      <X size={18} />
                    </Dialog.Close>
                  </div>
                  <div className="relative w-full h-[min(60vh,420px)] bg-slate-50">
                    <Image src={src} alt={title} fill className="object-contain p-3" />
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
