import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetchJson, apiPostJson } from '../api/client'
import type { AuthUser, LoginResponse } from '../api/types'
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  setAuthSession,
} from '../utils/authStorage'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isOperator: boolean
  isLoading: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearAuthSession()
    setUser(null)
  }, [])

  const verifySession = useCallback(async () => {
    const token = getStoredToken()
    const storedUser = getStoredUser()
    if (!token || !storedUser) {
      clearAuthSession()
      setUser(null)
      return
    }

    try {
      const data = await apiFetchJson<{ user: AuthUser }>('/auth/me')
      setUser(data.user)
      // Re-read token after the call: it may have been silently refreshed by the API client.
      setAuthSession(getStoredToken() ?? token, data.user)
    } catch {
      clearAuthSession()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    void verifySession().finally(() => setIsLoading(false))
  }, [verifySession])

  useEffect(() => {
    const onExpired = () => {
      clearAuthSession()
      setUser(null)
    }
    window.addEventListener('auth:session-expired', onExpired)
    return () => window.removeEventListener('auth:session-expired', onExpired)
  }, [])

  const login = useCallback(async (login: string, password: string) => {
    const data = await apiPostJson<LoginResponse>('/auth/login', {
      login: login.trim(),
      password,
    })
    setAuthSession(data.token, data.user, data.refreshToken)
    setUser(data.user)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user && getStoredToken()),
      isAdmin: user?.role === 'admin',
      isOperator: user?.role === 'operator',
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
