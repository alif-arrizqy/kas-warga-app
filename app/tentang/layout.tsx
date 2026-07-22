import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tentang KasWarga | InspiraLabs',
  description:
    'KasWarga — transparansi kas perumahan. Dikembangkan oleh InspiraLabs untuk komunitas dan UMKM.',
}

export default function TentangLayout({ children }: { children: React.ReactNode }) {
  return children
}
