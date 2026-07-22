// Google Analytics 4 — fire-and-forget. No-op without NEXT_PUBLIC_GA_MEASUREMENT_ID.

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function canTrack(): boolean {
  return typeof window !== 'undefined' && !!MEASUREMENT_ID
}

export function trackPageView(path: string): void {
  try {
    if (!canTrack() || typeof window.gtag !== 'function') return
    if (path.startsWith('/admin')) return
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title,
    })
  } catch {
    /* silent */
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  try {
    if (!canTrack() || typeof window.gtag !== 'function') return
    window.gtag('event', name, params ?? {})
  } catch {
    /* silent */
  }
}

export function getGaMeasurementId(): string | undefined {
  return MEASUREMENT_ID || undefined
}
