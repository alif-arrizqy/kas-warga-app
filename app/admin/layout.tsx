'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  LogOut, Home, Settings, Menu, X, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/payments', icon: CreditCard, label: 'Pembayaran IPL' },
  { href: '/admin/transactions', icon: ArrowLeftRight, label: 'Kas Masuk/Keluar' },
  { href: '/admin/households', icon: Users, label: 'Data Warga' },
  { href: '/admin/settings', icon: Settings, label: 'Pengaturan' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [adminName, setAdminName] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') return
    const token = localStorage.getItem('kas_warga_token')
    if (!token) {
      router.replace('/admin/login')
      return
    }
    const adminRaw = localStorage.getItem('kas_warga_admin')
    if (adminRaw) {
      try {
        const parsed = JSON.parse(adminRaw)
        if (parsed?.name) setAdminName(parsed.name)
        else throw new Error('invalid')
      } catch {
        // Stored value corrupted — clear and force re-login
        localStorage.removeItem('kas_warga_token')
        localStorage.removeItem('kas_warga_admin')
        router.replace('/admin/login')
      }
    }
  }, [pathname, router])

  if (pathname === '/admin/login') return <>{children}</>

  function logout() {
    localStorage.removeItem('kas_warga_token')
    localStorage.removeItem('kas_warga_admin')
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-screen z-30">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Home size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">KasWarga</p>
              <p className="text-xs text-gray-400">Panel Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const { icon: Icon } = item
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-brand-700 font-bold text-xs">{adminName.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{adminName}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="btn-secondary flex-1 justify-center text-xs py-2">
              <Home size={14} />
              Publik
            </Link>
            <button onClick={logout} className="btn-danger flex-1 justify-center text-xs py-2">
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">KasWarga Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-xl hover:bg-gray-100">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="bg-black/50 absolute inset-0" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative bg-white w-72 h-full flex flex-col shadow-2xl">
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
                  <Home size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">KasWarga</p>
                  <p className="text-xs text-gray-400">Panel Admin</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const { icon: Icon } = item
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <Link href="/" className="btn-secondary flex-1 justify-center text-xs py-2" onClick={() => setMobileMenuOpen(false)}>
                <Home size={14} />
                Publik
              </Link>
              <button onClick={logout} className="btn-danger flex-1 justify-center text-xs py-2">
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
