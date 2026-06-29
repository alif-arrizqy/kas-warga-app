'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Home, Users, Wallet, TrendingUp, TrendingDown, CheckCircle,
  Clock, AlertCircle, ArrowRight, Plus, RefreshCw, Calendar
} from 'lucide-react'
import { dashboardApi, formatRupiah, MONTHS_ID } from '@/lib/api'
import type { DashboardData } from '@/lib/types'
import AnimatedCounter from '@/components/AnimatedCounter'
import StatusBadge from '@/components/StatusBadge'
import { motion, AnimatePresence } from 'motion/react'

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUnpaid, setShowUnpaid] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      const res = await dashboardApi.get()
      setData(res.data.data)
    } catch {
      // fallback silently
    } finally {
      setLoading(false)
    }
  }

  const paidPercent = data
    ? Math.round((data.summary.currentMonthPaidCount / (data.summary.activeHouseholds || 1)) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Memuat data...</p>
        </div>
      </div>
    )
  }

  const neighborhoodName = data?.settings?.neighborhood_name || 'Pesona Kahuripan 6 Gang 6'
  const currentMonth = data?.summary.currentMonth || new Date().getMonth() + 1
  const currentYear = data?.summary.currentYear || new Date().getFullYear()

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white animate-fade-in">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Home size={20} />
            </div>
            <div>
              <p className="text-brand-200 text-xs font-medium uppercase tracking-wider">KasWarga</p>
              <h1 className="text-xl font-bold leading-tight">{neighborhoodName}</h1>
            </div>
          </div>

          {/* Total Kas - Main Highlight */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <p className="text-brand-200 text-sm mb-1">Total Kas Keseluruhan</p>
            <div className="text-4xl font-extrabold tracking-tight">
              <AnimatedCounter
                value={data?.summary.totalKas || 0}
                prefix="Rp "
                formatter={(v) => v.toLocaleString('id-ID')}
              />
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-brand-200">
              <span className="flex items-center gap-1">
                <TrendingUp size={14} />
                Masuk: {formatRupiah((data?.summary.totalIPLVerified || 0) + (data?.summary.totalIncome || 0))}
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown size={14} />
                Keluar: {formatRupiah(data?.summary.totalExpense || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-28">
        {/* Stats Cards */}
        <div className="stagger-children grid grid-cols-2 gap-3 mb-5">
          {/* Bulan Ini Card */}
          <div className="col-span-2 card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {MONTHS_ID[currentMonth - 1]} {currentYear}
                </p>
                <p className="text-gray-700 text-sm font-medium mt-0.5">Iuran Terkumpul</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2.5 py-1.5 rounded-full font-medium">
                <Calendar size={12} />
                Jatuh tempo tgl {data?.settings?.payment_due_day || '10'}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatRupiah(data?.summary.currentMonthTotal || 0)}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span>
                <span className="font-semibold text-brand-600">{data?.summary.currentMonthPaidCount || 0}</span>
                {' '}dari{' '}
                <span className="font-semibold">{data?.summary.activeHouseholds || 0} KK</span>
                {' '}sudah bayar
              </span>
              <span className="font-semibold text-brand-600">{paidPercent}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-1000"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>

          {/* Total KK */}
          <div className="card flex flex-col">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <Users size={18} className="text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mb-1">Total KK</p>
            <p className="text-2xl font-bold text-gray-900">
              <AnimatedCounter value={data?.summary.activeHouseholds || 0} />
            </p>
            <p className="text-xs text-gray-400 mt-1">Kepala Keluarga</p>
          </div>

          {/* Belum Bayar */}
          <div
            className={`card flex flex-col cursor-pointer transition-all ${data?.summary.unpaidCount ? 'border-red-200 bg-red-50/50' : ''}`}
            onClick={() => setShowUnpaid(!showUnpaid)}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${data?.summary.unpaidCount ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertCircle size={18} className={data?.summary.unpaidCount ? 'text-red-600' : 'text-gray-400'} />
            </div>
            <p className="text-xs text-gray-500 mb-1">Belum Bayar</p>
            <p className={`text-2xl font-bold ${data?.summary.unpaidCount ? 'text-red-600' : 'text-gray-900'}`}>
              <AnimatedCounter value={data?.summary.unpaidCount || 0} />
            </p>
            <p className="text-xs text-gray-400 mt-1">KK bulan ini</p>
          </div>
        </div>

        {/* Daftar Belum Bayar (expandable) */}
        <AnimatePresence>
          {showUnpaid && data?.unpaidHouseholds && data.unpaidHouseholds.length > 0 && (
            <motion.div
              className="card mb-5 overflow-hidden"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
            >
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                Belum Bayar Bulan Ini
              </h3>
              <div className="space-y-2">
                {data.unpaidHouseholds.map((hh) => (
                  <div key={hh.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{hh.name}</p>
                      <p className="text-xs text-gray-400">Blok {hh.block} No. {hh.number}</p>
                    </div>
                    <span className="badge-rejected">Belum Bayar</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pembayaran Bulan Ini */}
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Pembayaran Bulan Ini</h2>
            <span className="text-xs text-gray-400">{data?.currentMonthPayments?.length || 0} transaksi</span>
          </div>
          {data?.currentMonthPayments?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Wallet size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Belum ada pembayaran bulan ini</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.currentMonthPayments?.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center text-brand-700 font-bold text-sm">
                      {p.block}{p.number}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 leading-tight">{p.householdName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(p.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatRupiah(p.amount)}</p>
                    <StatusBadge status={p.status as 'VERIFIED' | 'PENDING' | 'REJECTED'} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaksi Terakhir */}
        {data?.recentTransactions && data.recentTransactions.length > 0 && (
          <div className="card mb-5">
            <h2 className="section-title mb-4">Transaksi Terakhir</h2>
            <div className="space-y-2">
              {data.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {t.type === 'INCOME'
                      ? <TrendingUp size={16} className="text-green-600" />
                      : <TrendingDown size={16} className="text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                    <p className="text-xs text-gray-400">
                      {t.category && `${t.category} · `}
                      {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatRupiah(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 mb-5 flex items-start gap-3">
          <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900">Pembayaran IPL</p>
            <p className="text-xs text-brand-700 mt-0.5">
              Iuran dibayarkan paling lambat tanggal{' '}
              <strong>{data?.settings?.payment_due_day || '10'}</strong> setiap bulan.
              {data?.settings?.bank_name && (
                <> Transfer ke {data.settings.bank_name} a.n. {data.settings.bank_account_name} — {data.settings.bank_account}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Nav / CTA — pb-safe handles iOS home indicator */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 pt-3 pb-safe"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={loadDashboard}
            className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw size={18} />
          </button>
          <Link href="/submit" className="btn-primary flex-1 justify-center text-sm min-h-[44px]">
            <Plus size={18} />
            Upload Bukti Bayar IPL
          </Link>
        </div>
      </div>
    </div>
  )
}
