import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { toast } from 'sonner'

import { login as loginRequest, logout as logoutRequest, register as registerRequest } from '@/lib/api/auth'
import type { LoginInput, RegisterInput, Session } from '@/lib/contracts/auth'
import { isApiError, onUnauthorized } from '@/lib/http'
import { sessionTokenStorage } from '@/lib/storage'

import { hasStoredSession, sessionKeys, useSessionQuery } from './queries'

interface AuthContextValue {
  session: Session | null
  user: Session['user'] | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (input: LoginInput) => Promise<Session>
  register: (input: RegisterInput) => Promise<Session>
  logout: () => Promise<void>
  isMutating: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const sessionQuery = useSessionQuery()
  const session = sessionQuery.data ?? null
  const isLoading = hasStoredSession() && sessionQuery.isLoading

  const establishSession = useCallback(
    (nextSession: Session) => {
      sessionTokenStorage.set(nextSession.token)
      queryClient.setQueryData(sessionKeys.current, nextSession)
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
        queryClient.invalidateQueries({ queryKey: ['favorites'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['account'] }),
        queryClient.invalidateQueries({ queryKey: ['catalog'] }),
        queryClient.invalidateQueries({ queryKey: ['wallets'] }),
      ])
    },
    [queryClient],
  )

  const clearSession = useCallback(() => {
    sessionTokenStorage.clear()
    queryClient.clear()
  }, [queryClient])

  const login = useCallback(
    async (input: LoginInput) => {
      const nextSession = await loginRequest(input)
      establishSession(nextSession)
      return nextSession
    },
    [establishSession],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const nextSession = await registerRequest(input)
      establishSession(nextSession)
      return nextSession
    },
    [establishSession],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Mesmo com falha no servidor, a sessão local é encerrada.
    } finally {
      clearSession()
      toast.success('Você saiu da sua conta.')
    }
  }, [clearSession])

  useEffect(() => {
    onUnauthorized((error) => {
      if (error.code !== 'SESSION_EXPIRED') return

      clearSession()
      const current = `${window.location.pathname}${window.location.search}`
      if (window.location.pathname === '/login') return

      window.location.assign(
        `/login?redirect=${encodeURIComponent(current)}&reason=session-expired`,
      )
    })

    return () => onUnauthorized(null)
  }, [clearSession])

  useEffect(() => {
    if (sessionQuery.error && isApiError(sessionQuery.error)) {
      if (sessionQuery.error.status === 401) {
        sessionTokenStorage.clear()
      }
    }
  }, [sessionQuery.error])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      login,
      register,
      logout,
      isMutating: false,
    }),
    [session, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return context
}
