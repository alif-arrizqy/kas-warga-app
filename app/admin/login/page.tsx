'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { Lock, User, Eye, EyeOff, Loader2, Home } from 'lucide-react'
import { authApi } from '@/lib/api'
import { clearAdminSession, saveAdminSession } from '@/lib/auth-session'
import PoweredBy from '@/components/PoweredBy'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('kas_warga_token')
    if (!token) return
    authApi.me()
      .then(() => router.replace('/admin'))
      .catch(() => clearAdminSession())
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) {
      toast.error('Username dan password wajib diisi')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      const { token, admin, expiresIn } = res.data.data
      saveAdminSession(token, admin, expiresIn || 12 * 3600)
      toast.success(`Selamat datang, ${admin.name}!`)
      router.push('/admin')
    } catch {
      toast.error('Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-800 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">KasWarga Admin</h1>
          <p className="text-brand-300 text-sm mt-1">Pesona Kahuripan 6 Gang 6</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Login Admin</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="input-label">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="input-field pl-10"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-brand-400 text-xs mt-5">
          Hanya untuk admin / humas perumahan
        </p>

        <PoweredBy className="text-brand-400/80 mt-3" />
      </div>
    </div>
  )
}
