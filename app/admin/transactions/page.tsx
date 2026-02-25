'use client'
import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, TrendingUp, TrendingDown, Loader2, Trash2,
  RefreshCw, Download
} from 'lucide-react'
import { transactionApi, exportApi, formatRupiah, MONTHS_ID } from '@/lib/api'
import type { Transaction } from '@/lib/types'
import Modal from '@/components/ui/Modal'

const CATEGORIES = {
  INCOME: ['Donasi', 'Denda', 'Kontribusi Acara', 'Lainnya'],
  EXPENSE: ['Kebersihan', 'Keamanan', 'Perbaikan Fasilitas', 'Acara/Kegiatan', 'ATK', 'Lainnya'],
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState({ incomeTotal: 0, expenseTotal: 0, net: 0 })

  // Form state
  const [form, setForm] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  })

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transactionApi.list({
        type: filterType || undefined,
        year: filterYear ? parseInt(filterYear) : undefined,
        month: filterMonth ? parseInt(filterMonth) : undefined,
        limit: 100,
      })
      setTransactions(res.data.data)
      setSummary(res.data.summary)
    } finally {
      setLoading(false)
    }
  }, [filterType, filterYear, filterMonth])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  function resetForm() {
    setForm({
      type: 'EXPENSE',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    })
  }

  async function handleSave() {
    if (!form.amount || !form.description || !form.date) {
      toast.error('Nominal, keterangan, dan tanggal wajib diisi')
      return
    }

    setSaving(true)
    try {
      await transactionApi.create({
        type: form.type,
        amount: parseInt(form.amount),
        description: form.description,
        category: form.category || undefined,
        date: form.date,
      })
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

  async function handleDelete(id: string, desc: string) {
    if (!confirm(`Hapus transaksi "${desc}"?`)) return
    try {
      await transactionApi.delete(id)
      toast.success('Transaksi dihapus')
      loadTransactions()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const groupedByMonth: Record<string, Transaction[]> = {}
  transactions.forEach((t) => {
    const d = new Date(t.date)
    const key = `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
    if (!groupedByMonth[key]) groupedByMonth[key] = []
    groupedByMonth[key].push(t)
  })

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h1 className="page-header">Kas Masuk & Keluar</h1>
          <p className="text-gray-500 text-sm">Pemasukan dan pengeluaran selain IPL bulanan</p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={loadTransactions} className="btn-secondary">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => exportApi.transactions(parseInt(filterYear)).catch(() => toast.error('Gagal export'))} className="btn-secondary text-sm">
            <Download size={15} />
            Export
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true) }} className="btn-primary text-sm">
            <Plus size={15} />
            Tambah
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={16} className="text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Pemasukan</p>
          <p className="font-bold text-green-700 text-sm">{formatRupiah(summary.incomeTotal)}</p>
        </div>
        <div className="card text-center">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingDown size={16} className="text-red-600" />
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Pengeluaran</p>
          <p className="font-bold text-red-700 text-sm">{formatRupiah(summary.expenseTotal)}</p>
        </div>
        <div className={`card text-center ${summary.net >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-xs text-gray-500 mb-0.5 mt-5">Saldo</p>
          <p className={`font-bold text-sm ${summary.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatRupiah(Math.abs(summary.net))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="input-label">Tipe</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field text-sm">
              <option value="">Semua</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label className="input-label">Bulan</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="input-field text-sm">
              <option value="">Semua</option>
              {MONTHS_ID.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Tahun</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input-field text-sm">
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
        <div className="space-y-4">
          {Object.entries(groupedByMonth).map(([monthLabel, items]) => {
            const monthIncome = items.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
            const monthExpense = items.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
            return (
              <div key={monthLabel}>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-700 text-sm">{monthLabel}</h3>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-green-600">+{formatRupiah(monthIncome)}</span>
                  <span className="text-xs text-red-600">-{formatRupiah(monthExpense)}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className="card-hover flex items-center gap-3">
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
                        <p className="text-xs text-gray-400">
                          {t.category && `${t.category} · `}
                          {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          {' · '}{t.createdBy}
                        </p>
                      </div>
                      <p className={`font-semibold text-sm flex-shrink-0 ${
                        t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatRupiah(t.amount)}
                      </p>
                      <button
                        onClick={() => handleDelete(t.id, t.description)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
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
          {/* Type Toggle */}
          <div>
            <label className="input-label">Tipe Transaksi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'INCOME', category: '' })}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.type === 'INCOME'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <TrendingUp size={16} />
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'EXPENSE', category: '' })}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.type === 'EXPENSE'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <TrendingDown size={16} />
                Pengeluaran
              </button>
            </div>
          </div>

          <div>
            <label className="input-label">Tanggal</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Nominal (Rp)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Masukkan nominal"
              className="input-field"
              min="0"
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
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field text-sm"
            >
              <option value="">-- Pilih kategori --</option>
              {CATEGORIES[form.type].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

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
    </div>
  )
}
