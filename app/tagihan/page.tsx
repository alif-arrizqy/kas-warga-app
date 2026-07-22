'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Loader2, Wallet } from 'lucide-react'
import { billsApi, householdApi, formatRupiah, MONTHS_ID } from '@/lib/api'
import type { BillsResult, BillStatus, Household } from '@/lib/types'
import { toast } from '@/lib/toast'
import PoweredBy from '@/components/PoweredBy'
import { trackEvent } from '@/lib/analytics'
import StatusBadge from '@/components/StatusBadge'
import HouseholdBlockPicker from '@/components/HouseholdBlockPicker'

function statusLabel(s: BillStatus) {
  if (s === 'UNPAID') return 'Belum Lunas'
  if (s === 'PENDING') return 'Menunggu'
  if (s === 'VERIFIED') return 'Lunas'
  return 'Ditolak'
}

export default function TagihanPage() {
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
    if (!block || !number) {
      toast.error('Pilih blok rumah dan nomor rumah')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await billsApi.lookup({ block, number })
      setResult(res.data.data)
      trackEvent('cek_tagihan')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || 'Data tidak ditemukan')
    } finally {
      setLoading(false)
    }
  }

  const unpaid = result?.bills.filter((b) => b.status === 'UNPAID' || b.status === 'REJECTED') ?? []
  const payHref = result
    ? `/submit?householdId=${result.household.id}&months=${unpaid.map((b) => `${b.month}-${b.year}`).join(',')}`
    : '/submit'

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white px-4 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-brand-200 text-sm mb-4 hover:text-white">
            <ArrowLeft size={16} /> Beranda
          </Link>
          <h1 className="text-2xl font-bold">Cek Tagihan IPL</h1>
          <p className="text-brand-200 text-sm mt-1">Pilih blok rumah dan nomor rumah</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-16 space-y-4">
        <form onSubmit={handleSearch} noValidate className="card space-y-3">
          <HouseholdBlockPicker
            households={households}
            block={block}
            number={number}
            onBlockChange={setBlock}
            onNumberChange={setNumber}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center min-h-11">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Mencari...' : 'Cari Tagihan'}
          </button>
        </form>

        {result && (
          <div className="space-y-3 animate-fade-in">
            <div className="card">
              <p className="font-semibold text-gray-900">{result.household.name}</p>
              <p className="text-sm text-slate-500">
                Blok {result.household.block} No. {result.household.number}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Iuran standar: {formatRupiah(result.standardAmount)}/bulan
              </p>
            </div>

            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Wallet size={16} className="text-brand-600" />
                <p className="text-sm font-semibold">12 bulan terakhir</p>
              </div>
              <ul className="divide-y divide-slate-100 max-h-[min(420px,55vh)] overflow-y-auto">
                {result.bills.map((b) => (
                  <li key={`${b.year}-${b.month}`} className="px-4 py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {MONTHS_ID[b.month - 1]} {b.year}
                      </p>
                      <p className="text-xs text-slate-500">{formatRupiah(b.amount)}</p>
                    </div>
                    {b.status === 'UNPAID' ? (
                      <span className="badge-rejected">{statusLabel(b.status)}</span>
                    ) : b.status === 'PENDING' ? (
                      <StatusBadge status="PENDING" />
                    ) : b.status === 'VERIFIED' ? (
                      <StatusBadge status="VERIFIED" />
                    ) : (
                      <StatusBadge status="REJECTED" />
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {unpaid.length > 0 && (
              <Link href={payHref} className="btn-primary w-full justify-center min-h-11">
                Bayar {unpaid.length} Tagihan
              </Link>
            )}
          </div>
        )}

        <PoweredBy className="text-slate-400 pt-4" />
      </div>
    </div>
  )
}
