import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
})

// Sisipkan JWT token di setiap request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('kas_warga_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — redirect ke login jika di halaman admin
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const { pathname } = window.location
      if (pathname.startsWith('/admin') && !pathname.endsWith('/login')) {
        localStorage.removeItem('kas_warga_token')
        localStorage.removeItem('kas_warga_admin')
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
  me: () => api.get('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/api/dashboard'),
  monthlySummary: (year?: number) =>
    api.get('/api/dashboard/monthly-summary', { params: { year } }),
}

// ─── Households ──────────────────────────────────────────────────────────────
export const householdApi = {
  list: (params?: { active?: boolean; search?: string }) =>
    api.get('/api/households', { params }),
  get: (id: string) => api.get(`/api/households/${id}`),
  create: (data: { name: string; block: string; number: string; phone?: string }) =>
    api.post('/api/households', data),
  update: (
    id: string,
    data: Partial<{ name: string; block: string; number: string; phone: string; isActive: boolean }>
  ) => api.put(`/api/households/${id}`, data),
  delete: (id: string) => api.delete(`/api/households/${id}`),
}

// ─── Payments ────────────────────────────────────────────────────────────────
export const paymentApi = {
  list: (params?: {
    month?: number
    year?: number
    status?: string
    householdId?: string
    page?: number
    limit?: number
  }) => api.get('/api/payments', { params }),
  get: (id: string) => api.get(`/api/payments/${id}`),
  submit: (formData: FormData) =>
    api.post('/api/payments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verify: (id: string, status: 'VERIFIED' | 'REJECTED', notes?: string) =>
    api.patch(`/api/payments/${id}/verify`, { status, notes }),
  delete: (id: string) => api.delete(`/api/payments/${id}`),
}

// ─── Transactions ────────────────────────────────────────────────────────────
export const transactionApi = {
  list: (params?: { type?: string; year?: number; month?: number; page?: number; limit?: number }) =>
    api.get('/api/transactions', { params }),
  create: (data: { type: string; amount: number; description: string; category?: string; date: string }) =>
    api.post('/api/transactions', data),
  update: (
    id: string,
    data: Partial<{ type: string; amount: number; description: string; category: string; date: string }>
  ) => api.put(`/api/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/api/transactions/${id}`),
}

// ─── Export (blob download — melewati auth header) ───────────────────────────
async function downloadBlob(url: string, filename: string) {
  const res = await api.get(url, { responseType: 'blob' })
  const href = URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
}

export const exportApi = {
  payments: (params?: { month?: number; year?: number }) => {
    const q = new URLSearchParams()
    if (params?.month) q.set('month', String(params.month))
    if (params?.year) q.set('year', String(params.year))
    const year = params?.year || new Date().getFullYear()
    const month = params?.month
    const filename = month ? `IPL_Bulan${month}_${year}.xlsx` : `IPL_Rekap_${year}.xlsx`
    return downloadBlob(`/api/export/payments?${q}`, filename)
  },
  transactions: (year?: number) => {
    const y = year || new Date().getFullYear()
    return downloadBlob(`/api/export/transactions?year=${y}`, `Keuangan_${y}.xlsx`)
  },
  households: () => downloadBlob('/api/export/households', 'Daftar_Warga.xlsx'),
}

// ─── Settings ────────────────────────────────────────────────────────────────
export const settingApi = {
  get: () => api.get('/api/settings'),
  update: (data: Record<string, string>) => api.put('/api/settings', data),
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const formatRupiah = (amount: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

export const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export const getApiImageUrl = (filePath: string | null | undefined): string => {
  if (!filePath) return ''
  if (filePath.startsWith('http')) return filePath
  return `${API_URL}${filePath}`
}
