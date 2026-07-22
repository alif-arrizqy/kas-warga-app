import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/lib/toast'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import AnalyticsRouteTracker from '@/components/AnalyticsRouteTracker'

export const metadata: Metadata = {
  title: 'KasWarga - IPL Pesona Kahuripan 6 Gang 6',
  description: 'Sistem pencatatan Iuran Pemeliharaan Lingkungan (IPL) Perumahan Pesona Kahuripan 6 Gang 6',
  icons: {
    icon: '/assets/image/mortgage.png',
  },
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

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
        {GA_ID ? (
          <>
            <GoogleAnalytics measurementId={GA_ID} />
            <AnalyticsRouteTracker />
          </>
        ) : null}
      </body>
    </html>
  )
}
