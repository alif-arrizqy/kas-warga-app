const TOKEN_KEY = 'kas_warga_token'
const ADMIN_KEY = 'kas_warga_admin'
const EXPIRES_KEY = 'kas_warga_token_exp'

export function clearAdminSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
  localStorage.removeItem(EXPIRES_KEY)
}

export function saveAdminSession(token: string, admin: object, expiresInSec = 12 * 3600) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresInSec * 1000))
}

/** true jika token ada dan belum lewat masa simpan lokal */
export function isSessionValid(): boolean {
  const token = localStorage.getItem(TOKEN_KEY)
  const exp = localStorage.getItem(EXPIRES_KEY)
  if (!token) return false
  if (exp && Date.now() > parseInt(exp)) {
    clearAdminSession()
    return false
  }
  return true
}

export function getStoredAdmin(): { name?: string; role?: string } | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
