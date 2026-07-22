'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckSquare } from 'lucide-react'
import { toast } from '@/lib/toast'
import { householdApi, paymentApi, MONTHS_ID, formatRupiah, settingApi } from '@/lib/api'
import type { Household, Payment } from '@/lib/types'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import AnimatedSelect from '@/components/ui/AnimatedSelect'

const YEAR_NOW = new Date().getFullYear()
const YEAR_OPTIONS = [YEAR_NOW - 1, YEAR_NOW - 2, YEAR_NOW - 3, YEAR_NOW - 4].map((y) => ({
  value: String(y),
  label: String(y),
}))

export default function AdminPaymentsRecapPage() {
  const [year, setYear] = useState(String(YEAR_NOW - 1))
  const [households, setHouseholds] = useState<Household[]>([])
  const [selectedHh, setSelectedHh] = useState<Set<string>>(new Set())
  const [checks, setChecks] = useState<Set<string>>(new Set()) // householdId-month
  const [saved, setSaved] = useState<Set<string>>(new Set()) // already VERIFIED
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [standardAmount, setStandardAmount] = useState(65000)
  const [blockFilter, setBlockFilter] = useState('')

  const loadSaved = useCallback(async (y: number) => {
    try {
      const res = await paymentApi.list({ year: y, status: 'VERIFIED', limit: 100 })
      // may need pagination if >100 — ponytail: fine for gang scale
      const keys = new Set<string>()
      for (const p of res.data.data as Payment[]) {
        keys.add(`${p.householdId}-${p.month}`)
      }
      // also fetch PENDING so they can't double-submit
      const pending = await paymentApi.list({ year: y, status: 'PENDING', limit: 100 })
      for (const p of pending.data.data as Payment[]) {
        keys.add(`${p.householdId}-${p.month}`)
      }
      setSaved(keys)
      setChecks((cur) => {
        const next = new Set<string>()
        cur.forEach((k) => { if (!keys.has(k)) next.add(k) })
        return next
      })
    } catch {
      setSaved(new Set())
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [hh, settings] = await Promise.all([
        householdApi.list({ active: true }),
        settingApi.get(),
      ])
      setHouseholds(hh.data.data)
      const amt = parseInt(settings.data.data?.ipl_amount || '65000')
      if (amt > 0) setStandardAmount(amt)
      await loadSaved(parseInt(year))
    } finally {
      setLoading(false)
    }
  }, [year, loadSaved])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    loadSaved(parseInt(year))
  }, [year, loadSaved])

  const blocks = Array.from(new Set(households.map((h) => h.block))).sort()
  const visible = households.filter((h) => !blockFilter || h.block === blockFilter)

  function toggleHh(id: string) {
    setSelectedHh((cur) => {
      const next = new Set(cur)
      if (next.has(id)) {
        next.delete(id)
        setChecks((c) => {
          const n = new Set(c)
          for (let m = 1; m <= 12; m++) n.delete(`${id}-${m}`)
          return n
        })
      } else next.add(id)
      return next
    })
  }

  function toggleMonth(hhId: string, month: number) {
    if (!selectedHh.has(hhId)) return
    const key = `${hhId}-${month}`
    if (saved.has(key)) return
    setChecks((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function submit() {
    const items = Array.from(checks)
      .filter((k) => !saved.has(k))
      .map((k) => {
        const [householdId, month] = k.split('-')
        return { householdId, month: parseInt(month), amount: standardAmount }
      })
    if (items.length === 0) return toast.error('Centang minimal satu bulan baru')
    setSaving(true)
    setConfirmOpen(false)
    try {
      const res = await paymentApi.backfill({ year: parseInt(year), items })
      toast.success(res.data.message || 'Rekap berhasil')
      setChecks(new Set())
      await loadSaved(parseInt(year))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || 'Gagal menyimpan rekap')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/payments" className="p-2 rounded-xl hover:bg-slate-100">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-header text-[1.3rem] sm:text-[1.6rem]">Rekap IPL Tahun Lalu</h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Tandai bulan yang sudah dibayar · {formatRupiah(standardAmount)}/bulan
          </p>
        </div>
      </div>

      <div className="card mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Tahun</label>
          <AnimatedSelect value={year} onChange={setYear} options={YEAR_OPTIONS} />
        </div>
        <div>
          <label className="input-label">Filter Blok</label>
          <AnimatedSelect
            value={blockFilter}
            onChange={setBlockFilter}
            options={[{ value: '', label: 'Semua' }, ...blocks.map((b) => ({ value: b, label: `Blok ${b}` }))]}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-600" /></div>
      ) : (
        <div className="space-y-3">
          {visible.map((hh) => {
            const selected = selectedHh.has(hh.id)
            return (
              <div key={hh.id} className={`card ${selected ? 'border-brand-200' : ''}`}>
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleHh(hh.id)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{hh.name}</p>
                    <p className="text-xs text-slate-500">Blok {hh.block} No. {hh.number}</p>
                  </div>
                </label>
                {selected && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {MONTHS_ID.map((label, i) => {
                      const month = i + 1
                      const key = `${hh.id}-${month}`
                      const already = saved.has(key)
                      const checked = checks.has(key)
                      return (
                        <button
                          key={month}
                          type="button"
                          disabled={already}
                          onClick={() => toggleMonth(hh.id, month)}
                          className={`py-2 rounded-lg text-[11px] font-semibold border ${
                            already
                              ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                              : checked
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                          title={already ? 'Sudah tersimpan' : label}
                        >
                          {label.slice(0, 3)}
                          {already ? ' ✓' : ''}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="sticky bottom-4 mt-6">
        <button
          type="button"
          disabled={saving || checks.size === 0}
          onClick={() => setConfirmOpen(true)}
          className="btn-primary w-full justify-center min-h-12 shadow-lg"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckSquare size={18} />}
          Simpan {checks.size} Pembayaran
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="Simpan rekap?"
        message={`${checks.size} bulan akan ditandai lunas untuk tahun ${year} dan masuk ke Kas Masuk.`}
        confirmLabel="Simpan Rekap"
        loading={saving}
      />
    </div>
  )
}
