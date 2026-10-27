const TOKEN_KEY = 'bl_token'
const USER_KEY = 'bl_user'

export interface StoredUser {
  id: number
  username: string
  family_member: string
  gender: string
}

export const auth = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  getUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  },
  save(token: string, user?: StoredUser) {
    localStorage.setItem(TOKEN_KEY, token)
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY))
  },
}
