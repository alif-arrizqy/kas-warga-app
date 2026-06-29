'use client'
import { Suspense, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/lib/toast'
import {
  Search, CheckCircle, XCircle, Download,
  RefreshCw, Loader2, ZoomIn, X, AlertCircle
} from 'lucide-react'
import { paymentApi, exportApi, householdApi, formatRupiah, MONTHS_ID, getApiImageUrl } from '@/lib/api'
import type { Payment } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/ui/Modal'
import AnimatedSelect from '@/components/ui/AnimatedSelect'
import FilterPanel from '@/components/ui/FilterPanel'
import { motion, AnimatePresence } from 'motion/react'

const YEAR_NOW = new Date().getFullYear()
const YEAR_OPTIONS = [YEAR_NOW - 3, YEAR_NOW - 2, YEAR_NOW - 1, YEAR_NOW].map((y) => ({
  value: String(y),
  label: String(y),
}))
const STATUS_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'VERIFIED', label: 'Terverifikasi' },
  { value: 'REJECTED', label: 'Ditolak' },
]
const MONTH_OPTIONS = [
  { value: '', label: 'Semua' },
  ...MONTHS_ID.map((m, i) => ({ value: String(i + 1), label: m })),
]

function AdminPaymentsContent() {
  const searchParams = useSearchParams()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [imageModal, setImageModal] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '')
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [searchQuery, setSearchQuery] = useState('')
  const [verifyNotes, setVerifyNotes] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })
  const [activeHouseholds, setActiveHouseholds] = useState(0)
  const [verifiedCount, setVerifiedCount] = useState(0)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await paymentApi.list({
        status: filterStatus || undefined,
        month: filterMonth ? parseInt(filterMonth) : undefined,
        year: filterYear ? parseInt(filterYear) : undefined,
        limit: 50,
      })
      setPayments(res.data.data)
      setMeta(res.data.meta)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterMonth, filterYear])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  // Progress pembayaran IPL: jumlah KK terverifikasi vs total KK aktif (per bulan/tahun)
  const loadProgress = useCallback(async () => {
    if (!filterMonth) return
    try {
      const [hh, verified] = await Promise.all([
        householdApi.list({ active: true }),
        paymentApi.list({
          month: parseInt(filterMonth),
          year: parseInt(filterYear),
          status: 'VERIFIED',
          limit: 100,
        }),
      ])
      setActiveHouseholds(hh.data.data.length)
      setVerifiedCount(verified.data.meta.total)
    } catch {
      /* abaikan — progress bar opsional */
    }
  }, [filterMonth, filterYear])

  useEffect(() => {
    loadProgress()
  }, [loadProgress, payments])

  async function handleVerify(status: 'VERIFIED' | 'REJECTED') {
    if (!selectedPayment) return
    setVerifying(true)
    try {
      await paymentApi.verify(selectedPayment.id, status, verifyNotes)
      toast.success(status === 'VERIFIED' ? 'Pembayaran diverifikasi!' : 'Pembayaran ditolak')
      setSelectedPayment(null)
      setVerifyNotes('')
      loadPayments()
    } catch {
      toast.error('Gagal memproses verifikasi')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus data pembayaran ini?')) return
    try {
      await paymentApi.delete(id)
      toast.success('Data pembayaran dihapus')
      loadPayments()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const filtered = payments.filter((p) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      p.household.name.toLowerCase().includes(q) ||
      `${p.household.block}${p.household.number}`.toLowerCase().includes(q)
    )
  })

  const pendingCount = payments.filter((p) => p.status === 'PENDING').length

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h1 className="page-header text-[1.3rem] sm:text-[1.6rem] lg:text-[2rem]">Pembayaran IPL</h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            {meta.total} total · {pendingCount} menunggu verifikasi
          </p>
        </div>
        <div className="sm:ml-auto grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          <button onClick={loadPayments} className="btn-secondary justify-center min-h-10">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => exportApi.payments({
              month: filterMonth ? parseInt(filterMonth) : undefined,
              year: filterYear ? parseInt(filterYear) : undefined,
            }).catch(() => toast.error('Gagal export'))}
            className="btn-secondary text-sm justify-center min-h-10 col-span-1 sm:col-auto"
          >
            <Download size={15} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Progress pembayaran IPL */}
      {filterMonth && activeHouseholds > 0 && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">
              Progress IPL {MONTHS_ID[parseInt(filterMonth) - 1]} {filterYear}
            </p>
            <p className="text-sm font-bold text-brand-700">
              {verifiedCount}<span className="text-slate-400 font-medium">/{activeHouseholds} KK</span>
            </p>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.round((verifiedCount / activeHouseholds) * 100))}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {Math.round((verifiedCount / activeHouseholds) * 100)}% terverifikasi ·
            {' '}{Math.max(0, activeHouseholds - verifiedCount)} KK belum bayar
          </p>
        </div>
      )}

      {/* Filters */}
      <FilterPanel activeCount={(filterStatus ? 1 : 0) + (searchQuery ? 1 : 0)}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div>
            <label className="input-label">Status</label>
            <AnimatedSelect value={filterStatus} onChange={setFilterStatus} options={STATUS_OPTIONS} />
          </div>
          <div>
            <label className="input-label">Bulan</label>
            <AnimatedSelect value={filterMonth} onChange={setFilterMonth} options={MONTH_OPTIONS} />
          </div>
          <div>
            <label className="input-label">Tahun</label>
            <AnimatedSelect value={filterYear} onChange={setFilterYear} options={YEAR_OPTIONS} />
          </div>
          <div className="col-span-2 lg:col-span-1">
            <label className="input-label">Cari KK</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nama / blok..."
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>
        </div>
      </FilterPanel>

      {/* Table / List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p>Tidak ada data pembayaran</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((payment) => (
            <div
              key={payment.id}
              className={`card-hover flex items-start sm:items-center gap-2.5 sm:gap-3 cursor-pointer ${
                payment.status === 'PENDING' ? 'border-amber-200 bg-amber-50/30' : ''
              }`}
              onClick={() => {
                setSelectedPayment(payment)
                setVerifyNotes(payment.notes || '')
              }}
            >
              {/* Block Badge */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-xl flex items-center justify-center text-[11px] sm:text-xs font-bold text-gray-700 flex-shrink-0">
                {payment.household.block}{payment.household.number}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-sm truncate">{payment.household.name}</p>
                <p className="text-[11px] sm:text-xs text-gray-400">
                  {MONTHS_ID[payment.month - 1]} {payment.year} · {formatRupiah(payment.amount)}
                </p>
              </div>

              {/* Status & Date */}
              <div className="text-right flex-shrink-0 ml-auto">
                <StatusBadge status={payment.status} size="sm" />
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                  {new Date(payment.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              {/* Proof image indicator */}
              {payment.proofImage && (
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageModal(getApiImageUrl(payment.proofImage))
                  }}
                >
                  <Image src={getApiImageUrl(payment.proofImage)} alt="Bukti" fill className="object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail & Verify Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => { setSelectedPayment(null); setVerifyNotes('') }}
        title="Detail Pembayaran"
        size="lg"
      >
        {selectedPayment && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Household Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Nama KK</p>
                  <p className="font-semibold">{selectedPayment.household.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Blok / No</p>
                  <p className="font-semibold">{selectedPayment.household.block} / {selectedPayment.household.number}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Periode</p>
                  <p className="font-semibold">{MONTHS_ID[selectedPayment.month - 1]} {selectedPayment.year}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Nominal</p>
                  <p className="font-semibold text-brand-700">{formatRupiah(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Tanggal Upload</p>
                  <p className="font-semibold">
                    {new Date(selectedPayment.paidAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Status</p>
                  <StatusBadge status={selectedPayment.status} />
                </div>
              </div>
            </div>

            {/* Proof Image */}
            {selectedPayment.proofImage && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Bukti Transfer</p>
                <div
                  className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100 cursor-zoom-in"
                  onClick={() => setImageModal(getApiImageUrl(selectedPayment.proofImage))}
                >
                  <Image
                    src={getApiImageUrl(selectedPayment.proofImage)}
                    alt="Bukti transfer"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
                    <ZoomIn size={28} className="text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Verify form - only show for PENDING */}
            {selectedPayment.status === 'PENDING' && (
              <div>
                <label className="input-label">Catatan (opsional)</label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Tambahkan catatan verifikasi..."
                  className="input-field text-sm resize-none"
                  rows={2}
                />
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <button
                    onClick={() => handleVerify('REJECTED')}
                    disabled={verifying}
                    className="btn-danger flex-1 justify-center"
                  >
                    {verifying ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Tolak
                  </button>
                  <button
                    onClick={() => handleVerify('VERIFIED')}
                    disabled={verifying}
                    className="btn-primary flex-1 justify-center"
                  >
                    {verifying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Verifikasi
                  </button>
                </div>
              </div>
            )}

            {/* Actions for verified/rejected */}
            {selectedPayment.status !== 'PENDING' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleDelete(selectedPayment.id)}
                  className="btn-danger text-sm justify-center"
                >
                  Hapus Data
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {imageModal && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setImageModal(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
              onClick={() => setImageModal(null)}
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
            <motion.div
              className="relative max-w-full max-h-full w-full h-full"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={imageModal} alt="Bukti" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={
      <div className="p-4 lg:p-6 flex justify-center py-12">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    }>
      <AdminPaymentsContent />
    </Suspense>
  )
}
