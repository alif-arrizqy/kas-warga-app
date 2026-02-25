'use client'
import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  Plus, Search, Edit2, UserX, UserCheck, Download,
  RefreshCw, Loader2, Users, Phone
} from 'lucide-react'
import { householdApi, exportApi } from '@/lib/api'
import type { Household } from '@/lib/types'
import Modal from '@/components/ui/Modal'

export default function AdminHouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    block: '',
    number: '',
    phone: '',
  })

  const loadHouseholds = useCallback(async () => {
    setLoading(true)
    try {
      const res = await householdApi.list()
      setHouseholds(res.data.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHouseholds()
  }, [loadHouseholds])

  function openAdd() {
    setEditingHousehold(null)
    setForm({ name: '', block: '', number: '', phone: '' })
    setShowModal(true)
  }

  function openEdit(hh: Household) {
    setEditingHousehold(hh)
    setForm({ name: hh.name, block: hh.block, number: hh.number, phone: hh.phone || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name || !form.block || !form.number) {
      toast.error('Nama, blok, dan nomor rumah wajib diisi')
      return
    }

    setSaving(true)
    try {
      if (editingHousehold) {
        await householdApi.update(editingHousehold.id, form)
        toast.success('Data KK berhasil diperbarui')
      } else {
        await householdApi.create(form)
        toast.success('KK baru berhasil ditambahkan')
      }
      setShowModal(false)
      loadHouseholds()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(hh: Household) {
    const action = hh.isActive ? 'menonaktifkan' : 'mengaktifkan'
    if (!confirm(`Yakin ${action} KK ${hh.name}?`)) return

    try {
      await householdApi.update(hh.id, { isActive: !hh.isActive })
      toast.success(`KK ${hh.name} berhasil di${hh.isActive ? 'nonaktifkan' : 'aktifkan'}`)
      loadHouseholds()
    } catch {
      toast.error('Gagal mengubah status')
    }
  }

  const filtered = households.filter((hh) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      hh.name.toLowerCase().includes(q) ||
      `blok ${hh.block} no ${hh.number}`.toLowerCase().includes(q) ||
      `${hh.block}${hh.number}`.toLowerCase().includes(q)
    )
  })

  const activeCount = households.filter((hh) => hh.isActive).length

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div>
          <h1 className="page-header">Data Warga / KK</h1>
          <p className="text-gray-500 text-sm">
            {activeCount} KK aktif dari {households.length} total
          </p>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={loadHouseholds} className="btn-secondary">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => exportApi.households().catch(() => toast.error('Gagal export'))} className="btn-secondary text-sm">
            <Download size={15} />
            Export
          </button>
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus size={15} />
            Tambah KK
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, blok, atau nomor rumah..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center">
          <Users size={20} className="text-brand-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-xs text-gray-500">KK Aktif</p>
        </div>
        <div className="card text-center">
          <Users size={20} className="text-gray-400 mx-auto mb-1" />
          <p className="text-2xl font-bold">{households.length - activeCount}</p>
          <p className="text-xs text-gray-500">Tidak Aktif</p>
        </div>
        <div className="card text-center">
          <Users size={20} className="text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{households.length}</p>
          <p className="text-xs text-gray-500">Total KK</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((hh) => (
            <div
              key={hh.id}
              className={`card flex items-center gap-3 ${!hh.isActive ? 'opacity-60' : ''}`}
            >
              {/* Block badge */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                hh.isActive ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {hh.block}{hh.number}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {hh.name}
                  {!hh.isActive && <span className="ml-2 text-xs text-gray-400">(Tidak aktif)</span>}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  Blok {hh.block} No. {hh.number}
                  {hh.phone && (
                    <>
                      <span className="mx-1">·</span>
                      <Phone size={10} />
                      {hh.phone}
                    </>
                  )}
                  <span className="mx-1">·</span>
                  {hh._count?.payments ?? 0} pembayaran
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(hh)}
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => toggleActive(hh)}
                  className={`p-2 rounded-lg transition-colors ${
                    hh.isActive
                      ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                  }`}
                  title={hh.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {hh.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card text-center py-8 text-gray-400">
              Tidak ditemukan
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingHousehold ? 'Edit Data KK' : 'Tambah KK Baru'}
      >
        <div className="p-5 space-y-4">
          <div>
            <label className="input-label">Nama Kepala Keluarga *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nama lengkap KK"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Blok *</label>
              <input
                type="text"
                value={form.block}
                onChange={(e) => setForm({ ...form, block: e.target.value.toUpperCase() })}
                placeholder="A, B, C..."
                className="input-field"
                maxLength={3}
              />
            </div>
            <div>
              <label className="input-label">No. Rumah *</label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="1, 2, 15B..."
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="input-label">No. HP (opsional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08xx-xxxx-xxxx"
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
              Batal
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Menyimpan...' : editingHousehold ? 'Simpan Perubahan' : 'Tambah KK'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
