import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, onSessionRejected, setAuthToken } from '../api'
import type { AuthUser } from '../api'

// The signed-in user. Only the session token and the public user fields are kept in
// localStorage; there is no password. Storage can be blocked, so every access is guarded
// and the app still works for the current tab without it.
const KEY = 'strawberry-fields.session'

interface Stored {
  token: string
  user: AuthUser
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Partial<Stored>
    if (typeof s.token === 'string' && typeof s.user?.id === 'string') return s as Stored
  } catch {
    // unreadable or blocked: start signed out
  }
  return null
}

function writeStored(s: Stored | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    // storage blocked: the session just will not survive a reload
  }
}

interface AuthContextValue {
  user: AuthUser | null
  /** Rejects with a readable message when the username is refused or the server is down. */
  login: (username: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Stored | null>(() => {
    const stored = readStored()
    setAuthToken(stored?.token ?? null) // before any child fetches
    return stored
  })

  const clear = useCallback(() => {
    setAuthToken(null)
    writeStored(null)
    setSession(null)
  }, [])

  const login = useCallback(async (username: string) => {
    const result = await api.login(username.trim().toLowerCase())
    setAuthToken(result.token)
    writeStored(result)
    setSession(result)
  }, [])

  const logout = useCallback(() => {
    api.logout().catch(() => {}) // best effort; the local session ends either way
    clear()
  }, [clear])

  // The server forgets sessions when it restarts: drop the stale one instead of failing forever.
  useEffect(() => {
    onSessionRejected(clear)
  }, [clear])

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, login, logout }),
    [session, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
