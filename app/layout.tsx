import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/lib/toast'

export const metadata: Metadata = {
  title: 'KasWarga - IPL Pesona Kahuripan 6 Gang 6',
  description: 'Sistem pencatatan Iuran Pemeliharaan Lingkungan (IPL) Perumahan Pesona Kahuripan 6 Gang 6',
  icons: {
    icon: '/assets/image/mortgage.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
