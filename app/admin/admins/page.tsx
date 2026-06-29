'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Edit3, Plus, RefreshCw, ShieldAlert, Trash2, UserCog, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import { adminApi } from '@/lib/api'
import type { AdminAccount, AdminUser } from '@/lib/types'

type FormState = {
  username: string
  name: string
  password: string
}

const initialForm: FormState = { username: '', name: '', password: '' }

export default function AdminManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [admins, setAdmins] = useState<AdminAccount[]>([])
  const [form, setForm] = useState<FormState>(initialForm)

  const isEditMode = useMemo(() => Boolean(editingId), [editingId])

  useEffect(() => {
    const adminRaw = localStorage.getItem('kas_warga_admin')
    if (!adminRaw) {
      router.replace('/admin/login')
      return
    }

    try {
      const admin = JSON.parse(adminRaw) as AdminUser
      const allowedRole = admin.role === 'super-admin' || admin.role === 'superadmin' || admin.role === 'admin'
      if (!allowedRole) {
        toast.error('Anda tidak memiliki akses ke halaman ini')
        router.replace('/admin')
        return
      }
      void loadAdmins()
    } catch {
      router.replace('/admin/login')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function loadAdmins() {
    try {
      setLoading(true)
      const res = await adminApi.list()
      setAdmins(res.data.data as AdminAccount[])
    } catch {
      toast.error('Gagal memuat data admin')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
  }

  function startEdit(admin: AdminAccount) {
    setEditingId(admin.id)
    setForm({ username: admin.username, name: admin.name, password: '' })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.username.trim() || !form.name.trim()) {
      toast.error('Username dan nama wajib diisi')
      return
    }
    if (!isEditMode && form.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    if (isEditMode && form.password && form.password.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }

    try {
      setSubmitting(true)
      if (isEditMode && editingId) {
        const payload: Partial<FormState> = {
          username: form.username.trim(),
          name: form.name.trim(),
        }
        if (form.password) payload.password = form.password
        await adminApi.update(editingId, payload)
        toast.success('Admin berhasil diperbarui')
      } else {
        await adminApi.create({
          username: form.username.trim(),
          name: form.name.trim(),
          password: form.password,
        })
        toast.success('Admin berhasil ditambahkan')
      }
      resetForm()
      await loadAdmins()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menyimpan admin')
    } finally {
      setSubmitting(false)
    }
  }

  async function removeAdmin(id: string) {
    if (!window.confirm('Hapus admin ini?')) return
    try {
      await adminApi.delete(id)
      toast.success('Admin berhasil dihapus')
      await loadAdmins()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Gagal menghapus admin')
    }
  }

  return (
    <div className={`p-3 sm:p-4 lg:p-6 ${isEditMode ? 'pb-24 sm:pb-4' : ''}`}>
      <div className="card mb-5 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-teal-200">Admin Console</p>
            <h1 className="text-[1.35rem] sm:text-2xl lg:text-3xl font-extrabold mt-1">Manajemen Admin</h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-2">
              Kelola akun admin operasional. Akun super-admin disembunyikan dari daftar ini.
            </p>
          </div>
          <button
            onClick={loadAdmins}
            className="btn-secondary !bg-white/95 w-full sm:w-auto justify-center min-h-10 active:scale-[0.98]"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Reload
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1.6fr] gap-4 sm:gap-5">
        <form id="admin-management-form" onSubmit={onSubmit} className="card space-y-4 h-fit">
          <div className="flex items-center gap-2 text-slate-900">
            <UserCog size={18} />
            <h2 className="font-bold">{isEditMode ? 'Edit Admin' : 'Tambah Admin'}</h2>
          </div>

          <div>
            <label className="input-label">Username</label>
            <input
              className="input-field"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="username admin"
            />
          </div>

          <div>
            <label className="input-label">Nama</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="nama lengkap admin"
            />
          </div>

          <div>
            <label className="input-label">{isEditMode ? 'Password Baru (opsional)' : 'Password'}</label>
            <input
              className="input-field"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={isEditMode ? 'kosongkan jika tidak diubah' : 'minimal 6 karakter'}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center min-h-10 active:scale-[0.98]"
            >
              {isEditMode ? <Edit3 size={16} /> : <Plus size={16} />}
              {submitting ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Tambah Admin'}
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary justify-center min-h-10 active:scale-[0.98]"
              >
                <X size={16} />
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="card">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="font-bold text-slate-900">Daftar Admin Operasional</h2>
            <span className="text-xs font-semibold text-slate-500">{admins.length} akun</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-14 rounded-xl skeleton" />
              <div className="h-14 rounded-xl skeleton" />
            </div>
          ) : admins.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
              <ShieldAlert size={18} className="text-amber-700 mt-0.5" />
              <p className="text-sm text-amber-900">Belum ada admin operasional. Tambahkan admin pertama.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {admins.map((admin) => (
                <div key={admin.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-start sm:items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold">
                    {admin.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{admin.name}</p>
                    <p className="text-[11px] sm:text-xs text-slate-500">@{admin.username}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 ml-auto">
                    <button
                      className="btn-secondary !py-2 !px-3 justify-center min-h-9 active:scale-[0.98]"
                      onClick={() => startEdit(admin)}
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      className="btn-danger !py-2 !px-3 justify-center min-h-9 active:scale-[0.98]"
                      onClick={() => removeAdmin(admin.id)}
                    >
                      <Trash2 size={14} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-3 py-2.5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary flex-1 justify-center min-h-11 active:scale-[0.98]"
            >
              <X size={16} />
              Batal
            </button>
            <button
              type="submit"
              form="admin-management-form"
              disabled={submitting}
              className="btn-primary flex-1 justify-center min-h-11 active:scale-[0.98]"
            >
              <Edit3 size={16} />
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
