'use client'
import { Suspense, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Search, CheckCircle, XCircle, Download,
  RefreshCw, Loader2, ZoomIn, X, AlertCircle
} from 'lucide-react'
import { paymentApi, exportApi, formatRupiah, MONTHS_ID, getApiImageUrl } from '@/lib/api'
import type { Payment } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/ui/Modal'

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
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h1 className="page-header">Pembayaran IPL</h1>
          <p className="text-gray-500 text-sm">
            {meta.total} total · {pendingCount} menunggu verifikasi
          </p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={loadPayments} className="btn-secondary">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => exportApi.payments({
              month: filterMonth ? parseInt(filterMonth) : undefined,
              year: filterYear ? parseInt(filterYear) : undefined,
            }).catch(() => toast.error('Gagal export'))}
            className="btn-secondary text-sm"
          >
            <Download size={15} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="input-label">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Semua</option>
              <option value="PENDING">Menunggu</option>
              <option value="VERIFIED">Terverifikasi</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          </div>
          <div>
            <label className="input-label">Bulan</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Semua</option>
              {MONTHS_ID.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Tahun</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="input-field text-sm"
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
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
      </div>

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
        <div className="space-y-2">
          {filtered.map((payment) => (
            <div
              key={payment.id}
              className={`card-hover flex items-center gap-3 cursor-pointer ${
                payment.status === 'PENDING' ? 'border-amber-200 bg-amber-50/30' : ''
              }`}
              onClick={() => {
                setSelectedPayment(payment)
                setVerifyNotes(payment.notes || '')
              }}
            >
              {/* Block Badge */}
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">
                {payment.household.block}{payment.household.number}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{payment.household.name}</p>
                <p className="text-xs text-gray-400">
                  {MONTHS_ID[payment.month - 1]} {payment.year} · {formatRupiah(payment.amount)}
                </p>
              </div>

              {/* Status & Date */}
              <div className="text-right flex-shrink-0">
                <StatusBadge status={payment.status} size="sm" />
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(payment.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              {/* Proof image indicator */}
              {payment.proofImage && (
                <div
                  className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative"
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
          <div className="p-5 space-y-4">
            {/* Household Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
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
                <div className="flex gap-3 mt-3">
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
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(selectedPayment.id)}
                  className="btn-danger text-sm"
                >
                  Hapus Data
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Image Zoom Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
            onClick={() => setImageModal(null)}
          >
            <X size={20} />
          </button>
          <div className="relative max-w-full max-h-full w-full h-full">
            <Image src={imageModal} alt="Bukti" fill className="object-contain" />
          </div>
        </div>
      )}
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
