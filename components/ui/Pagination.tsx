'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1 && total <= 0) return null

  return (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 mt-3">
      <p className="text-xs text-slate-500">
        {total} item · hal {page}/{Math.max(1, totalPages)}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="btn-secondary p-2 min-h-9 disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="btn-secondary p-2 min-h-9 disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
