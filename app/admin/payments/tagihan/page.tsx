'use client'
import { useEffect, useState } from 'react'
import { Search, Loader2, Wallet } from 'lucide-react'
import { billsApi, householdApi, formatRupiah, MONTHS_ID } from '@/lib/api'
import type { BillsResult, BillStatus, Household } from '@/lib/types'
import { toast } from '@/lib/toast'
import StatusBadge from '@/components/StatusBadge'
import HouseholdBlockPicker from '@/components/HouseholdBlockPicker'

function statusLabel(s: BillStatus) {
  if (s === 'UNPAID') return 'Belum Lunas'
  if (s === 'PENDING') return 'Menunggu'
  if (s === 'VERIFIED') return 'Lunas'
  return 'Ditolak'
}

export default function AdminTagihanPage() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [block, setBlock] = useState('')
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BillsResult | null>(null)

  useEffect(() => {
    householdApi.list({ active: true }).then((res) => setHouseholds(res.data.data)).catch(() => {})
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!block || !number) return toast.error('Pilih blok rumah dan nomor rumah')
    setLoading(true)
    setResult(null)
    try {
      const res = await billsApi.lookup({ block, number })
      setResult(res.data.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || 'Data tidak ditemukan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="page-header text-[1.3rem] sm:text-[1.6rem] lg:text-[2rem]">Cek Tagihan IPL</h1>
        <p className="text-slate-500 text-xs sm:text-sm">Pilih warga dari data yang tersimpan</p>
      </div>

      <form onSubmit={handleSearch} noValidate className="card mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <HouseholdBlockPicker
            className="flex-1 min-w-0 w-full sm:max-w-2xl"
            households={households}
            block={block}
            number={number}
            onBlockChange={setBlock}
            onNumberChange={setNumber}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full sm:w-auto sm:min-w-[148px] justify-center min-h-10 shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Mencari...' : 'Cari Tagihan'}
          </button>
        </div>
      </form>

      {!result ? (
        <div className="card flex flex-col items-center justify-center py-16 text-slate-400 min-h-[200px]">
          <Wallet size={32} className="mb-3 opacity-40" />
          <p className="text-sm">Pilih blok rumah lalu cari tagihan</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900 text-lg">{result.household.name}</p>
              <p className="text-sm text-slate-500">
                Blok {result.household.block} No. {result.household.number}
              </p>
            </div>
            <p className="text-sm font-medium text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg">
              {formatRupiah(result.standardAmount)}/bulan
            </p>
          </div>

          <div className="card p-0 overflow-hidden flex flex-col max-h-[min(560px,70vh)]">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
              <Wallet size={16} className="text-brand-600" />
              <p className="text-sm font-semibold">12 bulan terakhir</p>
            </div>
            <ul className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {result.bills.map((b) => (
                <li
                  key={`${b.year}-${b.month}`}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {MONTHS_ID[b.month - 1]} {b.year}
                    </p>
                    <p className="text-xs text-slate-500">{formatRupiah(b.amount)}</p>
                  </div>
                  {b.status === 'UNPAID' ? (
                    <span className="badge-rejected">{statusLabel(b.status)}</span>
                  ) : (
                    <StatusBadge status={b.status as 'PENDING' | 'VERIFIED' | 'REJECTED'} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
