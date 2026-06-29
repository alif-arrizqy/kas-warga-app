'use client'
import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'
import { Settings, Save, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { settingApi, authApi, formatMoneyInput, formatPhoneInput, isValidPhone, sanitizeDigits } from '@/lib/api'

interface SettingsData {
  neighborhood_name: string
  ipl_amount: string
  payment_due_day: string
  treasurer_name: string
  treasurer_phone: string
  bank_name: string
  bank_account: string
  bank_account_name: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    neighborhood_name: '',
    ipl_amount: '',
    payment_due_day: '10',
    treasurer_name: '',
    treasurer_phone: '',
    bank_name: '',
    bank_account: '',
    bank_account_name: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await settingApi.get()
      setSettings({ ...settings, ...res.data.data })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (settings.treasurer_phone && !isValidPhone(settings.treasurer_phone)) {
      toast.error('No. HP bendahara harus 11–13 digit angka')
      return
    }
    setSaving(true)
    try {
      await settingApi.update({
        ...settings,
        ipl_amount: sanitizeDigits(settings.ipl_amount),
      })
      toast.success('Pengaturan berhasil disimpan!')
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field password wajib diisi')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Password baru tidak sama')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setChangingPassword(true)
    try {
      await authApi.changePassword(currentPassword, newPassword)
      toast.success('Password berhasil diubah!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Password saat ini salah')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return (
    <div className="p-6 flex justify-center">
      <Loader2 size={32} className="animate-spin text-brand-600" />
    </div>
  )

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="page-header flex items-center gap-2">
          <Settings size={22} />
          Pengaturan
        </h1>
        <p className="text-gray-500 text-sm">Konfigurasi aplikasi KasWarga</p>
      </div>

      <div className="space-y-5">
        <div className="grid lg:grid-cols-2 gap-5 items-start">
          {/* General Settings */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Informasi Perumahan</h2>
            <div className="space-y-4">
              <div>
                <label className="input-label">Nama Perumahan</label>
                <input
                  type="text"
                  value={settings.neighborhood_name}
                  onChange={(e) => setSettings({ ...settings, neighborhood_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Iuran IPL per Bulan (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={settings.ipl_amount}
                    onChange={(e) => setSettings({ ...settings, ipl_amount: formatMoneyInput(e.target.value) })}
                    className="input-field"
                    placeholder="15.000"
                  />
                </div>
                <div>
                  <label className="input-label">Tanggal Jatuh Tempo</label>
                  <input
                    type="number"
                    value={settings.payment_due_day}
                    onChange={(e) => setSettings({ ...settings, payment_due_day: e.target.value })}
                    className="input-field"
                    placeholder="10"
                    min="1"
                    max="28"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Treasurer Info */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Info Bendahara / Humas</h2>
            <div className="space-y-4">
              <div>
                <label className="input-label">Nama Bendahara</label>
                <input
                  type="text"
                  value={settings.treasurer_name}
                  onChange={(e) => setSettings({ ...settings, treasurer_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label">No. HP Bendahara</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={settings.treasurer_phone}
                  onChange={(e) => setSettings({ ...settings, treasurer_phone: formatPhoneInput(e.target.value) })}
                  className="input-field"
                  placeholder="62891-1234-1234"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Rekening Bank Transfer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Nama Bank</label>
              <input
                type="text"
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                className="input-field"
                placeholder="BRI, BCA, Mandiri, dll"
              />
            </div>
            <div>
              <label className="input-label">Nomor Rekening</label>
              <input
                type="text"
                inputMode="numeric"
                value={settings.bank_account}
                onChange={(e) => setSettings({ ...settings, bank_account: sanitizeDigits(e.target.value) })}
                className="input-field"
                placeholder="Nomor rekening (angka)"
              />
            </div>
            <div>
              <label className="input-label">Nama Pemilik Rekening</label>
              <input
                type="text"
                value={settings.bank_account_name}
                onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>

        {/* Change Password */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock size={18} />
            Ganti Password Admin
          </h2>
          <div className="space-y-3">
            <div>
              <label className="input-label">Password Saat Ini</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="input-label">Password Baru</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
                placeholder="Min. 6 karakter"
              />
            </div>
            <div>
              <label className="input-label">Konfirmasi Password Baru</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Ulangi password baru"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="btn-secondary w-full justify-center"
            >
              {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {changingPassword ? 'Mengubah...' : 'Ganti Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
