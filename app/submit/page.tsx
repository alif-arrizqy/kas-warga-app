'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/lib/toast'
import {
  ArrowLeft, Upload, CheckCircle, Loader2, AlertCircle,
  User, Wallet, X, Search,
} from 'lucide-react'
import {
  householdApi,
  paymentApi,
  settingApi,
  MONTHS_ID,
  formatMoneyInput,
  sanitizeDigits,
  formatRupiah,
} from '@/lib/api'
import type { Household } from '@/lib/types'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PoweredBy from '@/components/PoweredBy'
import { trackEvent } from '@/lib/analytics'
import { Suspense } from 'react'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR]

type PeriodKey = `${number}-${number}` // month-year

function SubmitForm() {
  const searchParams = useSearchParams()
  const [households, setHouseholds] = useState<Household[]>([])
  const [selectedHousehold, setSelectedHousehold] = useState('')
  const [selectedPeriods, setSelectedPeriods] = useState<Set<PeriodKey>>(new Set())
  const [year, setYear] = useState(CURRENT_YEAR)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [blockedPeriods, setBlockedPeriods] = useState<Set<PeriodKey>>(new Set())
  const [standardAmount, setStandardAmount] = useState(65000)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    householdApi.list({ active: true }).then((res) => setHouseholds(res.data.data)).catch(() => toast.error('Gagal memuat daftar KK'))
    settingApi.get().then((res) => {
      const v = parseInt(res.data.data?.ipl_amount || '65000')
      if (v > 0) setStandardAmount(v)
    }).catch(() => {})
  }, [])

  // Prefill from /tagihan
  useEffect(() => {
    const hh = searchParams.get('householdId')
    const months = searchParams.get('months')
    if (hh) setSelectedHousehold(hh)
    if (months) {
      const keys = months.split(',').filter(Boolean) as PeriodKey[]
      if (keys.length) {
        setSelectedPeriods(new Set(keys))
        const firstYear = parseInt(keys[0].split('-')[1])
        if (firstYear) setYear(firstYear)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedHousehold) {
      setBlockedPeriods(new Set())
      return
    }
    paymentApi.list({ householdId: selectedHousehold, year, limit: 100 }).then((res) => {
      const blocked = new Set<PeriodKey>()
      for (const p of res.data.data as { month: number; year: number; status: string }[]) {
        if (p.status !== 'REJECTED') blocked.add(`${p.month}-${p.year}`)
      }
      setBlockedPeriods(blocked)
      setSelectedPeriods((cur) => {
        const next = new Set<PeriodKey>()
        cur.forEach((k) => { if (!blocked.has(k)) next.add(k) })
        return next
      })
    }).catch(() => {})
  }, [selectedHousehold, year])

  const expectedAmount = selectedPeriods.size * standardAmount

  useEffect(() => {
    if (selectedPeriods.size > 0) {
      setAmount(formatMoneyInput(String(expectedAmount)))
    }
  }, [expectedAmount, selectedPeriods.size])

  function togglePeriod(month: number) {
    const key: PeriodKey = `${month}-${year}`
    if (blockedPeriods.has(key)) return
    setSelectedPeriods((cur) => {
      const next = new Set(cur)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('File harus berupa gambar')
    if (file.size > 5 * 1024 * 1024) return toast.error('Ukuran gambar maksimal 5MB')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function doSubmit() {
    if (!selectedHousehold || !imageFile || selectedPeriods.size === 0) return
    setSubmitting(true)
    setConfirmOpen(false)
    try {
      const items = Array.from(selectedPeriods).map((k) => {
        const [m, y] = k.split('-').map(Number)
        return { month: m, year: y }
      })
      const formData = new FormData()
      formData.append('householdId', selectedHousehold)
      formData.append('items', JSON.stringify(items))
      const normalizedAmount = sanitizeDigits(amount)
      if (normalizedAmount) formData.append('amount', normalizedAmount)
      if (notes) formData.append('notes', notes)
      formData.append('proofImage', imageFile)

      await paymentApi.submitBatch(formData)
      trackEvent('submit_payment', { month_count: items.length })
      setSubmitted(true)
      toast.success('Bukti bayar berhasil dikirim!')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
      toast.error(msg || 'Gagal mengirim bukti pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedHousehold) return toast.error('Pilih KK terlebih dahulu')
    if (selectedPeriods.size === 0) return toast.error('Pilih minimal satu bulan')
    if (!imageFile) return toast.error('Upload bukti transfer terlebih dahulu')

    const paid = parseInt(sanitizeDigits(amount) || '0') || expectedAmount
    if (paid !== expectedAmount) {
      setConfirmOpen(true)
      return
    }
    doSubmit()
  }

  const filteredHouseholds = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return households.filter(
      (hh) =>
        hh.name.toLowerCase().includes(q) ||
        `${hh.block}${hh.number}`.toLowerCase().includes(q) ||
        `blok ${hh.block}`.toLowerCase().includes(q)
    )
  }, [households, searchQuery])

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Bukti pembayaran IPL berhasil dikirim dan sedang menunggu verifikasi dari admin.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/" className="btn-primary justify-center">Lihat Dashboard</Link>
            <button
              onClick={() => {
                setSubmitted(false)
                setSelectedPeriods(new Set())
                setImageFile(null)
                setImagePreview(null)
                setAmount('')
                setNotes('')
              }}
              className="btn-secondary justify-center"
            >
              Upload Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-700" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">Bayar IPL</h1>
            <p className="text-xs text-gray-400">Bisa pilih beberapa bulan sekaligus</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 pb-12">
        <form onSubmit={handleSubmit} noValidate className="stagger-children space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <Upload size={16} className="text-brand-600" />
              Foto Bukti Transfer *
            </h2>
            {!imagePreview ? (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-all group"
              >
                <Upload size={20} className="text-gray-400 group-hover:text-brand-600 mb-2" />
                <p className="text-sm font-medium text-gray-700">Ketuk untuk upload foto</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG — Maks. 5MB</p>
                <input id="image-upload" ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            ) : (
              <div className="relative">
                <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100">
                  <Image src={imagePreview} alt="Bukti transfer" fill className="object-contain" />
                </div>
                <button type="button" onClick={removeImage} className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <User size={16} className="text-brand-600" />
              Identitas Warga *
            </h2>
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau blok..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50">
              {filteredHouseholds.map((hh) => (
                <button
                  key={hh.id}
                  type="button"
                  onClick={() => setSelectedHousehold(hh.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left border-b border-gray-100 last:border-0 ${
                    selectedHousehold === hh.id ? 'bg-brand-50' : 'hover:bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                    selectedHousehold === hh.id ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {hh.block}{hh.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{hh.name}</p>
                    <p className="text-xs text-gray-400">Blok {hh.block} No. {hh.number}</p>
                  </div>
                  {selectedHousehold === hh.id && <CheckCircle size={16} className="text-brand-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <Wallet size={16} className="text-brand-600" />
              Bulan & Nominal
            </h2>
            <div className="flex gap-2 mb-3">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                    year === y ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {MONTHS_ID.map((label, i) => {
                const month = i + 1
                const key: PeriodKey = `${month}-${year}`
                const blocked = blockedPeriods.has(key)
                const selected = selectedPeriods.has(key)
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={blocked}
                    onClick={() => togglePeriod(month)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                      blocked
                        ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                        : selected
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    {label.slice(0, 3)}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {selectedPeriods.size} bulan dipilih · standar {formatRupiah(expectedAmount)}
            </p>
            <div className="mb-3">
              <label className="input-label">Nominal Transfer (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Catatan — opsional</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: titip bayar 3 bulan"
                className="input-field text-sm"
              />
            </div>
          </div>

          {(!selectedHousehold || !imageFile || selectedPeriods.size === 0) && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">Lengkapi foto, KK, dan pilih minimal satu bulan</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedHousehold || !imageFile || selectedPeriods.size === 0}
            className="btn-primary w-full justify-center py-3.5 text-base"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {submitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
          </button>
        </form>
        <PoweredBy className="text-slate-400 mt-6" />
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
        title="Nominal berbeda"
        message={`Nominal transfer berbeda dari iuran standar ${formatRupiah(expectedAmount)}. Lanjutkan?`}
        confirmLabel="Tetap Kirim"
        variant="warning"
        loading={submitting}
      />
    </div>
  )
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>}>
      <SubmitForm />
    </Suspense>
  )
}
