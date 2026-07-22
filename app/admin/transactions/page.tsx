'use client'
import { useEffect, useState, useCallback } from 'react'
import { toast } from '@/lib/toast'
import {
  Plus, TrendingUp, TrendingDown, Loader2, Trash2,
  RefreshCw, Download, Wallet, Upload, X
} from 'lucide-react'
import {
  transactionApi,
  exportApi,
  formatRupiah,
  MONTHS_ID,
  formatMoneyInput,
  sanitizeDigits,
  getApiImageUrl,
} from '@/lib/api'
import type { Transaction } from '@/lib/types'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AnimatedSelect from '@/components/ui/AnimatedSelect'
import DatePicker from '@/components/ui/DatePicker'
import FilterPanel from '@/components/ui/FilterPanel'
import Pagination from '@/components/ui/Pagination'
import ImagePreviewModal from '@/components/ui/ImagePreviewModal'
import { motion } from 'motion/react'
import Image from 'next/image'

const CATEGORIES = {
  INCOME: ['Donasi', 'Denda', 'Kontribusi Acara', 'Lainnya'],
  EXPENSE: ['Kebersihan', 'Keamanan', 'Perbaikan Fasilitas', 'Acara/Kegiatan', 'ATK', 'Lainnya'],
}

const YEAR_NOW = new Date().getFullYear()
const MONTH_NOW = new Date().getMonth() + 1
const TYPE_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: 'INCOME', label: 'Pemasukan' },
  { value: 'EXPENSE', label: 'Pengeluaran' },
]
const YEAR_OPTIONS = [YEAR_NOW - 3, YEAR_NOW - 2, YEAR_NOW - 1, YEAR_NOW]
  .filter((y) => y <= YEAR_NOW)
  .map((y) => ({ value: String(y), label: String(y) }))

function isFuture(year: number, month: number) {
  return year > YEAR_NOW || (year === YEAR_NOW && month > MONTH_NOW)
}

const PAGE_SIZE = 20

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportMonth, setExportMonth] = useState(String(MONTH_NOW))
  const [exportYear, setExportYear] = useState(String(YEAR_NOW))
  const [selectedDetail, setSelectedDetail] = useState<Transaction | null>(null)
  const [proofModal, setProofModal] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState({ incomeTotal: 0, expenseTotal: 0, net: 0 })
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; desc: string } | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  })

  const monthOptions = [
    { value: '', label: 'Semua' },
    ...MONTHS_ID.map((m, i) => {
      const month = i + 1
      const y = parseInt(filterYear) || YEAR_NOW
      return { value: String(month), label: m, future: isFuture(y, month) }
    })
      .filter((o) => !o.future)
      .map(({ value, label }) => ({ value, label })),
  ]

  const exportMonthOptions = [
    { value: '', label: 'Semua (tahunan)' },
    ...MONTHS_ID.map((m, i) => {
      const month = i + 1
      const y = parseInt(exportYear) || YEAR_NOW
      return { value: String(month), label: m, future: isFuture(y, month) }
    })
      .filter((o) => !o.future)
      .map(({ value, label }) => ({ value, label })),
  ]

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transactionApi.list({
        type: filterType || undefined,
        year: filterYear ? parseInt(filterYear) : undefined,
        month: filterMonth ? parseInt(filterMonth) : undefined,
        page,
        limit: PAGE_SIZE,
      })
      setTransactions(res.data.data)
      setSummary(res.data.summary)
      setMeta(res.data.meta)
    } finally {
      setLoading(false)
    }
  }, [filterType, filterYear, filterMonth, page])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  function onFilterType(v: string) {
    setFilterType(v)
    setPage(1)
  }
  function onFilterMonth(v: string) {
    setFilterMonth(v)
    setPage(1)
  }
  function onFilterYear(v: string) {
    setFilterYear(v)
    setPage(1)
  }

  function resetForm() {
    setForm({
      type: 'EXPENSE',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    })
    setProofFile(null)
    setProofPreview(null)
  }

  async function handleSave() {
    const normalizedAmount = sanitizeDigits(form.amount)
    if (!normalizedAmount || !form.description || !form.date) {
      toast.error('Nominal, keterangan, dan tanggal wajib diisi')
      return
    }

    setSaving(true)
    try {
      if (proofFile) {
        const fd = new FormData()
        fd.append('type', form.type)
        fd.append('amount', normalizedAmount)
        fd.append('description', form.description)
        if (form.category) fd.append('category', form.category)
        fd.append('date', form.date)
        fd.append('proofImage', proofFile)
        await transactionApi.createMultipart(fd)
      } else {
        await transactionApi.create({
          type: form.type,
          amount: parseInt(normalizedAmount),
          description: form.description,
          category: form.category || undefined,
          date: form.date,
        })
      }
      toast.success('Transaksi berhasil dicatat!')
      setShowAddModal(false)
      resetForm()
      loadTransactions()
    } catch {
      toast.error('Gagal mencatat transaksi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await transactionApi.delete(deleteTarget.id)
      toast.success('Transaksi dihapus')
      setDeleteTarget(null)
      loadTransactions()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  async function handleExport() {
    const y = parseInt(exportYear)
    const m = exportMonth ? parseInt(exportMonth) : undefined
    if (m ? isFuture(y, m) : y > YEAR_NOW) {
      toast.error('Tidak bisa export periode yang akan datang')
      return
    }
    try {
      await exportApi.transactions({ year: y, month: m })
      setShowExportModal(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || 'Gagal export')
    }
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h1 className="page-header text-[1.3rem] sm:text-[1.6rem] lg:text-[2rem]">Kas Masuk & Keluar</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Pemasukan dan pengeluaran selain IPL bulanan</p>
        </div>
        <div className="sm:ml-auto grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
          <button onClick={loadTransactions} className="btn-secondary justify-center min-h-10">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              setExportMonth(filterMonth)
              setExportYear(filterYear)
              setShowExportModal(true)
            }}
            className="btn-secondary text-sm justify-center min-h-10"
          >
            <Download size={15} />
            Export
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true) }} className="btn-primary text-sm justify-center min-h-10">
            <Plus size={15} />
            Tambah
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
        <div className="card text-center p-3 sm:p-5">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={16} className="text-green-600" />
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Pemasukan</p>
          <p className="font-bold text-[11px] sm:text-sm break-words leading-tight">{formatRupiah(summary.incomeTotal)}</p>
        </div>
        <div className="card text-center p-3 sm:p-5">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingDown size={16} className="text-red-600" />
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Pengeluaran</p>
          <p className="font-bold text-[11px] sm:text-sm break-words leading-tight">{formatRupiah(summary.expenseTotal)}</p>
        </div>
        <div className={`card text-center p-3 sm:p-5 ${summary.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${summary.net >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <Wallet size={16} className={summary.net >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mb-0.5">Saldo</p>
          <p className={`font-bold text-[11px] sm:text-sm break-words leading-tight ${summary.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatRupiah(Math.abs(summary.net))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel activeCount={(filterType ? 1 : 0) + (filterMonth ? 1 : 0)}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div>
            <label className="input-label">Tipe</label>
            <AnimatedSelect value={filterType} onChange={onFilterType} options={TYPE_OPTIONS} />
          </div>
          <div>
            <label className="input-label">Bulan</label>
            <AnimatedSelect value={filterMonth} onChange={onFilterMonth} options={monthOptions} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="input-label">Tahun</label>
            <AnimatedSelect value={filterYear} onChange={onFilterYear} options={YEAR_OPTIONS} />
          </div>
        </div>
      </FilterPanel>

      {/* Transaction List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p>Tidak ada transaksi</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm mt-3 mx-auto">
            <Plus size={15} /> Tambah Transaksi
          </button>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedDetail(t)}
                  className="w-full flex items-start sm:items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    t.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {t.type === 'INCOME'
                      ? <TrendingUp size={16} className="text-green-600" />
                      : <TrendingDown size={16} className="text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{t.description}</p>
                    <p className="text-[11px] sm:text-xs text-gray-400">
                      {t.category && `${t.category} · `}
                      {new Date(t.date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                      {' · '}{t.createdBy}
                    </p>
                  </div>
                  <p className={`font-semibold text-xs sm:text-sm flex-shrink-0 ${
                    t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatRupiah(t.amount)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-3 sm:px-4 pb-3">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Catat Transaksi"
        size="md"
      >
        <div className="p-5 space-y-4">
          {/* Type Toggle — layoutId pill slides between options */}
          <div>
            <label className="input-label">Tipe Transaksi</label>
            <div className="relative flex bg-gray-100 rounded-xl p-1">
              {([
                { value: 'INCOME', label: 'Pemasukan', icon: TrendingUp, activeBg: 'bg-green-600' },
                { value: 'EXPENSE', label: 'Pengeluaran', icon: TrendingDown, activeBg: 'bg-red-600' },
              ] as const).map(({ value, label, icon: Icon, activeBg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, type: value, category: '' })}
                  className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium z-10"
                >
                  {form.type === value && (
                    <motion.div
                      layoutId="type-pill"
                      className={`absolute inset-0 rounded-lg ${activeBg}`}
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-2 transition-colors duration-150 ${
                    form.type === value ? 'text-white' : 'text-slate-600'
                  }`}>
                    <Icon size={16} />
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Tanggal</label>
            <DatePicker
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="input-label">Nominal (Rp)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: formatMoneyInput(e.target.value) })}
              placeholder="Masukkan nominal"
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Keterangan</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Apa keterangan transaksi ini?"
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Kategori (opsional)</label>
            <AnimatedSelect
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              placeholder="-- Pilih kategori --"
              options={[
                { value: '', label: '-- Pilih kategori --' },
                ...CATEGORIES[form.type].map((cat) => ({ value: cat, label: cat })),
              ]}
            />
          </div>

          {form.type === 'EXPENSE' && (
            <div>
              <label className="input-label">Bukti (opsional)</label>
              {!proofPreview ? (
                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand-300">
                  <Upload size={18} className="text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500">Upload foto bukti</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      if (!f.type.startsWith('image/')) return toast.error('Harus gambar')
                      if (f.size > 5 * 1024 * 1024) return toast.error('Maks 5MB')
                      setProofFile(f)
                      setProofPreview(URL.createObjectURL(f))
                    }}
                  />
                </label>
              ) : (
                <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100">
                  <Image src={proofPreview} alt="Bukti" fill className="object-contain" />
                  <button
                    type="button"
                    onClick={() => { setProofFile(null); setProofPreview(null) }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 justify-center">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus transaksi?"
        message={deleteTarget ? `Hapus "${deleteTarget.desc}"?` : ''}
        confirmLabel="Hapus"
        variant="danger"
      />

      {/* Detail transaksi */}
      <Modal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title="Detail Transaksi"
        size="md"
      >
        {selectedDetail && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                selectedDetail.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {selectedDetail.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
              </span>
              <p className={`text-xl font-bold ${
                selectedDetail.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedDetail.type === 'INCOME' ? '+' : '-'}
                {formatRupiah(selectedDetail.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Keterangan</p>
              <p className="text-sm font-medium text-slate-900">{selectedDetail.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Tanggal transaksi</p>
                <p className="font-medium">
                  {new Date(selectedDetail.date).toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Dicatat</p>
                <p className="font-medium">
                  {new Date(selectedDetail.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              {selectedDetail.category && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Kategori</p>
                  <p className="font-medium">{selectedDetail.category}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Oleh</p>
                <p className="font-medium">{selectedDetail.createdBy}</p>
              </div>
            </div>
            {selectedDetail.proofImage && (
              <button
                type="button"
                onClick={() => setProofModal(getApiImageUrl(selectedDetail.proofImage))}
                className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
              >
                <Image src={getApiImageUrl(selectedDetail.proofImage)} alt="Bukti" fill className="object-contain p-2" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDeleteTarget({ id: selectedDetail.id, desc: selectedDetail.description })
                setSelectedDetail(null)
              }}
              className="btn-danger w-full justify-center text-sm"
            >
              <Trash2 size={15} />
              Hapus Transaksi
            </button>
          </div>
        )}
      </Modal>

      {/* Export periode */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Laporan Keuangan"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-500">
            Bulan opsional — pilih &quot;Semua (tahunan)&quot; untuk laporan setahun (.xlsx)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Bulan</label>
              <AnimatedSelect
                value={exportMonth}
                onChange={setExportMonth}
                options={exportMonthOptions}
              />
            </div>
            <div>
              <label className="input-label">Tahun</label>
              <AnimatedSelect
                value={exportYear}
                onChange={(y) => {
                  setExportYear(y)
                  if (exportMonth && isFuture(parseInt(y), parseInt(exportMonth))) {
                    setExportMonth('')
                  }
                }}
                options={YEAR_OPTIONS}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowExportModal(false)} className="btn-secondary flex-1 justify-center">
              Batal
            </button>
            <button type="button" onClick={handleExport} className="btn-primary flex-1 justify-center">
              <Download size={15} />
              Export
            </button>
          </div>
        </div>
      </Modal>

      <ImagePreviewModal src={proofModal} onClose={() => setProofModal(null)} title="Bukti Pengeluaran" />
    </div>
  )
}
