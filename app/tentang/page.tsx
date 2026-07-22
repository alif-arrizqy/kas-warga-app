'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, ExternalLink, Search, Upload, Wallet } from 'lucide-react'
import PoweredBy from '@/components/PoweredBy'
import {
  INSPIRALABS_DESCRIPTION,
  INSPIRALABS_SERVICES,
  INSPIRALABS_TAGLINE,
  INSPIRALABS_URL,
} from '@/lib/inspiralabs'
import { trackEvent } from '@/lib/analytics'

export default function TentangPage() {
  useEffect(() => {
    trackEvent('view_tentang')
  }, [])

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white px-4 pt-10 pb-10">
        <div className="max-w-lg mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-brand-200 text-sm mb-4 hover:text-white">
            <ArrowLeft size={16} /> Beranda
          </Link>
          <p className="text-brand-200 text-xs font-medium uppercase tracking-wider mb-1">KasWarga</p>
          <h1 className="text-2xl font-bold text-balance">Transparansi Kas Perumahan</h1>
          <p className="text-brand-100 text-sm mt-2 leading-relaxed">
            Cek tagihan IPL, upload bukti bayar, dan pantau kas warga secara real-time.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-16 space-y-5">
        <section className="card space-y-4">
          <h2 className="section-title text-base">Apa yang bisa dilakukan</h2>
          <ul className="space-y-3">
            {[
              { icon: Search, text: 'Cek tagihan IPL per blok & nomor rumah' },
              { icon: Upload, text: 'Bayar multi-bulan dengan upload bukti transfer' },
              { icon: Wallet, text: 'Pantau saldo kas, pemasukan, dan pengeluaran' },
              { icon: CheckCircle, text: 'Verifikasi admin untuk keamanan data' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-brand-700" />
                </div>
                <p className="text-sm text-slate-700 pt-2">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-3">
          <h2 className="section-title text-base">Cara kerja</h2>
          <ol className="space-y-2 text-sm text-slate-700">
            <li><span className="font-semibold text-brand-800">1.</span> Cek tagihan di halaman Tagihan</li>
            <li><span className="font-semibold text-brand-800">2.</span> Transfer & upload bukti bayar</li>
            <li><span className="font-semibold text-brand-800">3.</span> Admin verifikasi — kas terupdate</li>
          </ol>
          <div className="flex gap-2 pt-1">
            <Link href="/tagihan" className="btn-outline flex-1 justify-center text-sm min-h-10">Cek Tagihan</Link>
            <Link href="/submit" className="btn-primary flex-1 justify-center text-sm min-h-10">Bayar IPL</Link>
          </div>
        </section>

        <section className="card space-y-3 border-brand-100 bg-brand-50/40">
          <p className="text-xs font-medium text-brand-700 uppercase tracking-wide">Dikembangkan oleh</p>
          <div className="flex items-center gap-3">
            <Image
              src="/inspiralabs-logo.webp"
              alt="InspiraLabs"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-contain bg-white border border-brand-100 p-1"
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900">InspiraLabs</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{INSPIRALABS_TAGLINE}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed text-pretty">{INSPIRALABS_DESCRIPTION}</p>
          <ul className="text-sm text-slate-700 space-y-1">
            {INSPIRALABS_SERVICES.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                {s}
              </li>
            ))}
          </ul>
          <a
            href={INSPIRALABS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full justify-center min-h-11 mt-2"
            onClick={() => trackEvent('click_inspiralabs', { source: 'tentang_cta' })}
          >
            Kunjungi InspiraLabs
            <ExternalLink size={16} />
          </a>
        </section>

        <PoweredBy className="text-slate-400" />
      </div>
    </div>
  )
}
